from .langchain_client import LangChainQwenClient
from .llm_config import DEFAULT_LLM_CONFIG

# Global client instance
langchain_client = LangChainQwenClient(DEFAULT_LLM_CONFIG)