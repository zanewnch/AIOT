/**
 * @fileoverview 重構後的權限命令服務範例
 * 
 * 展示如何使用 BaseRedisService 重構現有的服務，
 * 移除重複的 Redis 連線處理代碼。
 * 
 * @module RefactoredPermissionCommandsSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { BaseRedisService } from '../BaseRedisService.js';
import { getRedisClient } from '../../microServices/rbac-service/src/configs/redisConfig.js';
import { createLogger } from '../../microServices/rbac-service/src/configs/loggerConfig.js';

// 假設的型別定義（實際使用時會從對應的檔案導入）
interface PermissionDTO {
    id: number;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface UserPermissions {
    userId: number;
    permissions: PermissionDTO[];
    roles: string[];
}

/**
 * 重構後的權限命令服務
 * 
 * 使用 BaseRedisService 作為基礎類別，移除了重複的 Redis 連線處理代碼。
 * 專注於業務邏輯，而將 Redis 管理交給基礎類別處理。
 * 
 * @class RefactoredPermissionCommandsSvc
 * @extends BaseRedisService
 * @since 1.0.0
 */
@injectable()
export class RefactoredPermissionCommandsSvc extends BaseRedisService {
    // ==================== 快取鍵值常數 ====================
    private static readonly PERMISSIONS_CACHE_PREFIX = 'user_permissions:';
    private static readonly ROLES_CACHE_PREFIX = 'user_roles:';
    private static readonly PERMISSION_CACHE_PREFIX = 'permission:';
    private static readonly ALL_PERMISSIONS_KEY = 'permissions:all';

    constructor(
        // 注入的依賴項保持不變
        // @inject(TYPES.PermissionQueriesSvc) private readonly queryService: PermissionQueriesSvc,
        // @inject(TYPES.PermissionCommandsRepo) private readonly permissionCommandsRepository: PermissionCommandsRepository,
        // @inject(TYPES.PermissionQueriesRepo) private readonly permissionQueriesRepo: PermissionQueriesRepo
    ) {
        // 初始化基礎 Redis 服務
        super({
            serviceName: 'PermissionCommandsSvc',
            defaultTTL: 3600, // 1 小時
            enableDebugLogs: false, // 生產環境建議關閉
            logger: createLogger('PermissionCommandsSvc')
        });
    }

    /**
     * 實作抽象方法：提供 Redis 客戶端工廠函式
     * 
     * @protected
     * @returns Redis 客戶端工廠函式
     */
    protected getRedisClientFactory() {
        return getRedisClient;
    }

    // ==================== 重構後的快取方法 ====================

    /**
     * 將使用者權限資料存入快取
     * 
     * 使用基礎類別的 safeRedisWrite 方法，自動處理錯誤和日誌
     * 
     * @param userId 使用者 ID
     * @param permissions 權限資料
     * @param ttl 快取時間（秒），預設使用類別設定
     */
    public async setCachedUserPermissions(
        userId: number,
        permissions: UserPermissions,
        ttl?: number
    ): Promise&lt;boolean&gt; {
        const cacheKey = this.createCacheKey(
            RefactoredPermissionCommandsSvc.PERMISSIONS_CACHE_PREFIX,
            userId
        );

        return this.safeRedisWrite(
            async (redis) => {
                await redis.setEx(
                    cacheKey,
                    ttl || this.defaultTTL,
                    JSON.stringify(permissions)
                );
            },
            'setCachedUserPermissions'
        );
    }

    /**
     * 快取單一權限
     * 
     * @param permission 權限資料
     */
    public async cachePermission(permission: PermissionDTO): Promise&lt;boolean&gt; {
        const key = this.createCacheKey(
            RefactoredPermissionCommandsSvc.PERMISSION_CACHE_PREFIX,
            permission.id
        );

        return this.safeRedisWrite(
            async (redis) => {
                await redis.setEx(key, this.defaultTTL, JSON.stringify(permission));
            },
            `cachePermission(${permission.id})`
        );
    }

