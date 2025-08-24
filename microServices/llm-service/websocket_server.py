"""
LLM AI Engine WebSocket Server
提供即時對話、串流生成和 MCP 查詢的 WebSocket 端點

Author: AIOT Team
Version: 1.0.0
"""

import json
import asyncio
import logging
from typing import Dict, Any, Optional, Set
from datetime import datetime
import uuid

from fastapi import WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel, ValidationError

from services.simple_ai_service import SimpleAIService
from services.langchain_ai_service import LangChainAIService
from mcp_integration.mcp_client import NaturalLanguageQueryProcessor, mcp_registry
from database.postgres_connection import postgres_manager

logger = logging.getLogger(__name__)

class WebSocketMessage(BaseModel):
    """WebSocket 消息格式"""
    type: str  # 'generate', 'conversational', 'mcp_query', 'stream'
    data: Dict[str, Any]
    message_id: Optional[str] = None
    user_id: Optional[str] = None
    conversation_id: Optional[str] = None

class WebSocketResponse(BaseModel):
    """WebSocket 回應格式"""
    type: str  # 'response', 'stream_chunk', 'error', 'status'
    success: bool = True
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    error: Optional[str] = None
    message_id: Optional[str] = None
    timestamp: str = datetime.now().isoformat()

class ConnectionManager:
    """WebSocket 連接管理器"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_sessions: Dict[str, Set[str]] = {}  # user_id -> set of connection_ids
        
    async def connect(self, websocket: WebSocket, connection_id: str, user_id: Optional[str] = None) -> None:
        """建立 WebSocket 連接"""
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        
        if user_id:
            if user_id not in self.user_sessions:
                self.user_sessions[user_id] = set()
            self.user_sessions[user_id].add(connection_id)
            
        logger.info(f"✅ WebSocket connected: {connection_id} (user: {user_id})")
        
    def disconnect(self, connection_id: str, user_id: Optional[str] = None) -> None:
        """斷開 WebSocket 連接"""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
            
        if user_id and user_id in self.user_sessions:
            self.user_sessions[user_id].discard(connection_id)
            if not self.user_sessions[user_id]:
                del self.user_sessions[user_id]
                
        logger.info(f"❌ WebSocket disconnected: {connection_id} (user: {user_id})")
        
    async def send_message(self, connection_id: str, message: WebSocketResponse) -> bool:
        """發送消息給特定連接"""
        if connection_id in self.active_connections:
            try:
                await self.active_connections[connection_id].send_text(message.model_dump_json())
                return True
            except Exception as e:
                logger.error(f"❌ Failed to send message to {connection_id}: {e}")
                return False
        return False
        
    async def broadcast_to_user(self, user_id: str, message: WebSocketResponse) -> int:
        """向用戶的所有連接廣播消息"""
        sent_count = 0
        if user_id in self.user_sessions:
            for connection_id in list(self.user_sessions[user_id]):
                if await self.send_message(connection_id, message):
                    sent_count += 1
                else:
                    # 清理失效連接
                    self.disconnect(connection_id, user_id)
        return sent_count

class LLMWebSocketHandler:
    """LLM WebSocket 處理器"""
    
    def __init__(self, ai_service: Any, mcp_processor: Optional[NaturalLanguageQueryProcessor]):
        self.ai_service = ai_service
        self.mcp_processor = mcp_processor
        self.connection_manager = ConnectionManager()
        
    async def handle_connection(self, websocket: WebSocket, user_id: Optional[str] = None) -> None:
        """處理 WebSocket 連接"""
        connection_id = str(uuid.uuid4())
        
        try:
            await self.connection_manager.connect(websocket, connection_id, user_id)
            
            # 發送歡迎消息
            welcome_message = WebSocketResponse(
                type="status",
                message="WebSocket 連接成功，可以開始對話了！",
                data={"connection_id": connection_id, "user_id": user_id}
            )
            await self.connection_manager.send_message(connection_id, welcome_message)
            
            # 消息處理循環
            while True:
                try:
                    # 接收消息
                    raw_message = await websocket.receive_text()
                    
                    try:
                        message_data = json.loads(raw_message)
                        message = WebSocketMessage(**message_data)
                    except (json.JSONDecodeError, ValidationError) as e:
                        error_response = WebSocketResponse(
                            type="error",
                            success=False,
                            error=f"無效的消息格式: {str(e)}"
                        )
                        await self.connection_manager.send_message(connection_id, error_response)
                        continue
                    
                    # 設置消息 ID
                    if not message.message_id:
                        message.message_id = str(uuid.uuid4())
                    
                    # 處理消息
                    await self._handle_message(connection_id, message, user_id)
                    
                except WebSocketDisconnect:
                    logger.info(f"WebSocket 用戶主動斷開連接: {connection_id}")
                    break
                except Exception as e:
                    logger.error(f"WebSocket 消息處理錯誤: {e}")
                    error_response = WebSocketResponse(
                        type="error",
                        success=False,
                        error=f"處理消息時發生錯誤: {str(e)}",
                        message_id=getattr(message, 'message_id', None) if 'message' in locals() else None
                    )
                    await self.connection_manager.send_message(connection_id, error_response)
                    
        except Exception as e:
            logger.error(f"WebSocket 連接處理錯誤: {e}")
        finally:
            self.connection_manager.disconnect(connection_id, user_id)
            
    async def _handle_message(self, connection_id: str, message: WebSocketMessage, user_id: Optional[str]) -> None:
        """處理具體的消息類型"""
        try:
            if message.type == "generate":
                await self._handle_generate(connection_id, message)
            elif message.type == "conversational":
                await self._handle_conversational(connection_id, message, user_id)
            elif message.type == "stream":
                await self._handle_stream(connection_id, message)
            elif message.type == "mcp_query":
                await self._handle_mcp_query(connection_id, message, user_id)
            else:
                error_response = WebSocketResponse(
                    type="error",
                    success=False,
                    error=f"不支援的消息類型: {message.type}",
                    message_id=message.message_id
                )
                await self.connection_manager.send_message(connection_id, error_response)
                
        except Exception as e:
            logger.error(f"處理消息類型 {message.type} 時發生錯誤: {e}")
            error_response = WebSocketResponse(
                type="error",
                success=False,
                error=f"處理 {message.type} 請求時發生錯誤: {str(e)}",
                message_id=message.message_id
            )
            await self.connection_manager.send_message(connection_id, error_response)
            
    async def _handle_generate(self, connection_id: str, message: WebSocketMessage) -> None:
        """處理單輪生成請求"""
        if not self.ai_service:
            raise HTTPException(status_code=503, detail="AI Service not available")
            
        prompt = message.data.get("prompt", "")
        use_rag = message.data.get("use_rag", False)
        
        result = self.ai_service.generate_response(
            prompt=prompt,
            use_rag=use_rag
        )
        
        response = WebSocketResponse(
            type="response",
            success=result["success"],
            data={
                "response": result.get("response", ""),
                "sources": result.get("sources", []),
                "model": result.get("model", "")
            } if result["success"] else None,
            error=result.get("error") if not result["success"] else None,
            message_id=message.message_id
        )
        
        await self.connection_manager.send_message(connection_id, response)
        
    async def _handle_conversational(self, connection_id: str, message: WebSocketMessage, user_id: Optional[str]) -> None:
        """處理對話生成請求"""
        if not self.ai_service:
            raise HTTPException(status_code=503, detail="AI Service not available")
            
        prompt = message.data.get("prompt", "")
        use_rag = message.data.get("use_rag", False)
        
        # 儲存到資料庫
        if user_id and hasattr(postgres_manager, 'create_message'):
            try:
                await postgres_manager.create_message(
                    conversation_id=message.conversation_id or "default",
                    role="human",
                    content=prompt,
                    message_id=message.message_id
                )
            except Exception as e:
                logger.warning(f"Failed to save user message to database: {e}")
        
        result = self.ai_service.generate_conversational_response(
            prompt=prompt,
            use_rag=use_rag
        )
        
        # 儲存 AI 回應到資料庫
        if user_id and result["success"] and hasattr(postgres_manager, 'create_message'):
            try:
                await postgres_manager.create_message(
                    conversation_id=message.conversation_id or "default",
                    role="assistant", 
                    content=result.get("response", ""),
                    message_id=str(uuid.uuid4())
                )
            except Exception as e:
                logger.warning(f"Failed to save AI response to database: {e}")
        
        response = WebSocketResponse(
            type="response",
            success=result["success"],
            data={
                "response": result.get("response", ""),
                "sources": result.get("sources", []),
                "model": result.get("model", "")
            } if result["success"] else None,
            error=result.get("error") if not result["success"] else None,
            message_id=message.message_id
        )
        
        await self.connection_manager.send_message(connection_id, response)
        
    async def _handle_stream(self, connection_id: str, message: WebSocketMessage) -> None:
        """處理串流生成請求"""
        if not self.ai_service:
            raise HTTPException(status_code=503, detail="AI Service not available")
            
        prompt = message.data.get("prompt", "")
        
        try:
            # 發送串流開始通知
            start_response = WebSocketResponse(
                type="stream_start",
                message="開始串流生成...",
                message_id=message.message_id
            )
            await self.connection_manager.send_message(connection_id, start_response)
            
            # 串流生成
            full_response = ""
            for chunk in self.ai_service.stream_generate(prompt=prompt):
                full_response += chunk
                
                chunk_response = WebSocketResponse(
                    type="stream_chunk",
                    data={"chunk": chunk, "full_response": full_response},
                    message_id=message.message_id
                )
                await self.connection_manager.send_message(connection_id, chunk_response)
                
                # 添加小延遲以模擬真實串流
                await asyncio.sleep(0.05)
            
            # 發送串流完成通知
            end_response = WebSocketResponse(
                type="stream_end",
                data={"full_response": full_response},
                message="串流生成完成",
                message_id=message.message_id
            )
            await self.connection_manager.send_message(connection_id, end_response)
            
        except Exception as e:
            error_response = WebSocketResponse(
                type="stream_error",
                success=False,
                error=f"串流生成錯誤: {str(e)}",
                message_id=message.message_id
            )
            await self.connection_manager.send_message(connection_id, error_response)
            
    async def _handle_mcp_query(self, connection_id: str, message: WebSocketMessage, user_id: Optional[str]) -> None:
        """處理 MCP 自然語言查詢請求"""
        if not self.mcp_processor:
            error_response = WebSocketResponse(
                type="error",
                success=False,
                error="MCP 服務不可用",
                message_id=message.message_id
            )
            await self.connection_manager.send_message(connection_id, error_response)
            return
            
        query = message.data.get("query", "")
        use_conversation = message.data.get("use_conversation", False)
        
        if not query.strip():
            error_response = WebSocketResponse(
                type="error",
                success=False,
                error="查詢內容不能為空",
                message_id=message.message_id
            )
            await self.connection_manager.send_message(connection_id, error_response)
            return
            
        # 發送處理開始通知
        processing_response = WebSocketResponse(
            type="mcp_processing",
            message="正在處理自然語言查詢...",
            data={"query": query},
            message_id=message.message_id
        )
        await self.connection_manager.send_message(connection_id, processing_response)
        
        # 處理查詢
        result = await self.mcp_processor.process_query(
            user_query=query,
            use_conversation=use_conversation,
            user_id=user_id or "anonymous",
            conversation_id=message.conversation_id
        )
        
        response = WebSocketResponse(
            type="mcp_response",
            success=result["success"],
            data={
                "response": result["response"],
                "tool_used": result.get("tool_used"),
                "service_called": result.get("service_called"),
                "raw_result": result.get("tool_result")
            } if result["success"] else None,
            error=result.get("error") if not result["success"] else None,
            message_id=message.message_id
        )
        
        await self.connection_manager.send_message(connection_id, response)

# 全域 WebSocket 處理器實例
websocket_handler: Optional[LLMWebSocketHandler] = None

def initialize_websocket_handler(ai_service: Any, mcp_processor: Optional[NaturalLanguageQueryProcessor]) -> None:
    """初始化 WebSocket 處理器"""
    global websocket_handler
    websocket_handler = LLMWebSocketHandler(ai_service, mcp_processor)
    logger.info("✅ LLM WebSocket Handler initialized")

def get_websocket_handler() -> Optional[LLMWebSocketHandler]:
    """獲取 WebSocket 處理器實例"""
    return websocket_handler