/**
 * @fileoverview RBAC 初始化服務層
 *
 * 負責處理角色型存取控制（RBAC）系統的初始化相關業務邏輯。
 * 提供完整的 RBAC 示範資料建立，包含使用者、角色、權限及其關聯關係。
 *
 * 主要功能：
 * - 建立預設角色（管理員、編輯者、檢視者）
 * - 建立基本權限集合
 * - 建立示範使用者帳戶
 * - 配置角色與權限的關聯關係
 * - 指派使用者角色
 * - 支援大量測試資料生成和壓力測試
 *
 * 使用情境：
 * - 系統首次部署時的 RBAC 資料初始化
 * - 開發環境的測試資料準備
 * - RBAC 功能的示範資料建立
 * - 壓力測試資料生成
 *
 * RBAC 架構：
 * ```
 * User ←→ UserRole ←→ Role ←→ RolePermission ←→ Permission
 * ```
 *
 * 安全性考量：
 * - 所有密碼使用 bcrypt 進行雜湊處理
 * - 支援重複執行不會產生重複資料
 * - 分批處理避免記憶體溢出
 * - 完整的錯誤處理和進度追蹤
 *
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-18
 */

// 匯入 bcrypt 加密庫，用於密碼雜湊處理
import bcrypt from 'bcrypt';
// 匯入資料存取層，用於資料庫操作
import { PermissionRepository } from '../repo/PermissionRepo.js';
import { IPermissionRepository } from '../types/repositories/IPermissionRepository.js';
import { RoleRepository } from '../repo/RoleRepo.js';
import { IRoleRepository } from '../types/repositories/IRoleRepository.js';
import { RolePermissionRepository } from '../repo/RolePermissionRepo.js';
import { IRolePermissionRepository } from '../types/repositories/IRolePermissionRepository.js';
import { UserRepository } from '../repo/UserRepo.js';
import { IUserRepository } from '../types/repositories/IUserRepository.js';
import { UserRoleRepository } from '../repo/UserRoleRepo.js';
import { IUserRoleRepository } from '../types/repositories/IUserRoleRepository.js';
// 匯入模型類型，用於類型定義
import { PermissionModel } from '../models/rbac/PermissionModel.js';
import { RoleModel } from '../models/rbac/RoleModel.js';
import { UserModel } from '../models/rbac/UserModel.js';
// 匯入進度追蹤相關類型，用於支援進度回調和任務階段管理
import { ProgressCallback, TaskStage } from '../types/ProgressTypes.js';

// 匯入日誌記錄器
import { createLogger } from '../configs/loggerConfig.js';
// 匯入服務結果類別
import { ServiceResult } from '../utils/ServiceResult.js';

const logger = createLogger('RbacInitService');

/**
 * RBAC 初始化服務類別
 * 提供完整的 RBAC 系統初始化功能
 */
export class RbacInitService {
  private permissionRepository: IPermissionRepository;
  private roleRepository: IRoleRepository;
  private rolePermissionRepository: IRolePermissionRepository;
  private userRepository: IUserRepository;
  private userRoleRepository: IUserRoleRepository;

