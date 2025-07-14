
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Unique,
  BelongsToMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import type { Optional } from 'sequelize';

import { RoleModel } from './RoleModel.js';
import { UserRoleModel } from './UserToRoleModel.js';

// Define attributes interfaces for TypeScript
export type UserAttributes = {
  id: number;
  username: string;
  passwordHash: string;
  email?: string;
};

export type UserCreationAttributes = Optional<UserAttributes, 'id'>;

/**
 * UserModel – 使用者資料表 Model（RBAC）
 * ======================================
 * 使用者（User）可擁有多個角色（Role），進而間接取得多個權限（Permission）。
 *
 * Table: users
 * ────────────
 * id            BIGINT UNSIGNED AUTO_INCREMENT – 主鍵
 * username      VARCHAR(100) UNIQUE            – 帳號名稱
 * passwordHash  VARCHAR(255)                   – 密碼雜湊值（請勿存明碼）
 * email         VARCHAR(255)                   – 電子郵件 (可選)
 * createdAt / updatedAt                        – Sequelize timestamps
 *
 * Associations
 * ────────────
 * UserModel ↔ RoleModel  (Many-to-Many) through UserRoleModel
 *
 * 使用範例：
 *   const alice = await UserModel.create({ username: 'alice', passwordHash: '...' });
 *   await alice.$add('roles', [adminRole]);
 */
@Table({ tableName: 'users', timestamps: true })
export class UserModel extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING(100))
  declare username: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  declare passwordHash: string;

  @Column(DataType.STRING(255))
  declare email?: string;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;

  @BelongsToMany(() => RoleModel, () => UserRoleModel)
  declare roles?: RoleModel[];
}
