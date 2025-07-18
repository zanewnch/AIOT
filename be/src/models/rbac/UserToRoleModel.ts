/**
 * @fileoverview 使用者角色關聯表模型定義文件
 * 
 * 本文件定義了 RBAC (Role-Based Access Control) 系統中使用者與角色的多對多關聯表模型。
 * 此模型作為 Sequelize 的中介模型（Through Model），用於實現使用者和角色之間的多對多關聯。
 * 每個使用者可以擁有多個角色，每個角色也可以被指派給多個使用者。
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
  ForeignKey, // 外鍵裝飾器
  PrimaryKey, // 主鍵裝飾器
} from 'sequelize-typescript';

// 導入相關的模型類別
import { UserModel } from './UserModel.js';  // 使用者模型，用於建立外鍵關聯
import { RoleModel } from './RoleModel.js';  // 角色模型，用於建立外鍵關聯

/**
 * 使用者角色關聯屬性介面
 * 
 * 定義使用者角色關聯表的所有屬性，包含使用者 ID 和角色 ID。
 * 
 * @interface UserRoleAttributes
 */
export type UserRoleAttributes = {
  /** 使用者 ID - 外鍵參照 users.id */
  userId: number;
  /** 角色 ID - 外鍵參照 roles.id */
  roleId: number;
};

/**
 * 使用者角色關聯建立屬性介面
 * 
 * 定義建立使用者角色關聯時所需的屬性，所有欄位都是必要的。
 * 
 * @interface UserRoleCreationAttributes
 */
export type UserRoleCreationAttributes = UserRoleAttributes;

/**
 * 使用者角色關聯模型類別
 * 
 * 代表使用者和角色之間的多對多關聯關係。
 * 此模型作為中介表，儲存使用者 ID 和角色 ID 的組合，
 * 用於實現 RBAC 系統中使用者角色的指派和管理。
 * 
 * @class UserRoleModel
 * @extends {Model<UserRoleAttributes, UserRoleCreationAttributes>}
 * @implements {UserRoleAttributes}
 * 
 * @example
 * ```typescript
 * // 為使用者指派角色
 * await UserRoleModel.create({
 *   userId: 1,
 *   roleId: 2
 * });
 * 
 * // 查詢某個使用者的所有角色
 * const userRoles = await UserRoleModel.findAll({
 *   where: { userId: 1 }
 * });
 * 
 * // 移除使用者的特定角色
 * await UserRoleModel.destroy({
 *   where: { userId: 1, roleId: 2 }
 * });
 * ```
 */
@Table({ tableName: 'user_roles', timestamps: true }) // 定義資料表名稱和時間戳記
export class UserRoleModel extends Model<UserRoleAttributes, UserRoleCreationAttributes> implements UserRoleAttributes {
  /**
   * 使用者 ID
   * 
   * 外鍵參照 users 表的 id 欄位，與 roleId 共同組成複合主鍵。
   * 用於標識被指派角色的使用者。
   * 
   * @type {number}
   * @memberof UserRoleModel
   */
  @PrimaryKey                    // 設定為主鍵的一部分（複合主鍵）
  @ForeignKey(() => UserModel)   // 外鍵關聯到 UserModel
  @Column(DataType.BIGINT)       // 大整數類型
  declare userId: number;

  /**
   * 角色 ID
   * 
   * 外鍵參照 roles 表的 id 欄位，與 userId 共同組成複合主鍵。
   * 用於標識被指派給使用者的角色。
   * 
   * @type {number}
   * @memberof UserRoleModel
   */
  @PrimaryKey                    // 設定為主鍵的一部分（複合主鍵）
  @ForeignKey(() => RoleModel)   // 外鍵關聯到 RoleModel
  @Column(DataType.BIGINT)       // 大整數類型
  declare roleId: number;
}
