/**
 * @fileoverview 數據清理排程器 - 專門負責過期數據的定時清理任務
 * 
 * ============================================================================
 * 🏗️ 重構後的單一職責設計 (Producer-Consumer 模式)
 * ============================================================================
 * 
 * 【DataCleanupScheduler】= 數據清理調度引擎 ← 本文件
 * 職責：
 * • 專門負責過期數據的清理排程 (物理刪除或標記刪除)
 * • 定時發布清理任務到 RabbitMQ CLEANUP_EXPIRED 佇列
 * • 管理數據生命週期，維護系統效能
 * • ⚠️ 單一職責：只處理數據清理，不處理歸檔、監控等其他功能
 * 
 * 協作關係：
 * • DroneArchiveScheduler: 負責 Drone 數據歸檔
 * • TaskMonitorScheduler: 負責任務監控和重試
 * • TaskResultHandler: 負責結果回調處理
 * 
 * ============================================================================
 * 
 * 核心功能：
 * 1. 管理過期數據清理的定時排程
 * 2. 批次發布多個資料表的清理任務
 * 3. 構建並發布清理 RabbitMQ 訊息
 * 4. 支援不同的清理策略 (物理刪除/標記清理)
 * 
 * 清理的數據類型：
 * - drone_positions: 無人機位置歷史數據
 * - drone_commands: 無人機指令歷史數據
 * - drone_real_time_status: 無人機狀態歷史數據
 * 
 * 發布的訊息類型：
 * - CleanupTaskMessage → CLEANUP_EXPIRED 佇列
 */

import { injectable, inject } from 'inversify';
import * as cron from 'node-cron';
import { Logger } from 'winston';
import { TYPES } from '../container/types';
import { RabbitMQService } from '../services/RabbitMQService';
import { 
  CleanupTaskMessage,
  TaskType 
} from '../types/scheduler.types';
import { 
  CLEANUP_CONFIG,
  DEFAULT_SCHEDULES,
  ARCHIVE_CONFIG 
} from '../configs/schedule.config';
import { 
  EXCHANGES, 
  ROUTING_KEYS,
  TASK_PRIORITIES 
} from '../configs/queue.config';

@injectable()
export class DataCleanupScheduler {
  private scheduledJob: cron.ScheduledTask | null = null;

