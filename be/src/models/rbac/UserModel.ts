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
type UserAttributes = {
  id: number;
  username: string;
  passwordHash: string;
  email?: string;
};

type UserCreationAttributes = Optional<UserAttributes, 'id'>;

/**
 * 泛型只影响基类（base class, parent class）的行为:
 * - `Model<UserAttributes, UserCreationAttributes>` 约束 Sequelize 方法（如 `findOne`、`create`）的输入输出类型，但不保证 `UserModel` 实例的属性符合 `UserAttributes`。
 * - `implements UserAttributes` 为实例添加类型约束，确保 TypeScript 检查 `UserModel` 实例是否包含 `UserAttributes` 定义的所有属性，保证访问实例属性（如 `user.email`）时的类型安全。
 *
 * 简而言之:
 * 泛型约束基类 `Model` 的行为，`implements` 约束 `UserModel` 本身的结构，两者互补，共同保证类型安全。
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
