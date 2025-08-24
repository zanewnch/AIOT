/**
 * @fileoverview AIOT 資料庫監控儀表板
 * 提供統一的監控介面、實時數據展示和警報管理
 */

import { EventEmitter } from 'events';
import { databaseHealthMonitor, DatabaseHealth } from './database-health-monitor';
import { databasePerformanceAnalyzer, PerformanceMetrics, PerformanceAlert } from './performance-analyzer';
import { cacheManager } from '../caching/redis-cache-manager';

export interface DashboardConfig {
  updateInterval: number;
  retentionPeriod: number;
  alertThresholds: {
    responseTime: number;
    connectionUtilization: number;
    cacheHitRate: number;
    errorRate: number;
  };
  notifications: {
    enabled: boolean;
    channels: ('console' | 'webhook' | 'email')[];
    webhook?: string;
    email?: string[];
  };
}

export interface DashboardSnapshot {
  timestamp: Date;
  services: {
    [serviceName: string]: {
      health: DatabaseHealth;
      performance: PerformanceMetrics;
      alerts: PerformanceAlert[];
      trends: {
        responseTime: number[];
        throughput: number[];
        errorRate: number[];
      };
    };
  };
  systemOverview: {
    totalServices: number;
    healthyServices: number;
    warnings: number;
    criticalIssues: number;
    totalQueries: number;
    avgResponseTime: number;
    cacheHitRate: number;
  };
}

export interface MonitoringReport {
  reportId: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    serviceStatus: Record<string, 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'DOWN'>;
    keyMetrics: {
      averageResponseTime: number;
      totalQueries: number;
      errorRate: number;
      uptime: number;
    };
    alertsSummary: {
      total: number;
      critical: number;
      warnings: number;
      resolved: number;
    };
  };
  recommendations: string[];
  detailedMetrics: any[];
}

/**
 * 監控儀表板管理器
 */
export class MonitoringDashboard extends EventEmitter {
  private config: DashboardConfig;
  private currentSnapshot?: DashboardSnapshot;
  private snapshotHistory: DashboardSnapshot[] = [];
  private updateTimer?: NodeJS.Timeout;
  private isActive = false;

  constructor(config?: Partial<DashboardConfig>) {
    super();
    
    this.config = {
      updateInterval: 30000, // 30秒
      retentionPeriod: 24 * 60 * 60 * 1000, // 24小時
      alertThresholds: {
        responseTime: 1000,
        connectionUtilization: 80,
        cacheHitRate: 70,
        errorRate: 5
      },
      notifications: {
        enabled: true,
        channels: ['console'],
        webhook: undefined,
        email: []
      },
      ...config
    };

    this.setupEventHandlers();
  }

  /**
   * 啟動監控儀表板
   */
  async start(): Promise<void> {
    if (this.isActive) {
      console.warn('Monitoring dashboard is already active');
      return;
    }

    console.log('Starting monitoring dashboard...');
    
    this.isActive = true;

    // 確保監控器已啟動
    if (!databaseHealthMonitor.listenerCount('health:checked')) {
      databaseHealthMonitor.start();
    }
    
    if (!databasePerformanceAnalyzer.listenerCount('analysis:completed')) {
      databasePerformanceAnalyzer.start();
    }

    // 立即創建快照
    await this.updateSnapshot();

    // 設置定期更新
    this.updateTimer = setInterval(async () => {
      await this.updateSnapshot();
    }, this.config.updateInterval);

    // 開始清理任務
    this.startCleanupTask();

    this.emit('dashboard:started');
    console.log('Monitoring dashboard started successfully');
  }

  /**
   * 停止監控儀表板
   */
  stop(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }

