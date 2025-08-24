-- LLM AI Engine PostgreSQL 初始化腳本
-- 用於創建對話記憶、MCP 工具調用記錄、知識庫等相關表

-- ===============================================
-- 建立基礎擴展
-- ===============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- 用於文本相似度搜索

-- ===============================================
-- 對話管理表
-- ===============================================

-- 對話會話表
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) DEFAULT 'New Conversation',
    mode VARCHAR(50) DEFAULT 'llm', -- 'llm', 'mcp', 'rag'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

-- 對話消息表  
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- 工具調用、來源、模型信息等
    token_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- MCP 工具調用記錄表
-- ===============================================

-- MCP 工具調用記錄表
CREATE TABLE IF NOT EXISTS mcp_tool_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    user_id VARCHAR(255),
    tool_name VARCHAR(255) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    arguments JSONB NOT NULL DEFAULT '{}',
    result JSONB DEFAULT '{}',
    success BOOLEAN NOT NULL DEFAULT false,
    error_message TEXT,
    execution_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- 知識庫管理表
-- ===============================================

-- 知識庫文檔表
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(500) NOT NULL,
    original_name VARCHAR(500) NOT NULL,
    content_type VARCHAR(100),
    file_size BIGINT,
    upload_user_id VARCHAR(255),
    content TEXT, -- 原始文本內容
    content_hash VARCHAR(64), -- SHA-256 hash for deduplication
    chunk_count INTEGER DEFAULT 0,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- 文檔分塊表（用於 RAG）
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    content_length INTEGER NOT NULL,
    embedding_id VARCHAR(255), -- ChromaDB 中的 ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- 用戶偏好和統計表
-- ===============================================

-- 用戶 LLM 偏好表
CREATE TABLE IF NOT EXISTS user_llm_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) UNIQUE NOT NULL,
    preferred_model VARCHAR(255) DEFAULT 'SmolLM2-135M-Instruct',
    temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    max_tokens INTEGER DEFAULT 1000 CHECK (max_tokens > 0 AND max_tokens <= 4000),
    use_rag_by_default BOOLEAN DEFAULT false,
    use_conversation_memory BOOLEAN DEFAULT true,
    preferred_language VARCHAR(10) DEFAULT 'zh-TW',
    timezone VARCHAR(50) DEFAULT 'Asia/Taipei',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 使用統計表
CREATE TABLE IF NOT EXISTS usage_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    conversation_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    mcp_call_count INTEGER DEFAULT 0,
    rag_query_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- ===============================================
-- 索引創建
-- ===============================================

-- 對話相關索引
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_active ON conversations(is_active);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);

-- MCP 工具調用索引
CREATE INDEX IF NOT EXISTS idx_mcp_calls_user_id ON mcp_tool_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_calls_tool_name ON mcp_tool_calls(tool_name);
CREATE INDEX IF NOT EXISTS idx_mcp_calls_service_name ON mcp_tool_calls(service_name);
CREATE INDEX IF NOT EXISTS idx_mcp_calls_created_at ON mcp_tool_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_mcp_calls_success ON mcp_tool_calls(success);

-- 知識庫相關索引
CREATE INDEX IF NOT EXISTS idx_documents_upload_user ON knowledge_documents(upload_user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON knowledge_documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON knowledge_documents(content_hash);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON knowledge_documents(created_at);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_id ON document_chunks(embedding_id);

-- 用戶偏好索引
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_llm_preferences(user_id);

-- 統計數據索引
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_date ON usage_statistics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_usage_stats_date ON usage_statistics(date);

-- ===============================================
-- 觸發器：自動更新時間戳
-- ===============================================

-- 更新 updated_at 時間戳的觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為相關表創建更新觸發器
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_llm_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_stats_updated_at 
    BEFORE UPDATE ON usage_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- 初始數據插入
-- ===============================================

-- 插入系統預設偏好設定（用於新用戶）
INSERT INTO user_llm_preferences (
    user_id, 
    preferred_model, 
    temperature, 
    max_tokens, 
    use_rag_by_default, 
    use_conversation_memory,
    preferred_language,
    timezone
) VALUES (
    'system_default', 
    'SmolLM2-135M-Instruct', 
    0.7, 
    1000, 
    false, 
    true,
    'zh-TW',
    'Asia/Taipei'
) ON CONFLICT (user_id) DO NOTHING;

-- 插入管理員用戶的預設偏好
INSERT INTO user_llm_preferences (
    user_id, 
    preferred_model, 
    temperature, 
    max_tokens, 
    use_rag_by_default, 
    use_conversation_memory,
    preferred_language,
    timezone
) VALUES (
    'admin', 
    'SmolLM2-135M-Instruct', 
    0.7, 
    1000, 
    false, 
    true,
    'zh-TW',
    'Asia/Taipei'
) ON CONFLICT (user_id) DO NOTHING;

-- ===============================================
-- 資料庫完成初始化
-- ===============================================

-- 輸出初始化完成訊息
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'LLM AI Engine PostgreSQL Database initialized successfully!';
    RAISE NOTICE 'Tables created: conversations, messages, mcp_tool_calls, knowledge_documents, document_chunks, user_llm_preferences, usage_statistics';
    RAISE NOTICE 'Indexes and triggers configured';
    RAISE NOTICE 'Ready for LLM conversation memory and MCP tool tracking';
    RAISE NOTICE '==============================================';
END $$;