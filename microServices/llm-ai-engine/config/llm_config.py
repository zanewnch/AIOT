from dataclasses import dataclass
from typing import Optional
import torch
import os

@dataclass
class ModelConfig:
    model_name: str = "HuggingFaceTB/SmolLM2-135M-Instruct"
    task: str = "text-generation"
    trust_remote_code: bool = True
    max_new_tokens: int = 512
    max_length: int = 1024
    temperature: float = 0.2
    top_p: float = 0.9
    do_sample: bool = True
    pad_token_id: int = None  # 會在初始化時設定

@dataclass
class EmbeddingConfig:
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    dimension: int = 384

@dataclass
class VectorStoreConfig:
    persist_directory: str = "./chroma_db"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    retrieval_k: int = 4

@dataclass
class LLMConfig:
    model: ModelConfig
    embedding: EmbeddingConfig
    vector_store: VectorStoreConfig
    device: str
    
    def __init__(
        self,
        model: Optional[ModelConfig] = None,
        embedding: Optional[EmbeddingConfig] = None,
        vector_store: Optional[VectorStoreConfig] = None,
        device: Optional[str] = None
    ):
        self.model = model or ModelConfig()
        self.embedding = embedding or EmbeddingConfig()
        self.vector_store = vector_store or VectorStoreConfig()
        
        # Auto-detect device
        if device is None:
            if torch.cuda.is_available():
                self.device = "cuda"
            elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                self.device = "mps"
            else:
                self.device = "cpu"
        else:
            self.device = device

# Default configuration
DEFAULT_LLM_CONFIG = LLMConfig()