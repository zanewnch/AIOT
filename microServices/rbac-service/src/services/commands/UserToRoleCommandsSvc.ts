/**
 * @fileoverview 使用者角色關聯命令服務實現
 *
 * 此文件實作了使用者角色關聯命令業務邏輯層，
 * 專注於處理所有寫入和操作相關的業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * 功能特點：
 * - 使用者角色分配、撤銷、批次操作
 * - Redis 快取管理和刷新
 * - 使用者角色快取自動清理和更新
 * - 事務性操作支援
 * - 使用查詢服務進行驗證
 *
 * 快取策略：
 * - 寫入後立即清除相關快取
 * - 刪除後清除相關快取
 * - 支援強制快取刷新
 *
 * @module UserToRoleCommandsSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { UserRoleCommandsRepository } from '../../repo/commands/rbac/UserRoleCommandsRepo.js';
import { getRedisClient } from '../../configs/redisConfig.js';
import type { RedisClientType } from 'redis';
import { createLogger } from '../../configs/loggerConfig.js';
import { UserToRoleQueriesSvc } from '../queries/UserToRoleQueriesSvc.js';

const logger = createLogger('UserToRoleCommandsSvc');

/**
 * 角色分配請求物件
 */
export interface AssignRolesRequest {
    userId: number;
    roleIds: number[];
}

/**
 * 角色撤銷請求物件
 */
export interface RemoveRoleRequest {
    userId: number;
    roleId: number;
}

/**
 * 使用者角色關聯命令服務類別
 * 
 * 提供使用者角色關聯的所有命令功能，
 * 包含快取管理、資料寫入和驗證邏輯。
 */
@injectable()
export class UserToRoleCommandsSvc {
    private static readonly USER_ROLES_CACHE_PREFIX = 'user_roles:';
    private static readonly ROLE_USERS_CACHE_PREFIX = 'role_users:';

    constructor(
        @inject(TYPES.UserToRoleQueriesSvc)
        private readonly userToRoleQueriesSvc: UserToRoleQueriesSvc
    ) {
        // Initialize repository directly for now since it's not in DI container yet
        this.userRoleCommandsRepository = new UserRoleCommandsRepository();
    }

    private readonly userRoleCommandsRepository: UserRoleCommandsRepository;

    /**
     * 取得 Redis 客戶端
     * 嘗試建立 Redis 連線，若失敗則拋出錯誤
     *
     * @returns Redis 客戶端實例
     * @throws Error 當 Redis 連線不可用時拋出錯誤
     * @private
     */
    private getRedisClient = (): RedisClientType => {
        try {
            return getRedisClient();
        } catch (error) {
            logger.warn('Redis not available, falling back to database operations');
            throw new Error('Redis connection is not available');
        }
    }

    /**
     * 產生使用者角色快取鍵值
     * @param userId 使用者 ID
     * @private
     */
    private getUserRolesCacheKey = (userId: number): string => {
        return `${UserToRoleCommandsSvc.USER_ROLES_CACHE_PREFIX}${userId}`;
    }

    /**
     * 產生角色使用者快取鍵值
     * @param roleId 角色 ID
     * @private
     */
    private getRoleUsersCacheKey = (roleId: number): string => {
        return `${UserToRoleCommandsSvc.ROLE_USERS_CACHE_PREFIX}${roleId}`;
    }

    /**
     * 清除使用者角色管理快取
     * @param userId 使用者 ID（可選）
     * @param roleId 角色 ID（可選）
     * @private
     */
    private clearUserRoleCache = async (userId?: number, roleId?: number): Promise<void> => {
        try {
            const redis = this.getRedisClient();
            if (userId) {
                // 清除使用者角色快取
                logger.debug(`Clearing Redis cache for user roles: ${userId}`);
                const userKey = this.getUserRolesCacheKey(userId);
                await redis.del(userKey);
            }
            if (roleId) {
                // 清除角色使用者快取
                logger.debug(`Clearing Redis cache for role users: ${roleId}`);
                const roleKey = this.getRoleUsersCacheKey(roleId);
                await redis.del(roleKey);
            }
            logger.debug('User role management caches cleared successfully');
        } catch (error) {
            logger.warn('Failed to clear user role management cache:', error);
        }
    }

