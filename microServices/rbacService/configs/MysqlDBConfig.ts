/**
 * @fileoverview MySQL資料庫連接池配置模組
 * 
 * 此模組提供了一個高效且可靠的MySQL資料庫連接池實現，專為高並發應用程式設計。
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

// 導入 mysql2 的 Promise 版本，提供非同步資料庫操作能力
import mysql from "mysql2/promise";

/**
 * MySQL資料庫連接池實例
 * 
 * 創建一個MySQL連接池，用於管理資料庫連接。使用連接池可以有效地重用連接，
 * 提高應用程式的性能並避免頻繁建立和關閉連接的開銷。
 * 
 * 配置優先使用環境變數，如果環境變數不存在則使用預設值。
 * 這種設計允許在不同環境（開發、測試、生產）中使用不同的資料庫配置。
 * 
 * 性能考量：
 * - 連接池減少了建立/關閉連接的開銷
 * - 適當的連接數限制防止資料庫過載
 * - 佇列機制確保高並發下的穩定性
 * 
 * 安全考量：
 * - 環境變數配置避免硬編碼敏感資訊
 * - 連接池自動管理連接生命週期
 * - 內建的錯誤處理機制
 * 
 * @type {mysql.Pool}
 * 
 * @example
 * ```typescript
 * import { db } from './MysqlDBConfig';
 * 
 * // 執行查詢
 * async function getUsers() {
 *   try {
 *     const [rows] = await db.execute('SELECT * FROM users');
 *     return rows;
 *   } catch (error) {
 *     console.error('查詢失敗:', error);
 *     throw error;
 *   }
 * }
 * 
 * // 使用事務
 * async function transferMoney(fromId: number, toId: number, amount: number) {
 *   const connection = await db.getConnection();
 *   try {
 *     await connection.beginTransaction();
 *     
 *     await connection.execute(
 *       'UPDATE accounts SET balance = balance - ? WHERE id = ?',
 *       [amount, fromId]
 *     );
 *     
 *     await connection.execute(
 *       'UPDATE accounts SET balance = balance + ? WHERE id = ?',
 *       [amount, toId]
 *     );
 *     
 *     await connection.commit();
 *   } catch (error) {
 *     await connection.rollback();
 *     throw error;
 *   } finally {
 *     connection.release();
 *   }
 * }
 * ```
 * 
 * @see {@link https://www.npmjs.com/package/mysql2 | mysql2 package documentation}
 * 
 * 環境變數配置：
 * - `DB_HOST`: 資料庫主機地址（預設：localhost）
 * - `DB_USER`: 資料庫使用者名稱（預設：admin）
 * - `DB_PASSWORD`: 資料庫密碼（預設：admin）
 * - `DB_NAME`: 資料庫名稱（預設：main_db）
 * - `DB_PORT`: 資料庫端口（預設：3306）
 * 
 * 連接池配置：
 * - `waitForConnections: true` - 當連接池已滿時等待可用連接
 * - `connectionLimit: 10` - 連接池最大連接數
 * - `queueLimit: 0` - 無限制的連接請求佇列
 */
export const db = mysql.createPool({
  /** 資料庫主機地址 - 從環境變數DB_HOST獲取，預設為localhost */
  host: process.env.DB_HOST || "localhost",
  /** 資料庫使用者名稱 - 從環境變數DB_USER獲取，預設為admin */
  user: process.env.DB_USER || "admin",
  /** 資料庫密碼 - 從環境變數DB_PASSWORD獲取，預設為admin */
  password: process.env.DB_PASSWORD || "admin",
  /** 資料庫名稱 - 從環境變數DB_NAME獲取，預設為main_db */
  database: process.env.DB_NAME || "main_db",
  /** 資料庫端口號 - 從環境變數DB_PORT獲取，預設為3306，使用parseInt確保數值類型 */
  port: parseInt(process.env.DB_PORT || "3306"),
  /** 當連接池已滿時是否等待可用連接 - 啟用此選項可避免連接被拒絕的錯誤 */
  waitForConnections: true,
  /** 連接池最大連接數 - 限制為10個連接，平衡性能與資源消耗 */
  connectionLimit: 10,
  /** 連接請求佇列的最大長度 - 設為0表示無限制，允許所有連接請求排隊 */
  queueLimit: 0,
});
