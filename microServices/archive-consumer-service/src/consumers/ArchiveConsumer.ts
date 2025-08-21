/**
 * @fileoverview Archive Consumer 歸檔消費者
 * 
 * 【設計意圖 (Intention)】
 * 接收並處理來自 Scheduler Service 的歷史數據歸檔任務
 * 實作穩定可靠的消息消費機制，確保任務不會遺失
 * 
 * 【實作架構 (Implementation Architecture)】
 * - 監聽 RabbitMQ 歸檔任務佇列
 * - 解析任務訊息並委派給 ArchiveProcessor 處理
 * - 實作錯誤處理和失敗重試機制
 * - 提供任務執行狀態回報
 */

// 依賴注入框架，用於管理類別依賴關係
import { injectable, inject } from 'inversify';
// Winston 日誌框架的 Logger 類型定義
import { Logger } from 'winston';
// 依賴注入的類型常數定義
import { TYPES } from '../container/types';
// 導入所有相關的業務類型定義
import { 
  ArchiveTaskMessage,    // 歸檔任務訊息格式
  CleanupTaskMessage,    // 清理任務訊息格式
  TaskType,              // 任務類型枚舉 (ARCHIVE, CLEANUP)
  ScheduleStatus,        // 排程狀態枚舉 (COMPLETED, FAILED 等)
  TaskResultMessage,     // 任務結果訊息格式
  RabbitMQService        // RabbitMQ 服務介面定義
} from '../types/processor.types';
// 歸檔處理器，負責實際的歸檔和清理邏輯
import { ArchiveProcessor } from '../processors/ArchiveProcessor';
// 環境配置，包含 RabbitMQ 連接設定等
import { config } from '../configs/environment';

// 標記此類別為可注入，讓 InversifyJS 容器可以管理其實例
@injectable()
export class ArchiveConsumer {
  // 追蹤消費者是否正在運行的狀態標記
  private isRunning = false;
  // 追蹤目前同時處理中的任務數量，用於優雅關閉
  private processingCount = 0;

  /**
   * 建構子 - 使用依賴注入方式初始化所需的服務
   * @param logger - Winston 日誌服務，用於記錄操作日誌
   * @param rabbitMQService - RabbitMQ 服務，負責消息佇列的收發
   * @param archiveProcessor - 歸檔處理器，執行實際的歸檔和清理任務
   */
  constructor(
    @inject(TYPES.Logger) private readonly logger: Logger,
    @inject(TYPES.RabbitMQService) private readonly rabbitMQService: RabbitMQService,
    @inject(TYPES.ArchiveProcessor) private readonly archiveProcessor: ArchiveProcessor
  ) {}

  /**
   * 啟動消費者
   * 
   * 【啟動流程】
   * - 初始化 RabbitMQ 服務
   * - 開始監聽任務佇列
   * - 設置優雅關閉處理
   */
  async start(): Promise<void> {
    try {
      // 檢查是否已經啟動，防止重複啟動造成資源浪費或衝突
      if (this.isRunning) {
        this.logger.warn('Archive consumer is already running');
        return;
      }

      // 記錄啟動過程開始
      this.logger.info('Starting Archive Consumer...');

      // 初始化 RabbitMQ 服務連線和佇列設定
      await this.rabbitMQService.initialize();

      // 開始監聽並消費訊息，綁定 handleMessage 方法作為訊息處理器
      // 使用 .bind(this) 確保方法內的 this 指向正確的實例
      await this.rabbitMQService.startConsumer(this.handleMessage.bind(this));

      // 標記服務為運行狀態
      this.isRunning = true;
      
      // 記錄啟動成功，包含重要的配置資訊用於除錯
      this.logger.info('Archive Consumer started successfully', {
        queue: config.rabbitmq.queues.archiveProcessor,  // 監聽的佇列名稱
        prefetch: config.rabbitmq.prefetch                // 預取訊息數量設定
      });

      // 設置信號處理器，用於優雅關閉服務
      this.setupGracefulShutdown();

    } catch (error: unknown) {
      // TypeScript 嚴格模式下的錯誤型別處理
      const err = error as Error | string;
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;
      
      // 記錄啟動失敗的詳細錯誤資訊
      this.logger.error('Failed to start Archive Consumer', {
        error: errorMessage,
        stack: errorStack
      });
      
      // 重新拋出錯誤，讓上層調用者處理
      throw error;
    }
  }

