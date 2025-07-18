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
export type UserActivityAttributes = {
  id: number;
  userId: number;
  lastLoginAt: Date;
  loginCount: number;
  lastActiveAt: Date;
  mostVisitedPage: string;
  pageVisitCounts: Record<string, number>;
  sessionDuration: number; // in minutes
  deviceInfo: string;
  ipAddress: string;
};

export type UserActivityCreationAttributes = Optional<UserActivityAttributes, 'id'>;

/**
 * UserActivityModel – 使用者活動追蹤資料表 Model
 * ==========================================
 * 追蹤使用者的活動狀態，包括登入次數、最常造訪頁面、會話時間等。
 *
 * Table: user_activities
 * ────────────────────
 * id               BIGINT UNSIGNED AUTO_INCREMENT – 主鍵
 * userId           BIGINT UNSIGNED                – 外鍵關聯到 users.id
 * lastLoginAt      DATETIME                       – 最後登入時間
 * loginCount       INT                            – 登入次數
 * lastActiveAt     DATETIME                       – 最後活動時間
 * mostVisitedPage  VARCHAR(255)                   – 最常造訪的頁面
 * pageVisitCounts  JSON                           – 頁面造訪次數統計
 * sessionDuration  INT                            – 會話持續時間(分鐘)
 * deviceInfo       VARCHAR(500)                   – 裝置資訊
 * ipAddress        VARCHAR(45)                    – IP 地址
 * createdAt / updatedAt                           – Sequelize timestamps
 *
 * Associations
 * ────────────
 * UserActivityModel → UserModel (Many-to-One)
 *
 * 使用範例：
 *   const activity = await UserActivityModel.create({
 *     userId: 1,
 *     lastLoginAt: new Date(),
 *     loginCount: 1,
 *     mostVisitedPage: '/dashboard',
 *     pageVisitCounts: { '/dashboard': 5, '/profile': 2 }
 *   });
 */
@Table({ tableName: 'user_activities', timestamps: true })
export class UserActivityModel extends Model<UserActivityAttributes, UserActivityCreationAttributes> implements UserActivityAttributes {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @ForeignKey(() => UserModel)
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare userId: number;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare lastLoginAt: Date;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare loginCount: number;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare lastActiveAt: Date;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare mostVisitedPage: string;

  @AllowNull(false)
  @Column({ type: DataType.JSON, defaultValue: {} })
  declare pageVisitCounts: Record<string, number>;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare sessionDuration: number;

  @AllowNull(true)
  @Column(DataType.STRING(500))
  declare deviceInfo: string;

  @AllowNull(true)
  @Column(DataType.STRING(45))
  declare ipAddress: string;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;

  @BelongsTo(() => UserModel)
  declare user?: UserModel;
}