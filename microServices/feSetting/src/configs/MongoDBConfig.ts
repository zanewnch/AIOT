/**
 * @fileoverview MongoDB資料庫連接配置模組 - FESETTING 服務
 * 
 * 此模組提供了完整的MongoDB資料庫連接管理功能，專為 FESETTING 服務優化。
 * 包括連接建立、斷開、狀態監控和錯誤處理。
 * 
 * 主要特性：
 * - 自動重連機制
 * - 連接池管理
 * - 環境變數優先配置
 * - 完整的連接生命週期管理
 * - 詳細的連接狀態監控
 * - 生產環境優化的參數配置
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import mongoose from "mongoose";

/**
 * MongoDB連接配置介面
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
 * FESETTING 服務的 MongoDB 連接配置
 */
const mongoConfig: MongoConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "27017"),
  database: process.env.DB_NAME || "user_preference_db",
  username: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "admin",
  authSource: "admin",
};

/**
 * 建構MongoDB連接字串
 */
const buildMongoUrl = (): string => {
  if (process.env.MONGODB_URL) {
    return process.env.MONGODB_URL;
  }

  const { host, port, database, username, password, authSource } = mongoConfig;
  return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=${authSource}`;
};

/**
 * Mongoose連接選項配置
 */
const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  bufferCommands: false,
  bufferMaxEntries: 0,
};

/**
 * 連接到MongoDB資料庫
 */
export const connectMongoDB = async (): Promise<typeof mongoose> => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("📡 [FESETTING] 使用現有的 MongoDB 連接");
      return mongoose;
    }

    const mongoUrl = buildMongoUrl();
    console.log("[FESETTING] 正在連接 MongoDB...");
    console.log("[FESETTING] 連接字串:", mongoUrl.replace(/\/\/.*@/, "//***:***@"));

    await mongoose.connect(mongoUrl, mongoOptions);
    console.log("✅ [FESETTING] MongoDB 連接成功");

    mongoose.connection.on("error", (error: Error) => {
      console.error("❌ [FESETTING] MongoDB 連接錯誤:", error);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ [FESETTING] MongoDB 連接已斷開");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 [FESETTING] MongoDB 重新連接成功");
    });

    return mongoose;
  } catch (error) {
    console.error("❌ [FESETTING] MongoDB 連接失敗:", error);
    process.exit(1);
  }
};

/**
 * 斷開MongoDB連接
 */
export const disconnectMongoDB = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("📴 [FESETTING] MongoDB 連接已關閉");
    }
  } catch (error) {
    console.error("❌ [FESETTING] MongoDB 斷開連接時發生錯誤:", error);
  }
};

/**
 * 取得Mongoose實例
 */
export const getMongoose = (): typeof mongoose => {
  return mongoose;
};

/**
 * 檢查MongoDB連接狀態
 */
export const isMongoConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

/**
 * 取得MongoDB連接字串
 */
export const getMongoUrl = (): string => {
  return buildMongoUrl();
};

// 向後相容的別名導出
export const connectMongo = connectMongoDB;
export const disconnectMongo = disconnectMongoDB;
export const getMongoDB = getMongoose;

export { mongoConfig };