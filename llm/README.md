# LLM Service 🤖

大型語言模型 API 服務，提供 LangChain 整合和 RAG（檢索增強生成）功能。

## 快速開始 🚀

### 1. 環境設置

```bash
# 進入專案目錄
cd llm/

# 創建虛擬環境（如果還沒有的話）
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
# 開發模式啟動
python manage.py runserver

# 指定端口
python manage.py runserver 8000

# 指定 IP 和端口
python manage.py runserver 0.0.0.0:8000
```

### 4. 生成文檔（可選）

```bash
# 進入文檔目錄
cd docs/

# 生成 HTML 文檔
make html

# 清理文檔
make clean

# 回到專案根目錄
cd ..
```

## 常用指令 📝

### Django 管理

```bash
# 啟動開發伺服器
python manage.py runserver

# 檢查專案配置
python manage.py check

# 收集靜態文件
python manage.py collectstatic

# 進入 Django shell
python manage.py shell

# 查看所有可用指令
python manage.py help
```

### 資料庫操作

```bash
# 創建遷移文件
python manage.py makemigrations

# 執行遷移
python manage.py migrate

# 查看遷移狀態
python manage.py showmigrations

# 重置特定 app 的遷移
python manage.py migrate <app_name> zero
```

### 測試和除錯

```bash
# 運行測試
python manage.py test

# 運行特定 app 的測試
python manage.py test transformers_service

# 檢查程式碼品質（如果有 flake8）
flake8 .

# 格式化程式碼（如果有 black）
black .
```

## API 端點 🔗

服務啟動後，訪問以下端點：

- **API 首頁**: http://localhost:8000/api/
- **管理後台**: http://localhost:8000/admin/
- **文檔首頁**: http://localhost:8000/api/docs/raw/

### 主要服務

1. **LLM 服務** (`/api/ollama/`)
   - 文字生成
   - 對話功能
   - RAG 檢索
   - 串流回應

2. **文檔服務** (`/api/docs/`)
   - API 文檔
   - 搜尋功能
   - 文檔結構

## 專案結構 📁

```
llm/
├── manage.py              # Django 管理指令
├── requirements.txt       # Python 依賴
├── README.md             # 專案說明（本文件）
│
├── llm/                  # 主要設定
│   ├── settings.py       # Django 設定
│   ├── urls.py          # 主要路由
│   ├── api_urls.py      # API 路由（查看所有端點）
│   └── views.py         # API 首頁視圖
│
├── transformers_service/       # LLM 服務
│   ├── controllers.py   # API 控制器
│   ├── services.py      # 業務邏輯
│   ├── repositories.py  # 資料存取
│   └── urls.py          # 路由定義
│
├── docs_service/         # 文檔服務
│   ├── controllers.py   # 文檔 API 控制器
│   ├── services.py      # 文檔處理邏輯
│   └── urls.py          # 文檔路由
│
├── configs/              # 配置管理
│   ├── llm_config.py    # LLM 配置
│   ├── langchain_client.py # LangChain 客戶端
│   └── client_factory.py   # 客戶端工廠
│
└── docs/                 # Sphinx 文檔
    ├── conf.py          # Sphinx 配置
    ├── index.rst        # 文檔首頁
    ├── api.rst          # API 文檔
    └── modules.rst      # 模組文檔
```

## 環境變數 ⚙️

創建 `.env` 文件（可選）：

```bash
# 資料庫設定
DB_NAME=llm_db
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306

# Django 設定
DEBUG=True
SECRET_KEY=your-secret-key

# LLM 設定
MODEL_NAME=Qwen/Qwen2.5-7B-Instruct
DEVICE=cuda  # 或 cpu
```

## 故障排除 🔧

### 常見問題

1. **端口被佔用**
   ```bash
   # 查看端口使用情況
   lsof -i :8000
   
   # 使用其他端口
   python manage.py runserver 8001
   ```

2. **模組找不到錯誤**
   ```bash
   # 確認虛擬環境已啟動
   which python
   
   # 重新安裝依賴
   pip install -r requirements.txt
   ```

3. **資料庫連接錯誤**
   ```bash
   # 檢查資料庫設定
   python manage.py check --database
   
   # 重新執行遷移
   python manage.py migrate
   ```

4. **靜態文件問題**
   ```bash
   # 收集靜態文件
   python manage.py collectstatic --clear
   ```

### 除錯模式

```bash
# 啟用詳細日誌
export DJANGO_LOG_LEVEL=DEBUG
python manage.py runserver

# 使用 Django 除錯工具欄（如果已安裝）
pip install django-debug-toolbar
```

## 開發提示 💡

1. **忘記指令時**: 查看本 README 或執行 `python manage.py help`
2. **忘記 API 路由時**: 訪問 `http://localhost:8000/api/` 或查看 `llm/api_urls.py`
3. **修改配置後**: 重新啟動伺服器
4. **修改模型後**: 執行 `python manage.py makemigrations` 和 `python manage.py migrate`

## 相關連結 🔗

- [Django 官方文檔](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [LangChain 文檔](https://python.langchain.com/)
- [Sphinx 文檔](https://www.sphinx-doc.org/)

---

**記住**: 當你忘記怎麼啟動專案時，就來看這個 README！ 🎯