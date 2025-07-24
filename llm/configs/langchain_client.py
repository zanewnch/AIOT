from langchain_huggingface import HuggingFacePipeline
from langchain.llms.base import LLM
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA, ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch
from typing import Dict, Any, Optional, Generator, List
import logging

from .llm_config import LLMConfig, DEFAULT_LLM_CONFIG

logger = logging.getLogger(__name__)


class LangChainQwenClient:
    def __init__(self, config: LLMConfig = None):
        self.config = config or DEFAULT_LLM_CONFIG
        self.device = self.config.device
        self.llm = None
        self.embeddings = None
        self.vector_store = None
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        self._load_model()
        self._setup_embeddings()
        self._setup_vector_store()
    
    def _load_model(self):
        try:
            logger.info(f"Loading model {self.config.model.model_name} on {self.device}")
            
            # Create HuggingFace pipeline
            model_pipeline = pipeline(
                "text-generation",
                model=self.config.model.model_name,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                device_map="auto" if self.device == "cuda" else None,
                trust_remote_code=self.config.model.trust_remote_code,
                max_new_tokens=self.config.model.max_new_tokens,
                do_sample=self.config.model.do_sample,
                temperature=self.config.model.temperature,
                top_p=self.config.model.top_p,
                repetition_penalty=self.config.model.repetition_penalty
            )
            
            # Wrap with LangChain
            self.llm = HuggingFacePipeline(
                pipeline=model_pipeline,
                model_kwargs={"temperature": self.config.model.temperature}
            )
            
            logger.info(f"Model loaded successfully on {self.device}")
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise e
    
    def _setup_embeddings(self):
        try:
            self.embeddings = HuggingFaceEmbeddings(
                model_name=self.config.embedding.model_name,
                model_kwargs={'device': self.device}
            )
            logger.info("Embeddings model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load embeddings: {str(e)}")
            raise e
    
    def _setup_vector_store(self):
        try:
            # Initialize empty vector store
            self.vector_store = Chroma(
                embedding_function=self.embeddings,
                persist_directory=self.config.vector_store.persist_directory
            )
            logger.info("Vector store initialized")
        except Exception as e:
            logger.error(f"Failed to setup vector store: {str(e)}")
            self.vector_store = None
    
    def add_documents(self, texts: List[str]) -> bool:
        """Add documents to the vector store for RAG"""
        try:
            if not self.vector_store:
                return False
            
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.config.vector_store.chunk_size,
                chunk_overlap=self.config.vector_store.chunk_overlap
            )
            
            docs = text_splitter.create_documents(texts)
            self.vector_store.add_documents(docs)
            self.vector_store.persist()
            
            logger.info(f"Added {len(docs)} documents to vector store")
            return True
        except Exception as e:
            logger.error(f"Failed to add documents: {str(e)}")
            return False
    
    def generate_response(self, prompt: str, use_rag: bool = False, **kwargs) -> Dict[str, Any]:
        try:
            if use_rag and self.vector_store:
                # Use RAG with retrieval
                qa_chain = RetrievalQA.from_chain_type(
                    llm=self.llm,
                    chain_type="stuff",
                    retriever=self.vector_store.as_retriever(
                        search_kwargs={"k": self.config.vector_store.retrieval_k}
                    ),
                    return_source_documents=True
                )
                result = qa_chain({"query": prompt})
                response = result["result"]
                sources = [doc.page_content[:200] for doc in result["source_documents"]]
            else:
                # Direct generation
                response = self.llm(prompt)
                sources = []
            
            return {
                "success": True,
                "response": response,
                "sources": sources,
                "model": self.config.model.model_name
            }
        except Exception as e:
            logger.error(f"LangChain generate failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "model": self.config.model.model_name
            }
    
    def conversational_response(self, prompt: str, use_rag: bool = False, **kwargs) -> Dict[str, Any]:
        """Generate response with conversation memory"""
        try:
            if use_rag and self.vector_store:
                # Conversational RAG
                qa_chain = ConversationalRetrievalChain.from_llm(
                    llm=self.llm,
                    retriever=self.vector_store.as_retriever(
                        search_kwargs={"k": self.config.vector_store.retrieval_k}
                    ),
                    memory=self.memory,
                    return_source_documents=True
                )
                result = qa_chain({"question": prompt})
                response = result["answer"]
                sources = [doc.page_content[:200] for doc in result.get("source_documents", [])]
            else:
                # Simple conversation with memory
                chat_history = self.memory.chat_memory.messages
                context = "\n".join([f"{msg.type}: {msg.content}" for msg in chat_history[-10:]])
                full_prompt = f"Previous conversation:\n{context}\n\nUser: {prompt}\nAssistant:"
                
                response = self.llm(full_prompt)
                sources = []
                
                # Update memory
                self.memory.chat_memory.add_user_message(prompt)
                self.memory.chat_memory.add_ai_message(response)
            
            return {
                "success": True,
                "response": response,
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
    
    def check_model_availability(self) -> bool:
        try:
            return self.llm is not None
        except Exception as e:
            logger.error(f"Check model availability failed: {str(e)}")
            return False
    
    def stream_generate(self, prompt: str, **kwargs) -> Generator[str, None, None]:
        try:
            # LangChain doesn't support streaming easily, fallback to chunked response
            response = self.llm(prompt)
            words = response.split()
            for word in words:
                yield word + " "
        except Exception as e:
            logger.error(f"LangChain stream generate failed: {str(e)}")
            yield f"Error: {str(e)}"