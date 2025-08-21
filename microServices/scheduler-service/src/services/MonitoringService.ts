/**
 * @fileoverview 監控服務類別
 * 
 * 提供系統監控、健康檢查和性能指標收集功能
 */

import { injectable, inject } from 'inversify';
import { Logger } from 'winston';
import { createClient, RedisClientType } from 'redis';

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

export interface PerformanceAlert {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'task_failure' | 'queue_size';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
}

@injectable()
export class MonitoringService {
  private redis: RedisClientType;
  private startTime: Date = new Date();
  private metricsInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private alerts: Map<string, PerformanceAlert> = new Map();

  // 性能閾值配置
  private readonly thresholds = {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    disk: { warning: 85, critical: 95 },
    taskFailureRate: { warning: 10, critical: 25 }, // 百分比
    queueSize: { warning: 1000, critical: 5000 }
  };

  constructor(
    @inject('Logger') private logger: Logger,
    @inject('RedisConfig') private redisConfig: any
  ) {
    this.initializeRedis();
  }

  /**
   * 初始化 Redis 連線
   */
  private async initializeRedis(): Promise<void> {
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
  async start(): Promise<void> {
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
  async stop(): Promise<void> {
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
  async collectSystemMetrics(): Promise<SystemMetrics> {
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
        await this.redis.setex(
          'scheduler:metrics:system',
          300, // 5分鐘過期
          JSON.stringify(metrics)
        );
      }

      // 檢查是否需要發出警報
      this.checkPerformanceAlerts(metrics);

      // 記錄性能指標
      this.logger.performance('cpu_usage', metrics.cpuUsage, '%');
      this.logger.performance('memory_usage', metrics.memoryUsage.percentage, '%');
      this.logger.performance('disk_usage', metrics.diskUsage.percentage, '%');

      return metrics;
    } catch (error) {
      this.logger.error('Failed to collect system metrics', error);
      throw error;
    }
  }

  /**
   * 收集任務指標
   */
  async collectTaskMetrics(taskStats: {
    totalTasks: number;
    pendingTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageExecutionTime: number;
  }): Promise<TaskMetrics> {
    try {
      const metrics: TaskMetrics = {
        ...taskStats,
        tasksPerHour: await this.calculateTasksPerHour(),
        timestamp: new Date()
      };

      // 儲存到 Redis
      if (this.redis) {
        await this.redis.setex(
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
  }

  /**
   * 執行健康檢查
   */
  async performHealthCheck(): Promise<ServiceHealth> {
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
      await this.redis.setex(
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
  async getSystemMetrics(): Promise<SystemMetrics | null> {
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
  async getTaskMetrics(): Promise<TaskMetrics | null> {
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
  async getHealthStatus(): Promise<ServiceHealth | null> {
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
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * 解決警報
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.logger.info('Alert resolved', { alertId, type: alert.type });
      return true;
    }
    return false;
  }

  // 私有方法實現...

  private async getCpuUsage(): Promise<number> {
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

  private async getDiskUsage(): Promise<SystemMetrics['diskUsage']> {
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

  private async calculateTasksPerHour(): Promise<number> {
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
  }

  private async checkDatabaseHealth(): Promise<ServiceHealth['components'][string]> {
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

  private async checkRabbitMQHealth(): Promise<ServiceHealth['components'][string]> {
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

  private async checkRedisHealth(): Promise<ServiceHealth['components'][string]> {
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

  private async checkDiskHealth(): Promise<ServiceHealth['components'][string]> {
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