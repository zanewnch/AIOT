/**
 * @fileoverview 使用者角色關聯服務層
 * 
 * 提供使用者與角色關聯管理相關的業務邏輯，整合 Redis 快取以提升效能。
 * 此服務負責處理使用者角色的分配、撤銷、查詢等操作。
 * 
 * 功能特點：
 * - 使用者角色的完整管理操作
 * - Redis 快取機制，減少資料庫查詢
 * - 自動快取失效和更新
 * - 角色分配的安全驗證
 * - 支援批次角色操作
 * 
 * 快取策略：
 * - 使用者角色快取：user_roles:{userId}
 * - 角色使用者快取：role_users:{roleId}
 * - 預設快取時間：1 小時
 * - 支援強制重新整理快取
 * 
 * 使用場景：
 * - RBAC 使用者角色管理
 * - 使用者權限分配
 * - 角色成員管理
 * - 使用者角色查詢和驗證
 * 
 * 效能考量：
 * - 優先使用 Redis 快取
 * - 資料庫查詢僅在快取失效時執行
 * - 支援批量操作減少網路開銷
 * - 自動處理 Redis 連線異常
 * 
 * 安全性考量：
 * - 角色分配前驗證使用者和角色存在性
 * - 防止重複分配和無效撤銷
 * - 記錄角色變更的操作日誌
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-23
 */

// 匯入使用者角色資料存取層，用於使用者角色關聯管理操作
import { UserRoleRepository, IUserRoleRepository } from '../repo/UserRoleRepo.js';
// 匯入使用者資料存取層，用於使用者驗證
import { UserRepository, IUserRepository } from '../repo/UserRepo.js';
// 匯入角色資料存取層，用於角色驗證
import { RoleRepository, IRoleRepository } from '../repo/RoleRepo.js';
// 匯入模型類型
import { UserModel } from '../models/rbac/UserModel.js';
import { RoleModel } from '../models/rbac/RoleModel.js';
// 匯入 Redis 客戶端配置，用於快取管理
import { getRedisClient } from '../configs/redisConfig.js';
// 匯入 Redis 客戶端類型定義
import type { RedisClientType } from 'redis';
// 匯入日誌記錄器
import { createLogger } from '../configs/loggerConfig.js';

// 創建服務專用的日誌記錄器
const logger = createLogger('UserToRoleService');

/**
 * 使用者角色資料傳輸物件
 */
export interface UserRoleDTO {
    userId: number;
    roleId: number;
    assignedAt: Date;
    user?: {
        id: number;
        username: string;
        email: string;
    };
    role?: {
        id: number;
        name: string;
        displayName?: string;
    };
}

/**
 * 角色資料傳輸物件
 */
export interface RoleDTO {
    id: number;
    name: string;
    displayName?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 使用者資料傳輸物件
 */
export interface UserDTO {
    id: number;
    username: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 使用者角色關聯服務類別
 */
export class UserToRoleService {
    private userRoleRepository: IUserRoleRepository;
    private userRepository: IUserRepository;
    private roleRepository: IRoleRepository;
    private static readonly USER_ROLES_CACHE_PREFIX = 'user_roles:';
    private static readonly ROLE_USERS_CACHE_PREFIX = 'role_users:';
    private static readonly DEFAULT_CACHE_TTL = 3600; // 1 小時

