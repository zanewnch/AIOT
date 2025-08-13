/**
 * @fileoverview MySQL資料庫連接池配置模組 - GENERAL 服務
 * 
 * 此模組提供了一個高效且可靠的MySQL資料庫連接池實現，專為 GENERAL 服務設計。
 * 連接池可以有效管理資料庫連接，避免頻繁建立和關閉連接的開銷，提升應用程式性能。
 * 
 * 主要特性：
 * - 自動連接管理和回收
 * - 環境變數優先的配置系統
 * - 生產環境優化的連接池參數
 * - 完整的錯誤處理和日誌記錄
 * - 支援事務處理
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import mysql from "mysql2/promise";

/**
 * GENERAL 服務的 MySQL 資料庫連接池實例
 * 
 * 創建一個MySQL連接池，用於管理 GENERAL 服務的資料庫連接。
 * 預設資料庫名稱為 user_preference_db，可透過環境變數 DB_NAME 覆蓋。
 * 
 * @type {mysql.Pool}
 */
export const db = mysql.createPool({
  /** 資料庫主機地址 - 從環境變數DB_HOST獲取，預設為localhost */
  host: process.env.DB_HOST || "localhost",
  /** 資料庫使用者名稱 - 從環境變數DB_USER獲取，預設為admin */
  user: process.env.DB_USER || "admin",
  /** 資料庫密碼 - 從環境變數DB_PASSWORD獲取，預設為admin */
  password: process.env.DB_PASSWORD || "admin",
  /** 資料庫名稱 - 從環境變數DB_NAME獲取，預設為user_preference_db */
  database: process.env.DB_NAME || "user_preference_db",
  /** 資料庫端口號 - 從環境變數DB_PORT獲取，預設為3306 */
  port: parseInt(process.env.DB_PORT || "3306"),
  /** 當連接池已滿時是否等待可用連接 */
  waitForConnections: true,
  /** 連接池最大連接數 - 適合中等負載的應用 */
  connectionLimit: 10,
  /** 連接請求佇列的最大長度 - 設為0表示無限制 */
  queueLimit: 0,
});

/**
 * 測試資料庫連接
 * 
 * @returns {Promise<boolean>} 連接成功返回true，否則返回false
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await db.getConnection();
    console.log("✅ [GENERAL] MySQL 資料庫連接成功");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ [GENERAL] MySQL 資料庫連接失敗:", error);
    return false;
  }
};

/**
 * 關閉資料庫連接池
 * 
 * @returns {Promise<void>}
 */
export const closeConnection = async (): Promise<void> => {
  try {
    await db.end();
    console.log("📴 [GENERAL] MySQL 連接池已關閉");
  } catch (error) {
    console.error("❌ [GENERAL] 關閉 MySQL 連接池時發生錯誤:", error);
  }
};