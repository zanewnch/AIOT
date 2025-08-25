/**
 * @fileoverview 角色命令服務實現
 *
 * 此文件實作了角色命令業務邏輯層，
 * 專注於處理所有寫入和操作相關的業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * 功能特點：
 * - 角色創建、更新、刪除
 * - Redis 快取管理和刷新
 * - 角色快取自動清理和更新
 * - 事務性操作支援
 * - 使用查詢服務進行驗證
 *
 * 快取策略：
 * - 寫入後立即更新快取
 * - 刪除後清除相關快取
 * - 支援強制快取刷新
 *
 * @module RoleCommandsService
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { RoleCommandsRepositorysitory } from.*Repositorysitorysitory.js';
import { RoleQueriesRepositorysitory } from.*Repositorysitorysitory.js';
import type { RoleModel } from '../../models/RoleModel.js';

import type { RedisClientType } from 'redis';
import { createLogger } from '../../configs/loggerConfig.js';
import * as sharedPackages from 'aiot-shared-packages';
import { RoleQueriesService } from.*Service.js';
import type { RoleDTO, CacheOptions, CreateRoleRequest, UpdateRoleRequest, IRoleCommandsService } from '../../types/index.js';

const logger = createLogger('RoleCommandsService');


/**
 * 角色命令服務實現類別
 *
 * 專門處理角色相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 * 
 * @class RoleCommandsService
 * @implements {IRoleCommandsService}
 * @since 1.0.0
 */
@injectable()
export class RoleCommandsService implements IRoleCommandsService {
    private static readonly ROLE_CACHE_PREFIX = 'role:';
    private static readonly ALL_ROLES_KEY = 'roles:all';
    private static readonly DEFAULT_CACHE_TTL = 3600; // 1 小時

    constructor(
        @inject(TYPES.RoleQueriesService) private readonly queryService: RoleQueriesService,
        @inject(TYPES.RoleCommandsRepositorysitory) private readonly roleCommandsRepositorysitory: RoleCommandsRepositorysitory,
        @inject(TYPES.RoleQueriesRepositorysitory) private readonly roleQueriesRepositorysitory: RoleQueriesRepositorysitory
    ) {
    }



    /**
     * 產生角色快取鍵值
     * @param roleId 角色 ID
     * @private
     */
    private getRoleCacheKey = (roleId: number): string => {
        return `${RoleCommandsService.ROLE_CACHE_PREFIX}${roleId}`;
    }

    /**
     * 將模型轉換為 DTO
     * @param model 角色模型
     * @private
     */
    private modelToDTO = (model: RoleModel): RoleDTO => {
        return {
            id: model.id,
            name: model.name,
            displayName: model.displayName,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt
        };
    }

    /**
     * 快取所有角色
     * @param roles 角色列表
     * @private
     */
    private cacheAllRoles = async (roles: RoleDTO[]): Promise<void> => {
        logger.debug('Caching all roles in Redis');
        
        await this.safeRedisWrite(
            async (redis: RedisClientType) => {
                await redis.setEx(RoleCommandsService.ALL_ROLES_KEY, RoleCommandsService.DEFAULT_CACHE_TTL, JSON.stringify(roles));
            },
            'cacheAllRoles'
        );

        const individualCachePromises = roles.map(role => this.cacheRole(role));
        await Promise.all(individualCachePromises);
        
        logger.debug('Roles cached successfully');
    }

    /**
     * 快取單一角色
     * @param role 角色資料
     * @private
     */
    private cacheRole = async (role: RoleDTO): Promise<void> => {
        logger.debug(`Caching role ID: ${role.id} in Redis`);
        const key = this.getRoleCacheKey(role.id);
        await this.safeRedisWrite(
            async (redis: RedisClientType) => {
                await redis.setEx(key, RoleCommandsService.DEFAULT_CACHE_TTL, JSON.stringify(role));
            },
            `cacheRole(${role.id})`
        );
    }

    /**
     * 清除角色管理快取
     * @param roleId 角色 ID（可選）
     * @private
     */
    private clearRoleManagementCache = async (roleId?: number): Promise<void> => {
        if (roleId) {
            logger.debug(`Clearing Redis cache for role ID: ${roleId}`);
            const key = this.getRoleCacheKey(roleId);
            await this.safeRedisOperation(
                async (redis: RedisClientType) => await redis.del(key),
                `clearRoleCache(${roleId})`,
                0
            );
        }

        // 清除所有角色列表快取
        await this.safeRedisOperation(
            async (redis: RedisClientType) => await redis.del(RoleCommandsService.ALL_ROLES_KEY),
            'clearAllRolesCache',
            0
        );
        
        logger.debug('Role management caches cleared successfully');
    }

