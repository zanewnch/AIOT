"""
API 模型套件。

本套件包含 SmolLM2 AI 引擎所有 API 端點的請求和回應模型定義。
使用 Pydantic 提供型別安全、自動驗證和 API 文檔生成功能。

主要模型:
- GenerateRequest: 單輪文字生成請求模型
- ConversationalRequest: 對話式生成請求模型  
- DocumentUploadRequest: 文檔上傳請求模型
- HealthResponse: 健康檢查回應模型
- GenerateResponse: 統一的生成回應模型

使用範例:
    ```python
    from models.requests import GenerateRequest, GenerateResponse
    
    # 建立請求模型
    request = GenerateRequest(
        prompt="什麼是人工智慧？",
        use_rag=False
    )
    
    # 處理回應模型
    response = GenerateResponse(
        success=True,
        response="人工智慧是...",
        sources=[],
        model="SmolLM2-135M-Instruct"
    )
    ```

Author: AIOT Team
Version: 2.0.0
"""

# Models package