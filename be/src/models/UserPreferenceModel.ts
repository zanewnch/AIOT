/**
 * @fileoverview 使用者偏好設定模型
 * 
 * 本文件定義了使用者偏好設定的資料模型，用於儲存使用者的個人化設定，
 * 包括主題、語言、時區、自動儲存和通知等偏好設定。
 * 支援使用者個人化體驗的客製化功能。
 * 
 * @module UserPreferenceModel
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
 * 使用者偏好設定屬性介面
 * 
 * 定義使用者偏好設定的完整屬性結構，包含所有必要的個人化設定欄位。
 * 此介面確保型別安全和資料完整性。
 * 
 * @interface UserPreferenceAttributes
 * @since 1.0.0
 */
export type UserPreferenceAttributes = {
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
   * 主題設定
   * @type {'light' | 'dark' | 'auto'} 使用者介面主題偏好
   */
  theme: 'light' | 'dark' | 'auto';
  
  /** 
   * 語言設定
   * @type {string} 使用者介面語言代碼（如：'en', 'zh-TW', 'ja'）
   */
  language: string;
  
  /** 
   * 時區設定
   * @type {string} 使用者所在時區（如：'Asia/Taipei', 'UTC'）
   */
  timezone: string;
  
  /** 
   * 自動儲存設定
   * @type {boolean} 是否啟用自動儲存功能
   */
  autoSave: boolean;
  
  /** 
   * 通知設定
   * @type {boolean} 是否啟用系統通知
   */
  notifications: boolean;
};

/**
 * 使用者偏好設定建立屬性介面
 * 
 * 建立新記錄時使用的屬性介面，id 欄位為可選因為會自動產生。
 * 繼承自 UserPreferenceAttributes 並將 id 設為可選屬性。
 * 
 * @interface UserPreferenceCreationAttributes
 * @extends {Optional<UserPreferenceAttributes, 'id'>}
 * @since 1.0.0
 */
export type UserPreferenceCreationAttributes = Optional<UserPreferenceAttributes, 'id'>;

/**
 * 使用者偏好設定模型類別
 * 
 * 實作使用者偏好設定的 Sequelize 模型，提供個人化設定的儲存和查詢功能。
 * 此模型對應資料庫中的 user_preferences 資料表，支援完整的 CRUD 操作。
 * 
 * 資料表結構：
 * - id: 主鍵（BIGINT, 自動遞增）
 * - userId: 使用者外鍵（BIGINT, 必填）
 * - theme: 主題設定（ENUM: 'light', 'dark', 'auto'）
 * - language: 語言設定（VARCHAR(10)）
 * - timezone: 時區設定（VARCHAR(50)）
 * - autoSave: 自動儲存設定（BOOLEAN, 預設 true）
 * - notifications: 通知設定（BOOLEAN, 預設 true）
 * - createdAt: 建立時間（自動生成）
 * - updatedAt: 更新時間（自動維護）
 * 
 * 關聯關係：
 * - 屬於（BelongsTo）使用者模型：多對一關係
 * 
 * @class UserPreferenceModel
 * @extends {Model<UserPreferenceAttributes, UserPreferenceCreationAttributes>}
 * @implements {UserPreferenceAttributes}
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * // 建立使用者偏好設定
 * const preference = await UserPreferenceModel.create({
 *   userId: 1,
 *   theme: 'dark',
 *   language: 'zh-TW',
 *   timezone: 'Asia/Taipei',
 *   autoSave: true,
 *   notifications: false
 * });
 * 
 * // 查詢使用者偏好設定
 * const userPrefs = await UserPreferenceModel.findOne({
 *   where: { userId: 1 },
 *   include: [UserModel]
 * });
 * ```
 */
@Table({ tableName: 'user_preferences', timestamps: true }) // 設定資料表名稱，啟用時間戳記
export class UserPreferenceModel extends Model<UserPreferenceAttributes, UserPreferenceCreationAttributes> implements UserPreferenceAttributes {
  /**
   * 主鍵識別碼
   * 
   * 唯一識別每筆使用者偏好設定記錄的主鍵，由資料庫自動遞增生成。
   * 使用 BIGINT 型態以支援大量使用者資料。
   * 
   * @type {number}
   * @memberof UserPreferenceModel
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
   * 每個使用者通常只有一筆偏好設定記錄。
   * 
   * @type {number}
   * @memberof UserPreferenceModel
   * @since 1.0.0
   */
  @ForeignKey(() => UserModel) // 設定為外鍵，關聯到 UserModel
  @AllowNull(false)            // 設定為必填欄位
  @Column(DataType.BIGINT)     // 定義為 BIGINT 型態
  declare userId: number;

  /**
   * 主題設定
   * 
   * 使用者介面主題偏好設定，支援淺色、深色和自動切換模式。
   * 自動模式會根據系統設定或時間自動切換主題。
   * 
   * @type {'light' | 'dark' | 'auto'}
   * @memberof UserPreferenceModel
   * @since 1.0.0
   */
  @AllowNull(false)                            // 設定為必填欄位
  @Column(DataType.ENUM('light', 'dark', 'auto')) // 定義為 ENUM 型態，限制可選值
  declare theme: 'light' | 'dark' | 'auto';

  /**
   * 語言設定
   * 
   * 使用者介面語言代碼，遵循 ISO 639-1 標準。
   * 支援常見語言如：'en', 'zh-TW', 'zh-CN', 'ja', 'ko' 等。
   * 
   * @type {string}
   * @memberof UserPreferenceModel
   * @since 1.0.0
   */
  @AllowNull(false)           // 設定為必填欄位
  @Column(DataType.STRING(10)) // 定義為 VARCHAR(10) 型態
  declare language: string;

  /**
   * 時區設定
   * 
   * 使用者所在時區，遵循 IANA 時區資料庫格式。
   * 例如：'Asia/Taipei', 'UTC', 'America/New_York' 等。
   * 
   * @type {string}
   * @memberof UserPreferenceModel
   * @since 1.0.0
   */
  @AllowNull(false)           // 設定為必填欄位
  @Column(DataType.STRING(50)) // 定義為 VARCHAR(50) 型態
  declare timezone: string;

  /**
   * 自動儲存設定
   * 
   * 是否啟用自動儲存功能，預設為 true。
   * 啟用時系統會自動儲存使用者的編輯內容。
   * 
   * @type {boolean}
   * @memberof UserPreferenceModel
   * @since 1.0.0
   */
  @AllowNull(false)                              // 設定為必填欄位
  @Column({ type: DataType.BOOLEAN, defaultValue: true }) // 定義為 BOOLEAN 型態，預設值 true
  declare autoSave: boolean;

  /**
   * 通知設定
   * 
   * 是否啟用系統通知功能，預設為 true。
   * 啟用時使用者會收到系統相關通知。
   * 
   * @type {boolean}
   * @memberof UserPreferenceModel
   * @since 1.0.0
   */
  @AllowNull(false)                              // 設定為必填欄位
  @Column({ type: DataType.BOOLEAN, defaultValue: true }) // 定義為 BOOLEAN 型態，預設值 true
  declare notifications: boolean;

  /**
   * 建立時間
   * 
   * 記錄建立時的時間戳記，由 Sequelize 自動管理。
   * 用於追蹤偏好設定的建立時間。
   * 
   * @type {Date}
   * @memberof UserPreferenceModel
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
   * @memberof UserPreferenceModel
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
   * @memberof UserPreferenceModel
   * @since 1.0.0
   */
  @BelongsTo(() => UserModel) // 建立屬於關係，多對一
  declare user?: UserModel;
}