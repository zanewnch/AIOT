from django.urls import path
from .controllers import (
    TransformersGenerateController,
    TransformersStreamController,
    TransformersHealthController,
    DocumentUploadController,
    ConversationalController
)

urlpatterns = [
    path('transformers/generate/', TransformersGenerateController.as_view(), name='transformers-generate'),
    path('transformers/stream/', TransformersStreamController.as_view(), name='transformers-stream'),
    path('transformers/health/', TransformersHealthController.as_view(), name='transformers-health'),
    path('transformers/documents/', DocumentUploadController.as_view(), name='document-upload'),
    path('transformers/conversation/', ConversationalController.as_view(), name='conversational-chat'),
]