/**
 * PermissionModel – 單一權限 Model（RBAC）
 * =================================================
 * 權限（Permission）代表系統中的一個『動作』或『功能』，
 * 例如 `user.create`, `article.publish`, `device.delete`。
 * 角色（Role）可以擁有多個權限，透過多對多關聯表 `role_permissions`。
 *
 * Table: permissions
 * ──────────────────
 * id           BIGINT UNSIGNED AUTO_INCREMENT – 主鍵
 * name         VARCHAR(150) UNIQUE            – 權限內部名稱 (machine-name)
 * description  VARCHAR(255)                   – 描述 (可選)
 * createdAt / updatedAt                       – Sequelize timestamps
 *
 * Associations
 * ────────────
 * PermissionModel ↔ RoleModel  (Many-to-Many) through RolePermissionModel
 * 
 * 
 * 
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
import { RoleModel } from './RoleModel.js';
import { RolePermissionModel } from './RoleToPermissionModel.js';
import type { Optional } from 'sequelize';

type PermissionAttributes = {
  id: number;
  name: string;
  description?: string;
};

type PermissionCreationAttributes = Optional<PermissionAttributes, 'id'>;

@Table({ tableName: 'permissions', timestamps: true })
export class PermissionModel extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING(150))
  declare name: string;

  @Column(DataType.STRING(255))
  declare description?: string;

  @BelongsToMany(() => RoleModel, () => RolePermissionModel)
  declare roles?: RoleModel[];
}