    /**
     * 快取所有權限
     * 
     * 使用 safeRedisWrite 進行批量快取操作
     * 
     * @param permissions 權限列表
     */
    public async cacheAllPermissions(permissions: PermissionDTO[]): Promise&lt;boolean&gt; {
        // 先快取權限列表
        const listCacheSuccess = await this.safeRedisWrite(
            async (redis) => {
                await redis.setEx(
                    RefactoredPermissionCommandsSvc.ALL_PERMISSIONS_KEY,
                    this.defaultTTL,
                    JSON.stringify(permissions)
                );
            },
            'cacheAllPermissions:list'
        );

        // 然後快取每個單獨的權限
        const individualCachePromises = permissions.map(permission =>
            this.cachePermission(permission)
        );

        const individualResults = await Promise.all(individualCachePromises);
        const allIndividualSuccess = individualResults.every(result => result);

        return listCacheSuccess && allIndividualSuccess;
    }

    /**
     * 取得快取的權限
     * 
     * 使用基礎類別的 safeRedisOperation 方法，自動處理 fallback
     * 
     * @param permissionId 權限 ID
     * @returns 快取的權限資料或 null
     */
    public async getCachedPermission(permissionId: number): Promise&lt;PermissionDTO | null&gt; {
        const key = this.createCacheKey(
            RefactoredPermissionCommandsSvc.PERMISSION_CACHE_PREFIX,
            permissionId
        );

        return this.safeRedisOperation(
            async (redis) => {
                const cached = await redis.get(key);
                return cached ? JSON.parse(cached) : null;
            },
            `getCachedPermission(${permissionId})`,
            null // fallback 值
        );
    }

    /**
     * 清除權限管理快取
     * 
     * 使用基礎類別的 clearCacheByPattern 方法
     * 
     * @param permissionId 權限 ID（可選）
     */
    public async clearPermissionManagementCache(permissionId?: number): Promise&lt;number&gt; {
        let clearedCount = 0;

        if (permissionId) {
            // 清除單個權限快取
            const key = this.createCacheKey(
                RefactoredPermissionCommandsSvc.PERMISSION_CACHE_PREFIX,
                permissionId
            );
            
            const singleClearResult = await this.safeRedisOperation(
                async (redis) => await redis.del(key),
                `clearPermissionCache(${permissionId})`,
                0
            );
            
            clearedCount += singleClearResult;
        }

        // 清除權限列表快取
        const listClearResult = await this.safeRedisOperation(
            async (redis) => await redis.del(RefactoredPermissionCommandsSvc.ALL_PERMISSIONS_KEY),
            'clearAllPermissionsCache',
            0
        );
        
        clearedCount += listClearResult;

        return clearedCount;
    }

    /**
     * 清除使用者權限快取
     * 
     * @param userId 使用者 ID
     */
    public async clearUserPermissionsCache(userId: number): Promise&lt;number&gt; {
        const patterns = [
            `${RefactoredPermissionCommandsSvc.PERMISSIONS_CACHE_PREFIX}${userId}`,
            `${RefactoredPermissionCommandsSvc.ROLES_CACHE_PREFIX}${userId}`
        ];

        let totalCleared = 0;
        for (const pattern of patterns) {
            const cleared = await this.safeRedisOperation(
                async (redis) => await redis.del(pattern),
                `clearUserCache(${pattern})`,
                0
            );
            totalCleared += cleared;
        }

        return totalCleared;
    }

    /**
     * 重新整理使用者權限快取
     * 
     * 結合資料庫查詢和快取更新的業務邏輯
     * 
     * @param userId 使用者 ID
     * @param options 快取選項
     */
    public async refreshUserPermissionsCache(userId: number): Promise&lt;UserPermissions | null&gt; {
        // 這裡會調用實際的查詢服務（在實際重構時會注入）
        // const permissions = await this.queryService.getUserPermissions(userId, { forceRefresh: true });
        
        // 模擬查詢結果
        const permissions: UserPermissions = {
            userId,
            permissions: [],
            roles: []
        };
        
        if (permissions) {
            await this.setCachedUserPermissions(userId, permissions);
        }
        
        return permissions;
    }

