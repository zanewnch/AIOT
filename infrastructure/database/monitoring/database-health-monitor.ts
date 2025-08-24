/**
 * @fileoverview AIOT 資料庫健康監控器
 * 提供即時健康檢查、性能監控和自動警報功能
 */

import { Sequelize } from 'sequelize';
import { EventEmitter } from 'events';
import { cacheManager } from '../caching/redis-cache-manager';

export interface DatabaseHealth {
  serviceName: string;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'DOWN';
  checks: HealthCheck[];
  overall: {
    score: number;
    responseTime: number;
    uptime: number;
    lastCheckTime: Date;
  };
}

export interface HealthCheck {
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  value?: number;
  threshold?: number;
  responseTime: number;
  details?: any;
}

export interface MonitoringConfig {
  checkInterval: number;
  thresholds: {
    connectionTimeout: number;
    slowQueryThreshold: number;
    highConnectionCount: number;
    highCpuUsage: number;
    lowFreeSpace: number;
    maxReplicationLag: number;
  };
  notifications: {
    email?: string[];
    webhook?: string;
    slack?: string;
  };
}

/**
 * 資料庫健康監控器
 */
export class DatabaseHealthMonitor extends EventEmitter {
  private sequelizeInstances: Map<string, Sequelize> = new Map();
  private healthHistory: Map<string, DatabaseHealth[]> = new Map();
  private monitoringConfig: MonitoringConfig;
  private isMonitoring = false;
  private checkInterval?: NodeJS.Timeout;

  constructor(config: MonitoringConfig) {
    super();
    this.monitoringConfig = {
      checkInterval: 30000, // 30秒
      thresholds: {
        connectionTimeout: 5000,
        slowQueryThreshold: 1000,
        highConnectionCount: 80,
        highCpuUsage: 80,
        lowFreeSpace: 10,
        maxReplicationLag: 5000
      },
      notifications: {},
      ...config
    };
  }

  /**
   * 註冊資料庫實例
   */
  registerDatabase(serviceName: string, sequelize: Sequelize): void {
    this.sequelizeInstances.set(serviceName, sequelize);
    this.healthHistory.set(serviceName, []);
    
    console.log(`Registered database for service: ${serviceName}`);
  }

  /**
   * 開始監控
   */
  start(): void {
    if (this.isMonitoring) {
      console.warn('Health monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    console.log('Starting database health monitoring...');

    // 立即執行一次檢查
    this.performHealthChecks();

    // 設置定期檢查
    this.checkInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.monitoringConfig.checkInterval);

    this.emit('monitoring:started');
  }

  /**
   * 停止監控
   */
  stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }

