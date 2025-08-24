/**
 * @fileoverview RabbitMQ 隊列配置
 * 
 * 定義所有的 RabbitMQ 隊列、交換器和路由配置
 */

import { QueueConfig } from '../types/scheduler.types';

/**
 * RabbitMQ 隊列名稱常數
 */
export const QUEUES = {
  // 歸檔任務隊列
  ARCHIVE_TASK: 'scheduler.archive.task',
  
  // 清理任務隊列
  CLEANUP_TASK: 'scheduler.cleanup.task',
  
  // 維護任務隊列
  MAINTENANCE_TASK: 'scheduler.maintenance.task',
  
  // 報告任務隊列
  REPORT_TASK: 'scheduler.report.task',
  
  // 死信隊列
  DEAD_LETTER: 'scheduler.dead-letter',
  
  // 結果通知隊列
  TASK_RESULT: 'scheduler.task.result',
  
  // 延遲任務隊列
  DELAYED_TASK: 'scheduler.delayed.task'
} as const;

/**
 * RabbitMQ 交換器配置
 */
export const EXCHANGES = {
  MAIN: {
    name: 'scheduler.main.exchange',
    type: 'topic',
    durable: true
  },
  DELAYED: {
    name: 'scheduler.delayed.exchange', 
    type: 'x-delayed-message',
    durable: true,
    arguments: {
      'x-delayed-type': 'topic'
    }
  },
  DLQ: {
    name: 'scheduler.dlq.exchange',
    type: 'direct',
    durable: true
  }
} as const;

/**
 * 路由鍵配置
 */
export const ROUTING_KEYS = {
  // 歸檔任務路由
  ARCHIVE_POSITIONS: 'task.archive.positions',
  ARCHIVE_COMMANDS: 'task.archive.commands',
  ARCHIVE_STATUS: 'task.archive.status',
  
  // 清理任務路由
  CLEANUP_EXPIRED: 'task.cleanup.expired',
  CLEANUP_ARCHIVED: 'task.cleanup.archived',
  
  // 維護任務路由
  MAINTENANCE_INDEX: 'task.maintenance.index',
  MAINTENANCE_STATS: 'task.maintenance.stats',
  MAINTENANCE_HEALTH: 'task.maintenance.health',
  
  // 報告任務路由
  REPORT_DAILY: 'task.report.daily',
  REPORT_WEEKLY: 'task.report.weekly',
  REPORT_MONTHLY: 'task.report.monthly',
  
  // 結果通知路由
  RESULT_SUCCESS: 'result.success',
  RESULT_FAILED: 'result.failed',
  RESULT_PARTIAL: 'result.partial',
  
  // 延遲任務路由
  DELAYED_CLEANUP: 'delayed.cleanup',
  DELAYED_MAINTENANCE: 'delayed.maintenance'
} as const;

/**
 * 隊列配置映射
 */
export const QUEUE_CONFIGS: Record<string, QueueConfig> = {
  [QUEUES.ARCHIVE_TASK]: {
    name: QUEUES.ARCHIVE_TASK,
    exchange: EXCHANGES.MAIN.name,
    routingKey: 'task.archive.*',
    durable: true,
    priority: 10,
    ttl: 24 * 60 * 60 * 1000, // 24小時
    deadLetterExchange: EXCHANGES.DLQ.name
  },
  
  [QUEUES.CLEANUP_TASK]: {
    name: QUEUES.CLEANUP_TASK,
    exchange: EXCHANGES.MAIN.name,
    routingKey: 'task.cleanup.*',
    durable: true,
    priority: 5,
    ttl: 24 * 60 * 60 * 1000,
    deadLetterExchange: EXCHANGES.DLQ.name
  },
  
  [QUEUES.MAINTENANCE_TASK]: {
    name: QUEUES.MAINTENANCE_TASK,
    exchange: EXCHANGES.MAIN.name,
    routingKey: 'task.maintenance.*',
    durable: true,
    priority: 3,
    ttl: 12 * 60 * 60 * 1000, // 12小時
    deadLetterExchange: EXCHANGES.DLQ.name
  },
  
  [QUEUES.REPORT_TASK]: {
    name: QUEUES.REPORT_TASK,
    exchange: EXCHANGES.MAIN.name,
    routingKey: 'task.report.*',
    durable: true,
    priority: 2,
    ttl: 6 * 60 * 60 * 1000, // 6小時
    deadLetterExchange: EXCHANGES.DLQ.name
  },
  
  [QUEUES.DELAYED_TASK]: {
    name: QUEUES.DELAYED_TASK,
    exchange: EXCHANGES.DELAYED.name,
    routingKey: 'delayed.*',
    durable: true,
    priority: 1
  },
  
  [QUEUES.TASK_RESULT]: {
    name: QUEUES.TASK_RESULT,
    exchange: EXCHANGES.MAIN.name,
    routingKey: 'result.*',
    durable: true,
    ttl: 7 * 24 * 60 * 60 * 1000 // 7天
  },
  
  [QUEUES.DEAD_LETTER]: {
    name: QUEUES.DEAD_LETTER,
    exchange: EXCHANGES.DLQ.name,
    routingKey: 'dead-letter',
    durable: true
  }
};

/**
 * 優先級映射
 */
export const TASK_PRIORITIES = {
  CRITICAL: 10,    // 關鍵任務
  HIGH: 8,         // 高優先級
  NORMAL: 5,       // 普通優先級
  LOW: 3,          // 低優先級
  BACKGROUND: 1    // 背景任務
} as const;

/**
 * 重試配置
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 5 * 60 * 1000,      // 5分鐘
  BACKOFF_MULTIPLIER: 2,            // 指數退避
  MAX_RETRY_DELAY: 60 * 60 * 1000   // 最大1小時
} as const;