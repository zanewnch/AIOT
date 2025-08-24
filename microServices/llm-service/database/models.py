"""
Database models for LLM AI Engine
Pydantic models for type safety and validation
"""

from pydantic import BaseModel, Field, validator
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from enum import Enum
import uuid

class MessageRole(str, Enum):
    """消息角色枚舉"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ConversationMode(str, Enum):
    """對話模式枚舉"""
    LLM = "llm"
    MCP = "mcp" 
    RAG = "rag"

class DocumentStatus(str, Enum):
    """文檔處理狀態"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

# ===============================================
# 對話相關模型
# ===============================================

class Conversation(BaseModel):
    """對話會話模型"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: str
    title: str = "New Conversation"
    mode: ConversationMode = ConversationMode.LLM
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_active: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict)

class Message(BaseModel):
    """對話消息模型"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    role: MessageRole
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    token_count: int = 0
    created_at: Optional[datetime] = None

class MCPToolCall(BaseModel):
    """MCP 工具調用記錄模型"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: Optional[str] = None
    message_id: Optional[str] = None
    user_id: str
    tool_name: str
    service_name: str
    arguments: Dict[str, Any]
    result: Optional[Dict[str, Any]] = None
    success: bool = True
    error_message: Optional[str] = None
    execution_time_ms: int = 0
    created_at: Optional[datetime] = None

# ===============================================
# 知識庫相關模型
# ===============================================

class KnowledgeDocument(BaseModel):
    """知識庫文檔模型"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    original_name: str
    content_type: str
    file_size: int
    upload_user_id: str
    content: str
    content_hash: str
    chunk_count: int = 0
    processed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    status: DocumentStatus = DocumentStatus.PENDING

class DocumentChunk(BaseModel):
    """文檔分塊模型"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_id: str
    chunk_index: int
    content: str
    content_length: int
    embedding_id: Optional[str] = None
    created_at: Optional[datetime] = None

# ===============================================
# 用戶偏好模型
# ===============================================

class UserLLMPreference(BaseModel):
    """用戶 LLM 偏好設定模型"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    preferred_model: str = "SmolLM2-135M-Instruct"
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=1000, gt=0, le=4000)
    use_rag_by_default: bool = False
    use_conversation_memory: bool = True
    preferred_language: str = "zh-TW"
    timezone: str = "Asia/Taipei"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @validator('temperature')
    def validate_temperature(cls, v):
        if not (0.0 <= v <= 2.0):
            raise ValueError('Temperature must be between 0.0 and 2.0')
        return v

    @validator('max_tokens')
    def validate_max_tokens(cls, v):
        if not (1 <= v <= 4000):
            raise ValueError('Max tokens must be between 1 and 4000')
        return v

# ===============================================
# 統計相關模型
# ===============================================

class UsageStatistics(BaseModel):
    """使用統計模型"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: datetime
    conversation_count: int = 0
    message_count: int = 0
    mcp_call_count: int = 0
    rag_query_count: int = 0
    total_tokens: int = 0
    avg_response_time_ms: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# ===============================================
# 緩存相關模型
# ===============================================

class CachedConversation(BaseModel):
    """緩存的對話數據"""
    conversation_id: str
    messages: List[Message]
    cached_at: datetime
    ttl_seconds: int

class CachedModelResult(BaseModel):
    """緩存的模型結果"""
    prompt_hash: str
    result: Dict[str, Any]
    model_name: str
    cached_at: datetime
    ttl_seconds: int

class UserSession(BaseModel):
    """用戶會話數據"""
    user_id: str
    session_id: str
    current_conversation_id: Optional[str] = None
    preferences: Optional[UserLLMPreference] = None
    last_activity: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)

# ===============================================
# API 請求/回應模型
# ===============================================

class ConversationCreateRequest(BaseModel):
    """創建對話請求"""
    user_id: str
    session_id: str
    title: Optional[str] = "New Conversation"
    mode: ConversationMode = ConversationMode.LLM

class MessageCreateRequest(BaseModel):
    """創建消息請求"""
    conversation_id: str
    role: MessageRole
    content: str
    metadata: Optional[Dict[str, Any]] = None

class MCPToolCallRequest(BaseModel):
    """MCP 工具調用請求"""
    user_id: str
    tool_name: str
    service_name: str
    arguments: Dict[str, Any]
    conversation_id: Optional[str] = None
    message_id: Optional[str] = None

class UserPreferenceUpdateRequest(BaseModel):
    """用戶偏好更新請求"""
    preferred_model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    use_rag_by_default: Optional[bool] = None
    use_conversation_memory: Optional[bool] = None
    preferred_language: Optional[str] = None
    timezone: Optional[str] = None

# ===============================================
# 統計查詢模型
# ===============================================

class DatabaseStats(BaseModel):
    """資料庫統計信息"""
    table_counts: Dict[str, int]
    cache_stats: Dict[str, Any]
    total_users: int
    active_conversations: int
    recent_mcp_calls: int

class MCPUsageStats(BaseModel):
    """MCP 使用統計"""
    total_calls: int
    success_calls: int
    success_rate: float
    tool_stats: List[Dict[str, Any]]
    time_period_days: int