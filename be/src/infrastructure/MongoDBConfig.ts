import mongoose from "mongoose";

/**
 * MongoDB連接配置介面
 * 
 * 定義連接MongoDB所需的所有配置參數，包括主機、端口、
 * 資料庫名稱、認證資訊等。
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
  /** MongoDB主機地址 */
  host: string;
  /** MongoDB端口號 */
  port: number;
  /** 資料庫名稱 */
  database: string;
  /** 使用者名稱 */
  username: string;
  /** 密碼 */
  password: string;
  /** 認證來源資料庫 */
  authSource: string;
}

/**
 * MongoDB連接配置
 * 
 * 基於docker-compose.yml設定的預設MongoDB連接參數。
 * 在生產環境中應該透過環境變數覆蓋這些設定。
 * 
 * @type {MongoConfig}
 */
const mongoConfig: MongoConfig = {
  host: "localhost",
  port: 27017,
  database: "main_db",
  username: "admin",
  password: "admin",
  authSource: "admin",
};

/**
 * 建構MongoDB連接字串
 * 
 * 優先使用環境變數MONGODB_URL，若不存在則根據mongoConfig配置
 * 動態建構標準的MongoDB連接URI。
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
  // 如果有環境變數 MONGODB_URL，直接使用
  if (process.env.MONGODB_URL) {
    return process.env.MONGODB_URL;
  }

  // 否則根據配置建構連接字串
  const { host, port, database, username, password, authSource } = mongoConfig;
  return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=${authSource}`;
};

/**
 * Mongoose連接選項配置
 * 
 * 包含連接池、超時時間和緩衝設定等MongoDB連接的優化參數。
 * 這些設定針對生產環境進行了調優。
 * 
 * @type {mongoose.ConnectOptions}
 */
const mongoOptions = {
  /** 連接池最大連接數 */
  maxPoolSize: 10,
  /** 伺服器選擇超時時間（毫秒） */
  serverSelectionTimeoutMS: 5000,
  /** Socket超時時間（毫秒） */
  socketTimeoutMS: 45000,
  /** 連接超時時間（毫秒） */
  connectTimeoutMS: 10000,
  /** 停用mongoose緩衝命令 */
  bufferCommands: false,
  /** 停用mongoose緩衝項目數量限制 */
  bufferMaxEntries: 0,
};

/**
 * 連接到MongoDB資料庫
 * 
 * 建立與MongoDB的連接，如果已經連接則返回現有連接。
 * 包含完整的錯誤處理、連接事件監聽和日誌記錄。
 * 連接失敗時會終止程序。
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
    if (mongoose.connection.readyState === 1) {
      console.log("📡 使用現有的 MongoDB 連接");
      return mongoose;
    }

    const mongoUrl = buildMongoUrl();
    console.log("正在連接 MongoDB...");
    console.log("連接字串:", mongoUrl.replace(/\/\/.*@/, "//***:***@")); // 隱藏密碼顯示

    await mongoose.connect(mongoUrl, mongoOptions);

    console.log("✅ MongoDB 連接成功");

    // 監聽連接事件
    mongoose.connection.on("error", (error: Error) => {
      console.error("❌ MongoDB 連接錯誤:", error);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  MongoDB 連接已斷開");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB 重新連接成功");
    });

    return mongoose;
  } catch (error) {
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
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("📴 MongoDB 連接已關閉");
    }
  } catch (error) {
    console.error("❌ MongoDB 斷開連接時發生錯誤:", error);
  }
};

/**
 * 取得Mongoose實例
 * 
 * 返回當前的mongoose實例，可用於直接訪問mongoose的功能。
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
  return mongoose;
};

/**
 * 檢查MongoDB連接狀態
 * 
 * 檢查當前是否已成功連接到MongoDB資料庫。
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
  return mongoose.connection.readyState === 1;
};

/**
 * 取得MongoDB連接字串
 * 
 * 返回當前使用的MongoDB連接字串，主要用於測試或除錯目的。
 * 注意：返回的字串包含敏感資訊（密碼），請謹慎使用。
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
  return buildMongoUrl();
};

/**
 * 向後相容的別名導出
 * 
 * 為了保持向後相容性而提供的舊版函數名稱別名。
 * 建議新代碼使用新的函數名稱。
 * 
 * @deprecated 請使用新的函數名稱
 */
export const connectMongo = connectMongoDB;
/** @deprecated 請使用disconnectMongoDB */
export const disconnectMongo = disconnectMongoDB;
/** @deprecated 請使用getMongoose */
export const getMongoDB = getMongoose;

export { mongoConfig };
