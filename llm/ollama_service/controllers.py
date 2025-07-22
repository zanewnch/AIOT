from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import StreamingHttpResponse
import json
from .services import langchain_service


class OllamaGenerateController(APIView):
    def post(self, request):
        prompt = request.data.get('prompt')
        if not prompt:
            return Response(
                {"error": "需要提供 prompt 參數"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        use_rag = request.data.get('use_rag', False)
        result = langchain_service.generate_response(prompt, use_rag=use_rag)
        
        if result["success"]:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OllamaStreamController(APIView):
    def post(self, request):
        prompt = request.data.get('prompt')
        if not prompt:
            return Response(
                {"error": "需要提供 prompt 參數"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        def generate():
            for chunk in langchain_service.stream_generate(prompt):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        
        response = StreamingHttpResponse(
            generate(),
            content_type='text/plain'
        )
        response['Cache-Control'] = 'no-cache'
        response['Connection'] = 'keep-alive'
        return response


class OllamaHealthController(APIView):
    def get(self, request):
        health_status = langchain_service.get_health_status()
        return Response(health_status)


class DocumentUploadController(APIView):
    def post(self, request):
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
    def post(self, request):
        prompt = request.data.get('prompt')
        if not prompt:
            return Response(
                {"error": "需要提供 prompt 參數"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        use_rag = request.data.get('use_rag', False)
        result = langchain_service.generate_conversational_response(prompt, use_rag=use_rag)
        
        if result["success"]:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)