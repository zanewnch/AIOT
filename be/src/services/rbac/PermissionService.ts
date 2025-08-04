/**
 * @fileoverview 權限服務層
 *
 * 提供基於 RBAC 的權限檢查功能，整合 Redis 快取以提升效能。
 * 此服務負責處理使用者權限驗證、角色檢查和權限資料快取管理。
 *
 * 功能特點：
 * - 使用者權限檢查（單一、任一、全部）
 * - 使用者角色檢查
 * - Redis 快取機制，減少資料庫查詢
 * - 自動快取失效和更新
 * - 批量權限查詢
 *
 * 快取策略：
 * - 使用者權限快取：user_permissions:{userId}
 * - 使用者角色快取：user_roles:{userId}
 * - 預設快取時間：1 小時
 * - 支援強制重新整理快取
 *
 * 使用場景：
 * - API 路由權限驗證
 * - 前端頁面權限控制
 * - 業務邏輯權限檢查
 * - 批量使用者權限查詢
 *
 * 效能考量：
 * - 優先使用 Redis 快取
 * - 資料庫查詢僅在快取失效時執行
 * - 支援批量操作減少網路開銷
 * - 自動處理 Redis 連線異常
 *
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-18
 */

// 匯入使用者資料存取層，用於查詢使用者權限相關資料
import { UserRepository } from '../../repo/rbac/UserRepo.js';
// 匯入權限資料存取層，用於權限管理操作
import { PermissionRepository } from '../../repo/rbac/PermissionRepo.js';
import { IPermissionRepository } from '../../types/repositories/IPermissionRepository.js';
// 匯入權限模型類型
import { PermissionModel } from '../../models/rbac/PermissionModel.js';
// 匯入 Redis 客戶端配置，用於快取管理
import { getRedisClient } from '../../configs/redisConfig.js';
// 匯入 Redis 客戶端類型定義
import type { RedisClientType } from 'redis';
// 匯入日誌記錄器
import { createLogger, logPermissionCheck } from '../../configs/loggerConfig.js';
// 匯入權限服務介面和相關類型
import type {
    IPermissionService,
    UserPermissions,
    CacheOptions,
    PermissionDTO,
    CreatePermissionRequest,
    UpdatePermissionRequest
} from '../../types/services/IPermissionService.js';

// 創建服務專用的日誌記錄器
const logger = createLogger('PermissionService');

// 類型定義已移至 IPermissionService.ts 檔案

/**
 * 權限服務類別
 *
 * @class PermissionService
 * @implements {IPermissionService}
 */
export class PermissionService implements IPermissionService {
    private userRepository: UserRepository;
    private permissionRepository: IPermissionRepository;
    private static readonly PERMISSIONS_CACHE_PREFIX = 'user_permissions:';
    private static readonly ROLES_CACHE_PREFIX = 'user_roles:';
    private static readonly PERMISSION_CACHE_PREFIX = 'permission:';
    private static readonly ALL_PERMISSIONS_KEY = 'permissions:all';
    private static readonly DEFAULT_CACHE_TTL = 3600; // 1 小時

    /**
     * 建構函式
     * @param userRepository 使用者資料存取層
     * @param permissionRepository 權限資料存取層
     */
    constructor() {
        this.userRepository = new UserRepository();
        this.permissionRepository = new PermissionRepository();
    }

    /**
     * 取得 Redis 客戶端
     * 嘗試建立 Redis 連線，若失敗則拋出錯誤
     *
     * @returns Redis 客戶端實例
     * @throws Error 當 Redis 連線不可用時拋出錯誤
     *
     * @private
     */
    private getRedisClient(): RedisClientType {
        try {
            // 嘗試取得 Redis 客戶端實例
            return getRedisClient();
        } catch (error) {
            // 記錄警告訊息，提示將回退到資料庫查詢
            logger.warn('Redis not available, falling back to database queries');
            // 拋出錯誤以讓上層處理
            throw new Error('Redis connection is not available');
        }
    }

    /**
     * 生成使用者權限快取鍵值
     * 建立特定使用者的權限快取鍵值，格式為 "user_permissions:{userId}"
     *
     * @param userId 使用者 ID
     * @returns 權限快取鍵值
     *
     * @private
     */
    private getPermissionsCacheKey(userId: number): string {
        // 組合權限快取鍵值前綴和使用者 ID
        return `${PermissionService.PERMISSIONS_CACHE_PREFIX}${userId}`;
    }

