from django.urls import path
from .controllers import (
    OllamaGenerateController,
    OllamaStreamController,
    OllamaHealthController,
    DocumentUploadController,
    ConversationalController
)

urlpatterns = [
    path('api/generate/', OllamaGenerateController.as_view(), name='ollama-generate'),
    path('api/stream/', OllamaStreamController.as_view(), name='ollama-stream'),
    path('api/health/', OllamaHealthController.as_view(), name='ollama-health'),
    path('api/documents/', DocumentUploadController.as_view(), name='document-upload'),
    path('api/conversation/', ConversationalController.as_view(), name='conversational-chat'),
]