/**
 * @fileoverview 角色權限關聯表模型定義文件
 * 
 * 本文件定義了 RBAC (Role-Based Access Control) 系統中角色與權限的多對多關聯表模型。
 * 此模型作為 Sequelize 的中介模型（Through Model），用於實現角色和權限之間的多對多關聯。
 * 每個角色可以擁有多個權限，每個權限也可以屬於多個角色。
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
  BelongsTo,  // 一對多關聯裝飾器
} from 'sequelize-typescript';

// 導入相關的模型類別
import { RoleModel } from './RoleModel.js';           // 角色模型，用於建立外鍵關聯
import { PermissionModel } from './PermissionModel.js'; // 權限模型，用於建立外鍵關聯
import type { Optional } from 'sequelize';             // Sequelize 的選擇性類型定義

/**
 * 角色權限關聯屬性介面
 * 
 * 定義角色權限關聯表的所有屬性，包含角色 ID 和權限 ID。
 * 
 * @interface RolePermissionAttributes
 */
export type RolePermissionAttributes = {
  /** 角色 ID - 外鍵參照 roles.id */
  roleId: number;
  /** 權限 ID - 外鍵參照 permissions.id */
  permissionId: number;
};

/**
 * 角色權限關聯建立屬性介面
 * 
 * 定義建立角色權限關聯時所需的屬性，所有欄位都是必要的。
 * 
 * @interface RolePermissionCreationAttributes
 */
export type RolePermissionCreationAttributes = RolePermissionAttributes;

/**
 * 角色權限關聯模型類別
 * 
 * 代表角色和權限之間的多對多關聯關係。
 * 此模型作為中介表，儲存角色 ID 和權限 ID 的組合，
 * 用於實現 RBAC 系統中角色權限的指派和管理。
 * 
 * @class RolePermissionModel
 * @extends {Model<RolePermissionAttributes, RolePermissionCreationAttributes>}
 * @implements {RolePermissionAttributes}
 * 
 * @example
 * ```typescript
 * // 為角色指派權限
 * await RolePermissionModel.create({
 *   roleId: 1,
 *   permissionId: 5
 * });
 * 
 * // 查詢某個角色的所有權限
 * const rolePermissions = await RolePermissionModel.findAll({
 *   where: { roleId: 1 }
 * });
 * 
 * // 移除角色的特定權限
 * await RolePermissionModel.destroy({
 *   where: { roleId: 1, permissionId: 5 }
 * });
 * ```
 */
@Table({ tableName: 'role_permissions', timestamps: true }) // 定義資料表名稱和時間戳記
export class RolePermissionModel extends Model<RolePermissionAttributes, RolePermissionCreationAttributes> implements RolePermissionAttributes {
  /**
   * 角色 ID
   * 
   * 外鍵參照 roles 表的 id 欄位，與 permissionId 共同組成複合主鍵。
   * 用於標識擁有權限的角色。
   * 
   * @type {number}
   * @memberof RolePermissionModel
   */
  @PrimaryKey                    // 設定為主鍵的一部分（複合主鍵）
  @ForeignKey(() => RoleModel)   // 外鍵關聯到 RoleModel
  @Column(DataType.BIGINT)       // 大整數類型
  declare roleId: number;

  /**
   * 權限 ID
   * 
   * 外鍵參照 permissions 表的 id 欄位，與 roleId 共同組成複合主鍵。
   * 用於標識被指派的權限。
   * 
   * @type {number}
   * @memberof RolePermissionModel
   */
  @PrimaryKey                         // 設定為主鍵的一部分（複合主鍵）
  @ForeignKey(() => PermissionModel)  // 外鍵關聯到 PermissionModel
  @Column(DataType.BIGINT)            // 大整數類型
  declare permissionId: number;

  /**
   * 關聯的角色實例
   * 
   * 通過 BelongsTo 關聯獲取此權限分配所屬的角色。
   * 
   * @type {RoleModel | undefined}
   * @memberof RolePermissionModel
   */
  @BelongsTo(() => RoleModel)
  declare role?: RoleModel;

  /**
   * 關聯的權限實例
   * 
   * 通過 BelongsTo 關聯獲取此角色分配的權限。
   * 
   * @type {PermissionModel | undefined}
   * @memberof RolePermissionModel
   */
  @BelongsTo(() => PermissionModel)
  declare permission?: PermissionModel;
}
