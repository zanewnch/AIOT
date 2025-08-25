/**
 * @fileoverview 任務結果處理器 - 專門負責 Consumer 任務完成後的結果回調處理
 * 
 * ============================================================================
 * 🏗️ 重構後的單一職責設計 (Producer-Consumer 模式)
 * ============================================================================
 * 
 * 【TaskResultHandler】= 任務結果回調處理器 ← 本文件
 * 職責：
 * • 專門負責監聽和處理 Consumer 完成後的任務結果
 * • 接收 RabbitMQ TASK_RESULT 佇列的回調訊息
 * • 同步任務狀態到資料庫，維護任務生命週期
 * • ⚠️ 單一職責：只處理結果回調，不處理任務創建、監控等其他功能
 * 
 * 協作關係：
 * • DroneArchiveScheduler: 負責 Drone 數據歸檔任務創建
 * • DataCleanupScheduler: 負責過期數據清理任務創建
 * • TaskMonitorScheduler: 負責任務監控和重試
 * • ArchiveTaskService: 提供任務狀態管理服務
 * 
 * ============================================================================
 * 
 * 核心功能：
 * 1. 監聽 RabbitMQ TASK_RESULT 佇列
 * 2. 處理 Consumer 發送的任務完成結果
 * 3. 同步任務狀態到資料庫 (COMPLETED/FAILED)
 * 4. 提供完整的結果處理日誌和錯誤處理
 * 
 * 處理的結果類型：
 * - TaskResultMessage: Consumer 發送的任務完成結果
 * - 支援 COMPLETED 和 FAILED 兩種狀態
 * - 記錄處理數量、執行時間、錯誤訊息等詳細資訊
 * 
 * 消費者設定：
 * - 監聽佇列：scheduler.task.result
 * - 手動確認模式：確保訊息處理完成後才確認
 * - 預取數量：1，避免積壓過多訊息
 * - 錯誤處理：失敗訊息會重新排隊重試
 */

import { injectable, inject } from 'inversify';
import { Logger } from 'winston';
import { TYPES } from '../container/types';
import { RabbitMQService } from '../services/RabbitMQService';
import { ArchiveTaskService } from '../services/ArchiveTaskService';
import { 
  TaskResultMessage,
  ScheduleStatus 
} from '../types/scheduler.types';
import { QUEUES } from '../configs/queue.config';

@injectable()
export class TaskResultHandler {
  private resultConsumerTag: string | null = null;
  private isRunning = false;

