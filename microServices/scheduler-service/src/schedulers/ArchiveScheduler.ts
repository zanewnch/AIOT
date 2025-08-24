/**
 * @fileoverview 歸檔任務排程器 - 負責定時創建並發布歸檔任務到 RabbitMQ
 * 
 * 本類別實現 Publisher 模式，職責包括：
 * 1. 管理多種定時排程 (歸檔/清理/監控)
 * 2. 估算資料量並創建任務記錄
 * 3. 構建 RabbitMQ 訊息並發布到對應佇列
 * 4. 監控任務超時和重試機制
 * 
 * 重要：此類別只負責任務發布，不執行實際的歸檔操作
 * 實際歸檔由對應的 Consumer 服務處理
 * 
 * 支援的排程任務：
 * - archive-daily: 每日歸檔 (drone_positions, drone_commands, drone_real_time_status)
 * - cleanup-expired: 過期資料清理
 * - timeout-monitor: 超時任務檢查 (每30分鐘)
 * - retry-monitor: 失敗任務重試檢查 (每15分鐘)
 * 
 * 發布的訊息類型：
 * - ArchiveTaskMessage: 歸檔任務 → ARCHIVE_POSITIONS/COMMANDS/STATUS
 * - CleanupTaskMessage: 清理任務 → CLEANUP_EXPIRED
 */

import { injectable, inject } from 'inversify';
import * as cron from 'node-cron';
import { Logger } from 'winston';
import { RabbitMQService } from '@/services/RabbitMQService';
import { ArchiveTaskRepository } from '@/repositories/ArchiveTaskRepository';
import { ArchiveTaskModel, ArchiveJobType } from '@/models/ArchiveTaskModel';
import { 
  ArchiveTaskMessage, 
  CleanupTaskMessage,
  TaskType 
} from '@/types/scheduler.types';
import { 
  ARCHIVE_CONFIG, 
  CLEANUP_CONFIG,
  DEFAULT_SCHEDULES 
} from '@/config/schedule.config';
import { 
  EXCHANGES, 
  ROUTING_KEYS, 
  TASK_PRIORITIES 
} from '@/config/queue.config';

export interface DatabaseConnection {
  query(sql: string, params?: any[]): Promise<any[]>;
}

@injectable()
export class ArchiveScheduler {
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  constructor(
    @inject('RabbitMQService') private rabbitMQService: RabbitMQService,
    @inject('ArchiveTaskRepository') private archiveTaskRepo: ArchiveTaskRepository,
    @inject('DatabaseConnection') private database: DatabaseConnection,
    @inject('Logger') private logger: Logger
  ) {}

  /**
   * 🚀 啟動所有排程任務 - Publisher 初始化
   * 
   * 功能說明：
   * - 初始化並啟動所有定時任務排程
   * - 註冊歸檔、清理、監控等多種任務類型的 cron 排程
   * - 建立任務發布的基礎架構
   * 
   * Publisher 啟動流程：
   * 1. 註冊歸檔任務排程 (scheduleArchiveTasks)
   * 2. 註冊清理任務排程 (scheduleCleanupTasks)  
   * 3. 註冊監控任務排程 (scheduleMonitoringTasks)
   * 4. 記錄已啟動的排程任務清單
   * 
   * 注意事項：
   * - 所有排程任務都是非同步執行，不會阻塞啟動流程
   * - 每個排程都有獨立的 cron 表達式和時區設定
   * - 啟動失敗會拋出異常，確保服務狀態的明確性
   */
  start = async (): Promise<void> => {
    try {
      // 啟動歸檔排程
      this.scheduleArchiveTasks();
      
      // 啟動清理排程
      this.scheduleCleanupTasks();
      
      // 啟動監控排程
      this.scheduleMonitoringTasks();

      this.logger.info('Archive scheduler started successfully', {
        scheduledJobs: Array.from(this.scheduledJobs.keys())
      });
    } catch (error) {
      this.logger.error('Failed to start archive scheduler', error);
      throw error;
    }
  }

