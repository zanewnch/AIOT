/**
 * @fileoverview 資料庫配置模組
 * 此模組提供 Sequelize ORM 的資料庫連接配置和實例建立
 * 包含 Auth 認證相關模型的配置
 */

// 匯入 Sequelize TypeScript 版本用於 ORM 操作
import { Sequelize } from 'sequelize-typescript';
// 匯入使用者模型用於使用者資料管理
import { UserModel } from '../models/UserModel.js';
// Auth 服務主要處理用戶認證和會話管理

/**
 * 資料庫配置介面
 * 定義連接資料庫所需的所有參數
 */
export interface DatabaseConfig {
  /** 資料庫伺服器主機位址 */
  host: string;
  /** 資料庫名稱 */
  database: string;
  /** 資料庫使用者名稱 */
  username: string;
  /** 資料庫密碼 */
  password: string;
  /** 資料庫連接埠號 */
  port: number;
  /** 資料庫類型，支援多種資料庫系統 */
  dialect: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql';
  /** 日誌記錄設定，可以是布林值或自定義日誌函式 */
  logging: boolean | ((sql: string) => void);
  /** Connection Pool 配置 */
  pool: {
    /** 連接池中最大連接數 */
    max: number;
    /** 連接池中最小連接數 */
    min: number;
    /** 連接空閒超時時間（毫秒） */
    idle: number;
    /** 獲取連接的超時時間（毫秒） */
    acquire: number;
    /** 連接池驅逐檢查間隔（毫秒） */
    evict: number;
  };
  /** 查詢超時時間（毫秒） */
  dialectOptions: {
    acquireTimeout: number;
    timeout: number;
    /** PostgreSQL 特定配置 */
    connectTimeout?: number;
    /** SSL 配置 */
    ssl?: boolean;
  };
}

/**
 * 微服務類型定義
 */
type ServiceType = 'read-heavy' | 'write-heavy' | 'balanced';

/**
 * 獲取當前微服務類型
 * 根據服務名稱或環境變數確定服務類型
 */
const getServiceType = (): ServiceType => {
  const serviceName = process.env.SERVICE_NAME || 'auth-service';
  
  // RBAC 和 General Service 主要是讀取操作（用戶查詢、權限檢查）
  if (['rbac-service', 'general-service', 'auth-service'].includes(serviceName)) {
    return 'read-heavy';
  }
  
  // Drone Service 有大量寫入操作（位置數據、狀態更新）
  if (['drone-service', 'drone-websocket-service'].includes(serviceName)) {
    return 'write-heavy';
  }
  
  // Gateway 和其他服務保持平衡
  return 'balanced';
};

/**
 * 獲取針對不同服務類型和環境的連接池配置
 * 根據微服務特性和運行環境提供優化的連接池參數
 */
const getPoolConfig = () => {
  const env = (process.env.NODE_ENV as 'production' | 'test' | 'development') || 'development';
  const serviceType = getServiceType();
  
  // 基礎配置
  const baseConfigs = {
    production: {
      'read-heavy': {
        max: parseInt(process.env.DB_POOL_MAX || '15'), // 讀取密集：較多連接用於並發查詢
        min: parseInt(process.env.DB_POOL_MIN || '5'),  // 保持足夠的活躍連接
        idle: parseInt(process.env.DB_POOL_IDLE || '60000'), // 60秒空閒超時（讀取操作較頻繁）
        acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'), // 30秒獲取超時
        evict: parseInt(process.env.DB_POOL_EVICT || '1000'), // 1秒檢查間隔
      },
      'write-heavy': {
        max: parseInt(process.env.DB_POOL_MAX || '20'), // 寫入密集：更多連接處理批量寫入
        min: parseInt(process.env.DB_POOL_MIN || '8'),  // 保持較多最小連接
        idle: parseInt(process.env.DB_POOL_IDLE || '30000'), // 30秒空閒超時（寫入後快速釋放）
        acquire: parseInt(process.env.DB_POOL_ACQUIRE || '15000'), // 15秒獲取超時（寫入要求快速響應）
        evict: parseInt(process.env.DB_POOL_EVICT || '500'), // 0.5秒檢查間隔（更頻繁的連接管理）
      },
      'balanced': {
        max: parseInt(process.env.DB_POOL_MAX || '12'), // 平衡型：中等連接數
        min: parseInt(process.env.DB_POOL_MIN || '4'),  // 適中的最小連接
        idle: parseInt(process.env.DB_POOL_IDLE || '45000'), // 45秒空閒超時
        acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'), // 30秒獲取超時
        evict: parseInt(process.env.DB_POOL_EVICT || '1000'), // 1秒檢查間隔
      }
    },
    test: {
      'read-heavy': { max: 8, min: 2, idle: 10000, acquire: 15000, evict: 1000 },
      'write-heavy': { max: 10, min: 3, idle: 8000, acquire: 10000, evict: 500 },
      'balanced': { max: 6, min: 2, idle: 10000, acquire: 15000, evict: 1000 }
    },
    development: {
      'read-heavy': { max: 10, min: 3, idle: 45000, acquire: 30000, evict: 1000 },
      'write-heavy': { max: 12, min: 4, idle: 30000, acquire: 20000, evict: 1000 },
      'balanced': { max: 8, min: 2, idle: 40000, acquire: 30000, evict: 1000 }
    }
  };
  
  return baseConfigs[env]?.[serviceType] || baseConfigs.development.balanced;
};

