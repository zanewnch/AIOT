"""
AI 引擎配置套件。

本套件提供 SmolLM2 AI 引擎的完整配置管理系統，包含所有必要的
配置類別和預設參數設定。

主要組件:
- ModelConfig: SmolLM2 模型參數配置
- EmbeddingConfig: 文字嵌入模型配置  
- VectorStoreConfig: 向量資料庫配置
- LLMConfig: 統一配置管理類別
- DEFAULT_LLM_CONFIG: 預設配置實例

使用範例:
    ```python
    from config import DEFAULT_LLM_CONFIG, LLMConfig, ModelConfig
    
    # 使用預設配置
    config = DEFAULT_LLM_CONFIG
    
    # 自定義配置
    custom_config = LLMConfig(
        model=ModelConfig(max_new_tokens=100),
        device="cuda"
    )
    ```

Author: AIOT Team
Version: 2.0.0
"""

# Config package