  /**
   * 處理收到的訊息
   * 
   * 【處理流程】
   * 1. 驗證訊息格式
   * 2. 根據任務類型分派處理
   * 3. 執行任務處理邏輯
   * 4. 發送處理結果
   */
  private async handleMessage(message: any): Promise<void> {
    // 記錄任務開始時間，用於計算執行時間
    const startTime = Date.now();
    // 增加正在處理的任務計數，用於優雅關閉時等待任務完成
    this.processingCount++;
    
    // 記錄收到訊息的日誌，包含任務識別資訊
    this.logger.info('Received archive task message', {
      taskId: message.taskId,
      taskType: message.taskType,
      processingCount: this.processingCount
    });

    try {
      // 驗證訊息格式是否符合預期，確保訊息完整性
      this.validateMessage(message);

      // 宣告結果變數，用於儲存任務處理結果
      let result: TaskResultMessage;

      // 根據任務類型分派到對應的處理方法
      switch (message.taskType) {
        case TaskType.ARCHIVE:
          // 處理歷史數據歸檔任務
          result = await this.processArchiveTask(message as ArchiveTaskMessage);
          break;
          
        case TaskType.CLEANUP:
          // 處理數據清理任務
          result = await this.processCleanupTask(message as CleanupTaskMessage);
          break;
          
        default:
          // 不支援的任務類型，拋出錯誤
          throw new Error(`Unsupported task type: ${message.taskType}`);
      }

      // 將處理成功的結果發送回 RabbitMQ
      await this.sendTaskResult(result);

      // 記錄任務成功完成的詳細資訊
      this.logger.info('Archive task completed successfully', {
        taskId: message.taskId,
        taskType: message.taskType,
        executionTime: Date.now() - startTime,          // 總執行時間
        processedRecords: result.processedRecords       // 處理的記錄數量
      });

    } catch (error: unknown) {
      // 處理任務執行過程中的錯誤

      // TypeScript 錯誤型別安全處理
      const err = error as Error | string;
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;
      
      // 構建錯誤結果訊息
      const errorResult: TaskResultMessage = {
        taskId: message.taskId || 'unknown',                    // 使用原任務ID或預設值
        taskType: message.taskType || TaskType.ARCHIVE,         // 使用原任務類型或預設值
        status: ScheduleStatus.FAILED,                          // 標記為失敗狀態
        errorMessage,                                           // 錯誤訊息
        executionTime: Date.now() - startTime,                  // 執行時間（包含失敗時間）
        completedAt: new Date()                                 // 完成時間戳記
      };

      // 發送錯誤結果給調度器
      await this.sendTaskResult(errorResult);

      // 記錄詳細的錯誤日誌，包含堆疊追蹤用於除錯
      this.logger.error('Archive task failed', {
        taskId: message.taskId,
        taskType: message.taskType,
        error: errorMessage,
        stack: errorStack,
        executionTime: Date.now() - startTime
      });

      // 重新拋出錯誤讓 RabbitMQ 處理重試機制
      throw error;
    } finally {
      // 無論成功或失敗都要減少處理計數器
      this.processingCount--;
    }
  }

  /**
   * 處理歷史歸檔任務
   * 負責將舊的數據移轉到歸檔儲存區域
   */
  private async processArchiveTask(task: ArchiveTaskMessage): Promise<TaskResultMessage> {
    // 記錄開始處理歸檔任務的日誌，包含關鍵參數
    this.logger.info('Processing archive task', {
      taskId: task.taskId,                                          // 任務唯一識別碼
      jobType: task.jobType,                                        // 工作類型 (positions, commands, status)
      batchId: task.batchId,                                        // 批次識別碼
      dateRange: `${task.dateRangeStart} to ${task.dateRangeEnd}`   // 歸檔的日期範圍
    });

    // 委派給 ArchiveProcessor 執行實際的歸檔邏輯
    const result = await this.archiveProcessor.processArchiveTask(task);

    // 構建並返回任務成功結果
    return {
      taskId: task.taskId,                          // 任務ID
      taskType: TaskType.ARCHIVE,                   // 任務類型標記
      status: ScheduleStatus.COMPLETED,             // 完成狀態
      totalRecords: result.totalRecords,            // 總記錄數
      processedRecords: result.processedRecords,    // 實際處理的記錄數
      executionTime: result.executionTime,          // 執行時間（毫秒）
      completedAt: new Date(),                      // 完成時間戳記
      metadata: {                                   // 額外的元數據資訊
        jobType: task.jobType,                      // 重複記錄工作類型以便追蹤
        batchId: task.batchId,                      // 重複記錄批次ID
        batchSize: task.batchSize                   // 批次大小設定
      }
    };
  }

