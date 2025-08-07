/**
 * @fileoverview MongoDB資料庫連接配置模組
 * 
 * 此模組提供了完整的MongoDB資料庫連接管理功能，包括連接建立、斷開、
 * 狀態監控和錯誤處理。專為高可用性和高性能的應用程式設計。
 * 
 * 主要特性：
 * - 自動重連機制
 * - 連接池管理
 * - 環境變數優先配置
 * - 完整的連接生命週期管理
 * - 詳細的連接狀態監控
 * - 生產環境優化的參數配置
 * 
 * MongoDB特性：
 * - 文檔導向的NoSQL資料庫
 * - 支援複雜的查詢和索引
 * - 內建的複製和分片功能
 * - 高可用性和水平擴展性
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

// 導入 mongoose ODM，提供MongoDB物件文檔映射功能
import mongoose from "mongoose";

/**
 * MongoDB連接配置介面
 * 
 * 定義連接MongoDB所需的所有配置參數，包括主機、端口、
 * 資料庫名稱、認證資訊等。此介面確保配置的類型安全性。
 * 
 * @interface MongoConfig
 * @example
 * ```typescript
 * const config: MongoConfig = {
 *   host: "localhost",
 *   port: 27017,
 *   database: "my_db",
 *   username: "admin",
 *   password: "password",
 *   authSource: "admin"
 * };
 * ```
 */
export interface MongoConfig {
  /** MongoDB主機地址 - 可以是IP地址或域名 */
  host: string;
  /** MongoDB端口號 - 預設為27017 */
  port: number;
  /** 資料庫名稱 - 要連接的目標資料庫 */
  database: string;
  /** 使用者名稱 - 用於認證的使用者帳號 */
  username: string;
  /** 密碼 - 用於認證的使用者密碼 */
  password: string;
  /** 認證來源資料庫 - 儲存使用者認證資訊的資料庫 */
  authSource: string;
}

/**
 * MongoDB連接配置
 * 
 * 基於docker-compose.yml設定的預設MongoDB連接參數。
 * 在生產環境中應該透過環境變數覆蓋這些設定。
 * 
 * 安全性考量：
 * - 預設密碼僅用於開發環境
 * - 生產環境必須使用強密碼
 * - 建議使用環境變數避免硬編碼
 * 
 * @type {MongoConfig}
 */
const mongoConfig: MongoConfig = {
  /** MongoDB主機地址 - 開發環境使用本機地址 */
  host: "localhost",
  /** MongoDB端口號 - 使用預設的27017端口 */
  port: 27017,
  /** 目標資料庫名稱 - 應用程式的主要資料庫 */
  database: "main_db",
  /** 資料庫使用者名稱 - 具有適當權限的資料庫使用者 */
  username: "admin",
  /** 資料庫密碼 - 開發環境使用簡單密碼，生產環境應使用強密碼 */
  password: "admin",
  /** 認證來源資料庫 - 儲存使用者認證資訊的資料庫 */
  authSource: "admin",
};

/**
 * 建構MongoDB連接字串
 * 
 * 優先使用環境變數MONGODB_URL，若不存在則根據mongoConfig配置
 * 動態建構標準的MongoDB連接URI。此函數支援兩種配置模式：
 * 1. 直接使用完整的MongoDB URL（生產環境推薦）
 * 2. 使用配置物件動態建構URL（開發環境方便）
 * 
 * @private
 * @returns {string} 完整的MongoDB連接字串
 * 
 * @example
 * ```typescript
 * // 使用環境變數
 * process.env.MONGODB_URL = "mongodb://user:pass@host:port/db";
 * const url = buildMongoUrl(); // 返回環境變數值
 * 
 * // 使用配置建構
 * delete process.env.MONGODB_URL;
 * const url = buildMongoUrl(); // 返回基於mongoConfig建構的URL
 * ```
 */
