"""
API 路由配置文件

將所有 API 相關的路由集中管理，方便查看和維護。
"""

from django.urls import path, include
from .views import APIHomepageView

# API 路由配置
api_urlpatterns = [
    # API 首頁 - 顯示所有可用的 API 端點
    path('', APIHomepageView.as_view(), name='api-homepage'),
    
    # LLM 服務 - 文字生成、對話、RAG 功能
    path('ollama/', include('ollama_service.urls')),
    
    # 文檔服務 - Sphinx 文檔 API 存取
    path('docs/', include('docs_service.urls')),
]

"""
可用的 API 端點總覽：

1. 首頁和導航
   GET  /api/                     - API 首頁，列出所有端點

2. LLM 服務 (/api/ollama/)
   POST /api/ollama/generate/     - 生成文字回應
   POST /api/ollama/conversation/ - 具記憶的對話生成  
   POST /api/ollama/stream/       - 串流文字生成
   POST /api/ollama/documents/    - 上傳文件到 RAG 系統
   GET  /api/ollama/health/       - LLM 服務健康檢查

3. 文檔服務 (/api/docs/)
   GET  /api/docs/                - 文檔首頁 (JSON 格式)
   GET  /api/docs/raw/            - 文檔首頁 (HTML 格式)
   GET  /api/docs/search/?q=...   - 搜尋文檔內容
   GET  /api/docs/structure/      - 獲取文檔結構樹
   GET  /api/docs/health/         - 文檔服務健康檢查
   GET  /api/docs/{doc_path}      - 獲取特定文檔內容
   GET  /api/docs/raw/{doc_path}  - 獲取特定原始文檔

快速測試：
- curl http://localhost:8000/api/
- curl http://localhost:8000/api/ollama/health/
- curl http://localhost:8000/api/docs/health/
"""