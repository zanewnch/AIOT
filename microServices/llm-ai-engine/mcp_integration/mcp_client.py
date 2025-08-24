"""
MCP Client Integration for AIOT LLM AI Engine
將 MCP 工具整合到 FastAPI AI Engine，實現自然語言操作微服務
"""

import json
import asyncio
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from fastapi import HTTPException

from .service_client import mcp_service_client
from database.postgres_connection import postgres_manager
from database.redis_connection import redis_manager

class MCPToolCall(BaseModel):
    """MCP 工具調用請求"""
    name: str
    arguments: Dict[str, Any]

class MCPToolResult(BaseModel):
    """MCP 工具執行結果"""
    content: List[Dict[str, str]]
    isError: bool = False

class MCPServiceRegistry:
    """MCP 服務註冊中心"""
    
    def __init__(self):
        self.services: Dict[str, Dict[str, Any]] = {}
        self.tools: Dict[str, str] = {}  # tool_name -> service_name mapping
    
    def register_service(self, service_name: str, service_url: str, tools: List[Dict[str, Any]]):
        """註冊 MCP 服務"""
        self.services[service_name] = {
            'url': service_url,
            'tools': {tool['name']: tool for tool in tools}
        }
        
        # 更新工具映射
        for tool in tools:
            self.tools[tool['name']] = service_name
    
    def get_available_tools(self) -> List[Dict[str, Any]]:
        """獲取所有可用的工具列表"""
        all_tools = []
        for service_name, service_info in self.services.items():
            for tool_name, tool_info in service_info['tools'].items():
                tool_copy = tool_info.copy()
                tool_copy['service'] = service_name
                all_tools.append(tool_copy)
        return all_tools
    
    def find_tool(self, tool_name: str) -> Optional[Dict[str, Any]]:
        """查找特定工具"""
        service_name = self.tools.get(tool_name)
        if not service_name:
            return None
            
        service_info = self.services.get(service_name)
        if not service_info:
            return None
            
        tool_info = service_info['tools'].get(tool_name)
        if tool_info:
            tool_info = tool_info.copy()
            tool_info['service'] = service_name
            tool_info['service_url'] = service_info['url']
            
        return tool_info

