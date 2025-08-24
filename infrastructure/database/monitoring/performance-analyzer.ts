/**
 * @fileoverview AIOT 資料庫性能分析器
 * 提供深度性能分析、趨勢預測和自動調優建議
 */

import { Sequelize } from 'sequelize';
import { EventEmitter } from 'events';

export interface PerformanceMetrics {
  timestamp: Date;
  serviceName: string;
  queryMetrics: {
    totalQueries: number;
    averageResponseTime: number;
    slowQueries: number;
    failedQueries: number;
    queriesPerSecond: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  connectionMetrics: {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    connectionUtilization: number;
    maxConnections: number;
  };
  resourceMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskIOPS: number;
    networkBandwidth: number;
  };
  cacheMetrics: {
    hitRate: number;
    missRate: number;
    evictionRate: number;
  };
}

export interface PerformanceTrend {
  metric: string;
  direction: 'IMPROVING' | 'DEGRADING' | 'STABLE';
  changePercent: number;
  confidence: number;
  timespan: string;
  predictions: {
    nextHour: number;
    nextDay: number;
    nextWeek: number;
  };
}

export interface OptimizationRecommendation {
  category: 'QUERY' | 'INDEX' | 'CONFIGURATION' | 'HARDWARE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedImprovement: string;
  actionItems: string[];
  sqlCommands?: string[];
  configChanges?: Record<string, any>;
}

export interface PerformanceAlert {
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  type: string;
  serviceName: string;
  message: string;
  details: any;
  threshold?: number;
  currentValue?: number;
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
}

/**
 * 資料庫性能分析器
 */
export class DatabasePerformanceAnalyzer extends EventEmitter {
  private sequelizeInstances: Map<string, Sequelize> = new Map();
  private metricsHistory: Map<string, PerformanceMetrics[]> = new Map();
  private activeAlerts: Map<string, PerformanceAlert> = new Map();
  private analysisInterval?: NodeJS.Timeout;
  private isAnalyzing = false;

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * 註冊資料庫實例
   */
  registerDatabase(serviceName: string, sequelize: Sequelize): void {
    this.sequelizeInstances.set(serviceName, sequelize);
    this.metricsHistory.set(serviceName, []);
    
    console.log(`Registered performance analyzer for service: ${serviceName}`);
  }

  /**
   * 開始性能分析
   */
  start(intervalMs: number = 60000): void {
    if (this.isAnalyzing) {
      console.warn('Performance analyzer is already running');
      return;
    }

    this.isAnalyzing = true;
    console.log('Starting database performance analysis...');

    // 立即執行一次分析
    this.performAnalysis();

    // 設置定期分析
    this.analysisInterval = setInterval(() => {
      this.performAnalysis();
    }, intervalMs);

    this.emit('analyzer:started');
  }

  /**
   * 停止性能分析
   */
  stop(): void {
    if (!this.isAnalyzing) {
      return;
    }

    this.isAnalyzing = false;
    
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = undefined;
    }