    console.log('Database health monitoring stopped');
    this.emit('monitoring:stopped');
  }

  /**
   * 執行健康檢查
   */
  private async performHealthChecks(): Promise<void> {
    const checkPromises = Array.from(this.sequelizeInstances.entries()).map(
      async ([serviceName, sequelize]) => {
        try {
          const health = await this.checkDatabaseHealth(serviceName, sequelize);
          this.updateHealthHistory(serviceName, health);
          this.evaluateAlerts(health);
          return health;
        } catch (error) {
          console.error(`Health check failed for ${serviceName}:`, error);
          return this.createFailedHealthReport(serviceName, error as Error);
        }
      }
    );

    const healthReports = await Promise.all(checkPromises);
    this.emit('health:checked', healthReports);
  }

  /**
   * 檢查單個資料庫健康狀況
   */
  private async checkDatabaseHealth(
    serviceName: string, 
    sequelize: Sequelize
  ): Promise<DatabaseHealth> {
    const startTime = Date.now();
    const checks: HealthCheck[] = [];

    // 1. 連接性檢查
    checks.push(await this.checkConnection(sequelize));
    
    // 2. 查詢性能檢查
    checks.push(await this.checkQueryPerformance(sequelize));
    
    // 3. 連接池狀態檢查
    checks.push(await this.checkConnectionPool(sequelize));
    
    // 4. 系統資源檢查
    checks.push(await this.checkSystemResources(sequelize));
    
    // 5. 複製延遲檢查（如果適用）
    checks.push(await this.checkReplicationLag(sequelize));
    
    // 6. 鎖定檢查
    checks.push(await this.checkLocks(sequelize));
    
    // 7. 磁碟空間檢查
    checks.push(await this.checkDiskSpace(sequelize));

    // 計算總體健康分數
    const passCount = checks.filter(c => c.status === 'PASS').length;
    const warnCount = checks.filter(c => c.status === 'WARN').length;
    const failCount = checks.filter(c => c.status === 'FAIL').length;
    
    const score = Math.round(((passCount + warnCount * 0.5) / checks.length) * 100);
    
    let overallStatus: DatabaseHealth['status'];
    if (failCount > 0) {
      overallStatus = failCount >= checks.length / 2 ? 'CRITICAL' : 'WARNING';
    } else if (warnCount > 0) {
      overallStatus = 'WARNING';
    } else {
      overallStatus = 'HEALTHY';
    }

    const responseTime = Date.now() - startTime;

    return {
      serviceName,
      status: overallStatus,
      checks,
      overall: {
        score,
        responseTime,
        uptime: this.calculateUptime(serviceName),
        lastCheckTime: new Date()
      }
    };
  }

  /**
   * 連接性檢查
   */
  private async checkConnection(sequelize: Sequelize): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      await sequelize.authenticate();
      const responseTime = Date.now() - startTime;
      
      const status = responseTime > this.monitoringConfig.thresholds.connectionTimeout ? 'WARN' : 'PASS';
      
      return {
        name: 'Database Connection',
        status,
        message: status === 'PASS' ? 'Connection successful' : 'Connection slow',
        value: responseTime,
        threshold: this.monitoringConfig.thresholds.connectionTimeout,
        responseTime
      };
    } catch (error) {
      return {
        name: 'Database Connection',
        status: 'FAIL',
        message: `Connection failed: ${(error as Error).message}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * 查詢性能檢查
   */
  private async checkQueryPerformance(sequelize: Sequelize): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // 執行簡單的性能測試查詢
      await sequelize.query('SELECT 1 as test', { type: sequelize.QueryTypes.SELECT });
      const responseTime = Date.now() - startTime;
      
      const status = responseTime > this.monitoringConfig.thresholds.slowQueryThreshold ? 'WARN' : 'PASS';
      
      return {
        name: 'Query Performance',
        status,
        message: status === 'PASS' ? 'Query performance good' : 'Slow query detected',
        value: responseTime,
        threshold: this.monitoringConfig.thresholds.slowQueryThreshold,
        responseTime
      };
    } catch (error) {
      return {
        name: 'Query Performance',
        status: 'FAIL',
        message: `Query failed: ${(error as Error).message}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * 連接池狀態檢查
   */
  private async checkConnectionPool(sequelize: Sequelize): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // 獲取連接池統計
      const pool = (sequelize as any).connectionManager.pool;
      const totalConnections = pool.size || 0;
      const activeConnections = pool.borrowed || 0;
      const idleConnections = pool.available || 0;
      
      const utilization = totalConnections > 0 ? (activeConnections / totalConnections) * 100 : 0;
      
      let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
      let message = 'Connection pool healthy';
      
      if (utilization > this.monitoringConfig.thresholds.highConnectionCount) {
        status = 'WARN';
        message = 'High connection pool utilization';
      }
      
      if (utilization > 95) {
        status = 'FAIL';
        message = 'Connection pool nearly exhausted';
      }

      return {
        name: 'Connection Pool',
        status,
        message,
        value: utilization,
        threshold: this.monitoringConfig.thresholds.highConnectionCount,
        responseTime: Date.now() - startTime,
        details: {
          totalConnections,
          activeConnections,
          idleConnections,
          utilizationPercent: utilization
        }
      };
    } catch (error) {
      return {
        name: 'Connection Pool',
        status: 'FAIL',
        message: `Pool check failed: ${(error as Error).message}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * 系統資源檢查
   */
  private async checkSystemResources(sequelize: Sequelize): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // PostgreSQL 系統資源查詢
      const [stats] = await sequelize.query(`
        SELECT 
          current_setting('max_connections')::int as max_connections,
          count(*) as current_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `, { type: sequelize.QueryTypes.SELECT }) as any[];

      const connectionUtilization = (stats.current_connections / stats.max_connections) * 100;
      
      let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
      let message = 'System resources normal';
      
      if (connectionUtilization > this.monitoringConfig.thresholds.highConnectionCount) {
        status = 'WARN';
        message = 'High connection count';
      }
      
      if (connectionUtilization > 90) {
        status = 'FAIL';
        message = 'Critical connection count';
      }

      return {
        name: 'System Resources',
        status,
        message,
        value: connectionUtilization,
        threshold: this.monitoringConfig.thresholds.highConnectionCount,
        responseTime: Date.now() - startTime,
        details: stats
      };
    } catch (error) {
      return {
        name: 'System Resources',
        status: 'FAIL',
        message: `Resource check failed: ${(error as Error).message}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * 複製延遲檢查
   */
  private async checkReplicationLag(sequelize: Sequelize): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // 檢查是否為主服務器
      const [replicationStatus] = await sequelize.query(`
        SELECT pg_is_in_recovery() as is_replica
      `, { type: sequelize.QueryTypes.SELECT }) as any[];

      if (!replicationStatus.is_replica) {
        return {
          name: 'Replication Lag',
          status: 'PASS',
          message: 'Primary server - no replication lag',
          responseTime: Date.now() - startTime
        };
      }

      // 複製延遲檢查（簡化版本）
      const [lagStats] = await sequelize.query(`
        SELECT COALESCE(
          EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())), 0
        ) * 1000 as lag_ms
      `, { type: sequelize.QueryTypes.SELECT }) as any[];

      const lagMs = lagStats.lag_ms;
      
      let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
      let message = 'Replication lag normal';
      
      if (lagMs > this.monitoringConfig.thresholds.maxReplicationLag) {
        status = 'WARN';
        message = 'High replication lag';
      }
      
      if (lagMs > this.monitoringConfig.thresholds.maxReplicationLag * 2) {
        status = 'FAIL';
        message = 'Critical replication lag';
      }

      return {
        name: 'Replication Lag',
        status,
        message,
        value: lagMs,
        threshold: this.monitoringConfig.thresholds.maxReplicationLag,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        name: 'Replication Lag',
        status: 'FAIL',
        message: `Replication check failed: ${(error as Error).message}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * 鎖定檢查
   */
  private async checkLocks(sequelize: Sequelize): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const [lockStats] = await sequelize.query(`
        SELECT 
          count(*) as total_locks,
          count(*) FILTER (WHERE NOT granted) as blocked_locks,
          count(DISTINCT pid) as processes_with_locks
        FROM pg_locks
      `, { type: sequelize.QueryTypes.SELECT }) as any[];

      const blockedLocks = lockStats.blocked_locks;
      
      let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
      let message = 'No problematic locks';
      
      if (blockedLocks > 0) {
        status = blockedLocks > 5 ? 'FAIL' : 'WARN';
        message = `${blockedLocks} blocked lock(s) detected`;
      }

      return {
        name: 'Database Locks',
        status,
        message,
        value: blockedLocks,
        responseTime: Date.now() - startTime,
        details: lockStats
      };
    } catch (error) {
      return {
        name: 'Database Locks',
        status: 'FAIL',
        message: `Lock check failed: ${(error as Error).message}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * 磁碟空間檢查
   */
  private async checkDiskSpace(sequelize: Sequelize): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // 簡化的磁碟空間檢查
      const [spaceStats] = await sequelize.query(`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          pg_database_size(current_database()) as size_bytes
      `, { type: sequelize.QueryTypes.SELECT }) as any[];

      return {
        name: 'Disk Space',
        status: 'PASS',
        message: 'Disk space check completed',
        responseTime: Date.now() - startTime,
        details: spaceStats
      };
    } catch (error) {
      return {
        name: 'Disk Space',
        status: 'FAIL',
        message: `Disk space check failed: ${(error as Error).message}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * 更新健康歷史記錄
   */
  private updateHealthHistory(serviceName: string, health: DatabaseHealth): void {
    const history = this.healthHistory.get(serviceName) || [];
    history.push(health);
    
    // 只保留最近100次檢查記錄
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.healthHistory.set(serviceName, history);
  }

  /**
   * 評估警報條件
   */
  private evaluateAlerts(health: DatabaseHealth): void {
    const criticalChecks = health.checks.filter(check => check.status === 'FAIL');
    const warningChecks = health.checks.filter(check => check.status === 'WARN');

    if (criticalChecks.length > 0) {
      this.emit('alert:critical', {
        serviceName: health.serviceName,
        checks: criticalChecks,
        timestamp: new Date()
      });
    }

    if (warningChecks.length > 0) {
      this.emit('alert:warning', {
        serviceName: health.serviceName,
        checks: warningChecks,
        timestamp: new Date()
      });
    }

    // 檢查服務恢復
    const previousHealth = this.getPreviousHealth(health.serviceName);
    if (previousHealth && previousHealth.status !== 'HEALTHY' && health.status === 'HEALTHY') {
      this.emit('alert:recovery', {
        serviceName: health.serviceName,
        previousStatus: previousHealth.status,
        currentHealth: health,
        timestamp: new Date()
      });
    }
  }

  /**
   * 創建失敗的健康報告
   */
  private createFailedHealthReport(serviceName: string, error: Error): DatabaseHealth {
    return {
      serviceName,
      status: 'DOWN',
      checks: [{
        name: 'Health Check',
        status: 'FAIL',
        message: `Health check failed: ${error.message}`,
        responseTime: 0
      }],
      overall: {
        score: 0,
        responseTime: 0,
        uptime: this.calculateUptime(serviceName),
        lastCheckTime: new Date()
      }
    };
  }

  /**
   * 計算服務運行時間
   */
  private calculateUptime(serviceName: string): number {
    const history = this.healthHistory.get(serviceName) || [];
    if (history.length === 0) return 0;

    const totalChecks = history.length;
    const successfulChecks = history.filter(h => h.status === 'HEALTHY').length;
    
    return totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;
  }

  /**
   * 獲取上一次健康檢查結果
   */
  private getPreviousHealth(serviceName: string): DatabaseHealth | null {
    const history = this.healthHistory.get(serviceName) || [];
    return history.length > 1 ? history[history.length - 2] : null;
  }

  /**
   * 獲取所有服務的健康狀況
   */
  getAllHealthStatus(): Map<string, DatabaseHealth> {
    const currentStatus = new Map<string, DatabaseHealth>();
    
    for (const [serviceName, history] of this.healthHistory) {
      const latestHealth = history[history.length - 1];
      if (latestHealth) {
        currentStatus.set(serviceName, latestHealth);
      }
    }
    
    return currentStatus;
  }

  /**
   * 獲取服務健康歷史
   */
  getHealthHistory(serviceName: string, limit: number = 50): DatabaseHealth[] {
    const history = this.healthHistory.get(serviceName) || [];
    return history.slice(-limit);
  }

  /**
   * 生成健康報告
   */
  generateHealthReport(): {
    summary: {
      totalServices: number;
      healthyServices: number;
      warningServices: number;
      criticalServices: number;
      downServices: number;
    };
    services: DatabaseHealth[];
  } {
    const allHealth = Array.from(this.getAllHealthStatus().values());
    
    return {
      summary: {
        totalServices: allHealth.length,
        healthyServices: allHealth.filter(h => h.status === 'HEALTHY').length,
        warningServices: allHealth.filter(h => h.status === 'WARNING').length,
        criticalServices: allHealth.filter(h => h.status === 'CRITICAL').length,
        downServices: allHealth.filter(h => h.status === 'DOWN').length
      },
      services: allHealth
    };
  }

  /**
   * 關閉監控器
   */
  async shutdown(): Promise<void> {
    this.stop();
    
    // 清理資源
    this.sequelizeInstances.clear();
    this.healthHistory.clear();
    
    console.log('Database health monitor shutdown complete');
  }
}

// 單例實例
export const databaseHealthMonitor = new DatabaseHealthMonitor({
  checkInterval: 30000,
  thresholds: {
    connectionTimeout: 5000,
    slowQueryThreshold: 1000,
    highConnectionCount: 80,
    highCpuUsage: 80,
    lowFreeSpace: 10,
    maxReplicationLag: 5000
  },
  notifications: {
    // 配置通知設定
  }
});