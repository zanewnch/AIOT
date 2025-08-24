"""
LangChain 整合的 AI 服務
使用 LangChain 提供更好的記憶管理、RAG 支援和鏈式處理
"""
from typing import Dict, Any, Optional, Generator, List
import logging
import json

from langchain.llms.base import LLM
from langchain.memory import ConversationBufferWindowMemory
from langchain.chains import ConversationChain
from langchain.schema import Document
from langchain.vectorstores import Chroma
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate
from langchain_huggingface import HuggingFacePipeline
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

from config.llm_config import LLMConfig

logger = logging.getLogger(__name__)


class SmolLM2LLM(LLM):
    """
    SmolLM2 的 LangChain LLM 封裝
    
    這個類別將 SmolLM2 模型封裝為 LangChain 相容的 LLM，
    提供統一的介面來與 LangChain 生態系統整合。
    """
    
    def __init__(self, config: LLMConfig):
        """
        初始化 SmolLM2 LLM
        
        Args:
            config: LLM 配置物件，包含模型參數和設備資訊
        """
        super().__init__()
        self.config = config
        self.device = config.device
        self.model = None
        self.tokenizer = None
        self._load_model()
    
    def _load_model(self) -> None:
        """載入 SmolLM2 模型和 tokenizer"""
        try:
            logger.info(f"Loading SmolLM2 model {self.config.model.model_name} on {self.device}")
            
            # 載入 tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.config.model.model_name,
                trust_remote_code=self.config.model.trust_remote_code
            )
            
            # 設置 pad_token
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # 載入模型
            torch_dtype = torch.float16 if self.device == "cuda" else torch.float32
            self.model = AutoModelForCausalLM.from_pretrained(
                self.config.model.model_name,
                torch_dtype=torch_dtype,
                device_map="auto" if self.device == "cuda" else None,
                trust_remote_code=self.config.model.trust_remote_code
            )
            
            # 移動到指定設備
            if self.device != "cuda" or not torch.cuda.is_available():
                self.model = self.model.to(self.device)
            
            logger.info(f"SmolLM2 model loaded successfully on {self.device}")
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise e
    
    @property
    def _llm_type(self) -> str:
        """返回 LLM 類型識別"""
        return "smollm2"
    
    def _call(self, prompt: str, stop: Optional[List[str]] = None) -> str:
        """
        LangChain 要求的調用方法
        
        Args:
            prompt: 輸入的提示文字
            stop: 停止詞列表（可選）
            
        Returns:
            生成的回應文字
        """
        try:
            # 格式化訊息
            messages = [{"role": "user", "content": prompt}]
            
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
            with torch.no_grad():
                outputs = self.model.generate(
                    input_ids,
                    attention_mask=attention_mask,
                    max_new_tokens=self.config.model.max_new_tokens,
                    temperature=self.config.model.temperature,
                    top_p=self.config.model.top_p,
                    do_sample=self.config.model.do_sample,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id
                )
            
            # 解碼
            generated_tokens = outputs[0][input_ids.shape[-1]:]
            response = self.tokenizer.decode(generated_tokens, skip_special_tokens=True)
            
            return response.strip()
        except Exception as e:
            logger.error(f"LLM call failed: {str(e)}")
            raise e


