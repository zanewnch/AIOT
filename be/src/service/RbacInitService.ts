import { Sequelize } from 'sequelize-typescript';
import { PermissionModel } from '../models/rbac/PermissionModel.js';
import { RoleModel } from '../models/rbac/RoleModel.js';
import { RolePermissionModel } from '../models/rbac/RoleToPermissionModel.js';
import { UserModel } from '../models/rbac/UserModel.js';
import { UserRoleModel } from '../models/rbac/UserToRoleModel.js';

/**
 * seedRbacDemo – 一次性插入示範 RBAC 資料
 * ------------------------------------------------
 * 可安全重覆呼叫（idempotent）；已存在的資料不會重覆建立。
 */
export async function seedRbacDemo() {
  const result = {
    users: 0,
    roles: 0,
    permissions: 0,
    userRoles: 0,
    rolePermissions: 0,
  } as Record<string, number>;

  // 1. Roles
  const rolesData = [
    { name: 'admin', displayName: 'system admin' },
    { name: 'editor', displayName: 'editor' },
    { name: 'viewer', displayName: 'only read' },
  ];
  const roleMap: Record<string, RoleModel> = {};
  for (const data of rolesData) {
    const [role, created] = await RoleModel.findOrCreate({ where: { name: data.name }, defaults: data });
    if (created) result.roles += 1;
    roleMap[data.name] = role;
  }

  // 2. Permissions
  const permsData = [
    { name: 'user:delete', description: 'delete user' },
    { name: 'post:edit', description: 'edit post' },
    { name: 'data:view', description: 'view data' },
  ];
  const permMap: Record<string, PermissionModel> = {};
  for (const data of permsData) {
    const [perm, created] = await PermissionModel.findOrCreate({ where: { name: data.name }, defaults: data });
    if (created) result.permissions += 1;
    permMap[data.name] = perm;
  }

  // 3. Users (已經是雜湊過的密碼)
  const usersData = [
    { username: 'alice', email: 'alice@mail.com', passwordHash: '$2a$10$...' },
    { username: 'bob', email: 'bob@mail.com', passwordHash: '$2a$10$...' },
  ];
  const userMap: Record<string, UserModel> = {};
  for (const data of usersData) {
    const [user, created] = await UserModel.findOrCreate({ where: { username: data.username }, defaults: data });
    if (created) result.users += 1;
    userMap[data.username] = user;
  }

  // 4. Role-Permission 關聯
  const rolePermMatrix: Array<{ role: string; perm: string }> = [
    { role: 'admin', perm: 'user:delete' },
    { role: 'admin', perm: 'post:edit' },
    { role: 'admin', perm: 'data:view' },
    { role: 'editor', perm: 'post:edit' },
    { role: 'editor', perm: 'data:view' },
    { role: 'viewer', perm: 'data:view' },
  ];

  for (const pair of rolePermMatrix) {
    const roleId = roleMap[pair.role].id;
    const permId = permMap[pair.perm].id;
    const [, created] = await RolePermissionModel.findOrCreate({
      where: { roleId, permissionId: permId },
      defaults: { roleId, permissionId: permId },
    });
    if (created) result.rolePermissions += 1;
  }

  // 5. User-Role 關聯
  const userRoleMatrix: Array<{ user: string; role: string }> = [
    { user: 'alice', role: 'admin' },
    { user: 'bob', role: 'editor' },
  ];
  for (const pair of userRoleMatrix) {
    const userId = userMap[pair.user].id;
    const roleId = roleMap[pair.role].id;
    const [, created] = await UserRoleModel.findOrCreate({
      where: { userId, roleId },
      defaults: { userId, roleId },
    });
    if (created) result.userRoles += 1;
  }

  return result;
}
