/**
 * @fileoverview 環境配置管理
 * 
 * 【設計意圖 (Intention)】
 * 統一管理所有服務配置，包括資料庫、RabbitMQ、Redis 等連線參數
 * 提供類型安全的配置驗證和預設值管理
 * 
 * 【實作架構 (Implementation Architecture)】
 * - 從環境變數讀取配置
 * - 提供合理的預設值
 * - 配置驗證確保必要參數存在
 */

import dotenv from 'dotenv';
import { DatabaseConfig } from './database';

dotenv.config();

export interface EnvironmentConfig {
  // 服務配置
  service: {
    name: string;
    port: number;
    nodeEnv: string;
  };

  // 資料庫配置
  database: DatabaseConfig;

  // RabbitMQ 配置
  rabbitmq: {
    url: string;
    exchange: string;
    queues: {
      archiveProcessor: string;
      taskResult: string;
    };
    prefetch: number;
    reconnectDelay: number;
  };

  // Redis 配置
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };

  // 處理器配置
  processor: {
    concurrency: number;
    defaultBatchSize: number;
    maxRetries: number;
    retryDelay: number;
  };

  // 日誌配置
  logging: {
    level: string;
    format: string;
  };
}

/**
 * 載入並驗證環境配置
 * 
 * 【驗證策略】
 * - 檢查必要的環境變數
 * - 提供合理的預設值
 * - 類型轉換和格式驗證
 */
function loadConfig(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    service: {
      name: process.env.SERVICE_NAME || 'archive-consumer-service',
      port: parseInt(process.env.PORT || '3007', 10),
      nodeEnv: process.env.NODE_ENV || 'development'
    },

    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'password',
      database: process.env.DB_NAME || 'aiot_db',
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10)
    },

    rabbitmq: {
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
      exchange: process.env.RABBITMQ_EXCHANGE || 'aiot.scheduler',
      queues: {
        archiveProcessor: process.env.RABBITMQ_QUEUE_ARCHIVE_PROCESSOR || 'archive-consumer',
        taskResult: process.env.RABBITMQ_QUEUE_TASK_RESULT || 'task-result'
      },
      prefetch: parseInt(process.env.RABBITMQ_PREFETCH || '5', 10),
      reconnectDelay: parseInt(process.env.RABBITMQ_RECONNECT_DELAY || '5000', 10)
    },

    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10)
    },

    processor: {
      concurrency: parseInt(process.env.PROCESSOR_CONCURRENCY || '3', 10),
      defaultBatchSize: parseInt(process.env.DEFAULT_BATCH_SIZE || '1000', 10),
      maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
      retryDelay: parseInt(process.env.RETRY_DELAY || '5000', 10)
    },

    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'json'
    }
  };

  // 驗證必要配置
  validateConfig(config);

  return config;
}

/**
 * 配置驗證
 */
function validateConfig(config: EnvironmentConfig): void {
  const required = [
    { key: 'database.host', value: config.database.host },
    { key: 'database.username', value: config.database.username },
    { key: 'database.database', value: config.database.database },
    { key: 'rabbitmq.url', value: config.rabbitmq.url }
  ];

  const missing = required.filter(({ value }) => !value);
  
  if (missing.length > 0) {
    const missingKeys = missing.map(({ key }) => key).join(', ');
    throw new Error(`Missing required configuration: ${missingKeys}`);
  }

  // 數值範圍驗證
  if (config.service.port < 1024 || config.service.port > 65535) {
    throw new Error('Service port must be between 1024 and 65535');
  }

  if (config.processor.concurrency < 1 || config.processor.concurrency > 20) {
    throw new Error('Processor concurrency must be between 1 and 20');
  }

  if (config.processor.defaultBatchSize < 1 || config.processor.defaultBatchSize > 10000) {
    throw new Error('Default batch size must be between 1 and 10000');
  }
}

export const config = loadConfig();