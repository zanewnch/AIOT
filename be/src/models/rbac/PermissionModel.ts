/**
 * @fileoverview 權限模型定義文件
 * 
 * 本文件定義了 RBAC (Role-Based Access Control) 系統中的權限實體模型。
 * 權限代表系統中的一個特定操作或功能，例如 'user.create', 'article.publish', 'device.delete'。
 * 權限可以被指派給角色，角色再指派給使用者，形成完整的存取控制體系。
 * 
 * @example
 * ```typescript
 * // 範例資料格式
 * const samplePermissionData = {
 *   id: 1,
 *   name: 'user.create',
 *   description: 'Create users',
 *   createdAt: new Date('2025-07-14T17:59:33.000Z'),
 *   updatedAt: new Date('2025-07-14T17:59:33.000Z')
 * };
 * 
 * const samplePermissions = [
 *   { name: 'user.read', description: 'Read users and create Users' },
 *   { name: 'role.create', description: 'Create roles' },
 *   { name: 'permission.delete', description: 'Delete permissions' },
 *   { name: 'rtk.read', description: 'Read RTK data' },
 *   { name: 'data.view', description: 'View data' },
 *   { name: 'system.admin', description: 'System administration' }
 * ];
 * ```
 * 
 * @author AIOT System
 * @version 1.0.0
 * @since 2024
 */

// 導入 Sequelize TypeScript 裝飾器，用於定義資料表模型
import {
  Table,      // 資料表定義裝飾器
  Column,     // 欄位定義裝飾器
  Model,      // 基礎模型類別
  DataType,   // 資料類型定義
  PrimaryKey, // 主鍵裝飾器
  AutoIncrement, // 自動遞增裝飾器
  AllowNull,  // 允許空值設定裝飾器
  Unique,     // 唯一性約束裝飾器
  BelongsToMany, // 多對多關聯裝飾器
  CreatedAt,  // 建立時間裝飾器
  UpdatedAt,  // 更新時間裝飾器
} from 'sequelize-typescript';

// 導入相關的模型類別
import { RoleModel } from './RoleModel.js';                           // 角色模型，用於建立多對多關聯
import { RolePermissionModel } from './RoleToPermissionModel.js';     // 角色權限關聯表模型
import type { Optional } from 'sequelize';                           // Sequelize 的選擇性類型定義

/**
 * 權限屬性介面
 * 
 * 定義權限實體的所有屬性，包括必要和選擇性欄位。
 * 
 * @interface PermissionAttributes
 */
export type PermissionAttributes = {
  /** 權限唯一識別碼 - 自動遞增的主鍵 */
  id: number;
  /** 權限名稱 - 系統內部使用的權限標識符，例如 'user.create' */
  name: string;
  /** 權限描述 - 可選的人類可讀描述，說明權限的用途 */
  description?: string;
  /** 建立時間 - 權限建立的時間戳記 */
  createdAt: Date;
  /** 更新時間 - 權限最後更新的時間戳記 */
  updatedAt: Date;
};

/**
 * 權限建立屬性介面
 * 
 * 定義建立權限時所需的屬性，id 欄位為選擇性（因為是自動遞增）。
 * 
 * @interface PermissionCreationAttributes
 */
export type PermissionCreationAttributes = Optional<PermissionAttributes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 權限模型類別
 * 
 * 代表系統中的權限實體，定義了權限的資料結構和關聯關係。
 * 權限是 RBAC 系統中的基本組件，表示使用者可以執行的特定操作。
 * 
 * @class PermissionModel
 * @extends {Model<PermissionAttributes, PermissionCreationAttributes>}
 * @implements {PermissionAttributes}
 * 
 * @example
 * ```typescript
 * // 建立新權限
 * const permission = await PermissionModel.create({
 *   name: 'user.create',
 *   description: '建立使用者的權限'
 * });
 * 
 * // 查詢權限及其關聯的角色
 * const permissionWithRoles = await PermissionModel.findByPk(1, {
 *   include: ['roles']
 * });
 * ```
 */
@Table({ tableName: 'permissions', timestamps: true }) // 定義資料表名稱和時間戳記
export class PermissionModel extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  /**
   * 權限唯一識別碼
   * 
   * 自動遞增的主鍵，用於唯一標識每個權限。
   * 
   * @type {number}
   * @memberof PermissionModel
   */
  @PrimaryKey      // 設定為主鍵
  @AutoIncrement   // 自動遞增
  @Column(DataType.BIGINT)  // 大整數類型
  declare id: number;

  /**
   * 權限名稱
   * 
   * 系統內部使用的權限標識符，必須是唯一的。
   * 通常採用點號分隔的格式，例如 'user.create', 'article.publish'。
   * 
   * @type {string}
   * @memberof PermissionModel
   */
  @Unique          // 設定唯一性約束
  @AllowNull(false) // 不允許空值
  @Column(DataType.STRING(150))  // 字串類型，最大長度 150
  declare name: string;

  /**
   * 權限描述
   * 
   * 可選的人類可讀描述，用於解釋權限的用途和範圍。
   * 有助於管理員理解權限的具體功能。
   * 
   * @type {string | undefined}
   * @memberof PermissionModel
   */
  @Column(DataType.STRING(255))  // 字串類型，最大長度 255
  declare description?: string;

  /**
   * 建立時間
   * 
   * 權限建立的時間戳記，由 Sequelize 自動管理。
   * 
   * @type {Date}
   * @memberof PermissionModel
   */
  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  /**
   * 更新時間
   * 
   * 權限最後更新的時間戳記，由 Sequelize 自動管理。
   * 
   * @type {Date}
   * @memberof PermissionModel
   */
  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;

  /**
   * 關聯的角色列表
   * 
   * 透過多對多關聯，取得擁有此權限的所有角色。
   * 關聯透過 RolePermissionModel 中介表實現。
   * 
   * @type {RoleModel[] | undefined}
   * @memberof PermissionModel
   */
  @BelongsToMany(() => RoleModel, () => RolePermissionModel)  // 多對多關聯設定
  declare roles?: RoleModel[];
}
