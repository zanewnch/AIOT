/**
 * @fileoverview General Service Sequelize CLI 資料庫配置
 * 用於用戶偏好設定遷移管理和 Schema 版本控制
 */

require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'user_preference_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5435,
    dialect: 'postgres',
    logging: console.log,
    
    // 遷移表配置
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'general_sequelize_meta',
    
    // 連接池配置（遷移專用）
    pool: {
      max: 5,
      min: 1,
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
    database: process.env.DB_NAME_TEST || 'user_preference_db_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5435,
    dialect: 'postgres',
    logging: false,
    
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'general_sequelize_meta',
    
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
    port: process.env.DB_PORT || 5435,
    dialect: 'postgres',
    logging: false,
    
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'general_sequelize_meta',
    
    // 生產環境連接池配置（read-heavy 服務）
    pool: {
      max: 18,
      min: 5,
      acquire: 45000,
      idle: 60000
    },
    
    dialectOptions: {
      connectTimeout: 60000,
      acquireTimeout: 90000,
      timeout: 90000,
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