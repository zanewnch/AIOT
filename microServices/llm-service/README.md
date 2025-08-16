# LLM Service 🤖

**大型語言模型 API 服務**

提供基於 Django 和 LangChain 的完整 AI 文字生成和文檔管理 API 服務，支援檢索增強生成 (RAG)、對話記憶、串流回應和 Intel NPU 加速等功能。

## 🏠 主要端點結構

```
/health/                    # 微服務健康檢查
/api/                      # API 首頁和導航
/api/transformers/         # LLM 文字生成服務  
/api/docs/                 # 文檔管理服務
```

## 🚀 快速開始

### 1. 環境設置

```bash
# 進入專案目錄
cd microServices/llm-service/

# 創建虛擬環境
python -m venv venv

# 啟動虛擬環境
# Linux/Mac:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# 安裝依賴
pip install -r requirements.txt
```

### 2. 資料庫設置

```bash
# 執行資料庫遷移
python manage.py migrate

# 創建超級使用者（可選）
python manage.py createsuperuser
```

### 3. 啟動服務

```bash
# 開發模式啟動 (預設端口 8000)
python manage.py runserver

# 指定端口啟動
python manage.py runserver 0.0.0.0:8022
```

### 4. 服務驗證

訪問以下端點確認服務正常運行：

- **API 首頁**: http://localhost:8022/api/
- **健康檢查**: http://localhost:8022/health/
- **文檔首頁**: http://localhost:8022/api/docs/raw/

## 🤖 Transformers 服務 API

### 1. 文字生成 - `POST /api/transformers/generate/`

**基本的單輪文字生成，支援 RAG 和圖像輸入**

#### 請求參數
- `prompt` *(string, 必需)*: 輸入提示
- `use_rag` *(boolean, 可選)*: 是否使用 RAG，預設 `false`
- `image_url` *(string, 可選)*: 圖像 URL，用於視覺問答

#### 回應格式
```json
{
  "success": true,
  "response": "生成的文字內容",
  "sources": ["RAG 來源文件"],
  "model": "使用的模型名稱"
}
```

#### 使用範例
```bash
# 基本文字生成
curl -X POST http://localhost:8022/api/transformers/generate/ \
     -H "Content-Type: application/json" \
     -d '{"prompt": "解釋什麼是人工智慧"}'

# 使用 RAG 的文字生成
curl -X POST http://localhost:8022/api/transformers/generate/ \
     -H "Content-Type: application/json" \
     -d '{"prompt": "基於已上傳的文件，解釋相關概念", "use_rag": true}'
```

### 2. 對話生成 - `POST /api/transformers/conversation/`

**具記憶功能的多輪對話，維護對話歷史和語境**

#### 請求參數
與文字生成相同

#### 特色功能
- 自動維護對話記憶
- 多輪對話連貫性
- 可選 RAG 增強

#### 使用範例
```bash
curl -X POST http://localhost:8022/api/transformers/conversation/ \
     -H "Content-Type: application/json" \
     -d '{"prompt": "你好，我想了解 AI", "use_rag": false}'
```

### 3. 串流生成 - `POST /api/transformers/stream/`

**即時串流文字輸出，適用於長文本生成**

#### 請求參數
- `prompt` *(string, 必需)*: 輸入提示
- `image_url` *(string, 可選)*: 圖像 URL

#### 回應格式
Server-Sent Events 串流，以 `data: ` 開頭的事件流

#### 使用範例
```bash
curl -X POST http://localhost:8022/api/transformers/stream/ \
     -H "Content-Type: application/json" \
     -d '{"prompt": "寫一篇關於 AI 的文章"}' \
     --no-buffer
```

### 4. 文檔上傳 - `POST /api/transformers/documents/`

**上傳文檔到 RAG 向量資料庫**

#### 請求參數
- `documents` *(array, 必需)*: 文字文件列表

#### 回應格式
```json
{
  "success": true,
  "message": "Added 2 documents to RAG system"
}
```

