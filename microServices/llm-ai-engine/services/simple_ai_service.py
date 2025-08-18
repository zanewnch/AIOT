"""
簡化版 AI 服務實現模組。

本模組提供輕量級的 SmolLM2 AI 推理服務，專注於基本的文字生成功能。
相比於 LangChain 版本，此版本具有更低的資源消耗和更快的啟動速度，
適合資源受限的環境或需要快速響應的場景。

主要功能:
- 基礎文字生成
- 簡化的對話記憶（使用列表存儲）
- 模擬串流輸出
- 健康狀態檢查
- 自動設備配置

限制:
- 不支援 RAG 檢索增強生成
- 對話記憶功能簡化（無持久化）
- 不支援圖像處理
- 無高級 LangChain 功能

適用場景:
- 開發環境快速測試
- 資源受限的部署環境
- 純文字生成需求
- 作為 LangChain 版本的備用方案

Author: AIOT Team
Version: 2.0.0
"""

from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from typing import Dict, Any, Optional, Generator, List
import logging
import json

from config.llm_config import LLMConfig

logger = logging.getLogger(__name__)

class SimpleAIService:
    """
    簡化版 AI 服務類別。
    
    提供輕量級的 SmolLM2 AI 推理服務，專注於基本的文字生成功能。
    使用原生 Transformers 庫進行模型載入和推理，不依賴 LangChain 框架。
    
    Attributes:
        config (LLMConfig): AI 引擎配置對象
        device (str): 推理設備 (cpu/cuda/mps/npu)
        model (AutoModelForCausalLM): 已載入的 SmolLM2 模型
        tokenizer (AutoTokenizer): 模型對應的 tokenizer
        conversation_history (List[Dict]): 簡化的對話歷史記錄
    
    Note:
        - 相較於 LangChain 版本，此版本有更快的啟動速度
        - 不支援 RAG 檢索增強生成功能
        - 對話記憶使用簡化的列表結構，無持久化
        - 適合作為備用方案或資源受限環境
    """
    
    def __init__(self, config: LLMConfig) -> None:
        """
        初始化簡化版 AI 服務。
        
        設定基本配置參數並載入 SmolLM2 模型。相較於 LangChain 版本，
        此初始化過程更快速且更簡化。
        
        Args:
            config (LLMConfig): 包含模型、設備等配置的配置對象
            
        Raises:
            Exception: 當模型載入失敗時拋出異常
            
        Note:
            - 會自動設定 tokenizer 的 pad_token
            - 根據設備類型選擇適當的 torch 數據類型
            - conversation_history 使用簡化的列表結構
        """
        self.config = config
        self.device = self.config.device  # 推理設備
        self.model = None  # SmolLM2 模型將在 _load_model 中載入
        self.tokenizer = None  # Tokenizer 將在 _load_model 中載入
        self.conversation_history = []  # 簡化的對話歷史記錄
        
        logger.info(f"Initializing Simple AI Service on device: {self.device}")
        self._load_model()  # 載入 SmolLM2 模型和 tokenizer
    
    def _load_model(self) -> None:
        """
        載入 SmolLM2 模型和 tokenizer。
        
        從 HuggingFace Hub 下載並載入 SmolLM2-135M-Instruct 模型和對應的
        tokenizer，並根據設備類型進行最佳化配置。
        
        Raises:
            Exception: 當模型或 tokenizer 載入失敗時拋出異常
            
        Note:
            - CUDA 設備使用 float16 提高效能，其他設備使用 float32
            - 自動設定 pad_token 為 eos_token 以防止錯誤
            - GPU 設備使用 device_map="auto" 自動分配記憶體
        """
        try:
            logger.info(f"Loading SmolLM2 model {self.config.model.model_name} on {self.device}")
            
            # 載入 tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.config.model.model_name,
                trust_remote_code=self.config.model.trust_remote_code
            )
            
            # 設置 pad_token 如果不存在
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
                self.config.model.pad_token_id = self.tokenizer.eos_token_id
            
            # 載入模型
            torch_dtype = torch.float16 if self.device == "cuda" else torch.float32
            self.model = AutoModelForCausalLM.from_pretrained(
                self.config.model.model_name,
                torch_dtype=torch_dtype,
                device_map="auto" if self.device == "cuda" else None,
                trust_remote_code=self.config.model.trust_remote_code
            )
            
            # 如果不是使用 device_map，手動移動到指定設備
            if self.device != "cuda" or not torch.cuda.is_available():
                self.model = self.model.to(self.device)
            
            logger.info(f"SmolLM2 model loaded successfully on {self.device}")
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise e
    
    def _format_messages(self, prompt: str, system_prompt: str = None) -> List[Dict]:
        """
        格式化訊息為 SmolLM2 模型所需的對話格式。
        
        將用戶輸入和系統提示詞組織成 SmolLM2 模型期望的消息列表格式。
        
        Args:
            prompt (str): 用戶輸入的提示詞或問題
            system_prompt (str, optional): 系統級提示詞，用於定義 AI 行為
            
        Returns:
            List[Dict]: 按 OpenAI 格式組織的消息列表
            
        Examples:
            ```python
            # 一般用戶輸入
            messages = self._format_messages("你好")
            # 結果: [{"role": "user", "content": "你好"}]
            
            # 帶有系統提示的輸入
            messages = self._format_messages("你好", "你是一個有用的助手")
            # 結果: [{"role": "system", "content": "..."}, {"role": "user", "content": "你好"}]
            ```
        """
        messages = []
        
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})
        
        return messages
    
    def _generate_text(self, messages: List[Dict], max_new_tokens: int = None) -> str:
        """使用 SmolLM2 生成文字"""
        try:
            # 應用聊天模板
            input_text = self.tokenizer.apply_chat_template(
                messages, 
                tokenize=False, 
                add_generation_prompt=True
            )
            
            # Tokenize
            inputs = self.tokenizer(
                input_text, 
                return_tensors="pt", 
                padding=True, 
                truncation=True,
                max_length=self.config.model.max_length
            )
            
            # 移動到設備
            input_ids = inputs['input_ids'].to(self.device)
            attention_mask = inputs['attention_mask'].to(self.device)
            
            # 生成
            max_tokens = max_new_tokens or self.config.model.max_new_tokens
            with torch.no_grad():
                outputs = self.model.generate(
                    input_ids,
                    attention_mask=attention_mask,
                    max_new_tokens=max_tokens,
                    temperature=self.config.model.temperature,
                    top_p=self.config.model.top_p,
                    do_sample=self.config.model.do_sample,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id
                )
            
            # 解碼，只返回新生成的部分
            generated_tokens = outputs[0][input_ids.shape[-1]:]
            response = self.tokenizer.decode(generated_tokens, skip_special_tokens=True)
            
            return response.strip()
        except Exception as e:
            logger.error(f"Text generation failed: {str(e)}")
            raise e
    
    def generate_response(self, prompt: str, use_rag: bool = False, image_url: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """
        產生單輪文字回應。
        
        處理一次性的文字生成請求，不保留對話歷史。適用於獨立的
        文字生成任務，如文章摘要、翻譯、問答等。
        
        Args:
            prompt (str): 用戶輸入的提示詞或問題
            use_rag (bool): 是否使用 RAG 檢索（簡化版不支援，將發出警告）
            image_url (Optional[str]): 圖像 URL（SmolLM2 不支援，將被忽略）
            **kwargs: 其他可選參數
            
        Returns:
            Dict[str, Any]: 生成結果對象
                - success (bool): 是否成功生成
                - response (str): 生成的文字內容
                - sources (List): 來源文檔列表（簡化版始終為空）
                - model (str): 使用的模型名稱
                - error (str, optional): 錯誤訊息（當 success=False 時）
                
        Examples:
            ```python
            # 基本使用
            result = service.generate_response("什麼是人工智慧？")
            if result["success"]:
                print(result["response"])  # AI 的回應
                
            # 帶有 RAG 請求（會發出警告）
            result = service.generate_response("解釋量子計算", use_rag=True)
            ```
            
        Note:
            - 此方法不保留對話歷史，每次請求都是獨立的
            - use_rag=True 會發出警告但不會影響生成
            - image_url 參數會被忽略並發出警告
        """
        try:
            if image_url:
                logger.warning("SmolLM2-135M-Instruct 不支援圖像處理，忽略 image_url")
            
            if use_rag:
                logger.warning("簡化版本暫不支援 RAG 功能")
            
            # 直接生成
            messages = self._format_messages(prompt)
            response_text = self._generate_text(messages)
            
            return {
                "success": True,
                "response": response_text,
                "sources": [],
                "model": self.config.model.model_name
            }
        except Exception as e:
            logger.error(f"Generate response failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "model": self.config.model.model_name
            }
    
    def generate_conversational_response(self, prompt: str, use_rag: bool = False, image_url: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """產生具記憶功能的對話回應"""
        try:
            if image_url:
                logger.warning("SmolLM2-135M-Instruct 不支援圖像處理，忽略 image_url")
            
            if use_rag:
                logger.warning("簡化版本暫不支援 RAG 功能")
            
            # 建立對話歷史（簡化版，使用列表）
            messages = []
            
            # 添加歷史對話（最近 5 輪）
            for item in self.conversation_history[-10:]:  # 最近 10 條訊息
                messages.append(item)
            
            # 添加當前用戶輸入
            messages.append({"role": "user", "content": prompt})
            
            # 生成回應
            response_text = self._generate_text(messages)
            
            # 更新對話歷史
            self.conversation_history.append({"role": "user", "content": prompt})
            self.conversation_history.append({"role": "assistant", "content": response_text})
            
            return {
                "success": True,
                "response": response_text,
                "sources": [],
                "model": self.config.model.model_name
            }
        except Exception as e:
            logger.error(f"Conversational generate failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "model": self.config.model.model_name
            }
    
    def add_documents(self, texts: List[str]) -> Dict[str, Any]:
        """新增文件到 RAG 系統（簡化版暫不支援）"""
        logger.warning("簡化版本暫不支援 RAG 功能")
        return {"success": False, "error": "簡化版本暫不支援 RAG 功能"}
    
    def stream_generate(self, prompt: str, image_url: Optional[str] = None, **kwargs) -> Generator[str, None, None]:
        """串流生成文字"""
        try:
            if image_url:
                logger.warning("SmolLM2-135M-Instruct 不支援圖像處理，忽略 image_url")
            
            # 由於 SmolLM2 不直接支援串流，先生成完整回應再模擬串流
            messages = self._format_messages(prompt)
            response_text = self._generate_text(messages, max_new_tokens=256)  # 串流時使用較短回應
                
            # 以詞為單位進行串流輸出
            words = response_text.split()
            for word in words:
                yield json.dumps({"content": word + " "})
        except Exception as e:
            logger.error(f"Stream generate failed: {str(e)}")
            yield json.dumps({"error": str(e)})
    
    def get_health_status(self) -> Dict[str, Any]:
        """檢查服務健康狀態"""
        try:
            return {
                "model": self.config.model.model_name,
                "available": self.model is not None and self.tokenizer is not None,
                "device": self.device,
                "status": "healthy" if (self.model is not None and self.tokenizer is not None) else "unhealthy"
            }
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return {
                "model": self.config.model.model_name,
                "available": False,
                "device": self.device,
                "status": "error",
                "error": str(e)
            }
    
    def cleanup(self) -> None:
        """清理資源"""
        logger.info("Cleaning up Simple AI Service resources...")
        # 清理 GPU 記憶體等資源
        if torch.cuda.is_available():
            torch.cuda.empty_cache()