/**
 * @fileoverview 資料庫配置模組
 * 此模組提供 Sequelize ORM 的資料庫連接配置和實例建立
 * 包含 RBAC（角色基礎存取控制）模型、無人機相關模型和即時狀態模型的配置
 */

// 匯入 Sequelize TypeScript 版本用於 ORM 操作
import { Sequelize } from 'sequelize-typescript';
// 匯入使用者模型用於使用者資料管理
import { UserModel } from '../models/UserModel';
// 匯入角色模型用於角色管理
import { RoleModel } from '../models/RoleModel';
// 匯入權限模型用於權限管理
import { PermissionModel } from '../models/PermissionModel';
// 匯入使用者角色關聯模型用於使用者和角色的多對多關係
import { UserRoleModel } from '../models/UserToRoleModel';
// 匯入角色權限關聯模型用於角色和權限的多對多關係
import { RolePermissionModel } from '../models/RoleToPermissionModel';
// RBAC 服務只包含 RBAC 相關模型，無人機和用戶偏好模型由其他服務管理

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
    /** MySQL 特定配置 */
    connectTimeout?: number;
    /** 支援大數據包 */
    supportBigNumbers?: boolean;
    bigNumberStrings?: boolean;
  };
}

/**
 * 獲取環境特定的連接池配置
 * 根據運行環境（開發、測試、生產）提供不同的連接池參數
 */
const getPoolConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return {
        max: parseInt(process.env.DB_POOL_MAX || '20'), // 生產環境：更多連接
        min: parseInt(process.env.DB_POOL_MIN || '5'),  // 保持最小連接數
        idle: parseInt(process.env.DB_POOL_IDLE || '10000'), // 10秒空閒超時
        acquire: parseInt(process.env.DB_POOL_ACQUIRE || '60000'), // 60秒獲取超時
        evict: parseInt(process.env.DB_POOL_EVICT || '1000'), // 1秒檢查間隔
      };
    case 'test':
      return {
        max: 5,   // 測試環境：較少連接
        min: 1,   // 最小連接數
        idle: 5000,   // 5秒空閒超時
        acquire: 10000, // 10秒獲取超時
        evict: 1000,    // 1秒檢查間隔
      };
    default: // development
      return {
        max: parseInt(process.env.DB_POOL_MAX || '10'), // 開發環境：中等連接數
        min: parseInt(process.env.DB_POOL_MIN || '2'),  // 保持少量連接
        idle: parseInt(process.env.DB_POOL_IDLE || '30000'), // 30秒空閒超時（開發時較長）
        acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'), // 30秒獲取超時
        evict: parseInt(process.env.DB_POOL_EVICT || '1000'), // 1秒檢查間隔
      };
  }
};

/**
 * 獲取資料庫配置物件
 * 從環境變數中讀取資料庫連接參數，如果未設定則使用預設值
 * 包含優化的連接池配置以提升性能
 * @returns {DatabaseConfig} 完整的資料庫配置物件
 */
export const getDatabaseConfig = (): DatabaseConfig => ({
  // 從環境變數獲取資料庫主機位址，docker 環境下使用容器名稱
  host: process.env.DB_HOST || 'aiot-mysqldb',
  // 從環境變數獲取資料庫名稱，預設為 main_db
  database: process.env.DB_NAME || 'main_db',
  // 從環境變數獲取資料庫使用者名稱，預設為 admin
  username: process.env.DB_USER || 'admin',
  // 從環境變數獲取資料庫密碼，預設為 admin
  password: process.env.DB_PASSWORD || 'admin',
  // 從環境變數獲取資料庫埠號並轉換為整數，預設為 3306（MySQL 預設埠）
  port: parseInt(process.env.DB_PORT || '3306'),
  // 設定資料庫類型為 MySQL
  dialect: 'mysql',
  // 根據環境設定日誌記錄：開發環境顯示 SQL 查詢，生產環境關閉日誌
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  // === Connection Pool 優化配置 ===
  pool: getPoolConfig(),
  
  // === MySQL 特定的優化配置 ===
  dialectOptions: {
    // 連接超時設定
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'), // 60秒
    timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '60000'), // 60秒查詢超時
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '60000'), // 60秒連接超時
    
    // 支援大數據包（對於 AIOT 可能有大量位置數據）
    supportBigNumbers: true,
    bigNumberStrings: true,
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
    // 註冊 RBAC 相關模型到 Sequelize 實例中
    models: [UserModel, RoleModel, PermissionModel, UserRoleModel, RolePermissionModel],
    
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
 * 監控連接池狀態，記錄重要事件
 * @param sequelize Sequelize 實例
 */
const setupPoolEventListeners = (sequelize: Sequelize): void => {
  const connectionManager = sequelize.connectionManager as any;
  
  if (connectionManager && connectionManager.pool) {
    // 連接獲取事件
    connectionManager.pool.on('acquire', (connection: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔗 Connection acquired: ${connection.threadId || connection.processID}`);
      }
    });

    // 連接釋放事件
    connectionManager.pool.on('release', (connection: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔓 Connection released: ${connection.threadId || connection.processID}`);
      }
    });

    // 連接創建事件
    connectionManager.pool.on('create', (connection: any) => {
      console.log(`✨ New connection created: ${connection.threadId || connection.processID}`);
    });

    // 連接銷毀事件
    connectionManager.pool.on('destroy', (connection: any) => {
      console.log(`💀 Connection destroyed: ${connection.threadId || connection.processID}`);
    });

    // 連接池錯誤事件
    connectionManager.pool.on('error', (error: any) => {
      console.error('❌ Connection pool error:', error);
    });
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