"""
Django Consul 整合應用程式配置。

本模組提供 Django 應用程式與 Consul 整合的配置。

Author: AIOT Team
Version: 1.0.0
"""

import os
import sys
import signal
import atexit
import logging
from django.apps import AppConfig
from configs.consul_config import ConsulConfig

logger = logging.getLogger(__name__)

# 全域 Consul 配置實例
consul_config = None


def initialize_consul():
    """
    初始化 Consul 配置並註冊服務。
    
    在 Django 應用程式啟動時調用，向 Consul 註冊服務。
    """
    global consul_config
    try:
        consul_config = ConsulConfig()
        consul_config.register_service()
        
        # 註冊清理函數
        atexit.register(cleanup_consul)
        signal.signal(signal.SIGTERM, signal_handler)
        signal.signal(signal.SIGINT, signal_handler)
        
        logger.info("Consul integration initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize Consul integration: {e}")
        # 不要因為 Consul 失敗而阻止應用程式啟動


def cleanup_consul():
    """
    清理 Consul 資源。
    
    在應用程式關閉時調用，從 Consul 註銷服務。
    """
    global consul_config
    if consul_config:
        try:
            consul_config.deregister_service()
            logger.info("Consul service deregistered")
        except Exception as e:
            logger.error(f"Failed to deregister from Consul: {e}")


def signal_handler(signum, frame):
    """
    信號處理器。
    
    處理系統信號，確保在程序被終止時正確清理資源。
    """
    logger.info(f"Received signal {signum}, cleaning up...")
    cleanup_consul()
    sys.exit(0)


class ConsulIntegrationConfig(AppConfig):
    """
    Consul 整合 Django 應用程式配置。
    
    在 Django 應用程式啟動時初始化 Consul 整合。
    """
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'llm.consul_integration'
    
    def ready(self):
        """
        應用程式就緒時的回調。
        
        Django 應用程式完全載入後調用，在此時初始化 Consul 整合。
        """
        # 避免在 Django migrations 等管理命令中執行
        if 'runserver' in sys.argv or 'gunicorn' in sys.argv[0]:
            initialize_consul()