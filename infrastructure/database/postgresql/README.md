# AIOT PostgreSQL Database

## 📋 概述

PostgreSQL 資料庫專門用於 LLM AI Engine，儲存對話記憶、MCP 工具調用記錄、知識庫文檔等結構化數據。

## 🗄️ 資料庫架構

### **容器資訊**
- **容器名稱**: `aiot-llm-postgres`
- **端口**: `5433:5432` (避免與本地 PostgreSQL 衝突)
- **資料庫**: `llm_ai_db`
- **用戶**: `llm_user`
- **映像**: `postgres:15-alpine`

### **數據持久化**
- **Volume**: `postgres_llm_data`
- **掛載點**: `/var/lib/postgresql/data`

## 📊 數據表結構

### **1. 對話管理**

#### `conversations` - 對話會話表
```sql
id          UUID        主鍵
user_id     VARCHAR     用戶ID
session_id  VARCHAR     會話ID
title       VARCHAR     對話標題
mode        VARCHAR     模式 (llm/mcp/rag)
created_at  TIMESTAMP   創建時間
updated_at  TIMESTAMP   更新時間
is_active   BOOLEAN     是否活躍
metadata    JSONB       額外元數據
```

#### `messages` - 對話消息表
```sql
id              UUID        主鍵
conversation_id UUID        關聯對話ID
role            VARCHAR     角色 (user/assistant/system)
content         TEXT        消息內容
metadata        JSONB       元數據 (工具調用、來源等)
token_count     INTEGER     Token 數量
created_at      TIMESTAMP   創建時間
```

### **2. MCP 工具調用記錄**

#### `mcp_tool_calls` - MCP 工具調用表
```sql
id                  UUID        主鍵
conversation_id     UUID        關聯對話ID
message_id          UUID        關聯消息ID
user_id            VARCHAR     用戶ID
tool_name          VARCHAR     工具名稱
service_name       VARCHAR     服務名稱
arguments          JSONB       調用參數
result             JSONB       執行結果
success            BOOLEAN     是否成功
error_message      TEXT        錯誤訊息
execution_time_ms  INTEGER     執行時間(毫秒)
created_at         TIMESTAMP   創建時間
```

### **3. 知識庫管理**

#### `knowledge_documents` - 知識庫文檔表
```sql
id              UUID        主鍵
filename        VARCHAR     文件名
original_name   VARCHAR     原始文件名
content_type    VARCHAR     內容類型
file_size       BIGINT      文件大小
upload_user_id  VARCHAR     上傳用戶ID
content         TEXT        原始文本內容
content_hash    VARCHAR     內容哈希值
chunk_count     INTEGER     分塊數量
processed_at    TIMESTAMP   處理時間
created_at      TIMESTAMP   創建時間
status          VARCHAR     處理狀態
```

#### `document_chunks` - 文檔分塊表
```sql
id             UUID        主鍵
document_id    UUID        關聯文檔ID
chunk_index    INTEGER     分塊索引
content        TEXT        分塊內容
content_length INTEGER     內容長度
embedding_id   VARCHAR     向量ID (ChromaDB)
created_at     TIMESTAMP   創建時間
```

### **4. 用戶偏好和統計**

#### `user_llm_preferences` - 用戶LLM偏好表
```sql
id                      UUID        主鍵
user_id                 VARCHAR     用戶ID (唯一)
preferred_model         VARCHAR     偏好模型
temperature             DECIMAL     溫度參數
max_tokens             INTEGER     最大Token數
use_rag_by_default     BOOLEAN     預設使用RAG
use_conversation_memory BOOLEAN     使用對話記憶
preferred_language      VARCHAR     偏好語言
timezone               VARCHAR     時區
created_at             TIMESTAMP   創建時間
updated_at             TIMESTAMP   更新時間
```

#### `usage_statistics` - 使用統計表
```sql
id                   UUID        主鍵
user_id             VARCHAR     用戶ID
date                DATE        統計日期
conversation_count   INTEGER     對話次數
message_count       INTEGER     消息數量
mcp_call_count      INTEGER     MCP調用次數
rag_query_count     INTEGER     RAG查詢次數
total_tokens        INTEGER     總Token數
avg_response_time_ms INTEGER     平均回應時間
created_at          TIMESTAMP   創建時間
updated_at          TIMESTAMP   更新時間
```

## 🔍 重要索引

### **性能優化索引**
- `conversations`: `user_id`, `session_id`, `created_at`, `is_active`
- `messages`: `conversation_id`, `created_at`, `role`
- `mcp_tool_calls`: `user_id`, `tool_name`, `service_name`, `created_at`, `success`
- `knowledge_documents`: `upload_user_id`, `status`, `content_hash`, `created_at`
- `document_chunks`: `document_id`, `embedding_id`
- `user_llm_preferences`: `user_id`
- `usage_statistics`: `(user_id, date)`, `date`

## 🚀 初始化流程

### **自動初始化**
1. PostgreSQL 容器啟動時自動執行 `01_llm_ai_engine_init.sql`
2. 創建所有表結構和索引
3. 設置觸發器自動更新時間戳
4. 插入預設的用戶偏好設定

### **預設數據**
- `system_default`: 系統預設偏好設定
- `admin`: 管理員用戶偏好設定

## 💾 數據流程

### **對話流程**
```
用戶查詢 → conversations 表記錄會話 → messages 表儲存對話 → usage_statistics 更新統計
```

### **MCP 操作流程**
```
自然語言查詢 → LLM解析 → MCP工具調用 → mcp_tool_calls 記錄 → 統計數據更新
```

### **RAG 流程**
```
文檔上傳 → knowledge_documents 記錄 → 文本分塊 → document_chunks 儲存 → ChromaDB向量化
```

## 🔧 管理命令

### **連接資料庫**
```bash
# 進入容器
docker exec -it aiot-llm-postgres psql -U llm_user -d llm_ai_db

# 或使用外部連接 (端口 5433)
psql -h localhost -p 5433 -U llm_user -d llm_ai_db
```

### **查看表狀態**
```sql
-- 查看所有表
\dt

-- 查看表大小
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    null_frac
FROM pg_stats 
WHERE schemaname = 'public';

-- 查看索引使用情況
SELECT 
    indexname, 
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

### **備份與恢復**
```bash
# 備份
docker exec aiot-llm-postgres pg_dump -U llm_user llm_ai_db > llm_backup.sql

# 恢復
docker exec -i aiot-llm-postgres psql -U llm_user -d llm_ai_db < llm_backup.sql
```

## 📈 監控指標

### **重要監控項目**
- 連接數量
- 查詢執行時間
- 索引使用率
- 資料庫大小增長
- 慢查詢日誌

### **性能調優**
- 定期 VACUUM 和 ANALYZE
- 監控長時間運行的查詢
- 優化經常使用的查詢路徑
- 調整 PostgreSQL 配置參數

## 🔐 安全設定

### **訪問控制**
- 僅限容器間網路訪問
- 使用專用資料庫用戶
- 定期更換密碼
- 啟用連接日誌記錄

### **數據保護**
- 敏感數據加密儲存
- 定期備份策略
- 資料保留政策
- 符合數據保護法規