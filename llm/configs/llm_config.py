import torch
from dataclasses import dataclass
from typing import Optional


@dataclass
class ModelConfig:
    model_name: str = "google/gemma-3n-E2B-it"
    task: str = "image-text-to-text"
    max_new_tokens: int = 512
    temperature: float = 0.7
    top_p: float = 0.8
    repetition_penalty: float = 1.1
    do_sample: bool = True
    trust_remote_code: bool = True


@dataclass
class EmbeddingConfig:
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2"


@dataclass
class VectorStoreConfig:
    persist_directory: str = "./chroma_db"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    retrieval_k: int = 3


@dataclass
class LLMConfig:
    model: ModelConfig = None
    embedding: EmbeddingConfig = None
    vector_store: VectorStoreConfig = None
    device: Optional[str] = None
    
    def __post_init__(self):
        if self.model is None:
            self.model = ModelConfig()
        if self.embedding is None:
            self.embedding = EmbeddingConfig()
        if self.vector_store is None:
            self.vector_store = VectorStoreConfig()
        if self.device is None:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"


# Default configuration instance
DEFAULT_LLM_CONFIG = LLMConfig()