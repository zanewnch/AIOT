/**
 * @fileoverview 使用者活動追蹤模型
 * 
 * 本文件定義了使用者活動追蹤的資料模型，用於記錄使用者的行為分析資料，
 * 包括登入記錄、頁面造訪統計、會話時間、裝置資訊等。
 * 支援使用者行為分析和系統使用狀況監控。
 * 
 * @module UserActivityModel
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

// 引入 Sequelize TypeScript 裝飾器和模型相關功能
import {
  Table,        // 資料表定義裝飾器
  Column,       // 欄位定義裝飾器
  Model,        // 基礎模型類別
  DataType,     // 資料型態定義
  PrimaryKey,   // 主鍵裝飾器
  AutoIncrement, // 自動遞增裝飾器
  AllowNull,    // 允許空值設定裝飾器
  ForeignKey,   // 外鍵裝飾器
  BelongsTo,    // 屬於關聯裝飾器
  CreatedAt,    // 建立時間裝飾器
  UpdatedAt,    // 更新時間裝飾器
} from 'sequelize-typescript';

// 引入 Sequelize 型別定義，用於定義可選屬性
import type { Optional } from 'sequelize';

// 引入使用者模型，建立外鍵關聯
import { UserModel } from './rbac/UserModel.js';

/**
 * 使用者活動追蹤屬性介面
 * 
 * 定義使用者活動追蹤的完整屬性結構，包含所有必要的行為分析欄位。
 * 此介面確保型別安全和資料完整性。
 * 
 * @interface UserActivityAttributes
 * @since 1.0.0
 */
export type UserActivityAttributes = {
  /** 
   * 主鍵識別碼
   * @type {number} 唯一識別碼，由資料庫自動生成
   */
  id: number;
  
  /** 
   * 使用者識別碼
   * @type {number} 關聯到使用者資料表的外鍵
   */
  userId: number;
  
  /** 
   * 最後登入時間
   * @type {Date} 使用者最後一次登入系統的時間
   */
  lastLoginAt: Date;
  
  /** 
   * 登入次數
   * @type {number} 使用者累計登入系統的次數
   */
  loginCount: number;
  
  /** 
   * 最後活動時間
   * @type {Date} 使用者最後一次在系統中活動的時間
   */
  lastActiveAt: Date;
  
  /** 
   * 最常造訪頁面
   * @type {string} 使用者最常造訪的頁面路徑
   */
  mostVisitedPage: string;
  
  /** 
   * 頁面造訪次數統計
   * @type {Record<string, number>} 各頁面的造訪次數統計（JSON 格式）
   */
  pageVisitCounts: Record<string, number>;
  
  /** 
   * 會話持續時間
   * @type {number} 使用者會話持續時間（以分鐘為單位）
   */
  sessionDuration: number;
  
  /** 
   * 裝置資訊
   * @type {string} 使用者使用的裝置資訊（User Agent 等）
   */
  deviceInfo: string;
  
  /** 
   * IP 地址
   * @type {string} 使用者的 IP 地址（支援 IPv4 和 IPv6）
   */
  ipAddress: string;
};

/**
 * 使用者活動追蹤建立屬性介面
 * 
 * 建立新記錄時使用的屬性介面，id 欄位為可選因為會自動產生。
 * 繼承自 UserActivityAttributes 並將 id 設為可選屬性。
 * 
 * @interface UserActivityCreationAttributes
 * @extends {Optional<UserActivityAttributes, 'id'>}
 * @since 1.0.0
 */
export type UserActivityCreationAttributes = Optional<UserActivityAttributes, 'id'>;