    console.log('Monitoring dashboard stopped');
    this.emit('dashboard:stopped');
  }

  /**
   * 更新快照
   */
  private async updateSnapshot(): Promise<void> {
    try {
      const timestamp = new Date();
      const services: DashboardSnapshot['services'] = {};

      // 獲取所有服務的健康狀況
      const healthStatuses = databaseHealthMonitor.getAllHealthStatus();
      const performanceStatuses = databasePerformanceAnalyzer.getCurrentPerformanceStatus();
      const activeAlerts = databasePerformanceAnalyzer.getActiveAlerts();

      // 為每個服務組合數據
      const allServices = new Set([
        ...Array.from(healthStatuses.keys()),
        ...Array.from(performanceStatuses.keys())
      ]);

      for (const serviceName of allServices) {
        const health = healthStatuses.get(serviceName);
        const performance = performanceStatuses.get(serviceName);
        const serviceAlerts = activeAlerts.filter(alert => alert.serviceName === serviceName);

        if (health || performance) {
          services[serviceName] = {
            health: health || this.createDefaultHealth(serviceName),
            performance: performance || this.createDefaultPerformance(serviceName),
            alerts: serviceAlerts,
            trends: this.calculateServiceTrends(serviceName)
          };
        }
      }

      // 計算系統概覽
      const systemOverview = this.calculateSystemOverview(services);

      const snapshot: DashboardSnapshot = {
        timestamp,
        services,
        systemOverview
      };

      this.currentSnapshot = snapshot;
      this.snapshotHistory.push(snapshot);

      // 清理舊快照
      this.cleanupOldSnapshots();

      this.emit('snapshot:updated', snapshot);

      // 檢查警報條件
      await this.checkGlobalAlertConditions(snapshot);

    } catch (error) {
      console.error('Failed to update dashboard snapshot:', error);
      this.emit('snapshot:error', error);
    }
  }

  /**
   * 計算服務趨勢
   */
  private calculateServiceTrends(serviceName: string): {
    responseTime: number[];
    throughput: number[];
    errorRate: number[];
  } {
    const history = databasePerformanceAnalyzer.getMetricsHistory(serviceName, 1);
    
    return {
      responseTime: history.map(h => h.queryMetrics.averageResponseTime),
      throughput: history.map(h => h.queryMetrics.queriesPerSecond),
      errorRate: history.map(h => {
        const total = h.queryMetrics.totalQueries;
        const failed = h.queryMetrics.failedQueries;
        return total > 0 ? (failed / total) * 100 : 0;
      })
    };
  }

  /**
   * 計算系統概覽
   */
  private calculateSystemOverview(services: DashboardSnapshot['services']): DashboardSnapshot['systemOverview'] {
    const serviceArray = Object.values(services);
    
    const totalServices = serviceArray.length;
    const healthyServices = serviceArray.filter(s => s.health.status === 'HEALTHY').length;
    const warnings = serviceArray.filter(s => s.health.status === 'WARNING').length;
    const criticalIssues = serviceArray.filter(s => 
      s.health.status === 'CRITICAL' || s.health.status === 'DOWN'
    ).length;

    const totalQueries = serviceArray.reduce((sum, s) => 
      sum + s.performance.queryMetrics.totalQueries, 0
    );
    
    const avgResponseTime = serviceArray.length > 0 
      ? serviceArray.reduce((sum, s) => 
          sum + s.performance.queryMetrics.averageResponseTime, 0
        ) / serviceArray.length
      : 0;

    const cacheHitRate = serviceArray.length > 0
      ? serviceArray.reduce((sum, s) => 
          sum + s.performance.cacheMetrics.hitRate, 0
        ) / serviceArray.length
      : 0;

    return {
      totalServices,
      healthyServices,
      warnings,
      criticalIssues,
      totalQueries,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100
    };
  }

  /**
   * 檢查全域警報條件
   */
  private async checkGlobalAlertConditions(snapshot: DashboardSnapshot): Promise<void> {
    const { systemOverview } = snapshot;

    // 檢查系統級警報
    if (systemOverview.avgResponseTime > this.config.alertThresholds.responseTime) {
      this.emit('global:alert', {
        type: 'HIGH_SYSTEM_RESPONSE_TIME',
        severity: 'WARNING',
        message: `System average response time is ${systemOverview.avgResponseTime}ms`,
        value: systemOverview.avgResponseTime,
        threshold: this.config.alertThresholds.responseTime
      });
    }

    if (systemOverview.cacheHitRate < this.config.alertThresholds.cacheHitRate) {
      this.emit('global:alert', {
        type: 'LOW_SYSTEM_CACHE_HIT_RATE',
        severity: 'WARNING',
        message: `System cache hit rate is ${systemOverview.cacheHitRate}%`,
        value: systemOverview.cacheHitRate,
        threshold: this.config.alertThresholds.cacheHitRate
      });
    }

    if (systemOverview.criticalIssues > 0) {
      this.emit('global:alert', {
        type: 'CRITICAL_SERVICES',
        severity: 'CRITICAL',
        message: `${systemOverview.criticalIssues} service(s) in critical state`,
        value: systemOverview.criticalIssues
      });
    }
  }

  /**
   * 獲取當前快照
   */
  getCurrentSnapshot(): DashboardSnapshot | undefined {
    return this.currentSnapshot;
  }

  /**
   * 獲取快照歷史
   */
  getSnapshotHistory(limit?: number): DashboardSnapshot[] {
    return limit ? this.snapshotHistory.slice(-limit) : this.snapshotHistory;
  }

  /**
   * 生成監控報告
   */
  async generateReport(periodHours: number = 24): Promise<MonitoringReport> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - periodHours * 60 * 60 * 1000);
    
    // 過濾指定期間的快照
    const periodSnapshots = this.snapshotHistory.filter(
      snapshot => snapshot.timestamp >= startTime && snapshot.timestamp <= endTime
    );

    if (periodSnapshots.length === 0) {
      throw new Error('No data available for the specified period');
    }

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 計算服務狀態
    const serviceStatus: Record<string, 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'DOWN'> = {};
    const latestSnapshot = periodSnapshots[periodSnapshots.length - 1];
    
    for (const [serviceName, serviceData] of Object.entries(latestSnapshot.services)) {
      serviceStatus[serviceName] = serviceData.health.status;
    }

    // 計算關鍵指標
    const keyMetrics = {
      averageResponseTime: this.calculatePeriodAverage(
        periodSnapshots, 
        s => s.systemOverview.avgResponseTime
      ),
      totalQueries: this.calculatePeriodSum(
        periodSnapshots,
        s => s.systemOverview.totalQueries
      ),
      errorRate: 0, // 需要實現
      uptime: this.calculatePeriodUptime(periodSnapshots)
    };

    // 收集警報統計
    const allAlerts = databasePerformanceAnalyzer.getActiveAlerts();
    const periodAlerts = allAlerts.filter(
      alert => alert.timestamp >= startTime && alert.timestamp <= endTime
    );

    const alertsSummary = {
      total: periodAlerts.length,
      critical: periodAlerts.filter(a => a.severity === 'CRITICAL').length,
      warnings: periodAlerts.filter(a => a.severity === 'WARNING').length,
      resolved: periodAlerts.filter(a => a.resolved).length
    };

    // 生成建議
    const recommendations = this.generateReportRecommendations(latestSnapshot, keyMetrics);

    return {
      reportId,
      generatedAt: new Date(),
      period: { start: startTime, end: endTime },
      summary: {
        serviceStatus,
        keyMetrics,
        alertsSummary
      },
      recommendations,
      detailedMetrics: periodSnapshots
    };
  }

  /**
   * 生成報告建議
   */
  private generateReportRecommendations(
    snapshot: DashboardSnapshot, 
    metrics: any
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.averageResponseTime > 1000) {
      recommendations.push(
        `Consider optimizing database queries to reduce average response time from ${metrics.averageResponseTime}ms`
      );
    }

    if (snapshot.systemOverview.cacheHitRate < 80) {
      recommendations.push(
        `Improve cache strategy to increase hit rate from ${snapshot.systemOverview.cacheHitRate}%`
      );
    }

    const criticalServices = Object.values(snapshot.services).filter(
      s => s.health.status === 'CRITICAL' || s.health.status === 'DOWN'
    );

    if (criticalServices.length > 0) {
      recommendations.push(
        `Address critical issues in ${criticalServices.length} service(s)`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('System performance is within acceptable ranges');
    }

    return recommendations;
  }

  /**
   * 計算期間平均值
   */
  private calculatePeriodAverage(
    snapshots: DashboardSnapshot[], 
    extractor: (snapshot: DashboardSnapshot) => number
  ): number {
    if (snapshots.length === 0) return 0;
    
    const sum = snapshots.reduce((total, snapshot) => total + extractor(snapshot), 0);
    return Math.round((sum / snapshots.length) * 100) / 100;
  }

  /**
   * 計算期間總和
   */
  private calculatePeriodSum(
    snapshots: DashboardSnapshot[],
    extractor: (snapshot: DashboardSnapshot) => number
  ): number {
    return snapshots.reduce((total, snapshot) => total + extractor(snapshot), 0);
  }

  /**
   * 計算期間可用性
   */
  private calculatePeriodUptime(snapshots: DashboardSnapshot[]): number {
    if (snapshots.length === 0) return 0;

    const totalSnapshots = snapshots.length;
    const healthySnapshots = snapshots.filter(s => s.systemOverview.criticalIssues === 0).length;
    
    return Math.round((healthySnapshots / totalSnapshots) * 100 * 100) / 100;
  }

  /**
   * 清理舊快照
   */
  private cleanupOldSnapshots(): void {
    const cutoffTime = new Date(Date.now() - this.config.retentionPeriod);
    this.snapshotHistory = this.snapshotHistory.filter(
      snapshot => snapshot.timestamp >= cutoffTime
    );
  }

  /**
   * 啟動清理任務
   */
  private startCleanupTask(): void {
    // 每小時清理一次
    setInterval(() => {
      this.cleanupOldSnapshots();
    }, 60 * 60 * 1000);
  }

  /**
   * 設置事件處理器
   */
  private setupEventHandlers(): void {
    // 監聽健康監控事件
    databaseHealthMonitor.on('alert:critical', (alert) => {
      if (this.config.notifications.enabled) {
        this.sendNotification('CRITICAL', `Health Alert: ${alert.serviceName}`, alert);
      }
    });

    // 監聽性能分析事件
    databasePerformanceAnalyzer.on('alert', (alert) => {
      if (this.config.notifications.enabled && alert.severity !== 'INFO') {
        this.sendNotification(alert.severity, `Performance Alert: ${alert.serviceName}`, alert);
      }
    });

    // 監聽全域警報
    this.on('global:alert', (alert) => {
      if (this.config.notifications.enabled) {
        this.sendNotification(alert.severity, `System Alert: ${alert.type}`, alert);
      }
    });
  }

  /**
   * 發送通知
   */
  private async sendNotification(severity: string, title: string, details: any): Promise<void> {
    const message = `[${severity}] ${title}\n${JSON.stringify(details, null, 2)}`;

    for (const channel of this.config.notifications.channels) {
      try {
        switch (channel) {
          case 'console':
            console.warn(message);
            break;
            
          case 'webhook':
            if (this.config.notifications.webhook) {
              await this.sendWebhookNotification(this.config.notifications.webhook, {
                severity,
                title,
                details,
                timestamp: new Date()
              });
            }
            break;
            
          case 'email':
            if (this.config.notifications.email && this.config.notifications.email.length > 0) {
              // 實現郵件通知
              console.log(`Email notification would be sent to: ${this.config.notifications.email.join(', ')}`);
            }
            break;
        }
      } catch (error) {
        console.error(`Failed to send notification via ${channel}:`, error);
      }
    }
  }

  /**
   * 發送 Webhook 通知
   */
  private async sendWebhookNotification(url: string, payload: any): Promise<void> {
    try {
      const fetch = (await import('node-fetch')).default;
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  /**
   * 創建預設健康狀況
   */
  private createDefaultHealth(serviceName: string): DatabaseHealth {
    return {
      serviceName,
      status: 'DOWN',
      checks: [],
      overall: {
        score: 0,
        responseTime: 0,
        uptime: 0,
        lastCheckTime: new Date()
      }
    };
  }

  /**
   * 創建預設性能指標
   */
  private createDefaultPerformance(serviceName: string): PerformanceMetrics {
    return {
      timestamp: new Date(),
      serviceName,
      queryMetrics: {
        totalQueries: 0,
        averageResponseTime: 0,
        slowQueries: 0,
        failedQueries: 0,
        queriesPerSecond: 0,
        p50ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0
      },
      connectionMetrics: {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        connectionUtilization: 0,
        maxConnections: 0
      },
      resourceMetrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskIOPS: 0,
        networkBandwidth: 0
      },
      cacheMetrics: {
        hitRate: 0,
        missRate: 0,
        evictionRate: 0
      }
    };
  }

  /**
   * 關閉儀表板
   */
  async shutdown(): Promise<void> {
    this.stop();
    
    // 清理資源
    this.snapshotHistory = [];
    this.currentSnapshot = undefined;
    
    console.log('Monitoring dashboard shutdown complete');
  }
}

// 單例實例
export const monitoringDashboard = new MonitoringDashboard();