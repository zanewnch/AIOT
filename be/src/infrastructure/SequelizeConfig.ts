/**
 * Sequelize ORM 初始化
 * ====================
 * 這個檔案負責建立並匯出 *單例* 的 `Sequelize` 實例，供整個 Express 專案使用。
 * 與先前的 `mysqlConfig.ts` 差異：
 *   • `mysqlConfig.ts` 直接使用 `mysql2/promise` 建立 *Connection Pool*，開發者必須撰寫原生 SQL。 
 *   • `sequelize.ts` 利用 *Sequelize ORM* 封裝資料庫，開發者可以以 *Model* 方式操作資料、建立關聯，並且支援 migration / transaction / eager loading… 等高階功能。
 *   • 兩者可以並存；如欲全面改用 ORM，後續查詢請透過各 Model (UserModel、RoleModel…)
 *
 * 此檔同時將 RBAC 相關 Model（UserModel、RoleModel、PermissionModel…）註冊到 Sequelize，
 * 以便自動建立關聯。
 *
 * 使用方式：
 *   import sequelize from '../infrastructure/sequelize.js';
 *   await sequelize.authenticate();
 *   await sequelize.sync(); // dev 階段自動建表，正式環境建議改用 migration
 * 
 * 
 * 
 * 
 * RBAC（Role-Based Access Control）：基於角色的訪問控制，通過給用戶分配角色來管理權限，簡化安全管理。
 * Sequelize：Node.js的ORM（對象關係映射）工具，用於簡化數據庫操作，支持多種數據庫（如MySQL、PostgreSQL），比直接使用mysql2更高層次、更易用。
 * mysql2：Node.js的MySQL數據庫驅動，直接與MySQL交互，低層次、靈活，但需要手寫SQL。
 * 建議：RBAC用於權限管理，Sequelize適合快速開發，mysql2適合需要高控制的場景。
 */
import { Sequelize } from 'sequelize-typescript';
// Sequelize 初始化檔，匯出單一實例供全專案使用

import { UserModel } from '../models/rbac/UserModel.js';
import { RoleModel } from '../models/rbac/RoleModel.js';
import { PermissionModel } from '../models/rbac/PermissionModel.js';
import { UserRoleModel } from '../models/rbac/UserToRoleModel.js';
import { RolePermissionModel } from '../models/rbac/RoleToPermissionModel.js';

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'aiot-mysqldb',
  database: process.env.DB_NAME || 'main_db',
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
  port: parseInt(process.env.DB_PORT || '3306'),
  dialect: 'mysql',
  models: [UserModel, RoleModel, PermissionModel, UserRoleModel, RolePermissionModel],
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

export default sequelize;