    /**
     * 生成使用者角色快取鍵值
     * 建立特定使用者的角色快取鍵值，格式為 "user_roles:{userId}"
     *
     * @param userId 使用者 ID
     * @returns 角色快取鍵值
     *
     * @private
     */
    private getRolesCacheKey(userId: number): string {
        // 組合角色快取鍵值前綴和使用者 ID
        return `${PermissionService.ROLES_CACHE_PREFIX}${userId}`;
    }

    /**
     * 從快取取得使用者權限資料
     * 嘗試從 Redis 快取中取得使用者的權限資料
     *
     * @param userId 使用者 ID
     * @returns 使用者權限資料或 null（當快取不存在或發生錯誤時）
     *
     * @private
     */
    private async getCachedUserPermissions(userId: number): Promise<UserPermissions | null> {
        try {
            // 取得 Redis 客戶端
            const redis = this.getRedisClient();
            // 生成快取鍵值
            const cacheKey = this.getPermissionsCacheKey(userId);
            // 從 Redis 取得快取資料
            const cachedData = await redis.get(cacheKey);

            // 如果快取存在，解析 JSON 資料並回傳
            if (cachedData) {
                return JSON.parse(cachedData) as UserPermissions;
            }

            // 快取不存在時回傳 null
            return null;
        } catch (error) {
            // 記錄警告並回傳 null，讓上層回退到資料庫查詢
            logger.warn('Failed to get cached permissions:', error);
            return null;
        }
    }

    /**
     * 將使用者權限資料存入快取
     * @param userId 使用者 ID
     * @param permissions 權限資料
     * @param ttl 快取時間（秒）
     */
    private async setCachedUserPermissions(
        userId: number, // 要快取權限的使用者 ID
        permissions: UserPermissions, // 要儲存的使用者權限資料物件
        ttl: number = PermissionService.DEFAULT_CACHE_TTL // 快取存活時間，預設為 3600 秒（1小時）
    ): Promise<void> { // 回傳空的 Promise，表示異步操作完成
        try { // 嘗試執行快取儲存操作
            const redis = this.getRedisClient(); // 取得 Redis 客戶端連線實例
            const cacheKey = this.getPermissionsCacheKey(userId); // 生成該使用者的權限快取鍵值

            await redis.setEx( // 使用 Redis SETEX 命令設定有過期時間的鍵值
                cacheKey, // 快取鍵值，格式為 "user_permissions:{userId}"
                ttl, // 快取過期時間（秒）
                JSON.stringify(permissions) // 將權限物件序列化為 JSON 字串儲存
            );
        } catch (error) { // 捕獲任何快取操作錯誤
            logger.warn('Failed to cache permissions:', error); // 記錄警告訊息但不拋出錯誤，避免影響主要業務流程
        }
    }

    /**
     * 從資料庫取得使用者權限資料
     * @param userId 使用者 ID
     * @returns 使用者權限資料或 null
     */
    private async fetchUserPermissionsFromDB(userId: number): Promise<UserPermissions | null> { // 從資料庫取得使用者權限資料的私有方法
        try { // 嘗試執行資料庫查詢操作
            logger.debug(`Querying database for user ${userId} with roles and permissions`); // 記錄除錯訊息，說明正在查詢特定使用者的角色和權限
            const user = await this.userRepository.findByIdWithRolesAndPermissions(userId); // 透過使用者資料存取層查詢使用者及其關聯的角色和權限資料

            if (!user) { // 如果查詢結果為空，表示使用者不存在
                logger.warn(`User ${userId} not found in database`); // 記錄警告訊息
                return null; // 回傳 null 表示查詢失敗
            }

            // 提取所有權限（來自角色）
            const permissions = new Set<string>(); // 建立一個 Set 集合來儲存權限名稱，自動去除重複項
            const roles = new Set<string>(); // 建立一個 Set 集合來儲存角色名稱，自動去除重複項

            if (user.roles) { // 檢查使用者是否有指派角色
                logger.debug(`User ${userId} has ${user.roles.length} roles`); // 記錄使用者擁有的角色數量
                for (const role of user.roles) { // 遍歷使用者的每個角色
                    roles.add(role.name); // 將角色名稱加入角色集合中
                    logger.debug(`Processing role '${role.name}' for user ${userId}`); // 記錄正在處理的角色名稱

                    if (role.permissions) { // 檢查該角色是否有關聯的權限
                        logger.debug(`Role '${role.name}' has ${role.permissions.length} permissions`); // 記錄該角色擁有的權限數量
                        for (const permission of role.permissions) { // 遍歷角色的每個權限
                            permissions.add(permission.name); // 將權限名稱加入權限集合中
                        }
                    }
                }
            } else { // 如果使用者沒有角色
                logger.warn(`User ${userId} has no roles assigned`); // 記錄警告訊息
            }

            const result = { // 建立結果物件，包含使用者權限的完整資訊
                userId: user.id, // 使用者 ID
                username: user.username, // 使用者名稱
                permissions: Array.from(permissions), // 將權限 Set 轉換為陣列
                roles: Array.from(roles), // 將角色 Set 轉換為陣列
                lastUpdated: Date.now() // 記錄資料最後更新時間戳
            };

            logger.info(`User ${userId} (${user.username}) permissions loaded: ${result.permissions.join(', ')}`); // 記錄使用者載入的權限列表
            logger.info(`User ${userId} (${user.username}) roles: ${result.roles.join(', ')}`); // 記錄使用者載入的角色列表

            return result; // 回傳完整的使用者權限資料
        } catch (error) { // 捕獲任何資料庫查詢錯誤
            logger.error('Failed to fetch user permissions from database:', error); // 記錄錯誤訊息
            return null; // 回傳 null 表示查詢失敗
        }
    }

