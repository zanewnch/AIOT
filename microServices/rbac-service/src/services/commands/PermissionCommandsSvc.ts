/**
 * @fileoverview 權限命令服務實現
 *
 * 此文件實作了權限命令業務邏輯層，
 * 專注於處理所有寫入和操作相關的業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * 功能特點：
 * - 權限創建、更新、刪除
 * - Redis 快取管理和刷新
 * - 權限快取自動清理和更新
 * - 事務性操作支援
 *
 * 快取策略：
 * - 寫入後立即更新快取
 * - 刪除後清除相關快取
 * - 支援強制快取刷新
 *
 * @module PermissionCommandsSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { PermissionCommandsRepository } from '../../repo/commands/PermissionCommandsRepo.js';
import { PermissionQueriesRepo } from '../../repo/queries/PermissionQueriesRepo.js';
import type { PermissionModel } from '../../models/PermissionModel.js';
import { getRedisClient } from '../../configs/redisConfig.js';
import type { RedisClientType } from 'redis';
import { createLogger } from '../../configs/loggerConfig.js';
import type {
    IPermissionCommandsService
} from '../../types/services/IPermissionCommandsService.js';
import type {
    UserPermissions,
    CacheOptions,
    PermissionDTO,
    CreatePermissionRequest,
    UpdatePermissionRequest
} from '../../types/services/IPermissionService.js';
import { PermissionQueriesSvc } from '../queries/PermissionQueriesSvc.js';

const logger = createLogger('PermissionCommandsSvc');

/**
 * 權限命令服務實現類別
 *
 * 專門處理權限相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 * 
 * @class PermissionCommandsSvc
 * @implements {IPermissionCommandsService}
 * @since 1.0.0
 */
@injectable()
export class PermissionCommandsSvc implements IPermissionCommandsService {
    private redisClient: RedisClientType | null;
    private isRedisAvailable: boolean;
    private static readonly PERMISSIONS_CACHE_PREFIX = 'user_permissions:';
    private static readonly ROLES_CACHE_PREFIX = 'user_roles:';
    private static readonly PERMISSION_CACHE_PREFIX = 'permission:';
    private static readonly ALL_PERMISSIONS_KEY = 'permissions:all';
    private static readonly DEFAULT_CACHE_TTL = 3600; // 1 小時

    constructor(
        @inject(TYPES.PermissionQueriesSvc) private readonly queryService: PermissionQueriesSvc,
        @inject(TYPES.PermissionCommandsRepo) private readonly permissionCommandsRepository: PermissionCommandsRepository,
        @inject(TYPES.PermissionQueriesRepo) private readonly permissionQueriesRepo: PermissionQueriesRepo
    ) {
        // 在 constructor 中初始化 Redis 連線
        try {
            this.redisClient = getRedisClient();
            this.isRedisAvailable = true;
            logger.info('Redis client initialized successfully for PermissionCommandsSvc');
        } catch (error) {
            this.redisClient = null;
            this.isRedisAvailable = false;
            logger.warn('Redis not available, PermissionCommandsSvc will fallback to database operations only:', error);
        }
    }

    /**
     * 取得 Redis 客戶端
     * 若 Redis 不可用則返回 null
     *
     * @returns Redis 客戶端實例或 null
     * @private
     */
    private getRedisClient(): RedisClientType | null {
        return this.isRedisAvailable ? this.redisClient : null;
    }

    /**
     * 生成使用者權限快取鍵值
     * @param userId 使用者 ID
     * @returns 權限快取鍵值
     * @private
     */
    private getPermissionsCacheKey = (userId: number): string => {
        return `${PermissionCommandsSvc.PERMISSIONS_CACHE_PREFIX}${userId}`;
    }

    /**
     * 生成使用者角色快取鍵值
     * @param userId 使用者 ID
     * @returns 角色快取鍵值
     * @private
     */
    private getRolesCacheKey = (userId: number): string => {
        return `${PermissionCommandsSvc.ROLES_CACHE_PREFIX}${userId}`;
    }

    /**
     * 產生權限快取鍵值
     * @param permissionId 權限 ID
     * @private
     */
    private getPermissionCacheKey = (permissionId: number): string => {
        return `${PermissionCommandsSvc.PERMISSION_CACHE_PREFIX}${permissionId}`;
    }

