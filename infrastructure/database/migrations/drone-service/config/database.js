/**
 * @fileoverview Drone Service Sequelize CLI 資料庫配置
 * 用於無人機數據遷移管理和 Schema 版本控制
 */

require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'drone_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    dialect: 'postgres',
    logging: console.log,
    
    // 遷移表配置
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'drone_sequelize_meta',
    
    // 連接池配置（遷移專用）
    pool: {
      max: 8,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    
    // PostgreSQL 特定配置
    dialectOptions: {
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000
    },
    
    // 遷移選項
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  },
  
  test: {
    username: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME_TEST || 'drone_db_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    dialect: 'postgres',
    logging: false,
    
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'drone_sequelize_meta',
    
    pool: {
      max: 5,
      min: 1,
      acquire: 30000,
      idle: 10000
    }
  },
  
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5433,
    dialect: 'postgres',
    logging: false,
    
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'drone_sequelize_meta',
    
    // 生產環境連接池配置（write-heavy 服務）
    pool: {
      max: 25,
      min: 8,
      acquire: 45000,
      idle: 20000
    },
    
    dialectOptions: {
      connectTimeout: 60000,
      acquireTimeout: 90000,
      timeout: 120000, // 無人機數據可能需要較長處理時間
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    
    // 生產環境遷移安全設定
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    },
    
    // 遷移鎖定機制
    retry: {
      max: 3,
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /EHOSTDOWN/,
        /ENETDOWN/,
        /ENETUNREACH/,
        /EAI_AGAIN/
      ]
    }
  }
};