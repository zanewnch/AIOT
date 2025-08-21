/**
 * @fileoverview 歸檔處理器 (Archive Processor) - 核心業務邏輯實作
 * 
 * 【Processor vs Consumer 職責分工】
 * 
 * 🔄 ArchiveConsumer (訊息消費者)          vs    ⚙️ ArchiveProcessor (業務處理器)
 * ├── 📥 RabbitMQ 訊息接收                    ├── 💾 核心歸檔業務邏輯
 * ├── 🔍 訊息格式驗證                        ├── 📊 分批數據處理
 * ├── 🔄 錯誤處理和重試                      ├── 🚥 併發控制管理
 * ├── 📤 結果回報到隊列                      ├── 💿 資料庫事務操作
 * └── 📞 委派給 Processor 處理               └── 📈 任務狀態追蹤
 * 
 * 【責任分離的好處】
 * 1. 單一職責：Consumer 專注訊息處理，Processor 專注業務邏輯
 * 2. 可測試性：可以獨立測試業務邏輯，無需 RabbitMQ 環境
 * 3. 可重用性：Processor 可被其他方式調用 (如定時任務、手動觸發)
 * 4. 維護性：訊息技術細節與業務邏輯完全分離
 * 
 * 【設計意圖 (Intention)】
 * 這是一個專門處理數據歸檔和清理任務的核心處理器，設計目的：
 * 1. 異步處理大量歷史數據的歸檔操作，避免阻塞主要業務流程
 * 2. 提供分批處理機制，防止大數據量操作導致資料庫鎖定或記憶體溢出
 * 3. 實現兩階段清理策略：先標記為已歸檔，後物理刪除，確保數據安全
 * 4. 支援併發控制和失敗重試，保證系統穩定性和數據一致性
 * 
 * 【實作架構 (Implementation Architecture)】
 * - 被 ArchiveConsumer 調用，專注於業務邏輯執行
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
  DatabaseConnection,
  ArchiveTaskRepo
} from '../types/processor.types';
import { TYPES } from '../container/types';
import { config } from '../configs/environment';

/**
 * 歸檔處理器主類別 - 純業務邏輯實作
 * 
 * 【設計原則】
 * - 不依賴 RabbitMQ 技術細節，只專注業務邏輯
 * - 可被多種方式調用：Consumer、定時任務、手動觸發
 * - 所有方法都是純函數風格，便於單元測試
 * - 完整的錯誤處理，但不負責訊息隊列的重試邏輯
 * 
 * 【核心業務流程】
 * 1. processArchiveTask() ──► executeArchive() ──► processBatch()
 * 2. processCleanupTask() ──► executeCleanup()
 * 
 * 【與 Consumer 的互動】
 * Consumer.handleMessage() ──► Processor.processXxxTask() ──► return result
 *     ↑                                                              ↓
 * 接收 RabbitMQ 訊息                                          返回處理結果
 *     ↑                                                              ↓
 * 發送結果到隊列     ←───────────────────────────────────── Consumer 處理結果
 */
@injectable()
export class ArchiveProcessor {
  // 【實作策略】使用 p-limit 限制併發處理數量，防止資源過載和資料庫連線耗盡
  private concurrencyLimit = pLimit(config.processor.concurrency);
  
  // 【狀態追蹤】標記處理器當前是否正在處理任務，用於健康檢查和監控
  private isProcessing = false;

  constructor(
    @inject(TYPES.DatabaseConnection) private database: DatabaseConnection,
    @inject(TYPES.ArchiveTaskRepo) private archiveTaskRepo: ArchiveTaskRepo,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  /**
   * 處理歸檔任務 - 核心業務邏輯方法
   * 
   * 【Processor 的職責】
   * - ✅ 執行歸檔業務邏輯：數據遷移、狀態更新、事務管理
   * - ✅ 併發控制和性能優化
   * - ✅ 任務狀態追蹤和進度記錄
   * - ✅ 業務層面的錯誤處理
   * 
   * 【不是 Processor 的職責】
   * - ❌ RabbitMQ 訊息接收和驗證 (由 Consumer 負責)
   * - ❌ 訊息隊列的重試邏輯 (由 Consumer 負責)
   * - ❌ 結果回報到 RabbitMQ (由 Consumer 負責)
   * - ❌ 網路層面的錯誤處理 (由 Consumer 負責)
   * 
   * 【與 Consumer 的協作】
   * Consumer 已經驗證過訊息格式，Processor 只需專注業務邏輯
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
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });

        // 更新任務失敗狀態
        const task = await this.archiveTaskRepo.findByTaskId(message.taskId);
        if (task) {
          await this.archiveTaskRepo.update(task.id, {
            status: 'failed',
            error_message: error instanceof Error ? error.message : String(error),
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
   * 處理清理任務 - 核心業務邏輯方法
   * 
   * 【職責說明】
   * 與 processArchiveTask 類似，專注於清理業務邏輯：
   * - 標記已歸檔記錄
   * - 物理刪除過期數據
   * - 批次處理防止鎖表
   * 
   * 【與 Consumer 的分工】
   * Consumer 負責訊息處理，Processor 負責數據清理邏輯
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
          error: error instanceof Error ? error.message : String(error)
        });

        const task = await this.archiveTaskRepo.findByTaskId(message.taskId);
        if (task) {
          await this.archiveTaskRepo.update(task.id, {
            status: 'failed',
            error_message: error instanceof Error ? error.message : String(error),
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
   * 執行歸檔處理 - 內部業務邏輯
   * 
   * 【純業務邏輯】
   * 這是核心的數據歸檔邏輯，不涉及任何 RabbitMQ 技術細節：
   * - 計算需要歸檔的記錄數量
   * - 分批處理避免大事務
   * - 數據從主表遷移到歸檔表
   * - 標記原記錄為已歸檔
   */
  private async executeArchive(message: ArchiveTaskMessage): Promise<{
    totalRecords: number;
    processedRecords: number;
  }> {
    let totalRecords = 0;
    let processedRecords = 0;

    try {
      return await this.database.transaction(async () => {
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
        error: error instanceof Error ? error.message : String(error),
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
        error: error instanceof Error ? error.message : String(error)
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
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 獲取表配置
   */
  private getTableConfig(jobType: string): {
    sourceTable: string;
    archiveTable: string;
    dateColumn: string;
  } {
    const configs: Record<string, {
      sourceTable: string;
      archiveTable: string;
      dateColumn: string;
    }> = {
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
   * 健康檢查 - 業務邏輯層面的健康狀態
   * 
   * 【說明】
   * 這只檢查 Processor 本身的狀態，不檢查 RabbitMQ 連線
   * Consumer 會有自己的健康檢查來檢查訊息隊列狀態
   */
  isHealthy(): boolean {
    return !this.isProcessing; // 簡單的健康檢查
  }

  /**
   * 獲取處理狀態 - 純業務層面的狀態資訊
   * 
   * 【與 Consumer 狀態的區別】
   * - Processor: 是否正在執行業務邏輯
   * - Consumer: 是否正在監聽訊息隊列
   */
  getStatus(): { isProcessing: boolean } {
    return { isProcessing: this.isProcessing };
  }
}