    /**
     * 為使用者分配角色
     * @param request 角色分配請求
     * @returns 分配操作完成的 Promise
     */
    public assignRolesToUser = async (request: AssignRolesRequest): Promise<void> => {
        try {
            const { userId, roleIds } = request;
            logger.info(`Assigning roles ${roleIds.join(', ')} to user ID: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                throw new Error('Invalid user ID');
            }
            if (!roleIds || roleIds.length === 0) {
                throw new Error('At least one role ID must be provided');
            }

            // 使用查詢服務驗證使用者是否存在
            const userExists = await this.userToRoleQueriesSvc.userExists(userId);
            if (!userExists) {
                throw new Error('User not found');
            }

            // 驗證所有角色是否存在
            for (const roleId of roleIds) {
                if (!roleId || roleId <= 0) {
                    throw new Error(`Invalid role ID: ${roleId}`);
                }
                const roleExists = await this.userToRoleQueriesSvc.roleExists(roleId);
                if (!roleExists) {
                    throw new Error(`Role not found: ${roleId}`);
                }
            }

            // 分配角色
            const successfullyAssigned: number[] = [];
            for (const roleId of roleIds) {
                try {
                    const [, created] = await this.userRoleCommandsRepository.findOrCreate(
                        { userId, roleId },
                        { userId, roleId }
                    );
                    if (created) {
                        successfullyAssigned.push(roleId);
                        logger.debug(`Role ${roleId} assigned to user ${userId}`);
                    } else {
                        logger.debug(`Role ${roleId} already assigned to user ${userId}`);
                    }
                } catch (error) {
                    logger.warn(`Failed to assign role ${roleId} to user ${userId}:`, error);
                }
            }

            // 清除相關快取
            await this.clearUserRoleCache(userId);
            for (const roleId of successfullyAssigned) {
                await this.clearUserRoleCache(undefined, roleId);
            }

            logger.info(`Successfully assigned ${successfullyAssigned.length} roles to user ID: ${userId}`);
        } catch (error) {
            logger.error(`Error assigning roles to user ${request.userId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to assign roles to user');
        }
    }

    /**
     * 從使用者撤銷角色
     * @param request 角色撤銷請求
     * @returns 撤銷操作的結果（true 表示成功撤銷，false 表示角色本來就不屬於該使用者）
     */
    public removeRoleFromUser = async (request: RemoveRoleRequest): Promise<boolean> => {
        try {
            const { userId, roleId } = request;
            logger.info(`Removing role ${roleId} from user ID: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                throw new Error('Invalid user ID');
            }
            if (!roleId || roleId <= 0) {
                throw new Error('Invalid role ID');
            }

            // 使用查詢服務驗證使用者是否存在
            const userExists = await this.userToRoleQueriesSvc.userExists(userId);
            if (!userExists) {
                throw new Error('User not found');
            }

            // 驗證角色是否存在
            const roleExists = await this.userToRoleQueriesSvc.roleExists(roleId);
            if (!roleExists) {
                throw new Error('Role not found');
            }

            // 撤銷角色
            const removed = await this.userRoleCommandsRepository.deleteByUserAndRole(userId, roleId);

            if (removed) {
                // 清除相關快取
                await this.clearUserRoleCache(userId, roleId);
                logger.info(`Role ${roleId} removed from user ID: ${userId}`);
            } else {
                logger.warn(`Role ${roleId} was not assigned to user ID: ${userId}`);
            }

            return removed;
        } catch (error) {
            logger.error(`Error removing role from user ${request.userId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to remove role from user');
        }
    }

    /**
     * 批次撤銷使用者的所有角色
     * @param userId 使用者 ID
     * @returns 實際撤銷的角色數量
     */
    public removeAllRolesFromUser = async (userId: number): Promise<number> => {
        try {
            logger.info(`Removing all roles from user ID: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                throw new Error('Invalid user ID');
            }

            // 使用查詢服務驗證使用者是否存在
            const userExists = await this.userToRoleQueriesSvc.userExists(userId);
            if (!userExists) {
                throw new Error('User not found');
            }

            // 獲取使用者目前的角色
            const currentRoles = await this.userToRoleQueriesSvc.getUserRoles(userId);
            const roleIds = currentRoles.map(r => r.id);

            // 撤銷所有角色
            const removedCount = await this.userRoleCommandsRepository.deleteByUserId(userId);

            if (removedCount > 0) {
                // 清除相關快取
                await this.clearUserRoleCache(userId);
                for (const roleId of roleIds) {
                    await this.clearUserRoleCache(undefined, roleId);
                }
            }

            logger.info(`Removed ${removedCount} roles from user ID: ${userId}`);
            return removedCount;
        } catch (error) {
            logger.error(`Error removing all roles from user ${userId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to remove all roles from user');
        }
    }

    /**
     * 批次撤銷角色的所有使用者
     * @param roleId 角色 ID
     * @returns 實際撤銷的使用者數量
     */
    public removeAllUsersFromRole = async (roleId: number): Promise<number> => {
        try {
            logger.info(`Removing all users from role ID: ${roleId}`);

            // 驗證輸入
            if (!roleId || roleId <= 0) {
                throw new Error('Invalid role ID');
            }

            // 驗證角色是否存在
            const roleExists = await this.userToRoleQueriesSvc.roleExists(roleId);
            if (!roleExists) {
                throw new Error('Role not found');
            }

            // 獲取角色目前的使用者
            const currentUsers = await this.userToRoleQueriesSvc.getRoleUsers(roleId);
            const userIds = currentUsers.map(u => u.id);

            // 撤銷所有使用者
            const removedCount = await this.userRoleCommandsRepository.deleteByRoleId(roleId);

            if (removedCount > 0) {
                // 清除相關快取
                await this.clearUserRoleCache(undefined, roleId);
                for (const userId of userIds) {
                    await this.clearUserRoleCache(userId);
                }
            }

            logger.info(`Removed ${removedCount} users from role ID: ${roleId}`);
            return removedCount;
        } catch (error) {
            logger.error(`Error removing all users from role ${roleId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to remove all users from role');
        }
    }

    /**
     * 為使用者分配單一角色（便利方法）
     * @param userId 使用者 ID
     * @param roleId 角色 ID
     * @returns 分配操作完成的 Promise
     */
    public assignRoleToUser = async (userId: number, roleId: number): Promise<void> => {
        await this.assignRolesToUser({
            userId,
            roleIds: [roleId]
        });
    }

    /**
     * 批次更新使用者角色（先清除所有角色，再分配新角色）
     * @param userId 使用者 ID
     * @param roleIds 新的角色 ID 陣列
     * @returns 更新操作完成的 Promise
     */
    public updateUserRoles = async (userId: number, roleIds: number[]): Promise<void> => {
        try {
            logger.info(`Updating roles for user ID: ${userId} to [${roleIds.join(', ')}]`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                throw new Error('Invalid user ID');
            }

            // 使用查詢服務驗證使用者是否存在
            const userExists = await this.userToRoleQueriesSvc.userExists(userId);
            if (!userExists) {
                throw new Error('User not found');
            }

            // 先清除所有現有角色
            await this.removeAllRolesFromUser(userId);

            // 如果有新角色，則分配它們
            if (roleIds && roleIds.length > 0) {
                await this.assignRolesToUser({
                    userId,
                    roleIds
                });
            }

            logger.info(`Successfully updated roles for user ID: ${userId}`);
        } catch (error) {
            logger.error(`Error updating roles for user ${userId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to update user roles');
        }
    }
}