"""
LangChain 服務模組

本模組提供 LangChain 整合服務，包含文字生成、對話功能、RAG 支援和串流回應等功能。
"""

from typing import Dict, Any, Generator, Optional, List
from .repositories import langchain_repository
import logging

logger = logging.getLogger(__name__)


class LangChainService:
    """
    LangChain 服務類別
    
    提供基於 LangChain 的大型語言模型服務，支援文字生成、對話記憶、
    檢索增強生成 (RAG) 和串流回應等功能。
    
    Attributes:
        repository: LangChain 資料存取層實例
        
    Example:
        >>> service = LangChainService()
        >>> result = service.generate_response("你好，世界！")
        >>> print(result["response"])
    """
    def __init__(self) -> None:
        """
        初始化 LangChain 服務
        
        建立服務實例並初始化資料存取層連接。
        """
        self.repository = langchain_repository
    
    def generate_response(self, prompt: str, use_rag: bool = False, image_url: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """
        生成單輪文字回應
        
        基於提供的提示生成文字回應，支援可選的 RAG 功能和圖像輸入。
        
        Args:
            prompt (str): 輸入的文字提示，不能為空
            use_rag (bool, optional): 是否啟用檢索增強生成功能。預設為 False
            image_url (Optional[str], optional): 圖像 URL，用於視覺問答。預設為 None
            **kwargs: 其他生成參數
            
        Returns:
            Dict[str, Any]: 包含以下欄位的回應字典：
                - success (bool): 操作是否成功
                - response (str): 生成的文字內容 (成功時)
                - sources (List[str]): RAG 檢索的來源文件 (使用 RAG 時)
                - model (str): 使用的模型名稱
                - error (str): 錯誤訊息 (失敗時)
                
        Raises:
            無直接異常，所有錯誤都封裝在回應字典中
            
        Example:
            >>> service = LangChainService()
            >>> result = service.generate_response("解釋人工智慧", use_rag=True)
            >>> if result["success"]:
            ...     print(result["response"])
        """
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
    
    def generate_conversational_response(self, prompt: str, use_rag: bool = False, image_url: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """
        生成具記憶功能的對話回應
        
        基於對話歷史和語境生成回應，維護多輪對話的連貫性。
        
        Args:
            prompt (str): 當前輪的對話輸入
            use_rag (bool, optional): 是否使用 RAG 增強回應。預設為 False
            image_url (Optional[str], optional): 圖像 URL。預設為 None
            **kwargs: 其他生成參數
            
        Returns:
            Dict[str, Any]: 包含對話回應的字典，格式同 generate_response
            
        Note:
            此方法會自動維護對話記憶，無需手動管理對話歷史。
        """
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
    
    def add_documents(self, documents: List[str]) -> Dict[str, Any]:
        """
        添加文件到 RAG 系統
        
        將文本文件處理並添加到向量資料庫中，用於檢索增強生成。
        
        Args:
            documents (List[str]): 要添加的文本文件列表
            
        Returns:
            Dict[str, Any]: 包含操作結果的字典：
                - success (bool): 操作是否成功
                - message (str): 操作結果訊息
                - error (str): 錯誤訊息 (失敗時)
                
        Example:
            >>> service = LangChainService()
            >>> docs = ["文件內容1", "文件內容2"]
            >>> result = service.add_documents(docs)
            >>> print(result["message"])
        """
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
    
    def stream_generate(self, prompt: str, image_url: Optional[str] = None, **kwargs) -> Generator[str, None, None]:
        """
        串流生成文字回應
        
        以即時串流方式生成文字，適用於長文本生成和即時回饋需求。
        
        Args:
            prompt (str): 輸入提示
            image_url (Optional[str], optional): 圖像 URL。預設為 None
            **kwargs: 其他生成參數
            
        Yields:
            str: 生成的文字片段
            
        Example:
            >>> service = LangChainService()
            >>> for chunk in service.stream_generate("寫一篇關於AI的文章"):
            ...     print(chunk, end="")
        """
        if not prompt or not prompt.strip():
            yield "Error: Prompt cannot be empty"
            return
        
        yield from self.repository.stream_chat_response(prompt, image_url=image_url, **kwargs)
    
    def get_health_status(self) -> Dict[str, Any]:
        """
        獲取服務健康狀態
        
        檢查 LangChain 服務和模型的可用性狀態。
        
        Returns:
            Dict[str, Any]: 包含健康狀態資訊的字典：
                - model (str): 模型名稱
                - available (bool): 模型是否可用
                - host (str): 服務主機
                - status (str): 健康狀態 ("healthy" 或 "unhealthy")
        """
        is_available = self.repository.check_model_exists()
        return {
            "model": self.repository.model_name,
            "available": is_available,
            "host": self.repository.host,
            "status": "healthy" if is_available else "unhealthy"
        }
    
    def list_available_models(self) -> Dict[str, Any]:
        """
        列出可用的模型清單
        
        獲取所有可用的 LLM 模型列表。
        
        Returns:
            Dict[str, Any]: 包含模型清單的字典
        """
        return self.repository.list_models()


# 全域服務實例
langchain_service = LangChainService()
"""LangChain 服務的全域實例，用於整個應用程式中的 LLM 操作"""