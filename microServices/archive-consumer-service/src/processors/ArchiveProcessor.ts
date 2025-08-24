/**
 * @fileoverview 歸檔處理器 (Archive Processor) - 核心業務邏輯實作
 * 
 * 【Processor vs Consumer 職責分工】
 * 
 * ArchiveConsumer (訊息消費者) 負責：
 * - RabbitMQ 訊息接收
 * - 訊息格式驗證
 * - 錯誤處理和重試
 * - 結果回報到隊列
 * - 委派給 Processor 處理
 * 
 * ArchiveProcessor (業務處理器) 負責：
 * - 核心歸檔業務邏輯
 * - 分批數據處理
 * - 併發控制管理
 * - 資料庫事務操作
 * - 任務狀態追蹤
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

// 依賴注入框架，用於管理類別依賴關係
import { injectable, inject } from 'inversify';
// 併發控制套件，限制同時執行的 Promise 數量，防止資源過載
import pLimit from 'p-limit';
// Winston 日誌框架的 Logger 類型定義
import { Logger } from 'winston';
// 業務相關的類型定義
import { 
  ArchiveTaskMessage,    // 歸檔任務訊息格式
  CleanupTaskMessage,    // 清理任務訊息格式
  DatabaseConnection,    // 資料庫連接介面
  ArchiveTaskRepo        // 歸檔任務儲存庫介面
} from '../types/processor.types';
// 依賴注入的類型常數定義
import { TYPES } from '../container/types';
// 環境配置，包含併發限制和批次大小等設定
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
 * 1. 歸檔流程：processArchiveTask() → executeArchive() → processBatch()
 * 2. 清理流程：processCleanupTask() → executeCleanup()
 * 
 * 【與 Consumer 的互動】
 * 1. Consumer.handleMessage() 接收 RabbitMQ 訊息
 * 2. Consumer 調用 Processor.processXxxTask() 處理業務邏輯
 * 3. Processor 返回處理結果給 Consumer
 * 4. Consumer 處理結果並發送回 RabbitMQ 隊列
 */
// 標記此類別為可注入，讓 InversifyJS 容器可以管理其實例
@injectable()
export class ArchiveProcessor {
  // 併發限制器：使用 p-limit 控制同時執行的 Promise 數量
  // 防止大量並行處理造成資料庫連線耗盡或系統資源過載
  private concurrencyLimit = pLimit(config.processor.concurrency);
  
  // 處理狀態標記：追蹤目前是否有任務正在處理中
  // 用於健康檢查、監控和防止重複處理
  private isProcessing = false;