    console.log('Database performance analysis stopped');
    this.emit('analyzer:stopped');
  }

  /**
   * 執行性能分析
   */
  private async performAnalysis(): Promise<void> {
    const analysisPromises = Array.from(this.sequelizeInstances.entries()).map(
      async ([serviceName, sequelize]) => {
        try {
          const metrics = await this.collectMetrics(serviceName, sequelize);
          this.updateMetricsHistory(serviceName, metrics);
          
          // 分析趨勢
          const trends = await this.analyzeTrends(serviceName);
          
          // 生成優化建議
          const recommendations = await this.generateOptimizationRecommendations(serviceName, metrics);
          
          // 檢查警報條件
          await this.checkAlertConditions(serviceName, metrics);
          
          return {
            serviceName,
            metrics,
            trends,
            recommendations
          };
        } catch (error) {
          console.error(`Performance analysis failed for ${serviceName}:`, error);
          return null;
        }
      }
    );

    const analysisResults = await Promise.all(analysisPromises);
    const validResults = analysisResults.filter(result => result !== null);
    
    this.emit('analysis:completed', validResults);
  }

  /**
   * 收集性能指標
   */
  private async collectMetrics(serviceName: string, sequelize: Sequelize): Promise<PerformanceMetrics> {
    const timestamp = new Date();

    // 1. 查詢性能指標
    const queryMetrics = await this.collectQueryMetrics(sequelize);
    
    // 2. 連接指標
    const connectionMetrics = await this.collectConnectionMetrics(sequelize);
    
    // 3. 資源指標
    const resourceMetrics = await this.collectResourceMetrics(sequelize);
    
    // 4. 快取指標
    const cacheMetrics = await this.collectCacheMetrics(serviceName);

    return {
      timestamp,
      serviceName,
      queryMetrics,
      connectionMetrics,
      resourceMetrics,
      cacheMetrics
    };
  }

  /**
   * 收集查詢性能指標
   */
  private async collectQueryMetrics(sequelize: Sequelize): Promise<PerformanceMetrics['queryMetrics']> {
    try {
      // 使用 pg_stat_statements 如果可用
      const queryStatsQuery = `
        SELECT 
          calls as total_queries,
          ROUND(mean_exec_time::numeric, 2) as avg_response_time,
          SUM(CASE WHEN mean_exec_time > 1000 THEN calls ELSE 0 END) as slow_queries,
          SUM(CASE WHEN calls = 0 THEN 1 ELSE 0 END) as failed_queries,
          ROUND((calls / EXTRACT(EPOCH FROM (current_timestamp - stats_reset)))::numeric, 2) as queries_per_second,
          ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY mean_exec_time)::numeric, 2) as p50,
          ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY mean_exec_time)::numeric, 2) as p95,
          ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY mean_exec_time)::numeric, 2) as p99
        FROM pg_stat_statements
        WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
      `;

      const [stats] = await sequelize.query(queryStatsQuery, { 
        type: sequelize.QueryTypes.SELECT 
      }) as any[];

      if (stats) {
        return {
          totalQueries: stats.total_queries || 0,
          averageResponseTime: stats.avg_response_time || 0,
          slowQueries: stats.slow_queries || 0,
          failedQueries: stats.failed_queries || 0,
          queriesPerSecond: stats.queries_per_second || 0,
          p50ResponseTime: stats.p50 || 0,
          p95ResponseTime: stats.p95 || 0,
          p99ResponseTime: stats.p99 || 0
        };
      }
    } catch (error) {
      // pg_stat_statements 不可用，使用基本統計
    }

    // 備用方案：基本查詢統計
    const basicStats = await sequelize.query(`
      SELECT 
        COALESCE(SUM(calls), 0) as total_queries,
        COALESCE(AVG(mean_exec_time), 0) as avg_response_time
      FROM pg_stat_user_functions
    `, { type: sequelize.QueryTypes.SELECT }) as any[];

    return {
      totalQueries: basicStats[0]?.total_queries || 0,
      averageResponseTime: basicStats[0]?.avg_response_time || 0,
      slowQueries: 0,
      failedQueries: 0,
      queriesPerSecond: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0
    };
  }

  /**
   * 收集連接指標
   */
  private async collectConnectionMetrics(sequelize: Sequelize): Promise<PerformanceMetrics['connectionMetrics']> {
    const [connectionStats] = await sequelize.query(`
      SELECT 
        current_setting('max_connections')::int as max_connections,
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `, { type: sequelize.QueryTypes.SELECT }) as any[];

    const utilization = (connectionStats.total_connections / connectionStats.max_connections) * 100;

    return {
      totalConnections: connectionStats.total_connections,
      activeConnections: connectionStats.active_connections,
      idleConnections: connectionStats.idle_connections,
      connectionUtilization: utilization,
      maxConnections: connectionStats.max_connections
    };
  }

  /**
   * 收集資源指標
   */
  private async collectResourceMetrics(sequelize: Sequelize): Promise<PerformanceMetrics['resourceMetrics']> {
    // 簡化的資源指標收集
    // 在實際環境中，這些數據可能來自系統監控工具
    
    try {
      const [resourceStats] = await sequelize.query(`
        SELECT 
          pg_database_size(current_database()) as db_size,
          (SELECT count(*) FROM pg_stat_activity) as process_count
      `, { type: sequelize.QueryTypes.SELECT }) as any[];

      return {
        cpuUsage: 0, // 需要外部監控工具
        memoryUsage: 0, // 需要外部監控工具
        diskIOPS: 0, // 需要外部監控工具
        networkBandwidth: 0 // 需要外部監控工具
      };
    } catch (error) {
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        diskIOPS: 0,
        networkBandwidth: 0
      };
    }
  }

  /**
   * 收集快取指標
   */
  private async collectCacheMetrics(serviceName: string): Promise<PerformanceMetrics['cacheMetrics']> {
    try {
      // 從 Redis 快取管理器獲取統計
      const cacheManager = (await import('../caching/redis-cache-manager')).cacheManager;
      const stats = await cacheManager.getStats();
      
      // 計算總體統計
      let totalHits = 0;
      let totalMisses = 0;
      let totalSets = 0;
      
      for (const [layerName, layerStats] of stats) {
        totalHits += layerStats.hits;
        totalMisses += layerStats.misses;
        totalSets += layerStats.sets;
      }
      
      const totalRequests = totalHits + totalMisses;
      const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
      const missRate = totalRequests > 0 ? (totalMisses / totalRequests) * 100 : 0;
      
      return {
        hitRate,
        missRate,
        evictionRate: 0 // 需要從 Redis 獲取
      };
    } catch (error) {
      return {
        hitRate: 0,
        missRate: 0,
        evictionRate: 0
      };
    }
  }

  /**
   * 更新指標歷史
   */
  private updateMetricsHistory(serviceName: string, metrics: PerformanceMetrics): void {
    const history = this.metricsHistory.get(serviceName) || [];
    history.push(metrics);
    
    // 只保留最近24小時的數據（假設每分鐘採集一次）
    const maxRecords = 24 * 60;
    if (history.length > maxRecords) {
      history.splice(0, history.length - maxRecords);
    }
    
    this.metricsHistory.set(serviceName, history);
  }

  /**
   * 分析性能趨勢
   */
  private async analyzeTrends(serviceName: string): Promise<PerformanceTrend[]> {
    const history = this.metricsHistory.get(serviceName) || [];
    if (history.length < 10) {
      return []; // 需要足夠的歷史數據
    }

    const trends: PerformanceTrend[] = [];

    // 分析響應時間趨勢
    trends.push(this.calculateTrend(
      'Average Response Time',
      history.slice(-30).map(h => h.queryMetrics.averageResponseTime),
      'ms'
    ));

    // 分析查詢量趨勢
    trends.push(this.calculateTrend(
      'Queries Per Second',
      history.slice(-30).map(h => h.queryMetrics.queriesPerSecond),
      'qps'
    ));

    // 分析連接使用率趨勢
    trends.push(this.calculateTrend(
      'Connection Utilization',
      history.slice(-30).map(h => h.connectionMetrics.connectionUtilization),
      '%'
    ));

    // 分析快取命中率趨勢
    trends.push(this.calculateTrend(
      'Cache Hit Rate',
      history.slice(-30).map(h => h.cacheMetrics.hitRate),
      '%'
    ));

    return trends;
  }

  /**
   * 計算單個指標的趨勢
   */
  private calculateTrend(metricName: string, values: number[], unit: string): PerformanceTrend {
    if (values.length < 5) {
      return {
        metric: metricName,
        direction: 'STABLE',
        changePercent: 0,
        confidence: 0,
        timespan: `${values.length} samples`,
        predictions: { nextHour: 0, nextDay: 0, nextWeek: 0 }
      };
    }

    // 簡單的線性回歸分析
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // 計算變化百分比
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const changePercent = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
    
    // 確定趨勢方向
    let direction: PerformanceTrend['direction'];
    if (Math.abs(changePercent) < 5) {
      direction = 'STABLE';
    } else if (changePercent > 0) {
      direction = metricName.includes('Error') || metricName.includes('Response Time') ? 'DEGRADING' : 'IMPROVING';
    } else {
      direction = metricName.includes('Error') || metricName.includes('Response Time') ? 'IMPROVING' : 'DEGRADING';
    }
    
    // 計算置信度
    const confidence = Math.min(Math.abs(changePercent) / 10 * 100, 100);
    
    // 預測未來值
    const predictions = {
      nextHour: slope * (n + 1) + intercept,
      nextDay: slope * (n + 24) + intercept,
      nextWeek: slope * (n + 168) + intercept
    };

    return {
      metric: metricName,
      direction,
      changePercent: Math.round(changePercent * 100) / 100,
      confidence: Math.round(confidence),
      timespan: `${values.length} samples`,
      predictions
    };
  }

  /**
   * 生成優化建議
   */
  private async generateOptimizationRecommendations(
    serviceName: string, 
    metrics: PerformanceMetrics
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // 分析響應時間
    if (metrics.queryMetrics.averageResponseTime > 500) {
      recommendations.push({
        category: 'QUERY',
        priority: metrics.queryMetrics.averageResponseTime > 2000 ? 'HIGH' : 'MEDIUM',
        title: 'Optimize Slow Queries',
        description: `Average response time is ${metrics.queryMetrics.averageResponseTime}ms, which exceeds recommended thresholds.`,
        impact: 'HIGH',
        effort: 'MEDIUM',
        estimatedImprovement: '30-50% response time reduction',
        actionItems: [
          'Identify and optimize slow queries using EXPLAIN ANALYZE',
          'Add appropriate indexes for frequently used WHERE clauses',
          'Consider query rewriting for complex joins',
          'Review and optimize N+1 query patterns'
        ],
        sqlCommands: [
          'SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;'
        ]
      });
    }

    // 分析連接使用率
    if (metrics.connectionMetrics.connectionUtilization > 70) {
      recommendations.push({
        category: 'CONFIGURATION',
        priority: metrics.connectionMetrics.connectionUtilization > 90 ? 'CRITICAL' : 'HIGH',
        title: 'Optimize Connection Pool',
        description: `Connection utilization is at ${metrics.connectionMetrics.connectionUtilization}%, indicating potential bottleneck.`,
        impact: 'HIGH',
        effort: 'LOW',
        estimatedImprovement: 'Prevent connection exhaustion',
        actionItems: [
          'Increase connection pool size if resources allow',
          'Implement connection pooling at application level',
          'Review connection timeout settings',
          'Optimize long-running transactions'
        ],
        configChanges: {
          'max_connections': Math.min(metrics.connectionMetrics.maxConnections * 1.5, 200),
          'shared_buffers': '256MB'
        }
      });
    }

    // 分析快取命中率
    if (metrics.cacheMetrics.hitRate < 80) {
      recommendations.push({
        category: 'CONFIGURATION',
        priority: 'MEDIUM',
        title: 'Improve Cache Hit Rate',
        description: `Cache hit rate is ${metrics.cacheMetrics.hitRate}%, which is below optimal levels.`,
        impact: 'MEDIUM',
        effort: 'MEDIUM',
        estimatedImprovement: '20-30% query performance improvement',
        actionItems: [
          'Review cache key strategies',
          'Increase cache TTL for stable data',
          'Implement cache warming for frequently accessed data',
          'Optimize cache invalidation patterns'
        ]
      });
    }

    // 分析慢查詢
    if (metrics.queryMetrics.slowQueries > metrics.queryMetrics.totalQueries * 0.1) {
      recommendations.push({
        category: 'INDEX',
        priority: 'HIGH',
        title: 'Add Missing Indexes',
        description: `${metrics.queryMetrics.slowQueries} slow queries detected, indicating missing indexes.`,
        impact: 'HIGH',
        effort: 'LOW',
        estimatedImprovement: 'Up to 90% improvement for affected queries',
        actionItems: [
          'Analyze query patterns for missing indexes',
          'Create composite indexes for multi-column filters',
          'Consider partial indexes for filtered queries',
          'Remove unused indexes to improve write performance'
        ],
        sqlCommands: [
          'SELECT schemaname, tablename, attname FROM pg_stats WHERE n_distinct = -1;'
        ]
      });
    }

    return recommendations;
  }

  /**
   * 檢查警報條件
   */
  private async checkAlertConditions(serviceName: string, metrics: PerformanceMetrics): Promise<void> {
    const alerts: PerformanceAlert[] = [];

    // 響應時間警報
    if (metrics.queryMetrics.averageResponseTime > 5000) {
      alerts.push({
        severity: 'CRITICAL',
        type: 'HIGH_RESPONSE_TIME',
        serviceName,
        message: `Extremely high average response time: ${metrics.queryMetrics.averageResponseTime}ms`,
        details: { responseTime: metrics.queryMetrics.averageResponseTime },
        threshold: 5000,
        currentValue: metrics.queryMetrics.averageResponseTime,
        timestamp: new Date()
      });
    } else if (metrics.queryMetrics.averageResponseTime > 2000) {
      alerts.push({
        severity: 'WARNING',
        type: 'ELEVATED_RESPONSE_TIME',
        serviceName,
        message: `High average response time: ${metrics.queryMetrics.averageResponseTime}ms`,
        details: { responseTime: metrics.queryMetrics.averageResponseTime },
        threshold: 2000,
        currentValue: metrics.queryMetrics.averageResponseTime,
        timestamp: new Date()
      });
    }

    // 連接使用率警報
    if (metrics.connectionMetrics.connectionUtilization > 95) {
      alerts.push({
        severity: 'CRITICAL',
        type: 'CONNECTION_EXHAUSTION',
        serviceName,
        message: `Critical connection utilization: ${metrics.connectionMetrics.connectionUtilization}%`,
        details: metrics.connectionMetrics,
        threshold: 95,
        currentValue: metrics.connectionMetrics.connectionUtilization,
        timestamp: new Date()
      });
    }

    // 快取命中率警報
    if (metrics.cacheMetrics.hitRate < 50) {
      alerts.push({
        severity: 'WARNING',
        type: 'LOW_CACHE_HIT_RATE',
        serviceName,
        message: `Low cache hit rate: ${metrics.cacheMetrics.hitRate}%`,
        details: metrics.cacheMetrics,
        threshold: 50,
        currentValue: metrics.cacheMetrics.hitRate,
        timestamp: new Date()
      });
    }

    // 發送警報
    for (const alert of alerts) {
      const alertKey = `${alert.serviceName}:${alert.type}`;
      const existingAlert = this.activeAlerts.get(alertKey);
      
      if (!existingAlert || existingAlert.resolved) {
        this.activeAlerts.set(alertKey, alert);
        this.emit('alert', alert);
      }
    }
  }

  /**
   * 獲取性能指標歷史
   */
  getMetricsHistory(serviceName: string, hours: number = 24): PerformanceMetrics[] {
    const history = this.metricsHistory.get(serviceName) || [];
    const samplesPerHour = 60; // 假設每分鐘採集一次
    const maxSamples = hours * samplesPerHour;
    
    return history.slice(-maxSamples);
  }

  /**
   * 獲取當前性能狀態
   */
  getCurrentPerformanceStatus(): Map<string, PerformanceMetrics> {
    const currentStatus = new Map<string, PerformanceMetrics>();
    
    for (const [serviceName, history] of this.metricsHistory) {
      const latest = history[history.length - 1];
      if (latest) {
        currentStatus.set(serviceName, latest);
      }
    }
    
    return currentStatus;
  }

  /**
   * 獲取活躍警報
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * 解決警報
   */
  resolveAlert(serviceName: string, alertType: string): void {
    const alertKey = `${serviceName}:${alertType}`;
    const alert = this.activeAlerts.get(alertKey);
    
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.emit('alert:resolved', alert);
    }
  }

  /**
   * 設置事件處理器
   */
  private setupEventHandlers(): void {
    this.on('alert', (alert: PerformanceAlert) => {
      console.warn(`Performance Alert [${alert.severity}] ${alert.serviceName}: ${alert.message}`);
    });

    this.on('alert:resolved', (alert: PerformanceAlert) => {
      console.info(`Performance Alert Resolved: ${alert.serviceName} - ${alert.type}`);
    });
  }

  /**
   * 關閉分析器
   */
  async shutdown(): Promise<void> {
    this.stop();
    
    // 清理資源
    this.sequelizeInstances.clear();
    this.metricsHistory.clear();
    this.activeAlerts.clear();
    
    console.log('Database performance analyzer shutdown complete');
  }
}

// 單例實例
export const databasePerformanceAnalyzer = new DatabasePerformanceAnalyzer();