    /**
     * 取得使用者權限資料（支援快取）
     * @param userId 使用者 ID
     * @param options 快取選項
     * @returns 使用者權限資料或 null
     */
    public async getUserPermissions( // 公開方法：取得使用者權限資料（支援快取機制）
        userId: number, // 要查詢權限的使用者 ID
        options: CacheOptions = {} // 快取選項物件，預設為空物件
    ): Promise<UserPermissions | null> { // 回傳 Promise，包含使用者權限資料或 null
        const { ttl = PermissionService.DEFAULT_CACHE_TTL, forceRefresh = false } = options; // 解構快取選項，設定預設值

        logger.debug(`Getting permissions for user ${userId} (forceRefresh: ${forceRefresh})`); // 記錄除錯訊息，顯示查詢參數

        // 如果不強制重新整理，先嘗試從快取取得
        if (!forceRefresh) { // 檢查是否需要強制從資料庫重新載入
            const cachedPermissions = await this.getCachedUserPermissions(userId); // 嘗試從 Redis 快取中取得使用者權限
            if (cachedPermissions) { // 如果快取中存在資料
                logger.debug(`Found cached permissions for user ${userId}`); // 記錄找到快取資料的訊息
                return cachedPermissions; // 直接回傳快取資料，提升效能
            }
        }

        // 從資料庫取得權限資料
        logger.debug(`Fetching permissions from database for user ${userId}`); // 記錄從資料庫查詢的訊息
        const permissions = await this.fetchUserPermissionsFromDB(userId); // 調用私有方法從資料庫查詢權限資料

        if (permissions) { // 如果成功取得權限資料
            logger.info(`Retrieved permissions for user ${userId}: ${permissions.permissions.length} permissions, ${permissions.roles.length} roles`); // 記錄取得的權限和角色數量
            // 將資料存入快取
            await this.setCachedUserPermissions(userId, permissions, ttl); // 將查詢結果儲存到 Redis 快取中，避免重複查詢
        } else { // 如果沒有找到權限資料
            logger.warn(`No permissions found for user ${userId}`); // 記錄警告訊息
        }

        return permissions; // 回傳權限資料（可能為 null）
    }

