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