    /**
     * 安全執行 Redis 操作
     * @param operation Redis 操作函式
     * @param operationName 操作名稱
     * @param fallbackValue 操作失敗時的預設返回值
     * @private
     */
    private safeRedisOperation = async <T>(
        operation: (redis: RedisClientType) => Promise<T>,
        operationName: string,
        fallbackValue: T
    ): Promise<T> => {
        try {
            const redis = sharedPackages.getRedisClient();
            const result = await operation(redis);
            logger.debug(`Redis operation ${operationName} completed successfully`);
            return result;
        } catch (error) {
            logger.warn(`Redis operation ${operationName} failed:`, error);
            return fallbackValue;
        }
    }

    /**
     * 安全執行 Redis 寫入操作
     * @param operation Redis 寫入操作函式
     * @param operationName 操作名稱
     * @private
     */
    private safeRedisWrite = async (
        operation: (redis: RedisClientType) => Promise<void>,
        operationName: string
    ): Promise<boolean> => {
        try {
            const redis = sharedPackages.getRedisClient();
            await operation(redis);
            logger.debug(`Redis write operation ${operationName} completed successfully`);
            return true;
        } catch (error) {
            logger.warn(`Redis write operation ${operationName} failed:`, error);
            return false;
        }
    }

    // ==================== 公開命令方法 ====================

    /**
     * 建立新角色
     * @param roleData 角色資料
     */
    public createRole = async (roleData: CreateRoleRequest): Promise<RoleDTO> => {
        try {
            logger.info(`Creating new role: ${roleData.name}`);

            // 驗證輸入
            if (!roleData.name || roleData.name.trim().length === 0) {
                throw new Error('Role name is required');
            }

            // 檢查角色是否已存在
            const exists = await this.roleQueriesRepositorysitory.exists(roleData.name.trim());
            if (exists) {
                throw new Error(`Role with name '${roleData.name}' already exists`);
            }

            // 建立角色
            const role = await this.roleCommandsRepositorysitory.create({
                name: roleData.name.trim(),
                displayName: roleData.displayName?.trim() || roleData.name.trim()
            });

            const roleDTO = this.modelToDTO(role);

            await this.cacheRole(roleDTO);
            await this.clearRoleManagementCache();

            logger.info(`Role created successfully: ${roleData.name} (ID: ${roleDTO.id})`);
            return roleDTO;
        } catch (error) {
            logger.error('Error creating role:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create role');
        }
    }

    /**
     * 更新角色
     * @param roleId 角色 ID
     * @param updateData 更新資料
     */
    public updateRole = async (roleId: number, updateData: UpdateRoleRequest): Promise<RoleDTO | null> => {
        try {
            logger.info(`Updating role ID: ${roleId}`);

            // 驗證輸入
            if (!roleId || roleId <= 0) {
                throw new Error('Invalid role ID');
            }

            if (!updateData.name && !updateData.displayName) {
                throw new Error('At least one field (name or displayName) must be provided for update');
            }

            // 準備更新資料
            const updatePayload: any = {};
            if (updateData.name !== undefined) {
                updatePayload.name = updateData.name.trim();

                // 檢查新名稱是否已被其他角色使用
                if (updatePayload.name) {
                    const existingRole = await this.roleQueriesRepositorysitory.findByName(updatePayload.name);
                    if (existingRole && existingRole.id !== roleId) {
                        throw new Error(`Role with name '${updatePayload.name}' already exists`);
                    }
                }
            }
            if (updateData.displayName !== undefined) {
                updatePayload.displayName = updateData.displayName?.trim();
            }

            // 更新角色
            const updatedRole = await this.roleCommandsRepositorysitory.update(roleId, updatePayload);
            if (!updatedRole) {
                logger.warn(`Role update failed - role not found for ID: ${roleId}`);
                return null;
            }

            const roleDTO = this.modelToDTO(updatedRole);

            await this.cacheRole(roleDTO);
            await this.clearRoleManagementCache();

            logger.info(`Role updated successfully: ID ${roleId}`);
            return roleDTO;
        } catch (error) {
            logger.error(`Error updating role ${roleId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to update role');
        }
    }

    /**
     * 刪除角色
     * @param roleId 角色 ID
     */
    public deleteRole = async (roleId: number): Promise<boolean> => {
        try {
            logger.info(`Deleting role ID: ${roleId}`);

            // 驗證輸入
            if (!roleId || roleId <= 0) {
                throw new Error('Invalid role ID');
            }

            // 檢查角色是否存在
            const existingRole = await this.roleQueriesRepositorysitory.findById(roleId);
            if (!existingRole) {
                logger.warn(`Role deletion failed - role not found for ID: ${roleId}`);
                return false;
            }

            // 刪除角色
            const deleted = await this.roleCommandsRepositorysitory.delete(roleId);
            if (deleted) {
                // 清除快取
                await this.clearRoleManagementCache(roleId);
                logger.info(`Role deleted successfully: ID ${roleId}`);
            }

            return deleted;
        } catch (error) {
            logger.error(`Error deleting role ${roleId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to delete role');
        }
    }
}