class LangChainAIService:
    """
    基於 LangChain 的 AI 服務
    
    提供記憶管理、RAG 支援和鏈式處理功能的完整 AI 服務。
    使用 LangChain 框架來管理對話記憶、文檔檢索和複雜的工作流程。
    """
    
    def __init__(self, config: LLMConfig) -> None:
        """
        初始化 LangChain AI 服務
        
        Args:
            config: LLM 配置物件
        """
        self.config = config
        self.device = config.device
        
        # 初始化組件
        self.llm = None
        self.memory = None
        self.conversation_chain = None
        self.vectorstore = None
        self.embeddings = None
        self.text_splitter = None
        self.qa_chain = None
        
        logger.info(f"Initializing LangChain AI Service on device: {self.device}")
        self._setup_components()
    
    def _setup_components(self) -> None:
        """設置 LangChain 組件"""
        try:
            # 1. 初始化 LLM
            self.llm = SmolLM2LLM(self.config)
            
            # 2. 設置記憶管理
            self.memory = ConversationBufferWindowMemory(
                k=5,  # 保留最近 5 輪對話
                return_messages=True
            )
            
            # 3. 設置對話鏈
            self.conversation_chain = ConversationChain(
                llm=self.llm,
                memory=self.memory,
                verbose=True
            )
            
            # 4. 設置 RAG 組件
            self._setup_rag_components()
            
            logger.info("LangChain AI Service components initialized successfully")
        except Exception as e:
            logger.error(f"Failed to setup components: {str(e)}")
            raise e
    
    def _setup_rag_components(self) -> None:
        """設置 RAG (Retrieval-Augmented Generation) 組件"""
        try:
            # 初始化 embeddings
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'}  # 使用 CPU 以節省記憶體
            )
            
            # 初始化文字分割器
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len,
                separators=["\n\n", "\n", " ", ""]
            )
            
            # 初始化向量資料庫
            self.vectorstore = Chroma(
                embedding_function=self.embeddings,
                persist_directory="./chroma_db"
            )
            
            # 設置 QA 鏈
            qa_prompt = PromptTemplate(
                template="""使用以下文件來回答問題。如果你不知道答案，就說你不知道，不要試圖編造答案。

文件：
{context}

問題：{question}

回答：""",
                input_variables=["context", "question"]
            )
            
            self.qa_chain = load_qa_chain(
                llm=self.llm,
                chain_type="stuff",
                prompt=qa_prompt
            )
            
            logger.info("RAG components initialized successfully")
        except Exception as e:
            logger.error(f"Failed to setup RAG components: {str(e)}")
            # RAG 失敗不影響基本功能
            pass
    
    def generate_response(self, prompt: str, use_rag: bool = False, image_url: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """
        產生單輪回應
        
        Args:
            prompt: 用戶輸入的提示
            use_rag: 是否使用 RAG 增強
            image_url: 圖像 URL（SmolLM2 不支援）
            **kwargs: 其他參數
            
        Returns:
            包含回應結果的字典
        """
        try:
            if image_url:
                logger.warning("SmolLM2-135M-Instruct 不支援圖像處理，忽略 image_url")
            
            if use_rag and self.vectorstore and self.qa_chain:
                # 使用 RAG 生成回應
                docs = self.vectorstore.similarity_search(prompt, k=3)
                if docs:
                    response_text = self.qa_chain.run(
                        input_documents=docs, 
                        question=prompt
                    )
                    sources = [doc.metadata.get("source", "unknown") for doc in docs]
                else:
                    # 沒有相關文件，使用普通生成
                    response_text = self.llm(prompt)
                    sources = []
            else:
                # 普通生成
                response_text = self.llm(prompt)
                sources = []
            
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
        """
        產生具記憶功能的對話回應
        
        Args:
            prompt: 用戶輸入的訊息
            use_rag: 是否使用 RAG 增強
            image_url: 圖像 URL（SmolLM2 不支援）
            **kwargs: 其他參數
            
        Returns:
            包含對話回應結果的字典
        """
        try:
            if image_url:
                logger.warning("SmolLM2-135M-Instruct 不支援圖像處理，忽略 image_url")
            
            if use_rag and self.vectorstore and self.qa_chain:
                # 結合 RAG 和對話記憶
                docs = self.vectorstore.similarity_search(prompt, k=3)
                if docs:
                    # 建構增強的提示
                    context = "\n".join([doc.page_content for doc in docs])
                    enhanced_prompt = f"基於以下資訊回答：\n{context}\n\n問題：{prompt}"
                    response_text = self.conversation_chain.predict(input=enhanced_prompt)
                    sources = [doc.metadata.get("source", "unknown") for doc in docs]
                else:
                    response_text = self.conversation_chain.predict(input=prompt)
                    sources = []
            else:
                # 使用對話記憶
                response_text = self.conversation_chain.predict(input=prompt)
                sources = []
            
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
    
    def add_documents(self, texts: List[str], metadatas: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """
        新增文件到 RAG 系統
        
        Args:
            texts: 文字文件列表
            metadatas: 文件元數據列表（可選）
            
        Returns:
            添加結果
        """
        try:
            if not self.vectorstore or not self.text_splitter:
                return {"success": False, "error": "RAG 組件未初始化"}
            
            # 分割文件
            documents = []
            for i, text in enumerate(texts):
                chunks = self.text_splitter.split_text(text)
                for chunk in chunks:
                    metadata = metadatas[i] if metadatas and i < len(metadatas) else {"source": f"document_{i}"}
                    documents.append(Document(page_content=chunk, metadata=metadata))
            
            # 添加到向量資料庫
            self.vectorstore.add_documents(documents)
            
            # 持久化
            self.vectorstore.persist()
            
            logger.info(f"Added {len(documents)} document chunks to vector store")
            
            return {
                "success": True,
                "documents_added": len(texts),
                "chunks_created": len(documents)
            }
        except Exception as e:
            logger.error(f"Add documents failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def stream_generate(self, prompt: str, image_url: Optional[str] = None, **kwargs) -> Generator[str, None, None]:
        """
        串流生成文字
        
        Args:
            prompt: 輸入提示
            image_url: 圖像 URL（SmolLM2 不支援）
            **kwargs: 其他參數
            
        Yields:
            生成的文字片段
        """
        try:
            if image_url:
                logger.warning("SmolLM2-135M-Instruct 不支援圖像處理，忽略 image_url")
            
            # 由於 LangChain 和 SmolLM2 不直接支援串流，先生成再模擬
            response_text = self.llm(prompt)
            
            # 以詞為單位進行串流輸出
            words = response_text.split()
            for word in words:
                yield json.dumps({"content": word + " "})
        except Exception as e:
            logger.error(f"Stream generate failed: {str(e)}")
            yield json.dumps({"error": str(e)})
    
    def get_health_status(self) -> Dict[str, Any]:
        """
        檢查服務健康狀態
        
        Returns:
            服務健康狀態資訊
        """
        try:
            llm_available = self.llm is not None
            memory_available = self.memory is not None
            conversation_available = self.conversation_chain is not None
            rag_available = self.vectorstore is not None and self.qa_chain is not None
            
            return {
                "model": self.config.model.model_name,
                "available": llm_available,
                "device": self.device,
                "status": "healthy" if llm_available else "unhealthy",
                "components": {
                    "llm": llm_available,
                    "memory": memory_available,
                    "conversation": conversation_available,
                    "rag": rag_available
                }
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
        logger.info("Cleaning up LangChain AI Service resources...")
        
        # 持久化向量資料庫
        if self.vectorstore:
            try:
                self.vectorstore.persist()
            except:
                pass
        
        # 清理 GPU 記憶體
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    
    def reset_memory(self) -> None:
        """重置對話記憶"""
        if self.memory:
            self.memory.clear()
            logger.info("Conversation memory reset")
    
    def get_conversation_history(self) -> List[Dict]:
        """獲取對話歷史"""
        if self.memory:
            return self.memory.chat_memory.messages
        return []