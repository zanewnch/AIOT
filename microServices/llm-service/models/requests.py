"""
API 請求和回應模型定義。

本模組使用 Pydantic 定義了 SmolLM2 AI 引擎所有 API 端點的
請求和回應模型，提供型別安全和自動驗證功能。

主要模型:
- GenerateRequest: 單輪文字生成請求
- ConversationalRequest: 對話式生成請求
- DocumentUploadRequest: 文檔上傳請求
- HealthResponse: 健康檢查回應
- GenerateResponse: 文字生成回應

設計原則:
- 使用 Pydantic Field 提供詳細的欄位描述
- 支援可選參數和預設值
- 結構清晰，方便 API 文檔生成
- 型別檢查和數據驗證

Author: AIOT Team
Version: 2.0.0
"""

from pydantic import BaseModel, Field
from typing import Optional, List

class GenerateRequest(BaseModel):
    """
    單輪文字生成請求模型。
    
    用於 /generate 端點的請求資料驗證，支援基本的文字生成功能。
    不保留對話歷史，每次請求都是獨立的。
    
    Attributes:
        prompt (str): 用戶輸入的文字提示或問題，必須參數
        use_rag (bool): 是否啟用 RAG 檢索增強生成，預設為 False
        image_url (Optional[str]): 圖像 URL，用於視覺問答（SmolLM2 不支援）
    """
    prompt: str = Field(..., description="輸入的文字提示")
    use_rag: bool = Field(False, description="是否使用 RAG 增強回應")
    image_url: Optional[str] = Field(None, description="圖像 URL 用於視覺問答")

class ConversationalRequest(BaseModel):
    prompt: str = Field(..., description="輸入的訊息/問題")
    use_rag: bool = Field(False, description="是否使用 RAG 增強回應")
    image_url: Optional[str] = Field(None, description="圖像 URL")

class DocumentUploadRequest(BaseModel):
    documents: List[str] = Field(..., description="要處理的文字文件陣列")

class HealthResponse(BaseModel):
    """
    健康檢查回應模型。
    
    用於 /health 端點的回應格式，提供服務狀態資訊。
    
    Attributes:
        status (str): 服務狀態 ("healthy", "unhealthy", "error")
        model (str): 模型名稱或識別符
        available (bool): 模型是否可用於推理
        message (str): 狀態描述訊息
    """
    status: str
    model: str
    available: bool
    message: str

class GenerateResponse(BaseModel):
    """
    文字生成回應模型。
    
    用於 /generate 和 /conversational 端點的統一回應格式。
    
    Attributes:
        success (bool): 是否成功生成回應
        response (str): 生成的文字內容
        sources (List[str]): RAG 檢索到的來源文檔片段，預設為空列表
        model (str): 使用的模型名稱
    """
    success: bool
    response: str
    sources: List[str] = []
    model: str