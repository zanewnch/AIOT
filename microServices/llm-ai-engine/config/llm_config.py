"""
LLM AI 引擎配置模組。

本模組定義了 SmolLM2 AI 引擎的完整配置架構，包括：
- 模型配置：SmolLM2-135M-Instruct 參數設定
- 嵌入模型配置：向量化文本的嵌入參數 
- 向量資料庫配置：RAG 檢索系統的存儲設定
- 設備自動檢測：支援 CPU、GPU、NPU 推理加速

架構設計：
- 使用 dataclass 提供類型安全和預設值
- 自動檢測最佳推理設備（NPU > CUDA > MPS > CPU）
- 支援 Intel NPU 和 IPEX-LLM 加速
- 模組化配置便於測試和部署

Author: AIOT Team  
Version: 2.0.0
"""

from dataclasses import dataclass
from typing import Optional
import torch
import os
import platform

@dataclass
class ModelConfig:
    """
    SmolLM2 模型配置類別。
    
    定義 SmolLM2-135M-Instruct 模型的所有參數設定，包含模型識別、
    生成參數和令牌處理配置。這些參數已針對 CPU 推理進行優化。
    
    Attributes:
        model_name (str): HuggingFace 模型識別符，預設為 SmolLM2-135M-Instruct
        task (str): 模型任務類型，固定為文字生成
        trust_remote_code (bool): 是否信任遠程代碼，需要為 True 以支援模型
        max_new_tokens (int): 單次生成的最大令牌數，設為 50 以提高速度
        max_length (int): 輸入序列的最大長度，設為 512 以節省記憶體
        temperature (float): 控制生成随機性，0.7 提供平衡的創意性
        top_p (float): 核采樣參數，0.9 保持高質量輸出
        do_sample (bool): 是否使用採樣策略，啟用以增加多樣性
        pad_token_id (Optional[int]): 填充令牌 ID，在初始化時自動設定
    
    Note:
        - 這些參數已針對 CPU 推理和快速回應進行優化
        - max_new_tokens 設定較低可以減少等待時間
        - temperature 和 top_p 參數可根據應用場景進行調整
    """
    model_name: str = "HuggingFaceTB/SmolLM2-135M-Instruct"
    task: str = "text-generation"
    trust_remote_code: bool = True
    max_new_tokens: int = 50  # 減少生成長度以提高速度
    max_length: int = 512     # 減少輸入長度限制
    temperature: float = 0.7
    top_p: float = 0.9
    do_sample: bool = True
    pad_token_id: Optional[int] = None  # 會在初始化時設定

@dataclass
class EmbeddingConfig:
    """
    文字嵌入模型配置類別。
    
    定義用於 RAG 系統的文字向量化模型參數。使用 sentence-transformers 
    模型將文本轉換為數值向量，以支援語意相似性檢索。
    
    Attributes:
        model_name (str): Sentence Transformers 模型名稱，使用輕量級 MiniLM 模型
        dimension (int): 嵌入向量的維度，384 維度提供良好的性能平衡
    
    Note:
        - all-MiniLM-L6-v2 是一個快速且精確的多語言嵌入模型
        - 384 維度在效能和精度之間提供良好平衡
        - 支援中文和英文的語意與意理解
    """
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    dimension: int = 384

@dataclass
class VectorStoreConfig:
    """
    向量資料庫配置類別。
    
    定義 Chroma 向量資料庫的存儲和檢索參數，用於 RAG 系統中的
    文件存儲和相似性檢索。這些參數影響檢索精度和系統性能。
    
    Attributes:
        persist_directory (str): 向量資料庫的存儲目錄，預設為 "./chroma_db"
        chunk_size (int): 文件切分的區塊大小，1000 字符提供良好的上下文
        chunk_overlap (int): 相鄰區塊之間的重疊字符數，200 字符保持連接性
        retrieval_k (int): 每次檢索返回的最大文件數量，4 個平衡精度和性能
    
    Note:
        - persist_directory 在服務重啟後保持数據不消失
        - chunk_size 太小可能造成上下文不完整，太大可能影響檢索精度
        - chunk_overlap 幫助保持區塊之間的語意連貫性
        - retrieval_k 計量檢索成本，值越大檢索越全面但速度越慢
    """
    persist_directory: str = "./chroma_db"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    retrieval_k: int = 4

@dataclass
class LLMConfig:
    """
    LLM AI 引擎的主配置類別。
    
    統一管理所有子模組的配置，提供一個單一入點來配置整個 AI 引擎。
    支援自動設備檢測和智能優化選擇。
    
    Attributes:
        model (ModelConfig): SmolLM2 模型的配置參數
        embedding (EmbeddingConfig): 文字嵌入模型的配置參數
        vector_store (VectorStoreConfig): 向量資料庫的配置參數
        device (str): 推理設備類型 ("cpu", "cuda", "mps", "npu")
    
    Note:
        - 設備選擇優先級: NPU > CUDA > MPS > CPU
        - 支援 Intel NPU 和 IPEX-LLM 加速
        - 可透過環境變數或參數手動指定設備
    """
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
    ) -> None:
        """
        初始化 LLM 配置。
        
        自動建立所有子配置，並檢測最佳可用推理設備。如果未提供
        特定配置，則使用預設值。
        
        Args:
            model (Optional[ModelConfig]): 模型配置，無指定時使用預設值
            embedding (Optional[EmbeddingConfig]): 嵌入配置，無指定時使用預設值
            vector_store (Optional[VectorStoreConfig]): 向量庫配置，無指定時使用預設值
            device (Optional[str]): 指定設備類型，無指定時自動檢測
            
        Note:
            - 設備自動檢測順序: Intel NPU > NVIDIA CUDA > Apple MPS > CPU
            - NPU 檢測支援 OpenVINO 和 IPEX-LLM 兩種方式
            - 手動指定 device 可以覆寫自動檢測結果
        """
        self.model = model or ModelConfig()
        self.embedding = embedding or EmbeddingConfig()
        self.vector_store = vector_store or VectorStoreConfig()
        
        # Auto-detect device
        if device is None:
            # Check for Intel NPU support (Windows only for now)
            if self._is_npu_available():
                self.device = "npu"
            elif torch.cuda.is_available():
                self.device = "cuda"
            elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                self.device = "mps"
            else:
                self.device = "cpu"
        else:
            self.device = device
    
    def _is_npu_available(self) -> bool:
        """
        檢測 Intel NPU 是否可用。
        
        嘗試兩種 NPU 支援方式：
        1. OpenVINO NPU 支援（推薦方式）
        2. IPEX-LLM NPU 支援（Windows 專用）
        
        Returns:
            bool: True 表示 NPU 可用，False 表示不可用
            
        Note:
            - OpenVINO 支援更廣泛的平台和更好的性能
            - IPEX-LLM 目前主要支援 Windows 平台
            - NPU 支援需要特定的硬體和驅動程式
            - 在無 NPU 支援的環境中會自動降級到其他設備
        """
        try:
            # Check for OpenVINO NPU support (recommended approach)
            try:
                import openvino as ov
                core = ov.Core()
                available_devices = core.available_devices
                return "NPU" in available_devices
            except ImportError:
                pass
            
            # Fallback: Check for IPEX-LLM NPU support (Windows only)
            if platform.system() == "Windows":
                try:
                    import ipex_llm
                    return True
                except ImportError:
                    pass
            
            return False
        except Exception:
            return False

# 預設配置實例 - 使用所有預設參數和自動設備檢測
DEFAULT_LLM_CONFIG = LLMConfig()