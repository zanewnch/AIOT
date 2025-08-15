from pydantic import BaseModel, Field
from typing import Optional, List

class GenerateRequest(BaseModel):
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
    status: str
    model: str
    available: bool
    message: str

class GenerateResponse(BaseModel):
    success: bool
    response: str
    sources: List[str] = []
    model: str