    /**
     * 檢查使用者是否具有特定權限
     * @param userId 使用者 ID
     * @param permissionName 權限名稱
     * @param options 快取選項
     * @returns 是否具有權限
     */
    public async userHasPermission( // 公開方法：檢查使用者是否具有特定權限
        userId: number, // 要檢查的使用者 ID
        permissionName: string, // 要檢查的權限名稱
        options: CacheOptions = {} // 快取選項，預設為空物件
    ): Promise<boolean> { // 回傳 Promise<boolean>，true 表示有權限，false 表示無權限
        logger.debug(`Checking permission '${permissionName}' for user ${userId}`); // 記錄除錯訊息，顯示正在檢查的權限和使用者

        const userPermissions = await this.getUserPermissions(userId, options); // 取得使用者的完整權限資料（包含快取機制）

        if (!userPermissions) { // 如果無法取得使用者權限資料（使用者不存在或無權限）
            logger.warn(`User ${userId} not found or has no permissions`); // 記錄警告訊息
            logPermissionCheck(userId, permissionName, false, { reason: 'User not found' }); // 記錄權限檢查失敗的審計日誌
            return false; // 回傳 false 表示無權限
        }

        const hasPermission = userPermissions.permissions.includes(permissionName); // 檢查使用者權限陣列中是否包含指定的權限名稱

        // 記錄權限檢查結果
        logPermissionCheck(userId, permissionName, hasPermission, { // 記錄權限檢查的審計日誌
            userRoles: userPermissions.roles, // 包含使用者的角色資訊
            userPermissions: userPermissions.permissions // 包含使用者的所有權限
        });

        logger.debug(`Permission check result for user ${userId}: ${hasPermission ? 'GRANTED' : 'DENIED'}`); // 記錄權限檢查的最終結果

        return hasPermission; // 回傳權限檢查結果
    }

    /**
     * 檢查使用者是否具有任一權限（OR 邏輯）
     * @param userId 使用者 ID
     * @param permissions 權限名稱陣列
     * @param options 快取選項
     * @returns 是否具有任一權限
     */
    public async userHasAnyPermission( // 公開方法：檢查使用者是否具有任一指定權限（OR 邏輯）
        userId: number, // 要檢查的使用者 ID
        permissions: string[], // 要檢查的權限名稱陣列
        options: CacheOptions = {} // 快取選項，預設為空物件
    ): Promise<boolean> { // 回傳 Promise<boolean>，true 表示至少有一個權限，false 表示沒有任何權限
        const userPermissions = await this.getUserPermissions(userId, options); // 取得使用者的完整權限資料

        if (!userPermissions) { // 如果無法取得使用者權限資料
            return false; // 回傳 false 表示無權限
        }

        return permissions.some(permission => // 使用 Array.some() 方法檢查是否至少有一個權限符合條件
            userPermissions.permissions.includes(permission) // 檢查使用者權限陣列中是否包含當前檢查的權限
        ); // 只要有任何一個權限存在就回傳 true
    }

    /**
     * 檢查使用者是否具有所有權限（AND 邏輯）
     * @param userId 使用者 ID
     * @param permissions 權限名稱陣列
     * @param options 快取選項
     * @returns 是否具有所有權限
     */
    public async userHasAllPermissions( // 公開方法：檢查使用者是否具有所有指定權限（AND 邏輯）
        userId: number, // 要檢查的使用者 ID
        permissions: string[], // 要檢查的權限名稱陣列
        options: CacheOptions = {} // 快取選項，預設為空物件
    ): Promise<boolean> { // 回傳 Promise<boolean>，true 表示具有所有權限，false 表示缺少至少一個權限
        const userPermissions = await this.getUserPermissions(userId, options); // 取得使用者的完整權限資料

        if (!userPermissions) { // 如果無法取得使用者權限資料
            return false; // 回傳 false 表示無權限
        }

        return permissions.every(permission => // 使用 Array.every() 方法檢查是否所有權限都符合條件
            userPermissions.permissions.includes(permission) // 檢查使用者權限陣列中是否包含當前檢查的權限
        ); // 只有當所有權限都存在時才回傳 true
    }

    /**
     * 檢查使用者是否具有特定角色
     * @param userId 使用者 ID
     * @param roleName 角色名稱
     * @param options 快取選項
     * @returns 是否具有角色
     */
    public async userHasRole(
        userId: number,
        roleName: string,
        options: CacheOptions = {}
    ): Promise<boolean> {
        const userPermissions = await this.getUserPermissions(userId, options);

        if (!userPermissions) {
            return false;
        }

        return userPermissions.roles.includes(roleName);
    }

    /**
     * 取得使用者所有權限列表
     * @param userId 使用者 ID
     * @param options 快取選項
     * @returns 權限名稱陣列
     */
    public async getUserPermissionsList(
        userId: number,
        options: CacheOptions = {}
    ): Promise<string[]> {
        const userPermissions = await this.getUserPermissions(userId, options);
        return userPermissions ? userPermissions.permissions : [];
    }

