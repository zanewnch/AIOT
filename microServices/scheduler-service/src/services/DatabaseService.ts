/**
 * @fileoverview 資料庫服務類別
 * 
 * 提供資料庫連線管理和基本操作功能
 */

import { injectable } from 'inversify';
import { Sequelize } from 'sequelize-typescript';
import mysql from 'mysql2/promise';
import { Logger } from 'winston';
import { ArchiveTaskModel } from '@/models/ArchiveTaskModel';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  dialect: 'mysql';
  pool?: {
    max?: number;
    min?: number;
    acquire?: number;
    idle?: number;
  };
  logging?: boolean | ((sql: string) => void);
}

export interface DatabaseConnection {
  query(sql: string, params?: any[]): Promise<any[]>;
}

@injectable()
export class DatabaseService implements DatabaseConnection {
  private sequelize: Sequelize | null = null;
  private connection: mysql.Connection | null = null;

  constructor(
    private config: DatabaseConfig,
    private logger: Logger
  ) {}

  /**
   * 初始化資料庫連線
   */
  initialize = async (): Promise<void> => {
    try {
      // 初始化 Sequelize ORM
      this.sequelize = new Sequelize({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
        database: this.config.database,
        dialect: this.config.dialect,
        models: [ArchiveTaskModel],
        pool: {
          max: this.config.pool?.max || 20,
          min: this.config.pool?.min || 5,
          acquire: this.config.pool?.acquire || 30000,
          idle: this.config.pool?.idle || 10000
        },
        logging: this.config.logging === true ? (sql: string) => this.logger.debug('SQL Query', { sql }) : false,
        define: {
          underscored: false,
          timestamps: true
        },
        timezone: '+08:00'
      });

      // 測試連線
      await this.sequelize.authenticate();

      // 同步模型 (開發環境)
      if (process.env.NODE_ENV === 'development') {
        await this.sequelize.sync({ alter: false });
      }

      // 初始化原生 MySQL 連線 (用於複雜查詢)
      this.connection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        user: this.config.username,
        password: this.config.password,
        database: this.config.database,
        timezone: '+08:00'
      });