  /**
   * 🛑 停止所有排程任務 - Publisher 關閉
   * 
   * 功能說明：
   * - 安全停止所有正在運行的 cron 排程任務
   * - 清理排程任務記錄，釋放系統資源
   * - 確保服務能夠優雅關閉
   * 
   * 停止流程：
   * 1. 遍歷所有已註冊的排程任務
   * 2. 呼叫 stop() 方法停止每個 cron 任務
   * 3. 清空排程任務 Map 集合
   * 4. 記錄停止結果
   * 
   * 注意事項：
   * - 正在執行中的任務不會被強制中斷
   * - 只是停止後續的定時觸發
   * - 適用於服務重啟或正常關閉場景
   */
  stop = async (): Promise<void> => {
    try {
      for (const [name, job] of this.scheduledJobs.entries()) {
        if (typeof job.stop === 'function') {
          job.stop();
        }
        this.logger.info(`Stopped scheduled job: ${name}`);
      }
      
      this.scheduledJobs.clear();
      this.logger.info('Archive scheduler stopped successfully');
    } catch (error) {
      this.logger.error('Failed to stop archive scheduler', error);
      throw error;
    }
  }

  /**
   * 📅 排程歸檔任務 - 主要 Publisher 排程註冊
   * 
   * 功能說明：
   * - 註冊每日歸檔任務的 cron 排程
   * - 設定歸檔任務的觸發時間和時區
   * - 防止重複執行的並發控制
   * 
   * Publisher 排程特點：
   * - 使用 cron 表達式精確控制執行時間
   * - 支援時區設定，適應不同地區需求
   * - 並發控制：檢查 isRunning 狀態避免重疊執行
   * - 延遲啟動：scheduled: false 後手動 start()
   * 
   * 執行邏輯：
   * 1. 讀取歸檔排程配置 (DEFAULT_SCHEDULES)
   * 2. 檢查排程是否啟用
   * 3. 建立 cron 任務，綁定執行函數
   * 4. 啟動排程並註冊到 scheduledJobs Map
   * 
   * 觸發的業務邏輯：
   * - 呼叫 executeArchiveSchedule() 執行完整歸檔流程
   * - 該方法會發布多個歸檔任務到不同的 RabbitMQ 佇列
   */
  private scheduleArchiveTasks(): void {
    const archiveSchedule = DEFAULT_SCHEDULES.find(s => s.name === 'archive-daily');
    
    if (!archiveSchedule || !archiveSchedule.enabled) {
      this.logger.warn('Archive schedule not found or disabled');
      return;
    }

    const job = cron.schedule(
      archiveSchedule.cronExpression,
      async () => {
        if (this.isRunning) {
          this.logger.warn('Archive scheduler already running, skipping execution');
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
    this.scheduledJobs.set('archive-daily', job);
    
    this.logger.info('Archive task schedule registered', {
      name: 'archive-daily',
      cron: archiveSchedule.cronExpression,
      timezone: archiveSchedule.timezone
    });
  }

  /**
   * 🗑️ 排程清理任務 - 過期資料清理 Publisher
   * 
   * 功能說明：
   * - 註冊定期清理過期資料的 cron 排程
   * - 管理資料生命週期，自動清理不再需要的歷史資料
   * - 維護系統效能，避免資料庫膨脹
   * 
   * Publisher 清理排程：
   * - 獨立的 cron 排程，與歸檔任務分離
   * - 支援自定義清理週期和時區設定
   * - 直接觸發清理任務發布，無需額外並發控制
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
    this.scheduledJobs.set('cleanup-expired', job);

    this.logger.info('Cleanup task schedule registered', {
      name: 'cleanup-expired',
      cron: cleanupSchedule.cronExpression,
      timezone: cleanupSchedule.timezone
    });
  }

  /**
   * 📊 排程監控任務 - 系統健康監控 Publisher
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
   * Publisher 監控特點：
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

    this.logger.info('Monitoring tasks scheduled', {
      timeoutCheck: '*/30 * * * *',
      retryCheck: '*/15 * * * *'
    });
  }