    /**
     * 取得使用者所有角色列表
     * @param userId 使用者 ID
     * @param options 快取選項
     * @returns 角色名稱陣列
     */
    public async getUserRolesList(
        userId: number,
        options: CacheOptions = {}
    ): Promise<string[]> {
        const userPermissions = await this.getUserPermissions(userId, options);
        return userPermissions ? userPermissions.roles : [];
    }

    /**
     * 清除使用者權限快取
     * @param userId 使用者 ID
     */
    public async clearUserPermissionsCache(userId: number): Promise<void> {
        try {
            const redis = this.getRedisClient();
            const permissionsCacheKey = this.getPermissionsCacheKey(userId);
            const rolesCacheKey = this.getRolesCacheKey(userId);

            await redis.del(permissionsCacheKey);
            await redis.del(rolesCacheKey);
        } catch (error) {
            logger.warn('Failed to clear permissions cache:', error);
        }
    }

    /**
     * 重新整理使用者權限快取
     * @param userId 使用者 ID
     * @param ttl 快取時間（秒）
     */
    public async refreshUserPermissionsCache(
        userId: number,
        options: CacheOptions = { ttl: PermissionService.DEFAULT_CACHE_TTL, forceRefresh: true }
    ): Promise<UserPermissions | null> {
        return this.getUserPermissions(userId, { ...options, forceRefresh: true });
    }

    /**
     * 批量取得多個使用者的權限資料
     * @param userIds 使用者 ID 陣列
     * @param options 快取選項
     * @returns 使用者權限資料陣列
     */
    public async getBatchUserPermissions(
        userIds: number[],
        options: CacheOptions = {}
    ): Promise<(UserPermissions | null)[]> {
        const promises = userIds.map(userId =>
            this.getUserPermissions(userId, options)
        );

        return Promise.all(promises);
    }

    /**
     * 檢查權限是否存在於系統中
     * @param permissionName 權限名稱
     * @returns 權限是否存在
     */
    public async permissionExists(permissionName: string): Promise<boolean> {
        try {
            return await this.permissionRepository.exists(permissionName);
        } catch (error) {
            logger.error('Failed to check permission existence:', error);
            return false;
        }
    }

    // ==================== 權限管理方法 ====================

    /**
     * 產生權限快取鍵值
     * @param permissionId 權限 ID
     */
    private getPermissionCacheKey(permissionId: number): string {
        return `${PermissionService.PERMISSION_CACHE_PREFIX}${permissionId}`;
    }

    /**
     * 將模型轉換為 DTO
     * @param model 權限模型
     */
    private modelToDTO(model: PermissionModel): PermissionDTO {
        return {
            id: model.id,
            name: model.name,
            description: model.description,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt
        };
    }

    /**
     * 從快取取得所有權限
     */
    private async getCachedAllPermissions(): Promise<PermissionDTO[] | null> {
        try {
            const redis = this.getRedisClient();
            logger.debug('Checking Redis cache for all permissions');
            const cachedData = await redis.get(PermissionService.ALL_PERMISSIONS_KEY);
            if (cachedData) {
                logger.info('Permissions loaded from Redis cache');
                return JSON.parse(cachedData);
            }
        } catch (error) {
            logger.warn('Failed to get cached permissions:', error);
        }
        return null;
    }

    /**
     * 快取所有權限
     * @param permissions 權限列表
     */
    private async cacheAllPermissions(permissions: PermissionDTO[]): Promise<void> {
        try {
            const redis = this.getRedisClient();
            logger.debug('Caching all permissions in Redis');
            await redis.setEx(
                PermissionService.ALL_PERMISSIONS_KEY,
                PermissionService.DEFAULT_CACHE_TTL,
                JSON.stringify(permissions)
            );

            // 同時快取每個單獨的權限
            for (const permission of permissions) {
                const key = this.getPermissionCacheKey(permission.id);
                await redis.setEx(key, PermissionService.DEFAULT_CACHE_TTL, JSON.stringify(permission));
            }
            logger.debug('Permissions cached successfully');
        } catch (error) {
            logger.warn('Failed to cache permissions:', error);
        }
    }