/**
 * 使用者活動追蹤模型類別
 * 
 * 實作使用者活動追蹤的 Sequelize 模型，提供使用者行為分析和統計功能。
 * 此模型對應資料庫中的 user_activities 資料表，支援完整的 CRUD 操作。
 * 
 * 資料表結構：
 * - id: 主鍵（BIGINT, 自動遞增）
 * - userId: 使用者外鍵（BIGINT, 必填）
 * - lastLoginAt: 最後登入時間（DATETIME, 可空）
 * - loginCount: 登入次數（INT, 預設 0）
 * - lastActiveAt: 最後活動時間（DATETIME, 可空）
 * - mostVisitedPage: 最常造訪頁面（VARCHAR(255), 可空）
 * - pageVisitCounts: 頁面造訪統計（JSON, 預設 {}）
 * - sessionDuration: 會話時間（INT, 預設 0, 分鐘）
 * - deviceInfo: 裝置資訊（VARCHAR(500), 可空）
 * - ipAddress: IP 地址（VARCHAR(45), 可空）
 * - createdAt: 建立時間（自動生成）
 * - updatedAt: 更新時間（自動維護）
 * 
 * 關聯關係：
 * - 屬於（BelongsTo）使用者模型：多對一關係
 * 
 * @class UserActivityModel
 * @extends {Model<UserActivityAttributes, UserActivityCreationAttributes>}
 * @implements {UserActivityAttributes}
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * // 建立使用者活動記錄
 * const activity = await UserActivityModel.create({
 *   userId: 1,
 *   lastLoginAt: new Date(),
 *   loginCount: 1,
 *   lastActiveAt: new Date(),
 *   mostVisitedPage: '/dashboard',
 *   pageVisitCounts: { '/dashboard': 5, '/profile': 2 },
 *   sessionDuration: 30,
 *   deviceInfo: 'Mozilla/5.0...',
 *   ipAddress: '192.168.1.100'
 * });
 * 
 * // 查詢使用者活動統計
 * const userActivity = await UserActivityModel.findOne({
 *   where: { userId: 1 },
 *   include: [UserModel]
 * });
 * ```
 */
@Table({ tableName: 'user_activities', timestamps: true }) // 設定資料表名稱，啟用時間戳記
export class UserActivityModel extends Model<UserActivityAttributes, UserActivityCreationAttributes> implements UserActivityAttributes {
  /**
   * 主鍵識別碼
   * 
   * 唯一識別每筆使用者活動追蹤記錄的主鍵，由資料庫自動遞增生成。
   * 使用 BIGINT 型態以支援大量活動記錄。
   * 
   * @type {number}
   * @memberof UserActivityModel
   * @since 1.0.0
   */
  @PrimaryKey              // 標記為主鍵
  @AutoIncrement           // 設定自動遞增
  @Column(DataType.BIGINT) // 定義為 BIGINT 型態
  declare id: number;

  /**
   * 使用者識別碼
   * 
   * 關聯到使用者資料表的外鍵，建立與使用者的多對一關係。
   * 每個使用者可以有多筆活動記錄，用於追蹤不同時期的活動狀態。
   * 
   * @type {number}
   * @memberof UserActivityModel
   * @since 1.0.0
   */
  @ForeignKey(() => UserModel) // 設定為外鍵，關聯到 UserModel
  @AllowNull(false)            // 設定為必填欄位
  @Column(DataType.BIGINT)     // 定義為 BIGINT 型態
  declare userId: number;

  /**
   * 最後登入時間
   * 
   * 記錄使用者最後一次成功登入系統的時間戳記。
   * 可為空值，表示使用者尚未登入過系統。
   * 
   * @type {Date}
   * @memberof UserActivityModel
   * @since 1.0.0
   */
  @AllowNull(true)        // 允許空值
  @Column(DataType.DATE)  // 定義為 DATE 型態
  declare lastLoginAt: Date;

  /**
   * 登入次數
   * 
   * 記錄使用者累計登入系統的次數，用於統計使用者活躍度。
   * 預設值為 0，每次成功登入時遞增 1。
   * 
   * @type {number}
   * @memberof UserActivityModel
   * @since 1.0.0
   */
  @AllowNull(false)                             // 設定為必填欄位
  @Column({ type: DataType.INTEGER, defaultValue: 0 }) // 定義為 INTEGER 型態，預設值 0
  declare loginCount: number;

