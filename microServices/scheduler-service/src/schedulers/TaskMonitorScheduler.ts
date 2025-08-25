/**
 * @fileoverview 任務監控排程器 - 專門負責任務狀態監控和重試機制
 * 
 * ============================================================================
 * 🏗️ 重構後的單一職責設計 (Producer-Consumer 模式)
 * ============================================================================
 * 
 * 【TaskMonitorScheduler】= 任務監控調度引擎 ← 本文件
 * 職責：
 * • 專門負責任務執行狀態的監控和健康檢查
 * • 監控任務超時、自動標記失敗狀態
 * • 實現失敗任務的智能重試機制
 * • ⚠️ 單一職責：只處理任務監控和重試，不處理歸檔、清理等業務邏輯
 * 
 * 協作關係：
 * • DroneArchiveScheduler: 負責 Drone 數據歸檔
 * • DataCleanupScheduler: 負責過期數據清理
 * • TaskResultHandler: 負責結果回調處理
 * • ArchiveTaskService: 提供任務狀態管理服務
 * 
 * ============================================================================
 * 
 * 核心功能：
 * 1. 超時任務檢測和處理
 * 2. 失敗任務的智能重試機制
 * 3. 任務狀態健康監控
 * 4. 重新發布符合條件的失敗任務
 * 
 * 監控任務類型：
 * - timeout-monitor: 超時任務檢查 (每30分鐘)
 * - retry-monitor: 失敗任務重試檢查 (每15分鐘)
 * 
 * 監控範圍：
 * - 所有歸檔任務 (不限於特定數據類型)
 * - 清理任務
 * - 其他異步處理任務
 */

import { injectable, inject } from 'inversify';
import * as cron from 'node-cron';
import { Logger } from 'winston';
import { TYPES } from '../container/types';
import { RabbitMQService } from '../services/RabbitMQService';
import { ArchiveTaskRepository } from '../repositories/ArchiveTaskRepository';
import { ArchiveTaskService } from '../services/ArchiveTaskService';
import { 
  ArchiveTaskMessage,
  TaskType 
} from '../types/scheduler.types';
import { ARCHIVE_CONFIG } from '../configs/schedule.config';
import { 
  EXCHANGES, 
  ROUTING_KEYS 
} from '../configs/queue.config';

