"""
AIOT SmolLM2 AI 引擎主應用程式模組。

本模組實作基於 SmolLM2-135M-Instruct 模型的 AI 推理服務，提供兩種服務模式：
- LangChain 版本：支援對話記憶、RAG 檢索增強生成、文檔管理
- Simple 版本：輕量級基礎推理服務

主要功能：
- 單輪文字生成
- 對話記憶生成（LangChain 版本）
- 串流文字生成
- 文檔上傳與 RAG 檢索
- 健康狀態檢查
- 對話記憶管理

技術架構：
- FastAPI 作為 Web 框架
- SmolLM2-135M-Instruct 作為語言模型
- 支援 CPU、GPU、NPU 推理加速
- CORS 跨域支援

Author: AIOT Team
Version: 2.0.0
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, PlainTextResponse
import uvicorn
import logging
import os
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any
from pathlib import Path

from config.llm_config import LLMConfig, DEFAULT_LLM_CONFIG
from config.consul_config import ConsulConfig
from services.simple_ai_service import SimpleAIService
from services.langchain_ai_service import LangChainAIService
from models.requests import (
    GenerateRequest, 
    ConversationalRequest, 
    DocumentUploadRequest,
    HealthResponse,
    GenerateResponse
)

from models.mcp_requests import (
    NaturalLanguageQueryRequest,
    NaturalLanguageQueryResponse,
    MCPToolListResponse,
    MCPStatusResponse,
    MCPServiceStatus
)

# MCP 整合模組
from mcp_integration.mcp_client import (
    NaturalLanguageQueryProcessor,
    mcp_registry,
    initialize_mcp_services
)

# WebSocket 支援模組
from websocket_server import (
    initialize_websocket_handler,
    get_websocket_handler
)

# 配置日誌系統 - 統一日誌格式，包含時間戳、模組名稱、日誌級別和訊息內容
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 全域實例 - 在應用程式生命週期中保持單一實例
ai_service: Optional[Any] = None
consul_config: Optional[ConsulConfig] = None
mcp_processor: Optional[NaturalLanguageQueryProcessor] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    處理 FastAPI 應用程式的啟動與關閉事件。
    
    本函數管理 AI 服務的完整生命週期，包括：
    - 根據環境變數選擇服務類型（LangChain 或 Simple）
    - 啟動時初始化 AI 服務並載入模型
    - 關閉時清理資源和記憶體
    
    Args:
        app: FastAPI 應用程式實例
        
    Yields:
        None: 在應用程式運行期間持續監控
        
    Raises:
        Exception: 當 AI 服務初始化失敗時拋出異常
        
    Note:
        - 優先使用 LangChain 服務，失敗時自動降級為 Simple 服務
        - 透過 USE_LANGCHAIN 環境變數控制服務類型
        - 確保在應用程式關閉時正確釋放資源
    """
    global ai_service, consul_config, mcp_processor
    
    # 初始化 Consul 配置
    consul_config = ConsulConfig()
    
    # 從環境變數選擇服務類型 - 預設使用 LangChain 版本
    use_langchain = os.getenv("USE_LANGCHAIN", "true").lower() == "true"
    
    # 啟動階段 - 初始化 AI 服務
    if use_langchain:
        logger.info("Starting SmolLM2 AI Engine with LangChain...")
        try:
            # 嘗試初始化 LangChain AI 服務（包含對話記憶和 RAG 功能）
            ai_service = LangChainAIService(DEFAULT_LLM_CONFIG)
            logger.info("LangChain AI Service initialized successfully")
        except Exception as e:
            # LangChain 服務初始化失敗時，自動降級為 Simple 服務
            logger.error(f"Failed to initialize LangChain AI Service: {e}")
            logger.info("Falling back to Simple AI Service...")
            ai_service = SimpleAIService(DEFAULT_LLM_CONFIG)
            logger.info("Simple AI Service initialized successfully")
    else:
        logger.info("Starting SmolLM2 AI Engine with Simple Service...")
        try:
            # 直接使用 Simple AI 服務（輕量級版本）
            ai_service = SimpleAIService(DEFAULT_LLM_CONFIG)
            logger.info("Simple AI Service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AI Service: {e}")
            raise e
    
    # 初始化 MCP 服務
    try:
        logger.info("Initializing MCP services...")
        initialize_mcp_services()
        
        # 創建自然語言查詢處理器
        mcp_processor = NaturalLanguageQueryProcessor(ai_service, mcp_registry)
        logger.info("✅ MCP services initialized successfully")
        
        # 記錄可用工具
        available_tools = mcp_registry.get_available_tools()
        logger.info(f"📊 Available MCP tools: {[tool['name'] for tool in available_tools]}")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize MCP services: {e}")
        logger.info("MCP functionality will be disabled")
        mcp_processor = None
    
    # 初始化 WebSocket 處理器
    try:
        logger.info("Initializing WebSocket handler...")
        initialize_websocket_handler(ai_service, mcp_processor)
        logger.info("✅ WebSocket handler initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize WebSocket handler: {e}")
    
    # 註冊到 Consul
    if consul_config:
        await consul_config.register_service()
    
    yield  # 應用程式運行期間
    
    # 關閉階段 - 清理資源
    logger.info("Shutting down SmolLM2 AI Engine...")
    
    # 從 Consul 註銷服務
    if consul_config:
        await consul_config.deregister_service()
    
    # 清理 AI 服務資源
    if ai_service:
        ai_service.cleanup()  # 清理 GPU 記憶體和其他資源