  /**
   * 最後活動時間
   * 
   * 記錄使用者最後一次在系統中進行任何操作的時間戳記。
   * 包括頁面瀏覽、功能使用等所有互動行為。
   * 
   * @type {Date}
   * @memberof UserActivityModel
   * @since 1.0.0
   */
  @AllowNull(true)        // 允許空值
  @Column(DataType.DATE)  // 定義為 DATE 型態
  declare lastActiveAt: Date;

  /**
   * 最常造訪頁面
   * 
   * 記錄使用者最常造訪的頁面路徑，用於分析使用者行為偏好。
   * 可為空值，表示尚未統計出最常造訪的頁面。
   * 
   * @type {string}
   * @memberof UserActivityModel
   * @since 1.0.0
   */
  @AllowNull(true)             // 允許空值
  @Column(DataType.STRING(255)) // 定義為 VARCHAR(255) 型態
  declare mostVisitedPage: string;

  /**
   * 頁面造訪次數統計
   * 
   * 以 JSON 格式儲存各頁面的造訪次數統計，鍵為頁面路徑，值為造訪次數。
   * 預設值為空物件 {}，用於詳細的使用者行為分析。
   * 
   * @type {Record<string, number>}
   * @memberof UserActivityModel
   * @since 1.0.0
   */
  @AllowNull(false)                         // 設定為必填欄位
  @Column({ type: DataType.JSON, defaultValue: {} }) // 定義為 JSON 型態，預設值空物件
  declare pageVisitCounts: Record<string, number>;

  /**
   * 會話持續時間
   * 
   * 記錄使用者會話的持續時間，以分鐘為單位。
   * 預設值為 0，用於統計使用者在系統中的活躍時間。
   * 
   * @type {number}
   * @memberof UserActivityModel
   * @since 1.0.0
   */
  @AllowNull(false)                             // 設定為必填欄位
  @Column({ type: DataType.INTEGER, defaultValue: 0 }) // 定義為 INTEGER 型態，預設值 0
  declare sessionDuration: number;

  /**
   * 裝置資訊
   * 
   * 記錄使用者使用的裝置相關資訊，通常包含 User Agent 字串。
   * 可為空值，用於統計使用者使用的瀏覽器、作業系統等資訊。
   * 
   * @type {string}
   * @memberof UserActivityModel
   * @since 1.0.0
   */
  @AllowNull(true)             // 允許空值
  @Column(DataType.STRING(500)) // 定義為 VARCHAR(500) 型態
  declare deviceInfo: string;

  /**
   * IP 地址
   * 
   * 記錄使用者的 IP 地址，支援 IPv4 和 IPv6 格式。
   * 可為空值，用於安全性分析和地理位置統計。
   * 
   * @type {string}
   * @memberof UserActivityModel
   * @since 1.0.0
   */
  @AllowNull(true)            // 允許空值
  @Column(DataType.STRING(45)) // 定義為 VARCHAR(45) 型態（支援 IPv6）
  declare ipAddress: string;

  /**
   * 建立時間
   * 
   * 記錄建立時的時間戳記，由 Sequelize 自動管理。
   * 用於追蹤活動記錄的建立時間。
   * 
   * @type {Date}
   * @memberof UserActivityModel
   * @since 1.0.0
   */
  @CreatedAt              // 標記為建立時間欄位
  @Column(DataType.DATE)  // 定義為 DATE 型態
  declare createdAt: Date;

  /**
   * 更新時間
   * 
   * 記錄最後更新時的時間戳記，由 Sequelize 自動維護。
   * 每次更新記錄時會自動更新此欄位。
   * 
   * @type {Date}
   * @memberof UserActivityModel
   * @since 1.0.0
   */
  @UpdatedAt              // 標記為更新時間欄位
  @Column(DataType.DATE)  // 定義為 DATE 型態
  declare updatedAt: Date;

  /**
   * 關聯使用者
   * 
   * 建立與使用者模型的多對一關係，可選擇性載入關聯的使用者資料。
   * 使用 include 選項可以一併查詢使用者資訊。
   * 
   * @type {UserModel}
   * @memberof UserActivityModel
   * @since 1.0.0
   */
  @BelongsTo(() => UserModel) // 建立屬於關係，多對一
  declare user?: UserModel;
}