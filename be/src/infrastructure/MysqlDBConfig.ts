import mysql from "mysql2/promise";

/**
 * MySQL資料庫連接池配置
 * 
 * 創建一個MySQL連接池，用於管理資料庫連接。使用連接池可以有效地重用連接，
 * 提高應用程式的性能並避免頻繁建立和關閉連接的開銷。
 * 
 * 配置優先使用環境變數，如果環境變數不存在則使用預設值。
 * 這種設計允許在不同環境（開發、測試、生產）中使用不同的資料庫配置。
 * 
 * @constant
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
  /** 資料庫主機地址 */
  host: process.env.DB_HOST || "localhost",
  /** 資料庫使用者名稱 */
  user: process.env.DB_USER || "admin",
  /** 資料庫密碼 */
  password: process.env.DB_PASSWORD || "admin",
  /** 資料庫名稱 */
  database: process.env.DB_NAME || "main_db",
  /** 資料庫端口號 */
  port: parseInt(process.env.DB_PORT || "3306"),
  /** 當連接池已滿時是否等待可用連接 */
  waitForConnections: true,
  /** 連接池最大連接數 */
  connectionLimit: 10,
  /** 連接請求佇列的最大長度，0表示無限制 */
  queueLimit: 0,
});