    /**
     * 從快取取得單一權限
     * @param permissionId 權限 ID
     */
    private async getCachedPermission(permissionId: number): Promise<PermissionDTO | null> {
        try {
            const redis = this.getRedisClient();
            logger.debug(`Checking Redis cache for permission ID: ${permissionId}`);
            const key = this.getPermissionCacheKey(permissionId);
            const cachedData = await redis.get(key);
            if (cachedData) {
                logger.info(`Permission ID: ${permissionId} loaded from Redis cache`);
                return JSON.parse(cachedData);
            }
        } catch (error) {
            logger.warn(`Failed to get cached permission ${permissionId}:`, error);
        }
        return null;
    }

    /**
     * 快取單一權限
     * @param permission 權限資料
     */
    private async cachePermission(permission: PermissionDTO): Promise<void> {
        try {
            const redis = this.getRedisClient();
            logger.debug(`Caching permission ID: ${permission.id} in Redis`);
            const key = this.getPermissionCacheKey(permission.id);
            await redis.setEx(key, PermissionService.DEFAULT_CACHE_TTL, JSON.stringify(permission));
        } catch (error) {
            logger.warn(`Failed to cache permission ${permission.id}:`, error);
        }
    }

    /**
     * 清除權限管理快取
     * @param permissionId 權限 ID（可選）
     */
    private async clearPermissionManagementCache(permissionId?: number): Promise<void> {
        try {
            const redis = this.getRedisClient();
            if (permissionId) {
                // 清除單個權限快取
                logger.debug(`Clearing Redis cache for permission ID: ${permissionId}`);
                const key = this.getPermissionCacheKey(permissionId);
                await redis.del(key);
            }

            // 總是清除所有權限列表快取
            await redis.del(PermissionService.ALL_PERMISSIONS_KEY);
            logger.debug('Permission management caches cleared successfully');
        } catch (error) {
            logger.warn('Failed to clear permission management cache:', error);
        }
    }

    /**
     * 取得所有權限列表
     */
    public async getAllPermissions(): Promise<PermissionDTO[]> {
        try {
            logger.debug('Getting all permissions with cache support');

            // 先嘗試從快取取得
            const cachedPermissions = await this.getCachedAllPermissions();
            if (cachedPermissions) {
                return cachedPermissions;
            }

            // 快取不存在，從資料庫取得
            logger.debug('Fetching permissions from database');
            const permissions = await this.permissionRepository.findAll();
            const permissionsDTO = permissions.map(p => this.modelToDTO(p));

            logger.info(`Retrieved ${permissionsDTO.length} permissions from database`);

            // 更新快取
            await this.cacheAllPermissions(permissionsDTO);

            return permissionsDTO;
        } catch (error) {
            logger.error('Error fetching all permissions:', error);
            throw new Error('Failed to fetch permissions');
        }
    }

    /**
     * 根據 ID 取得權限
     * @param permissionId 權限 ID
     */
    public async getPermissionById(permissionId: number): Promise<PermissionDTO | null> {
        try {
            logger.info(`Retrieving permission by ID: ${permissionId}`);

            // 驗證輸入
            if (!permissionId || permissionId <= 0) {
                logger.warn(`Invalid permission ID: ${permissionId}`);
                return null;
            }

            // 先嘗試從快取取得
            const cachedPermission = await this.getCachedPermission(permissionId);
            if (cachedPermission) {
                return cachedPermission;
            }

            // 快取不存在，從資料庫取得
            logger.debug(`Fetching permission ID: ${permissionId} from database`);
            const permission = await this.permissionRepository.findById(permissionId);
            if (!permission) {
                logger.warn(`Permission not found for ID: ${permissionId}`);
                return null;
            }

            const permissionDTO = this.modelToDTO(permission);

            // 更新快取
            await this.cachePermission(permissionDTO);

            logger.info(`Permission ID: ${permissionId} retrieved successfully`);
            return permissionDTO;
        } catch (error) {
            logger.error(`Error fetching permission by ID ${permissionId}:`, error);
            throw new Error('Failed to fetch permission');
        }
    }

