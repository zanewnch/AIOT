/**
 * @fileoverview 歸檔任務資料存取層
 * 
 * 提供歸檔任務的資料庫操作功能
 */

import { injectable } from 'inversify';
import { Op, WhereOptions, OrderItem } from 'sequelize';
import { Logger } from 'winston';
import { 
  ArchiveTaskModel, 
  ArchiveTaskAttributes,
  ArchiveTaskCreationAttributes,
  ArchiveTaskStatus,
  ArchiveJobType 
} from '@/models/ArchiveTaskModel';

export interface ArchiveTaskFilter {
  jobType?: ArchiveJobType;
  status?: ArchiveTaskStatus;
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  createdBy?: string;
  batchId?: string;
}

export interface ArchiveTaskStatistics {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalRecordsProcessed: number;
  averageExecutionTime: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

@injectable()
export class ArchiveTaskRepository {
  constructor(private logger: Logger) {}

  /**
   * 創建新的歸檔任務
   */
  async create(data: ArchiveTaskCreationAttributes): Promise<ArchiveTaskModel> {
    try {
      const task = await ArchiveTaskModel.create(data);
      
      this.logger.info('Archive task created', {
        taskId: task.id,
        jobType: task.jobType,
        batchId: task.batchId
      });

      return task;
    } catch (error) {
      this.logger.error('Failed to create archive task', { error, data });
      throw error;
    }
  }

  /**
   * 根據 ID 查找任務
   */
  async findById(id: number): Promise<ArchiveTaskModel | null> {
    try {
      return await ArchiveTaskModel.findByPk(id);
    } catch (error) {
      this.logger.error('Failed to find archive task by ID', { error, id });
      throw error;
    }
  }

  /**
   * 根據批次 ID 查找任務
   */
  async findByBatchId(batchId: string): Promise<ArchiveTaskModel | null> {
    try {
      return await ArchiveTaskModel.findOne({
        where: { batchId }
      });
    } catch (error) {
      this.logger.error('Failed to find archive task by batch ID', { error, batchId });
      throw error;
    }
  }

  /**
   * 根據條件查找任務列表
   */
  async findByFilter(
    filter: ArchiveTaskFilter,
    pagination?: PaginationOptions
  ): Promise<{ tasks: ArchiveTaskModel[]; total: number }> {
    try {
      const whereConditions: WhereOptions = this.buildWhereConditions(filter);
      
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 50;
      const offset = (page - 1) * limit;

      const orderBy = pagination?.orderBy || 'createdAt';
      const orderDirection = pagination?.orderDirection || 'DESC';
      const order: OrderItem[] = [[orderBy, orderDirection]];

      const { rows: tasks, count: total } = await ArchiveTaskModel.findAndCountAll({
        where: whereConditions,
        order,
        limit,
        offset
      });

      return { tasks, total };
    } catch (error) {
      this.logger.error('Failed to find archive tasks by filter', { error, filter });
      throw error;
    }
  }

  /**
   * 查找待執行的任務
   */
  async findPendingTasks(limit: number = 10): Promise<ArchiveTaskModel[]> {
    try {
      return await ArchiveTaskModel.findAll({
        where: {
          status: ArchiveTaskStatus.PENDING
        },
        order: [['createdAt', 'ASC']],
        limit
      });
    } catch (error) {
      this.logger.error('Failed to find pending tasks', { error, limit });
      throw error;
    }
  }

  /**
   * 查找執行中的任務
   */
  async findRunningTasks(): Promise<ArchiveTaskModel[]> {
    try {
      return await ArchiveTaskModel.findAll({
        where: {
          status: ArchiveTaskStatus.RUNNING
        },
        order: [['startedAt', 'ASC']]
      });
    } catch (error) {
      this.logger.error('Failed to find running tasks', { error });
      throw error;
    }
  }

  /**
   * 查找超時的執行中任務
   */
  async findTimeoutTasks(timeoutHours: number = 4): Promise<ArchiveTaskModel[]> {
    try {
      const timeoutThreshold = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);
      
      return await ArchiveTaskModel.findAll({
        where: {
          status: ArchiveTaskStatus.RUNNING,
          startedAt: {
            [Op.lt]: timeoutThreshold
          }
        },
        order: [['startedAt', 'ASC']]
      });
    } catch (error) {
      this.logger.error('Failed to find timeout tasks', { error, timeoutHours });
      throw error;
    }
  }

  /**
   * 查找可重試的失敗任務
   */
  async findRetryableTasks(maxRetries: number = 3): Promise<ArchiveTaskModel[]> {
    try {
      // 簡化查詢，先查找所有失敗的任務
      const failedTasks = await ArchiveTaskModel.findAll({
        where: {
          status: ArchiveTaskStatus.FAILED
        },
        order: [['completedAt', 'DESC']]
      });

      // TODO: 可以在這裡加入更複雜的重試邏輯判斷
      // 例如檢查任務的重試次數、失敗原因等

      return failedTasks;
    } catch (error) {
      this.logger.error('Failed to find retryable tasks', { error, maxRetries });
      throw error;
    }
  }

  /**
   * 更新任務
   */
  async update(id: number, data: Partial<ArchiveTaskAttributes>): Promise<ArchiveTaskModel | null> {
    try {
      const task = await this.findById(id);
      if (!task) {
        this.logger.warn('Archive task not found for update', { id });
        return null;
      }

      await task.update(data);
      
      this.logger.info('Archive task updated', {
        taskId: id,
        updatedFields: Object.keys(data)
      });

      return task;
    } catch (error) {
      this.logger.error('Failed to update archive task', { error, id, data });
      throw error;
    }
  }

