/**
 * @fileoverview 資料庫配置
 * 
 * 【設計意圖 (Intention)】
 * 提供資料庫連線配置和連線池管理，確保歸檔處理器能夠安全高效地執行數據操作
 * 
 * 【實作架構 (Implementation Architecture)】
 * - 使用 PostgreSQL 作為資料庫驅動
 * - 配置連線池防止連線耗盡
 * - 支援事務操作確保數據一致性
 */

import { Pool, PoolClient } from 'pg';
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
export class PostgreSQLDatabaseConnection implements DatabaseConnection {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      max: config.connectionLimit,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 60000,
    });
  }

  /**
   * 執行 SQL 查詢
   */
  async query(sql: string, params?: any[]): Promise<any[]> {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  /**
   * 執行事務操作
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 批次插入數據
   */
  async batchInsert(tableName: string, records: Record<string, any>[], batchSize = 1000): Promise<number> {
    if (records.length === 0) return 0;

    const columns = Object.keys(records[0]);
    let totalInserted = 0;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const values: any[] = [];
      const placeholders: string[] = [];

      batch.forEach((record, recordIndex) => {
        const recordPlaceholders: string[] = [];
        columns.forEach((column, columnIndex) => {
          const paramIndex = recordIndex * columns.length + columnIndex + 1;
          recordPlaceholders.push(`$${values.length + 1}`);
          values.push(record[column]);
        });
        placeholders.push(`(${recordPlaceholders.join(', ')})`);
      });

      const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${placeholders.join(', ')}`;
      await this.query(sql, values);
      totalInserted += batch.length;
    }

    return totalInserted;
  }

  /**
   * 批次刪除數據
   */
  async batchDelete(tableName: string, condition: string, params?: any[], batchSize = 1000): Promise<number> {
    const sql = `DELETE FROM ${tableName} WHERE ${condition} AND ctid IN (SELECT ctid FROM ${tableName} WHERE ${condition} LIMIT ${batchSize})`;
    let totalDeleted = 0;
    let deletedCount = 0;

    do {
      const result = await this.pool.query(sql, params);
      deletedCount = result.rowCount || 0;
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