    /**
     * 建立新權限
     * @param permissionData 權限資料
     */
    public async createPermission(permissionData: CreatePermissionRequest): Promise<PermissionDTO> { // 公開方法：創建新的權限
        try { // 嘗試執行權限創建操作
            logger.info(`Creating new permission: ${permissionData.name}`); // 記錄創建權限的資訊日誌

            // 驗證輸入
            if (!permissionData.name || permissionData.name.trim().length === 0) { // 檢查權限名稱是否為空或只包含空白字符
                throw new Error('Permission name is required'); // 拋出錯誤，要求提供權限名稱
            }

            // 檢查權限是否已存在
            const exists = await this.permissionRepository.exists(permissionData.name.trim()); // 查詢資料庫確認權限名稱是否已存在
            if (exists) { // 如果權限已存在
                throw new Error(`Permission with name '${permissionData.name}' already exists`); // 拋出錯誤，防止重複創建
            }

            // 建立權限
            const permission = await this.permissionRepository.create({ // 調用資料存取層創建新權限
                name: permissionData.name.trim(), // 去除首尾空白的權限名稱
                description: permissionData.description?.trim() // 可選的權限描述，去除首尾空白
            });

            const permissionDTO = this.modelToDTO(permission); // 將資料庫模型轉換為資料傳輸物件

            // 更新快取
            await this.cachePermission(permissionDTO); // 將新創建的權限儲存到 Redis 快取中
            // 清除所有權限列表快取，強制下次重新載入
            await this.clearPermissionManagementCache(); // 清除權限列表快取，確保下次查詢時能取得最新資料

            logger.info(`Permission created successfully: ${permissionData.name} (ID: ${permissionDTO.id})`); // 記錄成功創建權限的日誌
            return permissionDTO; // 回傳創建成功的權限資料
        } catch (error) { // 捕獲任何創建過程中的錯誤
            logger.error('Error creating permission:', error); // 記錄錯誤日誌
            if (error instanceof Error) { // 如果是已知的 Error 類型
                throw error; // 直接重新拋出錯誤
            }
            throw new Error('Failed to create permission'); // 拋出通用的創建失敗錯誤
        }
    }

    /**
     * 更新權限
     * @param permissionId 權限 ID
     * @param updateData 更新資料
     */
    public async updatePermission(permissionId: number, updateData: UpdatePermissionRequest): Promise<PermissionDTO | null> {
        try {
            logger.info(`Updating permission ID: ${permissionId}`);

            // 驗證輸入
            if (!permissionId || permissionId <= 0) {
                throw new Error('Invalid permission ID');
            }

            if (!updateData.name && !updateData.description) {
                throw new Error('At least one field (name or description) must be provided for update');
            }

            // 準備更新資料
            const updatePayload: any = {};
            if (updateData.name !== undefined) {
                updatePayload.name = updateData.name.trim();

                // 檢查新名稱是否已被其他權限使用
                if (updatePayload.name) {
                    const existingPermission = await this.permissionRepository.findByName(updatePayload.name);
                    if (existingPermission && existingPermission.id !== permissionId) {
                        throw new Error(`Permission with name '${updatePayload.name}' already exists`);
                    }
                }
            }
            if (updateData.description !== undefined) {
                updatePayload.description = updateData.description?.trim();
            }

            // 更新權限
            const updatedPermission = await this.permissionRepository.update(permissionId, updatePayload);
            if (!updatedPermission) {
                logger.warn(`Permission update failed - permission not found for ID: ${permissionId}`);
                return null;
            }

            const permissionDTO = this.modelToDTO(updatedPermission);

            // 更新快取
            await this.cachePermission(permissionDTO);
            // 清除所有權限列表快取
            await this.clearPermissionManagementCache();

            logger.info(`Permission updated successfully: ID ${permissionId}`);
            return permissionDTO;
        } catch (error) {
            logger.error(`Error updating permission ${permissionId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to update permission');
        }
    }

    /**
     * 刪除權限
     * @param permissionId 權限 ID
     */
    public async deletePermission(permissionId: number): Promise<boolean> {
        try {
            logger.info(`Deleting permission ID: ${permissionId}`);

            // 驗證輸入
            if (!permissionId || permissionId <= 0) {
                throw new Error('Invalid permission ID');
            }

            // 檢查權限是否存在
            const existingPermission = await this.permissionRepository.findById(permissionId);
            if (!existingPermission) {
                logger.warn(`Permission deletion failed - permission not found for ID: ${permissionId}`);
                return false;
            }

            // 刪除權限
            const deleted = await this.permissionRepository.delete(permissionId);
            if (deleted) {
                // 清除快取
                await this.clearPermissionManagementCache(permissionId);
                logger.info(`Permission deleted successfully: ID ${permissionId}`);
            }

            return deleted;
        } catch (error) {
            logger.error(`Error deleting permission ${permissionId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to delete permission');
        }
    }
}