import { Sequelize } from 'sequelize-typescript';
import { PermissionModel } from '../models/rbac/PermissionModel.js';
import { RoleModel } from '../models/rbac/RoleModel.js';
import { RolePermissionModel } from '../models/rbac/RoleToPermissionModel.js';
import { UserModel } from '../models/rbac/UserModel.js';
import { UserRoleModel } from '../models/rbac/UserToRoleModel.js';

export class RbacInitService {
  async seedRbacDemo() {
    const result = {
      users: 0,
      roles: 0,
      permissions: 0,
      userRoles: 0,
      rolePermissions: 0,
    } as Record<string, number>;

    const roleMap = await this.seedRoles(result);
    const permMap = await this.seedPermissions(result);
    const userMap = await this.seedUsers(result);
    
    await this.seedRolePermissions(roleMap, permMap, result);
    await this.seedUserRoles(userMap, roleMap, result);

    return result;
  }

  private async seedRoles(result: Record<string, number>) {
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
    
    return roleMap;
  }

  private async seedPermissions(result: Record<string, number>) {
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
    
    return permMap;
  }

  private async seedUsers(result: Record<string, number>) {
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
    
    return userMap;
  }

  private async seedRolePermissions(
    roleMap: Record<string, RoleModel>,
    permMap: Record<string, PermissionModel>,
    result: Record<string, number>
  ) {
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
  }

  private async seedUserRoles(
    userMap: Record<string, UserModel>,
    roleMap: Record<string, RoleModel>,
    result: Record<string, number>
  ) {
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
  }
}