#### 使用範例
```bash
curl -X POST http://localhost:8022/api/transformers/documents/ \
     -H "Content-Type: application/json" \
     -d '{"documents": ["文件內容1", "文件內容2"]}'
```

### 5. 健康檢查 - `GET /api/transformers/health/`

**檢查 LLM 模型狀態**

#### 回應格式
```json
{
  "model": "模型名稱",
  "available": true,
  "host": "服務主機",
  "status": "healthy"
}
```

## 📚 文檔服務 API

### 1. 文檔內容 - `GET /api/docs/{doc_path}`

**獲取 JSON 格式的文檔內容**

#### 功能
- 支援 HTML 解析
- 靜態文件服務
- 安全路徑檢查

#### 使用範例
```bash
curl http://localhost:8022/api/docs/api.html
curl http://localhost:8022/api/docs/index.html
```

### 2. 原始文檔 - `GET /api/docs/raw/{doc_path}`

**直接返回 HTML 文檔，用於瀏覽器顯示**

#### 使用範例
- 在瀏覽器訪問: http://localhost:8022/api/docs/raw/
- 或使用 curl: `curl http://localhost:8022/api/docs/raw/api.html`

### 3. 文檔搜尋 - `GET /api/docs/search/?q={keyword}`

**全文搜尋文檔內容**

#### 請求參數
- `q` *(string, 必需)*: 搜尋關鍵字

#### 回應格式
```json
{
  "success": true,
  "data": {
    "query": "搜尋關鍵字",
    "results": [
      {
        "title": "文檔標題",
        "path": "相對路徑",
        "url": "/api/docs/相對路徑"
      }
    ],
    "total": 1
  }
}
```

#### 使用範例
```bash
curl "http://localhost:8022/api/docs/search/?q=API"
```

### 4. 文檔結構 - `GET /api/docs/structure/`

**獲取文檔目錄樹**

#### 回應格式
```json
{
  "success": true,
  "data": {
    "structure": [
      {
        "name": "文件名",
        "title": "文檔標題",
        "path": "文件路徑",
        "url": "/api/docs/文件路徑"
      }
    ],
    "total": 10
  }
}
```

### 5. 文檔健康檢查 - `GET /api/docs/health/`

**檢查文檔服務狀態**

## 🔧 系統端點

### 1. API 首頁 - `GET /api/`

**完整的 API 導航和使用範例**

#### 包含內容
- 所有端點清單
- 使用範例 (curl + Python)
- 快速連結
- 功能特色說明

### 2. 微服務健康檢查 - `GET /health/`

**綜合健康狀態檢查**

#### 檢查項目
- 資料庫連接
- Transformers 服務
- 文檔服務
- 系統資訊

#### 回應格式
```json
{
  "status": "healthy",
  "service": "llm-service",
  "version": "1.0.0",
  "timestamp": "2025-01-16T10:30:00",
  "components": {
    "database": "healthy",
    "transformers_service": "healthy",
    "docs_service": "healthy"
  }
}
```

## 💡 特色功能

### 1. 🔍 RAG 支援
**檢索增強生成**
- 上傳自訂文檔
- 向量相似性搜尋
- 來源文件追蹤
- ChromaDB 向量儲存

### 2. 🧠 對話記憶
**多輪對話語境維護**
- 自動記憶管理
- 對話歷史保存
- 語境連貫性
- 無需手動管理

### 3. ⚡ 串流回應
**即時文字生成輸出**
- Server-Sent Events
- 適用於長文本
- 即時使用者回饋
- 低延遲體驗

### 4. 📖 完整文檔
**內建 Sphinx 生成的 API 文檔**
- 自動生成文檔
- 搜尋功能
- 結構化導航
- 多格式支援

### 5. 🔍 健康監控
**多層級健康檢查機制**
- 服務層面檢查
- 組件狀態監控
- 詳細錯誤報告
- 自動故障檢測

### 6. 📚 使用範例
**內建 curl 和 Python 範例代碼**
- 實用代碼範例
- 快速開始指南
- 最佳實踐建議
- 錯誤處理說明

