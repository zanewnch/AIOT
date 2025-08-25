/**
 * @fileoverview Drone 數據歸檔排程器 - 專門負責無人機數據的定時歸檔任務
 * 
 * ============================================================================
 * 🏗️ 重構後的單一職責設計 (Producer-Consumer 模式)
 * ============================================================================
 * 
 * 【DroneArchiveScheduler】= Drone 專用歸檔調度引擎 ← 本文件
 * 職責：
 * • 專門負責 Drone 相關數據的歸檔排程 (positions, commands, status)
 * • 定時創建 Drone 歸檔任務並發布到 RabbitMQ
 * • 手動觸發 Drone 歸檔功能
 * • ⚠️ 單一職責：只處理 Drone 數據歸檔，不處理清理、監控等其他功能
 * 
 * 協作關係：
 * • DataCleanupScheduler: 負責過期數據清理
 * • TaskMonitorScheduler: 負責任務監控和重試
 * • TaskResultHandler: 負責結果回調處理
 * • ArchiveTaskController: 負責任務管理 API
 * 
 * ============================================================================
 * 
 * 核心功能：
 * 1. 管理 Drone 數據歸檔的定時排程
 * 2. 估算 Drone 數據量並創建歸檔任務記錄
 * 3. 構建並發布 Drone 歸檔 RabbitMQ 訊息
 * 4. 提供手動觸發 Drone 歸檔的介面
 * 
 * 支援的 Drone 數據類型：
 * - positions: drone_positions → drone_positions_archive
 * - commands: drone_commands → drone_commands_archive  
 * - status: drone_real_time_status → drone_status_archive
 * 
 * 發布的訊息類型：
 * - ArchiveTaskMessage → ARCHIVE_POSITIONS/COMMANDS/STATUS 佇列
 */

import { injectable, inject } from 'inversify';
import * as cron from 'node-cron';
import { Logger } from 'winston';
import { TYPES } from '../container/types';
import { RabbitMQService } from '../services/RabbitMQService';
import { ArchiveTaskRepository } from '../repositories/ArchiveTaskRepository';
import { ArchiveTaskModel, ArchiveJobType } from '../models/ArchiveTaskModel';
import { 
  ArchiveTaskMessage,
  TaskType 
} from '../types/scheduler.types';
import { 
  ARCHIVE_CONFIG, 
  DEFAULT_SCHEDULES 
} from '../configs/schedule.config';
import { 
  EXCHANGES, 
  ROUTING_KEYS 
} from '../configs/queue.config';

export interface DatabaseConnection {
  query(sql: string, params?: any[]): Promise<any[]>;
}

@injectable()
export class DroneArchiveScheduler {
  private scheduledJob: cron.ScheduledTask | null = null;
  private isRunning = false;