class NaturalLanguageQueryProcessor:
    """自然語言查詢處理器"""
    
    def __init__(self, llm_model, mcp_registry: MCPServiceRegistry):
        self.llm_model = llm_model
        self.mcp_registry = mcp_registry
    
    async def process_query(self, user_query: str, use_conversation: bool = False, user_id: str = "unknown", conversation_id: Optional[str] = None) -> Dict[str, Any]:
        """
        處理自然語言查詢，轉換為 MCP 工具調用
        
        Args:
            user_query: 用戶的自然語言查詢
            use_conversation: 是否使用對話記憶
            
        Returns:
            處理結果
        """
        try:
            # 1. 取得可用工具列表
            available_tools = self.mcp_registry.get_available_tools()
            
            # 2. 構建系統提示，包含工具描述
            tools_description = self._build_tools_description(available_tools)
            
            system_prompt = f"""
你是 AIOT 系統的智能助手。你可以使用以下工具來幫助用戶操作系統：

{tools_description}

請分析用戶的自然語言請求，選擇合適的工具並提供正確的參數。
如果需要調用工具，請以 JSON 格式回應，包含 'tool_call' 欄位。
如果不需要調用工具，請直接回應用戶。

格式範例：
{{
  "tool_call": {{
    "name": "工具名稱",
    "arguments": {{
      "參數名": "參數值"
    }}
  }}
}}
"""

            # 3. 使用 LLM 分析查詢
            if use_conversation:
                # 使用對話模式
                prompt = f"{system_prompt}\n\n用戶查詢：{user_query}"
                llm_response = await self._call_llm_conversational(prompt)
            else:
                # 使用單次生成模式
                llm_response = await self._call_llm_generate(system_prompt + f"\n\n用戶查詢：{user_query}")
            
            # 4. 解析 LLM 回應
            response = llm_response.get('response', '')
            
            # 5. 檢查是否需要工具調用
            tool_call_result = self._parse_tool_call(response)
            if tool_call_result:
                # 執行工具調用
                tool_result = await self._execute_tool_call(
                    tool_call_result, 
                    user_id=user_id, 
                    conversation_id=conversation_id
                )
                
                # 將工具結果整合到最終回應
                final_response = await self._generate_final_response(user_query, tool_result)
                
                return {
                    "success": True,
                    "response": final_response,
                    "tool_used": tool_call_result['name'],
                    "tool_result": tool_result
                }
            else:
                # 直接回應，無需工具調用
                return {
                    "success": True,
                    "response": response
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"處理查詢時發生錯誤：{str(e)}"
            }
    
    def _build_tools_description(self, tools: List[Dict[str, Any]]) -> str:
        """構建工具描述文本"""
        descriptions = []
        
        for tool in tools:
            service = tool.get('service', 'unknown')
            name = tool.get('name', '')
            desc = tool.get('description', '')
            
            # 構建參數描述
            schema = tool.get('inputSchema', {})
            properties = schema.get('properties', {})
            required = schema.get('required', [])
            
            params_desc = []
            for param_name, param_info in properties.items():
                param_type = param_info.get('type', 'string')
                param_desc = param_info.get('description', '')
                is_required = param_name in required
                
                params_desc.append(f"  - {param_name} ({param_type}{'，必填' if is_required else '，選填'}): {param_desc}")
            
            tool_desc = f"""
### {name} ({service} 服務)
**功能**: {desc}
**參數**:
{chr(10).join(params_desc) if params_desc else '  無需參數'}
"""
            descriptions.append(tool_desc)
        
        return "\n".join(descriptions)
    
    def _parse_tool_call(self, response: str) -> Optional[Dict[str, Any]]:
        """解析 LLM 回應中的工具調用"""
        try:
            # 嘗試解析 JSON
            if 'tool_call' in response:
                # 提取 JSON 部分
                import re
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                    data = json.loads(json_str)
                    return data.get('tool_call')
            return None
        except:
            return None
    
    async def _execute_tool_call(self, tool_call: Dict[str, Any], user_id: str = "unknown", conversation_id: Optional[str] = None, message_id: Optional[str] = None) -> Dict[str, Any]:
        """執行工具調用"""
        tool_name = tool_call.get('name')
        arguments = tool_call.get('arguments', {})
        
        # 查找工具資訊
        tool_info = self.mcp_registry.find_tool(tool_name)
        if not tool_info:
            raise HTTPException(status_code=404, detail=f"工具 '{tool_name}' 不存在")
        
        service_name = tool_info.get('service')
        if not service_name:
            raise HTTPException(status_code=500, detail=f"工具 '{tool_name}' 的服務未配置")
        
        # 調用真實的微服務
        try:
            result = await mcp_service_client.call_service_tool(
                service_name=service_name,
                tool_name=tool_name,
                arguments=arguments,
                user_id=user_id,
                conversation_id=conversation_id,
                message_id=message_id
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Tool execution failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "tool_name": tool_name,
                "arguments": arguments
            }
    
    async def _generate_final_response(self, user_query: str, tool_result: Dict[str, Any]) -> str:
        """根據工具執行結果生成最終回應"""
        result_summary = tool_result.get('result', '執行完成')
        
        prompt = f"""
用戶查詢：{user_query}
工具執行結果：{result_summary}

請根據執行結果，用自然語言向用戶報告操作結果。要友善、清楚並且有用。
"""
        
        llm_response = await self._call_llm_generate(prompt)
        return llm_response.get('response', result_summary)
    
    async def _call_llm_generate(self, prompt: str) -> Dict[str, Any]:
        """調用 LLM 生成回應"""
        # 這裡調用現有的 LLM 服務
        # 暫時返回模擬回應
        return {
            "success": True,
            "response": f"LLM 處理結果：{prompt[:100]}..."
        }
    
    async def _call_llm_conversational(self, prompt: str) -> Dict[str, Any]:
        """調用 LLM 對話模式"""
        # 這裡調用現有的對話式 LLM 服務
        return await self._call_llm_generate(prompt)

# 全域 MCP 註冊中心實例
mcp_registry = MCPServiceRegistry()