  /**
   * 建構子 - 使用依賴注入方式初始化所需的服務
   * @param database - 資料庫連接服務，負責所有 SQL 操作和事務管理
   * @param archiveTaskRepo - 歸檔任務儲存庫，管理任務狀態的持久化
   * @param logger - Winston 日誌服務，記錄處理過程和錯誤資訊
   */
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
  processArchiveTask = async (message: ArchiveTaskMessage): Promise<{
    totalRecords: number;
    processedRecords: number;
    executionTime: number;
  }> => {
    // 使用併發限制器確保不會同時執行過多歸檔任務
    // 這個 Promise 會排隊等待直到有可用的併發槽位
    return this.concurrencyLimit(async () => {
      // 記錄任務開始時間，用於計算總執行時間
      const startTime = Date.now();
      // 初始化統計變數
      let totalRecords = 0;
      let processedRecords = 0;

      try {
        // 標記處理器為處理中狀態，用於健康檢查和監控
        this.isProcessing = true;
        
        // 記錄開始處理歸檔任務的詳細資訊
        this.logger.info('Starting archive task processing', {
          taskId: message.taskId,                                           // 任務唯一識別碼
          jobType: message.jobType,                                         // 工作類型 (positions, commands, status)
          batchId: message.batchId,                                         // 批次識別碼
          dateRange: `${message.dateRangeStart} to ${message.dateRangeEnd}` // 處理的日期範圍
        });

        // 在資料庫中查找現有的任務記錄，用於追蹤任務狀態
        let task = await this.archiveTaskRepo.findByTaskId(message.taskId);
        if (!task) {
          // 如果任務記錄不存在，創建新的任務記錄
          task = await this.archiveTaskRepo.create({
            task_id: message.taskId,      // 任務ID
            job_type: message.jobType,    // 工作類型
            status: 'running',            // 設置為運行狀態
            batch_id: message.batchId,    // 批次ID
            started_at: new Date()        // 開始時間
          });
        } else {
          // 如果任務記錄已存在，更新為運行狀態（可能是重試的情況）
          await this.archiveTaskRepo.update(task.id, {
            status: 'running',            // 更新狀態為運行中
            started_at: new Date()        // 更新開始時間
          });
        }

        // 執行實際的歸檔處理業務邏輯
        const result = await this.executeArchive(message);
        totalRecords = result.totalRecords;         // 取得總記錄數
        processedRecords = result.processedRecords; // 取得實際處理的記錄數

        // 更新任務狀態為完成，並記錄處理結果統計
        await this.archiveTaskRepo.update(task.id, {
          status: 'completed',                    // 完成狀態
          total_records: totalRecords,            // 總記錄數
          processed_records: processedRecords,    // 處理記錄數
          completed_at: new Date()                // 完成時間
        });

        // 記錄任務成功完成的詳細資訊
        this.logger.info('Archive task completed successfully', {
          taskId: message.taskId,
          totalRecords,
          processedRecords,
          executionTime: Date.now() - startTime   // 總執行時間（毫秒）
        });

        // 返回處理結果給上層調用者（Consumer）
        return {
          totalRecords,
          processedRecords,
          executionTime: Date.now() - startTime
        };

      } catch (error) {
        // 處理執行過程中發生的錯誤
        
        // 記錄詳細的錯誤資訊，包含堆疊追蹤以便除錯
        this.logger.error('Archive task failed', {
          taskId: message.taskId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });

        // 更新資料庫中的任務狀態為失敗
        const task = await this.archiveTaskRepo.findByTaskId(message.taskId);
        if (task) {
          await this.archiveTaskRepo.update(task.id, {
            status: 'failed',                                               // 失敗狀態
            error_message: error instanceof Error ? error.message : String(error), // 錯誤訊息
            completed_at: new Date()                                        // 完成時間（失敗也是一種完成）
          });
        }

        // 重新拋出錯誤，讓上層 Consumer 處理重試邏輯
        throw error;
      } finally {
        // 無論成功或失敗都要重置處理狀態
        this.isProcessing = false;
      }
    });
  };

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
  processCleanupTask = async (message: CleanupTaskMessage): Promise<{
    totalRecords: number;
    processedRecords: number;
    executionTime: number;
  }> => {
    // 使用併發限制器確保不會同時執行過多清理任務
    return this.concurrencyLimit(async () => {
      // 記錄任務開始時間，用於計算總執行時間
      const startTime = Date.now();
      // 初始化統計變數
      let totalRecords = 0;
      let processedRecords = 0;

      try {
        // 標記處理器為處理中狀態
        this.isProcessing = true;

        // 記錄開始處理清理任務的詳細資訊
        this.logger.info('Starting cleanup task processing', {
          taskId: message.taskId,           // 任務唯一識別碼
          jobType: message.jobType,         // 工作類型
          tableName: message.tableName,     // 要清理的資料表名稱
          cleanupType: message.cleanupType  // 清理方式 (mark_archived 或 physical_delete)
        });

        // 在資料庫中查找或創建任務記錄
        let task = await this.archiveTaskRepo.findByTaskId(message.taskId);
        if (!task) {
          // 創建新的清理任務記錄
          task = await this.archiveTaskRepo.create({
            task_id: message.taskId,      // 任務ID
            job_type: message.jobType,    // 工作類型
            status: 'running',            // 運行狀態
            started_at: new Date()        // 開始時間
          });
        } else {
          // 更新現有任務為運行狀態
          await this.archiveTaskRepo.update(task.id, {
            status: 'running',            // 更新為運行狀態
            started_at: new Date()        // 更新開始時間
          });
        }

        // 執行實際的清理處理業務邏輯
        const result = await this.executeCleanup(message);
        totalRecords = result.totalRecords;         // 總記錄數
        processedRecords = result.processedRecords; // 實際處理記錄數

        // 更新任務狀態為完成
        await this.archiveTaskRepo.update(task.id, {
          status: 'completed',                    // 完成狀態
          total_records: totalRecords,            // 記錄總數
          processed_records: processedRecords,    // 處理記錄數
          completed_at: new Date()                // 完成時間
        });

        // 記錄清理任務成功完成
        this.logger.info('Cleanup task completed successfully', {
          taskId: message.taskId,
          totalRecords,
          processedRecords,
          executionTime: Date.now() - startTime   // 執行時間
        });

        // 返回處理結果
        return {
          totalRecords,
          processedRecords,
          executionTime: Date.now() - startTime
        };

      } catch (error) {
        // 處理清理過程中的錯誤
        this.logger.error('Cleanup task failed', {
          taskId: message.taskId,
          error: error instanceof Error ? error.message : String(error)
        });

        // 更新任務狀態為失敗
        const task = await this.archiveTaskRepo.findByTaskId(message.taskId);
        if (task) {
          await this.archiveTaskRepo.update(task.id, {
            status: 'failed',                                               // 失敗狀態
            error_message: error instanceof Error ? error.message : String(error), // 錯誤訊息
            completed_at: new Date()                                        // 完成時間
          });
        }

        // 重新拋出錯誤供上層處理
        throw error;
      } finally {
        // 重置處理狀態
        this.isProcessing = false;
      }
    });
  };

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
  private executeArchive = async (message: ArchiveTaskMessage): Promise<{
    totalRecords: number;
    processedRecords: number;
  }> => {
    // 初始化統計變數
    let totalRecords = 0;
    let processedRecords = 0;

    try {
      // 使用資料庫事務確保歸檔操作的原子性
      // 如果過程中發生錯誤，所有操作都會回滾
      return await this.database.transaction(async () => {
        // 根據工作類型 (positions/commands/status) 取得對應的表格配置
        const tableConfig = this.getTableConfig(message.jobType);
        
        // 計算符合條件的總記錄數
        // 只計算在指定日期範圍內且尚未歸檔的記錄
        const countSql = `
          SELECT COUNT(*) as total 
          FROM ${tableConfig.sourceTable} 
          WHERE ${tableConfig.dateColumn} >= ? 
          AND ${tableConfig.dateColumn} <= ?
          AND archived_at IS NULL
        `;
        
        // 執行計數查詢，取得需要歸檔的記錄總數
        const countResult = await this.database.query(countSql, [
          message.dateRangeStart,    // 日期範圍開始
          message.dateRangeEnd       // 日期範圍結束
        ]);
        
        // 取得總記錄數，如果查詢結果為空則設為 0
        totalRecords = countResult[0]?.total || 0;

        // 記錄歸檔操作開始的詳細資訊
        this.logger.info('Archive operation started', {
          taskId: message.taskId,                     // 任務ID
          sourceTable: tableConfig.sourceTable,       // 來源資料表
          archiveTable: tableConfig.archiveTable,     // 歸檔目標表
          totalRecords,                               // 總記錄數
          batchSize: message.batchSize                // 批次大小
        });

        // 分批處理記錄，避免一次處理過多資料造成記憶體或鎖定問題
        let offset = 0;  // 當前處理的偏移量
        const batchSize = message.batchSize || config.processor.defaultBatchSize; // 使用指定批次大小或預設值

        // 循環處理直到所有記錄都被處理
        while (offset < totalRecords) {
          // 處理當前批次的記錄
          const batchResult = await this.processBatch(
            message,        // 原始任務訊息
            tableConfig,    // 表格配置
            offset,         // 當前偏移量
            batchSize       // 批次大小
          );
          
          // 累加已處理的記錄數
          processedRecords += batchResult;
          // 更新偏移量到下一批次
          offset += batchSize;

          // 記錄批次處理進度
          this.logger.debug('Batch processed', {
            taskId: message.taskId,
            batchProcessed: batchResult,                                      // 本批次處理數量
            totalProcessed: processedRecords,                                 // 累計處理數量
            totalRecords,                                                     // 總記錄數
            progress: `${Math.round((processedRecords / totalRecords) * 100)}%` // 完成百分比
          });

          // 每處理 10 個批次後暫停 100ms，避免長時間運行的事務和資源佔用
          if (offset % (batchSize * 10) === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // 返回處理結果統計
        return { totalRecords, processedRecords };
      });
    } catch (error) {
      // 記錄歸檔執行失敗的詳細錯誤資訊
      this.logger.error('Archive execution failed', {
        taskId: message.taskId,
        error: error instanceof Error ? error.message : String(error),
        totalRecords,      // 總記錄數
        processedRecords   // 已處理記錄數（失敗時的進度）
      });
      // 重新拋出錯誤供上層處理
      throw error;
    }
  };

  /**
   * 執行清理處理
   * 根據清理類型執行標記歸檔或物理刪除操作
   */
  private executeCleanup = async (message: CleanupTaskMessage): Promise<{
    totalRecords: number;
    processedRecords: number;
  }> => {
    // 初始化統計變數
    let totalRecords = 0;
    let processedRecords = 0;

    try {
      // 建立查詢條件：清理在指定日期之前且已經歸檔的記錄
      const condition = `created_at <= ? AND archived_at IS NOT NULL`;
      const params = [message.dateThreshold]; // 日期門檻參數

      if (message.cleanupType === 'mark_archived') {
        // 標記為已歸檔模式：只更新 archived_at 欄位，不實際刪除資料
        // 這是較安全的清理方式，資料仍保留在原表中但標記為已歸檔
        const updateSql = `UPDATE ${message.tableName} SET archived_at = NOW() WHERE ${condition} AND archived_at IS NULL`;
        const result = await this.database.query(updateSql, params);
        // 取得受影響的記錄數量
        processedRecords = (result as any).affectedRows || 0;
        totalRecords = processedRecords; // 對於更新操作，總數等於處理數
      } else if (message.cleanupType === 'physical_delete') {
        // 物理刪除模式：實際從資料庫中刪除記錄
        // 這是更徹底的清理方式，適用於確定不再需要的資料
        processedRecords = await this.database.batchDelete(
          message.tableName,    // 要清理的表名
          condition,            // 刪除條件
          params,              // 條件參數
          message.batchSize    // 批次大小，避免一次刪除過多記錄
        );
        totalRecords = processedRecords; // 對於刪除操作，總數等於處理數
      }

      // 返回清理統計結果
      return { totalRecords, processedRecords };
    } catch (error) {
      // 記錄清理執行失敗的錯誤資訊
      this.logger.error('Cleanup execution failed', {
        taskId: message.taskId,
        error: error instanceof Error ? error.message : String(error)
      });
      // 重新拋出錯誤供上層處理
      throw error;
    }
  };

  /**
   * 處理單一批次
   * 將一批記錄從來源表複製到歸檔表，並標記原記錄為已歸檔
   */
  private processBatch = async (
    message: ArchiveTaskMessage,
    tableConfig: any,
    offset: number,
    batchSize: number
  ): Promise<number> => {
    try {
      // 從來源表選取一批符合條件的記錄
      // 使用 LIMIT 和 OFFSET 實現分批處理，避免記憶體過載
      const selectSql = `
        SELECT * FROM ${tableConfig.sourceTable}
        WHERE ${tableConfig.dateColumn} >= ?
        AND ${tableConfig.dateColumn} <= ?
        AND archived_at IS NULL
        ORDER BY ${tableConfig.dateColumn}
        LIMIT ? OFFSET ?
      `;

      // 執行查詢，取得當前批次的記錄
      const records = await this.database.query(selectSql, [
        message.dateRangeStart,    // 日期範圍開始
        message.dateRangeEnd,      // 日期範圍結束
        batchSize,                 // 批次大小
        offset                     // 偏移量，決定從哪裡開始取資料
      ]);

      // 如果沒有記錄，直接返回 0，表示這個批次沒有資料需要處理
      if (records.length === 0) {
        return 0;
      }

      // 將記錄批次插入到歸檔表中
      // 使用 batchInsert 提升插入效率，避免逐筆插入的性能問題
      const insertedCount = await this.database.batchInsert(
        tableConfig.archiveTable,  // 目標歸檔表
        records,                   // 要插入的記錄陣列
        batchSize                  // 批次大小
      );

      // 標記來源表中的原記錄為已歸檔
      // 提取所有記錄的 ID 用於更新條件
      const recordIds = records.map((r: any) => r.id);
      const updateSql = `
        UPDATE ${tableConfig.sourceTable}
        SET archived_at = NOW()
        WHERE id IN (${recordIds.map(() => '?').join(',')})
      `;
      
      // 執行更新，將 archived_at 設為當前時間，標記這些記錄已被歸檔
      await this.database.query(updateSql, recordIds);

      // 返回實際處理的記錄數量
      return insertedCount;
    } catch (error) {
      // 記錄批次處理失敗的詳細錯誤資訊
      this.logger.error('Batch processing failed', {
        taskId: message.taskId,
        offset,        // 當前批次的偏移量
        batchSize,     // 批次大小
        error: error instanceof Error ? error.message : String(error)
      });
      // 重新拋出錯誤供上層處理
      throw error;
    }
  };

  /**
   * 獲取表配置
   * 根據工作類型返回對應的資料表配置資訊
   */
  private getTableConfig = (jobType: string): {
    sourceTable: string;
    archiveTable: string;
    dateColumn: string;
  } => {
    // 定義各種工作類型對應的表格配置
    // 每種工作類型都有來源表、歸檔表和日期欄位的映射關係
    const configs: Record<string, {
      sourceTable: string;   // 來源資料表
      archiveTable: string;  // 歸檔目標表
      dateColumn: string;    // 用於篩選的日期欄位
    }> = {
      'positions': {
        sourceTable: 'drone_positions',          // 無人機位置資料主表
        archiveTable: 'drone_positions_archive', // 無人機位置歸檔表
        dateColumn: 'created_at'                 // 以創建時間作為歸檔依據
      },
      'commands': {
        sourceTable: 'drone_commands',           // 無人機指令資料主表
        archiveTable: 'drone_commands_archive',  // 無人機指令歸檔表
        dateColumn: 'created_at'                 // 以創建時間作為歸檔依據
      },
      'status': {
        sourceTable: 'drone_status',             // 無人機狀態資料主表
        archiveTable: 'drone_status_archive',    // 無人機狀態歸檔表
        dateColumn: 'created_at'                 // 以創建時間作為歸檔依據
      }
    };

    // 根據工作類型查找對應的配置
    const config = configs[jobType];
    if (!config) {
      // 如果工作類型不存在，拋出錯誤
      throw new Error(`Unknown job type: ${jobType}`);
    }

    // 返回對應的表格配置
    return config;
  };

  /**
   * 健康檢查 - 業務邏輯層面的健康狀態
   * 
   * 【說明】
   * 這只檢查 Processor 本身的狀態，不檢查 RabbitMQ 連線
   * Consumer 會有自己的健康檢查來檢查訊息隊列狀態
   */
  isHealthy = (): boolean => {
    // 如果沒有正在處理任務，則認為是健康的
    // 這是一個簡單的健康檢查，主要確認處理器沒有卡在某個任務上
    return !this.isProcessing;
  };

  /**
   * 獲取處理狀態 - 純業務層面的狀態資訊
   * 
   * 【與 Consumer 狀態的區別】
   * - Processor: 是否正在執行業務邏輯 (資料歸檔/清理)
   * - Consumer: 是否正在監聽訊息隊列 (RabbitMQ 連線狀態)
   */
  getStatus = (): { isProcessing: boolean } => {
    return { 
      isProcessing: this.isProcessing  // 返回當前是否有任務正在處理中
    };
  };
}