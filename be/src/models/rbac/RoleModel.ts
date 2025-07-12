/**
 * RoleModel – RBAC 角色資料表 Model
 * ==================================
 * 角色（Role）代表一組權限（Permission）的集合，可被指派給多個使用者（User）。
 * 例如常見的 `admin`, `editor`, `viewer`。
 *
 * Table: roles
 * ─────────────
 * id           BIGINT UNSIGNED AUTO_INCREMENT – 主鍵
 * name         VARCHAR(100) UNIQUE            – 角色唯一識別名稱 (machine-name)
 * displayName  VARCHAR(100)                   – 顯示名稱 (可中文)
 * createdAt / updatedAt                       – Sequelize timestamps
 *
 * Associations
 * ────────────
 * RoleModel ↔ PermissionModel  (Many-to-Many) through RolePermissionModel
 * RoleModel ↔ UserModel        (Many-to-Many) through UserRoleModel
 *
 * 使用範例：
 *   const admin = await RoleModel.create({ name: 'admin', displayName: '系統管理員' });
 *   await admin.$add('permissions', [perm1, perm2]);
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
} from 'sequelize-typescript';
import { UserModel } from './UserModel.js';
import { PermissionModel } from './PermissionModel.js';
import { UserRoleModel } from './UserToRoleModel.js';
import { RolePermissionModel } from './RoleToPermissionModel.js';
import type { Optional } from 'sequelize';

export type RoleAttributes = {
  id: number;
  name: string;
  displayName: string;
};

export type RoleCreationAttributes = Optional<RoleAttributes, 'id'>;

@Table({ tableName: 'roles', timestamps: true })
export class RoleModel extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING(100))
  declare name: string;

  @Column(DataType.STRING(100))
  declare displayName: string;

  @BelongsToMany(() => PermissionModel, () => RolePermissionModel)
  declare permissions?: PermissionModel[];

  @BelongsToMany(() => UserModel, () => UserRoleModel)
  declare users?: UserModel[];
}
