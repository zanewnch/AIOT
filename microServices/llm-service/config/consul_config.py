"""
Consul 配置和服務註冊模組。

本模組實現 LLM AI Engine 的 Consul 服務註冊功能，
支援服務健康檢查、自動註冊和註銷機制。

Author: AIOT Team
Version: 1.0.0
"""

import os
import logging
import requests
import asyncio
from typing import Optional, Dict, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ServiceConfig:
    """服務配置資料類別。"""
    id: str
    name: str
    address: str
    port: int
    tags: list[str]
    check: Dict[str, str]


class ConsulConfig:
    """
    Consul 服務註冊和配置管理類別。
    
    負責管理 LLM AI Engine 在 Consul 中的註冊、註銷和健康檢查。
    """
    
    def __init__(self) -> None:
        """
        初始化 Consul 配置。
        
        從環境變數讀取配置資訊，建立服務註冊配置。
        """
        self.consul_url = f"http://{os.getenv('CONSUL_HOST', 'consul')}:{os.getenv('CONSUL_PORT', '8500')}"
        
        service_host = os.getenv('SERVICE_HOST', 'aiot-llm-service')
        service_port = int(os.getenv('PORT', '8021'))
        
        self.service_config = ServiceConfig(
            id='llm-service',
            name='llm-service',
            address=service_host,
            port=service_port,
            tags=[
                'llm', 'ai', 'smollm2', 'fastapi', 
                'microservice', 'python', 'text-generation'
            ],
            check={
                'http': f"http://{service_host}:{service_port}/health",
                'interval': '10s',
                'timeout': '5s',
                'deregister_critical_service_after': '30s'
            }
        )
    
    async def register_service(self) -> None:
        """
        註冊服務到 Consul。
        
        向 Consul 發送服務註冊請求，包含健康檢查配置。
        如果註冊失敗，不會阻止服務啟動。
        """
        try:
            service_data = {
                'ID': self.service_config.id,
                'Name': self.service_config.name,
                'Address': self.service_config.address,
                'Port': self.service_config.port,
                'Tags': self.service_config.tags,
                'Check': self.service_config.check
            }
            
            response = requests.put(
                f"{self.consul_url}/v1/agent/service/register",
                json=service_data,
                timeout=5
            )
            
            if response.status_code == 200:
                logger.info(
                    f"✅ LLM AI Engine registered to Consul: "
                    f"{self.service_config.name}@{self.service_config.address}:{self.service_config.port}"
                )
            else:
                logger.error(f"❌ Failed to register to Consul: HTTP {response.status_code}")
                
        except Exception as e:
            logger.error(f"❌ Failed to register LLM AI Engine to Consul: {e}")
            # 不要因為 Consul 註冊失敗而停止服務
    
    async def deregister_service(self) -> None:
        """
        從 Consul 註銷服務。
        
        在服務關閉時調用，清理 Consul 中的服務註冊資訊。
        """
        try:
            response = requests.put(
                f"{self.consul_url}/v1/agent/service/deregister/{self.service_config.id}",
                timeout=5
            )
            
            if response.status_code == 200:
                logger.info(f"✅ LLM AI Engine deregistered from Consul: {self.service_config.id}")
            else:
                logger.error(f"❌ Failed to deregister from Consul: HTTP {response.status_code}")
                
        except Exception as e:
            logger.error(f"❌ Failed to deregister LLM AI Engine from Consul: {e}")
    
    async def health_check(self) -> bool:
        """
        檢查服務在 Consul 中的健康狀態。
        
        Returns:
            bool: 服務是否在 Consul 中註冊且健康
        """
        try:
            response = requests.get(
                f"{self.consul_url}/v1/health/service/{self.service_config.name}",
                timeout=5
            )
            
            if response.status_code == 200:
                services = response.json()
                return len(services) > 0
            else:
                return False
                
        except Exception as e:
            logger.error(f"❌ Consul health check failed: {e}")
            return False
    
    def get_service_config(self) -> ServiceConfig:
        """
        獲取服務配置。
        
        Returns:
            ServiceConfig: 當前服務配置
        """
        return self.service_config