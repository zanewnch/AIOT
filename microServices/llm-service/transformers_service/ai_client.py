import requests
import json
from typing import Dict, Any, Generator, List, Optional
import logging
import os

logger = logging.getLogger(__name__)

class AIEngineClient:
    """AI Engine HTTP 客戶端"""
    
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.getenv("AI_ENGINE_URL", "http://localhost:8021")
        self.session = requests.Session()
        # 設置預設 timeout
        self.timeout = 30
        
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """統一的 HTTP 請求方法"""
        url = f"{self.base_url}{endpoint}"
        try:
            response = self.session.request(
                method=method,
                url=url,
                timeout=self.timeout,
                **kwargs
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"AI Engine request failed: {method} {url} - {str(e)}")
            return {
                "success": False,
                "error": f"AI Engine 連線失敗: {str(e)}",
                "model": "unknown"
            }
        except json.JSONDecodeError as e:
            logger.error(f"AI Engine response decode failed: {str(e)}")
            return {
                "success": False,
                "error": f"AI Engine 回應格式錯誤: {str(e)}",
                "model": "unknown"
            }
    
    def generate_response(self, prompt: str, use_rag: bool = False, image_url: Optional[str] = None) -> Dict[str, Any]:
        """產生單輪回應"""
        payload = {
            "prompt": prompt,
            "use_rag": use_rag
        }
        if image_url:
            payload["image_url"] = image_url
        
        result = self._make_request("POST", "/generate", json=payload)
        
        # 轉換回應格式以符合原有介面
        if result.get("success"):
            return {
                "success": True,
                "data": {
                    "message": {
                        "content": result.get("response", "")
                    }
                },
                "sources": result.get("sources", []),
                "model": result.get("model", "unknown")
            }
        else:
            return result
    
    def generate_conversational_response(self, prompt: str, use_rag: bool = False, image_url: Optional[str] = None) -> Dict[str, Any]:
        """產生對話回應"""
        payload = {
            "prompt": prompt,
            "use_rag": use_rag
        }
        if image_url:
            payload["image_url"] = image_url
        
        result = self._make_request("POST", "/conversational", json=payload)
        
        # 轉換回應格式
        if result.get("success"):
            return {
                "success": True,
                "data": {
                    "message": {
                        "content": result.get("response", "")
                    }
                },
                "sources": result.get("sources", []),
                "model": result.get("model", "unknown")
            }
        else:
            return result
    
    def add_documents_to_rag(self, documents: List[str]) -> bool:
        """新增文件到 RAG 系統"""
        payload = {"documents": documents}
        result = self._make_request("POST", "/documents", json=payload)
        return result.get("success", False)
    
    def stream_chat_response(self, prompt: str, image_url: Optional[str] = None) -> Generator[str, None, None]:
        """串流聊天回應"""
        payload = {
            "prompt": prompt
        }
        if image_url:
            payload["image_url"] = image_url
        
        url = f"{self.base_url}/stream"
        try:
            with self.session.post(
                url, 
                json=payload, 
                stream=True, 
                timeout=self.timeout
            ) as response:
                response.raise_for_status()
                
                for line in response.iter_lines():
                    if line:
                        line_str = line.decode('utf-8')
                        if line_str.startswith('data: '):
                            data = line_str[6:]  # 移除 'data: ' 前綴
                            if data == '[DONE]':
                                break
                            try:
                                chunk_data = json.loads(data)
                                if "content" in chunk_data:
                                    yield chunk_data["content"]
                                elif "error" in chunk_data:
                                    yield f"Error: {chunk_data['error']}"
                                    break
                            except json.JSONDecodeError:
                                # 直接輸出原始資料
                                yield data
        except requests.exceptions.RequestException as e:
            logger.error(f"Stream request failed: {str(e)}")
            yield f"Error: 串流連線失敗 - {str(e)}"
    
    def check_model_exists(self) -> bool:
        """檢查模型是否存在"""
        result = self._make_request("GET", "/health")
        return result.get("available", False)
    
    def get_health_status(self) -> Dict[str, Any]:
        """取得健康狀態"""
        return self._make_request("GET", "/health")

# 全域客戶端實例
ai_engine_client = AIEngineClient()