from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.memory import ConversationBufferMemory
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
import torch
from typing import Dict, Any, Optional, Generator, List
import logging
import requests
from PIL import Image
import io
import json

# Intel NPU support imports (conditional)
try:
    import openvino as ov
    from optimum.intel import OVModelForCausalLM
    OPENVINO_AVAILABLE = True
except ImportError:
    OPENVINO_AVAILABLE = False

try:
    from ipex_llm.transformers import AutoModelForCausalLM as IPEXAutoModelForCausalLM
    IPEX_AVAILABLE = True
except ImportError:
    IPEX_AVAILABLE = False

from config.llm_config import LLMConfig

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self, config: LLMConfig) -> None:
        self.config = config
        self.device = self.config.device
        self.model = None
        self.tokenizer = None
        self.embeddings = None
        self.vector_store = None
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        logger.info(f"Initializing AI Service on device: {self.device}")
        self._load_model()
        self._setup_embeddings()
        self._setup_vector_store()
    
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
            
            # 根據設備類型載入模型
            if self.device == "npu" and OPENVINO_AVAILABLE:
                # 使用 OpenVINO 進行 NPU 推理
                logger.info("Loading model with OpenVINO for NPU inference")
                self.model = OVModelForCausalLM.from_pretrained(
                    self.config.model.model_name,
                    device="NPU",
                    trust_remote_code=self.config.model.trust_remote_code
                )
            elif self.device == "npu" and IPEX_AVAILABLE:
                # 使用 IPEX-LLM 進行 NPU 推理 (Windows only)
                logger.info("Loading model with IPEX-LLM for NPU inference")
                self.model = IPEXAutoModelForCausalLM.from_pretrained(
                    self.config.model.model_name,
                    load_in_low_bit="nf4",
                    trust_remote_code=self.config.model.trust_remote_code
                )
            else:
                # 標準 transformers 載入
                torch_dtype = torch.float16 if self.device == "cuda" else torch.float32
                self.model = AutoModelForCausalLM.from_pretrained(
                    self.config.model.model_name,
                    torch_dtype=torch_dtype,
                    device_map="auto" if self.device == "cuda" else None,
                    trust_remote_code=self.config.model.trust_remote_code
                )
                
                # 如果不是使用 device_map，手動移動到指定設備
                if self.device not in ["cuda", "npu"] or not torch.cuda.is_available():
                    self.model = self.model.to(self.device)
            
            logger.info(f"SmolLM2 model loaded successfully on {self.device}")
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise e
    
    def _setup_embeddings(self) -> None:
        """設置 Embedding 模型"""
        try:
            self.embeddings = HuggingFaceEmbeddings(
                model_name=self.config.embedding.model_name,
                model_kwargs={'device': self.device}
            )
            logger.info("Embeddings model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load embeddings: {str(e)}")
            raise e
    
    def _setup_vector_store(self) -> None:
        """設置向量資料庫"""
        try:
            self.vector_store = Chroma(
                embedding_function=self.embeddings,
                persist_directory=self.config.vector_store.persist_directory
            )
            logger.info("Vector store initialized")
        except Exception as e:
            logger.error(f"Failed to setup vector store: {str(e)}")
            self.vector_store = None
    
    def _process_image_url(self, url: str) -> Image.Image:
        """處理圖像 URL"""
        try:
            response = requests.get(url)
            response.raise_for_status()
            image = Image.open(io.BytesIO(response.content))
            return image
        except Exception as e:
            logger.error(f"Failed to process image from URL {url}: {str(e)}")
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
            inputs = self.tokenizer.encode(
                input_text, 
                return_tensors="pt", 
                padding=True, 
                truncation=True
            ).to(self.device)
            
            # 生成
            max_tokens = max_new_tokens or self.config.model.max_new_tokens
            with torch.no_grad():
                outputs = self.model.generate(
                    inputs,
                    max_new_tokens=max_tokens,
                    temperature=self.config.model.temperature,
                    top_p=self.config.model.top_p,
                    do_sample=self.config.model.do_sample,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id
                )
            
            # 解碼，只返回新生成的部分
            generated_tokens = outputs[0][inputs.shape[-1]:]
            response = self.tokenizer.decode(generated_tokens, skip_special_tokens=True)
            
            return response.strip()
        except Exception as e:
            logger.error(f"Text generation failed: {str(e)}")
            raise e
    
    def generate_response(self, prompt: str, use_rag: bool = False, image_url: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """產生單輪回應"""
        try:
            sources = []
            
            if use_rag and self.vector_store:
                # RAG 模式 - 檢索相關文件
                retriever = self.vector_store.as_retriever(
                    search_kwargs={"k": self.config.vector_store.retrieval_k}
                )
                docs = retriever.get_relevant_documents(prompt)
                context = "\n".join([doc.page_content for doc in docs])
                sources = [doc.page_content[:200] for doc in docs]
                
                # 使用 RAG 上下文
                system_prompt = f"你是一個有用的助手。使用以下上下文資訊來回答用戶的問題：\n\n{context}"
                messages = self._format_messages(prompt, system_prompt)
            else:
                # 直接生成
                if image_url:
                    # SmolLM2-135M-Instruct 不支援圖像，忽略圖像 URL
                    logger.warning("SmolLM2-135M-Instruct 不支援圖像處理，忽略 image_url")
                
                messages = self._format_messages(prompt)
            
            # 生成回應
            response_text = self._generate_text(messages)
            
            return {
                "success": True,
                "response": response_text,
                "sources": sources,
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
            sources = []
            
            # 建立對話歷史
            messages = []
            
            # 添加歷史對話（最近 5 輪）
            chat_history = self.memory.chat_memory.messages
            for msg in chat_history[-10:]:  # 最近 10 條訊息（5輪對話）
                if hasattr(msg, 'type'):
                    role = "user" if msg.type == "human" else "assistant"
                    messages.append({"role": role, "content": msg.content})
            
            if use_rag and self.vector_store:
                # RAG + 對話記憶
                retriever = self.vector_store.as_retriever(
                    search_kwargs={"k": self.config.vector_store.retrieval_k}
                )
                docs = retriever.get_relevant_documents(prompt)
                context = "\n".join([doc.page_content for doc in docs])
                sources = [doc.page_content[:200] for doc in docs]
                
                # 在對話開頭添加系統提示
                if not messages or messages[0]["role"] != "system":
                    system_prompt = f"你是一個有用的助手。使用以下上下文資訊來回答用戶的問題：\n\n{context}"
                    messages.insert(0, {"role": "system", "content": system_prompt})
            
            # 添加當前用戶輸入
            messages.append({"role": "user", "content": prompt})
            
            # 生成回應
            response_text = self._generate_text(messages)
            
            # 更新記憶
            self.memory.chat_memory.add_user_message(prompt)
            self.memory.chat_memory.add_ai_message(response_text)
            
            return {
                "success": True,
                "response": response_text,
                "sources": sources,
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
        """新增文件到 RAG 系統"""
        try:
            if not self.vector_store:
                return {"success": False, "error": "Vector store not available"}
            
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.config.vector_store.chunk_size,
                chunk_overlap=self.config.vector_store.chunk_overlap
            )
            
            docs = text_splitter.create_documents(texts)
            self.vector_store.add_documents(docs)
            self.vector_store.persist()
            
            logger.info(f"Added {len(docs)} documents to vector store")
            return {"success": True, "documents_added": len(docs)}
        except Exception as e:
            logger.error(f"Failed to add documents: {str(e)}")
            return {"success": False, "error": str(e)}
    
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
        logger.info("Cleaning up AI Service resources...")
        # 清理 GPU 記憶體等資源
        if torch.cuda.is_available():
            torch.cuda.empty_cache()