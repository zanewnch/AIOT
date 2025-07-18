import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import type { Optional } from 'sequelize';
import { UserModel } from './rbac/UserModel.js';

// Define attributes interfaces for TypeScript
export type UserPreferenceAttributes = {
  id: number;
  userId: number;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  autoSave: boolean;
  notifications: boolean;
};

export type UserPreferenceCreationAttributes = Optional<UserPreferenceAttributes, 'id'>;

/**
 * UserPreferenceModel – 使用者偏好設定資料表 Model
 * =============================================
 * 儲存使用者的個人化設定，包括主題、語言、時區等偏好。
 *
 * Table: user_preferences
 * ─────────────────────
 * id            BIGINT UNSIGNED AUTO_INCREMENT – 主鍵
 * userId        BIGINT UNSIGNED                – 外鍵關聯到 users.id
 * theme         ENUM('light','dark','auto')    – 主題設定
 * language      VARCHAR(10)                    – 語言設定 (如: 'en', 'zh-TW')
 * timezone      VARCHAR(50)                    – 時區設定 (如: 'Asia/Taipei')
 * autoSave      BOOLEAN                        – 自動儲存設定
 * notifications BOOLEAN                        – 通知設定
 * createdAt / updatedAt                        – Sequelize timestamps
 *
 * Associations
 * ────────────
 * UserPreferenceModel → UserModel (Many-to-One)
 *
 * 使用範例：
 *   const preference = await UserPreferenceModel.create({
 *     userId: 1,
 *     theme: 'dark',
 *     language: 'zh-TW',
 *     timezone: 'Asia/Taipei'
 *   });
 */
@Table({ tableName: 'user_preferences', timestamps: true })
export class UserPreferenceModel extends Model<UserPreferenceAttributes, UserPreferenceCreationAttributes> implements UserPreferenceAttributes {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @ForeignKey(() => UserModel)
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare userId: number;

  @AllowNull(false)
  @Column(DataType.ENUM('light', 'dark', 'auto'))
  declare theme: 'light' | 'dark' | 'auto';

  @AllowNull(false)
  @Column(DataType.STRING(10))
  declare language: string;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  declare timezone: string;

  @AllowNull(false)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare autoSave: boolean;

  @AllowNull(false)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare notifications: boolean;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;

  @BelongsTo(() => UserModel)
  declare user?: UserModel;
}