  /**
   * 批量更新任務狀態
   */
  async updateStatus(
    ids: number[], 
    status: ArchiveTaskStatus, 
    additionalData?: Partial<ArchiveTaskAttributes>
  ): Promise<number> {
    try {
      const updateData: any = { status, ...additionalData };
      
      if (status === ArchiveTaskStatus.RUNNING) {
        updateData.startedAt = new Date();
      } else if (status === ArchiveTaskStatus.COMPLETED || status === ArchiveTaskStatus.FAILED) {
        updateData.completedAt = new Date();
      }

      const [affectedCount] = await ArchiveTaskModel.update(updateData, {
        where: {
          id: {
            [Op.in]: ids
          }
        }
      });

      this.logger.info('Batch updated archive tasks status', {
        affectedCount,
        status,
        taskIds: ids
      });

      return affectedCount;
    } catch (error) {
      this.logger.error('Failed to batch update archive tasks status', {
        error,
        ids,
        status
      });
      throw error;
    }
  }

  /**
   * 刪除任務
   */
  async delete(id: number): Promise<boolean> {
    try {
      const deletedCount = await ArchiveTaskModel.destroy({
        where: { id }
      });

      const success = deletedCount > 0;
      
      this.logger.info('Archive task deleted', {
        taskId: id,
        success
      });

      return success;
    } catch (error) {
      this.logger.error('Failed to delete archive task', { error, id });
      throw error;
    }
  }

  /**
   * 清理舊任務記錄
   */
  async cleanupOldTasks(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      const deletedCount = await ArchiveTaskModel.destroy({
        where: {
          createdAt: {
            [Op.lt]: cutoffDate
          },
          status: {
            [Op.in]: [ArchiveTaskStatus.COMPLETED, ArchiveTaskStatus.FAILED]
          }
        }
      });

      this.logger.info('Cleaned up old archive tasks', {
        deletedCount,
        cutoffDate: cutoffDate.toISOString(),
        daysToKeep
      });

      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to cleanup old archive tasks', { error, daysToKeep });
      throw error;
    }
  }

  /**
   * 獲取統計資訊
   */
  async getStatistics(dateRange?: { start: Date; end: Date }): Promise<ArchiveTaskStatistics> {
    try {
      const whereConditions: WhereOptions = {};
      
      if (dateRange) {
        whereConditions.createdAt = {
          [Op.between]: [dateRange.start, dateRange.end]
        };
      }

      const [statusStats, executionTimeStats] = await Promise.all([
        // 狀態統計
        ArchiveTaskModel.findAll({
          where: whereConditions,
          attributes: [
            'status',
            [ArchiveTaskModel.sequelize!.fn('COUNT', ArchiveTaskModel.sequelize!.col('id')), 'count'],
            [ArchiveTaskModel.sequelize!.fn('SUM', ArchiveTaskModel.sequelize!.col('archived_records')), 'totalRecords']
          ],
          group: ['status'],
          raw: true
        }) as any[],
        
        // 執行時間統計 (僅包括已完成的任務)
        ArchiveTaskModel.findOne({
          where: {
            ...whereConditions,
            status: ArchiveTaskStatus.COMPLETED,
            startedAt: { [Op.not]: null },
            completedAt: { [Op.not]: null }
          },
          attributes: [
            [
              ArchiveTaskModel.sequelize!.fn(
                'AVG',
                ArchiveTaskModel.sequelize!.literal('TIMESTAMPDIFF(SECOND, started_at, completed_at)')
              ),
              'avgExecutionTime'
            ]
          ],
          raw: true
        }) as any
      ]);

      // 整理統計結果
      const stats: ArchiveTaskStatistics = {
        totalTasks: 0,
        pendingTasks: 0,
        runningTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        totalRecordsProcessed: 0,
        averageExecutionTime: executionTimeStats?.avgExecutionTime || 0
      };

      for (const statusStat of statusStats) {
        const count = parseInt(statusStat.count || '0');
        const records = parseInt(statusStat.totalRecords || '0');
        
        stats.totalTasks += count;
        stats.totalRecordsProcessed += records;

        switch (statusStat.status) {
          case ArchiveTaskStatus.PENDING:
            stats.pendingTasks = count;
            break;
          case ArchiveTaskStatus.RUNNING:
            stats.runningTasks = count;
            break;
          case ArchiveTaskStatus.COMPLETED:
            stats.completedTasks = count;
            break;
          case ArchiveTaskStatus.FAILED:
            stats.failedTasks = count;
            break;
        }
      }

      return stats;
    } catch (error) {
      this.logger.error('Failed to get archive task statistics', { error, dateRange });
      throw error;
    }
  }

  /**
   * 構建查詢條件
   */
  private buildWhereConditions(filter: ArchiveTaskFilter): WhereOptions {
    const conditions: WhereOptions = {};

    if (filter.jobType) {
      conditions.jobType = filter.jobType;
    }

    if (filter.status) {
      conditions.status = filter.status;
    }

    if (filter.batchId) {
      conditions.batchId = filter.batchId;
    }

    if (filter.createdBy) {
      conditions.createdBy = filter.createdBy;
    }

    if (filter.dateRangeStart && filter.dateRangeEnd) {
      conditions.createdAt = {
        [Op.between]: [filter.dateRangeStart, filter.dateRangeEnd]
      };
    } else if (filter.dateRangeStart) {
      conditions.createdAt = {
        [Op.gte]: filter.dateRangeStart
      };
    } else if (filter.dateRangeEnd) {
      conditions.createdAt = {
        [Op.lte]: filter.dateRangeEnd
      };
    }

    return conditions;
  }
}