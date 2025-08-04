from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.urls import reverse
from django.conf import settings


class APIHomepageView(APIView):
    """
    API 首頁視圖
    
    提供所有可用 API 端點的概覽和導航。
    """
    
    def get(self, request):
        """
        獲取 API 首頁信息
        
        Returns:
            Response: 包含所有 API 端點和服務信息的 JSON 回應
        """
        base_url = request.build_absolute_uri('/api/')
        
        api_info = {
            "service": "LLM API Service",
            "version": "1.0.0",
            "description": "大型語言模型 API 服務，提供 LangChain 整合和 RAG 功能",
            "base_url": base_url,
            "endpoints": {
                "transformers_service": {
                    "description": "LLM 文字生成和對話服務",
                    "base_path": "/api/transformers/",
                    "endpoints": [
                        {
                            "method": "POST",
                            "path": "/api/transformers/generate/",
                            "description": "生成文字回應",
                            "parameters": ["prompt", "use_rag (optional)"]
                        },
                        {
                            "method": "POST",
                            "path": "/api/transformers/conversation/",
                            "description": "具記憶的對話生成",
                            "parameters": ["prompt", "use_rag (optional)"]
                        },
                        {
                            "method": "POST",
                            "path": "/api/transformers/stream/",
                            "description": "串流文字生成",
                            "parameters": ["prompt"]
                        },
                        {
                            "method": "POST",
                            "path": "/api/transformers/documents/",
                            "description": "上傳文件到 RAG 系統",
                            "parameters": ["documents (array)"]
                        },
                        {
                            "method": "GET",
                            "path": "/api/transformers/health/",
                            "description": "LLM 服務健康檢查",
                            "parameters": []
                        }
                    ]
                },
                "docs_service": {
                    "description": "API 文檔和說明服務",
                    "base_path": "/api/docs/",
                    "endpoints": [
                        {
                            "method": "GET",
                            "path": "/api/docs/",
                            "description": "獲取文檔首頁 (JSON 格式)",
                            "parameters": []
                        },
                        {
                            "method": "GET",
                            "path": "/api/docs/raw/",
                            "description": "獲取文檔首頁 (HTML 格式)",
                            "parameters": []
                        },
                        {
                            "method": "GET",
                            "path": "/api/docs/search/",
                            "description": "搜尋文檔內容",
                            "parameters": ["q (查詢關鍵字)"]
                        },
                        {
                            "method": "GET",
                            "path": "/api/docs/structure/",
                            "description": "獲取文檔結構樹",
                            "parameters": []
                        },
                        {
                            "method": "GET",
                            "path": "/api/docs/health/",
                            "description": "文檔服務健康檢查",
                            "parameters": []
                        },
                        {
                            "method": "GET",
                            "path": "/api/docs/{doc_path}",
                            "description": "獲取特定文檔內容",
                            "parameters": ["doc_path (文檔路徑)"]
                        }
                    ]
                }
            },
            "quick_links": {
                "文檔首頁": f"{base_url}docs/raw/",
                "API 文檔": f"{base_url}docs/raw/api.html",
                "模組文檔": f"{base_url}docs/raw/modules.html",
                "LLM 健康檢查": f"{base_url}transformers/health/",
                "文檔服務健康檢查": f"{base_url}docs/health/",
                "搜尋文檔": f"{base_url}docs/search/?q=範例"
            },
            "usage_examples": {
                "basic_generation": {
                    "description": "基本文字生成",
                    "curl": f"""curl -X POST {base_url}transformers/generate/ \\
     -H "Content-Type: application/json" \\
     -d '{{"prompt": "解釋什麼是人工智慧"}}'""",
                    "python": f"""import requests

response = requests.post('{base_url}transformers/generate/', json={{
    'prompt': '解釋什麼是人工智慧'
}})
print(response.json())"""
                },
                "rag_generation": {
                    "description": "使用 RAG 的文字生成",
                    "curl": f"""curl -X POST {base_url}transformers/generate/ \\
     -H "Content-Type: application/json" \\
     -d '{{"prompt": "基於已上傳的文件，解釋相關概念", "use_rag": true}}'""",
                    "python": f"""import requests

response = requests.post('{base_url}transformers/generate/', json={{
    'prompt': '基於已上傳的文件，解釋相關概念',
    'use_rag': True
}})
print(response.json())"""
                },
                "document_upload": {
                    "description": "上傳文件到 RAG 系統",
                    "curl": f"""curl -X POST {base_url}transformers/documents/ \\
     -H "Content-Type: application/json" \\
     -d '{{"documents": ["文件內容1", "文件內容2"]}}'""",
                    "python": f"""import requests

documents = ["文件內容1", "文件內容2"]
response = requests.post('{base_url}transformers/documents/', json={{
    'documents': documents
}})
print(response.json())"""
                }
            },
            "features": [
                "LangChain 整合",
                "RAG (檢索增強生成) 支援",
                "對話記憶功能",
                "即時串流回應",
                "文檔搜尋功能",
                "完整的 API 文檔",
                "健康檢查端點"
            ],
            "contact": {
                "project": "AIOT Team",
                "documentation": f"{base_url}docs/raw/",
                "health_check": f"{base_url}transformers/health/"
            }
        }
        
        return Response(api_info, status=status.HTTP_200_OK)