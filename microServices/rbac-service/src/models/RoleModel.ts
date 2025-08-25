/**
 * @fileoverview 角色模型定義文件
 * 
 * 本文件定義了 RBAC (Role-Based Access Control) 系統中的角色實體模型。
 * 角色代表一組權限的集合，可以被指派給多個使用者。
 * 常見的角色包括 'admin'（系統管理員）、'editor'（編輯者）、'viewer'（檢視者）等。
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
} from 'sequelize-typescript';

// 導入相關的模型類別
import { UserModel } from './UserModel.js';                          // 使用者模型，用於建立多對多關聯
import { PermissionModel } from './PermissionModel.js';              // 權限模型，用於建立多對多關聯
import { UserRoleModel } from './UserRoleModel.js';                // 使用者角色關聯表模型
import { RolePermissionModel } from './RolePermissionModel.js';    // 角色權限關聯表模型
import type { Optional } from 'sequelize';                           // Sequelize 的選擇性類型定義

/**
 * 角色屬性介面
 * 
 * 定義角色實體的所有屬性，包括必要和選擇性欄位。
 * 
 * @interface RoleAttributes
 */
export type RoleAttributes = {
  /** 角色唯一識別碼 - 自動遞增的主鍵 */
  id: number;
  /** 角色名稱 - 系統內部使用的角色標識符，例如 'admin' */
  name: string;
  /** 角色顯示名稱 - 人類可讀的角色名稱，例如 '系統管理員' */
  displayName: string;
};

/**
 * 角色建立屬性介面
 * 
 * 定義建立角色時所需的屬性，id 欄位為選擇性（因為是自動遞增）。
 * 
 * @interface RoleCreationAttributes
 */
export type RoleCreationAttributes = Optional<RoleAttributes, 'id'>;

/**
 * 角色模型類別
 * 
 * 代表系統中的角色實體，定義了角色的資料結構和關聯關係。
 * 角色是 RBAC 系統中的核心組件，作為使用者和權限之間的橋樑。
 * 
 * @class RoleModel
 * @extends {Model<RoleAttributes, RoleCreationAttributes>}
 * @implements {RoleAttributes}
 * 
 * @example
 * ```typescript
 * // 建立新角色
 * const adminRole = await RoleModel.create({
 *   name: 'admin',
 *   displayName: '系統管理員'
 * });
 * 
 * // 為角色添加權限
 * await adminRole.$add('permissions', [perm1, perm2]);
 * 
 * // 查詢角色及其關聯的權限和使用者
 * const roleWithAssociations = await RoleModel.findByPk(1, {
 *   include: ['permissions', 'users']
 * });
 * ```
 */
@Table({ tableName: 'roles', timestamps: true }) // 定義資料表名稱和時間戳記
export class RoleModel extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  /**
   * 角色唯一識別碼
   * 
   * 自動遞增的主鍵，用於唯一標識每個角色。
   * 
   * @type {number}
   * @memberof RoleModel
   */
  @PrimaryKey      // 設定為主鍵
  @AutoIncrement   // 自動遞增
  @Column(DataType.BIGINT)  // 大整數類型
  declare id: number;

  /**
   * 角色名稱
   * 
   * 系統內部使用的角色標識符，必須是唯一的。
   * 通常使用英文小寫，例如 'admin', 'editor', 'viewer'。
   * 
   * @type {string}
   * @memberof RoleModel
   */
  @Unique          // 設定唯一性約束
  @AllowNull(false) // 不允許空值
  @Column(DataType.STRING(100))  // 字串類型，最大長度 100
  declare name: string;

  /**
   * 角色顯示名稱
   * 
   * 人類可讀的角色名稱，用於在使用者介面中顯示。
   * 可以使用中文或其他語言，例如 '系統管理員', '編輯者'。
   * 
   * @type {string}
   * @memberof RoleModel
   */
  @Column(DataType.STRING(100))  // 字串類型，最大長度 100
  declare displayName: string;

  /**
   * 關聯的權限列表
   * 
   * 透過多對多關聯，取得此角色擁有的所有權限。
   * 關聯透過 RolePermissionModel 中介表實現。
   * 
   * @type {PermissionModel[] | undefined}
   * @memberof RoleModel
   */
  @BelongsToMany(() => PermissionModel, () => RolePermissionModel)  // 多對多關聯設定
  declare permissions?: PermissionModel[];

  /**
   * 關聯的使用者列表
   * 
   * 透過多對多關聯，取得擁有此角色的所有使用者。
   * 關聯透過 UserRoleModel 中介表實現。
   * 
   * @type {UserModel[] | undefined}
   * @memberof RoleModel
   */
  @BelongsToMany(() => UserModel, () => UserRoleModel)  // 多對多關聯設定
  declare users?: UserModel[];
}
