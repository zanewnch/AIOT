/**
 * @fileoverview AIOT 資料庫優化工具包
 * 統一導出所有資料庫優化功能和工具
 */

// ======================
// 核心配置與連接池
// ======================
export * from './configs/connection-pool-config';

// ======================  
// 快取系統
// ======================
export { 
  RedisCacheManager, 
  cacheManager,
  type CacheOptions,
  type CacheStats,
  type CacheLayer
} from './caching/redis-cache-manager';

export {
  Cacheable,
  CacheEvict, 
  CacheWarmup,
  CacheStats as CacheStatsDecorator,
  DistributedLock
} from './caching/cache-decorators';

export {
  RBACCacheStrategy,
  DroneCacheStrategy,
  GeneralCacheStrategy,
  CrossServiceCacheCoordinator,
  rbacCacheStrategy,
  droneCacheStrategy,
  generalCacheStrategy,
  crossServiceCacheCoordinator
} from './caching/service-cache-strategies';

// ======================
// 查詢優化
// ======================
export { 
  RBACQueryOptimizations,
  DroneQueryOptimizations,
  UserPreferencesQueryOptimizations,
  CrossServiceQueryOptimizations,
  QueryPerformanceMonitor as QueryPerformanceLogger
} from './optimizations/query-patterns';

export {
  IntelligentQueryOptimizer,
  QueryCacheManager,
  BatchQueryOptimizer
} from './optimizations/advanced-query-optimizer';

export {
  QueryPerformanceMonitor,
  AutoPerformanceTuner
} from './optimizations/query-performance-monitor';

// ======================
// 事務管理  
// ======================
export {
  TransactionManager,
  transactionManager,
  type TransactionContext,
  type TransactionOperation,
  type DistributedTransactionConfig,
  type TransactionMiddlewareOptions
} from './transactions/transaction-manager';

export {
  createTransactionMiddleware,
  manualTransactionMiddleware,
  distributedTransactionMiddleware,
  retryTransactionMiddleware,
  transactionMonitoringMiddleware
} from './transactions/transaction-middleware';

export {
  Transactional,
  ReadOnly,
  RetryableTransaction,
  DistributedTransactional,
  TransactionMetrics
} from './transactions/transaction-decorators';

// ======================
// 監控與健康檢查
// ======================
export {
  DatabaseHealthMonitor,
  databaseHealthMonitor,
  type DatabaseHealth,
  type HealthCheck,
  type MonitoringConfig
} from './monitoring/database-health-monitor';

export {
  DatabasePerformanceAnalyzer,
  databasePerformanceAnalyzer,
  type PerformanceMetrics,
  type PerformanceTrend,
  type OptimizationRecommendation,
  type PerformanceAlert
} from './monitoring/performance-analyzer';

export {
  MonitoringDashboard,
  monitoringDashboard,
  type DashboardConfig,
  type DashboardSnapshot,
  type MonitoringReport
} from './monitoring/monitoring-dashboard';

// ======================
// 類型定義
// ======================
export interface DatabaseOptimizationConfig {
  connectionPool: {
    serviceType: 'read-heavy' | 'write-heavy' | 'balanced';
    enableMonitoring: boolean;
    customPoolConfig?: any;
  };
  caching: {
    enabled: boolean;
    layers: string[];
    defaultTtl: number;
    compression: boolean;
  };
  transactions: {
    defaultIsolationLevel: string;
    timeout: number;
    retryAttempts: number;
    distributedEnabled: boolean;
  };
  monitoring: {
    healthChecks: boolean;
    performanceAnalysis: boolean;
    dashboard: boolean;
    alerting: boolean;
  };
  queryOptimization: {
    intelligentOptimizer: boolean;
    performanceMonitoring: boolean;
    batchOptimization: boolean;
  };
}

// ======================
// 工具類
// ======================
export class DatabaseOptimizationSuite {
  private config: DatabaseOptimizationConfig;

  constructor(config: Partial<DatabaseOptimizationConfig> = {}) {
    this.config = {
      connectionPool: {
        serviceType: 'balanced',
        enableMonitoring: true,
        ...config.connectionPool
      },
      caching: {
        enabled: true,
        layers: ['L1_HOT', 'L2_WARM', 'L3_COLD', 'L4_PERSISTENT'],
        defaultTtl: 3600,
        compression: true,
        ...config.caching
      },
      transactions: {
        defaultIsolationLevel: 'READ_COMMITTED',
        timeout: 30000,
        retryAttempts: 3,
        distributedEnabled: true,
        ...config.transactions
      },
      monitoring: {
        healthChecks: true,
        performanceAnalysis: true,
        dashboard: true,
        alerting: true,
        ...config.monitoring
      },
      queryOptimization: {
        intelligentOptimizer: true,
        performanceMonitoring: true,
        batchOptimization: true,
        ...config.queryOptimization
      }
    };
  }