    // ==================== 業務邏輯方法保持不變 ====================
    
    /**
     * 建立新權限
     * 
     * 業務邏輯保持不變，但快取操作使用新的方法
     * 
     * @param permissionData 權限資料
     */
    public async createPermission(permissionData: any): Promise&lt;PermissionDTO&gt; {
        // 業務邏輯：驗證、創建等
        // const permission = await this.permissionCommandsRepository.create(permissionData);
        
        // 模擬創建的權限
        const permission: PermissionDTO = {
            id: Date.now(),
            name: permissionData.name,
            description: permissionData.description,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // 使用新的快取方法
        await this.cachePermission(permission);
        await this.clearPermissionManagementCache();

        return permission;
    }

    /**
     * 更新權限
     * 
     * @param permissionId 權限 ID
     * @param updateData 更新資料
     */
    public async updatePermission(permissionId: number, updateData: any): Promise&lt;PermissionDTO | null&gt; {
        // 業務邏輯保持不變
        // const updatedPermission = await this.permissionCommandsRepository.update(permissionId, updateData);
        
        // 模擬更新
        const updatedPermission: PermissionDTO = {
            id: permissionId,
            name: updateData.name,
            description: updateData.description,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        if (updatedPermission) {
            // 使用新的快取方法
            await this.cachePermission(updatedPermission);
            await this.clearPermissionManagementCache();
        }

        return updatedPermission;
    }

    /**
     * 刪除權限
     * 
     * @param permissionId 權限 ID
     */
    public async deletePermission(permissionId: number): Promise&lt;boolean&gt; {
        // 業務邏輯
        // const deleted = await this.permissionCommandsRepository.delete(permissionId);
        const deleted = true; // 模擬刪除成功

        if (deleted) {
            // 使用新的快取清除方法
            await this.clearPermissionManagementCache(permissionId);
        }

        return deleted;
    }

    // ==================== 服務狀態和診斷 ====================

    /**
     * 取得服務狀態
     * 
     * 結合基礎類別的狀態和業務邏輯狀態
     */
    public getDetailedServiceStatus() {
        const baseStatus = this.getServiceStatus();
        
        return {
            ...baseStatus,
            // 可以添加業務邏輯相關的狀態
            cacheKeys: {
                permissionsPrefix: RefactoredPermissionCommandsSvc.PERMISSIONS_CACHE_PREFIX,
                rolesPrefix: RefactoredPermissionCommandsSvc.ROLES_CACHE_PREFIX,
                permissionPrefix: RefactoredPermissionCommandsSvc.PERMISSION_CACHE_PREFIX,
                allPermissionsKey: RefactoredPermissionCommandsSvc.ALL_PERMISSIONS_KEY
            }
        };
    }
}

// ==================== 使用範例 ====================

/**
 * 使用範例：展示如何使用重構後的服務
 */
export class PermissionServiceUsageExample {
    
    static async demonstrateUsage() {
        const permissionService = new RefactoredPermissionCommandsSvc();
        
        // 檢查 Redis 狀態
        console.log('Service Status:', permissionService.getDetailedServiceStatus());
        
        // 創建權限
        const newPermission = await permissionService.createPermission({
            name: 'READ_USERS',
            description: 'Read user information'
        });
        
        console.log('Created permission:', newPermission);
        
        // 讀取快取的權限
        const cachedPermission = await permissionService.getCachedPermission(newPermission.id);
        console.log('Cached permission:', cachedPermission);
        
        // 清除快取
        const clearedCount = await permissionService.clearPermissionManagementCache(newPermission.id);
        console.log('Cleared cache entries:', clearedCount);
        
        // 即使 Redis 不可用，業務邏輯仍然可以正常運作
        if (!permissionService.isRedisEnabled()) {
            console.log('Redis is not available, but service continues to work with database fallback');
        }
    }
}