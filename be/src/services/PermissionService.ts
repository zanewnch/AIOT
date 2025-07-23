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
import { UserRepository } from '../repo/UserRepo.js';
// 匯入權限資料存取層，用於權限管理操作
import { PermissionRepository, IPermissionRepository } from '../repo/PermissionRepo.js';
// 匯入權限模型類型
import { PermissionModel } from '../models/rbac/PermissionModel.js';
// 匯入 Redis 客戶端配置，用於快取管理
import { getRedisClient } from '../configs/redisConfig.js';
// 匯入 Redis 客戶端類型定義
import type { RedisClientType } from 'redis';
// 匯入日誌記錄器
import { createLogger, logPermissionCheck } from '../configs/loggerConfig.js';

// 創建服務專用的日誌記錄器
const logger = createLogger('PermissionService');

/**
 * 使用者權限資料結構
 */
export interface UserPermissions {
    userId: number;
    username: string;
    permissions: string[];
    roles: string[];
    lastUpdated: number;
}

/**
 * 快取選項
 */
export interface CacheOptions {
    ttl?: number; // 快取存活時間（秒），預設 3600 秒（1 小時）
    forceRefresh?: boolean; // 是否強制重新整理快取
}

/**
 * 權限資料傳輸物件
 */
export interface PermissionDTO {
    id: number;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 建立權限請求物件
 */
export interface CreatePermissionRequest {
    name: string;
    description?: string;
}

/**
 * 更新權限請求物件
 */
export interface UpdatePermissionRequest {
    name?: string;
    description?: string;
}

/**
 * 權限服務類別
 */
export class PermissionService {
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
    constructor(
        userRepository: UserRepository = new UserRepository(),
        permissionRepository: IPermissionRepository = new PermissionRepository()
    ) {
        this.userRepository = userRepository;
        this.permissionRepository = permissionRepository;
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
        userId: number, 
        permissions: UserPermissions, 
        ttl: number = PermissionService.DEFAULT_CACHE_TTL
    ): Promise<void> {
        try {
            const redis = this.getRedisClient();
            const cacheKey = this.getPermissionsCacheKey(userId);
            
            await redis.setEx(
                cacheKey, 
                ttl, 
                JSON.stringify(permissions)
            );
        } catch (error) {
            logger.warn('Failed to cache permissions:', error);
        }
    }

    /**
     * 從資料庫取得使用者權限資料
     * @param userId 使用者 ID
     * @returns 使用者權限資料或 null
     */
    private async fetchUserPermissionsFromDB(userId: number): Promise<UserPermissions | null> {
        try {
            logger.debug(`Querying database for user ${userId} with roles and permissions`);
            const user = await this.userRepository.findByIdWithRolesAndPermissions(userId);
            
            if (!user) {
                logger.warn(`User ${userId} not found in database`);
                return null;
            }

            // 提取所有權限（來自角色）
            const permissions = new Set<string>();
            const roles = new Set<string>();

            if (user.roles) {
                logger.debug(`User ${userId} has ${user.roles.length} roles`);
                for (const role of user.roles) {
                    roles.add(role.name);
                    logger.debug(`Processing role '${role.name}' for user ${userId}`);
                    
                    if (role.permissions) {
                        logger.debug(`Role '${role.name}' has ${role.permissions.length} permissions`);
                        for (const permission of role.permissions) {
                            permissions.add(permission.name);
                        }
                    }
                }
            } else {
                logger.warn(`User ${userId} has no roles assigned`);
            }

            const result = {
                userId: user.id,
                username: user.username,
                permissions: Array.from(permissions),
                roles: Array.from(roles),
                lastUpdated: Date.now()
            };

            logger.info(`User ${userId} (${user.username}) permissions loaded: ${result.permissions.join(', ')}`);
            logger.info(`User ${userId} (${user.username}) roles: ${result.roles.join(', ')}`);

            return result;
        } catch (error) {
            logger.error('Failed to fetch user permissions from database:', error);
            return null;
        }
    }

