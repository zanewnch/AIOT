/**
 * @fileoverview 使用者角色關聯查詢服務實現
 *
 * 此文件實作了使用者角色關聯查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * 功能特點：
 * - 使用者角色關聯查詢和資料擷取
 * - Redis 快取機制，減少資料庫查詢
 * - 使用者角色存在性檢查
 * - 支援快取選項控制
 *
 * 快取策略：
 * - 使用者角色快取：user_roles:{userId}
 * - 角色使用者快取：role_users:{roleId}
 * - 預設快取時間：1 小時
 * - 支援強制重新整理快取
 *
 * @module UserToRoleQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { UserRoleQueriesRepository } from '../../repo/queries/UserRoleQueriesRepo';
import { UserQueriesRepository } from '../../repo/queries/UserQueriesRepo';
import { RoleQueriesRepository } from '../../repo/queries/RoleQueriesRepo';
import { UserModel } from '../../models/UserModel';
import { RoleModel } from '../../models/RoleModel';
import { getRedisClient } from '../../configs/redisConfig';
import type { RedisClientType } from 'redis';
import { createLogger } from '../../configs/loggerConfig';

const logger = createLogger('UserToRoleQueriesSvc');

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
 * 使用者角色關聯基本資料傳輸物件
 */
export interface UserRoleBasicDTO {
    id: string;
    userId: number;
    roleId: number;
    assignedAt: string;
}

/**
 * 快取選項介面
 */
export interface CacheOptions {
    /**
     * 是否刷新快取（強制從資料庫重新載入）
     */
    refreshCache?: boolean;
}

/**
 * 使用者角色關聯查詢服務類別
 * 
 * 提供使用者角色關聯的所有查詢功能，
 * 包含快取管理、資料轉換和驗證邏輯。
 */
@injectable()
export class UserToRoleQueriesSvc {
    private userRoleQueriesRepository: UserRoleQueriesRepository;
    private userQueriesRepository: UserQueriesRepository;
    private roleQueriesRepository: RoleQueriesRepository;
    
    private static readonly USER_ROLES_CACHE_PREFIX = 'user_roles:';
    private static readonly ROLE_USERS_CACHE_PREFIX = 'role_users:';
    private static readonly DEFAULT_CACHE_TTL = 3600;

