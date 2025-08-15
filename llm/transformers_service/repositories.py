from configs.client_factory import langchain_client
from typing import Dict, Any, Optional, Generator, List
import logging

logger = logging.getLogger(__name__)


class LangChainRepository:
    def __init__(self):
        self.client = langchain_client
        self.model_name = self.client.config.model.model_name
        self.host = "local"  # Vision model runs locally
    
    def generate_chat_response(self, prompt: str, use_rag: bool = False, **kwargs) -> Dict[str, Any]:
        try:
            response = self.client.generate_response(prompt, use_rag=use_rag, **kwargs)
            if response["success"]:
                return {
                    "success": True,
                    "data": {"message": {"content": response["response"]}},
                    "sources": response.get("sources", []),
                    "model": self.model_name
                }
            else:
                return response
        except Exception as e:
            logger.error(f"LangChain chat request failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "model": self.model_name
            }
    
    def generate_conversational_response(self, prompt: str, use_rag: bool = False, **kwargs) -> Dict[str, Any]:
        """Generate response with conversation memory"""
        try:
            response = self.client.conversational_response(prompt, use_rag=use_rag, **kwargs)
            if response["success"]:
                return {
                    "success": True,
                    "data": {"message": {"content": response["response"]}},
                    "sources": response.get("sources", []),
                    "model": self.model_name
                }
            else:
                return response
        except Exception as e:
            logger.error(f"LangChain conversational request failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "model": self.model_name
            }
    
    def add_documents_to_rag(self, documents: List[str]) -> bool:
        """Add documents to the RAG vector store"""
        try:
            return self.client.add_documents(documents)
        except Exception as e:
            logger.error(f"Failed to add documents to RAG: {str(e)}")
            return False
    
    def stream_chat_response(self, prompt: str, **kwargs) -> Generator[str, None, None]:
        try:
            yield from self.client.stream_generate(prompt, **kwargs)
        except Exception as e:
            logger.error(f"LangChain stream request failed: {str(e)}")
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
            return self.client.check_model_availability()
        except Exception as e:
            logger.error(f"Failed to check model availability: {str(e)}")
            return False


langchain_repository = LangChainRepository()