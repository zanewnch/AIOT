/**
 * RbacInitService - RBAC 初始化服務層
 * ==================================
 * 負責處理角色型存取控制（RBAC）系統的初始化相關業務邏輯。
 * 提供完整的 RBAC 示範資料建立，包含使用者、角色、權限及其關聯關係。
 * 
 * 主要功能：
 * - 建立預設角色（管理員、編輯者、檢視者）
 * - 建立基本權限集合
 * - 建立示範使用者帳戶
 * - 配置角色與權限的關聯關係
 * - 指派使用者角色
 * 
 * 使用情境：
 * - 系統首次部署時的 RBAC 資料初始化
 * - 開發環境的測試資料準備
 * - RBAC 功能的示範資料建立
 * 
 * RBAC 架構：
 * ```
 * User ←→ UserRole ←→ Role ←→ RolePermission ←→ Permission
 * ```
 */

import { PermissionModel } from '../models/rbac/PermissionModel.js';
import { RoleModel } from '../models/rbac/RoleModel.js';
import { RolePermissionModel } from '../models/rbac/RoleToPermissionModel.js';
import { UserModel } from '../models/rbac/UserModel.js';
import { UserRoleModel } from '../models/rbac/UserToRoleModel.js';

/**
 * RBAC 初始化服務類別
 * 提供完整的 RBAC 系統初始化功能
 */
export class RbacInitService {
  /**
   * 建立 RBAC 示範資料
   * 執行完整的 RBAC 初始化流程，包含角色、權限、使用者及其關聯關係
   * 
   * @returns Promise<Record<string, number>> 包含各類型資料建立數量的統計結果
   * 
   * @example
   * ```typescript
   * const rbacService = new RbacInitService();
   * const result = await rbacService.seedRbacDemo();
   * 
   * console.log(`建立了 ${result.users} 個使用者`);
   * console.log(`建立了 ${result.roles} 個角色`);
   * console.log(`建立了 ${result.permissions} 個權限`);
   * console.log(`建立了 ${result.userRoles} 個使用者角色關聯`);
   * console.log(`建立了 ${result.rolePermissions} 個角色權限關聯`);
   * ```
   * 
   * @remarks
   * 此方法會按順序執行以下步驟：
   * 1. 建立角色：admin, editor, viewer
   * 2. 建立權限：user:delete, post:edit, data:view
   * 3. 建立使用者：alice, bob
   * 4. 配置角色權限關聯
   * 5. 指派使用者角色
   * 
   * 若資料已存在，則不會重複建立
   */
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

  /**
   * 建立預設角色
   * 建立系統的三個基本角色：管理員、編輯者、檢視者
   * 
   * @param result 統計結果物件，用於記錄建立的角色數量
   * @returns Promise<Record<string, RoleModel>> 角色名稱對應角色模型的對照表
   * 
   * @private
   */
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

  /**
   * 建立預設權限
   * 建立系統的基本權限集合
   * 
   * @param result 統計結果物件，用於記錄建立的權限數量
   * @returns Promise<Record<string, PermissionModel>> 權限名稱對應權限模型的對照表
   * 
   * @private
   */
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

  /**
   * 建立示範使用者
   * 建立測試用的使用者帳戶
   * 
   * @param result 統計結果物件，用於記錄建立的使用者數量
   * @returns Promise<Record<string, UserModel>> 使用者名稱對應使用者模型的對照表
   * 
   * @private
   */
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

  /**
   * 建立角色權限關聯
   * 配置角色與權限的關聯關係，定義各角色的權限範圍
   * 
   * @param roleMap 角色對照表
   * @param permMap 權限對照表
   * @param result 統計結果物件，用於記錄建立的關聯數量
   * 
   * @private
   * 
   * @remarks
   * 權限配置：
   * - admin: 具有所有權限 (user:delete, post:edit, data:view)
   * - editor: 具有編輯和檢視權限 (post:edit, data:view)
   * - viewer: 僅具有檢視權限 (data:view)
   */
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

  /**
   * 建立使用者角色關聯
   * 指派使用者角色，建立使用者與角色的關聯關係
   * 
   * @param userMap 使用者對照表
   * @param roleMap 角色對照表
   * @param result 統計結果物件，用於記錄建立的關聯數量
   * 
   * @private
   * 
   * @remarks
   * 角色指派：
   * - alice: 指派為 admin 角色
   * - bob: 指派為 editor 角色
   */
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
