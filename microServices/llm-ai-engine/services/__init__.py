"""
AI 服務套件。

本套件提供 SmolLM2 AI 引擎的核心服務實現，包含兩種不同的服務模式：
- SimpleAIService: 輕量級基礎推理服務
- LangChainAIService: 完整功能版本，支援對話記憶和 RAG
- AIService: 基礎抽象類別（僅在某些配置中使用）

主要功能:
- 文字生成與對話處理
- 串流回應生成
- 設備自動配置與模型載入
- 健康狀態監控
- 資源清理與管理

架構特點:
- 統一的服務介面設計
- 自動降級機制（LangChain -> Simple）
- 多設備支援（CPU/GPU/NPU）
- 容錯與錯誤處理
- 可插拔的 RAG 系統

使用範例:
    ```python
    from services import SimpleAIService, LangChainAIService
    from config import DEFAULT_LLM_CONFIG
    
    # 使用輕量級服務
    simple_service = SimpleAIService(DEFAULT_LLM_CONFIG)
    
    # 使用完整功能服務
    langchain_service = LangChainAIService(DEFAULT_LLM_CONFIG)
    ```

Author: AIOT Team
Version: 2.0.0
"""

# Services package