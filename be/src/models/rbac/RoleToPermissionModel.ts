/**
 * RolePermissionModel – 角色與權限多對多關聯表
 * =================================================
 * Sequelize Many-to-Many 中介模型，對應資料表 `role_permissions`。
 *
 * Table: role_permissions
 * ────────────────────────
 * role_id       BIGINT UNSIGNED  PK, FK → roles.id
 * permission_id BIGINT UNSIGNED  PK, FK → permissions.id
 * createdAt / updatedAt          (Sequelize timestamps) — 可用於審計權限變動時間
 */
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  PrimaryKey,
} from 'sequelize-typescript';
import { RoleModel } from './RoleModel.js';
import { PermissionModel } from './PermissionModel.js';
import type { Optional } from 'sequelize';

type RolePermissionAttributes = {
  roleId: number;
  permissionId: number;
};

type RolePermissionCreationAttributes = RolePermissionAttributes;

@Table({ tableName: 'role_permissions', timestamps: true })
export class RolePermissionModel extends Model<RolePermissionAttributes, RolePermissionCreationAttributes> implements RolePermissionAttributes {
  @PrimaryKey
  @ForeignKey(() => RoleModel)
  @Column(DataType.BIGINT)
  declare roleId: number;

  @PrimaryKey
  @ForeignKey(() => PermissionModel)
  @Column(DataType.BIGINT)
  declare permissionId: number;
}