  /**
   * 初始化所有優化功能
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing AIOT Database Optimization Suite...');

    // 1. 初始化快取系統
    if (this.config.caching.enabled) {
      console.log('📦 Initializing Redis Cache Manager...');
      // cacheManager 是單例，已經初始化
    }

    // 2. 初始化事務管理器
    if (this.config.transactions.distributedEnabled) {
      console.log('🔄 Initializing Transaction Manager...');
      // transactionManager 是單例，已經初始化
    }

    // 3. 初始化監控系統
    if (this.config.monitoring.healthChecks) {
      console.log('🔍 Starting Health Monitor...');
      databaseHealthMonitor.start();
    }

    if (this.config.monitoring.performanceAnalysis) {
      console.log('📊 Starting Performance Analyzer...');
      databasePerformanceAnalyzer.start();
    }

    if (this.config.monitoring.dashboard) {
      console.log('📋 Starting Monitoring Dashboard...');
      await monitoringDashboard.start();
    }

    console.log('✅ AIOT Database Optimization Suite initialized successfully!');
  }

  /**
   * 註冊資料庫服務
   */
  registerService(serviceName: string, sequelize: any): void {
    console.log(`📝 Registering database service: ${serviceName}`);

    if (this.config.monitoring.healthChecks) {
      databaseHealthMonitor.registerDatabase(serviceName, sequelize);
    }

    if (this.config.monitoring.performanceAnalysis) {
      databasePerformanceAnalyzer.registerDatabase(serviceName, sequelize);
    }
  }

  /**
   * 獲取配置
   */
  getConfig(): DatabaseOptimizationConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<DatabaseOptimizationConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * 獲取系統狀態
   */
  async getSystemStatus(): Promise<{
    caching: any;
    transactions: any;
    monitoring: any;
    performance: any;
  }> {
    const [cacheStats, dashboardSnapshot] = await Promise.all([
      cacheManager.getStats(),
      monitoringDashboard.getCurrentSnapshot()
    ]);

    return {
      caching: {
        enabled: this.config.caching.enabled,
        stats: Array.from(cacheStats.entries())
      },
      transactions: {
        enabled: this.config.transactions.distributedEnabled,
        stats: transactionManager.getTransactionStats()
      },
      monitoring: {
        healthChecks: this.config.monitoring.healthChecks,
        dashboard: this.config.monitoring.dashboard,
        alerts: databasePerformanceAnalyzer.getActiveAlerts().length
      },
      performance: {
        snapshot: dashboardSnapshot,
        services: dashboardSnapshot ? Object.keys(dashboardSnapshot.services).length : 0
      }
    };
  }

  /**
   * 關閉所有優化功能
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down AIOT Database Optimization Suite...');

    // 關閉監控系統
    await monitoringDashboard.shutdown();
    await databaseHealthMonitor.shutdown();
    await databasePerformanceAnalyzer.shutdown();

    // 關閉快取系統
    await cacheManager.disconnect();

    // 關閉事務管理器
    await transactionManager.shutdown();

    console.log('✅ AIOT Database Optimization Suite shutdown completed!');
  }
}

// ======================
// 預設實例
// ======================
export const databaseOptimizationSuite = new DatabaseOptimizationSuite();

// ======================
// 便利函數
// ======================

/**
 * 快速初始化基本優化功能
 */
export async function initializeBasicOptimizations(): Promise<void> {
  await databaseOptimizationSuite.initialize();
}

/**
 * 快速註冊服務
 */
export function registerDatabaseService(serviceName: string, sequelize: any): void {
  databaseOptimizationSuite.registerService(serviceName, sequelize);
}

/**
 * 獲取快速狀態摘要
 */
export async function getQuickStatus(): Promise<string> {
  const status = await databaseOptimizationSuite.getSystemStatus();
  
  return `
🏥 AIOT Database Health Summary
================================
📦 Caching: ${status.caching.enabled ? '✅ Active' : '❌ Disabled'}
🔄 Transactions: ${status.transactions.enabled ? '✅ Active' : '❌ Disabled'}
🔍 Monitoring: ${status.monitoring.healthChecks ? '✅ Active' : '❌ Disabled'}
📊 Dashboard: ${status.monitoring.dashboard ? '✅ Active' : '❌ Disabled'}
⚠️  Active Alerts: ${status.monitoring.alerts}
🗄️  Monitored Services: ${status.performance.services}
================================
  `.trim();
}

// ======================
// 版本信息
// ======================
export const VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();

console.log(`
🔥 AIOT Database Optimization Suite v${VERSION}
   Built: ${BUILD_DATE}
   
📚 Available Features:
   • Redis Multi-Layer Caching
   • Intelligent Query Optimization  
   • Advanced Transaction Management
   • Real-time Health Monitoring
   • Performance Analysis & Trends
   • Automated Tuning Recommendations
   • Distributed Transaction Support
   • Comprehensive Monitoring Dashboard
   
🚀 Ready to optimize your database performance!
`);