## 🏗️ 專案架構

### 目錄結構
```
llm-service/
├── manage.py              # Django 管理指令
├── requirements.txt       # Python 依賴
├── README.md             # 專案說明（本文件）
│
├── llm/                  # Django 主要設定
│   ├── settings.py       # 專案配置
│   ├── urls.py          # 主要路由
│   ├── views.py         # API 首頁視圖
│   ├── wsgi.py          # WSGI 配置
│   └── asgi.py          # ASGI 配置
│
├── transformers_service/ # LLM 服務模組
│   ├── controllers.py   # API 控制器
│   ├── services.py      # 業務邏輯層
│   ├── repositories.py  # 資料存取層
│   ├── ai_client.py     # AI 客戶端
│   └── urls.py          # 路由定義
│
├── docs_service/         # 文檔服務模組
│   ├── controllers.py   # 文檔 API 控制器
│   ├── services.py      # 文檔處理邏輯
│   └── urls.py          # 文檔路由
│
├── configs/              # 配置管理
│   ├── llm_config.py    # LLM 配置
│   ├── langchain_client.py # LangChain 客戶端
│   └── client_factory.py   # 客戶端工廠
│
└── docs/                 # Sphinx 文檔（可選）
    ├── conf.py          # Sphinx 配置
    ├── index.rst        # 文檔首頁
    └── _build/          # 生成的文檔
```

### 架構模式
- **MVC 模式**: 控制器、服務、資料存取分層
- **依賴注入**: 服務間鬆耦合設計
- **工廠模式**: 客戶端統一管理
- **單例模式**: 全域服務實例

## ⚙️ 環境配置

### 環境變數
創建 `.env` 文件（可選）：

```bash
# Django 設定
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# 資料庫設定
DB_NAME=llm_db
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# LLM 設定
LLM_MODEL_NAME=HuggingFaceTB/SmolLM2-135M-Instruct
LLM_DEVICE=cpu
LLM_HOST=http://localhost:8021
```

### Intel NPU 支援
```bash
# 安裝 OpenVINO NPU 支援
pip install openvino>=2025.0.0
pip install optimum[openvino]>=1.17.0

# 或者 Windows 用戶可選擇 IPEX-LLM
pip install --pre --upgrade ipex-llm[npu]
```

## 🔧 常用指令

### Django 管理
```bash
# 啟動開發伺服器
python manage.py runserver 0.0.0.0:8022

# 檢查專案配置
python manage.py check

# 收集靜態文件
python manage.py collectstatic

# 進入 Django shell
python manage.py shell
```

### 資料庫操作
```bash
# 創建遷移文件
python manage.py makemigrations

# 執行遷移
python manage.py migrate

# 查看遷移狀態
python manage.py showmigrations
```

### 測試和除錯
```bash
# 運行測試
python manage.py test

# 運行特定模組測試
python manage.py test transformers_service

# 檢查程式碼品質
flake8 .

# 格式化程式碼
black .
```

### Sphinx 文檔生成
```bash
# 安裝 Sphinx（如果需要）
pip install sphinx sphinx-rtd-theme

# 進入文檔目錄
cd docs/

# 生成 HTML 文檔
make html

# 清理文檔
make clean

# 自動重建
sphinx-autobuild . _build/html
```

## 🚨 故障排除

### 常見問題

#### 1. 端口被佔用
```bash
# 查看端口使用情況
lsof -i :8022

# 使用其他端口
python manage.py runserver 8023
```

#### 2. 模組找不到錯誤
```bash
# 確認虛擬環境已啟動
which python

# 重新安裝依賴
pip install -r requirements.txt
```

#### 3. 資料庫連接錯誤
```bash
# 檢查資料庫設定
python manage.py check --database

# 重新執行遷移
python manage.py migrate
```

#### 4. LLM 服務連接問題
```bash
# 檢查 LLM 服務健康狀態
curl http://localhost:8022/api/transformers/health/

# 檢查後端 AI 引擎狀態
curl http://localhost:8021/health
```

