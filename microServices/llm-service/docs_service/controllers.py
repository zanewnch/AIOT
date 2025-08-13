from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from .services import docs_service


class DocsController(APIView):
    """
    文檔服務控制器
    
    提供 Sphinx 生成的 HTML 文檔的 API 存取功能。
    """
    
    def get(self, request, doc_path='index.html'):
        """
        獲取指定的文檔內容
        
        Args:
            request: HTTP GET 請求
            doc_path: 文檔路徑，預設為 index.html
            
        Returns:
            Response: 文檔內容或錯誤訊息
        """
        result = docs_service.get_doc_content(doc_path)
        
        if not result["success"]:
            return Response(result, status=status.HTTP_404_NOT_FOUND)
        
        data = result["data"]
        content_type = data.get("content_type", "text/html")
        
        # 如果是 HTML 文檔，返回 JSON 格式的回應
        if content_type == "text/html":
            return Response(result, status=status.HTTP_200_OK)
        
        # 如果是靜態文件，直接返回文件內容
        if data.get("is_binary", False):
            return HttpResponse(
                data["content"],
                content_type=content_type
            )
        else:
            return HttpResponse(
                data["content"],
                content_type=content_type
            )


class DocsRawController(APIView):
    """
    原始文檔控制器
    
    直接提供 HTML 文檔內容，用於瀏覽器直接顯示。
    """
    
    def get(self, request, doc_path='index.html'):
        """
        獲取原始 HTML 文檔內容
        
        Args:
            request: HTTP GET 請求
            doc_path: 文檔路徑
            
        Returns:
            HttpResponse: 原始 HTML 內容
        """
        result = docs_service.get_doc_content(doc_path)
        
        if not result["success"]:
            return HttpResponse(
                f"<h1>404 - 文檔不存在</h1><p>{result.get('error', '未知錯誤')}</p>",
                status=404,
                content_type="text/html"
            )
        
        data = result["data"]
        
        if data.get("content_type") == "text/html":
            return HttpResponse(
                data["raw_html"],
                content_type="text/html"
            )
        else:
            # 靜態文件
            if data.get("is_binary", False):
                return HttpResponse(
                    data["content"],
                    content_type=data["content_type"]
                )
            else:
                return HttpResponse(
                    data["content"],
                    content_type=data["content_type"]
                )


class DocsSearchController(APIView):
    """
    文檔搜尋控制器
    
    提供文檔內容搜尋功能。
    """
    
    def get(self, request):
        """
        搜尋文檔內容
        
        Args:
            request: HTTP GET 請求，包含查詢參數 'q'
            
        Returns:
            Response: 搜尋結果
        """
        query = request.GET.get('q', '').strip()
        
        if not query:
            return Response(
                {
                    "success": False,
                    "error": "請提供搜尋關鍵字"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = docs_service.search_docs(query)
        
        if result["success"]:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DocsStructureController(APIView):
    """
    文檔結構控制器
    
    提供文檔結構樹信息。
    """
    
    def get(self, request):
        """
        獲取文檔結構
        
        Args:
            request: HTTP GET 請求
            
        Returns:
            Response: 文檔結構樹
        """
        result = docs_service.get_docs_structure()
        
        if result["success"]:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DocsHealthController(APIView):
    """
    文檔服務健康檢查控制器
    """
    
    def get(self, request):
        """
        檢查文檔服務狀態
        
        Args:
            request: HTTP GET 請求
            
        Returns:
            Response: 服務狀態
        """
        try:
            # 檢查是否能讀取首頁
            result = docs_service.get_doc_content('index.html')
            
            return Response(
                {
                    "success": True,
                    "service": "docs_service",
                    "status": "healthy",
                    "docs_available": result["success"],
                    "docs_root": str(docs_service.docs_root)
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "service": "docs_service",
                    "status": "unhealthy",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )