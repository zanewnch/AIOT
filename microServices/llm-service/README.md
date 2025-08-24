# AIOT SmolLM2 AI Engine

基於 SmolLM2-135M-Instruct 模型的 AI 推理服務，支援兩種運行模式：

## 🦜 LangChain 版本 (推薦)
- ✅ 對話記憶管理
- ✅ RAG (檢索增強生成) 支援
- ✅ 文檔向量化和檢索
- ✅ 鏈式處理工作流程
- ✅ 持久化向量數據庫

## ⚡ Simple 版本
- ✅ 基礎文字生成
- ✅ 輕量級對話記憶
- ✅ 快速啟動
- ✅ 資源消耗較低

## 安裝和啟動

### 1. 創建虛擬環境
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows
```

### 2. 安裝依賴
```bash
pip install -r requirements.txt
```

### 3. 配置環境變數
```bash
# 複製環境變數範例
cp .env.example .env

# 編輯 .env 檔案設定
# USE_LANGCHAIN=true   # 使用 LangChain 版本
# USE_LANGCHAIN=false  # 使用 Simple 版本
```

### 4. 啟動服務
```bash
python main.py
```

服務將在 http://localhost:8021 啟動

## API 端點

### 基礎端點
- `GET /health` - 健康檢查
- `POST /generate` - 單輪文字生成
- `POST /conversational` - 對話生成（含記憶）
- `POST /stream` - 串流生成
- `POST /documents` - 上傳文檔到 RAG 系統

### LangChain 專用端點
- `POST /memory/reset` - 重置對話記憶
- `GET /memory/history` - 獲取對話歷史

## API 使用範例

### 基本生成
```bash
curl -X POST http://localhost:8021/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "什麼是人工智慧？", "use_rag": false}'
```

### 對話生成
```bash
curl -X POST http://localhost:8021/conversational \
  -H "Content-Type: application/json" \
  -d '{"prompt": "你好，請介紹自己", "use_rag": false}'
```

### RAG 增強生成
```bash
# 先上傳文檔
curl -X POST http://localhost:8021/documents \
  -H "Content-Type: application/json" \
  -d '{"documents": ["人工智慧是一種模擬人類智能的技術..."]}'

# 使用 RAG 生成
curl -X POST http://localhost:8021/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "什麼是人工智慧？", "use_rag": true}'
```

### 重置記憶
```bash
curl -X POST http://localhost:8021/memory/reset
```

## 技術架構

```
┌─────────────────────────┐
│      FastAPI App        │
├─────────────────────────┤
│  ┌─────────────────────┐│  選擇性啟用
│  │  LangChain Service  ││  ←────────────
│  │                     ││
│  │ • ConversationChain ││
│  │ • Memory Manager    ││
│  │ • Vector Database   ││
│  │ • RAG Components    ││
│  └─────────────────────┘│
│                         │
│  ┌─────────────────────┐│  回退選項
│  │   Simple Service    ││  ←────────────
│  │                     ││
│  │ • Basic Generation  ││
│  │ • Simple Memory     ││
│  └─────────────────────┘│
├─────────────────────────┤
│    SmolLM2-135M Model   │
└─────────────────────────┘
```

## 配置選項

### 環境變數
- `USE_LANGCHAIN`: 是否使用 LangChain 版本 (true/false)
- `PORT`: 服務端口 (預設: 8021)
- `DEVICE`: 計算設備 (cpu/cuda)
- `MODEL_NAME`: 模型名稱
- `LOG_LEVEL`: 日誌級別

### LangChain 專用配置
- `EMBEDDINGS_MODEL`: 嵌入模型
- `VECTOR_DB_PATH`: 向量數據庫路徑
- `CHUNK_SIZE`: 文檔切塊大小
- `CHUNK_OVERLAP`: 切塊重疊大小
- `MEMORY_K`: 記憶保存對話輪數

## 故障排除

### 1. LangChain 初始化失敗
如果 LangChain 服務初始化失敗，系統會自動回退到 Simple 版本：
```
Failed to initialize LangChain AI Service: ...
Falling back to Simple AI Service...
```

### 2. 記憶體不足
SmolLM2-135M 模型約需 1GB RAM，請確保系統有足夠記憶體。

### 3. 模型下載
首次啟動會從 HuggingFace 下載模型，約需 1-2 分鐘。

## 與其他服務整合

此服務設計為與 Django LLM Service 配合使用：
- Django LLM Service (Port: 8022) - API 層和業務邏輯
- FastAPI AI Engine (Port: 8021) - 模型推理和 AI 功能

詳細整合方式請參考項目根目錄的 CLAUDE.md 文檔。