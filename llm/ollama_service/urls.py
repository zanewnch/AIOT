from django.urls import path
from .controllers import (
    OllamaGenerateController,
    OllamaStreamController,
    OllamaHealthController,
    DocumentUploadController,
    ConversationalController
)

urlpatterns = [
    path('ollama/generate/', OllamaGenerateController.as_view(), name='ollama-generate'),
    path('ollama/stream/', OllamaStreamController.as_view(), name='ollama-stream'),
    path('ollama/health/', OllamaHealthController.as_view(), name='ollama-health'),
    path('ollama/documents/', DocumentUploadController.as_view(), name='document-upload'),
    path('ollama/conversation/', ConversationalController.as_view(), name='conversational-chat'),
]