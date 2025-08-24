/**
 * @fileoverview Archive Processor Service 類型定義
 */

export enum TaskType {
  ARCHIVE = 'archive',
  CLEANUP = 'cleanup',
  MAINTENANCE = 'maintenance'
}

export enum ScheduleStatus {
  PENDING = 'pending',
  RUNNING = 'running', 
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface BaseScheduleTask {
  taskId: string;
  taskType: TaskType;
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  metadata?: Record<string, any>;
}

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

export interface CleanupTaskMessage extends BaseScheduleTask {
  taskType: TaskType.CLEANUP;
  jobType: 'positions' | 'commands' | 'status';
  tableName: string;
  cleanupType: 'mark_archived' | 'physical_delete';
  dateThreshold: Date;
  batchSize: number;
}

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
 * 資料庫連線介面
 * 定義資料庫操作的基本方法
 */
export interface DatabaseConnection {
  query(sql: string, params?: any[]): Promise<any[]>;
  transaction<T>(callback: (connection: any) => Promise<T>): Promise<T>;
  batchInsert(tableName: string, records: Record<string, any>[], batchSize?: number): Promise<number>;
  batchDelete(tableName: string, condition: string, params?: any[], batchSize?: number): Promise<number>;
}

/**
 * RabbitMQ 服務介面
 * 定義訊息隊列操作的基本方法
 */
export interface RabbitMQService {
  initialize(): Promise<void>;
  startConsumer(messageHandler: (message: any) => Promise<void>): Promise<void>;
  publishTaskResult(result: TaskResultMessage): Promise<boolean>;
  publishDelayed<T>(routingKey: string, message: T, delay: number, options?: any): Promise<boolean>;
  close(): Promise<void>;
  isHealthy(): boolean;
}

/**
 * 歸檔任務儲存庫介面
 * 定義歸檔任務數據操作的基本方法
 */
export interface ArchiveTaskRepo {
  findById(id: number): Promise<any>;
  findByTaskId(taskId: string): Promise<any>;
  create(data: any): Promise<any>;
  update(id: number, data: any): Promise<any>;
}