  constructor(
    @inject(TYPES.RabbitMQService) private rabbitMQService: RabbitMQService,
    @inject(TYPES.ArchiveTaskRepository) private archiveTaskRepository: ArchiveTaskRepository,
    @inject(TYPES.DatabaseConnection) private database: DatabaseConnection,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  /**
   * 🚀 啟動 Drone 歸檔排程
   * 
   * 功能說明：
   * - 初始化並啟動 Drone 數據歸檔的定時排程
   * - 專門處理 drone_positions, drone_commands, drone_real_time_status 三種數據類型
   * - 使用 cron 表達式控制歸檔執行時間
   * 
   * 啟動流程：
   * 1. 讀取歸檔排程配置
   * 2. 註冊定時任務 (archive-daily)
   * 3. 啟動 cron 排程
   * 4. 記錄啟動狀態
   */
  start = async (): Promise<void> => {
    try {
      this.scheduleArchiveTasks();

      this.logger.info('Drone archive scheduler started successfully', {
        scheduleName: 'archive-daily',
        isScheduled: !!this.scheduledJob
      });
    } catch (error) {
      this.logger.error('Failed to start drone archive scheduler', error);
      throw error;
    }
  }

  /**
   * 🛑 停止 Drone 歸檔排程
   * 
   * 功能說明：
   * - 安全停止 Drone 歸檔的 cron 排程任務
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
        this.logger.info('Stopped drone archive scheduled job');
      }
      
      this.logger.info('Drone archive scheduler stopped successfully');
    } catch (error) {
      this.logger.error('Failed to stop drone archive scheduler', error);
      throw error;
    }
  }

  /**
   * 📅 註冊 Drone 歸檔任務排程
   * 
   * 功能說明：
   * - 註冊 Drone 數據歸檔的 cron 排程
   * - 設定歸檔任務的觸發時間和時區
   * - 防止重複執行的並發控制
   * 
   * 執行邏輯：
   * 1. 讀取歸檔排程配置 (archive-daily)
   * 2. 檢查排程是否啟用
   * 3. 建立 cron 任務，綁定執行函數
   * 4. 啟動排程
   */
  private scheduleArchiveTasks(): void {
    const archiveSchedule = DEFAULT_SCHEDULES.find(s => s.name === 'archive-daily');
    
    if (!archiveSchedule || !archiveSchedule.enabled) {
      this.logger.warn('Drone archive schedule not found or disabled');
      return;
    }

    const job = cron.schedule(
      archiveSchedule.cronExpression,
      async () => {
        if (this.isRunning) {
          this.logger.warn('Drone archive scheduler already running, skipping execution');
          return;
        }

        await this.executeArchiveSchedule();
      },
      {
        scheduled: false,
        timezone: archiveSchedule.timezone
      }
    );

    job.start();
    this.scheduledJob = job;
    
    this.logger.info('Drone archive task schedule registered', {
      name: 'archive-daily',
      cron: archiveSchedule.cronExpression,
      timezone: archiveSchedule.timezone
    });
  }

  /**
   * 🚀 執行 Drone 歸檔排程 - 核心業務邏輯
   * 
   * 功能說明：
   * - 批次創建並發布三種 Drone 數據類型的歸檔任務
   * - 計算歸檔日期範圍，估算資料量，發布任務訊息
   * 
   * 執行流程：
   * 1. 併發控制：避免重複執行
   * 2. 日期計算：根據 DATA_RETENTION_DAYS 計算歸檔範圍
   * 3. 並行創建：同時創建三種 Drone 歸檔任務
   * 4. 任務發布：每個任務都會發布對應的 RabbitMQ 訊息
   * 5. 結果統計：記錄創建的任務數量和執行時間
   * 
   * 發布的 Drone 任務類型：
   * - positions: 無人機位置資料歸檔
   * - commands: 無人機指令資料歸檔  
   * - status: 無人機狀態資料歸檔
   */
  private executeArchiveSchedule = async (): Promise<void> => {
    this.isRunning = true;
    const startTime = Date.now();

    try {
      this.logger.info('Starting drone archive schedule execution');

      // 計算歸檔日期範圍 (保留1天的數據)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - ARCHIVE_CONFIG.DATA_RETENTION_DAYS);
      endDate.setHours(23, 59, 59, 999);

      const startDate = new Date(endDate);
      startDate.setHours(0, 0, 0, 0);

      // 創建 Drone 歸檔任務
      const archiveTasks = await Promise.all([
        this.createDroneArchiveTask('positions', 'drone_positions', 'drone_positions_archive', startDate, endDate),
        this.createDroneArchiveTask('commands', 'drone_commands', 'drone_commands_archive', startDate, endDate),
        this.createDroneArchiveTask('status', 'drone_real_time_status', 'drone_status_archive', startDate, endDate)
      ]);

      const validTasks = archiveTasks.filter(task => task !== null);

      this.logger.info('Drone archive schedule execution completed', {
        tasksCreated: validTasks.length,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      this.logger.error('Drone archive schedule execution failed', {
        error,
        executionTime: Date.now() - startTime
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 📦 創建單個 Drone 歸檔任務
   * 
   * 功能說明：
   * - 創建單一 Drone 數據類型的歸檔任務
   * - 估算資料量，建立資料庫記錄，發布到 RabbitMQ
   * 
   * 處理流程：
   * 1. 資料估算：計算待歸檔的 Drone 記錄數量
   * 2. 記錄創建：在資料庫中建立任務追蹤記錄
   * 3. 訊息構建：組裝完整的 ArchiveTaskMessage
   * 4. 訊息發布：發布到指定的 RabbitMQ 交換器
   * 5. 路由分發：根據 jobType 選擇對應的 routing key
   * 
   * 路由策略：
   * - positions → ARCHIVE_POSITIONS 佇列
   * - commands → ARCHIVE_COMMANDS 佇列
   * - status → ARCHIVE_STATUS 佇列
   * 
   * @param jobType Drone 歸檔任務類型
   * @param tableName Drone 來源資料表名稱
   * @param archiveTableName Drone 目標歸檔表名稱
   * @param startDate 歸檔開始日期
   * @param endDate 歸檔結束日期
   * @returns 創建的任務模型或 null (無資料時)
   */
  private createDroneArchiveTask = async (
    jobType: 'positions' | 'commands' | 'status',
    tableName: string,
    archiveTableName: string,
    startDate: Date,
    endDate: Date
  ): Promise<ArchiveTaskModel | null> => {
    try {
      // 估算 Drone 記錄數量
      const estimatedRecords = await this.estimateDroneRecords(tableName, startDate, endDate);

      if (estimatedRecords === 0) {
        this.logger.info(`No drone records to archive for ${tableName}`, {
          jobType,
          dateRange: { start: startDate, end: endDate }
        });
        return null;
      }

      // 生成批次ID
      const batchId = `DRONE_${jobType.toUpperCase()}_${startDate.toISOString().split('T')[0].replace(/-/g, '')}_${Date.now()}`;

      // 創建資料庫記錄
      const task = await this.archiveTaskRepository.create({
        jobType: jobType as ArchiveJobType,
        tableName,
        archiveTableName,
        dateRangeStart: startDate,
        dateRangeEnd: endDate,
        batchId,
        createdBy: 'drone_archive_scheduler'
      });

      // 創建 RabbitMQ 消息
      const message: ArchiveTaskMessage = {
        taskId: task.id.toString(),
        taskType: TaskType.ARCHIVE,
        jobType,
        batchId,
        dateRangeStart: startDate,
        dateRangeEnd: endDate,
        batchSize: ARCHIVE_CONFIG.DEFAULT_BATCH_SIZE,
        priority: ARCHIVE_CONFIG.PRIORITY_SETTINGS[jobType],
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        metadata: {
          estimatedRecords,
          tableName,
          archiveTableName,
          dataType: 'drone' // 標記為 Drone 數據
        }
      };

      // 發布到 RabbitMQ
      const routingKey = ROUTING_KEYS[`ARCHIVE_${jobType.toUpperCase()}` as keyof typeof ROUTING_KEYS];
      await this.rabbitMQService.publish(
        EXCHANGES.MAIN.name,
        routingKey,
        message,
        {
          priority: message.priority,
          persistent: true
        }
      );

      this.logger.info('Drone archive task created and published', {
        taskId: task.id,
        jobType,
        batchId,
        estimatedRecords,
        routingKey,
        tableName
      });

      return task;

    } catch (error) {
      this.logger.error('Failed to create drone archive task', {
        error,
        jobType,
        tableName,
        dateRange: { start: startDate, end: endDate }
      });
      return null;
    }
  }

  /**
   * 📊 估算 Drone 記錄數量
   * 
   * 功能說明：
   * - 查詢指定 Drone 數據表中待歸檔的記錄數量
   * - 只統計未歸檔的記錄 (archived_at IS NULL)
   * - 用於任務創建前的資料量評估
   * 
   * @param tableName Drone 資料表名稱
   * @param startDate 查詢開始日期
   * @param endDate 查詢結束日期
   * @returns 待歸檔的 Drone 記錄數量
   */
  private estimateDroneRecords = async (tableName: string, startDate: Date, endDate: Date): Promise<number> => {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM ${tableName} 
        WHERE createdAt >= ? AND createdAt <= ?
          AND (archived_at IS NULL)
      `;
      
      const result = await this.database.query(query, [startDate, endDate]);
      const count = result[0]?.count || 0;

      this.logger.debug('Drone records estimation completed', {
        tableName,
        dateRange: { start: startDate, end: endDate },
        estimatedRecords: count
      });

      return count;
    } catch (error) {
      this.logger.error('Failed to estimate drone records', { 
        error, 
        tableName, 
        startDate, 
        endDate 
      });
      return 0;
    }
  }

  /**
   * 🎯 手動觸發 Drone 歸檔任務
   * 
   * 功能說明：
   * - 提供手動觸發 Drone 歸檔任務的介面
   * - 支援全量 Drone 歸檔和特定類型歸檔兩種模式
   * - 繞過定時排程，立即執行 Drone 歸檔任務發布
   * 
   * 觸發模式：
   * 1. 特定類型觸發 (jobType 指定)：只處理指定的 Drone 數據類型
   * 2. 全量觸發 (jobType 未指定)：執行完整的 Drone 歸檔排程
   * 
   * 使用場景：
   * - 緊急 Drone 數據歸檔
   * - 定時任務失敗後的手動補償
   * - 測試驗證 Drone 歸檔功能
   * 
   * @param jobType 可選的特定 Drone 歸檔類型
   */
  triggerDroneArchive = async (jobType?: 'positions' | 'commands' | 'status'): Promise<void> => {
    this.logger.info('Manual drone archive trigger', { jobType });

    if (jobType) {
      // 觸發特定類型的 Drone 歸檔
      const tableMappings = {
        'positions': { table: 'drone_positions', archive: 'drone_positions_archive' },
        'commands': { table: 'drone_commands', archive: 'drone_commands_archive' },
        'status': { table: 'drone_real_time_status', archive: 'drone_status_archive' }
      };

      const mapping = tableMappings[jobType];
      if (mapping) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - ARCHIVE_CONFIG.DATA_RETENTION_DAYS);
        
        const startDate = new Date(endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        await this.createDroneArchiveTask(jobType, mapping.table, mapping.archive, startDate, endDate);
      }
    } else {
      // 觸發完整的 Drone 歸檔排程
      await this.executeArchiveSchedule();
    }
  }

  /**
   * 📊 獲取 Drone 歸檔排程狀態
   * 
   * 功能說明：
   * - 提供 Drone 歸檔排程的即時狀態查詢
   * - 返回排程運行狀態和配置資訊
   * - 便於監控和調試 Drone 歸檔排程
   * 
   * @returns Drone 歸檔排程狀態
   */
  getStatus = (): {
    isRunning: boolean;
    hasScheduledJob: boolean;
    scheduleName: string;
  } => {
    return {
      isRunning: this.isRunning,
      hasScheduledJob: !!this.scheduledJob,
      scheduleName: 'archive-daily'
    };
  }
}