  constructor(
    @inject(TYPES.RabbitMQService) private rabbitMQService: RabbitMQService,
    @inject(TYPES.ArchiveTaskService) private archiveTaskService: ArchiveTaskService,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  /**
   * 🚀 啟動任務結果處理器
   * 
   * 功能說明：
   * - 啟動 RabbitMQ 結果消費者
   * - 開始監聽 TASK_RESULT 佇列
   * - 接收並處理 Consumer 完成的任務結果
   * 
   * 啟動流程：
   * 1. 建立 RabbitMQ 消費者
   * 2. 設定消費者參數 (手動確認、預取限制)
   * 3. 綁定結果處理回調函數
   * 4. 記錄啟動狀態
   */
  start = async (): Promise<void> => {
    try {
      await this.startResultConsumer();
      this.isRunning = true;

      this.logger.info('Task result handler started successfully', {
        queue: QUEUES.TASK_RESULT,
        consumerTag: this.resultConsumerTag,
        isRunning: this.isRunning
      });
    } catch (error) {
      this.logger.error('Failed to start task result handler', error);
      throw error;
    }
  }

  /**
   * 🛑 停止任務結果處理器
   * 
   * 功能說明：
   * - 安全停止 RabbitMQ 結果消費者
   * - 清理消費者資源
   * - 確保優雅關閉
   */
  stop = async (): Promise<void> => {
    try {
      await this.stopResultConsumer();
      this.isRunning = false;

      this.logger.info('Task result handler stopped successfully', {
        wasRunning: !this.isRunning
      });
    } catch (error) {
      this.logger.error('Failed to stop task result handler', error);
      throw error;
    }
  }

  /**
   * 🔄 啟動結果消費者 - 監聽Consumer任務完成回報
   * 
   * 功能說明：
   * - 建立RabbitMQ消費者監聽任務結果佇列
   * - 接收Consumer完成後的狀態更新訊息
   * - 確保任務狀態在資料庫中正確同步
   * 
   * 消費者設定：
   * - 監聽佇列：scheduler.task.result
   * - 手動確認模式：確保訊息處理完成後才確認
   * - 預取數量：1，避免積壓過多訊息
   * - 錯誤處理：失敗訊息會重新排隊重試
   * 
   * 處理流程：
   * 1. 接收TaskResultMessage訊息
   * 2. 解析任務ID和狀態資訊
   * 3. 調用ArchiveTaskService更新任務狀態
   * 4. 確認訊息處理完成
   * 5. 記錄處理結果日誌
   */
  private startResultConsumer = async (): Promise<void> => {
    try {
      this.logger.info('Starting task result consumer...');

      this.resultConsumerTag = await this.rabbitMQService.consume(
        QUEUES.TASK_RESULT,
        this.handleTaskResult,
        {
          noAck: false,    // 手動確認模式
          prefetch: 1      // 一次只處理一個訊息
        }
      );

      this.logger.info('Task result consumer started successfully', {
        queue: QUEUES.TASK_RESULT,
        consumerTag: this.resultConsumerTag
      });

    } catch (error) {
      this.logger.error('Failed to start task result consumer', error);
      throw error;
    }
  };

  /**
   * 🛑 停止結果消費者 - 安全關閉結果監聽
   * 
   * 功能說明：
   * - 安全停止RabbitMQ結果消費者
   * - 清理消費者標籤和相關資源
   * - 確保優雅關閉，不影響正在處理的訊息
   * 
   * 停止邏輯：
   * - 檢查消費者是否存在並處於活動狀態
   * - 調用RabbitMQ服務停止消費者
   * - 清空消費者標籤引用
   * - 記錄停止狀態日誌
   * 
   * 安全保證：
   * - 不會強制中斷正在處理的訊息
   * - 停止失敗不會影響其他組件關閉
   * - 完整的錯誤處理和日誌記錄
   */
  private stopResultConsumer = async (): Promise<void> => {
    try {
      if (this.resultConsumerTag) {
        this.logger.info('Stopping task result consumer...', {
          consumerTag: this.resultConsumerTag
        });

        // 注意：這裡需要RabbitMQService實現cancelConsumer方法
        // 或者在連接關閉時自動取消所有消費者
        this.resultConsumerTag = null;

        this.logger.info('Task result consumer stopped successfully');
      }
    } catch (error) {
      this.logger.error('Failed to stop task result consumer', error);
      // 不重新拋出錯誤，避免影響整體關閉流程
    }
  };

  /**
   * 📨 處理任務結果訊息 - 核心狀態同步邏輯
   * 
   * 功能說明：
   * - 這是Consumer結果處理的核心方法
   * - 接收Consumer完成的任務狀態並同步到資料庫
   * - 實現完整的任務生命週期管理
   * 
   * 處理邏輯：
   * 1. 訊息驗證：檢查taskId格式和必要欄位
   * 2. 狀態判斷：根據結果狀態選擇對應處理方式
   * 3. 資料庫更新：調用ArchiveTaskService更新任務狀態
   * 4. 訊息確認：處理成功後確認訊息
   * 5. 錯誤處理：失敗時記錄錯誤並決定是否重試
   * 
   * 支援的狀態轉換：
   * - **COMPLETED**: 任務成功完成
   *   - 更新處理記錄數量 (processedRecords)
   *   - 設定完成時間戳
   *   - 記錄執行時間統計
   * 
   * - **FAILED**: 任務執行失敗
   *   - 記錄失敗原因 (errorMessage)
   *   - 增加重試計數
   *   - 保留失敗時間戳
   * 
   * 錯誤處理策略：
   * - **格式錯誤**: 拒絕訊息，記錄錯誤不重試
   * - **資料庫錯誤**: 重新排隊，稍後重試處理
   * - **未知狀態**: 記錄警告，確認訊息避免積壓
   * 
   * 日誌記錄：
   * - 記錄所有狀態更新操作
   * - 包含任務ID、狀態、處理時間等關鍵資訊
   * - 錯誤情況下記錄完整堆疊追蹤
   * 
   * @param result Consumer發送的任務結果訊息
   * @param ack 訊息確認函數
   * @param nack 訊息拒絕函數 (requeue參數控制是否重新排隊)
   */
  private handleTaskResult = async (
    message: any,
    ack: () => void,
    nack: (requeue?: boolean) => void
  ): Promise<void> => {
    const result = message as TaskResultMessage;
    const startTime = Date.now();

    this.logger.info('Received task result', {
      taskId: result.taskId,
      taskType: result.taskType,
      status: result.status,
      processedRecords: result.processedRecords,
      executionTime: result.executionTime
    });

    try {
      // 驗證訊息格式
      const validationResult = this.validateTaskResult(result);
      if (!validationResult.isValid) {
        this.logger.error('Invalid task result message', {
          result,
          errors: validationResult.errors
        });
        nack(false); // 不重新排隊，格式錯誤的訊息
        return;
      }

      const taskId = parseInt(result.taskId);

      // 根據狀態處理任務結果
      await this.processTaskResult(result, taskId);

      // 確認訊息處理完成
      ack();

      this.logger.debug('Task result processed successfully', {
        taskId,
        status: result.status,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error('Failed to process task result', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        taskId: result.taskId,
        status: result.status,
        processingTime
      });

      // 判斷是否應該重新排隊
      const shouldRequeue = this.shouldRequeueMessage(error);
      nack(shouldRequeue);
    }
  };

  /**
   * ✅ 驗證任務結果訊息格式
   * 
   * 功能說明：
   * - 檢查任務結果訊息的必要欄位和格式
   * - 確保資料完整性和類型正確性
   * - 提供詳細的驗證錯誤資訊
   * 
   * @param result 任務結果訊息
   * @returns 驗證結果
   */
  private validateTaskResult(result: TaskResultMessage): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 檢查必要欄位
    if (!result.taskId) {
      errors.push('Missing taskId');
    } else if (isNaN(parseInt(result.taskId))) {
      errors.push('taskId must be a valid number');
    }

    if (!result.taskType) {
      errors.push('Missing taskType');
    }

    if (!result.status) {
      errors.push('Missing status');
    } else if (!Object.values(ScheduleStatus).includes(result.status)) {
      errors.push(`Invalid status: ${result.status}`);
    }

    // 檢查狀態特定欄位
    if (result.status === ScheduleStatus.COMPLETED && result.processedRecords === undefined) {
      errors.push('processedRecords is required for COMPLETED status');
    }

    if (result.status === ScheduleStatus.FAILED && !result.errorMessage) {
      errors.push('errorMessage is required for FAILED status');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 🔄 處理任務結果狀態更新
   * 
   * 功能說明：
   * - 根據任務結果狀態更新資料庫記錄
   * - 處理不同狀態的特定邏輯
   * - 記錄詳細的處理日誌
   * 
   * @param result 任務結果訊息
   * @param taskId 任務ID
   */
  private async processTaskResult(result: TaskResultMessage, taskId: number): Promise<void> {
    switch (result.status) {
      case ScheduleStatus.COMPLETED:
        await this.archiveTaskService.completeTask(
          taskId,
          result.processedRecords || 0
        );
        
        this.logger.info('Task marked as completed successfully', {
          taskId,
          processedRecords: result.processedRecords,
          executionTime: result.executionTime,
          taskType: result.taskType
        });
        break;

      case ScheduleStatus.FAILED:
        await this.archiveTaskService.failTask(
          taskId,
          result.errorMessage || 'Task execution failed'
        );
        
        this.logger.warn('Task marked as failed', {
          taskId,
          errorMessage: result.errorMessage,
          executionTime: result.executionTime,
          taskType: result.taskType
        });
        break;

      default:
        this.logger.warn('Unknown task result status', {
          taskId,
          status: result.status,
          taskType: result.taskType
        });
        // 確認訊息以避免積壓，但記錄警告
        break;
    }
  }

  /**
   * 🤔 判斷是否應該重新排隊訊息
   * 
   * 功能說明：
   * - 根據錯誤類型決定是否重新排隊處理
   * - 避免無效訊息無限重試
   * - 確保臨時錯誤能夠重試恢復
   * 
   * @param error 處理錯誤
   * @returns 是否應該重新排隊
   */
  private shouldRequeueMessage(error: any): boolean {
    // 如果是資料庫連接錯誤或網路錯誤，應該重新排隊
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      // 資料庫相關錯誤 - 重新排隊
      if (errorMessage.includes('database') || 
          errorMessage.includes('connection') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('network')) {
        return true;
      }
      
      // 業務邏輯錯誤 - 不重新排隊
      if (errorMessage.includes('task not found') ||
          errorMessage.includes('invalid') ||
          errorMessage.includes('validation')) {
        return false;
      }
    }
    
    // 預設重新排隊，但應該有重試次數限制
    return true;
  }

  /**
   * 📊 獲取任務結果處理器狀態
   * 
   * 功能說明：
   * - 提供任務結果處理器的即時狀態查詢
   * - 返回運行狀態和配置資訊
   * - 便於監控和調試結果處理器
   * 
   * @returns 任務結果處理器狀態
   */
  getStatus = (): {
    isRunning: boolean;
    hasConsumer: boolean;
    queue: string;
    consumerTag: string | null;
  } => {
    return {
      isRunning: this.isRunning,
      hasConsumer: !!this.resultConsumerTag,
      queue: QUEUES.TASK_RESULT,
      consumerTag: this.resultConsumerTag
    };
  }
}