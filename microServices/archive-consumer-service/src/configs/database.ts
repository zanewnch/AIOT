/**
 * @fileoverview 資料庫配置
 * 
 * 【設計意圖 (Intention)】
 * 提供資料庫連線配置和連線池管理，確保歸檔處理器能夠安全高效地執行數據操作
 * 
 * 【實作架構 (Implementation Architecture)】
 * - 使用 MySQL2 作為資料庫驅動
 * - 配置連線池防止連線耗盡
 * - 支援事務操作確保數據一致性
 */

import mysql from 'mysql2/promise';
import { DatabaseConnection } from '../types/processor.types';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  connectionLimit: number;
}

/**
 * 資料庫連線服務實作
 * 
 * 【核心功能】
 * - 提供基本的查詢操作
 * - 支援事務處理
 * - 實作批次插入和刪除操作
 */
export class MySQLDatabaseConnection implements DatabaseConnection {
  private pool: mysql.Pool;

  constructor(config: DatabaseConfig) {
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: config.connectionLimit,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000
    });
  }

  /**
   * 執行 SQL 查詢
   */
  async query(sql: string, params?: any[]): Promise<any[]> {
    const [rows] = await this.pool.execute(sql, params);
    return rows as any[];
  }

  /**
   * 執行事務操作
   */
  async transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 批次插入數據
   */
  async batchInsert(tableName: string, records: Record<string, any>[], batchSize = 1000): Promise<number> {
    if (records.length === 0) return 0;

    const columns = Object.keys(records[0]);
    const placeholders = `(${columns.map(() => '?').join(', ')})`;
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES `;

    let totalInserted = 0;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const values: any[] = [];
      const batchPlaceholders: string[] = [];

      batch.forEach(record => {
        batchPlaceholders.push(placeholders);
        columns.forEach(column => {
          values.push(record[column]);
        });
      });

      const batchSql = sql + batchPlaceholders.join(', ');
      await this.query(batchSql, values);
      totalInserted += batch.length;
    }

    return totalInserted;
  }

  /**
   * 批次刪除數據
   */
  async batchDelete(tableName: string, condition: string, params?: any[], batchSize = 1000): Promise<number> {
    const sql = `DELETE FROM ${tableName} WHERE ${condition} LIMIT ${batchSize}`;
    let totalDeleted = 0;
    let deletedCount = 0;

    do {
      const result: any = await this.query(sql, params);
      deletedCount = result.affectedRows || 0;
      totalDeleted += deletedCount;
    } while (deletedCount === batchSize);

    return totalDeleted;
  }

  /**
   * 關閉連線池
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}