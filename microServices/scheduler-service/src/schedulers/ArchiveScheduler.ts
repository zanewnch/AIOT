/**
 * @fileoverview 歸檔排程器
 * 
 * 負責管理和執行歸檔相關的定時任務
 */

import { injectable, inject } from 'inversify';
import * as cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
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
   * 啟動所有排程任務
   */
  async start(): Promise<void> {
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
   * 停止所有排程任務
   */
  async stop(): Promise<void> {
    try {
      for (const [name, job] of this.scheduledJobs.entries()) {
        job.destroy();
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
   * 排程歸檔任務
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
   * 排程清理任務
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
   * 排程監控任務
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
   * 執行歸檔排程
   */
  private async executeArchiveSchedule(): Promise<void> {
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
   * 創建單個歸檔任務
   */
  private async createArchiveTask(
    jobType: 'positions' | 'commands' | 'status',
    tableName: string,
    archiveTableName: string,
    startDate: Date,
    endDate: Date
  ): Promise<ArchiveTaskModel | null> {
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
   * 執行清理排程
   */
  private async executeCleanupSchedule(): Promise<void> {
    try {
      this.logger.info('Starting cleanup schedule execution');

      const tables = ['drone_positions', 'drone_commands', 'drone_real_time_status'];
      const delayDays = CLEANUP_CONFIG.DEFAULT_BATCH_SIZE;

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
   * 檢查超時任務
   */
  private async checkTimeoutTasks(): Promise<void> {
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
   * 檢查可重試的任務
   */
  private async checkRetryableTasks(): Promise<void> {
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
              archiveTableName: task.archiveTableName,
              isRetry: true
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
  private async estimateRecords(tableName: string, startDate: Date, endDate: Date): Promise<number> {
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
   * 手動觸發歸檔任務
   */
  async triggerArchive(jobType?: 'positions' | 'commands' | 'status'): Promise<void> {
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
   * 獲取排程狀態
   */
  getStatus(): {
    isRunning: boolean;
    scheduledJobs: string[];
    nextExecutions: Record<string, string | null>;
  } {
    const nextExecutions: Record<string, string | null> = {};
    
    for (const [name, job] of this.scheduledJobs.entries()) {
      nextExecutions[name] = job.nextDates(1).toString() || null;
    }

    return {
      isRunning: this.isRunning,
      scheduledJobs: Array.from(this.scheduledJobs.keys()),
      nextExecutions
    };
  }
}