from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
import logging
import os
from contextlib import asynccontextmanager

from config.llm_config import LLMConfig, DEFAULT_LLM_CONFIG
from services.simple_ai_service import SimpleAIService
from models.requests import (
    GenerateRequest, 
    ConversationalRequest, 
    DocumentUploadRequest,
    HealthResponse,
    GenerateResponse
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global AI service instance
ai_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    global ai_service
    
    # Startup
    logger.info("Starting SmolLM2 AI Engine...")
    try:
        ai_service = SimpleAIService(DEFAULT_LLM_CONFIG)
        logger.info("SmolLM2 AI Service initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize AI Service: {e}")
        raise e
    
    yield
    
    # Shutdown
    logger.info("Shutting down SmolLM2 AI Engine...")
    if ai_service:
        ai_service.cleanup()

# Create FastAPI app
app = FastAPI(
    title="AIOT SmolLM2 AI Engine",
    description="基於 SmolLM2-135M-Instruct 的 AI 推理服務",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """檢查 AI 服務健康狀態"""
    try:
        if not ai_service:
            raise HTTPException(status_code=503, detail="AI Service not initialized")
        
        health_status = ai_service.get_health_status()
        
        if health_status["available"]:
            return HealthResponse(
                status="healthy",
                model=health_status["model"],
                available=True,
                message="SmolLM2 AI Service is running normally"
            )
        else:
            raise HTTPException(
                status_code=503, 
                detail=f"AI Service unhealthy: {health_status}"
            )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate", response_model=GenerateResponse)
async def generate_response(request: GenerateRequest):
    """產生單輪文字回應"""
    try:
        if not ai_service:
            raise HTTPException(status_code=503, detail="AI Service not available")
        
        result = ai_service.generate_response(
            prompt=request.prompt,
            use_rag=request.use_rag,
            image_url=request.image_url
        )
        
        if result["success"]:
            return GenerateResponse(
                success=True,
                response=result["response"],
                sources=result.get("sources", []),
                model=result["model"]
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Generation failed")
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generate response failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/conversational", response_model=GenerateResponse)
async def conversational_response(request: ConversationalRequest):
    """產生具記憶功能的對話回應"""
    try:
        if not ai_service:
            raise HTTPException(status_code=503, detail="AI Service not available")
        
        result = ai_service.generate_conversational_response(
            prompt=request.prompt,
            use_rag=request.use_rag,
            image_url=request.image_url
        )
        
        if result["success"]:
            return GenerateResponse(
                success=True,
                response=result["response"],
                sources=result.get("sources", []),
                model=result["model"]
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Generation failed")
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Conversational response failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stream")
async def stream_generate(request: GenerateRequest):
    """串流文字生成回應"""
    try:
        if not ai_service:
            raise HTTPException(status_code=503, detail="AI Service not available")
        
        def generate_stream():
            try:
                for chunk in ai_service.stream_generate(
                    prompt=request.prompt,
                    image_url=request.image_url
                ):
                    yield f"data: {chunk}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                logger.error(f"Stream generation failed: {e}")
                yield f"data: Error: {str(e)}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        )
    except Exception as e:
        logger.error(f"Stream endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/documents")
async def upload_documents(request: DocumentUploadRequest):
    """上傳文件到 RAG 系統"""
    try:
        if not ai_service:
            raise HTTPException(status_code=503, detail="AI Service not available")
        
        result = ai_service.add_documents(request.documents)
        
        if result["success"]:
            return {
                "success": True,
                "message": f"Successfully added {len(request.documents)} documents",
                "documents_added": len(request.documents)
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to add documents")
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8021"))
    uvicorn.run(
        "simple_main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )