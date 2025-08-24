# LLM AI Engine 資料庫設計

## 🗄️ 多層資料庫架構

### **1. Redis (快速緩存層)**
```
用途：
- 對話歷史暫存 (TTL: 24小時)
- 模型推理結果緩存
- 用戶會話狀態
- MCP 工具調用緩存

數據結構：
conversation:{session_id} → JSON (對話記錄)
model_cache:{prompt_hash} → JSON (推理結果)  
user_session:{user_id} → JSON (會話狀態)
mcp_cache:{tool_call_hash} → JSON (工具結果)
```

### **2. PostgreSQL (持久化結構數據)**
```sql
-- 對話會話表
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    title VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 對話消息表  
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    role VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    metadata JSONB, -- 額外信息 (工具調用、來源等)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MCP 工具調用記錄表
CREATE TABLE mcp_tool_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    message_id UUID REFERENCES messages(id),
    tool_name VARCHAR(255) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    arguments JSONB NOT NULL,
    result JSONB,
    success BOOLEAN,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 知識庫文檔表
CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(500) NOT NULL,
    content_type VARCHAR(100),
    file_size BIGINT,
    upload_user_id VARCHAR(255),
    content TEXT, -- 原始文本內容
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用戶偏好表
CREATE TABLE user_llm_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) UNIQUE NOT NULL,
    preferred_model VARCHAR(255),
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    use_rag_by_default BOOLEAN DEFAULT false,
    use_conversation_memory BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **3. ChromaDB (向量資料庫)**
```python
# 文檔向量化儲存
collections = {
    "knowledge_base": "用戶上傳的知識庫文檔",
    "conversation_memory": "長期對話記憶向量",
    "code_snippets": "程式碼片段向量化",
    "api_documentation": "API 文檔向量"
}

# 向量檢索流程
1. 文檔上傳 → 文字切分 → 向量化 → 存入 ChromaDB
2. RAG 查詢 → 向量相似度搜索 → 檢索相關文檔
3. 生成回應 → 結合檢索內容 + LLM 生成
```

## 🔄 **數據流程**

### **對話流程**
```
用戶查詢 → Redis 檢查緩存 → PostgreSQL 載入歷史 → LLM 處理 → 結果存入 Redis + PostgreSQL
```

### **MCP 操作流程**
```
自然語言 → LLM 解析 → MCP 工具調用 → 記錄到 PostgreSQL → 結果緩存到 Redis
```

### **RAG 檢索流程**
```
用戶問題 → 向量化 → ChromaDB 檢索 → PostgreSQL 獲取原文 → LLM 生成回應
```

## 📊 **容量規劃**

### **Redis 設定**
```
記憶體需求: 2-4GB
TTL 策略:
- 對話歷史: 24 小時
- 模型緩存: 1 小時  
- 會話狀態: 30 分鐘
```

### **PostgreSQL 設定**
```
儲存需求: 根據使用量，建議 20GB 起
索引策略:
- conversations: user_id, session_id, created_at
- messages: conversation_id, created_at
- mcp_tool_calls: tool_name, service_name, created_at
```

### **ChromaDB 設定**
```
向量維度: 通常 384-1536 (依模型而定)
儲存需求: 每千筆文檔約 50MB
檢索效能: 支援毫秒級向量相似度搜索
```

## 🚀 **部署建議**

### **開發環境**
- Redis: Docker 容器
- PostgreSQL: Docker 容器  
- ChromaDB: 本地檔案系統

### **生產環境**
- Redis: Redis Cluster
- PostgreSQL: 主從複製
- ChromaDB: 持久化存儲 + 備份策略