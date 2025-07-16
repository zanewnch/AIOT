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

import bcrypt from 'bcrypt';
import { PermissionModel } from '../models/rbac/PermissionModel.js';
import { RoleModel } from '../models/rbac/RoleModel.js';
import { RolePermissionModel } from '../models/rbac/RoleToPermissionModel.js';
import { UserModel } from '../models/rbac/UserModel.js';
import { UserRoleModel } from '../models/rbac/UserToRoleModel.js';
import { ProgressCallback, TaskStage } from '../types/ProgressTypes.js';

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
   * 創建系統管理員帳號
   * 創建一個具有完整權限的管理員用戶
   * 
   * @param username 管理員用戶名（預設：admin）
   * @param password 管理員密碼（預設：admin）
   * @param email 管理員郵箱（預設：admin@admin.com）
   * @returns Promise<{success: boolean, message: string}> 創建結果
   * 
   * @example
   * ```typescript
   * const rbacService = new RbacInitService();
   * const result = await rbacService.createAdminUser('admin', 'admin');
   * console.log(result.message);
   * ```
   */
  async createAdminUser(
    username: string = 'admin',
    password: string = 'admin',
    email: string = 'admin@admin.com'
  ): Promise<{success: boolean, message: string}> {
    try {
      // 1. 創建必要的權限
      const permissions = await this.createAdminPermissions();
      
      // 2. 創建或獲取 admin 角色
      const adminRole = await this.createAdminRole();
      
      // 3. 關聯角色與權限
      await this.linkRolePermissions(adminRole, permissions);
      
      // 4. 創建管理員用戶
      const passwordHash = await bcrypt.hash(password, 10);
      const [user, userCreated] = await UserModel.findOrCreate({
        where: { username },
        defaults: {
          username,
          email,
          passwordHash,
        },
      });

      if (!userCreated) {
        return {
          success: true,
          message: `Admin user '${username}' already exists`,
        };
      }

      // 5. 指派 admin 角色給用戶
      await UserRoleModel.findOrCreate({
        where: { userId: user.id, roleId: adminRole.id },
        defaults: { userId: user.id, roleId: adminRole.id },
      });

      return {
        success: true,
        message: `Admin user '${username}' created successfully with full permissions`,
      };
    } catch (error) {
      console.error('Error creating admin user:', error);
      return {
        success: false,
        message: `Failed to create admin user: ${error}`,
      };
    }
  }

  /**
   * 創建管理員權限
   * 創建系統所需的所有權限
   */
  private async createAdminPermissions(): Promise<PermissionModel[]> {
    const permissionsData = [
      // 用戶管理權限
      { name: 'user:create', description: 'Create users' },
      { name: 'user:read', description: 'Read users' },
      { name: 'user:update', description: 'Update users' },
      { name: 'user:delete', description: 'Delete users' },
      
      // 角色管理權限
      { name: 'role:create', description: 'Create roles' },
      { name: 'role:read', description: 'Read roles' },
      { name: 'role:update', description: 'Update roles' },
      { name: 'role:delete', description: 'Delete roles' },
      
      // 權限管理權限
      { name: 'permission:create', description: 'Create permissions' },
      { name: 'permission:read', description: 'Read permissions' },
      { name: 'permission:update', description: 'Update permissions' },
      { name: 'permission:delete', description: 'Delete permissions' },
      
      // 數據訪問權限
      { name: 'data:view', description: 'View data' },
      { name: 'data:edit', description: 'Edit data' },
      { name: 'data:delete', description: 'Delete data' },
      
      // RTK 數據權限
      { name: 'rtk:read', description: 'Read RTK data' },
      { name: 'rtk:create', description: 'Create RTK data' },
      { name: 'rtk:update', description: 'Update RTK data' },
      { name: 'rtk:delete', description: 'Delete RTK data' },
      
      // 系統管理權限
      { name: 'system:admin', description: 'System administration' },
    ];

    const permissions: PermissionModel[] = [];
    
    for (const permData of permissionsData) {
      const [permission] = await PermissionModel.findOrCreate({
        where: { name: permData.name },
        defaults: permData,
      });
      permissions.push(permission);
    }
    
    return permissions;
  }

  /**
   * 創建管理員角色
   */
  private async createAdminRole(): Promise<RoleModel> {
    const [adminRole] = await RoleModel.findOrCreate({
      where: { name: 'admin' },
      defaults: {
        name: 'admin',
        displayName: 'System Administrator',
      },
    });
    
    return adminRole;
  }

  /**
   * 關聯角色與權限
   */
  private async linkRolePermissions(
    role: RoleModel,
    permissions: PermissionModel[]
  ): Promise<void> {
    for (const permission of permissions) {
      await RolePermissionModel.findOrCreate({
        where: { roleId: role.id, permissionId: permission.id },
        defaults: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  /**
   * 建立預設角色
   * 建立系統的三個基本角色：管理員、編輯者、檢視者
   * 
   * @private
   * @param {Record<string, number>} result - 統計結果物件，用於記錄建立的角色數量
   * @returns {Promise<Record<string, RoleModel>>} 角色名稱對應角色模型的對照表
   * 
   * @example
   * ```typescript
   * const result = { roles: 0 };
   * const roleMap = await this.seedRoles(result);
   * console.log(roleMap.admin); // RoleModel instance for admin role
   * ```
   * 
   * @remarks
   * 建立的角色包含：
   * - admin: 系統管理員角色
   * - editor: 編輯者角色
   * - viewer: 檢視者角色
   * 
   * 若角色已存在，則不會重複建立，但會回傳現有的角色實例
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
   * 建立 5000 筆測試用使用者帳戶供壓力測試使用
   * 
   * @param result 統計結果物件，用於記錄建立的使用者數量
   * @returns Promise<Record<string, UserModel>> 使用者名稱對應使用者模型的對照表
   * 
   * @private
   */
  private async seedUsers(result: Record<string, number>) {
    const TARGET_COUNT = 5000;
    const BATCH_SIZE = 1000; // 分批處理避免記憶體問題
    
    console.log(`正在生成 ${TARGET_COUNT} 筆使用者測試資料...`);
    
    // 預設密碼 hash (對應明文 "password123")
    const defaultPasswordHash = await bcrypt.hash('password123', 10);
    
    const userMap: Record<string, UserModel> = {};
    let totalCreated = 0;
    
    // 分批處理使用者創建
    for (let batchStart = 0; batchStart < TARGET_COUNT; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, TARGET_COUNT);
      const usersData = [];
      
      // 生成當前批次的使用者資料
      for (let i = batchStart; i < batchEnd; i++) {
        const userId = i + 1;
        usersData.push({
          username: `user_${userId.toString().padStart(5, '0')}`,
          email: `user${userId}@test.com`,
          passwordHash: defaultPasswordHash,
        });
      }
      
      console.log(`正在處理第 ${Math.floor(batchStart / BATCH_SIZE) + 1} 批次 (${batchStart + 1}-${batchEnd})...`);
      
      // 批量創建使用者
      const createdUsers = await UserModel.bulkCreate(
        usersData,
        { 
          ignoreDuplicates: true, // 忽略重複項目
          returning: true, // 返回創建的記錄
        }
      );
      
      // 將創建的使用者加入 userMap
      for (let i = 0; i < createdUsers.length; i++) {
        const user = createdUsers[i];
        userMap[user.username] = user;
      }
      
      totalCreated += createdUsers.length;
      console.log(`批次完成，已創建 ${createdUsers.length} 筆使用者資料`);
    }
    
    result.users = totalCreated;
    console.log(`成功創建總計 ${totalCreated} 筆使用者資料`);
    
    // 為了保持原有邏輯的相容性，確保 alice 和 bob 存在
    const legacyUsers = [
      { username: 'alice', email: 'alice@mail.com', passwordHash: defaultPasswordHash },
      { username: 'bob', email: 'bob@mail.com', passwordHash: defaultPasswordHash },
    ];
    
    for (const data of legacyUsers) {
      if (!userMap[data.username]) {
        const [user, created] = await UserModel.findOrCreate({ 
          where: { username: data.username }, 
          defaults: data 
        });
        if (created) result.users += 1;
        userMap[data.username] = user;
      }
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

  /**
   * 建立 RBAC 示範資料（支援進度回調）
   * 與 seedRbacDemo 相同功能，但支援進度追蹤回調
   * 
   * @param progressCallback 進度回調函數
   * @returns Promise<Record<string, number>> 包含各類型資料建立數量的統計結果
   */
  async seedRbacDemoWithProgress(progressCallback?: ProgressCallback): Promise<Record<string, number>> {
    const result = {
      users: 0,
      roles: 0,
      permissions: 0,
      userRoles: 0,
      rolePermissions: 0,
    } as Record<string, number>;

    // 通知開始建立角色
    if (progressCallback) {
      progressCallback({
        taskId: '',
        status: 'running' as any,
        stage: TaskStage.CREATING_RELATIONSHIPS,
        percentage: 0,
        current: 5000, // RTK 部分已完成
        total: 10000,
        message: '正在建立角色...',
        startTime: new Date(),
        lastUpdated: new Date()
      });
    }

    const roleMap = await this.seedRoles(result);
    
    // 通知建立權限
    if (progressCallback) {
      progressCallback({
        taskId: '',
        status: 'running' as any,
        stage: TaskStage.CREATING_RELATIONSHIPS,
        percentage: 0,
        current: 5100,
        total: 10000,
        message: '正在建立權限...',
        startTime: new Date(),
        lastUpdated: new Date()
      });
    }
    
    const permMap = await this.seedPermissions(result);
    
    // 通知建立使用者（這是最耗時的部分）
    if (progressCallback) {
      progressCallback({
        taskId: '',
        status: 'running' as any,
        stage: TaskStage.INSERTING_USERS,
        percentage: 0,
        current: 5200,
        total: 10000,
        message: '正在建立使用者...',
        startTime: new Date(),
        lastUpdated: new Date()
      });
    }
    
    const userMap = await this.seedUsersWithProgress(result, progressCallback);
    
    // 通知建立關聯關係
    if (progressCallback) {
      progressCallback({
        taskId: '',
        status: 'running' as any,
        stage: TaskStage.CREATING_RELATIONSHIPS,
        percentage: 0,
        current: 9500,
        total: 10000,
        message: '正在建立角色權限關聯...',
        startTime: new Date(),
        lastUpdated: new Date()
      });
    }
    
    await this.seedRolePermissions(roleMap, permMap, result);
    
    if (progressCallback) {
      progressCallback({
        taskId: '',
        status: 'running' as any,
        stage: TaskStage.CREATING_RELATIONSHIPS,
        percentage: 0,
        current: 9800,
        total: 10000,
        message: '正在建立使用者角色關聯...',
        startTime: new Date(),
        lastUpdated: new Date()
      });
    }
    
    await this.seedUserRoles(userMap, roleMap, result);

    return result;
  }

  /**
   * 建立示範使用者（支援進度回調）
   * 建立 5000 筆測試用使用者帳戶供壓力測試使用，支援進度追蹤
   * 
   * @param result 統計結果物件，用於記錄建立的使用者數量
   * @param progressCallback 進度回調函數
   * @returns Promise<Record<string, UserModel>> 使用者名稱對應使用者模型的對照表
   * 
   * @private
   */
  private async seedUsersWithProgress(
    result: Record<string, number>, 
    progressCallback?: ProgressCallback
  ): Promise<Record<string, UserModel>> {
    const TARGET_COUNT = 5000;
    const BATCH_SIZE = 1000; // 分批處理避免記憶體問題
    
    console.log(`正在生成 ${TARGET_COUNT} 筆使用者測試資料...`);
    
    // 預設密碼 hash (對應明文 "password123")
    const defaultPasswordHash = await bcrypt.hash('password123', 10);
    
    const userMap: Record<string, UserModel> = {};
    let totalCreated = 0;
    
    // 分批處理使用者創建
    for (let batchStart = 0; batchStart < TARGET_COUNT; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, TARGET_COUNT);
      const usersData = [];
      
      // 生成當前批次的使用者資料
      for (let i = batchStart; i < batchEnd; i++) {
        const userId = i + 1;
        usersData.push({
          username: `user_${userId.toString().padStart(5, '0')}`,
          email: `user${userId}@test.com`,
          passwordHash: defaultPasswordHash,
        });
      }
      
      console.log(`正在處理第 ${Math.floor(batchStart / BATCH_SIZE) + 1} 批次 (${batchStart + 1}-${batchEnd})...`);
      
      // 通知進度
      if (progressCallback) {
        const current = 5200 + batchStart; // 基礎進度 + 當前批次進度
        progressCallback({
          taskId: '',
          status: 'running' as any,
          stage: TaskStage.INSERTING_USERS,
          percentage: 0, // 會被 ProgressService 重新計算
          current,
          total: 10000,
          message: `正在插入第 ${Math.floor(batchStart / BATCH_SIZE) + 1} 批次使用者資料 (${batchStart + 1}-${batchEnd})`,
          startTime: new Date(),
          lastUpdated: new Date()
        });
      }
      
      // 批量創建使用者
      const createdUsers = await UserModel.bulkCreate(
        usersData,
        { 
          ignoreDuplicates: true, // 忽略重複項目
          returning: true, // 返回創建的記錄
        }
      );
      
      // 將創建的使用者加入 userMap
      for (let i = 0; i < createdUsers.length; i++) {
        const user = createdUsers[i];
        userMap[user.username] = user;
      }
      
      totalCreated += createdUsers.length;
      console.log(`批次完成，已創建 ${createdUsers.length} 筆使用者資料`);
    }
    
    result.users = totalCreated;
    console.log(`成功創建總計 ${totalCreated} 筆使用者資料`);
    
    // 為了保持原有邏輯的相容性，確保 alice 和 bob 存在
    const legacyUsers = [
      { username: 'alice', email: 'alice@mail.com', passwordHash: defaultPasswordHash },
      { username: 'bob', email: 'bob@mail.com', passwordHash: defaultPasswordHash },
    ];
    
    for (const data of legacyUsers) {
      if (!userMap[data.username]) {
        const [user, created] = await UserModel.findOrCreate({ 
          where: { username: data.username }, 
          defaults: data 
        });
        if (created) result.users += 1;
        userMap[data.username] = user;
      }
    }
    
    return userMap;
  }
}