    constructor(
        userRoleQueriesRepository: UserRoleQueriesRepository = new UserRoleQueriesRepository(),
        userQueriesRepository: UserQueriesRepository = new UserQueriesRepository(),
        roleQueriesRepository: RoleQueriesRepository = new RoleQueriesRepository()
    ) {
        this.userRoleQueriesRepository = userRoleQueriesRepository;
        this.userQueriesRepository = userQueriesRepository;
        this.roleQueriesRepository = roleQueriesRepository;
    }

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
            logger.warn('Redis not available, falling back to database queries');
            throw new Error('Redis connection is not available');
        }
    }

    /**
     * 產生使用者角色快取鍵值
     * @param userId 使用者 ID
     * @private
     */
    private getUserRolesCacheKey(userId: number): string {
        return `${UserToRoleQueriesSvc.USER_ROLES_CACHE_PREFIX}${userId}`;
    }

    /**
     * 產生角色使用者快取鍵值
     * @param roleId 角色 ID
     * @private
     */
    private getRoleUsersCacheKey(roleId: number): string {
        return `${UserToRoleQueriesSvc.ROLE_USERS_CACHE_PREFIX}${roleId}`;
    }

    /**
     * 將角色模型轉換為 DTO
     * @param model 角色模型
     * @private
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
     * @private
     */
    private userModelToDTO(model: UserModel): UserDTO {
        return {
            id: model.id,
            username: model.username,
            email: (typeof model.email === 'string' ? model.email : ''),
            createdAt: model.createdAt,
            updatedAt: model.updatedAt
        };
    }

    /**
     * 從快取取得使用者角色
     * @param userId 使用者 ID
     * @private
     */
    private getCachedUserRoles = async (userId: number): Promise<RoleDTO[] | null> => {
        try {
            const redis = this.getRedisClient();
            logger.debug(`Checking Redis cache for user roles: ${userId}`);
            const key = this.getUserRolesCacheKey(userId);
            const cachedData = await redis.get(key);
            if (cachedData && typeof cachedData === 'string') {
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
     * @private
     */
    private cacheUserRoles = async (userId: number, roles: RoleDTO[]): Promise<void> => {
        try {
            const redis = this.getRedisClient();
            logger.debug(`Caching user roles for ID: ${userId} in Redis`);
            const key = this.getUserRolesCacheKey(userId);
            await redis.setEx(key, UserToRoleQueriesSvc.DEFAULT_CACHE_TTL, JSON.stringify(roles));
        } catch (error) {
            logger.warn(`Failed to cache user roles ${userId}:`, error);
        }
    }

    /**
     * 檢查使用者是否存在
     * @param userId 使用者 ID
     * @returns 使用者是否存在
     */
    public userExists = async (userId: number): Promise<boolean> => {
        try {
            if (!userId || userId <= 0) {
                return false;
            }
            
            const user = await this.userQueriesRepository.findById(userId);
            return !!user;
        } catch (error) {
            logger.error(`Error checking user existence ${userId}:`, error);
            return false;
        }
    }

    /**
     * 檢查角色是否存在
     * @param roleId 角色 ID
     * @returns 角色是否存在
     */
    public roleExists = async (roleId: number): Promise<boolean> => {
        try {
            if (!roleId || roleId <= 0) {
                return false;
            }
            
            const role = await this.roleQueriesRepository.findById(roleId);
            return !!role;
        } catch (error) {
            logger.error(`Error checking role existence ${roleId}:`, error);
            return false;
        }
    }

    /**
     * 取得使用者的所有角色
     * @param userId 使用者 ID
     * @param options 快取選項
     * @returns 角色 DTO 陣列
     */
    public getUserRoles = async (userId: number, options: CacheOptions = {}): Promise<RoleDTO[]> => {
        try {
            logger.info(`Getting roles for user ID: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                logger.warn(`Invalid user ID: ${userId}`);
                throw new Error('Invalid user ID');
            }

            // 如果不刷新快取，先嘗試從快取取得
            if (!options.refreshCache) {
                const cachedRoles = await this.getCachedUserRoles(userId);
                if (cachedRoles) {
                    return cachedRoles;
                }
            }

            // 驗證使用者是否存在
            const user = await this.userQueriesRepository.findById(userId);
            if (!user) {
                logger.warn(`User not found for ID: ${userId}`);
                throw new Error('User not found');
            }

            // 從資料庫取得使用者角色
            logger.debug(`Fetching roles for user ID: ${userId} from database`);
            const userRoles = await this.userRoleQueriesRepository.findByUserId(userId);
            const roles = userRoles.map(ur => ur.role).filter(r => r !== null && r !== undefined);
            const rolesDTO = roles.map(r => this.roleModelToDTO(r!));

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
     * 檢查使用者是否具有特定角色
     * @param userId 使用者 ID
     * @param roleId 角色 ID
     * @returns 使用者是否具有角色
     */
    public userHasRole = async (userId: number, roleId: number): Promise<boolean> => {
        try {
            logger.debug(`Checking if user ${userId} has role ${roleId}`);

            // 驗證輸入
            if (!userId || userId <= 0 || !roleId || roleId <= 0) {
                return false;
            }

            // 查詢使用者角色關聯
            const userRole = await this.userRoleQueriesRepository.findByUserAndRole(userId, roleId);
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
     * @returns 使用者 DTO 陣列
     */
    public getRoleUsers = async (roleId: number): Promise<UserDTO[]> => {
        try {
            logger.info(`Getting users for role ID: ${roleId}`);

            // 驗證輸入
            if (!roleId || roleId <= 0) {
                logger.warn(`Invalid role ID: ${roleId}`);
                throw new Error('Invalid role ID');
            }

            // 驗證角色是否存在
            const role = await this.roleQueriesRepository.findById(roleId);
            if (!role) {
                logger.warn(`Role not found for ID: ${roleId}`);
                throw new Error('Role not found');
            }

            // 從資料庫取得角色使用者
            logger.debug(`Fetching users for role ID: ${roleId} from database`);
            const userRoles = await this.userRoleQueriesRepository.findByRoleId(roleId);
            const users = userRoles.map(ur => ur.user).filter(u => u !== null && u !== undefined);
            const usersDTO = users.map(u => this.userModelToDTO(u!));

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
     * 取得所有使用者角色關聯數據
     * 只回傳基本的關聯信息，避免 Sequelize 模型關聯錯誤
     * @returns 使用者角色關聯基本 DTO 陣列
     */
    public getAllUserRoles = async (): Promise<UserRoleBasicDTO[]> => {
        try {
            logger.info('Getting all user-role associations');

            // 從資料庫取得所有使用者角色關聯，不包含關聯的使用者和角色資訊以避免關聯錯誤
            const userRoles = await this.userRoleQueriesRepository.findAll();

            // 轉換為簡化的 DTO 格式
            const userRolesDTO = userRoles.map((ur: any) => ({
                id: `${ur.userId}-${ur.roleId}`,
                userId: ur.userId,
                roleId: ur.roleId,
                assignedAt: (ur.createdAt || new Date()).toISOString()
            }));

            logger.info(`Retrieved ${userRolesDTO.length} user-role associations`);
            return userRolesDTO;
        } catch (error) {
            logger.error('Error getting all user roles:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to get all user roles');
        }
    }

    /**
     * 根據使用者和角色 ID 查詢使用者角色關聯
     * @param userId 使用者 ID
     * @param roleId 角色 ID
     * @returns 使用者角色關聯是否存在
     */
    public findUserRoleAssociation = async (userId: number, roleId: number): Promise<boolean> => {
        try {
            logger.debug(`Looking for user-role association: user ${userId}, role ${roleId}`);

            if (!userId || userId <= 0 || !roleId || roleId <= 0) {
                return false;
            }

            const association = await this.userRoleQueriesRepository.findByUserAndRole(userId, roleId);
            return !!association;
        } catch (error) {
            logger.error(`Error finding user-role association ${userId}-${roleId}:`, error);
            return false;
        }
    }
}