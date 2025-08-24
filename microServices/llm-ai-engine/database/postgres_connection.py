"""
PostgreSQL connection manager for LLM AI Engine
Handles conversation memory, MCP tool calls, and knowledge base storage
"""

import asyncpg
import asyncio
import logging
import os
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timezone
from contextlib import asynccontextmanager
import json
import uuid

logger = logging.getLogger(__name__)

class PostgreSQLManager:
    """PostgreSQL 連接管理器 - 處理 LLM 相關的結構化數據"""
    
    def __init__(self):
        self.host = os.getenv('DB_HOST', 'localhost')
        self.port = int(os.getenv('DB_PORT', '5432'))
        self.database = os.getenv('DB_NAME', 'llm_ai_db')
        self.user = os.getenv('DB_USER', 'llm_user')
        self.password = os.getenv('DB_PASSWORD', 'llm_password_123')
        
        self.pool: Optional[asyncpg.Pool] = None
        self._connection_string = f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"
        
        logger.info(f"PostgreSQL Manager initialized for {self.host}:{self.port}/{self.database}")
    
    async def initialize(self):
        """初始化連接池"""
        try:
            self.pool = await asyncpg.create_pool(
                self._connection_string,
                min_size=2,
                max_size=10,
                command_timeout=60,
                server_settings={
                    'timezone': 'UTC',
                    'application_name': 'llm-ai-engine'
                }
            )
            logger.info("PostgreSQL connection pool created successfully")
            
            # 測試連接
            async with self.pool.acquire() as conn:
                version = await conn.fetchval('SELECT version()')
                logger.info(f"Connected to PostgreSQL: {version}")
                
        except Exception as e:
            logger.error(f"Failed to initialize PostgreSQL connection: {e}")
            raise
    
    async def close(self):
        """關閉連接池"""
        if self.pool:
            await self.pool.close()
            logger.info("PostgreSQL connection pool closed")
    
    @asynccontextmanager
    async def get_connection(self):
        """獲取資料庫連接的上下文管理器"""
        if not self.pool:
            raise RuntimeError("PostgreSQL pool not initialized")
        
        async with self.pool.acquire() as conn:
            try:
                yield conn
            except Exception as e:
                logger.error(f"Database operation failed: {e}")
                raise
    
    # ===============================================
    # 對話管理方法
    # ===============================================
    
    async def create_conversation(
        self, 
        user_id: str, 
        session_id: str, 
        title: str = "New Conversation",
        mode: str = "llm",
        metadata: Dict[str, Any] = None
    ) -> str:
        """創建新對話會話"""
        conversation_id = str(uuid.uuid4())
        
        async with self.get_connection() as conn:
            await conn.execute("""
                INSERT INTO conversations (id, user_id, session_id, title, mode, metadata)
                VALUES ($1, $2, $3, $4, $5, $6)
            """, conversation_id, user_id, session_id, title, mode, json.dumps(metadata or {}))
        
        logger.info(f"Created conversation {conversation_id} for user {user_id}")
        return conversation_id
    
    async def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        metadata: Dict[str, Any] = None,
        token_count: int = 0
    ) -> str:
        """添加對話消息"""
        message_id = str(uuid.uuid4())
        
        async with self.get_connection() as conn:
            await conn.execute("""
                INSERT INTO messages (id, conversation_id, role, content, metadata, token_count)
                VALUES ($1, $2, $3, $4, $5, $6)
            """, message_id, conversation_id, role, content, json.dumps(metadata or {}), token_count)
        
        logger.debug(f"Added message {message_id} to conversation {conversation_id}")
        return message_id
    
    async def get_conversation_history(
        self, 
        conversation_id: str, 
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """獲取對話歷史"""
        async with self.get_connection() as conn:
            rows = await conn.fetch("""
                SELECT id, role, content, metadata, token_count, created_at
                FROM messages
                WHERE conversation_id = $1
                ORDER BY created_at ASC
                LIMIT $2
            """, conversation_id, limit)
        
        return [dict(row) for row in rows]
    
    async def get_user_conversations(
        self, 
        user_id: str, 
        limit: int = 20,
        active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """獲取用戶的對話列表"""
        where_clause = "WHERE user_id = $1"
        params = [user_id]
        
        if active_only:
            where_clause += " AND is_active = $2"
            params.append(True)
        
        async with self.get_connection() as conn:
            rows = await conn.fetch(f"""
                SELECT id, session_id, title, mode, created_at, updated_at
                FROM conversations
                {where_clause}
                ORDER BY updated_at DESC
                LIMIT ${len(params) + 1}
            """, *params, limit)
        
        return [dict(row) for row in rows]
    
    # ===============================================
    # MCP 工具調用記錄
    # ===============================================
    
    async def log_mcp_tool_call(
        self,
        conversation_id: Optional[str],
        message_id: Optional[str],
        user_id: str,
        tool_name: str,
        service_name: str,
        arguments: Dict[str, Any],
        result: Dict[str, Any] = None,
        success: bool = True,
        error_message: str = None,
        execution_time_ms: int = 0
    ) -> str:
        """記錄 MCP 工具調用"""
        call_id = str(uuid.uuid4())
        
        async with self.get_connection() as conn:
            await conn.execute("""
                INSERT INTO mcp_tool_calls 
                (id, conversation_id, message_id, user_id, tool_name, service_name, 
                 arguments, result, success, error_message, execution_time_ms)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            """, call_id, conversation_id, message_id, user_id, tool_name, service_name,
                json.dumps(arguments), json.dumps(result or {}), success, error_message, execution_time_ms)
        
        logger.info(f"Logged MCP tool call {call_id}: {tool_name} on {service_name}")
        return call_id
    
    async def get_mcp_tool_usage_stats(
        self, 
        user_id: Optional[str] = None,
        days: int = 7
    ) -> Dict[str, Any]:
        """獲取 MCP 工具使用統計"""
        where_clause = "WHERE created_at >= NOW() - INTERVAL '%s days'" % days
        params = []
        
        if user_id:
            where_clause += " AND user_id = $1"
            params.append(user_id)
        
        async with self.get_connection() as conn:
            # 總體統計
            total_calls = await conn.fetchval(f"""
                SELECT COUNT(*) FROM mcp_tool_calls {where_clause}
            """, *params)
            
            success_calls = await conn.fetchval(f"""
                SELECT COUNT(*) FROM mcp_tool_calls {where_clause} AND success = true
            """, *params)
            
            # 按工具統計
            tool_stats = await conn.fetch(f"""
                SELECT tool_name, service_name, COUNT(*) as call_count,
                       AVG(execution_time_ms) as avg_time_ms,
                       SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count
                FROM mcp_tool_calls {where_clause}
                GROUP BY tool_name, service_name
                ORDER BY call_count DESC
            """, *params)
        
        return {
            'total_calls': total_calls,
            'success_calls': success_calls,
            'success_rate': round(success_calls / total_calls * 100, 2) if total_calls > 0 else 0,
            'tool_stats': [dict(row) for row in tool_stats]
        }
    
    # ===============================================
    # 用戶偏好設定
    # ===============================================
    
    async def get_user_llm_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """獲取用戶 LLM 偏好設定"""
        async with self.get_connection() as conn:
            row = await conn.fetchrow("""
                SELECT * FROM user_llm_preferences WHERE user_id = $1
            """, user_id)
        
        return dict(row) if row else None
    
    async def upsert_user_llm_preferences(self, user_id: str, preferences: Dict[str, Any]) -> bool:
        """更新或插入用戶偏好設定"""
        async with self.get_connection() as conn:
            result = await conn.execute("""
                INSERT INTO user_llm_preferences 
                (user_id, preferred_model, temperature, max_tokens, use_rag_by_default, 
                 use_conversation_memory, preferred_language, timezone)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (user_id) 
                DO UPDATE SET
                    preferred_model = EXCLUDED.preferred_model,
                    temperature = EXCLUDED.temperature,
                    max_tokens = EXCLUDED.max_tokens,
                    use_rag_by_default = EXCLUDED.use_rag_by_default,
                    use_conversation_memory = EXCLUDED.use_conversation_memory,
                    preferred_language = EXCLUDED.preferred_language,
                    timezone = EXCLUDED.timezone,
                    updated_at = CURRENT_TIMESTAMP
            """, user_id, 
                preferences.get('preferred_model', 'SmolLM2-135M-Instruct'),
                preferences.get('temperature', 0.7),
                preferences.get('max_tokens', 1000),
                preferences.get('use_rag_by_default', False),
                preferences.get('use_conversation_memory', True),
                preferences.get('preferred_language', 'zh-TW'),
                preferences.get('timezone', 'Asia/Taipei'))
        
        return "INSERT" in result or "UPDATE" in result
    
    # ===============================================
    # 知識庫管理
    # ===============================================
    
    async def create_knowledge_document(
        self,
        filename: str,
        original_name: str,
        content_type: str,
        file_size: int,
        upload_user_id: str,
        content: str,
        content_hash: str
    ) -> str:
        """創建知識庫文檔記錄"""
        doc_id = str(uuid.uuid4())
        
        async with self.get_connection() as conn:
            await conn.execute("""
                INSERT INTO knowledge_documents 
                (id, filename, original_name, content_type, file_size, upload_user_id, content, content_hash, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
            """, doc_id, filename, original_name, content_type, file_size, upload_user_id, content, content_hash)
        
        logger.info(f"Created knowledge document {doc_id}: {original_name}")
        return doc_id
    
    async def update_document_status(self, doc_id: str, status: str, chunk_count: int = 0):
        """更新文檔處理狀態"""
        async with self.get_connection() as conn:
            await conn.execute("""
                UPDATE knowledge_documents 
                SET status = $1, chunk_count = $2, processed_at = CURRENT_TIMESTAMP
                WHERE id = $3
            """, status, chunk_count, doc_id)
    
    # ===============================================
    # 使用統計
    # ===============================================
    
    async def update_daily_usage_stats(
        self,
        user_id: str,
        conversation_count: int = 0,
        message_count: int = 0,
        mcp_call_count: int = 0,
        rag_query_count: int = 0,
        total_tokens: int = 0,
        avg_response_time_ms: int = 0
    ):
        """更新每日使用統計"""
        async with self.get_connection() as conn:
            await conn.execute("""
                INSERT INTO usage_statistics 
                (user_id, conversation_count, message_count, mcp_call_count, 
                 rag_query_count, total_tokens, avg_response_time_ms)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (user_id, date)
                DO UPDATE SET
                    conversation_count = usage_statistics.conversation_count + EXCLUDED.conversation_count,
                    message_count = usage_statistics.message_count + EXCLUDED.message_count,
                    mcp_call_count = usage_statistics.mcp_call_count + EXCLUDED.mcp_call_count,
                    rag_query_count = usage_statistics.rag_query_count + EXCLUDED.rag_query_count,
                    total_tokens = usage_statistics.total_tokens + EXCLUDED.total_tokens,
                    avg_response_time_ms = (usage_statistics.avg_response_time_ms + EXCLUDED.avg_response_time_ms) / 2,
                    updated_at = CURRENT_TIMESTAMP
            """, user_id, conversation_count, message_count, mcp_call_count, 
                rag_query_count, total_tokens, avg_response_time_ms)
    
    # ===============================================
    # 工具方法
    # ===============================================
    
    async def health_check(self) -> bool:
        """資料庫健康檢查"""
        try:
            async with self.get_connection() as conn:
                result = await conn.fetchval('SELECT 1')
                return result == 1
        except Exception as e:
            logger.error(f"PostgreSQL health check failed: {e}")
            return False
    
    async def get_table_counts(self) -> Dict[str, int]:
        """獲取所有表的記錄數量"""
        tables = [
            'conversations', 'messages', 'mcp_tool_calls', 
            'knowledge_documents', 'document_chunks', 
            'user_llm_preferences', 'usage_statistics'
        ]
        
        counts = {}
        async with self.get_connection() as conn:
            for table in tables:
                count = await conn.fetchval(f'SELECT COUNT(*) FROM {table}')
                counts[table] = count
        
        return counts

# 全域實例
postgres_manager = PostgreSQLManager()