/**
 * @fileoverview 歸檔處理器
 * 
 * 負責處理 RabbitMQ 中的歸檔任務，執行數據歸檔和清理操作
 */

import { injectable, inject } from 'inversify';
import pLimit from 'p-limit';
import { Logger } from 'winston';
import { ArchiveTaskMessage, CleanupTaskMessage, TaskResultMessage, TaskType, ScheduleStatus } from '../types/processor.types';

export interface DatabaseConnection {
  query(sql: string, params?: any[]): Promise<any[]>;
  transaction<T>(callback: (connection: any) => Promise<T>): Promise<T>;
  batchInsert(tableName: string, records: Record<string, any>[], batchSize?: number): Promise<number>;
  batchDelete(tableName: string, condition: string, params?: any[], batchSize?: number): Promise<number>;
}

export interface RabbitMQService {
  publishTaskResult(result: TaskResultMessage): Promise<boolean>;
  publishDelayed<T>(routingKey: string, message: T, delay: number, options?: any): Promise<boolean>;
}

export interface ArchiveTaskRepository {
  findById(id: number): Promise<any>;
  update(id: number, data: any): Promise<any>;
}

@injectable()
export class ArchiveProcessor {
  private concurrencyLimit = pLimit(3); // 限制併發處理數量
  private isProcessing = false;

  constructor(
    @inject('DatabaseConnection') private database: DatabaseConnection,
    @inject('RabbitMQService') private rabbitMQService: RabbitMQService,
    @inject('ArchiveTaskRepository') private archiveTaskRepo: ArchiveTaskRepository,
    @inject('Logger') private logger: Logger
  ) {}

