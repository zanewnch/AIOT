/**
 * @fileoverview Archive Task Service Interface
 * 
 * 定義歷史任務服務的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-08
 */

import { ArchiveTaskModel, ArchiveTaskCreationAttributes, ArchiveTaskStatus, ArchiveJobType } from '../../models/ArchiveTaskModel.js';

export type CreateArchiveTaskRequest = ArchiveTaskCreationAttributes;

export interface ArchiveTaskStatistics {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  tasksByType: {
    [ArchiveJobType.POSITIONS]: number;
    [ArchiveJobType.COMMANDS]: number;
    [ArchiveJobType.STATUS]: number;
  };
  todayTasks: number;
  weekTasks: number;
  monthTasks: number;
}

export interface ArchiveTaskExecutionResult {
  id?: number;
  status: ArchiveTaskStatus;
  totalRecords?: number;
  archivedRecords: number;
  executionTime?: number;
  errorMessage?: string;
}

export interface BatchArchiveResult {
  batch_id: string;
  tasks: ArchiveTaskModel[];
  successCount: number;
  failureCount: number;
  errors: string[];
}

export interface IArchiveTaskSvc {
  /**
   * 創建歷史任務
   */
  createArchiveTask(data: ArchiveTaskCreationAttributes): Promise<ArchiveTaskModel>;

  /**
   * 更新歷史任務
   */
  updateArchiveTask(id: number, data: Partial<ArchiveTaskCreationAttributes>): Promise<ArchiveTaskModel | null>;

  /**
   * 刪除歷史任務
   */
  deleteArchiveTask(id: number): Promise<void>;

  /**
   * 批量創建歷史任務
   */
  createArchiveTasksBatch(data: ArchiveTaskCreationAttributes[]): Promise<ArchiveTaskModel[]>;

  /**
   * 執行歷史任務
   */
  executeArchiveTask(id: number): Promise<void>;
}