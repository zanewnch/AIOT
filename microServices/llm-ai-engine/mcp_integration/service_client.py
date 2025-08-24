"""
MCP Service Client - 實際的微服務間通訊
處理與各個微服務的 HTTP/gRPC 通信，執行 MCP 工具調用
"""

import httpx
import grpc
import logging
import asyncio
import hashlib
import time
from typing import Dict, List, Any, Optional
from datetime import datetime

from database.postgres_connection import postgres_manager
from database.redis_connection import redis_manager

logger = logging.getLogger(__name__)

class MCPServiceClient:
    """MCP 服務客戶端 - 負責與各微服務通信"""
    
    def __init__(self):
        self.http_client: Optional[httpx.AsyncClient] = None
        self.service_endpoints = {
            'general-service': {
                'http_url': 'http://aiot-general-service:3053',
                'grpc_host': 'aiot-general-service',
                'grpc_port': 50053
            },
            'rbac-service': {
                'http_url': 'http://aiot-rbac-service:3051', 
                'grpc_host': 'aiot-rbac-service',
                'grpc_port': 50051
            },
            'drone-service': {
                'http_url': 'http://aiot-drone-service:3052',
                'grpc_host': 'aiot-drone-service', 
                'grpc_port': 50052
            }
        }
        
    async def initialize(self):
        """初始化 HTTP 客戶端"""
        self.http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10)
        )
        logger.info("MCP Service Client initialized")
    
    async def close(self):
        """關閉客戶端連接"""
        if self.http_client:
            await self.http_client.aclose()
        
    def _generate_args_hash(self, arguments: Dict[str, Any]) -> str:
        """生成參數哈希用於緩存"""
        args_str = str(sorted(arguments.items()))
        return hashlib.md5(args_str.encode()).hexdigest()[:16]
    
    async def _check_cache(self, tool_name: str, args_hash: str) -> Optional[Dict[str, Any]]:
        """檢查 Redis 緩存"""
        try:
            cached_result = await redis_manager.get_cached_mcp_result(tool_name, args_hash)
            if cached_result:
                logger.info(f"Cache hit for {tool_name}")
                return cached_result
        except Exception as e:
            logger.warning(f"Cache check failed for {tool_name}: {e}")
        return None
    
    async def _cache_result(
        self, 
        tool_name: str, 
        args_hash: str, 
        result: Dict[str, Any],
        ttl: int = 900  # 15分鐘
    ):
        """緩存結果到 Redis"""
        try:
            await redis_manager.cache_mcp_result(tool_name, args_hash, result, ttl)
        except Exception as e:
            logger.warning(f"Failed to cache result for {tool_name}: {e}")
    
    async def call_service_tool(
        self,
        service_name: str,
        tool_name: str,
        arguments: Dict[str, Any],
        user_id: str,
        conversation_id: Optional[str] = None,
        message_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        調用微服務的 MCP 工具
        
        Args:
            service_name: 服務名稱 (如 'general-service')
            tool_name: 工具名稱 (如 'get_user_preferences')  
            arguments: 工具參數
            user_id: 用戶ID
            conversation_id: 對話ID (可選)
            message_id: 消息ID (可選)
            
        Returns:
            工具執行結果
        """
        start_time = time.time()
        args_hash = self._generate_args_hash(arguments)
        
        # 檢查緩存
        cached_result = await self._check_cache(tool_name, args_hash)
        if cached_result:
            await self._log_tool_call(
                conversation_id, message_id, user_id, tool_name, service_name,
                arguments, cached_result, True, None, int((time.time() - start_time) * 1000)
            )
            return {
                'success': True,
                'result': cached_result,
                'cached': True,
                'service': service_name,
                'tool': tool_name
            }
        
        try:
            # 根據工具名稱選擇調用方式
            if tool_name.startswith('get_') or tool_name.startswith('check_'):
                # 查詢類工具使用 HTTP GET 或 gRPC
                result = await self._call_via_grpc(service_name, tool_name, arguments)
            else:
                # 操作類工具使用 HTTP POST
                result = await self._call_via_http(service_name, tool_name, arguments)
            
            execution_time = int((time.time() - start_time) * 1000)
            
            # 緩存成功結果
            if result.get('success'):
                await self._cache_result(tool_name, args_hash, result)
            
            # 記錄到資料庫
            await self._log_tool_call(
                conversation_id, message_id, user_id, tool_name, service_name,
                arguments, result, result.get('success', False), 
                result.get('error'), execution_time
            )
            
            return {
                'success': result.get('success', False),
                'result': result,
                'cached': False,
                'service': service_name,
                'tool': tool_name,
                'execution_time_ms': execution_time
            }
            
        except Exception as e:
            execution_time = int((time.time() - start_time) * 1000)
            error_msg = str(e)
            
            logger.error(f"Failed to call {tool_name} on {service_name}: {error_msg}")
            
            # 記錄失敗的調用
            await self._log_tool_call(
                conversation_id, message_id, user_id, tool_name, service_name,
                arguments, {}, False, error_msg, execution_time
            )
            
            return {
                'success': False,
                'error': error_msg,
                'service': service_name,
                'tool': tool_name,
                'execution_time_ms': execution_time
            }
    
    async def _call_via_http(
        self, 
        service_name: str, 
        tool_name: str, 
        arguments: Dict[str, Any]
    ) -> Dict[str, Any]:
        """通過 HTTP API 調用微服務工具"""
        service_config = self.service_endpoints.get(service_name)
        if not service_config:
            raise ValueError(f"Unknown service: {service_name}")
        
        url = f"{service_config['http_url']}/api/mcp/tools/{tool_name}"
        
        try:
            response = await self.http_client.post(
                url,
                json=arguments,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.debug(f"HTTP call successful: {tool_name} on {service_name}")
                return result
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                logger.error(f"HTTP call failed: {error_msg}")
                return {'success': False, 'error': error_msg}
                
        except httpx.TimeoutException:
            error_msg = f"HTTP timeout calling {tool_name} on {service_name}"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg}
        except Exception as e:
            error_msg = f"HTTP call exception: {str(e)}"
            logger.error(error_msg) 
            return {'success': False, 'error': error_msg}
    
    async def _call_via_grpc(
        self, 
        service_name: str, 
        tool_name: str, 
        arguments: Dict[str, Any]
    ) -> Dict[str, Any]:
        """通過 gRPC 調用微服務工具"""
        service_config = self.service_endpoints.get(service_name)
        if not service_config:
            raise ValueError(f"Unknown service: {service_name}")
        
        try:
            # 創建 gRPC 通道
            channel = grpc.aio.insecure_channel(
                f"{service_config['grpc_host']}:{service_config['grpc_port']}"
            )
            
            # 根據服務類型創建相應的 stub
            if service_name == 'general-service':
                result = await self._call_general_service_grpc(channel, tool_name, arguments)
            elif service_name == 'rbac-service':
                result = await self._call_rbac_service_grpc(channel, tool_name, arguments)
            elif service_name == 'drone-service':
                result = await self._call_drone_service_grpc(channel, tool_name, arguments)
            else:
                raise ValueError(f"gRPC not implemented for {service_name}")
            
            await channel.close()
            logger.debug(f"gRPC call successful: {tool_name} on {service_name}")
            return result
            
        except grpc.RpcError as e:
            error_msg = f"gRPC error: {e.code()} - {e.details()}"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg}
        except Exception as e:
            error_msg = f"gRPC call exception: {str(e)}"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg}
    
    async def _call_general_service_grpc(
        self, 
        channel, 
        tool_name: str, 
        arguments: Dict[str, Any]
    ) -> Dict[str, Any]:
        """調用 General Service 的 gRPC 方法"""
        # TODO: 實現 General Service 的 gRPC 調用
        # 這裡需要導入生成的 gRPC stub 並調用相應方法
        
        # 暫時返回模擬結果，實際實現需要真正的 gRPC 調用
        if tool_name == 'get_user_preferences':
            user_id = arguments.get('userId')
            if user_id:
                return {
                    'success': True,
                    'data': {
                        'userId': user_id,
                        'theme': 'light',
                        'language': 'zh-TW',
                        'timezone': 'Asia/Taipei',
                        'notifications': {
                            'email': True,
                            'sms': False,
                            'push': True
                        }
                    }
                }
        
        return {'success': False, 'error': 'Tool not implemented'}
    
    async def _call_rbac_service_grpc(
        self, 
        channel, 
        tool_name: str, 
        arguments: Dict[str, Any]
    ) -> Dict[str, Any]:
        """調用 RBAC Service 的 gRPC 方法"""
        # TODO: 實現 RBAC Service 的 gRPC 調用
        return {'success': False, 'error': 'RBAC gRPC not implemented yet'}
    
    async def _call_drone_service_grpc(
        self, 
        channel, 
        tool_name: str, 
        arguments: Dict[str, Any]
    ) -> Dict[str, Any]:
        """調用 Drone Service 的 gRPC 方法"""  
        # TODO: 實現 Drone Service 的 gRPC 調用
        return {'success': False, 'error': 'Drone gRPC not implemented yet'}
    
    async def _log_tool_call(
        self,
        conversation_id: Optional[str],
        message_id: Optional[str], 
        user_id: str,
        tool_name: str,
        service_name: str,
        arguments: Dict[str, Any],
        result: Dict[str, Any],
        success: bool,
        error_message: Optional[str],
        execution_time_ms: int
    ):
        """記錄工具調用到資料庫"""
        try:
            await postgres_manager.log_mcp_tool_call(
                conversation_id=conversation_id,
                message_id=message_id,
                user_id=user_id,
                tool_name=tool_name,
                service_name=service_name,
                arguments=arguments,
                result=result,
                success=success,
                error_message=error_message,
                execution_time_ms=execution_time_ms
            )
        except Exception as e:
            logger.error(f"Failed to log tool call: {e}")
    
    # ===============================================
    # 服務健康檢查
    # ===============================================
    
    async def check_service_health(self, service_name: str) -> Dict[str, Any]:
        """檢查微服務健康狀態"""
        service_config = self.service_endpoints.get(service_name)
        if not service_config:
            return {'healthy': False, 'error': f'Unknown service: {service_name}'}
        
        try:
            # HTTP 健康檢查
            response = await self.http_client.get(
                f"{service_config['http_url']}/health",
                timeout=5.0
            )
            
            if response.status_code == 200:
                return {
                    'healthy': True,
                    'service': service_name,
                    'response_time_ms': int(response.elapsed.total_seconds() * 1000),
                    'details': response.json()
                }
            else:
                return {
                    'healthy': False,
                    'service': service_name,
                    'error': f'HTTP {response.status_code}'
                }
                
        except Exception as e:
            return {
                'healthy': False,
                'service': service_name, 
                'error': str(e)
            }
    
    async def check_all_services_health(self) -> Dict[str, Dict[str, Any]]:
        """檢查所有微服務健康狀態"""
        health_checks = {}
        
        for service_name in self.service_endpoints.keys():
            health_checks[service_name] = await self.check_service_health(service_name)
        
        return health_checks
    
    # ===============================================
    # 工具發現和管理
    # ===============================================
    
    async def discover_service_tools(self, service_name: str) -> List[Dict[str, Any]]:
        """發現微服務提供的工具"""
        service_config = self.service_endpoints.get(service_name)
        if not service_config:
            return []
        
        try:
            response = await self.http_client.get(
                f"{service_config['http_url']}/api/mcp/tools",
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('tools', [])
            else:
                logger.error(f"Failed to discover tools for {service_name}: HTTP {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Tool discovery failed for {service_name}: {e}")
            return []
    
    async def discover_all_tools(self) -> Dict[str, List[Dict[str, Any]]]:
        """發現所有微服務的工具"""
        all_tools = {}
        
        for service_name in self.service_endpoints.keys():
            tools = await self.discover_service_tools(service_name)
            all_tools[service_name] = tools
        
        return all_tools

# 全域實例
mcp_service_client = MCPServiceClient()