    /**
     * 建構函式
     * @param userRoleRepository 使用者角色資料存取層
     * @param userRepository 使用者資料存取層
     * @param roleRepository 角色資料存取層
     */
    constructor(
        userRoleRepository: IUserRoleRepository = new UserRoleRepository(),
        userRepository: IUserRepository = new UserRepository(),
        roleRepository: IRoleRepository = new RoleRepository()
    ) {
        this.userRoleRepository = userRoleRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
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
     * 產生使用者角色快取鍵值
     * @param userId 使用者 ID
     */
    private getUserRolesCacheKey(userId: number): string {
        return `${UserToRoleService.USER_ROLES_CACHE_PREFIX}${userId}`;
    }

    /**
     * 產生角色使用者快取鍵值
     * @param roleId 角色 ID
     */
    private getRoleUsersCacheKey(roleId: number): string {
        return `${UserToRoleService.ROLE_USERS_CACHE_PREFIX}${roleId}`;
    }

    /**
     * 將角色模型轉換為 DTO
     * @param model 角色模型
     */
    private roleModelToDTO(model: RoleModel): RoleDTO {
        return {
            id: model.id,
            name: model.name,
            displayName: model.displayName,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt
        };
    }

    /**
     * 將使用者模型轉換為 DTO
     * @param model 使用者模型
     */
    private userModelToDTO(model: UserModel): UserDTO {
        return {
            id: model.id,
            username: model.username,
            email: model.email,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt
        };
    }

    /**
     * 從快取取得使用者角色
     * @param userId 使用者 ID
     */
    private async getCachedUserRoles(userId: number): Promise<RoleDTO[] | null> {
        try {
            const redis = this.getRedisClient();
            logger.debug(`Checking Redis cache for user roles: ${userId}`);
            const key = this.getUserRolesCacheKey(userId);
            const cachedData = await redis.get(key);
            if (cachedData) {
                logger.info(`User roles for ID: ${userId} loaded from Redis cache`);
                return JSON.parse(cachedData);
            }
        } catch (error) {
            logger.warn(`Failed to get cached user roles ${userId}:`, error);
        }
        return null;
    }

    /**
     * 快取使用者角色
     * @param userId 使用者 ID
     * @param roles 角色列表
     */
    private async cacheUserRoles(userId: number, roles: RoleDTO[]): Promise<void> {
        try {
            const redis = this.getRedisClient();
            logger.debug(`Caching user roles for ID: ${userId} in Redis`);
            const key = this.getUserRolesCacheKey(userId);
            await redis.setEx(key, UserToRoleService.DEFAULT_CACHE_TTL, JSON.stringify(roles));
        } catch (error) {
            logger.warn(`Failed to cache user roles ${userId}:`, error);
        }
    }

    /**
     * 清除使用者角色管理快取
     * @param userId 使用者 ID（可選）
     * @param roleId 角色 ID（可選）
     */
    private async clearUserRoleCache(userId?: number, roleId?: number): Promise<void> {
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
     * 取得使用者的所有角色
     * @param userId 使用者 ID
     */
    public async getUserRoles(userId: number): Promise<RoleDTO[]> {
        try {
            logger.info(`Getting roles for user ID: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                logger.warn(`Invalid user ID: ${userId}`);
                throw new Error('Invalid user ID');
            }

            // 先嘗試從快取取得
            const cachedRoles = await this.getCachedUserRoles(userId);
            if (cachedRoles) {
                return cachedRoles;
            }

            // 驗證使用者是否存在
            const user = await this.userRepository.findById(userId);
            if (!user) {
                logger.warn(`User not found for ID: ${userId}`);
                throw new Error('User not found');
            }

            // 從資料庫取得使用者角色
            logger.debug(`Fetching roles for user ID: ${userId} from database`);
            const roles = await this.userRoleRepository.findRolesByUserId(userId);
            const rolesDTO = roles.map(r => this.roleModelToDTO(r));

            logger.info(`Retrieved ${rolesDTO.length} roles for user ID: ${userId}`);

            // 更新快取
            await this.cacheUserRoles(userId, rolesDTO);

            return rolesDTO;
        } catch (error) {
            logger.error(`Error getting roles for user ${userId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to get user roles');
        }
    }

    /**
     * 為使用者分配角色
     * @param userId 使用者 ID
     * @param roleIds 角色 ID 陣列
     */
    public async assignRolesToUser(userId: number, roleIds: number[]): Promise<void> {
        try {
            logger.info(`Assigning roles ${roleIds.join(', ')} to user ID: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                throw new Error('Invalid user ID');
            }
            if (!roleIds || roleIds.length === 0) {
                throw new Error('At least one role ID must be provided');
            }

            // 驗證使用者是否存在
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // 驗證所有角色是否存在
            for (const roleId of roleIds) {
                if (!roleId || roleId <= 0) {
                    throw new Error(`Invalid role ID: ${roleId}`);
                }
                const role = await this.roleRepository.findById(roleId);
                if (!role) {
                    throw new Error(`Role not found: ${roleId}`);
                }
            }

            // 分配角色
            const successfullyAssigned: number[] = [];
            for (const roleId of roleIds) {
                try {
                    const [, created] = await this.userRoleRepository.findOrCreate(userId, roleId);
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
            logger.error(`Error assigning roles to user ${userId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to assign roles to user');
        }
    }

    /**
     * 從使用者撤銷角色
     * @param userId 使用者 ID
     * @param roleId 角色 ID
     */
    public async removeRoleFromUser(userId: number, roleId: number): Promise<boolean> {
        try {
            logger.info(`Removing role ${roleId} from user ID: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                throw new Error('Invalid user ID');
            }
            if (!roleId || roleId <= 0) {
                throw new Error('Invalid role ID');
            }

            // 驗證使用者是否存在
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // 驗證角色是否存在
            const role = await this.roleRepository.findById(roleId);
            if (!role) {
                throw new Error('Role not found');
            }

            // 撤銷角色
            const removed = await this.userRoleRepository.delete(userId, roleId);

            if (removed) {
                // 清除相關快取
                await this.clearUserRoleCache(userId, roleId);
                logger.info(`Role ${roleId} removed from user ID: ${userId}`);
            } else {
                logger.warn(`Role ${roleId} was not assigned to user ID: ${userId}`);
            }

            return removed;
        } catch (error) {
            logger.error(`Error removing role from user ${userId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to remove role from user');
        }
    }

    /**
     * 檢查使用者是否具有特定角色
     * @param userId 使用者 ID
     * @param roleId 角色 ID
     */
    public async userHasRole(userId: number, roleId: number): Promise<boolean> {
        try {
            logger.debug(`Checking if user ${userId} has role ${roleId}`);

            // 驗證輸入
            if (!userId || userId <= 0 || !roleId || roleId <= 0) {
                return false;
            }

            // 查詢使用者角色關聯
            const userRole = await this.userRoleRepository.findByUserAndRole(userId, roleId);
            const hasRole = !!userRole;

            logger.debug(`User ${userId} ${hasRole ? 'has' : 'does not have'} role ${roleId}`);
            return hasRole;
        } catch (error) {
            logger.error(`Error checking user role ${userId}-${roleId}:`, error);
            return false;
        }
    }

    /**
     * 取得角色的所有使用者
     * @param roleId 角色 ID
     */
    public async getRoleUsers(roleId: number): Promise<UserDTO[]> {
        try {
            logger.info(`Getting users for role ID: ${roleId}`);

            // 驗證輸入
            if (!roleId || roleId <= 0) {
                logger.warn(`Invalid role ID: ${roleId}`);
                throw new Error('Invalid role ID');
            }

            // 驗證角色是否存在
            const role = await this.roleRepository.findById(roleId);
            if (!role) {
                logger.warn(`Role not found for ID: ${roleId}`);
                throw new Error('Role not found');
            }

            // 從資料庫取得角色使用者
            logger.debug(`Fetching users for role ID: ${roleId} from database`);
            const users = await this.userRoleRepository.findUsersByRoleId(roleId);
            const usersDTO = users.map(u => this.userModelToDTO(u));

            logger.info(`Retrieved ${usersDTO.length} users for role ID: ${roleId}`);
            return usersDTO;
        } catch (error) {
            logger.error(`Error getting users for role ${roleId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to get role users');
        }
    }

    /**
     * 批次撤銷使用者的所有角色
     * @param userId 使用者 ID
     */
    public async removeAllRolesFromUser(userId: number): Promise<number> {
        try {
            logger.info(`Removing all roles from user ID: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                throw new Error('Invalid user ID');
            }

            // 驗證使用者是否存在
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // 獲取使用者目前的角色
            const currentRoles = await this.getUserRoles(userId);
            const roleIds = currentRoles.map(r => r.id);

            // 撤銷所有角色
            const removedCount = await this.userRoleRepository.deleteByUserId(userId);

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
     */
    public async removeAllUsersFromRole(roleId: number): Promise<number> {
        try {
            logger.info(`Removing all users from role ID: ${roleId}`);

            // 驗證輸入
            if (!roleId || roleId <= 0) {
                throw new Error('Invalid role ID');
            }

            // 驗證角色是否存在
            const role = await this.roleRepository.findById(roleId);
            if (!role) {
                throw new Error('Role not found');
            }

            // 獲取角色目前的使用者
            const currentUsers = await this.getRoleUsers(roleId);
            const userIds = currentUsers.map(u => u.id);

            // 撤銷所有使用者
            const removedCount = await this.userRoleRepository.deleteByRoleId(roleId);

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
}