  constructor(
    @inject(TYPES.RabbitMQService) private rabbitMQService: RabbitMQService,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  /**
   * 🚀 啟動數據清理排程
   * 
   * 功能說明：
   * - 初始化並啟動過期數據清理的定時排程
   * - 管理資料生命週期，自動清理不再需要的歷史資料
   * - 維護系統效能，避免資料庫膨脹
   * 
   * 啟動流程：
   * 1. 讀取清理排程配置
   * 2. 註冊定時任務 (cleanup-expired)
   * 3. 啟動 cron 排程
   * 4. 記錄啟動狀態
   */
  start = async (): Promise<void> => {
    try {
      this.scheduleCleanupTasks();

      this.logger.info('Data cleanup scheduler started successfully', {
        scheduleName: 'cleanup-expired',
        isScheduled: !!this.scheduledJob
      });
    } catch (error) {
      this.logger.error('Failed to start data cleanup scheduler', error);
      throw error;
    }
  }

  /**
   * 🛑 停止數據清理排程
   * 
   * 功能說明：
   * - 安全停止數據清理的 cron 排程任務
   * - 清理排程資源
   * - 確保優雅關閉
   */
  stop = async (): Promise<void> => {
    try {
      if (this.scheduledJob) {
        if (typeof this.scheduledJob.stop === 'function') {
          this.scheduledJob.stop();
        }
        this.scheduledJob = null;
        this.logger.info('Stopped data cleanup scheduled job');
      }
      
      this.logger.info('Data cleanup scheduler stopped successfully');
    } catch (error) {
      this.logger.error('Failed to stop data cleanup scheduler', error);
      throw error;
    }
  }

  /**
   * 🗑️ 註冊數據清理任務排程
   * 
   * 功能說明：
   * - 註冊定期清理過期資料的 cron 排程
   * - 獨立的 cron 排程，與歸檔任務分離
   * - 支援自定義清理週期和時區設定
   * 
   * 清理任務特點：
   * - 發布 CleanupTaskMessage 到 RabbitMQ
   * - 支援不同的清理策略 (mark_archived, physical_delete)
   * - 批次處理大量資料，避免系統衝擊
   * 
   * 執行邏輯：
   * 1. 讀取清理排程配置
   * 2. 檢查排程啟用狀態
   * 3. 建立並啟動 cron 排程
   * 4. 觸發時呼叫 executeCleanupSchedule()
   */
  private scheduleCleanupTasks(): void {
    const cleanupSchedule = DEFAULT_SCHEDULES.find(s => s.name === 'cleanup-expired');
    
    if (!cleanupSchedule || !cleanupSchedule.enabled) {
      this.logger.warn('Cleanup schedule not found or disabled');
      return;
    }

    const job = cron.schedule(
      cleanupSchedule.cronExpression,
      async () => {
        await this.executeCleanupSchedule();
      },
      {
        scheduled: false,
        timezone: cleanupSchedule.timezone
      }
    );

    job.start();
    this.scheduledJob = job;

    this.logger.info('Data cleanup task schedule registered', {
      name: 'cleanup-expired',
      cron: cleanupSchedule.cronExpression,
      timezone: cleanupSchedule.timezone
    });
  }

  /**
   * 🗑️ 執行數據清理排程 - 核心清理邏輯
   * 
   * 功能說明：
   * - 批次發布多個資料表的清理任務
   * - 管理過期資料的自動清理流程
   * 
   * 清理流程：
   * 1. 批次處理：遍歷所有需要清理的資料表
   * 2. 訊息構建：為每個表創建 CleanupTaskMessage
   * 3. 任務發布：發布到 CLEANUP_EXPIRED 佇列
   * 4. 參數設定：配置清理閾值和批次大小
   * 
   * 清理任務特點：
   * - 清理類型：physical_delete 物理刪除過期資料
   * - 時間閾值：7天前的資料視為過期
   * - 批次大小：使用 CLEANUP_CONFIG.DEFAULT_BATCH_SIZE
   * - 優先級：LOW 優先級，不影響正常業務
   * 
   * 發布的清理對象：
   * - drone_positions: 無人機位置資料
   * - drone_commands: 無人機指令資料  
   * - drone_real_time_status: 無人機即時狀態
   * 
   * 訊息內容：
   * - taskId: 唯一任務識別碼
   * - jobType: 對應的資料類型
   * - cleanupType: 清理方式 (physical_delete)
   * - dateThreshold: 清理時間閾值
   * - batchSize: 批次處理大小
   */
  private executeCleanupSchedule = async (): Promise<void> => {
    const startTime = Date.now();

    try {
      this.logger.info('Starting data cleanup schedule execution');

      const tables = ['drone_positions', 'drone_commands', 'drone_real_time_status'];
      const cleanupTasks: CleanupTaskMessage[] = [];

      for (const tableName of tables) {
        const jobType = ARCHIVE_CONFIG.JOB_TYPE_MAPPINGS[tableName as keyof typeof ARCHIVE_CONFIG.JOB_TYPE_MAPPINGS];
        
        const message: CleanupTaskMessage = {
          taskId: `cleanup_${tableName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          taskType: TaskType.CLEANUP,
          jobType,
          tableName,
          cleanupType: 'physical_delete',
          dateThreshold: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
          batchSize: CLEANUP_CONFIG.DEFAULT_BATCH_SIZE,
          priority: TASK_PRIORITIES.LOW,
          retryCount: 0,
          maxRetries: 2,
          createdAt: new Date()
        };

        // 發布清理任務到 RabbitMQ
        await this.rabbitMQService.publish(
          EXCHANGES.MAIN.name,
          ROUTING_KEYS.CLEANUP_EXPIRED,
          message,
          {
            priority: message.priority,
            persistent: true
          }
        );

        cleanupTasks.push(message);

        this.logger.info('Data cleanup task published', {
          taskId: message.taskId,
          tableName,
          jobType,
          cleanupType: message.cleanupType,
          dateThreshold: message.dateThreshold.toISOString()
        });
      }

      this.logger.info('Data cleanup schedule execution completed', {
        tasksPublished: cleanupTasks.length,
        tables: tables,
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      this.logger.error('Data cleanup schedule execution failed', {
        error,
        executionTime: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * 🎯 手動觸發數據清理任務
   * 
   * 功能說明：
   * - 提供手動觸發數據清理任務的介面
   * - 支援指定表名清理和全量清理兩種模式
   * - 繞過定時排程，立即執行清理任務發布
   * 
   * 觸發模式：
   * 1. 特定表清理 (tableName 指定)：只清理指定的資料表
   * 2. 全量清理 (tableName 未指定)：執行完整的清理排程
   * 
   * 使用場景：
   * - 緊急清理過期數據
   * - 定時清理失敗後的手動補償
   * - 測試驗證清理功能
   * 
   * @param tableName 可選的特定資料表名稱
   * @param daysThreshold 可選的清理天數閾值，預設7天
   */
  triggerCleanup = async (tableName?: string, daysThreshold: number = 7): Promise<void> => {
    this.logger.info('Manual data cleanup trigger', { tableName, daysThreshold });

    if (tableName) {
      // 觸發特定表的清理
      const jobType = ARCHIVE_CONFIG.JOB_TYPE_MAPPINGS[tableName as keyof typeof ARCHIVE_CONFIG.JOB_TYPE_MAPPINGS];
      
      if (jobType) {
        const message: CleanupTaskMessage = {
          taskId: `manual_cleanup_${tableName}_${Date.now()}`,
          taskType: TaskType.CLEANUP,
          jobType,
          tableName,
          cleanupType: 'physical_delete',
          dateThreshold: new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000),
          batchSize: CLEANUP_CONFIG.DEFAULT_BATCH_SIZE,
          priority: TASK_PRIORITIES.MEDIUM, // 手動觸發使用中等優先級
          retryCount: 0,
          maxRetries: 2,
          createdAt: new Date()
        };

        await this.rabbitMQService.publish(
          EXCHANGES.MAIN.name,
          ROUTING_KEYS.CLEANUP_EXPIRED,
          message,
          {
            priority: message.priority,
            persistent: true
          }
        );

        this.logger.info('Manual cleanup task published', {
          taskId: message.taskId,
          tableName,
          jobType,
          daysThreshold
        });
      } else {
        this.logger.warn('Unknown table name for manual cleanup', { tableName });
      }
    } else {
      // 觸發完整的清理排程
      await this.executeCleanupSchedule();
    }
  }

  /**
   * 📊 獲取數據清理排程狀態
   * 
   * 功能說明：
   * - 提供數據清理排程的即時狀態查詢
   * - 返回排程運行狀態和配置資訊
   * - 便於監控和調試清理排程
   * 
   * @returns 數據清理排程狀態
   */
  getStatus = (): {
    hasScheduledJob: boolean;
    scheduleName: string;
    supportedTables: string[];
  } => {
    return {
      hasScheduledJob: !!this.scheduledJob,
      scheduleName: 'cleanup-expired',
      supportedTables: ['drone_positions', 'drone_commands', 'drone_real_time_status']
    };
  }
}