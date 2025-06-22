/**
 * UserRoleModel – 使用者與角色多對多關聯表
 * =================================================
 * Sequelize 透過『中介模型（through model）』來實作 Many-to-Many，
 * 這個檔案即對應資料表 `user_roles`。
 *
 * Table: user_roles
 * ──────────────────
 * user_id  BIGINT UNSIGNED  PK, FK → users.id
 * role_id  BIGINT UNSIGNED  PK, FK → roles.id
 * createdAt / updatedAt     (Sequelize timestamps) — 可用於審計指派時間
 */
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  PrimaryKey,
} from 'sequelize-typescript';
import { UserModel } from './UserModel.js';
import { RoleModel } from './RoleModel.js';

@Table({ tableName: 'user_roles', timestamps: true })
export class UserRoleModel extends Model<UserRoleModel> {
  @PrimaryKey
  @ForeignKey(() => UserModel)
  @Column(DataType.BIGINT)
  declare userId: number;

  @PrimaryKey
  @ForeignKey(() => RoleModel)
  @Column(DataType.BIGINT)
  declare roleId: number;
}