  /**
   * 處理歸檔任務
   */
  async processArchiveTask(message: ArchiveTaskMessage): Promise<void> {
    return this.concurrencyLimit(async () => {
      const startTime = Date.now();
      let task: any = null;

      try {
        this.logger.info('Starting archive task processing', {
          taskId: message.taskId,
          jobType: message.jobType,
          batchId: message.batchId
        });

        // 獲取任務記錄
        task = await this.archiveTaskRepo.findById(parseInt(message.taskId));
        if (!task) {
          throw new Error(`Archive task not found: ${message.taskId}`);
        }

        // 標記任務開始
        await task.markAsStarted();

        // 執行歸檔處理
        const result = await this.executeArchive(message, task);

        // 標記任務完成
        await task.markAsCompleted(result.totalRecords, result.archivedRecords);

        // 發送成功結果
        await this.publishResult({
          taskId: message.taskId,
          taskType: TaskType.ARCHIVE,
          status: ScheduleStatus.COMPLETED,
          totalRecords: result.totalRecords,
          processedRecords: result.archivedRecords,
          executionTime: Math.round((Date.now() - startTime) / 1000),
          completedAt: new Date(),
          metadata: {
            jobType: message.jobType,
            batchId: message.batchId
          }
        });

        this.logger.info('Archive task completed successfully', {
          taskId: message.taskId,
          totalRecords: result.totalRecords,
          archivedRecords: result.archivedRecords,
          executionTime: Date.now() - startTime
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // 標記任務失敗
        if (task) {
          await task.markAsFailed(errorMessage);
        }

        // 發送失敗結果
        await this.publishResult({
          taskId: message.taskId,
          taskType: TaskType.ARCHIVE,
          status: ScheduleStatus.FAILED,
          errorMessage,
          executionTime: Math.round((Date.now() - startTime) / 1000),
          completedAt: new Date(),
          metadata: {
            jobType: message.jobType,
            batchId: message.batchId
          }
        });

        this.logger.error('Archive task failed', {
          taskId: message.taskId,
          error: errorMessage,
          executionTime: Date.now() - startTime
        });

        throw error;
      }
    });
  }

  /**
   * 執行歸檔操作
   */
  private async executeArchive(message: ArchiveTaskMessage, task: any): Promise<{
    totalRecords: number;
    archivedRecords: number;
  }> {
    const { jobType, batchId, dateRangeStart, dateRangeEnd, batchSize } = message;
    const { tableName, archiveTableName } = message.metadata || {};

    if (!tableName || !archiveTableName) {
      throw new Error('Missing table names in message metadata');
    }

    // 查詢需要歸檔的總記錄數
    const totalRecords = await this.countRecordsToArchive(tableName, dateRangeStart, dateRangeEnd);
    
    if (totalRecords === 0) {
      this.logger.info('No records to archive', { taskId: message.taskId, tableName });
      return { totalRecords: 0, archivedRecords: 0 };
    }

    await task.updateProgress(0, totalRecords);

    let archivedRecords = 0;
    let offset = 0;

    // 批量處理歸檔
    while (offset < totalRecords) {
      const currentBatchSize = Math.min(batchSize, totalRecords - offset);
      
      this.logger.debug('Processing archive batch', {
        taskId: message.taskId,
        offset,
        batchSize: currentBatchSize,
        progress: `${archivedRecords}/${totalRecords}`
      });

      const batchResult = await this.processBatch({
        tableName,
        archiveTableName,
        dateRangeStart,
        dateRangeEnd,
        batchSize: currentBatchSize,
        offset,
        batchId,
        jobType
      });

      archivedRecords += batchResult.processed;
      offset += currentBatchSize;

      // 更新進度
      await task.updateProgress(archivedRecords);

      // 批次間短暫暫停，避免資源過度使用
      if (offset < totalRecords) {
        await this.delay(100);
      }
    }

    return { totalRecords, archivedRecords };
  }

  /**
   * 處理單個批次
   */
  private async processBatch(params: {
    tableName: string;
    archiveTableName: string;
    dateRangeStart: Date;
    dateRangeEnd: Date;
    batchSize: number;
    offset: number;
    batchId: string;
    jobType: string;
  }): Promise<{ processed: number }> {
    const { tableName, archiveTableName, dateRangeStart, dateRangeEnd, batchSize, offset, batchId, jobType } = params;

    return await this.database.transaction(async (connection) => {
      // 1. 查詢待歸檔的數據
      const selectSql = `
        SELECT * FROM ${tableName} 
        WHERE createdAt >= ? AND createdAt <= ? 
          AND (archived_at IS NULL)
        ORDER BY id ASC
        LIMIT ? OFFSET ?
      `;

      const records = await this.database.query(selectSql, [dateRangeStart, dateRangeEnd, batchSize, offset]);
      
      if (records.length === 0) {
        return { processed: 0 };
      }

      // 2. 準備歸檔記錄
      const archiveRecords = records.map(record => ({
        ...record,
        original_id: record.id,
        archived_at: new Date(),
        archive_batch_id: batchId
      }));

      // 移除 id 欄位，讓歸檔表自動生成新的 ID
      archiveRecords.forEach(record => delete record.id);

      // 3. 插入到歸檔表
      await this.database.batchInsert(archiveTableName, archiveRecords);

      // 4. 標記原始記錄為已歸檔
      const recordIds = records.map(r => r.id);
      const updateSql = `
        UPDATE ${tableName} 
        SET archived_at = NOW(), archive_batch_id = ?
        WHERE id IN (${recordIds.map(() => '?').join(',')})
      `;

      await this.database.query(updateSql, [batchId, ...recordIds]);

      // 5. 安排延遲清理任務 (7天後物理刪除)
      await this.scheduleCleanupTask(tableName, jobType, batchId, recordIds);

      return { processed: records.length };
    });
  }

  /**
   * 處理清理任務
   */
  async processCleanupTask(message: CleanupTaskMessage): Promise<void> {
    return this.concurrencyLimit(async () => {
      const startTime = Date.now();

      try {
        this.logger.info('Starting cleanup task processing', {
          taskId: message.taskId,
          tableName: message.tableName,
          cleanupType: message.cleanupType
        });

        let result: { deletedRecords: number };

        if (message.cleanupType === 'physical_delete') {
          result = await this.executePhysicalDelete(message);
        } else {
          result = await this.executeMarkArchived(message);
        }

        // 發送成功結果
        await this.publishResult({
          taskId: message.taskId,
          taskType: TaskType.CLEANUP,
          status: ScheduleStatus.COMPLETED,
          processedRecords: result.deletedRecords,
          executionTime: Math.round((Date.now() - startTime) / 1000),
          completedAt: new Date(),
          metadata: {
            tableName: message.tableName,
            cleanupType: message.cleanupType
          }
        });

        this.logger.info('Cleanup task completed successfully', {
          taskId: message.taskId,
          deletedRecords: result.deletedRecords,
          executionTime: Date.now() - startTime
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // 發送失敗結果
        await this.publishResult({
          taskId: message.taskId,
          taskType: TaskType.CLEANUP,
          status: ScheduleStatus.FAILED,
          errorMessage,
          executionTime: Math.round((Date.now() - startTime) / 1000),
          completedAt: new Date(),
          metadata: {
            tableName: message.tableName,
            cleanupType: message.cleanupType
          }
        });

        this.logger.error('Cleanup task failed', {
          taskId: message.taskId,
          error: errorMessage,
          executionTime: Date.now() - startTime
        });

        throw error;
      }
    });
  }

  /**
   * 執行物理刪除
   */
  private async executePhysicalDelete(message: CleanupTaskMessage): Promise<{ deletedRecords: number }> {
    const { tableName, dateThreshold, batchSize } = message;

    const condition = `
      archived_at IS NOT NULL 
      AND archived_at < ?
    `;

    const deletedRecords = await this.database.batchDelete(
      tableName,
      condition,
      [dateThreshold],
      batchSize
    );

    this.logger.info('Physical delete completed', {
      taskId: message.taskId,
      tableName,
      deletedRecords,
      dateThreshold: dateThreshold.toISOString()
    });

    return { deletedRecords };
  }

  /**
   * 執行標記歸檔
   */
  private async executeMarkArchived(message: CleanupTaskMessage): Promise<{ deletedRecords: number }> {
    const { tableName, dateThreshold, batchSize } = message;

    const updateSql = `
      UPDATE ${tableName} 
      SET archived_at = NOW() 
      WHERE archived_at IS NULL 
        AND createdAt < ?
      LIMIT ?
    `;

    let totalMarked = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await this.database.query(updateSql, [dateThreshold, batchSize]) as any;
      const markedCount = result.affectedRows || 0;
      
      totalMarked += markedCount;
      hasMore = markedCount === batchSize;

      if (hasMore) {
        await this.delay(50);
      }
    }

    this.logger.info('Mark as archived completed', {
      taskId: message.taskId,
      tableName,
      markedRecords: totalMarked,
      dateThreshold: dateThreshold.toISOString()
    });

    return { deletedRecords: totalMarked };
  }

  /**
   * 計算需要歸檔的記錄數
   */
  private async countRecordsToArchive(tableName: string, startDate: Date, endDate: Date): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count 
      FROM ${tableName} 
      WHERE createdAt >= ? AND createdAt <= ? 
        AND (archived_at IS NULL)
    `;

    const result = await this.database.query(sql, [startDate, endDate]);
    return result[0]?.count || 0;
  }

  /**
   * 安排清理任務
   */
  private async scheduleCleanupTask(
    tableName: string, 
    jobType: string, 
    batchId: string, 
    recordIds: number[]
  ): Promise<void> {
    const cleanupMessage: CleanupTaskMessage = {
      taskId: `cleanup_${batchId}_${Date.now()}`,
      taskType: TaskType.CLEANUP,
      jobType: jobType as any,
      tableName,
      cleanupType: 'physical_delete',
      dateThreshold: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天後
      batchSize: 1000,
      priority: 3,
      retryCount: 0,
      maxRetries: 2,
      createdAt: new Date(),
      metadata: {
        originalBatchId: batchId,
        recordCount: recordIds.length
      }
    };

    // 發送延遲7天的清理任務
    await this.rabbitMQService.publishDelayed(
      'delayed.cleanup',
      cleanupMessage,
      7 * 24 * 60 * 60 * 1000 // 7天延遲
    );

    this.logger.info('Scheduled cleanup task', {
      cleanupTaskId: cleanupMessage.taskId,
      originalBatchId: batchId,
      tableName,
      recordCount: recordIds.length,
      scheduledFor: cleanupMessage.dateThreshold.toISOString()
    });
  }

  /**
   * 發送任務結果
   */
  private async publishResult(result: TaskResultMessage): Promise<void> {
    try {
      await this.rabbitMQService.publishTaskResult(result);
    } catch (error) {
      this.logger.error('Failed to publish task result', {
        error,
        taskId: result.taskId,
        status: result.status
      });
      // 不重新拋出錯誤，避免影響任務完成狀態
    }
  }

  /**
   * 延遲函數
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 獲取處理器狀態
   */
  getStatus(): {
    isProcessing: boolean;
    pendingTasks: number;
    concurrencyLimit: number;
  } {
    return {
      isProcessing: this.isProcessing,
      pendingTasks: this.concurrencyLimit.pendingCount,
      concurrencyLimit: this.concurrencyLimit.limit
    };
  }

  /**
   * 設置併發限制
   */
  setConcurrencyLimit(limit: number): void {
    this.concurrencyLimit = pLimit(limit);
    this.logger.info('Concurrency limit updated', { newLimit: limit });
  }
}