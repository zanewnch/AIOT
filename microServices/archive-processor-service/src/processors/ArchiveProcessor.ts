/**
 * @fileoverview 歸檔處理器 - 新架構實作
 * 
 * 【設計意圖 (Intention)】
 * 這是一個專門處理數據歸檔和清理任務的核心處理器，設計目的：
 * 1. 異步處理大量歷史數據的歸檔操作，避免阻塞主要業務流程
 * 2. 提供分批處理機制，防止大數據量操作導致資料庫鎖定或記憶體溢出
 * 3. 實現兩階段清理策略：先標記為已歸檔，後物理刪除，確保數據安全
 * 4. 支援併發控制和失敗重試，保證系統穩定性和數據一致性
 * 
 * 【實作架構 (Implementation Architecture)】
 * - 使用 RabbitMQ Consumer 模式接收 Scheduler 發送的歸檔任務
 * - 採用 p-limit 控制併發處理數量，防止資源過載
 * - 透過資料庫事務確保歸檔操作的原子性
 * - 實作詳細的日誌記錄和錯誤處理機制
 * - 支援處理進度追蹤和狀態回報
 */

import { injectable, inject } from 'inversify';
import pLimit from 'p-limit';
import { Logger } from 'winston';
import { 
  ArchiveTaskMessage, 
  CleanupTaskMessage, 
  TaskResultMessage, 
  TaskType, 
  ScheduleStatus,
  DatabaseConnection,
  RabbitMQService,
  ArchiveTaskRepo
} from '../types/processor.types';
import { TYPES } from '../container/types';
import { config } from '../configs/environment';

@injectable()
export class ArchiveProcessor {
  // 【實作策略】使用 p-limit 限制併發處理數量，防止資源過載和資料庫連線耗盡
  private concurrencyLimit = pLimit(config.processor.concurrency);
  
  // 【狀態追蹤】標記處理器當前是否正在處理任務，用於健康檢查和監控
  private isProcessing = false;