# 建立 FastAPI 應用程式實例
# 根據環境變數動態設定服務描述，向用戶說明當前服務模式的功能差異
use_langchain_desc = os.getenv("USE_LANGCHAIN", "true").lower() == "true"
service_description = (
    "基於 SmolLM2-135M-Instruct 的 AI 推理服務\n\n"
    + ("🦜 **LangChain 版本**: 支援對話記憶、RAG 檢索增強生成、文檔管理" 
       if use_langchain_desc 
       else "⚡ **Simple 版本**: 輕量級基礎推理服務")
)

app = FastAPI(
    title="AIOT SmolLM2 AI Engine",
    description=service_description,
    version="2.0.0",
    lifespan=lifespan
)

# 添加 CORS 中間件 - 允許跨域請求，支援前端應用程式存取 API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生產環境應設定具體的來源域名，此處為開發便利設為所有域名
    allow_credentials=True,  # 允許攜帶認證資訊（cookies、headers）
    allow_methods=["*"],  # 允許所有 HTTP 方法（GET、POST、PUT、DELETE 等）
    allow_headers=["*"],  # 允許所有 HTTP 標頭
)

@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    檢查 AI 服務健康狀態。
    
    本端點用於監控系統運行狀態，檢查 AI 模型是否已載入並可正常使用。
    通常被負載均衡器、容器編排系統或監控工具呼叫。
    
    Returns:
        HealthResponse: 包含服務狀態、模型資訊和可用性的健康檢查回應
        
    Raises:
        HTTPException: 當服務未初始化（503）或發生內部錯誤（500）時拋出
        
    Examples:
        ```bash
        curl -X GET http://localhost:8021/health
        ```
        
        正常回應:
        ```json
        {
            "status": "healthy",
            "model": "HuggingFaceTB/SmolLM2-135M-Instruct",
            "available": true,
            "message": "SmolLM2 AI Service is running normally"
        }
        ```
        
    Note:
        - 狀態碼 200：服務正常運行
        - 狀態碼 503：服務不可用或未初始化
        - 狀態碼 500：內部伺服器錯誤
    """
    try:
        # 檢查 AI 服務是否已初始化
        if not ai_service:
            raise HTTPException(status_code=503, detail="AI Service not initialized")
        
        # 獲取服務健康狀態
        health_status = ai_service.get_health_status()
        
        # 根據健康狀態回傳相應結果
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

@app.get("/readme", response_class=PlainTextResponse)
async def get_readme() -> str:
    """
    獲取服務 README 文檔。
    
    本端點提供 markdown 格式的服務文檔，包含完整的 API 使用說明、
    配置選項和故障排除指南。
    
    Returns:
        str: README.md 文件的內容（text/markdown 格式）
        
    Raises:
        HTTPException: 當 README 文件不存在時回傳 404 錯誤
        
    Examples:
        ```bash
        curl -X GET http://localhost:8021/readme
        ```
        
    Note:
        - 回應內容類型為 text/markdown; charset=utf-8
        - 適用於文檔查看和服務說明
    """
    try:
        logger.info('📖 Serving LLM Service README')
        
        readme_path = Path(__file__).parent / "README.md"
        
        if not readme_path.exists():
            logger.error('❌ README.md file not found')
            raise HTTPException(status_code=404, detail="README.md not found")
            
        readme_content = readme_path.read_text(encoding='utf-8')
        logger.debug('✅ README content served successfully')
        
        return PlainTextResponse(
            content=readme_content,
            media_type="text/markdown; charset=utf-8"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'❌ Failed to serve README: {e}')
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate", response_model=GenerateResponse)
async def generate_response(request: GenerateRequest) -> GenerateResponse:
    """
    產生單輪文字回應。
    
    本端點處理單次文字生成請求，不保留對話歷史。適用於獨立的文字生成任務，
    如文章摘要、問答、文字翻譯等場景。
    
    Args:
        request (GenerateRequest): 包含提示詞、RAG 設定和圖像 URL 的請求物件
            - prompt (str): 用戶輸入的提示詞
            - use_rag (bool): 是否使用 RAG 檢索增強生成，預設為 False
            - image_url (Optional[str]): 圖像 URL（SmolLM2 不支援，會被忽略）
    
    Returns:
        GenerateResponse: 包含生成結果、來源資料和模型資訊的回應物件
        
    Raises:
        HTTPException: 
            - 503: AI 服務不可用
            - 500: 生成過程發生錯誤
    
    Examples:
        ```bash
        curl -X POST http://localhost:8021/generate \
             -H "Content-Type: application/json" \
             -d '{"prompt":"什麼是人工智慧？","use_rag":false}'
        ```
        
        使用 RAG 檢索:
        ```bash
        curl -X POST http://localhost:8021/generate \
             -H "Content-Type: application/json" \
             -d '{"prompt":"解釋量子計算","use_rag":true}'
        ```
        
    Note:
        - 單輪對話不保留歷史記錄，每次請求都是獨立的
        - RAG 功能需要先上傳相關文檔到向量資料庫
        - 圖像處理功能在 SmolLM2-135M 中不被支援
    """
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
async def conversational_response(request: ConversationalRequest) -> GenerateResponse:
    """
    產生具記憶功能的對話回應。
    
    本端點支援多輪對話，能夠記住之前的對話內容並據此生成連貫的回應。
    僅在使用 LangChain 版本的服務時才具備完整的記憶功能。
    
    Args:
        request (ConversationalRequest): 包含提示詞、RAG 設定和圖像 URL 的對話請求
            - prompt (str): 用戶當前輸入的訊息
            - use_rag (bool): 是否結合 RAG 檢索，預設為 False  
            - image_url (Optional[str]): 圖像 URL（目前不支援）
    
    Returns:
        GenerateResponse: 包含對話回應、相關來源和模型資訊
        
    Raises:
        HTTPException:
            - 503: AI 服務不可用或未初始化
            - 500: 對話生成過程發生錯誤
    
    Examples:
        第一輪對話:
        ```bash
        curl -X POST http://localhost:8021/conversational \
             -H "Content-Type: application/json" \
             -d '{"prompt":"你好，我是小明","use_rag":false}'
        ```
        
        後續對話（會記住之前提到的名字）:
        ```bash
        curl -X POST http://localhost:8021/conversational \
             -H "Content-Type: application/json" \
             -d '{"prompt":"我剛才說我叫什麼名字？","use_rag":false}'
        ```
        
    Note:
        - 對話記憶僅在 LangChain 版本中有效
        - Simple 版本會將每次請求視為獨立對話
        - 記憶功能保留最近 10 條訊息（5 輪對話）
        - 可透過 /memory/reset 端點清除對話記憶
    """
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
async def stream_generate(request: GenerateRequest) -> StreamingResponse:
    """
    串流文字生成回應。
    
    本端點提供即時文字生成服務，以串流方式逐步輸出生成內容，
    提升用戶體驗並減少等待時間。適用於需要即時回饋的場景。
    
    Args:
        request (GenerateRequest): 串流生成請求物件
            - prompt (str): 用戶輸入的提示詞
            - use_rag (bool): RAG 設定（串流模式下暂不支援）
            - image_url (Optional[str]): 圖像 URL（目前不支援）
    
    Returns:
        StreamingResponse: SSE (Server-Sent Events) 格式的串流回應
        
    Raises:
        HTTPException:
            - 503: AI 服務不可用
            - 500: 串流生成過程發生錯誤
    
    Examples:
        JavaScript 串流處理:
        ```javascript
        fetch('http://localhost:8021/stream', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({prompt: '說一個故事', use_rag: false})
        }).then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            function readStream() {
                return reader.read().then(({done, value}) => {
                    if (done) return;
                    const chunk = decoder.decode(value);
                    console.log(chunk); // 處理每個文字區塊
                    return readStream();
                });
            }
            readStream();
        });
        ```
        
        cURL 串流請求:
        ```bash
        curl -X POST http://localhost:8021/stream \
             -H "Content-Type: application/json" \
             -d '{"prompt":"寫一首詩","use_rag":false}' \
             --no-buffer
        ```
        
    Note:
        - 串流輸出以 "data: " 開頭，結束時發送 "data: [DONE]"
        - 由於 SmolLM2 不原生支援串流，此實現為模擬串流
        - 串流回應使用 text/plain 媒體類型
        - 設定 Cache-Control 和 Connection 標頭以保持連線
    """
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
async def upload_documents(request: DocumentUploadRequest) -> Dict[str, Any]:
    """
    上傳文件到 RAG 系統。
    
    本端點將文本文件切分成小區塊並建立向量嵌入，存儲到 Chroma 向量資料庫中。
    這些文件將用於 RAG 檢索增強生成，提供更精確的上下文資訊。
    
    Args:
        request (DocumentUploadRequest): 文件上傳請求物件
            - documents (List[str]): 要上傳的文本文件列表
    
    Returns:
        Dict[str, Any]: 上傳結果資訊
            - success (bool): 是否成功上傳
            - message (str): 回應訊息
            - documents_added (int): 成功添加的文件數量
        
    Raises:
        HTTPException:
            - 503: AI 服務不可用或向量資料庫未初始化
            - 500: 文件處理或上傳過程發生錯誤
    
    Examples:
        單一文件上傳:
        ```bash
        curl -X POST http://localhost:8021/documents \
             -H "Content-Type: application/json" \
             -d '{"documents":["人工智慧是模擬人類智能的技術..."]}'        
        ```
        
        多个文件上傳:
        ```bash
        curl -X POST http://localhost:8021/documents \
             -H "Content-Type: application/json" \
             -d '{"documents":["文件1內容...","文件2內容..."]}'
        ```
        
        成功回應:
        ```json
        {
            "success": true,
            "message": "Successfully added 2 documents",
            "documents_added": 2
        }
        ```
        
    Note:
        - 文件會被自動切分成 1000 字符的區塊，重疊 200 字符
        - 上傳後的文件會永久存儲在 ./chroma_db 目錄中
        - 建議在上傳大量文件前先測試少量文件
        - 支援的文件格式為純文本，不支援 PDF、Word 等格式
    """
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

@app.post("/memory/reset")
async def reset_memory() -> Dict[str, Any]:
    """
    重置對話記憶（僅 LangChain 版本支援）。
    
    本端點用於清除所有對話歷史記錄，重新開始一段全新的對話。
    只有在使用 LangChain 版本的服務時才有效，Simple 版本沒有記憶功能。
    
    Returns:
        Dict[str, Any]: 操作結果資訊
            - success (bool): 是否成功重置
            - message (str): 操作結果說明
        
    Raises:
        HTTPException:
            - 503: AI 服務不可用
            - 500: 記憶重置過程發生錯誤
    
    Examples:
        ```bash
        curl -X POST http://localhost:8021/memory/reset
        ```
        
        LangChain 版本成功回應:
        ```json
        {
            "success": true,
            "message": "Conversation memory reset successfully"
        }
        ```
        
        Simple 版本回應:
        ```json
        {
            "success": false,
            "message": "Memory reset not supported in current service"
        }
        ```
        
    Note:
        - 這個操作是不可逆的，重置後無法恢復之前的對話內容
        - 建議在開始新話題或對話內容過多時使用
        - 重置後的下一次 /conversational 請求將被視為全新對話
    """
    try:
        if not ai_service:
            raise HTTPException(status_code=503, detail="AI Service not available")
        
        # 檢查是否是 LangChain 服務
        if hasattr(ai_service, 'reset_memory'):
            ai_service.reset_memory()
            return {"success": True, "message": "Conversation memory reset successfully"}
        else:
            return {"success": False, "message": "Memory reset not supported in current service"}
    except Exception as e:
        logger.error(f"Memory reset failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/memory/history")
async def get_conversation_history() -> Dict[str, Any]:
    """
    獲取對話歷史（僅 LangChain 版本支援）。
    
    本端點返回當前對話階段中的所有歷史訊息，包含用戶輸入和 AI 回應。
    這個功能只在 LangChain 版本中可用，用於調試和理解對話上下文。
    
    Returns:
        Dict[str, Any]: 對話歷史資訊
            - success (bool): 是否成功獲取歷史
            - history (List[Dict]): 對話記錄列表，每個記錄包含 role 和 content
            - message (str): 狀態說明（當不支援時）
        
    Raises:
        HTTPException:
            - 503: AI 服務不可用
            - 500: 獲取歷史過程發生錯誤
    
    Examples:
        ```bash
        curl -X GET http://localhost:8021/memory/history
        ```
        
        LangChain 版本成功回應:
        ```json
        {
            "success": true,
            "history": [
                {"role": "human", "content": "你好，我是小明"},
                {"role": "ai", "content": "你好小明！很高興認識你。"},
                {"role": "human", "content": "我剛才說我叫什麼？"},
                {"role": "ai", "content": "你剛才說你叫小明。"}
            ]
        }
        ```
        
        Simple 版本回應:
        ```json
        {
            "success": false,
            "message": "Conversation history not supported in current service"
        }
        ```
        
    Note:
        - 歷史記錄按時間順序排列，最新的訊息在最後
        - role 欄位值為 "human" 或 "ai"，分別代表用戶輸入和 AI 回應
        - 此端點主要用於調試和監控對話狀態
        - 對話歷史在服務重啟後會被清除
    """
    try:
        if not ai_service:
            raise HTTPException(status_code=503, detail="AI Service not available")
        
        # 檢查是否是 LangChain 服務
        if hasattr(ai_service, 'get_conversation_history'):
            history = ai_service.get_conversation_history()
            return {
                "success": True, 
                "history": [{"role": msg.type, "content": msg.content} for msg in history]
            }
        else:
            return {"success": False, "message": "Conversation history not supported in current service"}
    except Exception as e:
        logger.error(f"Get conversation history failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================
# MCP (Model Context Protocol) 端點
# ==============================================

@app.post("/mcp/query", response_model=NaturalLanguageQueryResponse)
async def natural_language_query(request: NaturalLanguageQueryRequest) -> NaturalLanguageQueryResponse:
    """
    自然語言查詢微服務數據庫。
    
    本端點允許用戶使用自然語言來操作微服務資料庫，例如：
    - "給我看用戶 john123 的偏好設定"
    - "把所有用戶的主題改為深色模式" 
    - "有多少用戶使用淺色主題？"
    
    Args:
        request (NaturalLanguageQueryRequest): 自然語言查詢請求
            - query (str): 用戶的自然語言查詢
            - use_conversation (bool): 是否使用對話記憶
            - target_service (Optional[str]): 指定目標微服務
            
    Returns:
        NaturalLanguageQueryResponse: 包含處理結果的回應
        
    Raises:
        HTTPException:
            - 503: MCP 服務不可用
            - 400: 查詢請求無效
            - 500: 處理過程發生錯誤
            
    Examples:
        ```bash
        curl -X POST http://localhost:8021/mcp/query \
             -H "Content-Type: application/json" \
             -d '{
                 "query": "給我看用戶 admin 的偏好設定",
                 "use_conversation": false
             }'
        ```
        
        成功回應:
        ```json
        {
            "success": true,
            "response": "用戶 admin 的偏好設定如下：主題為深色模式，語言為繁體中文...",
            "tool_used": "get_user_preferences",
            "service_called": "general-service",
            "raw_result": {...}
        }
        ```
    """
    try:
        # 檢查 MCP 處理器是否可用
        if not mcp_processor:
            raise HTTPException(
                status_code=503, 
                detail="MCP service not available. Please check if MCP services are properly initialized."
            )
        
        # 驗證查詢內容
        if not request.query or len(request.query.strip()) == 0:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        logger.info(f"Processing natural language query: {request.query[:100]}...")
        
        # 處理自然語言查詢
        result = await mcp_processor.process_query(
            user_query=request.query,
            use_conversation=request.use_conversation
        )
        
        if result["success"]:
            return NaturalLanguageQueryResponse(
                success=True,
                response=result["response"],
                tool_used=result.get("tool_used"),
                service_called=result.get("service_called"),
                raw_result=result.get("tool_result")
            )
        else:
            return NaturalLanguageQueryResponse(
                success=False,
                response="很抱歉，我無法處理這個查詢。",
                error=result.get("error", "Unknown error occurred")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Natural language query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mcp/tools", response_model=MCPToolListResponse) 
async def get_mcp_tools() -> MCPToolListResponse:
    """
    獲取所有可用的 MCP 工具列表。
    
    本端點返回系統中註冊的所有 MCP 工具，包括工具名稱、描述、
    參數規格和所屬服務等資訊。用於調試和工具發現。
    
    Returns:
        MCPToolListResponse: 工具列表回應
        
    Examples:
        ```bash
        curl -X GET http://localhost:8021/mcp/tools
        ```
        
        回應範例:
        ```json
        {
            "success": true,
            "tools": [
                {
                    "name": "get_user_preferences",
                    "description": "獲取用戶偏好設定",
                    "service": "general-service",
                    "inputSchema": {...}
                }
            ],
            "total": 5,
            "services": ["general-service", "rbac-service"]
        }
        ```
    """
    try:
        if not mcp_registry:
            raise HTTPException(status_code=503, detail="MCP registry not available")
        
        available_tools = mcp_registry.get_available_tools()
        services = list(set(tool.get('service', 'unknown') for tool in available_tools))
        
        return MCPToolListResponse(
            success=True,
            tools=available_tools,
            total=len(available_tools),
            services=services
        )
        
    except Exception as e:
        logger.error(f"Get MCP tools failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mcp/status", response_model=MCPStatusResponse)
async def get_mcp_status() -> MCPStatusResponse:
    """
    獲取 MCP 服務整體狀態。
    
    本端點提供 MCP 功能的健康檢查，包括各個微服務的連接狀態、
    可用工具數量等資訊。
    
    Returns:
        MCPStatusResponse: MCP 服務狀態回應
        
    Examples:
        ```bash
        curl -X GET http://localhost:8021/mcp/status
        ```
    """
    try:
        # 檢查 MCP 是否啟用
        if not mcp_processor or not mcp_registry:
            return MCPStatusResponse(
                success=True,
                mcp_enabled=False,
                total_tools=0,
                total_services=0,
                services=[],
                message="MCP services are not initialized or disabled"
            )
        
        # 獲取服務資訊
        services_info = []
        for service_name, service_data in mcp_registry.services.items():
            services_info.append(MCPServiceStatus(
                service_name=service_name,
                service_url=service_data['url'],
                available=True,  # TODO: 實際健康檢查
                tool_count=len(service_data['tools']),
                last_check=None  # TODO: 實際檢查時間
            ))
        
        total_tools = len(mcp_registry.get_available_tools())
        
        return MCPStatusResponse(
            success=True,
            mcp_enabled=True,
            total_tools=total_tools,
            total_services=len(services_info),
            services=services_info,
            message=f"MCP is running with {len(services_info)} services and {total_tools} tools"
        )
        
    except Exception as e:
        logger.error(f"Get MCP status failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================
# WebSocket 端點
# ==============================================

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: Optional[str] = Query(None, description="用戶ID")
):
    """
    主要 WebSocket 端點。
    
    支援即時對話、串流生成和 MCP 自然語言查詢。
    
    Args:
        websocket: WebSocket 連接
        user_id: 可選的用戶ID，用於會話管理
        
    Message Types:
        - generate: 單輪生成
        - conversational: 對話生成 
        - stream: 串流生成
        - mcp_query: MCP 自然語言查詢
        
    Example:
        JavaScript WebSocket 連接:
        ```javascript
        const ws = new WebSocket('ws://localhost:8021/ws?user_id=john123');
        
        ws.onopen = () => {
            // 發送對話消息
            ws.send(JSON.stringify({
                type: 'conversational',
                data: {
                    prompt: '你好，我是小明',
                    use_rag: false
                },
                user_id: 'john123',
                conversation_id: 'conv_001'
            }));
        };
        
        ws.onmessage = (event) => {
            const response = JSON.parse(event.data);
            console.log('收到回應:', response);
        };
        ```
        
        MCP 自然語言查詢:
        ```javascript
        ws.send(JSON.stringify({
            type: 'mcp_query',
            data: {
                query: '給我看用戶 admin 的偏好設定',
                use_conversation: false
            }
        }));
        ```
    """
    handler = get_websocket_handler()
    if not handler:
        await websocket.close(code=1011, reason="WebSocket service not available")
        return
        
    await handler.handle_connection(websocket, user_id)

@app.websocket("/ws/chat")
async def chat_websocket_endpoint(
    websocket: WebSocket,
    user_id: Optional[str] = Query(None, description="用戶ID"),
    conversation_id: Optional[str] = Query(None, description="對話ID")
):
    """
    專用聊天 WebSocket 端點。
    
    專門處理對話生成，自動管理對話記憶。
    
    Args:
        websocket: WebSocket 連接
        user_id: 用戶ID
        conversation_id: 對話ID
        
    Message Format:
        ```json
        {
            "prompt": "用戶輸入的消息",
            "use_rag": false
        }
        ```
        
    Response Format:
        ```json
        {
            "type": "response",
            "success": true,
            "data": {
                "response": "AI 回應內容",
                "sources": [],
                "model": "SmolLM2-135M"
            },
            "timestamp": "2024-01-01T00:00:00"
        }
        ```
    """
    handler = get_websocket_handler()
    if not handler:
        await websocket.close(code=1011, reason="WebSocket service not available")
        return
        
    # 簡化聊天處理 - 自動設置為 conversational 模式
    await websocket.accept()
    connection_id = f"chat_{user_id or 'anonymous'}"
    
    try:
        while True:
            try:
                data = await websocket.receive_json()
                
                # 包裝為標準消息格式
                message_data = {
                    "type": "conversational",
                    "data": data,
                    "user_id": user_id,
                    "conversation_id": conversation_id or "default"
                }
                
                # 使用標準處理器
                from websocket_server import WebSocketMessage
                message = WebSocketMessage(**message_data)
                await handler._handle_conversational(connection_id, message, user_id)
                
            except WebSocketDisconnect:
                logger.info(f"Chat WebSocket disconnected: {connection_id}")
                break
            except Exception as e:
                logger.error(f"Chat WebSocket error: {e}")
                await websocket.send_json({
                    "type": "error",
                    "success": False,
                    "error": str(e)
                })
                
    except Exception as e:
        logger.error(f"Chat WebSocket connection error: {e}")

@app.websocket("/ws/stream")
async def stream_websocket_endpoint(
    websocket: WebSocket,
    user_id: Optional[str] = Query(None, description="用戶ID")
):
    """
    專用串流 WebSocket 端點。
    
    提供即時串流文字生成。
    
    Args:
        websocket: WebSocket 連接
        user_id: 用戶ID
        
    Message Format:
        ```json
        {
            "prompt": "用戶輸入的提示詞"
        }
        ```
        
    Response Types:
        - stream_start: 串流開始
        - stream_chunk: 串流區塊
        - stream_end: 串流結束
        - stream_error: 串流錯誤
    """
    handler = get_websocket_handler()
    if not handler:
        await websocket.close(code=1011, reason="WebSocket service not available")
        return
        
    await websocket.accept()
    connection_id = f"stream_{user_id or 'anonymous'}"
    
    try:
        while True:
            try:
                data = await websocket.receive_json()
                
                # 包裝為標準消息格式
                message_data = {
                    "type": "stream",
                    "data": data,
                    "user_id": user_id
                }
                
                from websocket_server import WebSocketMessage
                message = WebSocketMessage(**message_data)
                await handler._handle_stream(connection_id, message)
                
            except WebSocketDisconnect:
                logger.info(f"Stream WebSocket disconnected: {connection_id}")
                break
            except Exception as e:
                logger.error(f"Stream WebSocket error: {e}")
                await websocket.send_json({
                    "type": "stream_error",
                    "success": False,
                    "error": str(e)
                })
                
    except Exception as e:
        logger.error(f"Stream WebSocket connection error: {e}")

if __name__ == "__main__":
    """
    應用程式進入點。
    
    當直接執行此腳本時啟動 FastAPI 開發伺服器。支援熱重載和詳細日誌輸出，
    方便開發和測試 AI 服務功能。
    
    環境變數:
        PORT: 伺服器端口號，預設為 8021
        USE_LANGCHAIN: 選擇服務類型 (true/false)，預設為 true
    
    Examples:
        直接啟動：
        ```bash
        python main.py
        ```
        
        指定端口：
        ```bash
        PORT=8022 python main.py
        ```
        
        使用 Simple 服務：
        ```bash
        USE_LANGCHAIN=false python main.py
        ```
        
    Note:
        - 開發模式啟用熱重載（reload=True）
        - 監聽所有介面 (0.0.0.0)，適用於容器化部署
        - 生產環境建議使用 Gunicorn + Uvicorn Workers
    """
    # 從環境變數獲取端口號，預設為 8021
    port = int(os.getenv("PORT", "8021"))
    
    # 啟動 Uvicorn ASGI 伺服器
    uvicorn.run(
        "main:app",           # FastAPI 應用程式模組路徑
        host="0.0.0.0",       # 監聽所有介面，支援容器化部署
        port=port,            # 伺服器端口
        reload=True,          # 開啟熱重載，檔案變更時自動重啟
        log_level="info"      # 設定日誌級別為 INFO
    )