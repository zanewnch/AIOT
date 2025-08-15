from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from typing import Dict, Any, Optional, Generator, List
import logging
import json

from config.llm_config import LLMConfig

logger = logging.getLogger(__name__)

class SimpleAIService:
    def __init__(self, config: LLMConfig) -> None:
        self.config = config
        self.device = self.config.device
        self.model = None
        self.tokenizer = None
        self.conversation_history = []
        
        logger.info(f"Initializing Simple AI Service on device: {self.device}")
        self._load_model()
    
    def _load_model(self) -> None:
        """載入 SmolLM2 模型"""
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
        """格式化訊息給 SmolLM2 模型"""
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
        """產生單輪回應"""
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