      this.logger.info('Database service initialized successfully', {
        host: this.config.host,
        database: this.config.database
      });

    } catch (error) {
      this.logger.error('Failed to initialize database service', error);
      throw error;
    }
  };

  /**
   * 執行 SQL 查詢
   */
  query = async (sql: string, params: any[] = []): Promise<any[]> => {
    if (!this.connection) {
      throw new Error('Database connection not initialized');
    }

    try {
      const [rows] = await this.connection.execute(sql, params);
      return Array.isArray(rows) ? rows : [rows];
    } catch (error) {
      this.logger.error('Database query failed', { error, sql, params });
      throw error;
    }
  };

  /**
   * 執行事務
   */
  transaction = async <T>(callback: (connection: mysql.Connection) => Promise<T>): Promise<T> => {
    if (!this.connection) {
      throw new Error('Database connection not initialized');
    }

    await this.connection.beginTransaction();

    try {
      const result = await callback(this.connection);
      await this.connection.commit();
      return result;
    } catch (error) {
      await this.connection.rollback();
      this.logger.error('Transaction failed and rolled back', error);
      throw error;
    }
  };

  /**
   * 批量插入數據
   */
  batchInsert = async (
    tableName: string, 
    records: Record<string, any>[], 
    batchSize: number = 1000
  ): Promise<number> => {
    if (!records.length) return 0;

    let totalInserted = 0;
    const fields = Object.keys(records[0]);
    const placeholders = `(${fields.map(() => '?').join(', ')})`;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const values = batch.flatMap(record => fields.map(field => record[field]));
      const batchPlaceholders = batch.map(() => placeholders).join(', ');

      const sql = `
        INSERT INTO ${tableName} (${fields.map(f => `\`${f}\``).join(', ')}) 
        VALUES ${batchPlaceholders}
      `;

      try {
        const [result] = await this.connection!.execute(sql, values) as any[];
        totalInserted += result.affectedRows || 0;

        this.logger.debug('Batch insert completed', {
          tableName,
          batchSize: batch.length,
          totalInserted
        });

      } catch (error) {
        this.logger.error('Batch insert failed', { error, tableName, batchSize: batch.length });
        throw error;
      }
    }

    return totalInserted;
  };

  /**
   * 批量更新數據
   */
  batchUpdate = async (
    tableName: string,
    updates: { condition: string; values: any[]; setClause: string }[],
    batchSize: number = 1000
  ): Promise<number> => {
    let totalUpdated = 0;

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);

      for (const update of batch) {
        const sql = `UPDATE ${tableName} SET ${update.setClause} WHERE ${update.condition}`;

        try {
          const [result] = await this.connection!.execute(sql, update.values) as any[];
          totalUpdated += result.affectedRows || 0;
        } catch (error) {
          this.logger.error('Batch update failed', { error, sql, values: update.values });
          throw error;
        }
      }

      this.logger.debug('Batch update progress', {
        tableName,
        processed: Math.min(i + batchSize, updates.length),
        total: updates.length,
        totalUpdated
      });
    }

    return totalUpdated;
  };

  /**
   * 批量刪除數據
   */
  batchDelete = async (
    tableName: string,
    condition: string,
    params: any[] = [],
    batchSize: number = 1000
  ): Promise<number> => {
    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const sql = `DELETE FROM ${tableName} WHERE ${condition} LIMIT ?`;
      const queryParams = [...params, batchSize];

      try {
        const [result] = await this.connection!.execute(sql, queryParams) as any[];
        const deletedCount = result.affectedRows || 0;
        
        totalDeleted += deletedCount;
        hasMore = deletedCount === batchSize;

        this.logger.debug('Batch delete progress', {
          tableName,
          deletedCount,
          totalDeleted,
          hasMore
        });

        // 短暫暫停避免長時間鎖表
        if (hasMore) {
          await this.delay(50);
        }

      } catch (error) {
        this.logger.error('Batch delete failed', { error, sql: sql.replace(' LIMIT ?', ''), params });
        throw error;
      }
    }

    return totalDeleted;
  };

  /**
   * 檢查表是否存在
   */
  tableExists = async (tableName: string): Promise<boolean> => {
    try {
      const sql = `
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_name = ?
      `;
      
      const result = await this.query(sql, [this.config.database, tableName]);
      return result[0]?.count > 0;
    } catch (error) {
      this.logger.error('Failed to check table existence', { error, tableName });
      return false;
    }
  };

  /**
   * 獲取表統計信息
   */
  getTableStats = async (tableName: string): Promise<{
    rowCount: number;
    dataLength: number;
    indexLength: number;
    autoIncrement: number | null;
  } | null> => {
    try {
      const sql = `
        SELECT 
          table_rows as rowCount,
          data_length as dataLength,
          index_length as indexLength,
          auto_increment as autoIncrement
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_name = ?
      `;
      
      const result = await this.query(sql, [this.config.database, tableName]);
      return result[0] || null;
    } catch (error) {
      this.logger.error('Failed to get table stats', { error, tableName });
      return null;
    }
  };

  /**
   * 檢查資料庫連線健康狀態
   */
  isHealthy = async (): Promise<boolean> => {
    try {
      if (!this.sequelize || !this.connection) {
        return false;
      }

      // 測試 Sequelize 連線
      await this.sequelize.authenticate();
      
      // 測試原生連線
      await this.connection.ping();

      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  };

  /**
   * 獲取資料庫連線狀態
   */
  getConnectionStats = async (): Promise<{
    sequelizeConnected: boolean;
    mysqlConnected: boolean;
    poolInfo?: any;
  }> => {
    try {
      const stats = {
        sequelizeConnected: false,
        mysqlConnected: false,
        poolInfo: null
      };

      if (this.sequelize) {
        try {
          await this.sequelize.authenticate();
          stats.sequelizeConnected = true;
          stats.poolInfo = this.sequelize.connectionManager.pool;
        } catch (error) {
          this.logger.warn('Sequelize connection check failed', error);
        }
      }

      if (this.connection) {
        try {
          await this.connection.ping();
          stats.mysqlConnected = true;
        } catch (error) {
          this.logger.warn('MySQL connection check failed', error);
        }
      }

      return stats;
    } catch (error) {
      this.logger.error('Failed to get connection stats', error);
      return {
        sequelizeConnected: false,
        mysqlConnected: false,
        poolInfo: null
      };
    }
  };

  /**
   * 關閉資料庫連線
   */
  close = async (): Promise<void> => {
    try {
      if (this.connection) {
        await this.connection.end();
        this.connection = null;
      }

      if (this.sequelize) {
        await this.sequelize.close();
        this.sequelize = null;
      }

      this.logger.info('Database connections closed');
    } catch (error) {
      this.logger.error('Error closing database connections', error);
      throw error;
    }
  };

  /**
   * 獲取 Sequelize 實例
   */
  getSequelize = (): Sequelize | null => {
    return this.sequelize;
  };

  /**
   * 獲取原生 MySQL 連線
   */
  getMySQLConnection = (): mysql.Connection | null => {
    return this.connection;
  };

  /**
   * 延遲函數
   */
  private delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
}