/**
 * @fileoverview 前端服務簡化資料庫配置
 * 
 * 注意：根據微服務架構原則，前端服務主要作為 API Gateway
 * 不直接操作資料庫，而是通過 API 調用其他微服務
 * 
 * 此文件保留基本的資料庫連接配置作為備用
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-08
 */

import { Sequelize } from 'sequelize-typescript';
import { UserPreferenceModel } from '../models/UserPreferenceModel.js';

/**
 * 資料庫配置界面
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  dialect: 'mysql' | 'postgres';
}

/**
 * 建立基本資料庫連接（僅用於必要的本地資料）
 */
export function createDatabase(config: DatabaseConfig): Sequelize {
  const sequelize = new Sequelize({
    host: config.host,
    port: config.port,
    database: config.database,
    username: config.username,
    password: config.password,
    dialect: config.dialect,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    models: [
      // 只包含前端服務直接需要的模型
      UserPreferenceModel,
    ],
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });

  return sequelize;
}

/**
 * 預設資料庫配置
 */
export const defaultDatabaseConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'aiot_frontend',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  dialect: (process.env.DB_DIALECT as 'mysql' | 'postgres') || 'mysql',
};

/**
 * 建立 Sequelize 實例的便利函數（向後相容）
 */
export function createSequelizeInstance(): Sequelize {
  return createDatabase(defaultDatabaseConfig);
}