  /**
   * 建構函式
   * 初始化所有必要的資料存取層
   */
  constructor() {
    this.permissionRepository = new PermissionRepository(); // 設定權限資料存取層實例
    this.roleRepository = new RoleRepository(); // 設定角色資料存取層實例
    this.rolePermissionRepository = new RolePermissionRepository(); // 設定角色權限關聯資料存取層實例
    this.userRepository = new UserRepository(); // 設定使用者資料存取層實例
    this.userRoleRepository = new UserRoleRepository(); // 設定使用者角色關聯資料存取層實例
  }
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
  async seedRbacDemo() { // 異步方法：建立完整的 RBAC 示範資料
    logger.info('Starting RBAC demo data seeding process'); // 記錄 RBAC 示範資料建立流程開始的資訊日誌

    const result = { // 建立統計結果物件，記錄各類型資料的建立數量
      users: 0, // 使用者建立數量，初始為 0
      roles: 0, // 角色建立數量，初始為 0
      permissions: 0, // 權限建立數量，初始為 0
      userRoles: 0, // 使用者角色關聯建立數量，初始為 0
      rolePermissions: 0, // 角色權限關聯建立數量，初始為 0
    } as Record<string, number>; // 型別註解為字串鍵對應數字值的記錄物件

    const roleMap = await this.seedRoles(result); // 調用私有方法建立角色資料，並取得角色對照表
    const permMap = await this.seedPermissions(result); // 調用私有方法建立權限資料，並取得權限對照表
    const userMap = await this.seedUsers(result); // 調用私有方法建立使用者資料，並取得使用者對照表

    await this.seedRolePermissions(roleMap, permMap, result); // 調用私有方法建立角色與權限的關聯關係
    await this.seedUserRoles(userMap, roleMap, result); // 調用私有方法建立使用者與角色的關聯關係

    logger.info(`RBAC demo data seeding completed: ${result.users} users, ${result.roles} roles, ${result.permissions} permissions`); // 記錄 RBAC 示範資料建立完成的統計資訊
    return result; // 回傳包含建立數量統計的結果物件
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
  async createAdminUser( // 異步方法：創建系統管理員帳號
    username: string = 'admin', // 管理員用戶名，預設為 'admin'
    password: string = 'admin', // 管理員密碼，預設為 'admin'
    email: string = 'admin@admin.com' // 管理員郵箱，預設為 'admin@admin.com'
  ): Promise<{success: boolean, message: string}> { // 回傳包含成功狀態和訊息的 Promise 物件
    try { // 嘗試執行管理員帳號創建流程
      // 1. 創建必要的權限
      const permissions = await this.createAdminPermissions(); // 調用私有方法創建管理員所需的所有權限

      // 2. 創建或獲取 admin 角色
      const adminRole = await this.createAdminRole(); // 調用私有方法創建或取得管理員角色

      // 3. 關聯角色與權限
      await this.linkRolePermissions(adminRole, permissions); // 調用私有方法將所有權限關聯到管理員角色

      // 4. 創建管理員用戶
      const passwordHash = await bcrypt.hash(password, 10); // 使用 bcrypt 將明文密碼雜湊化，鹽值為 10
      const [user, userCreated] = await this.userRepository.findOrCreate( // 查找或創建使用者，回傳使用者物件和是否為新創建的布林值
        { username }, // 查找條件：根據使用者名稱
        { // 如果不存在則創建的資料
          username, // 使用者名稱
          email, // 電子郵件地址
          passwordHash, // 雜湊後的密碼
        }
      );

      if (!userCreated) { // 如果使用者已存在（非新創建）
        return ServiceResult.success(`Admin user '${username}' already exists`); // 回傳成功結果，但表示使用者已存在
      }

      // 5. 指派 admin 角色給用戶
      await this.userRoleRepository.findOrCreate(user.id, adminRole.id); // 創建使用者與管理員角色的關聯關係

      return ServiceResult.success(`Admin user '${username}' created successfully with full permissions`); // 回傳創建成功的結果
    } catch (error) { // 捕獲創建過程中的任何錯誤
      logger.error('Error creating admin user:', error); // 記錄錯誤日誌
      return ServiceResult.failure(`Failed to create admin user: ${error}`); // 回傳失敗結果
    }
  }

  /**
   * 創建管理員權限
   * 創建系統所需的所有權限
   */
  private async createAdminPermissions(): Promise<PermissionModel[]> { // 私有異步方法：創建管理員權限
    const permissionsData = [ // 定義管理員所需的所有權限資料陣列
      // 用戶管理權限
      { name: 'user:create', description: 'Create users' }, // 創建使用者權限
      { name: 'user:read', description: 'Read users' }, // 讀取使用者權限
      { name: 'user:update', description: 'Update users' }, // 更新使用者權限
      { name: 'user:delete', description: 'Delete users' }, // 刪除使用者權限

      // 角色管理權限
      { name: 'role:create', description: 'Create roles' }, // 創建角色權限
      { name: 'role:read', description: 'Read roles' }, // 讀取角色權限
      { name: 'role:update', description: 'Update roles' }, // 更新角色權限
      { name: 'role:delete', description: 'Delete roles' }, // 刪除角色權限

      // 權限管理權限
      { name: 'permission:create', description: 'Create permissions' }, // 創建權限的權限
      { name: 'permission:read', description: 'Read permissions' }, // 讀取權限的權限
      { name: 'permission:update', description: 'Update permissions' }, // 更新權限的權限
      { name: 'permission:delete', description: 'Delete permissions' }, // 刪除權限的權限

      // 數據訪問權限
      { name: 'data:view', description: 'View data' }, // 檢視資料權限
      { name: 'data:edit', description: 'Edit data' }, // 編輯資料權限
      { name: 'data:delete', description: 'Delete data' }, // 刪除資料權限

      // RTK 數據權限
      { name: 'rtk:read', description: 'Read RTK data' }, // 讀取 RTK 資料權限
      { name: 'rtk:create', description: 'Create RTK data' }, // 創建 RTK 資料權限
      { name: 'rtk:update', description: 'Update RTK data' }, // 更新 RTK 資料權限
      { name: 'rtk:delete', description: 'Delete RTK data' }, // 刪除 RTK 資料權限

      // 系統管理權限
      { name: 'system:admin', description: 'System administration' }, // 系統管理權限
    ];

    const permissions: PermissionModel[] = []; // 建立權限模型陣列，用於儲存創建的權限物件

    for (const permData of permissionsData) { // 遍歷所有權限資料
      const [permission] = await this.permissionRepository.findOrCreate( // 查找或創建權限，只取回傳的第一個值（權限物件）
        { name: permData.name }, // 查找條件：根據權限名稱
        permData // 如果不存在則創建的權限資料
      );
      permissions.push(permission); // 將權限物件加入權限陣列
    }

    return permissions; // 回傳包含所有管理員權限的陣列
  }

  /**
   * 創建管理員角色
   */
  private async createAdminRole(): Promise<RoleModel> { // 私有異步方法：創建管理員角色
    const [adminRole] = await this.roleRepository.findOrCreate( // 查找或創建管理員角色，只取回傳的第一個值（角色物件）
      { name: 'admin' }, // 查找條件：根據角色名稱 'admin'
      { // 如果不存在則創建的角色資料
        name: 'admin', // 角色名稱為 'admin'
        displayName: 'System Administrator', // 角色顯示名稱為「系統管理員」
      }
    );

    return adminRole; // 回傳管理員角色物件
  }

  /**
   * 關聯角色與權限
   */
  private async linkRolePermissions( // 私有異步方法：關聯角色與權限
    role: RoleModel, // 要關聯的角色物件
    permissions: PermissionModel[] // 要關聯的權限物件陣列
  ): Promise<void> { // 無回傳值的 Promise
    for (const permission of permissions) { // 遍歷所有權限物件
      await this.rolePermissionRepository.findOrCreate(role.id, permission.id); // 查找或創建角色權限關聯，建立角色 ID 與權限 ID 的關聯關係
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
  private async seedRoles(result: Record<string, number>) { // 私有異步方法：建立預設角色
    const rolesData = [ // 定義預設角色資料陣列
      { name: 'admin', displayName: 'system admin' }, // 管理員角色，顯示名稱為「系統管理員」
      { name: 'editor', displayName: 'editor' }, // 編輯者角色，顯示名稱為「編輯者」
      { name: 'viewer', displayName: 'only read' }, // 檢視者角色，顯示名稱為「只能讀取」
    ];
    const roleMap: Record<string, RoleModel> = {}; // 建立角色對照表，將角色名稱對應到角色物件

    for (const data of rolesData) { // 遍歷所有角色資料
      const [role, created] = await this.roleRepository.findOrCreate({ name: data.name }, data); // 查找或創建角色，回傳角色物件和是否為新創建的布林值
      if (created) result.roles += 1; // 如果是新創建的角色，將角色計數器加 1
      roleMap[data.name] = role; // 將角色物件加入對照表，以角色名稱為鍵
    }

    return roleMap; // 回傳角色對照表
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
  private async seedPermissions(result: Record<string, number>) { // 私有異步方法：建立預設權限
    const permsData = [ // 定義基本權限資料陣列
      { name: 'user:delete', description: 'delete user' }, // 刪除使用者權限
      { name: 'post:edit', description: 'edit post' }, // 編輯文章權限
      { name: 'data:view', description: 'view data' }, // 檢視資料權限
    ];
    const permMap: Record<string, PermissionModel> = {}; // 建立權限對照表，將權限名稱對應到權限物件

    for (const data of permsData) { // 遍歷所有權限資料
      const [perm, created] = await this.permissionRepository.findOrCreate({ name: data.name }, data); // 查找或創建權限，回傳權限物件和是否為新創建的布林值
      if (created) result.permissions += 1; // 如果是新創建的權限，將權限計數器加 1
      permMap[data.name] = perm; // 將權限物件加入對照表，以權限名稱為鍵
    }

    return permMap; // 回傳權限對照表
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
  private async seedUsers(result: Record<string, number>) { // 私有異步方法：建立示範使用者
    const TARGET_COUNT = 5000; // 目標使用者建立數量為 5000 筆
    const BATCH_SIZE = 1000; // 每批次處理 1000 筆資料，分批處理避免記憶體問題

    logger.info(`Generating ${TARGET_COUNT} user test data records`); // 記錄開始生成測試使用者資料的資訊日誌

    // 預設密碼 hash (對應明文 "password123")
    const defaultPasswordHash = await bcrypt.hash('password123', 10); // 使用 bcrypt 雜湊化預設密碼，鹽值為 10

    const userMap: Record<string, UserModel> = {}; // 建立使用者對照表，將使用者名稱對應到使用者物件
    let totalCreated = 0; // 總共創建的使用者數量計數器，初始為 0

    // 分批處理使用者創建
    for (let batchStart = 0; batchStart < TARGET_COUNT; batchStart += BATCH_SIZE) { // 以批次大小為間隔遍歷所有目標使用者
      const batchEnd = Math.min(batchStart + BATCH_SIZE, TARGET_COUNT); // 計算當前批次的結束位置，避免超過目標數量
      const usersData = []; // 建立當前批次的使用者資料陣列

      // 生成當前批次的使用者資料
      for (let i = batchStart; i < batchEnd; i++) { // 遍歷當前批次的索引範圍
        const userId = i + 1; // 使用者 ID 從 1 開始（索引 + 1）
        usersData.push({ // 將使用者資料加入批次陣列
          username: `user_${userId.toString().padStart(5, '0')}`, // 生成格式化的使用者名稱，如 user_00001
          email: `user${userId}@test.com`, // 生成測試用電子郵件地址
          passwordHash: defaultPasswordHash, // 使用預設的雜湊密碼
        });
      }

      const batchNumber = Math.floor(batchStart / BATCH_SIZE) + 1; // 計算當前批次編號（從 1 開始）
      logger.info(`Processing user batch ${batchNumber} (records ${batchStart + 1}-${batchEnd})`); // 記錄當前批次處理進度的資訊日誌

      // 批量創建使用者
      const createdUsers = await this.userRepository.bulkCreate(usersData); // 調用資料存取層的批量創建方法

      // 將創建的使用者加入 userMap
      for (let i = 0; i < createdUsers.length; i++) { // 遍歷創建成功的使用者陣列
        const user = createdUsers[i]; // 取得當前使用者物件
        userMap[user.username] = user; // 將使用者物件加入對照表，以使用者名稱為鍵
      }

      totalCreated += createdUsers.length; // 累加總創建數量
      logger.debug(`Batch ${batchNumber} completed, created ${createdUsers.length} user records`); // 記錄批次完成的除錯日誌
    }

    result.users = totalCreated; // 將總創建數量設定到結果物件
    logger.info(`Successfully created ${totalCreated} user records in total`); // 記錄總體創建完成的資訊日誌

    // 為了保持原有邏輯的相容性，確保 alice 和 bob 存在
    const legacyUsers = [ // 定義舊版相容性使用者陣列
      { username: 'alice', email: 'alice@mail.com', passwordHash: defaultPasswordHash }, // alice 使用者資料
      { username: 'bob', email: 'bob@mail.com', passwordHash: defaultPasswordHash }, // bob 使用者資料
    ];

    for (const data of legacyUsers) { // 遍歷舊版相容性使用者
      if (!userMap[data.username]) { // 如果該使用者尚未存在於對照表中
        const [user, created] = await this.userRepository.findOrCreate( // 查找或創建使用者
          { username: data.username }, // 查找條件：根據使用者名稱
          data // 如果不存在則創建的使用者資料
        );
        if (created) result.users += 1; // 如果是新創建的使用者，將計數器加 1
        userMap[data.username] = user; // 將使用者物件加入對照表
      }
    }

    return userMap; // 回傳使用者對照表
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
  private async seedRolePermissions( // 私有異步方法：建立角色權限關聯
    roleMap: Record<string, RoleModel>, // 角色對照表，包含角色名稱對應的角色物件
    permMap: Record<string, PermissionModel>, // 權限對照表，包含權限名稱對應的權限物件
    result: Record<string, number> // 統計結果物件，用於記錄建立的關聯數量
  ) {
    const rolePermMatrix: Array<{ role: string; perm: string }> = [ // 定義角色權限關聯矩陣，配置各角色應擁有的權限
      { role: 'admin', perm: 'user:delete' }, // 管理員角色擁有刪除使用者權限
      { role: 'admin', perm: 'post:edit' }, // 管理員角色擁有編輯文章權限
      { role: 'admin', perm: 'data:view' }, // 管理員角色擁有檢視資料權限
      { role: 'editor', perm: 'post:edit' }, // 編輯者角色擁有編輯文章權限
      { role: 'editor', perm: 'data:view' }, // 編輯者角色擁有檢視資料權限
      { role: 'viewer', perm: 'data:view' }, // 檢視者角色僅擁有檢視資料權限
    ];

    for (const pair of rolePermMatrix) { // 遍歷所有角色權限關聯配置
      const roleId = roleMap[pair.role].id; // 從角色對照表取得角色 ID
      const permId = permMap[pair.perm].id; // 從權限對照表取得權限 ID
      const [, created] = await this.rolePermissionRepository.findOrCreate(roleId, permId); // 查找或創建角色權限關聯，只取第二個回傳值（是否為新創建）
      if (created) result.rolePermissions += 1; // 如果是新創建的關聯，將關聯計數器加 1
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
  private async seedUserRoles( // 私有異步方法：建立使用者角色關聯
    userMap: Record<string, UserModel>, // 使用者對照表，包含使用者名稱對應的使用者物件
    roleMap: Record<string, RoleModel>, // 角色對照表，包含角色名稱對應的角色物件
    result: Record<string, number> // 統計結果物件，用於記錄建立的關聯數量
  ) {
    const userRoleMatrix: Array<{ user: string; role: string }> = [ // 定義使用者角色關聯矩陣，配置各使用者應擁有的角色
      { user: 'alice', role: 'admin' }, // alice 使用者指派為管理員角色
      { user: 'bob', role: 'editor' }, // bob 使用者指派為編輯者角色
    ];

    for (const pair of userRoleMatrix) { // 遍歷所有使用者角色關聯配置
      const userId = userMap[pair.user].id; // 從使用者對照表取得使用者 ID
      const roleId = roleMap[pair.role].id; // 從角色對照表取得角色 ID
      const [, created] = await this.userRoleRepository.findOrCreate(userId, roleId); // 查找或創建使用者角色關聯，只取第二個回傳值（是否為新創建）
      if (created) result.userRoles += 1; // 如果是新創建的關聯，將關聯計數器加 1
    }
  }

  /**
   * 建立 RBAC 示範資料（支援進度回調）
   * 與 seedRbacDemo 相同功能，但支援進度追蹤回調
   *
   * @param progressCallback 進度回調函數
   * @returns Promise<Record<string, number>> 包含各類型資料建立數量的統計結果
   */
  async seedRbacDemoWithProgress(progressCallback?: ProgressCallback): Promise<Record<string, number>> { // 異步方法：建立 RBAC 示範資料（支援進度回調）
    const result = { // 建立統計結果物件，記錄各類型資料的建立數量
      users: 0, // 使用者建立數量，初始為 0
      roles: 0, // 角色建立數量，初始為 0
      permissions: 0, // 權限建立數量，初始為 0
      userRoles: 0, // 使用者角色關聯建立數量，初始為 0
      rolePermissions: 0, // 角色權限關聯建立數量，初始為 0
    } as Record<string, number>; // 型別註解為字串鍵對應數字值的記錄物件

    // 通知開始建立角色
    if (progressCallback) { // 如果提供了進度回調函數
      progressCallback({ // 調用進度回調函數，通知當前狀態
        taskId: '', // 任務 ID（空字串）
        status: 'running' as any, // 任務狀態為執行中
        stage: TaskStage.CREATING_RELATIONSHIPS, // 任務階段為建立關聯關係
        percentage: 0, // 進度百分比（會由 ProgressService 重新計算）
        current: 5000, // 當前進度值，RTK 部分已完成
        total: 10000, // 總工作量
        message: '正在建立角色...', // 進度訊息
        startTime: new Date(), // 開始時間為當前時間
        lastUpdated: new Date() // 最後更新時間為當前時間
      });
    }

    const roleMap = await this.seedRoles(result); // 調用私有方法建立角色資料，並取得角色對照表

    // 通知建立權限
    if (progressCallback) { // 如果提供了進度回調函數
      progressCallback({ // 調用進度回調函數，通知權限建立狀態
        taskId: '', // 任務 ID（空字串）
        status: 'running' as any, // 任務狀態為執行中
        stage: TaskStage.CREATING_RELATIONSHIPS, // 任務階段為建立關聯關係
        percentage: 0, // 進度百分比（會由 ProgressService 重新計算）
        current: 5100, // 當前進度值，角色建立完成
        total: 10000, // 總工作量
        message: '正在建立權限...', // 進度訊息
        startTime: new Date(), // 開始時間為當前時間
        lastUpdated: new Date() // 最後更新時間為當前時間
      });
    }

    const permMap = await this.seedPermissions(result); // 調用私有方法建立權限資料，並取得權限對照表

    // 通知建立使用者（這是最耗時的部分）
    if (progressCallback) { // 如果提供了進度回調函數
      progressCallback({ // 調用進度回調函數，通知使用者建立狀態
        taskId: '', // 任務 ID（空字串）
        status: 'running' as any, // 任務狀態為執行中
        stage: TaskStage.INSERTING_USERS, // 任務階段為插入使用者
        percentage: 0, // 進度百分比（會由 ProgressService 重新計算）
        current: 5200, // 當前進度值，權限建立完成
        total: 10000, // 總工作量
        message: '正在建立使用者...', // 進度訊息
        startTime: new Date(), // 開始時間為當前時間
        lastUpdated: new Date() // 最後更新時間為當前時間
      });
    }

    const userMap = await this.seedUsersWithProgress(result, progressCallback); // 調用支援進度回調的使用者建立方法

    // 通知建立關聯關係
    if (progressCallback) { // 如果提供了進度回調函數
      progressCallback({ // 調用進度回調函數，通知角色權限關聯建立狀態
        taskId: '', // 任務 ID（空字串）
        status: 'running' as any, // 任務狀態為執行中
        stage: TaskStage.CREATING_RELATIONSHIPS, // 任務階段為建立關聯關係
        percentage: 0, // 進度百分比（會由 ProgressService 重新計算）
        current: 9500, // 當前進度值，使用者建立完成
        total: 10000, // 總工作量
        message: '正在建立角色權限關聯...', // 進度訊息
        startTime: new Date(), // 開始時間為當前時間
        lastUpdated: new Date() // 最後更新時間為當前時間
      });
    }

    await this.seedRolePermissions(roleMap, permMap, result); // 調用私有方法建立角色與權限的關聯關係

    if (progressCallback) { // 如果提供了進度回調函數
      progressCallback({ // 調用進度回調函數，通知使用者角色關聯建立狀態
        taskId: '', // 任務 ID（空字串）
        status: 'running' as any, // 任務狀態為執行中
        stage: TaskStage.CREATING_RELATIONSHIPS, // 任務階段為建立關聯關係
        percentage: 0, // 進度百分比（會由 ProgressService 重新計算）
        current: 9800, // 當前進度值，角色權限關聯完成
        total: 10000, // 總工作量
        message: '正在建立使用者角色關聯...', // 進度訊息
        startTime: new Date(), // 開始時間為當前時間
        lastUpdated: new Date() // 最後更新時間為當前時間
      });
    }

    await this.seedUserRoles(userMap, roleMap, result); // 調用私有方法建立使用者與角色的關聯關係

    return result; // 回傳包含建立數量統計的結果物件
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
  private async seedUsersWithProgress( // 私有異步方法：建立示範使用者（支援進度回調）
    result: Record<string, number>, // 統計結果物件，用於記錄建立的使用者數量
    progressCallback?: ProgressCallback // 可選的進度回調函數，用於回報處理進度
  ): Promise<Record<string, UserModel>> { // 回傳使用者對照表的 Promise
    const TARGET_COUNT = 5000; // 目標使用者建立數量為 5000 筆
    const BATCH_SIZE = 1000; // 每批次處理 1000 筆資料，分批處理避免記憶體問題

    logger.info(`Generating ${TARGET_COUNT} user test data records with progress tracking`); // 記錄開始生成測試使用者資料的資訊日誌

    // 預設密碼 hash (對應明文 "password123")
    const defaultPasswordHash = await bcrypt.hash('password123', 10); // 使用 bcrypt 雜湊化預設密碼，鹽值為 10

    const userMap: Record<string, UserModel> = {}; // 建立使用者對照表，將使用者名稱對應到使用者物件
    let totalCreated = 0; // 總共創建的使用者數量計數器，初始為 0

    // 分批處理使用者創建
    for (let batchStart = 0; batchStart < TARGET_COUNT; batchStart += BATCH_SIZE) { // 以批次大小為間隔遍歷所有目標使用者
      const batchEnd = Math.min(batchStart + BATCH_SIZE, TARGET_COUNT); // 計算當前批次的結束位置，避免超過目標數量
      const usersData = []; // 建立當前批次的使用者資料陣列

      // 生成當前批次的使用者資料
      for (let i = batchStart; i < batchEnd; i++) { // 遍歷當前批次的索引範圍
        const userId = i + 1; // 使用者 ID 從 1 開始（索引 + 1）
        usersData.push({ // 將使用者資料加入批次陣列
          username: `user_${userId.toString().padStart(5, '0')}`, // 生成格式化的使用者名稱，如 user_00001
          email: `user${userId}@test.com`, // 生成測試用電子郵件地址
          passwordHash: defaultPasswordHash, // 使用預設的雜湊密碼
        });
      }

      const batchNumber = Math.floor(batchStart / BATCH_SIZE) + 1; // 計算當前批次編號（從 1 開始）
      logger.info(`Processing user batch ${batchNumber} with progress callback (records ${batchStart + 1}-${batchEnd})`); // 記錄當前批次處理進度的資訊日誌

      // 通知進度
      if (progressCallback) { // 如果提供了進度回調函數
        const current = 5200 + batchStart; // 計算當前進度值：基礎進度 + 當前批次進度
        progressCallback({ // 調用進度回調函數
          taskId: '', // 任務 ID（空字串）
          status: 'running' as any, // 任務狀態為執行中
          stage: TaskStage.INSERTING_USERS, // 任務階段為插入使用者
          percentage: 0, // 進度百分比（會被 ProgressService 重新計算）
          current, // 當前進度值
          total: 10000, // 總工作量
          message: `正在插入第 ${batchNumber} 批次使用者資料 (${batchStart + 1}-${batchEnd})`, // 詳細的進度訊息
          startTime: new Date(), // 開始時間為當前時間
          lastUpdated: new Date() // 最後更新時間為當前時間
        });
      }

      // 批量創建使用者
      const createdUsers = await this.userRepository.bulkCreate(usersData); // 調用資料存取層的批量創建方法

      // 將創建的使用者加入 userMap
      for (let i = 0; i < createdUsers.length; i++) { // 遍歷創建成功的使用者陣列
        const user = createdUsers[i]; // 取得當前使用者物件
        userMap[user.username] = user; // 將使用者物件加入對照表，以使用者名稱為鍵
      }

      totalCreated += createdUsers.length; // 累加總創建數量
      logger.debug(`Batch ${batchNumber} completed, created ${createdUsers.length} user records`); // 記錄批次完成的除錯日誌
    }

    result.users = totalCreated; // 將總創建數量設定到結果物件
    logger.info(`Successfully created ${totalCreated} user records with progress tracking`); // 記錄總體創建完成的資訊日誌

    // 為了保持原有邏輯的相容性，確保 alice 和 bob 存在
    const legacyUsers = [ // 定義舊版相容性使用者陣列
      { username: 'alice', email: 'alice@mail.com', passwordHash: defaultPasswordHash }, // alice 使用者資料
      { username: 'bob', email: 'bob@mail.com', passwordHash: defaultPasswordHash }, // bob 使用者資料
    ];

    for (const data of legacyUsers) { // 遍歷舊版相容性使用者
      if (!userMap[data.username]) { // 如果該使用者尚未存在於對照表中
        const [user, created] = await this.userRepository.findOrCreate( // 查找或創建使用者
          { username: data.username }, // 查找條件：根據使用者名稱
          data // 如果不存在則創建的使用者資料
        );
        if (created) result.users += 1; // 如果是新創建的使用者，將計數器加 1
        userMap[data.username] = user; // 將使用者物件加入對照表
      }
    }

    return userMap; // 回傳使用者對照表
  }
}
