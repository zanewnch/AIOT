from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA, ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from transformers import pipeline
import torch
from typing import Dict, Any, Optional, Generator, List
import logging
import os
import sys
import requests
from PIL import Image
import io

from .llm_config import LLMConfig, DEFAULT_LLM_CONFIG

logger = logging.getLogger(__name__)


class LangChainVisionClient:
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
        
        # Skip model loading during Django migrations
        if self._is_django_migrate():
            logger.info("Skipping model loading during Django migrate")
            return
            
        self._load_model()
        self._setup_embeddings()
        self._setup_vector_store()
    
    def _is_django_migrate(self):
        """Check if currently running Django migrate command"""
        return (
            'migrate' in sys.argv or 
            os.environ.get('DJANGO_SKIP_MODEL_LOADING') == '1'
        )
    
    def _load_model(self):
        try:
            logger.info(f"Loading model {self.config.model.model_name} on {self.device}")
            
            # Create HuggingFace pipeline for image-text-to-text
            self.pipeline = pipeline(
                self.config.model.task,
                model=self.config.model.model_name,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                device_map="auto" if self.device == "cuda" else None,
                trust_remote_code=self.config.model.trust_remote_code
            )
            
            logger.info(f"Vision model loaded successfully on {self.device}")
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
    
    def _process_image_url(self, url: str) -> Image.Image:
        """Process image from URL"""
        try:
            response = requests.get(url)
            response.raise_for_status()
            image = Image.open(io.BytesIO(response.content))
            return image
        except Exception as e:
            logger.error(f"Failed to process image from URL {url}: {str(e)}")
            raise e
    
    def _format_messages(self, prompt: str, image_url: Optional[str] = None) -> List[Dict]:
        """Format messages for the vision model"""
        if image_url:
            return [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "url": image_url},
                        {"type": "text", "text": prompt}
                    ]
                }
            ]
        else:
            return [
                {
                    "role": "user", 
                    "content": [
                        {"type": "text", "text": prompt}
                    ]
                }
            ]
    
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
    
    def generate_response(self, prompt: str, use_rag: bool = False, image_url: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        try:
            if use_rag and self.vector_store and not image_url:
                # RAG only supports text, so extract relevant documents first
                retriever = self.vector_store.as_retriever(
                    search_kwargs={"k": self.config.vector_store.retrieval_k}
                )
                docs = retriever.get_relevant_documents(prompt)
                context = "\n".join([doc.page_content for doc in docs])
                enhanced_prompt = f"Context: {context}\n\nQuestion: {prompt}"
                sources = [doc.page_content[:200] for doc in docs]
                
                messages = self._format_messages(enhanced_prompt)
                response = self.pipeline(text=messages)
            else:
                # Direct generation with optional image
                messages = self._format_messages(prompt, image_url)
                response = self.pipeline(text=messages)
                sources = []
            
            # Extract response text from pipeline output
            if isinstance(response, list) and len(response) > 0:
                response_text = response[0].get("generated_text", str(response))
            else:
                response_text = str(response)
            
            return {
                "success": True,
                "response": response_text,
                "sources": sources,
                "model": self.config.model.model_name
            }
        except Exception as e:
            logger.error(f"Vision model generate failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "model": self.config.model.model_name
            }
    
    def conversational_response(self, prompt: str, use_rag: bool = False, image_url: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Generate response with conversation memory"""
        try:
            # Build conversation context
            chat_history = self.memory.chat_memory.messages
            context = "\n".join([f"{msg.type}: {msg.content}" for msg in chat_history[-10:]])
            
            if use_rag and self.vector_store and not image_url:
                # RAG with conversation memory
                retriever = self.vector_store.as_retriever(
                    search_kwargs={"k": self.config.vector_store.retrieval_k}
                )
                docs = retriever.get_relevant_documents(prompt)
                doc_context = "\n".join([doc.page_content for doc in docs])
                full_prompt = f"Previous conversation:\n{context}\n\nContext: {doc_context}\n\nUser: {prompt}\nAssistant:"
                sources = [doc.page_content[:200] for doc in docs]
            else:
                # Simple conversation with memory
                full_prompt = f"Previous conversation:\n{context}\n\nUser: {prompt}\nAssistant:"
                sources = []
            
            messages = self._format_messages(full_prompt, image_url)
            response = self.pipeline(text=messages)
            
            # Extract response text
            if isinstance(response, list) and len(response) > 0:
                response_text = response[0].get("generated_text", str(response))
            else:
                response_text = str(response)
            
            # Update memory
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
    
    def check_model_availability(self) -> bool:
        try:
            return self.pipeline is not None
        except Exception as e:
            logger.error(f"Check model availability failed: {str(e)}")
            return False
    
    def stream_generate(self, prompt: str, image_url: Optional[str] = None, **kwargs) -> Generator[str, None, None]:
        try:
            # Vision models don't support streaming easily, fallback to chunked response
            messages = self._format_messages(prompt, image_url)
            response = self.pipeline(text=messages)
            
            if isinstance(response, list) and len(response) > 0:
                response_text = response[0].get("generated_text", str(response))
            else:
                response_text = str(response)
                
            words = response_text.split()
            for word in words:
                yield word + " "
        except Exception as e:
            logger.error(f"Vision model stream generate failed: {str(e)}")
            yield f"Error: {str(e)}"


# Create client instance
langchain_client = LangChainVisionClient()