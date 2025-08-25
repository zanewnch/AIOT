
/**
 * @fileoverview 使用者模型定義文件
 * 
 * 本文件定義了 RBAC (Role-Based Access Control) 系統中的使用者實體模型。
 * 使用者是系統中的基本主體，可以被指派多個角色，透過角色間接取得相應的權限。
 * 系統使用雜湊密碼儲存，確保資料安全性。
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

// 導入 Sequelize 的類型定義
import type { Optional } from 'sequelize';  // Sequelize 的選擇性類型定義

// 導入相關的模型類別
import { RoleModel } from './RoleModel.js';           // 角色模型，用於建立多對多關聯
import { UserRoleModel } from './UserRoleModel.js'; // 使用者角色關聯表模型

/**
 * 使用者屬性介面
 * 
 * 定義使用者實體的所有屬性，包括必要和選擇性欄位。
 * 
 * @interface UserAttributes
 */
export type UserAttributes = {
  /** 使用者唯一識別碼 - 自動遞增的主鍵 */
  id: number;
  /** 使用者名稱 - 系統登入使用的帳號名稱 */
  username: string;
  /** 密碼雜湊值 - 經過雜湊處理的密碼，不可逆轉 */
  passwordHash: string;
  /** 電子郵件 - 可選的聯絡信箱 */
  email?: string;
  /** 帳戶是否啟用 - 用於停用/啟用使用者帳戶 */
  isActive: boolean;
  /** 最後登入時間 - 記錄使用者最後一次成功登入的時間 */
  lastLoginAt: Date | null;
};

/**
 * 使用者建立屬性介面
 * 
 * 定義建立使用者時所需的屬性，id 欄位為選擇性（因為是自動遞增）。
 * 
 * @interface UserCreationAttributes
 */
export type UserCreationAttributes = Optional<UserAttributes, 'id' | 'lastLoginAt'>;

/**
 * 使用者模型類別
 * 
 * 代表系統中的使用者實體，定義了使用者的資料結構和關聯關係。
 * 使用者是 RBAC 系統中的主要實體，透過角色取得相應的權限。
 * 
 * @class UserModel
 * @extends {Model<UserAttributes, UserCreationAttributes>}
 * @implements {UserAttributes}
 * 
 * @example
 * ```typescript
 * // 建立新使用者
 * const user = await UserModel.create({
 *   username: 'alice',
 *   passwordHash: await bcrypt.hash('password123', 10),
 *   email: 'alice@example.com'
 * });
 * 
 * // 為使用者指派角色
 * await user.$add('roles', [adminRole]);
 * 
 * // 查詢使用者及其角色
 * const userWithRoles = await UserModel.findByPk(1, {
 *   include: ['roles']
 * });
 * ```
 */
@Table({ tableName: 'users', timestamps: true }) // 定義資料表名稱和時間戳記
export class UserModel extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  /**
   * 使用者唯一識別碼
   * 
   * 自動遞增的主鍵，用於唯一標識每個使用者。
   * 
   * @type {number}
   * @memberof UserModel
   */
  @PrimaryKey      // 設定為主鍵
  @AutoIncrement   // 自動遞增
  @Column(DataType.BIGINT)  // 大整數類型
  declare id: number;

  /**
   * 使用者名稱
   * 
   * 系統登入使用的帳號名稱，必須是唯一的。
   * 用於使用者身份驗證和識別。
   * 
   * @type {string}
   * @memberof UserModel
   */
  @Unique          // 設定唯一性約束
  @AllowNull(false) // 不允許空值
  @Column(DataType.STRING(100))  // 字串類型，最大長度 100
  declare username: string;

  /**
   * 密碼雜湊值
   * 
   * 經過雜湊處理的密碼，不可逆轉。
   * 建議使用 bcrypt 或其他安全的雜湊演算法。
   * 絕對不應該儲存明碼密碼。
   * 
   * @type {string}
   * @memberof UserModel
   */
  @AllowNull(false) // 不允許空值
  @Column(DataType.STRING(255))  // 字串類型，最大長度 255
  declare passwordHash: string;

  /**
   * 電子郵件
   * 
   * 可選的使用者聯絡信箱，用於通知和密碼重設等功能。
   * 
   * @type {string | undefined}
   * @memberof UserModel
   */
  @Column(DataType.STRING(255))  // 字串類型，最大長度 255
  declare email?: string;

  /**
   * 帳戶是否啟用
   * 
   * 用於控制使用者帳戶的啟用狀態，預設為 true。
   * 停用的帳戶無法進行登入。
   * 
   * @type {boolean}
   * @memberof UserModel
   */
  @AllowNull(false)    // 不允許空值
  @Column({ type: DataType.BOOLEAN, defaultValue: true })  // 布林類型，預設為 true
  declare isActive: boolean;

  /**
   * 最後登入時間
   * 
   * 記錄使用者最後一次成功登入的時間戳記。
   * 初始值為 null，在首次登入後更新。
   * 
   * @type {Date | null}
   * @memberof UserModel
   */
  @Column(DataType.DATE)  // 日期類型，允許 null
  declare lastLoginAt: Date | null;

  /**
   * 建立時間
   * 
   * 使用者帳號的建立時間戳記，由 Sequelize 自動管理。
   * 
   * @type {Date}
   * @memberof UserModel
   */
  @CreatedAt       // 建立時間欄位
  @Column(DataType.DATE)  // 日期類型
  declare createdAt: Date;

  /**
   * 更新時間
   * 
   * 使用者資料的最後更新時間戳記，由 Sequelize 自動管理。
   * 
   * @type {Date}
   * @memberof UserModel
   */
  @UpdatedAt       // 更新時間欄位
  @Column(DataType.DATE)  // 日期類型
  declare updatedAt: Date;

  /**
   * 關聯的角色列表
   * 
   * 透過多對多關聯，取得此使用者擁有的所有角色。
   * 關聯透過 UserRoleModel 中介表實現。
   * 
   * @type {RoleModel[] | undefined}
   * @memberof UserModel
   */
  @BelongsToMany(() => RoleModel, () => UserRoleModel)  // 多對多關聯設定
  declare roles?: RoleModel[];
}
