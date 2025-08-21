/**
 * @fileoverview 使用者命令服務實現
 *
 * 此文件實作了使用者命令業務邏輯層，
 * 專注於處理所有寫入和操作相關的業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * 功能特點：
 * - 使用者創建、更新、刪除
 * - Redis 快取管理和刷新
 * - 使用者快取自動清理和更新
 * - 事務性操作支援
 * - 使用查詢服務進行驗證
 * - 密碼安全處理
 * - 使用者登入驗證
 *
 * 快取策略：
 * - 寫入後立即更新快取
 * - 刪除後清除相關快取
 * - 支援強制快取刷新
 *
 * 安全性考量：
 * - 密碼使用 bcrypt 加密
 * - 輸入驗證和清理
 * - 重複性檢查
 *
 * @module UserCommandsSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { UserCommandsRepository } from '../../repo/commands/UserCommandsRepo.js';
import { UserModel } from '../../models/UserModel.js';
import bcrypt from 'bcrypt';
import { getRedisClient } from '../../configs/redisConfig.js';
import type { RedisClientType } from 'redis';
import { createLogger } from '../../configs/loggerConfig.js';
import { UserQueriesSvc } from '../queries/UserQueriesSvc.js';
import type { UserDTO } from '../queries/UserQueriesSvc.js';

const logger = createLogger('UserCommandsSvc');

/**
 * 建立使用者請求物件
 */
export interface CreateUserRequest {
    username: string;
    email: string;
    password: string; // 明文密碼，將被加密
}

/**
 * 更新使用者請求物件
 */
export interface UpdateUserRequest {
    username?: string;
    email?: string;
    password?: string; // 明文密碼，將被加密
}

/**
 * 使用者命令服務類別
 */
@injectable()
export class UserCommandsSvc {
    private redisClient: RedisClientType | null;
    private isRedisAvailable: boolean;
    private static readonly USER_CACHE_PREFIX = 'user:';
    private static readonly ALL_USERS_KEY = 'users:all';
    private static readonly DEFAULT_CACHE_TTL = 3600; // 1 小時
    private static readonly BCRYPT_SALT_ROUNDS = 10;