/**
 * 獲取資料庫配置物件
 * 從環境變數中讀取資料庫連接參數，如果未設定則使用預設值
 * 包含優化的連接池配置以提升性能
 * @returns {DatabaseConfig} 完整的資料庫配置物件
 */
export const getDatabaseConfig = (): DatabaseConfig => ({
  // 從環境變數獲取資料庫主機位址，docker 環境下使用容器名稱
  host: process.env.DB_HOST || 'aiot-postgres',
  // 從環境變數獲取資料庫名稱，預設為 main_db（Auth 使用主資料庫）
  database: process.env.DB_NAME || 'main_db',
  // 從環境變數獲取資料庫使用者名稱，預設為 admin
  username: process.env.DB_USER || 'admin',
  // 從環境變數獲取資料庫密碼，預設為 admin
  password: process.env.DB_PASSWORD || 'admin',
  // 從環境變數獲取資料庫埠號並轉換為整數，預設為 5432（Auth Service 專用）
  port: parseInt(process.env.DB_PORT || '5432'),
  // 設定資料庫類型為 PostgreSQL
  dialect: 'postgres',
  // 根據環境設定日誌記錄：開發環境顯示 SQL 查詢，生產環境關閉日誌
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  // === Connection Pool 優化配置 ===
  pool: getPoolConfig(),
  
  // === PostgreSQL 特定的優化配置 ===
  dialectOptions: {
    // 連接超時設定
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'), // 60秒
    timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '60000'), // 60秒查詢超時
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '60000'), // 60秒連接超時
    
    // PostgreSQL 連接配置
    ssl: false, // 開發環境不使用 SSL
  },
});

/**
 * 建立並配置 Sequelize 實例
 * 使用資料庫配置建立 Sequelize 連接實例，並註冊所有模型
 * 包含連接池監控和健康檢查功能
 * @returns {Sequelize} 配置完成的 Sequelize 實例
 */
export const createSequelizeInstance = (): Sequelize => {
  // 獲取資料庫配置
  const config = getDatabaseConfig();

  // 建立新的 Sequelize 實例並配置
  const sequelize = new Sequelize({
    // 展開資料庫配置物件的所有屬性
    ...config,
    // 註冊 Auth Service 相關模型到 Sequelize 實例中
    models: [UserModel],
    
    // === 其他 Sequelize 優化配置 ===
    // 啟用查詢效能基準測試（僅開發環境）
    benchmark: process.env.NODE_ENV === 'development',
    // 配置重試機制（避免連接池耗盡）
    retry: {
      max: 3,
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /EHOSTDOWN/,
        /ENETDOWN/,
        /ENETUNREACH/,
        /EAI_AGAIN/
      ]
    }
  });

  // === 連接池事件監聽 ===
  setupPoolEventListeners(sequelize);

  return sequelize;
};

/**
 * 設定連接池事件監聽器
 * 監控連接池狀態，記錄重要事件和性能指標
 * @param sequelize Sequelize 實例
 */
