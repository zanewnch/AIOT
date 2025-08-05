/**
 * @fileoverview 資料庫配置模組
 * 此模組提供 Sequelize ORM 的資料庫連接配置和實例建立
 * 包含 RBAC（角色基礎存取控制）模型、無人機相關模型和即時狀態模型的配置
 */

// 匯入 Sequelize TypeScript 版本用於 ORM 操作
import { Sequelize } from 'sequelize-typescript';
// 匯入使用者模型用於使用者資料管理
import { UserModel } from '../models/rbac/UserModel.js';
// 匯入角色模型用於角色管理
import { RoleModel } from '../models/rbac/RoleModel.js';
// 匯入權限模型用於權限管理
import { PermissionModel } from '../models/rbac/PermissionModel.js';
// 匯入使用者角色關聯模型用於使用者和角色的多對多關係
import { UserRoleModel } from '../models/rbac/UserToRoleModel.js';
// 匯入角色權限關聯模型用於角色和權限的多對多關係
import { RolePermissionModel } from '../models/rbac/RoleToPermissionModel.js';
// 匯入無人機位置模型用於位置資料管理
import { DronePositionModel } from '../models/drone/DronePositionModel.js';
// 匯入無人機狀態模型用於基本狀態管理
import { DroneStatusModel } from '../models/drone/DroneStatusModel.js';
// 匯入無人機即時狀態模型用於即時狀態追蹤
import { DroneRealTimeStatusModel } from '../models/drone/DroneRealTimeStatusModel.js';
// 匯入無人機指令模型用於指令管理
import { DroneCommandModel } from '../models/drone/DroneCommandModel.js';
// 匯入無人機指令歷史模型用於指令歷史管理
import { DroneCommandsArchiveModel } from '../models/drone/DroneCommandsArchiveModel.js';
// 匯入無人機位置歷史模型用於位置歷史管理
import { DronePositionsArchiveModel } from '../models/drone/DronePositionsArchiveModel.js';
// 匯入無人機狀態歷史模型用於狀態歷史管理
import { DroneStatusArchiveModel } from '../models/drone/DroneStatusArchiveModel.js';
// 匯入歷史任務模型用於歷史任務管理
import { ArchiveTaskModel } from '../models/drone/ArchiveTaskModel.js';
// 匯入使用者偏好設定模型用於個人化設定
import { UserPreferenceModel } from '../models/UserPreferenceModel.js';

/**
 * 資料庫配置介面
 * 定義連接資料庫所需的所有參數
 */
export interface DatabaseConfig {
  /** 資料庫伺服器主機位址 */
  host: string;
  /** 資料庫名稱 */
  database: string;
  /** 資料庫使用者名稱 */
  username: string;
  /** 資料庫密碼 */
  password: string;
  /** 資料庫連接埠號 */
  port: number;
  /** 資料庫類型，支援多種資料庫系統 */
  dialect: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql';
  /** 日誌記錄設定，可以是布林值或自定義日誌函式 */
  logging: boolean | ((sql: string) => void);
}

/**
 * 獲取資料庫配置物件
 * 從環境變數中讀取資料庫連接參數，如果未設定則使用預設值
 * @returns {DatabaseConfig} 完整的資料庫配置物件
 */
export const getDatabaseConfig = (): DatabaseConfig => ({
  // 從環境變數獲取資料庫主機位址，Docker 環境下使用容器名稱
  host: process.env.DB_HOST || 'aiot-mysqldb',
  // 從環境變數獲取資料庫名稱，預設為 main_db
  database: process.env.DB_NAME || 'main_db',
  // 從環境變數獲取資料庫使用者名稱，預設為 admin
  username: process.env.DB_USER || 'admin',
  // 從環境變數獲取資料庫密碼，預設為 admin
  password: process.env.DB_PASSWORD || 'admin',
  // 從環境變數獲取資料庫埠號並轉換為整數，預設為 3306（MySQL 預設埠）
  port: parseInt(process.env.DB_PORT || '3306'),
  // 設定資料庫類型為 MySQL
  dialect: 'mysql',
  // 根據環境設定日誌記錄：開發環境顯示 SQL 查詢，生產環境關閉日誌
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

/**
 * 建立並配置 Sequelize 實例
 * 使用資料庫配置建立 Sequelize 連接實例，並註冊所有模型
 * @returns {Sequelize} 配置完成的 Sequelize 實例
 */
export const createSequelizeInstance = (): Sequelize => {
  // 獲取資料庫配置
  const config = getDatabaseConfig();

  // 建立新的 Sequelize 實例並配置
  return new Sequelize({
    // 展開資料庫配置物件的所有屬性
    ...config,
    // 註冊所有需要的模型到 Sequelize 實例中，包含 RBAC 模型、無人機相關模型和使用者偏好模型
    models: [UserModel, RoleModel, PermissionModel, UserRoleModel, RolePermissionModel, DronePositionModel, DroneStatusModel, DroneRealTimeStatusModel, DroneCommandModel, DroneCommandsArchiveModel, DronePositionsArchiveModel, DroneStatusArchiveModel, ArchiveTaskModel, UserPreferenceModel],
  });
};