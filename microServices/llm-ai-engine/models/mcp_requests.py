"""
MCP 相關的請求和回應模型。
用於自然語言查詢微服務資料庫操作。
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class NaturalLanguageQueryRequest(BaseModel):
    """自然語言查詢請求模型"""
    
    query: str = Field(
        ..., 
        description="用戶的自然語言查詢，例如：'給我看用戶 john123 的偏好設定'",
        min_length=1,
        max_length=1000
    )
    
    use_conversation: bool = Field(
        default=False,
        description="是否使用對話記憶模式"
    )
    
    target_service: Optional[str] = Field(
        default=None,
        description="指定目標微服務，如果為空則自動推斷。可選值：general, rbac, drone 等"
    )

class NaturalLanguageQueryResponse(BaseModel):
    """自然語言查詢回應模型"""
    
    success: bool = Field(
        ...,
        description="查詢是否成功"
    )
    
    response: str = Field(
        ...,
        description="AI 生成的自然語言回應"
    )
    
    tool_used: Optional[str] = Field(
        default=None,
        description="使用的 MCP 工具名稱"
    )
    
    service_called: Optional[str] = Field(
        default=None,
        description="調用的微服務名稱"
    )
    
    raw_result: Optional[Dict[str, Any]] = Field(
        default=None,
        description="微服務返回的原始資料"
    )
    
    error: Optional[str] = Field(
        default=None,
        description="錯誤訊息（如果有）"
    )

class MCPToolListResponse(BaseModel):
    """MCP 工具列表回應"""
    
    success: bool = Field(default=True)
    
    tools: List[Dict[str, Any]] = Field(
        ...,
        description="可用的 MCP 工具列表"
    )
    
    total: int = Field(
        ...,
        description="工具總數"
    )
    
    services: List[str] = Field(
        ...,
        description="已註冊的服務列表"
    )

class MCPServiceStatus(BaseModel):
    """MCP 服務狀態"""
    
    service_name: str = Field(..., description="服務名稱")
    service_url: str = Field(..., description="服務 URL")
    available: bool = Field(..., description="服務是否可用")
    tool_count: int = Field(..., description="該服務提供的工具數量")
    last_check: Optional[str] = Field(None, description="最後檢查時間")

class MCPStatusResponse(BaseModel):
    """MCP 整體狀態回應"""
    
    success: bool = Field(default=True)
    mcp_enabled: bool = Field(..., description="MCP 功能是否啟用")
    total_tools: int = Field(..., description="總工具數量")
    total_services: int = Field(..., description="總服務數量")
    services: List[MCPServiceStatus] = Field(..., description="各服務狀態")
    message: str = Field(..., description="狀態訊息")