    /**
     * 將使用者權限資料存入快取
     * @param userId 使用者 ID
     * @param permissions 權限資料
     * @param ttl 快取時間（秒）
     * @private
     */
    private async setCachedUserPermissions(
        userId: number,
        permissions: UserPermissions,
        ttl = PermissionCommandsSvc.DEFAULT_CACHE_TTL
    ): Promise<void> {
        const redis = this.getRedisClient();
        if (!redis) {
            logger.debug('Redis not available, skipping cache set operation');
            return; // Redis 不可用，直接返回
        }

        try {
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
     * 將模型轉換為 DTO
     * @param model 權限模型
     * @private
     */
    private modelToDTO = (model: PermissionModel): PermissionDTO => {
        return {
            id: model.id,
            name: model.name,
            description: model.description,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt
        };
    }

    /**
     * 快取所有權限
     * @param permissions 權限列表
     * @private
     */
    private cacheAllPermissions = async (permissions: PermissionDTO[]): Promise<void> => {
        const redis = this.getRedisClient();
        if (!redis) {
            logger.debug('Redis not available, skipping cache all permissions operation');
            return; // Redis 不可用，直接返回
        }

        try {
            logger.debug('Caching all permissions in Redis');
            await redis.setEx(
                PermissionCommandsSvc.ALL_PERMISSIONS_KEY,
                PermissionCommandsSvc.DEFAULT_CACHE_TTL,
                JSON.stringify(permissions)
            );

            // 同時快取每個單獨的權限
            for (const permission of permissions) {
                const key = this.getPermissionCacheKey(permission.id);
                await redis.setEx(key, PermissionCommandsSvc.DEFAULT_CACHE_TTL, JSON.stringify(permission));
            }
            logger.debug('Permissions cached successfully');
        } catch (error) {
            logger.warn('Failed to cache permissions:', error);
        }
    }

    /**
     * 快取單一權限
     * @param permission 權限資料
     * @private
     */
    private cachePermission = async (permission: PermissionDTO): Promise<void> => {
        const redis = this.getRedisClient();
        if (!redis) {
            logger.debug('Redis not available, skipping cache permission operation');
            return; // Redis 不可用，直接返回
        }

        try {
            logger.debug(`Caching permission ID: ${permission.id} in Redis`);
            const key = this.getPermissionCacheKey(permission.id);
            await redis.setEx(key, PermissionCommandsSvc.DEFAULT_CACHE_TTL, JSON.stringify(permission));
        } catch (error) {
            logger.warn(`Failed to cache permission ${permission.id}:`, error);
        }
    }

    /**
     * 清除權限管理快取
     * @param permissionId 權限 ID（可選）
     * @private
     */
    private clearPermissionManagementCache = async (permissionId?: number): Promise<void> => {
        const redis = this.getRedisClient();
        if (!redis) {
            logger.debug('Redis not available, skipping cache clear operation');
            return; // Redis 不可用，直接返回
        }

        try {
            if (permissionId) {
                // 清除單個權限快取
                logger.debug(`Clearing Redis cache for permission ID: ${permissionId}`);
                const key = this.getPermissionCacheKey(permissionId);
                await redis.del(key);
            }

            // 總是清除所有權限列表快取
            await redis.del(PermissionCommandsSvc.ALL_PERMISSIONS_KEY);
            logger.debug('Permission management caches cleared successfully');
        } catch (error) {
            logger.warn('Failed to clear permission management cache:', error);
        }
    }

    // ==================== 公開命令方法 ====================

    /**
     * 清除使用者權限快取
     * @param userId 使用者 ID
     */
    public clearUserPermissionsCache = async (userId: number): Promise<void> => {
        const redis = this.getRedisClient();
        if (!redis) {
            logger.debug('Redis not available, skipping cache clear operation');
            return; // Redis 不可用，直接返回
        }

        try {
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
     * @param options 快取選項
     */
    public async refreshUserPermissionsCache(
        userId: number,
        options = { ttl: PermissionCommandsSvc.DEFAULT_CACHE_TTL, forceRefresh: true }
    ): Promise<UserPermissions | null> {
        const permissions = await this.queryService.getUserPermissions(userId, { ...options, forceRefresh: true });
        
        if (permissions) {
            const ttl = options.ttl || PermissionCommandsSvc.DEFAULT_CACHE_TTL;
            await this.setCachedUserPermissions(userId, permissions, ttl);
        }
        
        return permissions;
    }

    // ==================== 權限管理方法 ====================

    /**
     * 建立新權限
     * @param permissionData 權限資料
     */
    public createPermission = async (permissionData: CreatePermissionRequest): Promise<PermissionDTO> => {
        try {
            logger.info(`Creating new permission: ${permissionData.name}`);

            // 驗證輸入
            if (!permissionData.name || permissionData.name.trim().length === 0) {
                throw new Error('Permission name is required');
            }

            // 檢查權限是否已存在
            const exists = await this.permissionQueriesRepo.exists(permissionData.name.trim());
            if (exists) {
                throw new Error(`Permission with name '${permissionData.name}' already exists`);
            }

            // 建立權限
            const permission = await this.permissionCommandsRepository.create({
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
    public updatePermission = async (permissionId: number, updateData: UpdatePermissionRequest): Promise<PermissionDTO | null> => {
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
                    const existingPermission = await this.permissionQueriesRepo.findByName(updatePayload.name);
                    if (existingPermission && existingPermission.id !== permissionId) {
                        throw new Error(`Permission with name '${updatePayload.name}' already exists`);
                    }
                }
            }
            if (updateData.description !== undefined) {
                updatePayload.description = updateData.description?.trim();
            }

            // 更新權限
            const updatedPermission = await this.permissionCommandsRepository.update(permissionId, updatePayload);
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
    public deletePermission = async (permissionId: number): Promise<boolean> => {
        try {
            logger.info(`Deleting permission ID: ${permissionId}`);

            // 驗證輸入
            if (!permissionId || permissionId <= 0) {
                throw new Error('Invalid permission ID');
            }

            // 檢查權限是否存在
            const existingPermission = await this.permissionQueriesRepo.findById(permissionId);
            if (!existingPermission) {
                logger.warn(`Permission deletion failed - permission not found for ID: ${permissionId}`);
                return false;
            }

            // 刪除權限
            const deleted = await this.permissionCommandsRepository.delete(permissionId);
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