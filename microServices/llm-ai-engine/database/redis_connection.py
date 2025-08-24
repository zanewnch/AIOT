"""
Redis connection manager for LLM AI Engine
Handles conversation caching, model result caching, and session management
"""

import redis.asyncio as redis
import logging
import os
import json
import time
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class RedisManager:
    """Redis 連接管理器 - 處理快取和會話管理"""
    
    def __init__(self):
        self.host = os.getenv('REDIS_HOST', 'localhost')
        self.port = int(os.getenv('REDIS_PORT', '6379'))
        self.db = int(os.getenv('REDIS_DB', '2'))  # 使用 DB 2 避免與其他服務衝突
        
        self.client: Optional[redis.Redis] = None
        self._connection_pool = None
        
        # TTL 設定 (秒)
        self.TTL_CONVERSATION = 24 * 60 * 60  # 對話歷史：24小時
        self.TTL_MODEL_CACHE = 60 * 60        # 模型緩存：1小時
        self.TTL_SESSION = 30 * 60            # 會話狀態：30分鐘
        self.TTL_MCP_CACHE = 15 * 60          # MCP 結果：15分鐘
        
        logger.info(f"Redis Manager initialized for {self.host}:{self.port}/{self.db}")
    
    async def initialize(self):
        """初始化 Redis 連接"""
        try:
            self._connection_pool = redis.ConnectionPool(
                host=self.host,
                port=self.port,
                db=self.db,
                decode_responses=True,
                max_connections=20
            )
            
            self.client = redis.Redis(connection_pool=self._connection_pool)
            
            # 測試連接
            await self.client.ping()
            logger.info("Redis connection established successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Redis connection: {e}")
            raise
    
    async def close(self):
        """關閉 Redis 連接"""
        if self.client:
            await self.client.close()
            logger.info("Redis connection closed")
    
    # ===============================================
    # 對話緩存方法
    # ===============================================
    
    def _conversation_key(self, conversation_id: str) -> str:
        """對話緩存鍵"""
        return f"conversation:{conversation_id}"
    
    async def cache_conversation_messages(
        self, 
        conversation_id: str, 
        messages: List[Dict[str, Any]],
        ttl: Optional[int] = None
    ):
        """緩存對話消息"""
        key = self._conversation_key(conversation_id)
        ttl = ttl or self.TTL_CONVERSATION
        
        await self.client.setex(
            key, 
            ttl, 
            json.dumps(messages, default=str)
        )
        logger.debug(f"Cached conversation {conversation_id} with {len(messages)} messages")
    
    async def get_cached_conversation(self, conversation_id: str) -> Optional[List[Dict[str, Any]]]:
        """獲取緩存的對話"""
        key = self._conversation_key(conversation_id)
        cached_data = await self.client.get(key)
        
        if cached_data:
            try:
                messages = json.loads(cached_data)
                logger.debug(f"Retrieved cached conversation {conversation_id}")
                return messages
            except json.JSONDecodeError:
                logger.error(f"Failed to decode cached conversation {conversation_id}")
                await self.client.delete(key)
        
        return None
    
    async def append_conversation_message(
        self, 
        conversation_id: str, 
        message: Dict[str, Any]
    ):
        """追加消息到緩存的對話"""
        cached_messages = await self.get_cached_conversation(conversation_id)
        
        if cached_messages is not None:
            cached_messages.append(message)
            await self.cache_conversation_messages(conversation_id, cached_messages)
        else:
            # 如果沒有緩存，創建新的
            await self.cache_conversation_messages(conversation_id, [message])
    
    # ===============================================
    # 模型結果緩存
    # ===============================================
    
    def _model_cache_key(self, prompt_hash: str) -> str:
        """模型緩存鍵"""
        return f"model_cache:{prompt_hash}"
    
    async def cache_model_result(
        self, 
        prompt_hash: str, 
        result: Dict[str, Any],
        ttl: Optional[int] = None
    ):
        """緩存模型推理結果"""
        key = self._model_cache_key(prompt_hash)
        ttl = ttl or self.TTL_MODEL_CACHE
        
        await self.client.setex(
            key,
            ttl,
            json.dumps(result, default=str)
        )
        logger.debug(f"Cached model result for hash {prompt_hash}")
    
    async def get_cached_model_result(self, prompt_hash: str) -> Optional[Dict[str, Any]]:
        """獲取緩存的模型結果"""
        key = self._model_cache_key(prompt_hash)
        cached_data = await self.client.get(key)
        
        if cached_data:
            try:
                result = json.loads(cached_data)
                logger.debug(f"Cache hit for model result {prompt_hash}")
                return result
            except json.JSONDecodeError:
                logger.error(f"Failed to decode cached model result {prompt_hash}")
                await self.client.delete(key)
        
        return None
    
    # ===============================================
    # 會話狀態管理
    # ===============================================
    
    def _session_key(self, user_id: str) -> str:
        """用戶會話鍵"""
        return f"user_session:{user_id}"
    
    async def set_user_session(
        self, 
        user_id: str, 
        session_data: Dict[str, Any],
        ttl: Optional[int] = None
    ):
        """設置用戶會話數據"""
        key = self._session_key(user_id)
        ttl = ttl or self.TTL_SESSION
        
        # 添加時間戳
        session_data['last_activity'] = datetime.now().isoformat()
        
        await self.client.setex(
            key,
            ttl,
            json.dumps(session_data, default=str)
        )
        logger.debug(f"Set session for user {user_id}")
    
    async def get_user_session(self, user_id: str) -> Optional[Dict[str, Any]]:
        """獲取用戶會話數據"""
        key = self._session_key(user_id)
        cached_data = await self.client.get(key)
        
        if cached_data:
            try:
                session_data = json.loads(cached_data)
                logger.debug(f"Retrieved session for user {user_id}")
                return session_data
            except json.JSONDecodeError:
                logger.error(f"Failed to decode session for user {user_id}")
                await self.client.delete(key)
        
        return None
    
    async def extend_user_session(self, user_id: str, additional_ttl: int = None):
        """延長用戶會話時間"""
        key = self._session_key(user_id)
        ttl = additional_ttl or self.TTL_SESSION
        
        if await self.client.exists(key):
            await self.client.expire(key, ttl)
            logger.debug(f"Extended session for user {user_id}")
    
    # ===============================================
    # MCP 結果緩存
    # ===============================================
    
    def _mcp_cache_key(self, tool_name: str, args_hash: str) -> str:
        """MCP 工具結果緩存鍵"""
        return f"mcp_cache:{tool_name}:{args_hash}"
    
    async def cache_mcp_result(
        self, 
        tool_name: str, 
        args_hash: str, 
        result: Dict[str, Any],
        ttl: Optional[int] = None
    ):
        """緩存 MCP 工具調用結果"""
        key = self._mcp_cache_key(tool_name, args_hash)
        ttl = ttl or self.TTL_MCP_CACHE
        
        cache_data = {
            'result': result,
            'cached_at': datetime.now().isoformat(),
            'tool_name': tool_name
        }
        
        await self.client.setex(
            key,
            ttl,
            json.dumps(cache_data, default=str)
        )
        logger.debug(f"Cached MCP result for {tool_name}")
    
    async def get_cached_mcp_result(
        self, 
        tool_name: str, 
        args_hash: str
    ) -> Optional[Dict[str, Any]]:
        """獲取緩存的 MCP 結果"""
        key = self._mcp_cache_key(tool_name, args_hash)
        cached_data = await self.client.get(key)
        
        if cached_data:
            try:
                cache_data = json.loads(cached_data)
                logger.debug(f"Cache hit for MCP tool {tool_name}")
                return cache_data['result']
            except json.JSONDecodeError:
                logger.error(f"Failed to decode cached MCP result {tool_name}")
                await self.client.delete(key)
        
        return None
    
    # ===============================================
    # 統計和監控
    # ===============================================
    
    async def increment_counter(self, key: str, amount: int = 1, expire: int = None):
        """遞增計數器"""
        result = await self.client.incr(key, amount)
        
        if expire and result == amount:  # 第一次設置時添加過期時間
            await self.client.expire(key, expire)
        
        return result
    
    async def get_cache_stats(self) -> Dict[str, Any]:
        """獲取緩存統計信息"""
        # 獲取各種類型的緩存鍵數量
        conversation_keys = await self.client.keys("conversation:*")
        model_cache_keys = await self.client.keys("model_cache:*")
        session_keys = await self.client.keys("user_session:*")
        mcp_cache_keys = await self.client.keys("mcp_cache:*")
        
        # 獲取內存使用情況
        info = await self.client.info('memory')
        
        return {
            'cache_counts': {
                'conversations': len(conversation_keys),
                'model_cache': len(model_cache_keys),
                'sessions': len(session_keys),
                'mcp_cache': len(mcp_cache_keys)
            },
            'memory_usage': {
                'used_memory': info.get('used_memory_human', 'unknown'),
                'used_memory_peak': info.get('used_memory_peak_human', 'unknown')
            },
            'connection_info': {
                'connected_clients': info.get('connected_clients', 0),
                'total_connections_received': info.get('total_connections_received', 0)
            }
        }
    
    # ===============================================
    # 工具方法
    # ===============================================
    
    async def health_check(self) -> bool:
        """Redis 健康檢查"""
        try:
            response = await self.client.ping()
            return response == True
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False
    
    async def clear_cache_pattern(self, pattern: str) -> int:
        """清除匹配模式的緩存"""
        keys = await self.client.keys(pattern)
        if keys:
            deleted = await self.client.delete(*keys)
            logger.info(f"Deleted {deleted} keys matching pattern: {pattern}")
            return deleted
        return 0
    
    async def clear_user_cache(self, user_id: str):
        """清除特定用戶的所有緩存"""
        patterns = [
            f"user_session:{user_id}",
            f"conversation:*{user_id}*",  # 可能需要調整模式
        ]
        
        total_deleted = 0
        for pattern in patterns:
            deleted = await self.clear_cache_pattern(pattern)
            total_deleted += deleted
        
        logger.info(f"Cleared {total_deleted} cache entries for user {user_id}")
        return total_deleted

# 全域實例
redis_manager = RedisManager()