    /**
     * 建構函式
     * 初始化使用者命令服務，設定資料存取層和查詢服務實例
     */
    constructor(
        @inject(TYPES.UserCommandsRepo) private readonly userCommandsRepository: UserCommandsRepository,
        @inject(TYPES.UserQueriesSvc) private readonly userQueriesSvc: UserQueriesSvc
    ) {
        // 在 constructor 中初始化 Redis 連線
        try {
            this.redisClient = getRedisClient();
            this.isRedisAvailable = true;
            logger.info('Redis client initialized successfully for UserCommandsSvc');
        } catch (error) {
            this.redisClient = null;
            this.isRedisAvailable = false;
            logger.warn('Redis not available, UserCommandsSvc will fallback to database operations only:', error);
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
     * 產生使用者快取鍵值
     * 
     * 根據使用者 ID 生成統一的 Redis 快取鍵值
     * 遵循命名約定，确保快取鍵值的一致性
     * 
     * @param userId - 使用者的唯一識別碼
     * @returns 格式化的 Redis 鍵值字符串
     * 
     * @example
     * ```typescript
     * const cacheKey = this.getUserCacheKey(123);
     * console.log(cacheKey); // 輸出: "user:123"
     * ```
     * 
     * @private
     */
    private getUserCacheKey = (userId: number): string => {
        return `${UserCommandsSvc.USER_CACHE_PREFIX}${userId}`;
    }

    /**
     * 將模型轉換為 DTO（過濾敏感資訊）
     * 
     * 將內部使用者模型轉換為安全的數據傳輸物件
     * 自動過濾敏感資訊如密碼和內部標記
     * 
     * @param model - 原始的使用者模型實例
     * @returns 安全的使用者 DTO 物件
     * 
     * @example
     * ```typescript
     * const userModel = await User.findById(123);
     * const safeUserData = this.modelToDTO(userModel);
     * // safeUserData 不包含 password 等敏感資訊
     * ```
     * 
     * @private
     */
    private modelToDTO = (model: UserModel): UserDTO => {
        return {
            id: model.id,
            username: model.username,
            email: model.email || '',
            createdAt: model.createdAt,
            updatedAt: model.updatedAt
        };
    }

    /**
     * 加密密碼
     * @param password 明文密碼
     * @private
     */
    private hashPassword = async (password: string): Promise<string> => {
        return bcrypt.hash(password, UserCommandsSvc.BCRYPT_SALT_ROUNDS);
    }

    /**
     * 清除使用者管理快取
     * @param userId 使用者 ID（可選）
     * @private
     */
    private clearUserManagementCache = async (userId?: number): Promise<void> => {
        const redis = this.getRedisClient();
        if (!redis) {
            logger.debug('Redis not available, skipping cache clear operation');
            return; // Redis 不可用，直接返回
        }

        try {
            if (userId) {
                // 清除單個使用者快取
                logger.debug(`Clearing Redis cache for user ID: ${userId}`);
                const key = this.getUserCacheKey(userId);
                await redis.del(key);
            }

            // 總是清除所有使用者列表快取
            await redis.del(UserCommandsSvc.ALL_USERS_KEY);
            logger.debug('User management caches cleared successfully');
        } catch (error) {
            logger.warn('Failed to clear user management cache:', error);
        }
    }

    /**
     * 快取單一使用者
     * @param user 使用者資料
     * @private
     */
    private cacheUser = async (user: UserDTO): Promise<void> => {
        const redis = this.getRedisClient();
        if (!redis) {
            logger.debug('Redis not available, skipping cache user operation');
            return; // Redis 不可用，直接返回
        }

        try {
            logger.debug(`Caching user ID: ${user.id} in Redis`);
            const key = this.getUserCacheKey(user.id);
            await redis.setEx(key, UserCommandsSvc.DEFAULT_CACHE_TTL, JSON.stringify(user));
        } catch (error) {
            logger.warn(`Failed to cache user ${user.id}:`, error);
        }
    }

    /**
     * 建立新使用者
     * @param userData 使用者資料
     */
    public createUser = async (userData: CreateUserRequest): Promise<UserDTO> => {
        try {
            logger.info(`Creating new user: ${userData.username}`);

            // 驗證輸入
            if (!userData.username || userData.username.trim().length === 0) {
                throw new Error('Username is required');
            }
            if (!userData.email || userData.email.trim().length === 0) {
                throw new Error('Email is required');
            }
            if (!userData.password || userData.password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            const trimmedUsername = userData.username.trim();
            const trimmedEmail = userData.email.trim();

            // 檢查使用者名稱是否已存在
            const usernameExists = await this.userQueriesSvc.usernameExists(trimmedUsername);
            if (usernameExists) {
                throw new Error(`User with username '${trimmedUsername}' already exists`);
            }

            // 檢查電子郵件是否已存在
            const emailExists = await this.userQueriesSvc.emailExists(trimmedEmail);
            if (emailExists) {
                throw new Error(`User with email '${trimmedEmail}' already exists`);
            }

            // 加密密碼
            const passwordHash = await this.hashPassword(userData.password);

            // 建立使用者
            const user = await this.userCommandsRepository.create({
                username: trimmedUsername,
                email: trimmedEmail,
                passwordHash
            });

            const userDTO = this.modelToDTO(user);

            // 更新快取
            await this.cacheUser(userDTO);
            // 清除所有使用者列表快取，強制下次重新載入
            await this.clearUserManagementCache();

            logger.info(`User created successfully: ${trimmedUsername} (ID: ${userDTO.id})`);
            return userDTO;
        } catch (error) {
            logger.error('Error creating user:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create user');
        }
    }

    /**
     * 更新使用者
     * @param userId 使用者 ID
     * @param updateData 更新資料
     */
    public updateUser = async (userId: number, updateData: UpdateUserRequest): Promise<UserDTO | null> => {
        try {
            logger.info(`Updating user ID: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                throw new Error('Invalid user ID');
            }

            if (!updateData.username && !updateData.email && !updateData.password) {
                throw new Error('At least one field (username, email, or password) must be provided for update');
            }

            // 檢查使用者是否存在
            const userExists = await this.userQueriesSvc.userExists(userId);
            if (!userExists) {
                logger.warn(`User update failed - user not found for ID: ${userId}`);
                return null;
            }

            // 準備更新資料
            const updatePayload: any = {};

            if (updateData.username !== undefined) {
                const trimmedUsername = updateData.username.trim();
                updatePayload.username = trimmedUsername;

                // 檢查新使用者名稱是否已被其他使用者使用
                if (trimmedUsername) {
                    const usernameExists = await this.userQueriesSvc.usernameExists(trimmedUsername, userId);
                    if (usernameExists) {
                        throw new Error(`User with username '${trimmedUsername}' already exists`);
                    }
                }
            }

            if (updateData.email !== undefined) {
                const trimmedEmail = updateData.email.trim();
                updatePayload.email = trimmedEmail;

                // 檢查新電子郵件是否已被其他使用者使用
                if (trimmedEmail) {
                    const emailExists = await this.userQueriesSvc.emailExists(trimmedEmail, userId);
                    if (emailExists) {
                        throw new Error(`User with email '${trimmedEmail}' already exists`);
                    }
                }
            }

            if (updateData.password !== undefined) {
                if (updateData.password.length < 6) {
                    throw new Error('Password must be at least 6 characters long');
                }
                updatePayload.passwordHash = await this.hashPassword(updateData.password);
            }

            // 更新使用者
            const updatedUser = await this.userCommandsRepository.update(userId, updatePayload);
            if (!updatedUser) {
                logger.warn(`User update failed - user not found for ID: ${userId}`);
                return null;
            }

            const userDTO = this.modelToDTO(updatedUser);

            // 更新快取
            await this.cacheUser(userDTO);
            // 清除所有使用者列表快取
            await this.clearUserManagementCache();

            logger.info(`User updated successfully: ID ${userId}`);
            return userDTO;
        } catch (error) {
            logger.error(`Error updating user ${userId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to update user');
        }
    }

    /**
     * 刪除使用者
     * @param userId 使用者 ID
     */
    public deleteUser = async (userId: number): Promise<boolean> => {
        try {
            logger.info(`Deleting user ID: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                throw new Error('Invalid user ID');
            }

            // 檢查使用者是否存在
            const userExists = await this.userQueriesSvc.userExists(userId);
            if (!userExists) {
                logger.warn(`User deletion failed - user not found for ID: ${userId}`);
                return false;
            }

            // 刪除使用者
            const deleted = await this.userCommandsRepository.delete(userId);
            if (deleted) {
                // 清除快取
                await this.clearUserManagementCache(userId);
                logger.info(`User deleted successfully: ID ${userId}`);
            }

            return deleted;
        } catch (error) {
            logger.error(`Error deleting user ${userId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to delete user');
        }
    }

    /**
     * 驗證使用者登入
     * @param username 使用者名稱
     * @param password 密碼
     */
    public validateUserLogin = async (username: string, password: string): Promise<UserDTO | null> => {
        try {
            logger.info(`Validating login for user: ${username}`);

            // 驗證輸入
            if (!username || !password) {
                logger.warn('Username and password are required');
                return null;
            }

            // 查找使用者（包含密碼雜湊）
            const user = await this.userQueriesSvc.getUserWithPasswordByUsername(username.trim());
            if (!user) {
                logger.warn(`User not found for login: ${username}`);
                return null;
            }

            // 驗證密碼
            const isValidPassword = await this.userQueriesSvc.verifyPassword(password, user.passwordHash);
            if (!isValidPassword) {
                logger.warn(`Invalid password for user: ${username}`);
                return null;
            }

            const userDTO = this.modelToDTO(user);
            logger.info(`User login validated successfully: ${username} (ID: ${userDTO.id})`);
            return userDTO;
        } catch (error) {
            logger.error(`Error validating user login ${username}:`, error);
            throw new Error('Failed to validate user login');
        }
    }

    /**
     * 驗證密碼
     * @param password 明文密碼
     * @param hash 密碼雜湊
     */
    public verifyPassword = async (password: string, hash: string): Promise<boolean> => {
        return this.userQueriesSvc.verifyPassword(password, hash);
    }
}