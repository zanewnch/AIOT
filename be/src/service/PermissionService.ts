import { UserRepository } from '../repo/UserRepo.js';
import { getRedisClient } from '../configs/redisConfig.js';
import type { RedisClientType } from 'redis';

/**
 * 權限服務層
 * ===========
 * 
 * 提供基於 RBAC 的權限檢查功能，整合 Redis 快取以提升效能
 * 
 * 功能特點：
 * - 使用者權限檢查（單一、任一、全部）
 * - 使用者角色檢查
 * - Redis 快取機制，減少資料庫查詢
 * - 自動快取失效和更新
 * 
 * 快取策略：
 * - 使用者權限快取：user_permissions:{userId}
 * - 使用者角色快取：user_roles:{userId}
 * - 預設快取時間：1 小時
 */

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
 * 權限服務類別
 */
export class PermissionService {
    private userRepository: UserRepository;
    private static readonly PERMISSIONS_CACHE_PREFIX = 'user_permissions:';
    private static readonly ROLES_CACHE_PREFIX = 'user_roles:';
    private static readonly DEFAULT_CACHE_TTL = 3600; // 1 小時

    /**
     * 建構函式
     * @param userRepository 使用者資料存取層
     */
    constructor(userRepository: UserRepository = new UserRepository()) {
        this.userRepository = userRepository;
    }

    /**
     * 取得 Redis 客戶端
     */
    private getRedisClient(): RedisClientType {
        try {
            return getRedisClient();
        } catch (error) {
            console.warn('Redis not available, falling back to database queries');
            throw new Error('Redis connection is not available');
        }
    }

    /**
     * 生成使用者權限快取鍵值
     */
    private getPermissionsCacheKey(userId: number): string {
        return `${PermissionService.PERMISSIONS_CACHE_PREFIX}${userId}`;
    }

    /**
     * 生成使用者角色快取鍵值
     */
    private getRolesCacheKey(userId: number): string {
        return `${PermissionService.ROLES_CACHE_PREFIX}${userId}`;
    }

    /**
     * 從快取取得使用者權限資料
     * @param userId 使用者 ID
     * @returns 使用者權限資料或 null
     */
    private async getCachedUserPermissions(userId: number): Promise<UserPermissions | null> {
        try {
            const redis = this.getRedisClient();
            const cacheKey = this.getPermissionsCacheKey(userId);
            const cachedData = await redis.get(cacheKey);

            if (cachedData) {
                return JSON.parse(cachedData) as UserPermissions;
            }

            return null;
        } catch (error) {
            console.warn('Failed to get cached permissions:', error);
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
            console.warn('Failed to cache permissions:', error);
        }
    }

    /**
     * 從資料庫取得使用者權限資料
     * @param userId 使用者 ID
     * @returns 使用者權限資料或 null
     */
    private async fetchUserPermissionsFromDB(userId: number): Promise<UserPermissions | null> {
        try {
            const user = await this.userRepository.findByIdWithRolesAndPermissions(userId);
            
            if (!user) {
                return null;
            }

            // 提取所有權限（來自角色）
            const permissions = new Set<string>();
            const roles = new Set<string>();

            if (user.roles) {
                for (const role of user.roles) {
                    roles.add(role.name);
                    
                    if (role.permissions) {
                        for (const permission of role.permissions) {
                            permissions.add(permission.name);
                        }
                    }
                }
            }

            return {
                userId: user.id,
                username: user.username,
                permissions: Array.from(permissions),
                roles: Array.from(roles),
                lastUpdated: Date.now()
            };
        } catch (error) {
            console.error('Failed to fetch user permissions from database:', error);
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

        // 如果不強制重新整理，先嘗試從快取取得
        if (!forceRefresh) {
            const cachedPermissions = await this.getCachedUserPermissions(userId);
            if (cachedPermissions) {
                return cachedPermissions;
            }
        }

        // 從資料庫取得權限資料
        const permissions = await this.fetchUserPermissionsFromDB(userId);
        
        if (permissions) {
            // 將資料存入快取
            await this.setCachedUserPermissions(userId, permissions, ttl);
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
        const userPermissions = await this.getUserPermissions(userId, options);
        
        if (!userPermissions) {
            return false;
        }

        return userPermissions.permissions.includes(permissionName);
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
            console.warn('Failed to clear permissions cache:', error);
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
            // 可以添加權限檢查邏輯，例如查詢 permissions 表
            // 目前簡化實作，假設所有權限都存在
            return true;
        } catch (error) {
            console.error('Failed to check permission existence:', error);
            return false;
        }
    }
}