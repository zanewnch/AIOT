/**
 * @fileoverview 監控服務類別
 * 
 * 提供系統監控、健康檢查和性能指標收集功能
 */

import { injectable, inject } from 'inversify';
import { Logger } from 'winston';
import { createClient, RedisClientType } from 'redis';
// TODO: Re-enable when NotificationService DI is fixed
// import { NotificationService } from './NotificationService';
import { TYPES } from '../container/types';
import { PerformanceAlert } from '../types/monitoring.types';

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  diskUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
  timestamp: Date;
}

export interface TaskMetrics {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  tasksPerHour: number;
  timestamp: Date;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  components: {
    [key: string]: {
      status: 'healthy' | 'unhealthy' | 'degraded';
      message?: string;
      lastCheck: Date;
      responseTime?: number;
    };
  };
  uptime: number;
  version: string;
}


@injectable()
export class MonitoringService {
  private redis: RedisClientType;
  private startTime: Date = new Date();
  private metricsInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private alerts: Map<string, PerformanceAlert> = new Map();
  
  // TODO: Re-enable when NotificationService DI is fixed
  // private notificationService?: NotificationService;

  // 性能閾值配置
  private readonly thresholds = {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    disk: { warning: 85, critical: 95 },
    taskFailureRate: { warning: 10, critical: 25 }, // 百分比
    queueSize: { warning: 1000, critical: 5000 }
  };

  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.RedisConfig) private redisConfig: any
  ) {
    this.initializeRedis();
  }

  /**
   * 初始化 Redis 連線
   */
  private initializeRedis = async (): Promise<void> => {
    try {
      this.redis = createClient({
        url: this.redisConfig.url,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true
        }
      });

      this.redis.on('error', (error) => {
        this.logger.error('Redis connection error', error);
      });

      this.redis.on('connect', () => {
        this.logger.info('Redis connected for monitoring');
      });

      await this.redis.connect();
    } catch (error) {
      this.logger.error('Failed to initialize Redis for monitoring', error);
    }
  }

  /**
   * 啟動監控服務
   */
  start = async (): Promise<void> => {
    try {
      // 每分鐘收集一次系統指標
      this.metricsInterval = setInterval(async () => {
        await this.collectSystemMetrics();
      }, 60 * 1000);

      // 每30秒進行一次健康檢查
      this.healthCheckInterval = setInterval(async () => {
        await this.performHealthCheck();
      }, 30 * 1000);

      // 立即執行一次
      await this.collectSystemMetrics();
      await this.performHealthCheck();

      this.logger.info('Monitoring service started');
    } catch (error) {
      this.logger.error('Failed to start monitoring service', error);
      throw error;
    }
  }

  /**
   * 停止監控服務
   */
  stop = async (): Promise<void> => {
    try {
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
        this.metricsInterval = null;
      }

      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      if (this.redis) {
        await this.redis.quit();
      }

      this.logger.info('Monitoring service stopped');
    } catch (error) {
      this.logger.error('Error stopping monitoring service', error);
    }
  }

  /**
   * 收集系統指標
   */
  collectSystemMetrics = async (): Promise<SystemMetrics> => {
    try {
      const metrics: SystemMetrics = {
        cpuUsage: await this.getCpuUsage(),
        memoryUsage: this.getMemoryUsage(),
        diskUsage: await this.getDiskUsage(),
        uptime: this.getUptime(),
        timestamp: new Date()
      };

      // 儲存到 Redis
      if (this.redis) {
        await this.redis.setEx(
          'scheduler:metrics:system',
          300, // 5分鐘過期
          JSON.stringify(metrics)
        );
      }

      // 檢查是否需要發出警報
      this.checkPerformanceAlerts(metrics);

      // 記錄性能指標
      this.logger.info('System metrics collected', {
        cpuUsage: `${metrics.cpuUsage}%`,
        memoryUsage: `${metrics.memoryUsage.percentage}%`,
        diskUsage: `${metrics.diskUsage.percentage}%`
      });

      return metrics;
    } catch (error) {
      this.logger.error('Failed to collect system metrics', error);
      throw error;
    }
  }

  /**
   * 收集任務指標
   */
  collectTaskMetrics = async (taskStats: {
    totalTasks: number;
    pendingTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageExecutionTime: number;
  }): Promise<TaskMetrics> => {
    try {
      const metrics: TaskMetrics = {
        ...taskStats,
        tasksPerHour: await this.calculateTasksPerHour(),
        timestamp: new Date()
      };

      // 儲存到 Redis
      if (this.redis) {
        await this.redis.setEx(
          'scheduler:metrics:tasks',
          300, // 5分鐘過期
          JSON.stringify(metrics)
        );

        // 記錄歷史數據
        await this.redis.lpush(
          'scheduler:metrics:tasks:history',
          JSON.stringify(metrics)
        );

        // 只保留最近24小時的數據 (每5分鐘一條，共288條)
        await this.redis.ltrim('scheduler:metrics:tasks:history', 0, 287);
      }

      // 檢查任務相關警報
      this.checkTaskAlerts(metrics);

      return metrics;
    } catch (error) {
      this.logger.error('Failed to collect task metrics', error);
      throw error;
    }
  };

  /**
   * 執行健康檢查
   */
  performHealthCheck = async (): Promise<ServiceHealth> => {
    const health: ServiceHealth = {
      status: 'healthy',
      components: {},
      uptime: this.getUptime(),
      version: process.env.npm_package_version || '1.0.0'
    };

    // 檢查資料庫連線
    health.components.database = await this.checkDatabaseHealth();

    // 檢查 RabbitMQ 連線
    health.components.rabbitmq = await this.checkRabbitMQHealth();

    // 檢查 Redis 連線
    health.components.redis = await this.checkRedisHealth();

    // 檢查磁碟空間
    health.components.disk = await this.checkDiskHealth();

    // 計算整體健康狀態
    const componentStatuses = Object.values(health.components).map(c => c.status);
    if (componentStatuses.includes('unhealthy')) {
      health.status = 'unhealthy';
    } else if (componentStatuses.includes('degraded')) {
      health.status = 'degraded';
    }

    // 儲存健康檢查結果
    if (this.redis) {
      await this.redis.setEx(
        'scheduler:health',
        60, // 1分鐘過期
        JSON.stringify(health)
      );
    }

    // 記錄健康狀態
    this.logger.health('scheduler-service', health.status, {
      components: Object.keys(health.components).reduce((acc, key) => {
        acc[key] = health.components[key].status;
        return acc;
      }, {} as Record<string, string>)
    });

    return health;
  }

  /**
   * 獲取系統指標
   */
  getSystemMetrics = async (): Promise<SystemMetrics | null> => {
    try {
      if (!this.redis) return null;

      const data = await this.redis.get('scheduler:metrics:system');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error('Failed to get system metrics', error);
      return null;
    }
  }

  /**
   * 獲取任務指標
   */
  getTaskMetrics = async (): Promise<TaskMetrics | null> => {
    try {
      if (!this.redis) return null;

      const data = await this.redis.get('scheduler:metrics:tasks');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error('Failed to get task metrics', error);
      return null;
    }
  }

  /**
   * 獲取健康狀態
   */
  getHealthStatus = async (): Promise<ServiceHealth | null> => {
    try {
      if (!this.redis) return null;

      const data = await this.redis.get('scheduler:health');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error('Failed to get health status', error);
      return null;
    }
  }

  /**
   * 獲取活動警報
   */
  getActiveAlerts = (): PerformanceAlert[] => {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * 解決警報
   */
  resolveAlert = (alertId: string): boolean => {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.logger.info('Alert resolved', { alertId, type: alert.type });
      
      // TODO: Re-enable when NotificationService DI is fixed
      // 發送警報解決通知
      // this.sendAlertResolvedNotification(alert);
      
      return true;
    }
    return false;
  }

  /**
   * 發送警報通知
   * 當新警報被創建時調用
   */
  // TODO: Re-enable when NotificationService DI is fixed
  private sendAlertNotification = async (alert: PerformanceAlert): Promise<void> => {
    // No-op implementation to prevent runtime errors
    this.logger.debug('通知服務已停用，跳過警報通知', { alertId: alert.id });
    return;
    /*
    try {
      if (!this.notificationService) {
        this.logger.debug('通知服務未配置，跳過警報通知', { alertId: alert.id });
        return;
      }

      await this.notificationService.sendAlertNotification(alert);
      
      this.logger.debug('警報通知已發送', {
        alertId: alert.id,
        type: alert.type,
        severity: alert.severity
      });
    } catch (error) {
      this.logger.error('發送警報通知失敗', {
        alertId: alert.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    */
  }

  /**
   * 發送警報解決通知
   * 當警報被標記為已解決時調用
   */
  // TODO: Re-enable when NotificationService DI is fixed
  private sendAlertResolvedNotification = async (alert: PerformanceAlert): Promise<void> => {
    // No-op implementation to prevent runtime errors
    this.logger.debug('通知服務已停用，跳過警報解決通知', { alertId: alert.id });
    return;
    /*
    try {
      if (!this.notificationService) {
        this.logger.debug('通知服務未配置，跳過警報解決通知', { alertId: alert.id });
        return;
      }

      // 創建一個特殊的 "resolved" 警報用於通知
      const resolvedAlert: PerformanceAlert = {
        ...alert,
        id: `${alert.id}_resolved`,
        message: `警報已解決: ${alert.message}`,
        severity: 'warning', // 解決通知使用較低嚴重程度
        timestamp: new Date(),
        resolved: true
      };

      await this.notificationService.sendAlertNotification(resolvedAlert);
      
      this.logger.debug('警報解決通知已發送', {
        originalAlertId: alert.id,
        resolvedAlertId: resolvedAlert.id
      });
    } catch (error) {
      this.logger.error('發送警報解決通知失敗', {
        alertId: alert.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    */
  }

  /**
   * 設定通知服務
   * 允許動態設定通知服務（用於測試或延遲初始化）
   */
  // TODO: Re-enable when NotificationService DI is fixed
  setNotificationService = (notificationService: any): void => {
    // No-op implementation to prevent runtime errors
    this.logger.info('通知服務已停用，無法設定通知服務');
    /*
    this.notificationService = notificationService;
    this.logger.info('通知服務已設定到監控服務');
    */
  }

  /**
   * 獲取通知統計
   * 委託給通知服務獲取統計資料
   */
  // TODO: Re-enable when NotificationService DI is fixed
  getNotificationStats = async () => {
    // No-op implementation to prevent runtime errors
    this.logger.debug('通知服務已停用，無法獲取通知統計');
    return null;
    /*
    if (!this.notificationService) {
      return null;
    }
    return await this.notificationService.getNotificationStats();
    */
  }

  /**
   * 手動測試通知
   * 用於測試通知系統是否正常工作
   */
  // TODO: Re-enable when NotificationService DI is fixed
  testNotification = async (channel: 'email' | 'webhook' = 'email'): Promise<boolean> => {
    // No-op implementation to prevent runtime errors
    this.logger.info('通知服務已停用，無法測試通知', { channel });
    return false;
    /*
    try {
      if (!this.notificationService) {
        this.logger.warn('無法測試通知：通知服務未配置');
        return false;
      }

      // 創建測試警報
      const testAlert: PerformanceAlert = {
        id: `test_${Date.now()}`,
        type: 'cpu',
        severity: 'warning',
        message: '這是一個測試通知，用於驗證通知系統是否正常運作',
        value: 75,
        threshold: 70,
        timestamp: new Date(),
        resolved: false
      };

      await this.notificationService.sendAlertNotification(testAlert);
      
      this.logger.info('測試通知已發送', {
        testAlertId: testAlert.id,
        channel: channel
      });

      return true;
    } catch (error) {
      this.logger.error('測試通知失敗', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
    */
  }

  // 私有方法實現...

  private getCpuUsage = async (): Promise<number> => {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const totalUsage = endUsage.user + endUsage.system;
        const usage = (totalUsage / 1000000) * 100; // 轉換為百分比
        resolve(Math.min(100, Math.max(0, usage)));
      }, 100);
    });
  }

  private getMemoryUsage(): SystemMetrics['memoryUsage'] {
    const used = process.memoryUsage().heapUsed;
    const total = process.memoryUsage().heapTotal;
    return {
      used,
      total,
      percentage: Math.round((used / total) * 100)
    };
  }

  private getDiskUsage = async (): Promise<SystemMetrics['diskUsage']> => {
    // 簡化實現，實際應該使用 fs.statSync 等
    return {
      used: 50 * 1024 * 1024 * 1024, // 50GB
      total: 100 * 1024 * 1024 * 1024, // 100GB
      percentage: 50
    };
  }

  private getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }

  private calculateTasksPerHour = async (): Promise<number> => {
    // 從 Redis 歷史數據計算每小時任務數
    return 0; // 簡化實現
  }

  private checkPerformanceAlerts(metrics: SystemMetrics): void {
    // CPU 警報
    if (metrics.cpuUsage > this.thresholds.cpu.critical) {
      this.createAlert('cpu', 'critical', 'CPU usage critical', metrics.cpuUsage, this.thresholds.cpu.critical);
    } else if (metrics.cpuUsage > this.thresholds.cpu.warning) {
      this.createAlert('cpu', 'warning', 'CPU usage warning', metrics.cpuUsage, this.thresholds.cpu.warning);
    }

    // 記憶體警報
    if (metrics.memoryUsage.percentage > this.thresholds.memory.critical) {
      this.createAlert('memory', 'critical', 'Memory usage critical', metrics.memoryUsage.percentage, this.thresholds.memory.critical);
    } else if (metrics.memoryUsage.percentage > this.thresholds.memory.warning) {
      this.createAlert('memory', 'warning', 'Memory usage warning', metrics.memoryUsage.percentage, this.thresholds.memory.warning);
    }
  }

  private checkTaskAlerts(metrics: TaskMetrics): void {
    const failureRate = metrics.totalTasks > 0 ? (metrics.failedTasks / metrics.totalTasks) * 100 : 0;
    
    if (failureRate > this.thresholds.taskFailureRate.critical) {
      this.createAlert('task_failure', 'critical', 'Task failure rate critical', failureRate, this.thresholds.taskFailureRate.critical);
    } else if (failureRate > this.thresholds.taskFailureRate.warning) {
      this.createAlert('task_failure', 'warning', 'Task failure rate warning', failureRate, this.thresholds.taskFailureRate.warning);
    }
  }

  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    value: number,
    threshold: number
  ): void {
    const alertId = `${type}_${severity}_${Date.now()}`;
    const alert: PerformanceAlert = {
      id: alertId,
      type,
      severity,
      message,
      value,
      threshold,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.set(alertId, alert);
    this.logger.warn('Performance alert created', alert);
    
    // TODO: Re-enable when NotificationService DI is fixed
    // 發送通知（如果通知服務可用）
    // this.sendAlertNotification(alert);
  }

  private checkDatabaseHealth = async (): Promise<ServiceHealth['components'][string]> => {
    const startTime = Date.now();
    try {
      // 實際實現應該測試資料庫連線
      const responseTime = Date.now() - startTime;
      return {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date()
      };
    }
  }

  private checkRabbitMQHealth = async (): Promise<ServiceHealth['components'][string]> => {
    const startTime = Date.now();
    try {
      // 實際實現應該測試 RabbitMQ 連線
      const responseTime = Date.now() - startTime;
      return {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date()
      };
    }
  }

  private checkRedisHealth = async (): Promise<ServiceHealth['components'][string]> => {
    const startTime = Date.now();
    try {
      if (this.redis) {
        await this.redis.ping();
      }
      const responseTime = Date.now() - startTime;
      return {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date()
      };
    }
  }

  private checkDiskHealth = async (): Promise<ServiceHealth['components'][string]> => {
    try {
      const diskUsage = await this.getDiskUsage();
      const status = diskUsage.percentage > 90 ? 'degraded' : 'healthy';
      
      return {
        status,
        message: `Disk usage: ${diskUsage.percentage}%`,
        lastCheck: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date()
      };
    }
  }
}