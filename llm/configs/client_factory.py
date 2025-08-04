from .langchain_client import LangChainVisionClient
from .llm_config import DEFAULT_LLM_CONFIG

# Global client instance
langchain_client = LangChainVisionClient(DEFAULT_LLM_CONFIG)