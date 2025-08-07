from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import StreamingHttpResponse
import json
from .services import langchain_service


class TransformersGenerateController(APIView):
    """使用 Vision 模型產生文字回應的控制器。
    
    此控制器處理單輪文字生成請求，支援圖像輸入和可選的檢索增強生成 (RAG) 功能。
    """
    
    def post(self, request):
        """根據提供的提示產生文字回應。
        
        Args:
            request: HTTP 請求，包含：
                - prompt (str, 必需): 輸入的文字提示
                - use_rag (bool, 可選): 是否使用 RAG 增強回應
                - image_url (str, 可選): 圖像 URL 用於視覺問答
                
        Returns:
            Response: JSON 回應，包含：
                - success (bool): 操作是否成功
                - data (dict): 成功時的生成內容
                - error (str): 失敗時的錯誤訊息
                - model (str): 用於生成的模型名稱
                
        Raises:
            HTTP 400: 當缺少 prompt 參數時
            HTTP 500: 當文字生成失敗時
        """
        prompt = request.data.get('prompt')
        if not prompt:
            return Response(
                {"error": "需要提供 prompt 參數"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        use_rag = request.data.get('use_rag', False)
        image_url = request.data.get('image_url')
        result = langchain_service.generate_response(prompt, use_rag=use_rag, image_url=image_url)
        
        if result["success"]:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TransformersStreamController(APIView):
    """串流文字生成回應的控制器。
    
    此控制器提供即時串流生成文字功能，
    適用於需要即時回饋的長文內容生成。
    """
    
    def post(self, request):
        """即時串流文字生成回應。
        
        Args:
            request: HTTP 請求，包含：
                - prompt (str, 必需): 輸入的文字提示
                
        Returns:
            StreamingHttpResponse: 伺服器推送事件串流，包含：
                - 生成時的內容片段
                - 完成時的最終 "[DONE]" 標記
                
        Raises:
            HTTP 400: 當缺少 prompt 參數時
        """
        prompt = request.data.get('prompt')
        if not prompt:
            return Response(
                {"error": "需要提供 prompt 參數"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_url = request.data.get('image_url')
        
        def generate():
            for chunk in langchain_service.stream_generate(prompt, image_url=image_url):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        
        response = StreamingHttpResponse(
            generate(),
            content_type='text/plain'
        )
        response['Cache-Control'] = 'no-cache'
        response['Connection'] = 'keep-alive'
        return response


class TransformersHealthController(APIView):
    """檢查 LangChain 服務健康狀態的控制器。
    
    提供端點以驗證 LLM 模型和相關服務
    是否正確載入並運作中。
    """
    
    def get(self, request):
        """檢查 LangChain 服務的健康狀態。
        
        Args:
            request: HTTP GET 請求（無需參數）
                
        Returns:
            Response: JSON 回應，包含：
                - success (bool): 服務是否健康
                - status (str): 目前服務狀態
                - model_available (bool): 模型是否已載入
        """
        health_status = langchain_service.get_health_status()
        return Response(health_status)


class DocumentUploadController(APIView):
    """上傳文件到 RAG 向量儲存的控制器。
    
    此控制器處理檢索增強生成的文件攝取，
    在向量資料庫中處理和儲存文件。
    """
    
    def post(self, request):
        """上傳和處理文件以支援 RAG 功能。
        
        Args:
            request: HTTP 請求，包含：
                - documents (list[str], 必需): 要處理的文字文件陣列
                
        Returns:
            Response: JSON 回應，包含：
                - success (bool): 文件上傳是否成功
                - message (str): 狀態訊息
                - documents_added (int): 處理的文件數量
                
        Raises:
            HTTP 400: 當缺少或無效的 documents 參數時
            HTTP 500: 當文件處理失敗時
        """
        documents = request.data.get('documents')
        if not documents or not isinstance(documents, list):
            return Response(
                {"error": "需要提供 documents 陣列"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = langchain_service.add_documents(documents)
        
        if result["success"]:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConversationalController(APIView):
    """具記憶功能的對話文字生成控制器。
    
    此控制器維護對話歷史和語境，
    支援多輪對話並可選擇性使用 RAG 功能。
    """
    
    def post(self, request):
        """根據記憶語境產生對話回應。
        
        Args:
            request: HTTP 請求，包含：
                - prompt (str, 必需): 輸入的訊息/問題
                - use_rag (bool, 可選): 是否使用 RAG 增強回應
                
        Returns:
            Response: JSON 回應，包含：
                - success (bool): 操作是否成功
                - data (dict): 包含對話語境的生成回應
                - sources (list): 使用 RAG 時檢索的文件
                - model (str): 用於生成的模型名稱
                
        Raises:
            HTTP 400: 當缺少 prompt 參數時
            HTTP 500: 當對話生成失敗時
        """
        prompt = request.data.get('prompt')
        if not prompt:
            return Response(
                {"error": "需要提供 prompt 參數"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        use_rag = request.data.get('use_rag', False)
        image_url = request.data.get('image_url')
        result = langchain_service.generate_conversational_response(prompt, use_rag=use_rag, image_url=image_url)
        
        if result["success"]:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)