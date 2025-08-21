/**
 * @fileoverview Scheduler Service 類型定義
 * 
 * 定義排程服務中使用的所有介面和類型，包括：
 * - RabbitMQ 消息格式
 * - 任務配置介面
 * - 排程任務類型
 * - 歸檔相關類型
 */

export enum TaskType {
  ARCHIVE = 'archive',
  CLEANUP = 'cleanup',
  MAINTENANCE = 'maintenance',
  REPORT = 'report'
}

export enum ScheduleStatus {
  PENDING = 'pending',
  RUNNING = 'running', 
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * 基礎排程任務介面
 */
export interface BaseScheduleTask {
  taskId: string;
  taskType: TaskType;
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * 歸檔任務消息格式
 */
export interface ArchiveTaskMessage extends BaseScheduleTask {
  taskType: TaskType.ARCHIVE;
  jobType: 'positions' | 'commands' | 'status';
  batchId: string;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  batchSize: number;
  metadata?: {
    estimatedRecords?: number;
    tableName?: string;
    archiveTableName?: string;
  };
}

/**
 * 清理任務消息格式
 */
export interface CleanupTaskMessage extends BaseScheduleTask {
  taskType: TaskType.CLEANUP;
  jobType: 'positions' | 'commands' | 'status';
  tableName: string;
  cleanupType: 'mark_archived' | 'physical_delete';
  dateThreshold: Date;
  batchSize: number;
}

/**
 * 維護任務消息格式
 */
export interface MaintenanceTaskMessage extends BaseScheduleTask {
  taskType: TaskType.MAINTENANCE;
  maintenanceType: 'index_rebuild' | 'statistics_update' | 'health_check';
  targetTables?: string[];
  parameters?: Record<string, any>;
}

/**
 * 報告任務消息格式
 */
export interface ReportTaskMessage extends BaseScheduleTask {
  taskType: TaskType.REPORT;
  reportType: 'daily' | 'weekly' | 'monthly';
  reportFormat: 'json' | 'csv' | 'pdf';
  recipients?: string[];
  parameters?: Record<string, any>;
}

/**
 * 任務結果消息格式
 */
export interface TaskResultMessage {
  taskId: string;
  taskType: TaskType;
  status: ScheduleStatus;
  totalRecords?: number;
  processedRecords?: number;
  errorMessage?: string;
  executionTime: number;
  completedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * 排程配置介面
 */
export interface ScheduleConfig {
  name: string;
  cronExpression: string;
  taskType: TaskType;
  enabled: boolean;
  timezone?: string;
  parameters: Record<string, any>;
  description?: string;
}

/**
 * RabbitMQ 隊列配置
 */
export interface QueueConfig {
  name: string;
  exchange: string;
  routingKey: string;
  durable: boolean;
  priority?: number;
  ttl?: number;
  deadLetterExchange?: string;
}

/**
 * 排程統計介面
 */
export interface ScheduleStats {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  lastExecutionTime?: Date;
}