def initialize_mcp_services():
    """初始化 MCP 服務"""
    
    # 註冊 General Service MCP 工具
    general_service_tools = [
        {
            "name": "get_user_preferences",
            "description": "獲取用戶偏好設定。支援多種查詢方式：按用戶ID、主題、搜尋關鍵字等",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "userId": {"type": "string", "description": "用戶ID"},
                    "theme": {"type": "string", "description": "主題名稱"},
                    "searchQuery": {"type": "string", "description": "搜尋關鍵字"}
                }
            }
        },
        {
            "name": "update_user_preference", 
            "description": "更新用戶偏好設定",
            "inputSchema": {
                "type": "object",
                "required": ["userId"],
                "properties": {
                    "userId": {"type": "string", "description": "用戶ID"},
                    "updates": {"type": "object", "description": "要更新的設定"}
                }
            }
        },
        {
            "name": "create_user_preference",
            "description": "為用戶創建新的偏好設定", 
            "inputSchema": {
                "type": "object",
                "required": ["userId"],
                "properties": {
                    "userId": {"type": "string", "description": "用戶ID"},
                    "theme": {"type": "string", "description": "主題設定"},
                    "language": {"type": "string", "description": "語言設定"}
                }
            }
        }
    ]
    
    # 註冊 RBAC Service MCP 工具
    rbac_service_tools = [
        {
            "name": "get_user_info",
            "description": "獲取用戶基本資料，包括用戶名、郵箱、狀態等資訊",
            "inputSchema": {
                "type": "object",
                "required": ["userId"],
                "properties": {
                    "userId": {"type": "string", "description": "用戶ID，必填參數"},
                    "includeRoles": {"type": "boolean", "description": "是否包含用戶角色資訊"}
                }
            }
        },
        {
            "name": "list_users",
            "description": "列出系統中的用戶，支援分頁和篩選條件",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "page": {"type": "number", "description": "頁碼，從 1 開始"},
                    "limit": {"type": "number", "description": "每頁數量"},
                    "status": {"type": "string", "description": "用戶狀態篩選"},
                    "searchKeyword": {"type": "string", "description": "搜尋關鍵字"}
                }
            }
        },
        {
            "name": "get_user_roles",
            "description": "獲取指定用戶的所有角色列表",
            "inputSchema": {
                "type": "object",
                "required": ["userId"],
                "properties": {
                    "userId": {"type": "string", "description": "用戶ID"}
                }
            }
        },
        {
            "name": "get_user_permissions",
            "description": "獲取用戶的所有權限，包括直接權限和通過角色繼承的權限",
            "inputSchema": {
                "type": "object",
                "required": ["userId"],
                "properties": {
                    "userId": {"type": "string", "description": "用戶ID"},
                    "includeInherited": {"type": "boolean", "description": "是否包含從角色繼承的權限"}
                }
            }
        },
        {
            "name": "list_roles",
            "description": "列出系統中的所有角色，支援分頁和篩選",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "page": {"type": "number", "description": "頁碼"},
                    "limit": {"type": "number", "description": "每頁數量"},
                    "includePermissions": {"type": "boolean", "description": "是否包含角色的權限列表"}
                }
            }
        },
        {
            "name": "check_user_permission",
            "description": "檢查指定用戶是否擁有特定權限",
            "inputSchema": {
                "type": "object",
                "required": ["userId", "permission"],
                "properties": {
                    "userId": {"type": "string", "description": "用戶ID"},
                    "permission": {"type": "string", "description": "權限名稱"}
                }
            }
        }
    ]
    
    # 註冊 Drone Service MCP 工具
    drone_service_tools = [
        {
            "name": "get_drone_positions",
            "description": "獲取無人機位置資訊。支援分頁查詢、關鍵字搜尋、按無人機ID篩選等功能",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "page": {"type": "number", "description": "頁碼，預設為 1"},
                    "pageSize": {"type": "number", "description": "每頁資料數量，預設為 20"},
                    "search": {"type": "string", "description": "搜尋關鍵字，可搜尋無人機ID或其他欄位"},
                    "droneId": {"type": "string", "description": "指定無人機ID進行篩選"},
                    "sortBy": {"type": "string", "description": "排序欄位，預設為 createdAt"},
                    "sortOrder": {"type": "string", "description": "排序方式，ASC 或 DESC，預設為 DESC"}
                }
            }
        },
        {
            "name": "get_drone_position_by_id",
            "description": "根據位置記錄ID獲取特定的無人機位置資料",
            "inputSchema": {
                "type": "object",
                "required": ["positionId"],
                "properties": {
                    "positionId": {"type": "string", "description": "位置記錄的唯一識別碼"}
                }
            }
        },
        {
            "name": "get_drone_commands",
            "description": "獲取無人機指令列表。支援分頁查詢、狀態篩選、無人機ID篩選等功能",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "page": {"type": "number", "description": "頁碼，預設為 1"},
                    "pageSize": {"type": "number", "description": "每頁資料數量，預設為 20"},
                    "search": {"type": "string", "description": "搜尋關鍵字"},
                    "droneId": {"type": "string", "description": "按無人機ID篩選"},
                    "status": {"type": "string", "description": "按指令狀態篩選，如 pending, executing, completed"},
                    "commandType": {"type": "string", "description": "按指令類型篩選，如 takeoff, land, move"}
                }
            }
        },
        {
            "name": "get_drone_command_by_id",
            "description": "根據指令ID獲取特定的無人機指令詳細資訊",
            "inputSchema": {
                "type": "object",
                "required": ["commandId"],
                "properties": {
                    "commandId": {"type": "string", "description": "指令的唯一識別碼"}
                }
            }
        },
        {
            "name": "get_drone_statuses",
            "description": "獲取無人機狀態資訊。包含電池、訊號強度、飛行狀態等資料",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "page": {"type": "number", "description": "頁碼，預設為 1"},
                    "pageSize": {"type": "number", "description": "每頁資料數量，預設為 20"},
                    "search": {"type": "string", "description": "搜尋關鍵字"},
                    "droneId": {"type": "string", "description": "按無人機ID篩選"},
                    "batteryLevel": {"type": "number", "description": "按電池電量篩選（百分比）"},
                    "connectionStatus": {"type": "string", "description": "按連線狀態篩選，如 connected, disconnected"}
                }
            }
        },
        {
            "name": "get_drone_status_by_id",
            "description": "根據狀態記錄ID獲取特定的無人機狀態詳細資訊",
            "inputSchema": {
                "type": "object",
                "required": ["statusId"],
                "properties": {
                    "statusId": {"type": "string", "description": "狀態記錄的唯一識別碼"}
                }
            }
        },
        {
            "name": "get_drone_realtime_status",
            "description": "獲取無人機即時狀態資訊，包含當前位置、速度、方向等即時資料",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "droneId": {"type": "string", "description": "無人機ID，若不指定則返回所有無人機即時狀態"},
                    "includeHistory": {"type": "boolean", "description": "是否包含歷史狀態資料"}
                }
            }
        },
        {
            "name": "get_archive_tasks",
            "description": "獲取歸檔任務列表，用於管理無人機資料的歸檔作業",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "page": {"type": "number", "description": "頁碼，預設為 1"},
                    "pageSize": {"type": "number", "description": "每頁資料數量，預設為 20"},
                    "taskStatus": {"type": "string", "description": "按任務狀態篩選，如 pending, running, completed"},
                    "taskType": {"type": "string", "description": "按任務類型篩選，如 position_archive, command_archive"}
                }
            }
        },
        {
            "name": "get_drone_statistics",
            "description": "獲取無人機系統統計資訊，包含總數量、活躍狀態、指令統計等",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "timeRange": {"type": "string", "description": "時間範圍，如 today, week, month"},
                    "includeDetails": {"type": "boolean", "description": "是否包含詳細統計資料"}
                }
            }
        },
        {
            "name": "search_drone_data",
            "description": "綜合搜尋無人機資料，可同時搜尋位置、指令、狀態等資料",
            "inputSchema": {
                "type": "object",
                "required": ["query"],
                "properties": {
                    "query": {"type": "string", "description": "搜尋關鍵字"},
                    "dataTypes": {"type": "array", "description": "資料類型陣列，如 [\"positions\", \"commands\", \"statuses\"]"},
                    "limit": {"type": "number", "description": "每種資料類型的返回數量限制，預設為 10"}
                }
            }
        }
    ]
    
    mcp_registry.register_service(
        service_name="general-service",
        service_url="http://aiot-general-service:50053",
        tools=general_service_tools
    )
    
    mcp_registry.register_service(
        service_name="drone-service",
        service_url="http://aiot-drone-service:50052",
        tools=drone_service_tools
    )
    
    mcp_registry.register_service(
        service_name="rbac-service", 
        service_url="http://aiot-rbac-service:50051",
        tools=rbac_service_tools
    )
    
    # 註冊 Auth Service MCP 工具
    auth_service_tools = [
        {
            "name": "get_current_user",
            "description": "獲取當前登入用戶的基本資訊，包括用戶名、郵箱、角色等",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "includeRoles": {"type": "boolean", "description": "是否包含用戶角色資訊，預設為 false"},
                    "includePermissions": {"type": "boolean", "description": "是否包含用戶權限資訊，預設為 false"}
                }
            }
        },
        {
            "name": "validate_user_token",
            "description": "驗證用戶的認證令牌是否有效，檢查令牌狀態和過期時間",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "token": {"type": "string", "description": "要驗證的 JWT 令牌，若不提供則檢查當前請求的令牌"},
                    "includeTokenInfo": {"type": "boolean", "description": "是否返回令牌詳細資訊，預設為 false"}
                }
            }
        },
        {
            "name": "get_user_sessions",
            "description": "獲取用戶的活躍會話列表，包括登入時間、設備資訊等",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "userId": {"type": "string", "description": "用戶ID，若不提供則獲取當前用戶的會話"},
                    "includeExpired": {"type": "boolean", "description": "是否包含已過期的會話，預設為 false"},
                    "limit": {"type": "number", "description": "返回會話數量限制，預設為 10"}
                }
            }
        },
        {
            "name": "check_user_authentication",
            "description": "檢查用戶的認證狀態，包括登入狀態、令牌有效性等",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "userId": {"type": "string", "description": "要檢查的用戶ID，若不提供則檢查當前用戶"},
                    "checkPermissions": {"type": "boolean", "description": "是否同時檢查用戶權限，預設為 false"}
                }
            }
        },
        {
            "name": "get_login_history",
            "description": "獲取用戶的登入歷史記錄，包括登入時間、IP位址、設備資訊等",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "userId": {"type": "string", "description": "用戶ID，若不提供則獲取當前用戶的記錄"},
                    "days": {"type": "number", "description": "查詢天數，預設為 30 天"},
                    "includeFailedAttempts": {"type": "boolean", "description": "是否包含失敗的登入嘗試，預設為 false"},
                    "limit": {"type": "number", "description": "返回記錄數量限制，預設為 50"}
                }
            }
        },
        {
            "name": "get_auth_statistics",
            "description": "獲取認證系統的統計資訊，包括活躍用戶數、登入次數等",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "timeRange": {"type": "string", "description": "時間範圍，如 today, week, month，預設為 today"},
                    "includeDetails": {"type": "boolean", "description": "是否包含詳細統計資料，預設為 false"}
                }
            }
        },
        {
            "name": "verify_user_permissions",
            "description": "驗證用戶是否具有特定權限，支援多種權限檢查方式",
            "inputSchema": {
                "type": "object",
                "required": ["permissions"],
                "properties": {
                    "userId": {"type": "string", "description": "要檢查的用戶ID，若不提供則檢查當前用戶"},
                    "permissions": {"type": "array", "description": "要檢查的權限列表，字串陣列"},
                    "requireAll": {"type": "boolean", "description": "是否需要擁有所有權限，false 表示擁有任一權限即可，預設為 false"}
                }
            }
        },
        {
            "name": "get_security_events",
            "description": "獲取安全事件記錄，包括異常登入、權限變更等安全相關事件",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "userId": {"type": "string", "description": "篩選特定用戶的安全事件"},
                    "eventType": {"type": "string", "description": "事件類型篩選，如 login_failed, permission_changed"},
                    "severity": {"type": "string", "description": "嚴重程度篩選，如 low, medium, high"},
                    "days": {"type": "number", "description": "查詢天數，預設為 7 天"},
                    "limit": {"type": "number", "description": "返回記錄數量限制，預設為 100"}
                }
            }
        }
    ]
    
    mcp_registry.register_service(
        service_name="auth-service",
        service_url="http://aiot-auth-service:50050",
        tools=auth_service_tools
    )
    
    print("✅ MCP 服務初始化完成")
    print(f"📊 已註冊 {len(mcp_registry.get_available_tools())} 個工具")
    print(f"🏢 已註冊服務：{list(mcp_registry.services.keys())}")

# 使用範例
"""
# 初始化
initialize_mcp_services()

# 創建查詢處理器
processor = NaturalLanguageQueryProcessor(llm_model, mcp_registry)

# 處理自然語言查詢
result = await processor.process_query("幫我看看用戶 john123 的偏好設定")
print(result)

result = await processor.process_query("把用戶 alice456 的主題改為深色模式")  
print(result)

result = await processor.process_query("有多少用戶使用淺色主題？")
print(result)
"""