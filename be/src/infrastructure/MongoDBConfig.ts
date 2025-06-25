import mongoose from "mongoose";

interface MongoConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  authSource: string;
}

// MongoDB 連接配置 - 基於 docker-compose.yml 設定
const mongoConfig: MongoConfig = {
  host: process.env.NODE_ENV === "development" ? "aiot-mongodb" : "localhost",
  port: 27017,
  database: "main_db",
  username: "admin",
  password: "admin",
  authSource: "admin",
};

// 建構 MongoDB 連接字串
const buildMongoUrl = (): string => {
  // 如果有環境變數 MONGODB_URL，直接使用
  if (process.env.MONGODB_URL) {
    return process.env.MONGODB_URL;
  }

  // 否則根據配置建構連接字串
  const { host, port, database, username, password, authSource } = mongoConfig;
  return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=${authSource}`;
};

// Mongoose 連接選項
const mongoOptions = {
  maxPoolSize: 10, // 連接池最大連接數
  serverSelectionTimeoutMS: 5000, // 伺服器選擇超時時間
  socketTimeoutMS: 45000, // Socket 超時時間
  connectTimeoutMS: 10000, // 連接超時時間
  bufferCommands: false, // 停用 mongoose 緩衝
  bufferMaxEntries: 0, // 停用 mongoose 緩衝
};

// 連接 MongoDB
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

// 斷開 MongoDB 連接
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

// 取得 MongoDB 連接實例
export const getMongoose = (): typeof mongoose => {
  return mongoose;
};

// 檢查 MongoDB 連接狀態
export const isMongoConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

// 取得 MongoDB 連接字串（用於測試或除錯）
export const getMongoUrl = (): string => {
  return buildMongoUrl();
};

// Legacy alias exports for backward compatibility
export const connectMongo = connectMongoDB;
export const disconnectMongo = disconnectMongoDB;
export const getMongoDB = getMongoose;

export default {
  connectMongoDB,
  disconnectMongoDB,
  getMongoose,
  isMongoConnected,
  getMongoUrl,
  mongoConfig,
};
