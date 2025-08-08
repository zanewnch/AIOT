from typing import Dict, Any, Generator
from .repositories import langchain_repository
import logging

logger = logging.getLogger(__name__)


class LangChainService:
    def __init__(self):
        self.repository = langchain_repository
    
    def generate_response(self, prompt: str, use_rag: bool = False, image_url: str = None, **kwargs) -> Dict[str, Any]:
        if not prompt or not prompt.strip():
            return {
                "success": False,
                "error": "Prompt cannot be empty",
                "model": self.repository.model_name
            }
        
        result = self.repository.generate_chat_response(prompt, use_rag=use_rag, image_url=image_url, **kwargs)
        
        if result["success"]:
            return {
                "success": True,
                "response": result["data"]["message"]["content"],
                "sources": result.get("sources", []),
                "model": result["model"]
            }
        else:
            return result
    
    def generate_conversational_response(self, prompt: str, use_rag: bool = False, image_url: str = None, **kwargs) -> Dict[str, Any]:
        """Generate response with conversation memory"""
        if not prompt or not prompt.strip():
            return {
                "success": False,
                "error": "Prompt cannot be empty",
                "model": self.repository.model_name
            }
        
        result = self.repository.generate_conversational_response(prompt, use_rag=use_rag, image_url=image_url, **kwargs)
        
        if result["success"]:
            return {
                "success": True,
                "response": result["data"]["message"]["content"],
                "sources": result.get("sources", []),
                "model": result["model"]
            }
        else:
            return result
    
    def add_documents(self, documents: list) -> Dict[str, Any]:
        """Add documents to RAG system"""
        try:
            success = self.repository.add_documents_to_rag(documents)
            return {
                "success": success,
                "message": f"Added {len(documents)} documents to RAG system" if success else "Failed to add documents"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def stream_generate(self, prompt: str, image_url: str = None, **kwargs) -> Generator[str, None, None]:
        if not prompt or not prompt.strip():
            yield "Error: Prompt cannot be empty"
            return
        
        yield from self.repository.stream_chat_response(prompt, image_url=image_url, **kwargs)
    
    def get_health_status(self) -> Dict[str, Any]:
        is_available = self.repository.check_model_exists()
        return {
            "model": self.repository.model_name,
            "available": is_available,
            "host": self.repository.host,
            "status": "healthy" if is_available else "unhealthy"
        }
    
    def list_available_models(self) -> Dict[str, Any]:
        return self.repository.list_models()


langchain_service = LangChainService()