from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
import logging
from pydantic import BaseModel, Field
from typing import Optional, List
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Request/Response models
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

# Create FastAPI app
app = FastAPI(
    title="AIOT LLM AI Engine (Test Mode)",
    description="測試模式的 AI 推理服務",
    version="1.0.0-test"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """檢查 AI 服務健康狀態（測試模式）"""
    return HealthResponse(
        status="healthy",
        model="test-model",
        available=True,
        message="Test mode - AI Service is running normally"
    )

@app.post("/generate", response_model=GenerateResponse)
async def generate_response(request: GenerateRequest):
    """產生單輪文字回應（測試模式）"""
    logger.info(f"Generate request: {request.prompt[:50]}...")
    
    # 模擬回應
    mock_response = f"這是對 '{request.prompt[:30]}...' 的測試回應。"
    if request.use_rag:
        mock_response += " [使用 RAG 增強]"
    if request.image_url:
        mock_response += f" [包含圖像: {request.image_url}]"
    
    return GenerateResponse(
        success=True,
        response=mock_response,
        sources=["test-source-1", "test-source-2"] if request.use_rag else [],
        model="test-model"
    )

@app.post("/conversational", response_model=GenerateResponse)
async def conversational_response(request: ConversationalRequest):
    """產生具記憶功能的對話回應（測試模式）"""
    logger.info(f"Conversational request: {request.prompt[:50]}...")
    
    mock_response = f"對話回應：'{request.prompt[:30]}...' 的測試回覆。"
    if request.use_rag:
        mock_response += " [RAG 增強對話]"
    
    return GenerateResponse(
        success=True,
        response=mock_response,
        sources=["conv-source-1"] if request.use_rag else [],
        model="test-model"
    )

@app.post("/stream")
async def stream_generate(request: GenerateRequest):
    """串流文字生成回應（測試模式）"""
    logger.info(f"Stream request: {request.prompt[:50]}...")
    
    def generate_stream():
        words = f"串流回應給 '{request.prompt[:20]}...' 的測試內容。".split()
        for word in words:
            yield f"data: {json.dumps({'content': word + ' '})}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

@app.post("/documents")
async def upload_documents(request: DocumentUploadRequest):
    """上傳文件到 RAG 系統（測試模式）"""
    logger.info(f"Document upload: {len(request.documents)} documents")
    
    return {
        "success": True,
        "message": f"Test mode: Successfully processed {len(request.documents)} documents",
        "documents_added": len(request.documents)
    }

if __name__ == "__main__":
    uvicorn.run(
        "test_main:app",
        host="0.0.0.0",
        port=8021,
        reload=True,
        log_level="info"
    )