const setupPoolEventListeners = (sequelize: Sequelize): void => {
  const connectionManager = sequelize.connectionManager as any;
  const serviceName = process.env.SERVICE_NAME || 'unknown-service';
  const serviceType = getServiceType();
  
  if (connectionManager && connectionManager.pool && typeof connectionManager.pool.on === 'function') {
    // 連接獲取事件 - 記錄獲取時間和池狀態
    connectionManager.pool.on('acquire', (connection: any) => {
      const poolStats = getPoolStats(sequelize);
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔗 [${serviceName}:${serviceType}] Connection acquired: ${connection.threadId || connection.processID}`);
        console.log(`📊 Pool stats - Active: ${poolStats?.active}, Idle: ${poolStats?.idle}, Pending: ${poolStats?.pending}`);
      }
    });

    // 連接釋放事件
    connectionManager.pool.on('release', (connection: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔓 [${serviceName}:${serviceType}] Connection released: ${connection.threadId || connection.processID}`);
      }
    });

    // 連接創建事件 - 重要！記錄新連接創建
    connectionManager.pool.on('create', (connection: any) => {
      const poolStats = getPoolStats(sequelize);
      console.log(`✨ [${serviceName}:${serviceType}] New connection created: ${connection.threadId || connection.processID}`);
      console.log(`📈 Pool size increased to: ${poolStats?.size}/${poolStats?.max}`);
    });

    // 連接銷毀事件 - 記錄連接池收縮
    connectionManager.pool.on('destroy', (connection: any) => {
      const poolStats = getPoolStats(sequelize);
      console.log(`💀 [${serviceName}:${serviceType}] Connection destroyed: ${connection.threadId || connection.processID}`);
      console.log(`📉 Pool size decreased to: ${poolStats?.size}/${poolStats?.max}`);
    });

    // 連接池錯誤事件 - 關鍵錯誤記錄
    connectionManager.pool.on('error', (error: any) => {
      console.error(`❌ [${serviceName}:${serviceType}] Connection pool error:`, error);
      const poolStats = getPoolStats(sequelize);
      console.error(`🔍 Pool debug info:`, poolStats);
    });

    // 連接超時事件（如果支持）
    if (typeof connectionManager.pool.on === 'function') {
      connectionManager.pool.on('timeout', () => {
        console.warn(`⏰ [${serviceName}:${serviceType}] Connection pool timeout - consider increasing pool size`);
      });
    }
  }

  // 定期記錄連接池統計（僅在開發環境）
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const stats = getPoolStats(sequelize);
      if (stats && (stats.active > 0 || stats.pending > 0)) {
        console.log(`📊 [${serviceName}:${serviceType}] Pool Status:`, {
          active: stats.active,
          idle: stats.idle,
          pending: stats.pending,
          size: stats.size,
          utilization: `${Math.round((stats.active / stats.max) * 100)}%`
        });
      }
    }, 30000); // 每30秒記錄一次
  }
};

/**
 * 獲取連接池統計信息
 * 用於監控和除錯連接池狀態
 * @param sequelize Sequelize 實例
 * @returns 連接池統計信息
 */
export const getPoolStats = (sequelize: Sequelize) => {
  const connectionManager = sequelize.connectionManager as any;
  
  if (!connectionManager || !connectionManager.pool) {
    return null;
  }

  const pool = connectionManager.pool;
  
  return {
    // 當前活躍連接數
    active: pool.using || 0,
    // 當前空閒連接數  
    idle: pool.available || 0,
    // 等待連接的請求數
    pending: pool.pending || 0,
    // 連接池大小
    size: pool.size || 0,
    // 最大連接數
    max: pool.options?.max || 0,
    // 最小連接數
    min: pool.options?.min || 0,
    // 當前時間戳
    timestamp: new Date().toISOString()
  };
};

/**
 * 資料庫健康檢查
 * 檢查資料庫連接狀態和連接池健康度
 * @param sequelize Sequelize 實例
 * @returns 健康檢查結果
 */
export const healthCheck = async (sequelize: Sequelize) => {
  try {
    // 測試資料庫連接
    await sequelize.authenticate();
    
    // 獲取連接池統計
    const poolStats = getPoolStats(sequelize);
    
    return {
      status: 'healthy',
      database: 'connected',
      poolStats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};