const buildMongoUrl = (): string => {
  // 如果有環境變數 MONGODB_URL，直接使用 - 優先級最高，適用於生產環境
  if (process.env.MONGODB_URL) {
    return process.env.MONGODB_URL;
  }

  // 否則根據配置建構連接字串 - 從mongoConfig物件解構所需參數
  const { host, port, database, username, password, authSource } = mongoConfig;
  // 建構標準的MongoDB URI格式：mongodb://username:password@host:port/database?authSource=authSource
  return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=${authSource}`;
};

/**
 * Mongoose連接選項配置
 * 
 * 包含連接池、超時時間和緩衝設定等MongoDB連接的優化參數。
 * 這些設定針對生產環境進行了調優，提供最佳的性能和穩定性。
 * 
 * 性能優化考量：
 * - 適當的連接池大小平衡性能與資源消耗
 * - 合理的超時設定避免長時間等待
 * - 停用緩衝機制提高即時性
 * 
 * 穩定性考量：
 * - 設定適當的超時時間防止無限等待
 * - 連接池管理確保連接的有效性
 * 
 * @type {mongoose.ConnectOptions}
 */
const mongoOptions = {
  /** 連接池最大連接數 - 限制為10個連接，適合中等負載的應用 */
  maxPoolSize: 10,
  /** 伺服器選擇超時時間（毫秒） - 5秒內必須選擇到可用伺服器 */
  serverSelectionTimeoutMS: 5000,
  /** Socket超時時間（毫秒） - 45秒內必須完成socket操作 */
  socketTimeoutMS: 45000,
  /** 連接超時時間（毫秒） - 10秒內必須建立連接 */
  connectTimeoutMS: 10000,
  /** 停用mongoose緩衝命令 - 避免在未連接時暫存操作 */
  bufferCommands: false,
  /** 停用mongoose緩衝項目數量限制 - 搭配bufferCommands使用 */
  bufferMaxEntries: 0,
};

/**
 * 連接到MongoDB資料庫
 * 
 * 建立與MongoDB的連接，如果已經連接則返回現有連接。
 * 包含完整的錯誤處理、連接事件監聽和日誌記錄。
 * 連接失敗時會終止程序。
 * 
 * 連接流程：
 * 1. 檢查現有連接狀態
 * 2. 建構連接字串
 * 3. 使用配置選項建立連接
 * 4. 設定事件監聽器
 * 5. 返回mongoose實例
 * 
 * @function connectMongoDB
 * @returns {Promise<typeof mongoose>} Mongoose實例
 * 
 * @throws {Error} 當MongoDB連接失敗時拋出錯誤並終止程序
 * 
 * @example
 * ```typescript
 * import { connectMongoDB } from './MongoDBConfig';
 * 
 * async function initApp() {
 *   try {
 *     const mongoose = await connectMongoDB();
 *     console.log('資料庫連接成功');
 *     // 應用程式初始化邏輯
 *   } catch (error) {
 *     console.error('無法連接到資料庫:', error);
 *   }
 * }
 * ```
 */
export const connectMongoDB = async (): Promise<typeof mongoose> => {
  try {
    // 檢查現有連接狀態 - readyState === 1 表示已連接
    if (mongoose.connection.readyState === 1) {
      console.log("📡 使用現有的 MongoDB 連接");
      return mongoose;
    }

    // 建構MongoDB連接字串
    const mongoUrl = buildMongoUrl();
    console.log("正在連接 MongoDB...");
    // 隱藏密碼顯示連接字串，確保日誌安全性
    console.log("連接字串:", mongoUrl.replace(/\/\/.*@/, "//***:***@"));

    // 使用配置選項建立連接
    await mongoose.connect(mongoUrl, mongoOptions);

    console.log("✅ MongoDB 連接成功");

    // 監聽連接事件 - 設定錯誤處理監聽器
    mongoose.connection.on("error", (error: Error) => {
      console.error("❌ MongoDB 連接錯誤:", error);
    });

    // 監聽斷開連接事件
    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  MongoDB 連接已斷開");
    });

    // 監聽重新連接事件
    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB 重新連接成功");
    });

    // 返回mongoose實例供後續使用
    return mongoose;
  } catch (error) {
    // 連接失敗時記錄錯誤並終止程序
    console.error("❌ MongoDB 連接失敗:", error);
    process.exit(1);
  }
};

/**
 * 斷開MongoDB連接
 * 
 * 安全地關閉與MongoDB的連接。只有在連接存在時才會執行斷開操作，
 * 包含錯誤處理以確保斷開過程的穩定性。
 * 
 * 斷開流程：
 * 1. 檢查連接狀態
 * 2. 執行斷開操作
 * 3. 記錄結果
 * 4. 處理可能的錯誤
 * 
 * @function disconnectMongoDB
 * @returns {Promise<void>}
 * 
 * @example
 * ```typescript
 * import { disconnectMongoDB } from './MongoDBConfig';
 * 
 * // 在應用程式關閉時調用
 * process.on('SIGINT', async () => {
 *   await disconnectMongoDB();
 *   process.exit(0);
 * });
 * ```
 */
export const disconnectMongoDB = async (): Promise<void> => {
  try {
    // 檢查連接狀態 - readyState !== 0 表示有連接存在
    if (mongoose.connection.readyState !== 0) {
      // 執行斷開連接操作
      await mongoose.disconnect();
      console.log("📴 MongoDB 連接已關閉");
    }
  } catch (error) {
    // 處理斷開連接時可能發生的錯誤
    console.error("❌ MongoDB 斷開連接時發生錯誤:", error);
  }
};

/**
 * 取得Mongoose實例
 * 
 * 返回當前的mongoose實例，可用於直接訪問mongoose的功能。
 * 此函數提供對底層mongoose實例的直接訪問，便於進行高級操作。
 * 
 * @function getMongoose
 * @returns {typeof mongoose} mongoose實例
 * 
 * @example
 * ```typescript
 * import { getMongoose } from './MongoDBConfig';
 * 
 * const mongoose = getMongoose();
 * const connectionState = mongoose.connection.readyState;
 * ```
 */
export const getMongoose = (): typeof mongoose => {
  // 直接返回mongoose實例，提供完整的mongoose功能訪問
  return mongoose;
};

/**
 * 檢查MongoDB連接狀態
 * 
 * 檢查當前是否已成功連接到MongoDB資料庫。
 * 此函數提供快速的連接狀態檢查，適合在執行資料庫操作前使用。
 * 
 * 連接狀態說明：
 * - 0: 斷開連接 (disconnected)
 * - 1: 已連接 (connected)
 * - 2: 正在連接 (connecting)
 * - 3: 正在斷開連接 (disconnecting)
 * 
 * @function isMongoConnected
 * @returns {boolean} 如果已連接返回true，否則返回false
 * 
 * @example
 * ```typescript
 * import { isMongoConnected } from './MongoDBConfig';
 * 
 * if (isMongoConnected()) {
 *   console.log('資料庫已連接');
 * } else {
 *   console.log('資料庫未連接');
 * }
 * ```
 */
export const isMongoConnected = (): boolean => {
  // 檢查連接狀態是否為1（已連接）
  return mongoose.connection.readyState === 1;
};

/**
 * 取得MongoDB連接字串
 * 
 * 返回當前使用的MongoDB連接字串，主要用於測試或除錯目的。
 * 注意：返回的字串包含敏感資訊（密碼），請謹慎使用。
 * 
 * 安全警告：
 * - 此函數返回的字串包含認證資訊
 * - 請勿在生產環境中記錄此資訊
 * - 僅用於開發和除錯目的
 * 
 * @function getMongoUrl
 * @returns {string} MongoDB連接字串
 * 
 * @example
 * ```typescript
 * import { getMongoUrl } from './MongoDBConfig';
 * 
 * // 僅用於除錯目的
 * console.log('MongoDB URL:', getMongoUrl());
 * ```
 */
export const getMongoUrl = (): string => {
  // 調用buildMongoUrl函數獲取完整的連接字串
  return buildMongoUrl();
};

/**
 * 向後相容的別名導出
 * 
 * 為了保持向後相容性而提供的舊版函數名稱別名。
 * 建議新代碼使用新的函數名稱。
 * 
 * 這些別名將在未來版本中被移除，請儘快遷移到新的函數名稱。
 * 
 * @deprecated 請使用新的函數名稱
 */
// 連接MongoDB的舊版別名 - 請使用connectMongoDB
export const connectMongo = connectMongoDB;
/** @deprecated 請使用disconnectMongoDB */
// 斷開MongoDB的舊版別名 - 請使用disconnectMongoDB
export const disconnectMongo = disconnectMongoDB;
/** @deprecated 請使用getMongoose */
// 獲取mongoose實例的舊版別名 - 請使用getMongoose
export const getMongoDB = getMongoose;

// 導出MongoDB配置物件供外部使用
export { mongoConfig };
