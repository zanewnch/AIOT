/**
 * @fileoverview 歸檔任務服務 - 管理資料歸檔的業務邏輯
 * 
 * 功能描述：
 * - 協調歸檔任務的建立、執行和監控
 * - 處理歸檔業務邏輯和規則驗證
 * - 提供歸檔任務的統計和報表
 * - 管理歸檔任務的生命週期
 */

import { injectable, inject } from 'inversify';
import { Logger } from 'winston';
import { TYPES } from '../container/types';
import { ArchiveTaskRepository } from '../repositories/ArchiveTaskRepository';
import { 
  ArchiveTaskModel,
  ArchiveTaskAttributes,
  ArchiveTaskCreationAttributes,
  ArchiveTaskStatus,
  ArchiveJobType 
} from '../models/ArchiveTaskModel';
import { 
  ArchiveTaskFilter,
  ArchiveTaskStatistics,
  PaginationOptions 
} from '../repositories/ArchiveTaskRepository';

/**
 * ArchiveTaskService - 歸檔任務服務主類別
 * 
 * 職責：
 * 1. 處理歸檔任務的業務邏輯
 * 2. 驗證歸檔請求的合法性
 * 3. 協調任務執行狀態管理
 * 4. 提供歸檔任務統計和監控
 */
@injectable()
export class ArchiveTaskService {
  constructor(
    @inject(TYPES.ArchiveTaskRepository) private repository: ArchiveTaskRepository,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  /**
   * 建立新的歸檔任務
   */
  createTask = async (taskData: ArchiveTaskCreationAttributes): Promise<ArchiveTaskModel> => {
    try {
      // 驗證任務資料
      this.validateTaskData(taskData);

      // 檢查重複任務
      if (taskData.batchId) {
        const existingTask = await this.repository.findByBatchId(taskData.batchId);
        if (existingTask) {
          throw new Error(`批次 ID ${taskData.batchId} 已存在歷史任務`);
        }
      }

      // 建立任務
      const task = await this.repository.create(taskData);

      this.logger.info('歸檔任務服務: 任務建立成功', {
        taskId: task.id,
        jobType: task.jobType,
        batchId: task.batchId
      });

      return task;
    } catch (error) {
      this.logger.error('歸檔任務服務: 建立任務失敗', { 
        error: error instanceof Error ? error.message : String(error),
        taskData 
      });
      throw error;
    }
  };

  /**
   * 根據 ID 獲取任務
   */
  getTaskById = async (id: number): Promise<ArchiveTaskModel | null> => {
    try {
      const task = await this.repository.findById(id);
      
      if (!task) {
        this.logger.warn('歸檔任務服務: 任務不存在', { taskId: id });
      }

      return task;
    } catch (error) {
      this.logger.error('歸檔任務服務: 獲取任務失敗', { 
        error: error instanceof Error ? error.message : String(error),
        taskId: id 
      });
      throw error;
    }
  };

  /**
   * 根據批次 ID 獲取任務
   */
  getTaskByBatchId = async (batchId: string): Promise<ArchiveTaskModel | null> => {
    try {
      return await this.repository.findByBatchId(batchId);
    } catch (error) {
      this.logger.error('歸檔任務服務: 根據批次 ID 獲取任務失敗', { 
        error: error instanceof Error ? error.message : String(error),
        batchId 
      });
      throw error;
    }
  };

  /**
   * 根據篩選條件獲取任務列表
   */
  getTasksByFilter = async (
    filter: ArchiveTaskFilter,
    pagination?: PaginationOptions
  ): Promise<{ tasks: ArchiveTaskModel[]; total: number }> => {
    try {
      return await this.repository.findByFilter(filter, pagination);
    } catch (error) {
      this.logger.error('歸檔任務服務: 根據篩選條件獲取任務失敗', { 
        error: error instanceof Error ? error.message : String(error),
        filter 
      });
      throw error;
    }
  };

  /**
   * 獲取待執行的任務
   */
  getPendingTasks = async (limit: number = 10): Promise<ArchiveTaskModel[]> => {
    try {
      return await this.repository.findPendingTasks(limit);
    } catch (error) {
      this.logger.error('歸檔任務服務: 獲取待執行任務失敗', { 
        error: error instanceof Error ? error.message : String(error),
        limit 
      });
      throw error;
    }
  };

  /**
   * 獲取執行中的任務
   */
  getRunningTasks = async (): Promise<ArchiveTaskModel[]> => {
    try {
      return await this.repository.findRunningTasks();
    } catch (error) {
      this.logger.error('歸檔任務服務: 獲取執行中任務失敗', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  };

  /**
   * 開始執行任務
   */
  startTask = async (taskId: number): Promise<ArchiveTaskModel | null> => {
    try {
      const task = await this.repository.findById(taskId);
      if (!task) {
        throw new Error(`任務 ${taskId} 不存在`);
      }

      if (task.status !== ArchiveTaskStatus.PENDING) {
        throw new Error(`任務 ${taskId} 狀態不允許開始執行 (當前狀態: ${task.status})`);
      }

      const updatedTask = await this.repository.update(taskId, {
        status: ArchiveTaskStatus.RUNNING,
        startedAt: new Date()
      });

      this.logger.info('歸檔任務服務: 任務開始執行', { taskId });

      return updatedTask;
    } catch (error) {
      this.logger.error('歸檔任務服務: 開始執行任務失敗', { 
        error: error instanceof Error ? error.message : String(error),
        taskId 
      });
      throw error;
    }
  };

  /**
   * 完成任務
   */
  completeTask = async (
    taskId: number, 
    archivedRecords: number = 0,
    additionalData?: Partial<ArchiveTaskAttributes>
  ): Promise<ArchiveTaskModel | null> => {
    try {
      const task = await this.repository.findById(taskId);
      if (!task) {
        throw new Error(`任務 ${taskId} 不存在`);
      }

      if (task.status !== ArchiveTaskStatus.RUNNING) {
        throw new Error(`任務 ${taskId} 狀態不允許完成 (當前狀態: ${task.status})`);
      }

      const updateData: Partial<ArchiveTaskAttributes> = {
        status: ArchiveTaskStatus.COMPLETED,
        completedAt: new Date(),
        archivedRecords,
        ...additionalData
      };

      const updatedTask = await this.repository.update(taskId, updateData);

      this.logger.info('歸檔任務服務: 任務完成', { 
        taskId,
        archivedRecords,
        executionTime: task.startedAt ? Date.now() - task.startedAt.getTime() : 0
      });

      return updatedTask;
    } catch (error) {
      this.logger.error('歸檔任務服務: 完成任務失敗', { 
        error: error instanceof Error ? error.message : String(error),
        taskId 
      });
      throw error;
    }
  };

  /**
   * 標記任務失敗
   */
  failTask = async (
    taskId: number,
    errorMessage: string,
    additionalData?: Partial<ArchiveTaskAttributes>
  ): Promise<ArchiveTaskModel | null> => {
    try {
      const task = await this.repository.findById(taskId);
      if (!task) {
        throw new Error(`任務 ${taskId} 不存在`);
      }

      const updateData: Partial<ArchiveTaskAttributes> = {
        status: ArchiveTaskStatus.FAILED,
        completedAt: new Date(),
        errorMessage: errorMessage,
        ...additionalData
      };

      const updatedTask = await this.repository.update(taskId, updateData);

      this.logger.warn('歸檔任務服務: 任務失敗', { 
        taskId,
        errorMessage
      });

      return updatedTask;
    } catch (error) {
      this.logger.error('歸檔任務服務: 標記任務失敗時發生錯誤', { 
        error: error instanceof Error ? error.message : String(error),
        taskId 
      });
      throw error;
    }
  };

  /**
   * 批量更新任務狀態
   */
  updateTasksStatus = async (
    taskIds: number[],
    status: ArchiveTaskStatus,
    additionalData?: Partial<ArchiveTaskAttributes>
  ): Promise<number> => {
    try {
      if (taskIds.length === 0) {
        this.logger.warn('歸檔任務服務: 批量更新狀態 - 任務 ID 列表為空');
        return 0;
      }

      const affectedCount = await this.repository.updateStatus(taskIds, status, additionalData);

      this.logger.info('歸檔任務服務: 批量更新任務狀態完成', {
        affectedCount,
        status,
        taskIds: taskIds.length > 10 ? `${taskIds.slice(0, 10)}... (共 ${taskIds.length} 個)` : taskIds
      });

      return affectedCount;
    } catch (error) {
      this.logger.error('歸檔任務服務: 批量更新任務狀態失敗', { 
        error: error instanceof Error ? error.message : String(error),
        taskIds,
        status
      });
      throw error;
    }
  };

  /**
   * 檢查並處理超時任務
   */
  processTimeoutTasks = async (timeoutHours: number = 4): Promise<number> => {
    try {
      const timeoutTasks = await this.repository.findTimeoutTasks(timeoutHours);
      
      if (timeoutTasks.length === 0) {
        return 0;
      }

      const taskIds = timeoutTasks.map(task => task.id);
      const affectedCount = await this.repository.updateStatus(
        taskIds,
        ArchiveTaskStatus.FAILED,
        { errorMessage: `任務超時 (超過 ${timeoutHours} 小時)` }
      );

      this.logger.warn('歸檔任務服務: 處理超時任務', {
        timeoutHours,
        processedTasks: affectedCount
      });

      return affectedCount;
    } catch (error) {
      this.logger.error('歸檔任務服務: 處理超時任務失敗', { 
        error: error instanceof Error ? error.message : String(error),
        timeoutHours
      });
      throw error;
    }
  };

  /**
   * 獲取可重試的任務
   */
  getRetryableTasks = async (maxRetries: number = 3): Promise<ArchiveTaskModel[]> => {
    try {
      return await this.repository.findRetryableTasks(maxRetries);
    } catch (error) {
      this.logger.error('歸檔任務服務: 獲取可重試任務失敗', { 
        error: error instanceof Error ? error.message : String(error),
        maxRetries
      });
      throw error;
    }
  };

  /**
   * 刪除任務
   */
  deleteTask = async (taskId: number): Promise<boolean> => {
    try {
      const task = await this.repository.findById(taskId);
      if (!task) {
        this.logger.warn('歸檔任務服務: 刪除任務 - 任務不存在', { taskId });
        return false;
      }

      // 檢查是否允許刪除 (執行中的任務不允許刪除)
      if (task.status === ArchiveTaskStatus.RUNNING) {
        throw new Error(`執行中的任務不允許刪除 (任務 ID: ${taskId})`);
      }

      const success = await this.repository.delete(taskId);

      if (success) {
        this.logger.info('歸檔任務服務: 任務刪除成功', { taskId });
      }

      return success;
    } catch (error) {
      this.logger.error('歸檔任務服務: 刪除任務失敗', { 
        error: error instanceof Error ? error.message : String(error),
        taskId 
      });
      throw error;
    }
  };

  /**
   * 清理舊任務記錄
   */
  cleanupOldTasks = async (daysToKeep: number = 90): Promise<number> => {
    try {
      const deletedCount = await this.repository.cleanupOldTasks(daysToKeep);

      this.logger.info('歸檔任務服務: 清理舊任務完成', {
        deletedCount,
        daysToKeep
      });

      return deletedCount;
    } catch (error) {
      this.logger.error('歸檔任務服務: 清理舊任務失敗', { 
        error: error instanceof Error ? error.message : String(error),
        daysToKeep
      });
      throw error;
    }
  };

  /**
   * 獲取統計資訊
   */
  getStatistics = async (dateRange?: { start: Date; end: Date }): Promise<ArchiveTaskStatistics> => {
    try {
      return await this.repository.getStatistics(dateRange);
    } catch (error) {
      this.logger.error('歸檔任務服務: 獲取統計資訊失敗', { 
        error: error instanceof Error ? error.message : String(error),
        dateRange
      });
      throw error;
    }
  };

  // ================================
  // 私有方法：業務邏輯輔助
  // ================================

  /**
   * 驗證任務資料
   */
  private validateTaskData = (taskData: ArchiveTaskCreationAttributes): void => {
    if (!taskData.jobType) {
      throw new Error('任務類型不能為空');
    }

    if (!taskData.batchId || taskData.batchId.trim() === '') {
      throw new Error('批次 ID 不能為空');
    }

    // 移除 scheduledAt 檢查，因為模型中沒有此字段
    // if (taskData.scheduledAt && taskData.scheduledAt <= new Date()) {
    //   throw new Error('排程時間不能早於當前時間');
    // }

    // 驗證任務類型
    const validJobTypes = Object.values(ArchiveJobType);
    if (!validJobTypes.includes(taskData.jobType)) {
      throw new Error(`無效的任務類型: ${taskData.jobType}`);
    }
  };
}