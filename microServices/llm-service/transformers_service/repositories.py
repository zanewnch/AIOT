from .ai_client import ai_engine_client
from typing import Dict, Any, Optional, Generator, List
import logging

logger = logging.getLogger(__name__)


class LangChainRepository:
    def __init__(self):
        self.client = ai_engine_client
        self.model_name = "AI-Engine"  # 從 AI Engine 取得實際模型名稱
        self.host = "ai-engine"  # AI Engine 服務
    
    def generate_chat_response(self, prompt: str, use_rag: bool = False, **kwargs) -> Dict[str, Any]:
        try:
            # AI Engine 客戶端已處理格式轉換
            response = self.client.generate_response(prompt, use_rag=use_rag, **kwargs)
            return response
        except Exception as e:
            logger.error(f"AI Engine chat request failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "model": self.model_name
            }
    
    def generate_conversational_response(self, prompt: str, use_rag: bool = False, **kwargs) -> Dict[str, Any]:
        """Generate response with conversation memory"""
        try:
            # AI Engine 客戶端已處理格式轉換
            response = self.client.generate_conversational_response(prompt, use_rag=use_rag, **kwargs)
            return response
        except Exception as e:
            logger.error(f"AI Engine conversational request failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "model": self.model_name
            }
    
    def add_documents_to_rag(self, documents: List[str]) -> bool:
        """Add documents to the RAG vector store"""
        try:
            return self.client.add_documents_to_rag(documents)
        except Exception as e:
            logger.error(f"Failed to add documents to RAG: {str(e)}")
            return False
    
    def stream_chat_response(self, prompt: str, **kwargs) -> Generator[str, None, None]:
        try:
            yield from self.client.stream_chat_response(prompt, **kwargs)
        except Exception as e:
            logger.error(f"AI Engine stream request failed: {str(e)}")
            yield f"Error: {str(e)}"
    
    def list_models(self) -> Dict[str, Any]:
        try:
            return {
                "success": True,
                "data": {
                    "models": [{"name": self.model_name}]
                }
            }
        except Exception as e:
            logger.error(f"Failed to list models: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def check_model_exists(self, model_name: Optional[str] = None) -> bool:
        try:
            return self.client.check_model_exists()
        except Exception as e:
            logger.error(f"Failed to check model availability: {str(e)}")
            return False


langchain_repository = LangChainRepository()