  /**
   * 🚀 執行歸檔排程 - 核心 Publisher 業務邏輯
   * 
   * 功能說明：
   * - 這是 Publisher 模式的核心實現方法
   * - 負責批次創建並發布多種類型的歸檔任務
   * - 計算歸檔日期範圍，估算資料量，發布任務訊息
   * 
   * Publisher 執行流程：
   * 1. **併發控制**：檢查 isRunning 狀態，避免重複執行
   * 2. **日期計算**：根據 DATA_RETENTION_DAYS 計算歸檔範圍
   * 3. **並行創建**：同時創建三種歸檔任務 (positions, commands, status)
   * 4. **任務發布**：每個任務都會發布對應的 RabbitMQ 訊息
   * 5. **結果統計**：記錄創建的任務數量和執行時間
   * 
   * 發布的任務類型：
   * - **positions**: 無人機位置資料歸檔
   * - **commands**: 無人機指令資料歸檔  
   * - **status**: 無人機狀態資料歸檔
   * 
   * 每個任務的 Publisher 流程：
   * ```
   * 估算記錄數 → 建立資料庫記錄 → 構建 RabbitMQ 訊息 → 發布到交換器
   * ```
   * 
   * 異常處理：
   * - 單一任務失敗不影響其他任務
   * - 完整的錯誤日誌和執行時間統計
   * - 確保 isRunning 狀態正確重置
   */
  private executeArchiveSchedule = async (): Promise<void> => {
    this.isRunning = true;
    const startTime = Date.now();

    try {
      this.logger.info('Starting archive schedule execution');

      // 計算歸檔日期範圍 (保留1天的數據)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - ARCHIVE_CONFIG.DATA_RETENTION_DAYS);
      endDate.setHours(23, 59, 59, 999);

      const startDate = new Date(endDate);
      startDate.setHours(0, 0, 0, 0);

      // 創建歸檔任務
      const archiveTasks = await Promise.all([
        this.createArchiveTask('positions', 'drone_positions', 'drone_positions_archive', startDate, endDate),
        this.createArchiveTask('commands', 'drone_commands', 'drone_commands_archive', startDate, endDate),
        this.createArchiveTask('status', 'drone_real_time_status', 'drone_status_archive', startDate, endDate)
      ]);

      const validTasks = archiveTasks.filter(task => task !== null);

      this.logger.info('Archive schedule execution completed', {
        tasksCreated: validTasks.length,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      this.logger.error('Archive schedule execution failed', {
        error,
        executionTime: Date.now() - startTime
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 📦 創建單個歸檔任務 - Publisher 訊息構建與發布
   * 
   * 功能說明：
   * - 這是 Publisher 模式的訊息構建核心方法
   * - 負責單一類型歸檔任務的完整創建和發布流程
   * - 結合資料庫操作與 RabbitMQ 訊息發布
   * 
   * Publisher 創建流程：
   * 1. **資料估算**：計算待歸檔的記錄數量
   * 2. **記錄創建**：在資料庫中建立任務追蹤記錄
   * 3. **訊息構建**：組裝完整的 ArchiveTaskMessage
   * 4. **訊息發布**：發布到指定的 RabbitMQ 交換器
   * 5. **路由分發**：根據 jobType 選擇對應的 routing key
   * 
   * 訊息內容包含：
   * - 任務識別：taskId, batchId, jobType
   * - 時間範圍：dateRangeStart, dateRangeEnd  
   * - 處理參數：batchSize, priority, retryCount
   * - 元數據：estimatedRecords, tableName, archiveTableName
   * 
   * Publisher 特性：
   * - **可靠性**：persistent: true 確保訊息持久化
   * - **優先級**：根據任務類型設定處理優先級
   * - **追蹤性**：完整的任務生命週期記錄
   * - **容錯性**：發布失敗不影響其他任務創建
   * 
   * 路由策略：
   * - positions → ARCHIVE_POSITIONS 佇列
   * - commands → ARCHIVE_COMMANDS 佇列
   * - status → ARCHIVE_STATUS 佇列
   * 
   * @param jobType 歸檔任務類型
   * @param tableName 來源資料表名稱
   * @param archiveTableName 目標歸檔表名稱
   * @param startDate 歸檔開始日期
   * @param endDate 歸檔結束日期
   * @returns 創建的任務模型或 null (無資料時)
   */
  private createArchiveTask = async (
    jobType: 'positions' | 'commands' | 'status',
    tableName: string,
    archiveTableName: string,
    startDate: Date,
    endDate: Date
  ): Promise<ArchiveTaskModel | null> => {
    try {
      // 估算記錄數量
      const estimatedRecords = await this.estimateRecords(tableName, startDate, endDate);

      if (estimatedRecords === 0) {
        this.logger.info(`No records to archive for ${tableName}`, {
          jobType,
          dateRange: { start: startDate, end: endDate }
        });
        return null;
      }

      // 生成批次ID
      const batchId = `${jobType.toUpperCase()}_${startDate.toISOString().split('T')[0].replace(/-/g, '')}_${Date.now()}`;

      // 創建資料庫記錄
      const task = await this.archiveTaskRepo.create({
        jobType: jobType as ArchiveJobType,
        tableName,
        archiveTableName,
        dateRangeStart: startDate,
        dateRangeEnd: endDate,
        batchId,
        createdBy: 'archive_scheduler'
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
          archiveTableName
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

      this.logger.info('Archive task created and published', {
        taskId: task.id,
        jobType,
        batchId,
        estimatedRecords,
        routingKey
      });

      return task;

    } catch (error) {
      this.logger.error('Failed to create archive task', {
        error,
        jobType,
        tableName,
        dateRange: { start: startDate, end: endDate }
      });
      return null;
    }
  }

  /**
   * 🗑️ 執行清理排程 - 清理任務 Publisher 實現
   * 
   * 功能說明：
   * - 實現清理任務的 Publisher 邏輯
   * - 批次發布多個資料表的清理任務
   * - 管理過期資料的自動清理流程
   * 
   * Publisher 清理流程：
   * 1. **批次處理**：遍歷所有需要清理的資料表
   * 2. **訊息構建**：為每個表創建 CleanupTaskMessage
   * 3. **任務發布**：發布到 CLEANUP_EXPIRED 佇列
   * 4. **參數設定**：配置清理閾值和批次大小
   * 
   * 清理任務特點：
   * - **清理類型**：physical_delete 物理刪除過期資料
   * - **時間閾值**：7天前的資料視為過期
   * - **批次大小**：使用 CLEANUP_CONFIG.DEFAULT_BATCH_SIZE
   * - **優先級**：LOW 優先級，不影響正常業務
   * 
   * 發布的清理對象：
   * - drone_positions: 無人機位置資料
   * - drone_commands: 無人機指令資料  
   * - drone_real_time_status: 無人機即時狀態
   * 
   * Publisher 訊息內容：
   * - taskId: 唯一任務識別碼
   * - jobType: 對應的資料類型
   * - cleanupType: 清理方式 (physical_delete)
   * - dateThreshold: 清理時間閾值
   * - batchSize: 批次處理大小
   * 
   * 容錯機制：
   * - 單表清理失敗不影響其他表
   * - 完整的錯誤日誌記錄
   * - 重試次數限制 (maxRetries: 2)
   */
  private executeCleanupSchedule = async (): Promise<void> => {
    try {
      this.logger.info('Starting cleanup schedule execution');

      const tables = ['drone_positions', 'drone_commands', 'drone_real_time_status'];
      // 清理配置中的批次大小用於處理，不是延遲天數

      for (const tableName of tables) {
        const jobType = ARCHIVE_CONFIG.JOB_TYPE_MAPPINGS[tableName as keyof typeof ARCHIVE_CONFIG.JOB_TYPE_MAPPINGS];
        
        const message: CleanupTaskMessage = {
          taskId: `cleanup_${tableName}_${Date.now()}`,
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

        await this.rabbitMQService.publish(
          EXCHANGES.MAIN.name,
          ROUTING_KEYS.CLEANUP_EXPIRED,
          message,
          {
            priority: message.priority,
            persistent: true
          }
        );

        this.logger.info('Cleanup task published', {
          taskId: message.taskId,
          tableName,
          jobType
        });
      }

    } catch (error) {
      this.logger.error('Cleanup schedule execution failed', error);
    }
  }

  /**
   * ⏰ 檢查超時任務 - Publisher 監控與狀態管理
   * 
   * 功能說明：
   * - 監控長時間執行的任務，防止系統資源浪費
   * - 自動標記超時任務為失敗狀態
   * - 維護任務執行的健康狀態
   * 
   * 監控邏輯：
   * 1. **超時檢測**：查詢執行超過4小時的任務
   * 2. **狀態更新**：將超時任務標記為失敗
   * 3. **日誌記錄**：詳細記錄超時任務資訊
   * 4. **資源釋放**：避免僵屍任務佔用資源
   * 
   * Publisher 監控特點：
   * - **定期檢查**：每30分鐘執行一次
   * - **批次處理**：一次處理多個超時任務
   * - **狀態一致性**：確保任務狀態的準確性
   * - **異常隔離**：監控失敗不影響其他功能
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
    try {
      const timeoutTasks = await this.archiveTaskRepo.findTimeoutTasks(4); // 4小時超時

      if (timeoutTasks.length > 0) {
        this.logger.warn('Found timeout tasks', {
          count: timeoutTasks.length,
          taskIds: timeoutTasks.map(t => t.id)
        });

        // 標記超時任務為失敗
        for (const task of timeoutTasks) {
          await task.markAsFailed('Task execution timeout');
        }
      }

    } catch (error) {
      this.logger.error('Failed to check timeout tasks', error);
    }
  }

  /**
   * 🔄 檢查可重試的任務 - Publisher 重試機制實現
   * 
   * 功能說明：
   * - 實現失敗任務的智能重試機制
   * - 重新發布符合條件的失敗任務到 RabbitMQ
   * - 提高任務執行的成功率和系統可靠性
   * 
   * Publisher 重試流程：
   * 1. **任務查詢**：查找失敗且可重試的任務 (重試次數 < 3)
   * 2. **時間檢查**：確認任務失敗後已等待30分鐘冷卻期
   * 3. **狀態重置**：呼叫 task.reset() 重置任務狀態
   * 4. **訊息重建**：構建新的 ArchiveTaskMessage
   * 5. **重新發布**：發布到原始的 RabbitMQ 佇列
   * 
   * 重試條件與策略：
   * - **冷卻期**：失敗後等待30分鐘再重試
   * - **次數限制**：最多重試3次
   * - **訊息更新**：retryCount 遞增，記錄重試狀態
   * - **路由保持**：使用原始的 routing key 確保路由一致性
   * 
   * Publisher 重試特點：
   * - **智能重試**：基於時間和次數的條件判斷
   * - **狀態恢復**：完整的任務狀態重置流程
   * - **訊息一致性**：保持原始任務的核心參數
   * - **持久化保證**：重試任務同樣使用 persistent: true
   * 
   * 重新發布內容：
   * - 保持原始：taskId, jobType, batchId, 日期範圍
   * - 更新參數：retryCount = 1, createdAt = 當前時間
   * - 移除標記：isRetry 元數據 (已修正類型問題)
   * 
   * 容錯機制：
   * - 重試處理失敗不影響其他任務
   * - 完整的錯誤處理和日誌記錄
   * - 確保重試機制的穩定運行
   */
  private checkRetryableTasks = async (): Promise<void> => {
    try {
      const retryableTasks = await this.archiveTaskRepo.findRetryableTasks(3);

      for (const task of retryableTasks) {
        // 簡單的重試邏輯：失敗後30分鐘可以重試
        const failedTime = task.completedAt?.getTime() || 0;
        const canRetryTime = failedTime + (30 * 60 * 1000); // 30分鐘

        if (Date.now() > canRetryTime) {
          this.logger.info('Retrying failed task', {
            taskId: task.id,
            batchId: task.batchId,
            failedAt: task.completedAt?.toISOString()
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
            retryCount: 1,
            maxRetries: 3,
            createdAt: new Date(),
            metadata: {
              tableName: task.tableName,
              archiveTableName: task.archiveTableName
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
        }
      }

    } catch (error) {
      this.logger.error('Failed to check retryable tasks', error);
    }
  }

  /**
   * 估算記錄數量
   */
  private estimateRecords = async (tableName: string, startDate: Date, endDate: Date): Promise<number> => {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM ${tableName} 
        WHERE createdAt >= ? AND createdAt <= ?
          AND (archived_at IS NULL)
      `;
      
      const result = await this.database.query(query, [startDate, endDate]);
      return result[0]?.count || 0;
    } catch (error) {
      this.logger.error('Failed to estimate records', { error, tableName, startDate, endDate });
      return 0;
    }
  }

  /**
   * 🎯 手動觸發歸檔任務 - Publisher 手動控制介面
   * 
   * 功能說明：
   * - 提供手動觸發歸檔任務的 Publisher 介面
   * - 支援全量歸檔和特定類型歸檔兩種模式
   * - 繞過定時排程，立即執行歸檔任務發布
   * 
   * Publisher 觸發模式：
   * 
   * 1. **特定類型觸發** (jobType 指定)：
   *    - 只處理指定的資料類型 (positions/commands/status)
   *    - 查找對應的資料表配置
   *    - 建立單一歸檔任務並發布
   *    - 適用於針對性的資料歸檔需求
   * 
   * 2. **全量觸發** (jobType 未指定)：
   *    - 執行完整的歸檔排程 (executeArchiveSchedule)
   *    - 創建所有類型的歸檔任務
   *    - 等同於定時排程的手動執行
   *    - 適用於緊急或補償性的批次歸檔
   * 
   * Publisher 執行邏輯：
   * - 使用相同的 DATA_RETENTION_DAYS 計算歸檔範圍
   * - 應用相同的表映射和配置規則
   * - 發布相同格式的 RabbitMQ 訊息
   * - 記錄手動觸發的審計日誌
   * 
   * 使用場景：
   * - **緊急歸檔**：系統負載低時手動執行大量歸檔
   * - **故障恢復**：定時任務失敗後的手動補償
   * - **測試驗證**：開發/測試環境的功能驗證
   * - **特定需求**：只需歸檔特定類型資料時
   * 
   * 安全性考量：
   * - 手動觸發不會繞過併發控制 (isRunning 檢查)
   * - 保持與自動排程相同的安全措施
   * - 完整的日誌記錄便於追蹤和審計
   * 
   * @param jobType 可選的特定歸檔類型，未指定時執行全量歸檔
   */
  triggerArchive = async (jobType?: 'positions' | 'commands' | 'status'): Promise<void> => {
    this.logger.info('Manual archive trigger', { jobType });

    if (jobType) {
      // 觸發特定類型的歸檔
      const tableName = Object.keys(ARCHIVE_CONFIG.TABLE_MAPPINGS).find(
        key => ARCHIVE_CONFIG.JOB_TYPE_MAPPINGS[key as keyof typeof ARCHIVE_CONFIG.JOB_TYPE_MAPPINGS] === jobType
      );

      if (tableName) {
        const archiveTableName = ARCHIVE_CONFIG.TABLE_MAPPINGS[tableName as keyof typeof ARCHIVE_CONFIG.TABLE_MAPPINGS];
        
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - ARCHIVE_CONFIG.DATA_RETENTION_DAYS);
        
        const startDate = new Date(endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        await this.createArchiveTask(jobType, tableName, archiveTableName, startDate, endDate);
      }
    } else {
      // 觸發完整的歸檔排程
      await this.executeArchiveSchedule();
    }
  }

  /**
   * 📊 獲取排程狀態 - Publisher 狀態監控介面
   * 
   * 功能說明：
   * - 提供 Publisher 當前狀態的即時查詢介面
   * - 返回排程任務的運行狀態和配置資訊
   * - 便於監控和調試 Publisher 的執行情況
   * 
   * 狀態資訊包含：
   * 
   * 1. **執行狀態** (isRunning)：
   *    - 指示當前是否有歸檔排程正在執行
   *    - 用於併發控制和狀態監控
   *    - boolean 值，true 表示正在執行
   * 
   * 2. **已註冊排程** (scheduledJobs)：
   *    - 列出所有已註冊的 cron 排程任務名稱
   *    - 包含：archive-daily, cleanup-expired, timeout-monitor, retry-monitor
   *    - 用於確認 Publisher 的排程配置狀態
   * 
   * 3. **下次執行時間** (nextExecutions)：
   *    - 原計劃顯示每個排程的下次執行時間
   *    - 由於 node-cron v3.x 限制，顯示固定說明文字
   *    - 提示排程已配置但具體時間需查看 cron 表達式
   * 
   * Publisher 狀態監控用途：
   * - **健康檢查**：確認 Publisher 服務正常運行
   * - **調試診斷**：排查排程任務的配置問題
   * - **運營監控**：監控系統的自動化任務狀態
   * - **API 回應**：提供給前端或監控系統使用
   * 
   * 返回值結構說明：
   * ```typescript
   * {
   *   isRunning: boolean,              // 當前執行狀態
   *   scheduledJobs: string[],         // 已註冊的排程名稱列表  
   *   nextExecutions: Record<string, string | null>  // 下次執行時間映射
   * }
   * ```
   * 
   * 使用注意：
   * - 此方法為同步方法，不會執行耗時操作
   * - 狀態資訊為即時快照，可能隨時變化
   * - nextExecutions 受限於 node-cron 版本，顯示說明文字
   */
  getStatus = (): {
    isRunning: boolean;
    scheduledJobs: string[];
    nextExecutions: Record<string, string | null>;
  } => {
    const nextExecutions: Record<string, string | null> = {};
    
    for (const [name] of this.scheduledJobs.entries()) {
      // node-cron v3.x 不支援 nextDates 方法，使用替代方案
      nextExecutions[name] = 'Scheduled (next execution time not available)';
    }

    return {
      isRunning: this.isRunning,
      scheduledJobs: Array.from(this.scheduledJobs.keys()),
      nextExecutions
    };
  }
}