  constructor(
    @inject(TYPES.DatabaseConnection) private database: DatabaseConnection,
    @inject(TYPES.RabbitMQService) private rabbitMQService: RabbitMQService,
    @inject(TYPES.ArchiveTaskRepo) private archiveTaskRepo: ArchiveTaskRepo,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  /**
   * 處理歸檔任務 - 核心方法
   * 
   * @param message - 歸檔任務訊息，包含任務ID、批次資訊、日期範圍等
   * @returns 處理結果包含總記錄數、處理記錄數和執行時間
   */
  async processArchiveTask(message: ArchiveTaskMessage): Promise<{
    totalRecords: number;
    processedRecords: number;
    executionTime: number;
  }> {
    return this.concurrencyLimit(async () => {
      const startTime = Date.now();
      let totalRecords = 0;
      let processedRecords = 0;

      try {
        this.isProcessing = true;
        
        this.logger.info('Starting archive task processing', {
          taskId: message.taskId,
          jobType: message.jobType,
          batchId: message.batchId,
          dateRange: `${message.dateRangeStart} to ${message.dateRangeEnd}`
        });

        // 查找或創建任務記錄
        let task = await this.archiveTaskRepo.findByTaskId(message.taskId);
        if (!task) {
          task = await this.archiveTaskRepo.create({
            task_id: message.taskId,
            job_type: message.jobType,
            status: 'running',
            batch_id: message.batchId,
            started_at: new Date()
          });
        } else {
          // 更新任務為運行狀態
          await this.archiveTaskRepo.update(task.id, {
            status: 'running',
            started_at: new Date()
          });
        }

        // 執行歸檔處理
        const result = await this.executeArchive(message);
        totalRecords = result.totalRecords;
        processedRecords = result.processedRecords;

        // 更新任務完成狀態
        await this.archiveTaskRepo.update(task.id, {
          status: 'completed',
          total_records: totalRecords,
          processed_records: processedRecords,
          completed_at: new Date()
        });

        this.logger.info('Archive task completed successfully', {
          taskId: message.taskId,
          totalRecords,
          processedRecords,
          executionTime: Date.now() - startTime
        });

        return {
          totalRecords,
          processedRecords,
          executionTime: Date.now() - startTime
        };

      } catch (error) {
        this.logger.error('Archive task failed', {
          taskId: message.taskId,
          error: error.message,
          stack: error.stack
        });

        // 更新任務失敗狀態
        const task = await this.archiveTaskRepo.findByTaskId(message.taskId);
        if (task) {
          await this.archiveTaskRepo.update(task.id, {
            status: 'failed',
            error_message: error.message,
            completed_at: new Date()
          });
        }

        throw error;
      } finally {
        this.isProcessing = false;
      }
    });
  }

  /**
   * 處理清理任務
   */
  async processCleanupTask(message: CleanupTaskMessage): Promise<{
    totalRecords: number;
    processedRecords: number;
    executionTime: number;
  }> {
    return this.concurrencyLimit(async () => {
      const startTime = Date.now();
      let totalRecords = 0;
      let processedRecords = 0;

      try {
        this.isProcessing = true;

        this.logger.info('Starting cleanup task processing', {
          taskId: message.taskId,
          jobType: message.jobType,
          tableName: message.tableName,
          cleanupType: message.cleanupType
        });

        // 查找或創建任務記錄
        let task = await this.archiveTaskRepo.findByTaskId(message.taskId);
        if (!task) {
          task = await this.archiveTaskRepo.create({
            task_id: message.taskId,
            job_type: message.jobType,
            status: 'running',
            started_at: new Date()
          });
        } else {
          await this.archiveTaskRepo.update(task.id, {
            status: 'running',
            started_at: new Date()
          });
        }

        // 執行清理處理
        const result = await this.executeCleanup(message);
        totalRecords = result.totalRecords;
        processedRecords = result.processedRecords;

        // 更新任務完成狀態
        await this.archiveTaskRepo.update(task.id, {
          status: 'completed',
          total_records: totalRecords,
          processed_records: processedRecords,
          completed_at: new Date()
        });

        this.logger.info('Cleanup task completed successfully', {
          taskId: message.taskId,
          totalRecords,
          processedRecords,
          executionTime: Date.now() - startTime
        });

        return {
          totalRecords,
          processedRecords,
          executionTime: Date.now() - startTime
        };

      } catch (error) {
        this.logger.error('Cleanup task failed', {
          taskId: message.taskId,
          error: error.message
        });

        const task = await this.archiveTaskRepo.findByTaskId(message.taskId);
        if (task) {
          await this.archiveTaskRepo.update(task.id, {
            status: 'failed',
            error_message: error.message,
            completed_at: new Date()
          });
        }

        throw error;
      } finally {
        this.isProcessing = false;
      }
    });
  }

  /**
   * 執行歸檔處理
   */
  private async executeArchive(message: ArchiveTaskMessage): Promise<{
    totalRecords: number;
    processedRecords: number;
  }> {
    let totalRecords = 0;
    let processedRecords = 0;

    try {
      return await this.database.transaction(async (connection) => {
        // 根據 jobType 確定要處理的表
        const tableConfig = this.getTableConfig(message.jobType);
        
        // 計算總記錄數
        const countSql = `
          SELECT COUNT(*) as total 
          FROM ${tableConfig.sourceTable} 
          WHERE ${tableConfig.dateColumn} >= ? 
          AND ${tableConfig.dateColumn} <= ?
          AND archived_at IS NULL
        `;
        
        const countResult = await this.database.query(countSql, [
          message.dateRangeStart,
          message.dateRangeEnd
        ]);
        
        totalRecords = countResult[0]?.total || 0;

        this.logger.info('Archive operation started', {
          taskId: message.taskId,
          sourceTable: tableConfig.sourceTable,
          archiveTable: tableConfig.archiveTable,
          totalRecords,
          batchSize: message.batchSize
        });

        // 分批處理記錄
        let offset = 0;
        const batchSize = message.batchSize || config.processor.defaultBatchSize;

        while (offset < totalRecords) {
          const batchResult = await this.processBatch(
            message,
            tableConfig,
            offset,
            batchSize
          );
          
          processedRecords += batchResult;
          offset += batchSize;

          this.logger.debug('Batch processed', {
            taskId: message.taskId,
            batchProcessed: batchResult,
            totalProcessed: processedRecords,
            totalRecords,
            progress: `${Math.round((processedRecords / totalRecords) * 100)}%`
          });

          // 避免長時間運行的事務
          if (offset % (batchSize * 10) === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        return { totalRecords, processedRecords };
      });
    } catch (error) {
      this.logger.error('Archive execution failed', {
        taskId: message.taskId,
        error: error.message,
        totalRecords,
        processedRecords
      });
      throw error;
    }
  }

  /**
   * 執行清理處理
   */
  private async executeCleanup(message: CleanupTaskMessage): Promise<{
    totalRecords: number;
    processedRecords: number;
  }> {
    let totalRecords = 0;
    let processedRecords = 0;

    try {
      const condition = `created_at <= ? AND archived_at IS NOT NULL`;
      const params = [message.dateThreshold];

      if (message.cleanupType === 'mark_archived') {
        // 標記為已歸檔
        const updateSql = `UPDATE ${message.tableName} SET archived_at = NOW() WHERE ${condition} AND archived_at IS NULL`;
        const result = await this.database.query(updateSql, params);
        processedRecords = (result as any).affectedRows || 0;
        totalRecords = processedRecords;
      } else if (message.cleanupType === 'physical_delete') {
        // 物理刪除
        processedRecords = await this.database.batchDelete(
          message.tableName,
          condition,
          params,
          message.batchSize
        );
        totalRecords = processedRecords;
      }

      return { totalRecords, processedRecords };
    } catch (error) {
      this.logger.error('Cleanup execution failed', {
        taskId: message.taskId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 處理單一批次
   */
  private async processBatch(
    message: ArchiveTaskMessage,
    tableConfig: any,
    offset: number,
    batchSize: number
  ): Promise<number> {
    try {
      // 選取一批記錄
      const selectSql = `
        SELECT * FROM ${tableConfig.sourceTable}
        WHERE ${tableConfig.dateColumn} >= ?
        AND ${tableConfig.dateColumn} <= ?
        AND archived_at IS NULL
        ORDER BY ${tableConfig.dateColumn}
        LIMIT ? OFFSET ?
      `;

      const records = await this.database.query(selectSql, [
        message.dateRangeStart,
        message.dateRangeEnd,
        batchSize,
        offset
      ]);

      if (records.length === 0) {
        return 0;
      }

      // 插入到歸檔表
      const insertedCount = await this.database.batchInsert(
        tableConfig.archiveTable,
        records,
        batchSize
      );

      // 標記原記錄為已歸檔
      const recordIds = records.map((r: any) => r.id);
      const updateSql = `
        UPDATE ${tableConfig.sourceTable}
        SET archived_at = NOW()
        WHERE id IN (${recordIds.map(() => '?').join(',')})
      `;
      
      await this.database.query(updateSql, recordIds);

      return insertedCount;
    } catch (error) {
      this.logger.error('Batch processing failed', {
        taskId: message.taskId,
        offset,
        batchSize,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 獲取表配置
   */
  private getTableConfig(jobType: string) {
    const configs = {
      'positions': {
        sourceTable: 'drone_positions',
        archiveTable: 'drone_positions_archive',
        dateColumn: 'created_at'
      },
      'commands': {
        sourceTable: 'drone_commands',
        archiveTable: 'drone_commands_archive',
        dateColumn: 'created_at'
      },
      'status': {
        sourceTable: 'drone_status',
        archiveTable: 'drone_status_archive',
        dateColumn: 'created_at'
      }
    };

    const config = configs[jobType];
    if (!config) {
      throw new Error(`Unknown job type: ${jobType}`);
    }

    return config;
  }

  /**
   * 健康檢查
   */
  isHealthy(): boolean {
    return !this.isProcessing; // 簡單的健康檢查
  }

  /**
   * 獲取處理狀態
   */
  getStatus(): { isProcessing: boolean } {
    return { isProcessing: this.isProcessing };
  }
}