    /**
     * 取得使用者權限資料（支援快取）
     * @param userId 使用者 ID
     * @param options 快取選項
     * @returns 使用者權限資料或 null
     */
    public async getUserPermissions(
        userId: number, 
        options: CacheOptions = {}
    ): Promise<UserPermissions | null> {
        const { ttl = PermissionService.DEFAULT_CACHE_TTL, forceRefresh = false } = options;

        logger.debug(`Getting permissions for user ${userId} (forceRefresh: ${forceRefresh})`);

        // 如果不強制重新整理，先嘗試從快取取得
        if (!forceRefresh) {
            const cachedPermissions = await this.getCachedUserPermissions(userId);
            if (cachedPermissions) {
                logger.debug(`Found cached permissions for user ${userId}`);
                return cachedPermissions;
            }
        }

        // 從資料庫取得權限資料
        logger.debug(`Fetching permissions from database for user ${userId}`);
        const permissions = await this.fetchUserPermissionsFromDB(userId);
        
        if (permissions) {
            logger.info(`Retrieved permissions for user ${userId}: ${permissions.permissions.length} permissions, ${permissions.roles.length} roles`);
            // 將資料存入快取
            await this.setCachedUserPermissions(userId, permissions, ttl);
        } else {
            logger.warn(`No permissions found for user ${userId}`);
        }

        return permissions;
    }

    /**
     * 檢查使用者是否具有特定權限
     * @param userId 使用者 ID
     * @param permissionName 權限名稱
     * @param options 快取選項
     * @returns 是否具有權限
     */
    public async userHasPermission(
        userId: number, 
        permissionName: string, 
        options: CacheOptions = {}
    ): Promise<boolean> {
        logger.debug(`Checking permission '${permissionName}' for user ${userId}`);
        
        const userPermissions = await this.getUserPermissions(userId, options);
        
        if (!userPermissions) {
            logger.warn(`User ${userId} not found or has no permissions`);
            logPermissionCheck(userId, permissionName, false, { reason: 'User not found' });
            return false;
        }

        const hasPermission = userPermissions.permissions.includes(permissionName);
        
        // 記錄權限檢查結果
        logPermissionCheck(userId, permissionName, hasPermission, {
            userRoles: userPermissions.roles,
            userPermissions: userPermissions.permissions
        });
        
        logger.debug(`Permission check result for user ${userId}: ${hasPermission ? 'GRANTED' : 'DENIED'}`);
        
        return hasPermission;
    }

    /**
     * 檢查使用者是否具有任一權限（OR 邏輯）
     * @param userId 使用者 ID
     * @param permissions 權限名稱陣列
     * @param options 快取選項
     * @returns 是否具有任一權限
     */
    public async userHasAnyPermission(
        userId: number, 
        permissions: string[], 
        options: CacheOptions = {}
    ): Promise<boolean> {
        const userPermissions = await this.getUserPermissions(userId, options);
        
        if (!userPermissions) {
            return false;
        }

        return permissions.some(permission => 
            userPermissions.permissions.includes(permission)
        );
    }

    /**
     * 檢查使用者是否具有所有權限（AND 邏輯）
     * @param userId 使用者 ID
     * @param permissions 權限名稱陣列
     * @param options 快取選項
     * @returns 是否具有所有權限
     */
    public async userHasAllPermissions(
        userId: number, 
        permissions: string[], 
        options: CacheOptions = {}
    ): Promise<boolean> {
        const userPermissions = await this.getUserPermissions(userId, options);
        
        if (!userPermissions) {
            return false;
        }

        return permissions.every(permission => 
            userPermissions.permissions.includes(permission)
        );
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
        ttl: number = PermissionService.DEFAULT_CACHE_TTL
    ): Promise<UserPermissions | null> {
        return this.getUserPermissions(userId, { ttl, forceRefresh: true });
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
    public async createPermission(permissionData: CreatePermissionRequest): Promise<PermissionDTO> {
        try {
            logger.info(`Creating new permission: ${permissionData.name}`);

            // 驗證輸入
            if (!permissionData.name || permissionData.name.trim().length === 0) {
                throw new Error('Permission name is required');
            }

            // 檢查權限是否已存在
            const exists = await this.permissionRepository.exists(permissionData.name.trim());
            if (exists) {
                throw new Error(`Permission with name '${permissionData.name}' already exists`);
            }

            // 建立權限
            const permission = await this.permissionRepository.create({
                name: permissionData.name.trim(),
                description: permissionData.description?.trim()
            });

            const permissionDTO = this.modelToDTO(permission);

            // 更新快取
            await this.cachePermission(permissionDTO);
            // 清除所有權限列表快取，強制下次重新載入
            await this.clearPermissionManagementCache();

            logger.info(`Permission created successfully: ${permissionData.name} (ID: ${permissionDTO.id})`);
            return permissionDTO;
        } catch (error) {
            logger.error('Error creating permission:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create permission');
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