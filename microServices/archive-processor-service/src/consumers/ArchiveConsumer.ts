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

import { injectable, inject } from 'inversify';
import { Logger } from 'winston';
import { TYPES } from '../container/types';
import { 
  ArchiveTaskMessage, 
  CleanupTaskMessage, 
  TaskType, 
  ScheduleStatus,
  TaskResultMessage,
  RabbitMQService 
} from '../types/processor.types';
import { ArchiveProcessor } from '../processors/ArchiveProcessor';
import { config } from '../configs/environment';

@injectable()
export class ArchiveConsumer {
  private isRunning = false;
  private processingCount = 0;

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
      if (this.isRunning) {
        this.logger.warn('Archive consumer is already running');
        return;
      }

      this.logger.info('Starting Archive Consumer...');

      // 初始化 RabbitMQ 服務
      await this.rabbitMQService.initialize();

      // 開始消費訊息
      await this.rabbitMQService.startConsumer(this.handleMessage.bind(this));

      this.isRunning = true;
      this.logger.info('Archive Consumer started successfully', {
        queue: config.rabbitmq.queues.archiveProcessor,
        prefetch: config.rabbitmq.prefetch
      });

      // 設置優雅關閉處理
      this.setupGracefulShutdown();

    } catch (error) {
      this.logger.error('Failed to start Archive Consumer', {
        error: error.message,
        stack: error.stack
      });
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
    const startTime = Date.now();
    this.processingCount++;
    
    this.logger.info('Received archive task message', {
      taskId: message.taskId,
      taskType: message.taskType,
      processingCount: this.processingCount
    });

    try {
      // 驗證訊息格式
      this.validateMessage(message);

      let result: TaskResultMessage;

      // 根據任務類型處理
      switch (message.taskType) {
        case TaskType.ARCHIVE:
          result = await this.processArchiveTask(message as ArchiveTaskMessage);
          break;
          
        case TaskType.CLEANUP:
          result = await this.processCleanupTask(message as CleanupTaskMessage);
          break;
          
        default:
          throw new Error(`Unsupported task type: ${message.taskType}`);
      }

      // 發送成功結果
      await this.sendTaskResult(result);

      this.logger.info('Archive task completed successfully', {
        taskId: message.taskId,
        taskType: message.taskType,
        executionTime: Date.now() - startTime,
        processedRecords: result.processedRecords
      });

    } catch (error) {
      // 發送失敗結果
      const errorResult: TaskResultMessage = {
        taskId: message.taskId || 'unknown',
        taskType: message.taskType || TaskType.ARCHIVE,
        status: ScheduleStatus.FAILED,
        errorMessage: error.message,
        executionTime: Date.now() - startTime,
        completedAt: new Date()
      };

      await this.sendTaskResult(errorResult);

      this.logger.error('Archive task failed', {
        taskId: message.taskId,
        taskType: message.taskType,
        error: error.message,
        stack: error.stack,
        executionTime: Date.now() - startTime
      });

      throw error; // 重新拋出錯誤讓 RabbitMQ 處理重試
    } finally {
      this.processingCount--;
    }
  }

  /**
   * 處理歷史歸檔任務
   */
  private async processArchiveTask(task: ArchiveTaskMessage): Promise<TaskResultMessage> {
    this.logger.info('Processing archive task', {
      taskId: task.taskId,
      jobType: task.jobType,
      batchId: task.batchId,
      dateRange: `${task.dateRangeStart} to ${task.dateRangeEnd}`
    });

    const result = await this.archiveProcessor.processArchiveTask(task);

    return {
      taskId: task.taskId,
      taskType: TaskType.ARCHIVE,
      status: ScheduleStatus.COMPLETED,
      totalRecords: result.totalRecords,
      processedRecords: result.processedRecords,
      executionTime: result.executionTime,
      completedAt: new Date(),
      metadata: {
        jobType: task.jobType,
        batchId: task.batchId,
        batchSize: task.batchSize
      }
    };
  }

  /**
   * 處理清理任務
   */
  private async processCleanupTask(task: CleanupTaskMessage): Promise<TaskResultMessage> {
    this.logger.info('Processing cleanup task', {
      taskId: task.taskId,
      jobType: task.jobType,
      tableName: task.tableName,
      cleanupType: task.cleanupType
    });

    const result = await this.archiveProcessor.processCleanupTask(task);

    return {
      taskId: task.taskId,
      taskType: TaskType.CLEANUP,
      status: ScheduleStatus.COMPLETED,
      totalRecords: result.totalRecords,
      processedRecords: result.processedRecords,
      executionTime: result.executionTime,
      completedAt: new Date(),
      metadata: {
        jobType: task.jobType,
        tableName: task.tableName,
        cleanupType: task.cleanupType
      }
    };
  }

  /**
   * 驗證訊息格式
   */
  private validateMessage(message: any): void {
    if (!message || typeof message !== 'object') {
      throw new Error('Invalid message format: message must be an object');
    }

    if (!message.taskId || typeof message.taskId !== 'string') {
      throw new Error('Invalid message format: taskId is required and must be a string');
    }

    if (!message.taskType || !Object.values(TaskType).includes(message.taskType)) {
      throw new Error(`Invalid message format: taskType must be one of ${Object.values(TaskType).join(', ')}`);
    }

    if (message.taskType === TaskType.ARCHIVE) {
      this.validateArchiveTask(message);
    } else if (message.taskType === TaskType.CLEANUP) {
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
    } catch (error) {
      this.logger.error('Error publishing task result', {
        taskId: result.taskId,
        error: error.message
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
      } catch (error) {
        this.logger.error('Error during shutdown', { error: error.message });
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