@injectable()
export class TaskMonitorScheduler {
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  constructor(
    @inject(TYPES.RabbitMQService) private rabbitMQService: RabbitMQService,
    @inject(TYPES.ArchiveTaskRepository) private archiveTaskRepository: ArchiveTaskRepository,
    @inject(TYPES.ArchiveTaskService) private archiveTaskService: ArchiveTaskService,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  /**
   * 🚀 啟動任務監控排程
   * 
   * 功能說明：
   * - 初始化並啟動任務監控的定時排程
   * - 監控任務執行狀態、超時檢測、重試機制
   * - 確保系統穩定運行和任務可靠性
   * 
   * 啟動流程：
   * 1. 註冊超時監控任務 (checkTimeoutTasks)
   * 2. 註冊重試監控任務 (checkRetryableTasks)
   * 3. 啟動所有監控排程
   * 4. 記錄啟動狀態
   */
  start = async (): Promise<void> => {
    try {
      this.scheduleMonitoringTasks();

      this.logger.info('Task monitor scheduler started successfully', {
        scheduledJobs: Array.from(this.scheduledJobs.keys()),
        monitorTypes: ['timeout-monitor', 'retry-monitor']
      });
    } catch (error) {
      this.logger.error('Failed to start task monitor scheduler', error);
      throw error;
    }
  }

  /**
   * 🛑 停止任務監控排程
   * 
   * 功能說明：
   * - 安全停止所有監控排程任務
   * - 清理排程資源
   * - 確保優雅關閉
   */
  stop = async (): Promise<void> => {
    try {
      for (const [name, job] of this.scheduledJobs.entries()) {
        if (typeof job.stop === 'function') {
          job.stop();
        }
        this.logger.info(`Stopped task monitor job: ${name}`);
      }
      
      this.scheduledJobs.clear();
      this.logger.info('Task monitor scheduler stopped successfully');
    } catch (error) {
      this.logger.error('Failed to stop task monitor scheduler', error);
      throw error;
    }
  }

  /**
   * 📊 註冊監控任務排程
   * 
   * 功能說明：
   * - 註冊多種監控任務的定時排程
   * - 監控任務執行狀態、超時檢測、重試機制
   * - 確保系統穩定運行和任務可靠性
   * 
   * 監控任務類型：
   * 1. **超時監控** (每30分鐘)：
   *    - 檢測執行超過4小時的任務
   *    - 自動標記超時任務為失敗狀態
   *    - 防止殭屍任務佔用系統資源
   * 
   * 2. **重試監控** (每15分鐘)：
   *    - 檢查失敗任務的重試條件
   *    - 符合條件的任務重新發布到 RabbitMQ
   *    - 實現智能重試機制
   * 
   * 監控特點：
   * - 高頻率監控確保及時發現問題
   * - 自動化處理，減少人工干預
   * - 重新發布機制保證任務最終一致性
   * 
   * 容錯與恢復：
   * - 任務超時 → 標記失敗 → 等待重試
   * - 重試條件 → 重置任務 → 重新發布
   * - 完整的錯誤處理和日誌記錄
   */
  private scheduleMonitoringTasks(): void {
    // 監控超時任務
    const timeoutMonitorJob = cron.schedule(
      '*/30 * * * *', // 每30分鐘檢查一次
      async () => {
        await this.checkTimeoutTasks();
      },
      { scheduled: false }
    );

    timeoutMonitorJob.start();
    this.scheduledJobs.set('timeout-monitor', timeoutMonitorJob);

    // 監控失敗任務重試
    const retryMonitorJob = cron.schedule(
      '*/15 * * * *', // 每15分鐘檢查一次
      async () => {
        await this.checkRetryableTasks();
      },
      { scheduled: false }
    );

    retryMonitorJob.start();
    this.scheduledJobs.set('retry-monitor', retryMonitorJob);

    this.logger.info('Task monitoring schedules registered', {
      timeoutCheck: '*/30 * * * * (every 30 minutes)',
      retryCheck: '*/15 * * * * (every 15 minutes)'
    });
  }

  /**
   * ⏰ 檢查超時任務 - 監控與狀態管理
   * 
   * 功能說明：
   * - 監控長時間執行的任務，防止系統資源浪費
   * - 自動標記超時任務為失敗狀態
   * - 維護任務執行的健康狀態
   * 
   * 監控邏輯：
   * 1. 超時檢測：查詢執行超過4小時的任務
   * 2. 狀態更新：將超時任務標記為失敗
   * 3. 日誌記錄：詳細記錄超時任務資訊
   * 4. 資源釋放：避免僵屍任務佔用資源
   * 
   * 監控特點：
   * - 定期檢查：每30分鐘執行一次
   * - 批次處理：一次處理多個超時任務
   * - 狀態一致性：確保任務狀態的準確性
   * - 異常隔離：監控失敗不影響其他功能
   * 
   * 超時處理策略：
   * - 執行時間 > 4小時 → 標記為失敗
   * - 記錄失敗原因：'Task execution timeout'
   * - 釋放相關資源和鎖定狀態
   * - 等待重試機制自動恢復
   * 
   * 容錯設計：
   * - 查詢異常不中斷監控流程
   * - 完整的錯誤日誌記錄
   * - 確保監控任務的持續執行
   */
  private checkTimeoutTasks = async (): Promise<void> => {
    const startTime = Date.now();

    try {
      this.logger.debug('Starting timeout tasks check');

      const timeoutTasks = await this.archiveTaskRepository.findTimeoutTasks(4); // 4小時超時

      if (timeoutTasks.length > 0) {
        this.logger.warn('Found timeout tasks', {
          count: timeoutTasks.length,
          taskIds: timeoutTasks.map(t => t.id)
        });

        // 標記超時任務為失敗
        let processedCount = 0;
        for (const task of timeoutTasks) {
          try {
            await task.markAsFailed('Task execution timeout');
            processedCount++;
            
            this.logger.info('Task marked as failed due to timeout', {
              taskId: task.id,
              jobType: task.jobType,
              startedAt: task.startedAt?.toISOString(),
              batchId: task.batchId
            });
          } catch (error) {
            this.logger.error('Failed to mark task as timeout', {
              taskId: task.id,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }

        this.logger.info('Timeout tasks processing completed', {
          totalFound: timeoutTasks.length,
          processed: processedCount,
          executionTime: Date.now() - startTime
        });
      } else {
        this.logger.debug('No timeout tasks found', {
          executionTime: Date.now() - startTime
        });
      }

    } catch (error) {
      this.logger.error('Failed to check timeout tasks', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * 🔄 檢查可重試的任務 - 智能重試機制實現
   * 
   * 功能說明：
   * - 實現失敗任務的智能重試機制
   * - 重新發布符合條件的失敗任務到 RabbitMQ
   * - 提高任務執行的成功率和系統可靠性
   * 
   * 重試流程：
   * 1. 任務查詢：查找失敗且可重試的任務 (重試次數 < 3)
   * 2. 時間檢查：確認任務失敗後已等待30分鐘冷卻期
   * 3. 狀態重置：呼叫 task.reset() 重置任務狀態
   * 4. 訊息重建：構建新的 ArchiveTaskMessage
   * 5. 重新發布：發布到原始的 RabbitMQ 佇列
   * 
   * 重試條件與策略：
   * - 冷卻期：失敗後等待30分鐘再重試
   * - 次數限制：最多重試3次
   * - 訊息更新：retryCount 遞增，記錄重試狀態
   * - 路由保持：使用原始的 routing key 確保路由一致性
   * 
   * 重試特點：
   * - 智能重試：基於時間和次數的條件判斷
   * - 狀態恢復：完整的任務狀態重置流程
   * - 訊息一致性：保持原始任務的核心參數
   * - 持久化保證：重試任務同樣使用 persistent: true
   * 
   * 重新發布內容：
   * - 保持原始：taskId, jobType, batchId, 日期範圍
   * - 更新參數：retryCount = 1, createdAt = 當前時間
   * - 添加標記：isRetry 元數據標記重試狀態
   * 
   * 容錯機制：
   * - 重試處理失敗不影響其他任務
   * - 完整的錯誤處理和日誌記錄
   * - 確保重試機制的穩定運行
   */
  private checkRetryableTasks = async (): Promise<void> => {
    const startTime = Date.now();

    try {
      this.logger.debug('Starting retryable tasks check');

      const retryableTasks = await this.archiveTaskRepository.findRetryableTasks(3);

      if (retryableTasks.length === 0) {
        this.logger.debug('No retryable tasks found', {
          executionTime: Date.now() - startTime
        });
        return;
      }

      this.logger.info('Found retryable tasks', {
        count: retryableTasks.length,
        taskIds: retryableTasks.map(t => t.id)
      });

      let processedCount = 0;
      for (const task of retryableTasks) {
        try {
          // 簡單的重試邏輯：失敗後30分鐘可以重試
          const failedTime = task.completedAt?.getTime() || 0;
          const canRetryTime = failedTime + (30 * 60 * 1000); // 30分鐘

          if (Date.now() > canRetryTime) {
            this.logger.info('Retrying failed task', {
              taskId: task.id,
              jobType: task.jobType,
              batchId: task.batchId,
              failedAt: task.completedAt?.toISOString(),
              retryCount: task.retryCount || 0
            });

            // 重置任務狀態
            await task.reset();

            // 重新發布任務
            const message: ArchiveTaskMessage = {
              taskId: task.id.toString(),
              taskType: TaskType.ARCHIVE,
              jobType: task.jobType as any,
              batchId: task.batchId,
              dateRangeStart: task.dateRangeStart,
              dateRangeEnd: task.dateRangeEnd,
              batchSize: ARCHIVE_CONFIG.DEFAULT_BATCH_SIZE,
              priority: ARCHIVE_CONFIG.PRIORITY_SETTINGS[task.jobType as keyof typeof ARCHIVE_CONFIG.PRIORITY_SETTINGS],
              retryCount: (task.retryCount || 0) + 1,
              maxRetries: 3,
              createdAt: new Date(),
              metadata: {
                tableName: task.tableName,
                archiveTableName: task.archiveTableName,
                isRetry: true,
                originalFailureReason: task.errorMessage || 'Unknown error'
              }
            };

            const routingKey = ROUTING_KEYS[`ARCHIVE_${task.jobType.toUpperCase()}` as keyof typeof ROUTING_KEYS];
            await this.rabbitMQService.publish(
              EXCHANGES.MAIN.name,
              routingKey,
              message,
              {
                priority: message.priority,
                persistent: true
              }
            );

            processedCount++;

            this.logger.info('Task retry published successfully', {
              taskId: task.id,
              newRetryCount: message.retryCount,
              routingKey
            });
          } else {
            this.logger.debug('Task not yet ready for retry', {
              taskId: task.id,
              failedAt: task.completedAt?.toISOString(),
              canRetryAt: new Date(canRetryTime).toISOString()
            });
          }
        } catch (error) {
          this.logger.error('Failed to retry task', {
            taskId: task.id,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      }

      this.logger.info('Retryable tasks processing completed', {
        totalFound: retryableTasks.length,
        processed: processedCount,
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      this.logger.error('Failed to check retryable tasks', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * 🎯 手動觸發任務監控檢查
   * 
   * 功能說明：
   * - 提供手動觸發任務監控檢查的介面
   * - 支援超時檢查和重試檢查兩種模式
   * - 便於調試和緊急情況處理
   * 
   * @param checkType 檢查類型 ('timeout', 'retry', 'both')
   */
  triggerMonitorCheck = async (checkType: 'timeout' | 'retry' | 'both' = 'both'): Promise<void> => {
    this.logger.info('Manual task monitor check triggered', { checkType });

    try {
      if (checkType === 'timeout' || checkType === 'both') {
        await this.checkTimeoutTasks();
      }

      if (checkType === 'retry' || checkType === 'both') {
        await this.checkRetryableTasks();
      }

      this.logger.info('Manual task monitor check completed', { checkType });
    } catch (error) {
      this.logger.error('Manual task monitor check failed', {
        checkType,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 📊 獲取任務監控排程狀態
   * 
   * 功能說明：
   * - 提供任務監控排程的即時狀態查詢
   * - 返回排程運行狀態和配置資訊
   * - 便於監控和調試監控排程
   * 
   * @returns 任務監控排程狀態
   */
  getStatus = (): {
    scheduledJobs: string[];
    monitoringEnabled: boolean;
    checkIntervals: Record<string, string>;
  } => {
    return {
      scheduledJobs: Array.from(this.scheduledJobs.keys()),
      monitoringEnabled: this.scheduledJobs.size > 0,
      checkIntervals: {
        'timeout-monitor': '30 minutes',
        'retry-monitor': '15 minutes'
      }
    };
  }
}