#### 5. 靜態文件問題
```bash
# 收集靜態文件
python manage.py collectstatic --clear
```

### 除錯模式
```bash
# 啟用詳細日誌
export DJANGO_LOG_LEVEL=DEBUG
python manage.py runserver

# 使用 Django 除錯工具欄
pip install django-debug-toolbar
```

## 📋 API 測試範例

### Python 範例
```python
import requests

# 基本文字生成
def test_generate():
    response = requests.post('http://localhost:8022/api/transformers/generate/', json={
        'prompt': '解釋什麼是人工智慧'
    })
    print(response.json())

# RAG 文檔上傳和查詢
def test_rag():
    # 上傳文檔
    docs = ["人工智慧是電腦科學的一個分支", "機器學習是AI的重要組成部分"]
    upload_response = requests.post('http://localhost:8022/api/transformers/documents/', json={
        'documents': docs
    })
    print("上傳結果:", upload_response.json())
    
    # 使用 RAG 查詢
    query_response = requests.post('http://localhost:8022/api/transformers/generate/', json={
        'prompt': '什麼是人工智慧？',
        'use_rag': True
    })
    print("RAG 查詢結果:", query_response.json())

# 對話測試
def test_conversation():
    # 第一輪對話
    response1 = requests.post('http://localhost:8022/api/transformers/conversation/', json={
        'prompt': '你好，我是新手'
    })
    print("第一輪:", response1.json())
    
    # 第二輪對話（有記憶）
    response2 = requests.post('http://localhost:8022/api/transformers/conversation/', json={
        'prompt': '我剛才說了什麼？'
    })
    print("第二輪:", response2.json())

# 文檔搜尋測試
def test_docs_search():
    response = requests.get('http://localhost:8022/api/docs/search/', params={
        'q': 'API'
    })
    print("搜尋結果:", response.json())

if __name__ == "__main__":
    test_generate()
    test_rag()
    test_conversation()
    test_docs_search()
```

### Curl 測試腳本
```bash
#!/bin/bash

BASE_URL="http://localhost:8022"

echo "=== 健康檢查 ==="
curl -s "$BASE_URL/health/" | python -m json.tool

echo -e "\n=== API 首頁 ==="
curl -s "$BASE_URL/api/" | python -m json.tool

echo -e "\n=== 基本文字生成 ==="
curl -s -X POST "$BASE_URL/api/transformers/generate/" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "解釋什麼是人工智慧"}' | python -m json.tool

echo -e "\n=== 文檔搜尋 ==="
curl -s "$BASE_URL/api/docs/search/?q=API" | python -m json.tool

echo -e "\n=== 文檔結構 ==="
curl -s "$BASE_URL/api/docs/structure/" | python -m json.tool
```

## 🔗 相關連結

- **[Django 官方文檔](https://docs.djangoproject.com/)**
- **[Django REST Framework](https://www.django-rest-framework.org/)**
- **[LangChain 文檔](https://python.langchain.com/)**
- **[Sphinx 文檔](https://www.sphinx-doc.org/)**
- **[OpenVINO 文檔](https://docs.openvino.ai/)**
- **[ChromaDB 文檔](https://docs.trychroma.com/)**

## 🎯 開發提示

1. **忘記指令時**: 查看本 README 或執行 `python manage.py help`
2. **忘記 API 路由時**: 訪問 `http://localhost:8022/api/`
3. **修改配置後**: 重新啟動伺服器
4. **修改模型後**: 執行 `python manage.py makemigrations` 和 `python manage.py migrate`
5. **生成文檔時**: 使用 `cd docs && make html`
6. **調試問題時**: 啟用 `DEBUG=True` 並查看詳細日誌

---

**記住**: 當你忘記怎麼啟動專案時，就來看這個 README！ 🎯

這個服務設計得非常完整，提供了從基礎文字生成到進階 RAG 功能的全套 LLM API！