  /**
   * 處理清理任務
   * 負責清理已歸檔的數據或直接刪除過期數據
   */
  private async processCleanupTask(task: CleanupTaskMessage): Promise<TaskResultMessage> {
    // 記錄開始處理清理任務的日誌，包含清理目標和方式
    this.logger.info('Processing cleanup task', {
      taskId: task.taskId,              // 任務唯一識別碼
      jobType: task.jobType,            // 工作類型
      tableName: task.tableName,        // 要清理的資料表名稱
      cleanupType: task.cleanupType     // 清理方式 (mark_archived 或 physical_delete)
    });

    // 委派給 ArchiveProcessor 執行實際的清理邏輯
    const result = await this.archiveProcessor.processCleanupTask(task);

    // 構建並返回任務成功結果
    return {
      taskId: task.taskId,                          // 任務ID
      taskType: TaskType.CLEANUP,                   // 任務類型標記
      status: ScheduleStatus.COMPLETED,             // 完成狀態
      totalRecords: result.totalRecords,            // 總記錄數
      processedRecords: result.processedRecords,    // 實際處理的記錄數
      executionTime: result.executionTime,          // 執行時間（毫秒）
      completedAt: new Date(),                      // 完成時間戳記
      metadata: {                                   // 額外的元數據資訊
        jobType: task.jobType,                      // 重複記錄工作類型
        tableName: task.tableName,                  // 重複記錄資料表名稱
        cleanupType: task.cleanupType               // 重複記錄清理方式
      }
    };
  }

  /**
   * 驗證訊息格式
   * 確保收到的訊息符合預期格式，防止處理錯誤的數據
   */
  private validateMessage(message: any): void {
    // 檢查訊息是否存在且為物件型別
    if (!message || typeof message !== 'object') {
      throw new Error('Invalid message format: message must be an object');
    }

    // 檢查任務ID是否存在且為字串型別
    if (!message.taskId || typeof message.taskId !== 'string') {
      throw new Error('Invalid message format: taskId is required and must be a string');
    }

    // 檢查任務類型是否為有效的枚舉值
    if (!message.taskType || !Object.values(TaskType).includes(message.taskType)) {
      throw new Error(`Invalid message format: taskType must be one of ${Object.values(TaskType).join(', ')}`);
    }

    // 根據不同任務類型進行更具體的驗證
    if (message.taskType === TaskType.ARCHIVE) {
      // 驗證歸檔任務特定欄位
      this.validateArchiveTask(message);
    } else if (message.taskType === TaskType.CLEANUP) {
      // 驗證清理任務特定欄位
      this.validateCleanupTask(message);
    }
  }

  /**
   * 驗證歸檔任務格式
   */
  private validateArchiveTask(task: any): void {
    const required = ['jobType', 'batchId', 'dateRangeStart', 'dateRangeEnd', 'batchSize'];
    
    for (const field of required) {
      if (!task[field]) {
        throw new Error(`Invalid archive task: ${field} is required`);
      }
    }

    if (!['positions', 'commands', 'status'].includes(task.jobType)) {
      throw new Error(`Invalid archive task: jobType must be one of positions, commands, status`);
    }
  }

  /**
   * 驗證清理任務格式
   */
  private validateCleanupTask(task: any): void {
    const required = ['jobType', 'tableName', 'cleanupType', 'dateThreshold', 'batchSize'];
    
    for (const field of required) {
      if (!task[field]) {
        throw new Error(`Invalid cleanup task: ${field} is required`);
      }
    }

    if (!['mark_archived', 'physical_delete'].includes(task.cleanupType)) {
      throw new Error(`Invalid cleanup task: cleanupType must be mark_archived or physical_delete`);
    }
  }

  /**
   * 發送任務執行結果
   */
  private async sendTaskResult(result: TaskResultMessage): Promise<void> {
    try {
      const success = await this.rabbitMQService.publishTaskResult(result);
      
      if (!success) {
        this.logger.warn('Failed to publish task result to RabbitMQ', {
          taskId: result.taskId,
          status: result.status
        });
      }
    } catch (error: unknown) {
      const err = error as Error | string;
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error('Error publishing task result', {
        taskId: result.taskId,
        error: errorMessage
      });
    }
  }

  /**
   * 設置優雅關閉處理
   */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      this.logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      this.isRunning = false;

      // 等待當前處理的任務完成
      const maxWaitTime = 30000; // 30 秒
      const startTime = Date.now();
      
      while (this.processingCount > 0 && (Date.now() - startTime) < maxWaitTime) {
        this.logger.info(`Waiting for ${this.processingCount} tasks to complete...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (this.processingCount > 0) {
        this.logger.warn(`Force shutdown with ${this.processingCount} tasks still processing`);
      }

      try {
        await this.rabbitMQService.close();
        this.logger.info('Archive Consumer shutdown completed');
      } catch (error: unknown) {
        const err = error as Error | string;
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.logger.error('Error during shutdown', { error: errorMessage });
      }

      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * 停止消費者
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.logger.info('Stopping Archive Consumer...');
    this.isRunning = false;

    await this.rabbitMQService.close();
    
    this.logger.info('Archive Consumer stopped');
  }

  /**
   * 健康檢查
   */
  isHealthy(): boolean {
    return this.isRunning && this.rabbitMQService.isHealthy();
  }

  /**
   * 獲取狀態資訊
   */
  getStatus(): { isRunning: boolean; processingCount: number } {
    return {
      isRunning: this.isRunning,
      processingCount: this.processingCount
    };
  }
}