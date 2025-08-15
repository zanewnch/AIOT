/**
 * @fileoverview 使用者查詢服務實現
 *
 * 此文件實作了使用者查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * 功能特點：
 * - 使用者查詢和資料擷取
 * - Redis 快取機制，減少資料庫查詢
 * - 使用者存在性檢查
 * - 支援快取選項控制
 * - 密碼驗證功能
 *
 * 快取策略：
 * - 單個使用者快取：user:{userId}
 * - 所有使用者快取：users:all
 * - 預設快取時間：1 小時
 * - 支援強制重新整理快取
 *
 * 安全性考量：
 * - DTO 中不返回密碼雜湊
 * - 輸入驗證和清理
 * - 安全的密碼驗證
 *
 * @module UserQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { UserQueriesRepository } from '../../repo/queries/UserQueriesRepo';
import { UserModel } from '../../models/UserModel';
import bcrypt from 'bcrypt';
import { getRedisClient } from '../../configs/redisConfig';
import type { RedisClientType } from 'redis';
import { createLogger } from '../../configs/loggerConfig';

const logger = createLogger('UserQueriesSvc');

/**
 * 使用者資料傳輸物件（不包含敏感資訊）
 */
export interface UserDTO {
    id: number;
    username: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 快取選項介面
 */
export interface CacheOptions {
    refresh?: boolean; // 是否強制重新整理快取
}

/**
 * 使用者查詢服務類別
 */
@injectable()
export class UserQueriesSvc {
    private userQueriesRepository: UserQueriesRepository;
    private static readonly USER_CACHE_PREFIX = 'user:';
    private static readonly ALL_USERS_KEY = 'users:all';
    private static readonly DEFAULT_CACHE_TTL = 3600; // 1 小時

    /**
     * 建構函式
     * 初始化使用者查詢服務，設定資料存取層實例
     * @param userQueriesRepository 使用者查詢資料存取層實例（可選，預設使用 UserQueriesRepository）
     */
    constructor(
        userQueriesRepository: UserQueriesRepository = new UserQueriesRepository()
    ) {
        this.userQueriesRepository = userQueriesRepository;
    }

    /**
     * 取得 Redis 客戶端
     * 嘗試建立 Redis 連線，若失敗則拋出錯誤
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
     * 產生使用者快取鍵值
     * @param userId 使用者 ID
     * @private
     */
    private getUserCacheKey = (userId: number): string => {
        return `${UserQueriesSvc.USER_CACHE_PREFIX}${userId}`;
    }

    /**
     * 將模型轉換為 DTO（過濾敏感資訊）
     * @param model 使用者模型
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
     * 從快取取得所有使用者
     * @private
     */
    private getCachedAllUsers = async (): Promise<UserDTO[] | null> => {
        try {
            const redis = this.getRedisClient();
            logger.debug('Checking Redis cache for all users');
            const cachedData = await redis.get(UserQueriesSvc.ALL_USERS_KEY);
            if (cachedData) {
                logger.info('Users loaded from Redis cache');
                return JSON.parse(cachedData);
            }
        } catch (error) {
            logger.warn('Failed to get cached users:', error);
        }
        return null;
    }

    /**
     * 快取所有使用者
     * @param users 使用者列表
     * @private
     */
    private cacheAllUsers = async (users: UserDTO[]): Promise<void> => {
        try {
            const redis = this.getRedisClient();
            logger.debug('Caching all users in Redis');
            await redis.setEx(
                UserQueriesSvc.ALL_USERS_KEY,
                UserQueriesSvc.DEFAULT_CACHE_TTL,
                JSON.stringify(users)
            );

            // 同時快取每個單獨的使用者
            for (const user of users) {
                const key = this.getUserCacheKey(user.id);
                await redis.setEx(key, UserQueriesSvc.DEFAULT_CACHE_TTL, JSON.stringify(user));
            }
            logger.debug('Users cached successfully');
        } catch (error) {
            logger.warn('Failed to cache users:', error);
        }
    }

    /**
     * 從快取取得單一使用者
     * @param userId 使用者 ID
     * @private
     */
    private getCachedUser = async (userId: number): Promise<UserDTO | null> => {
        try {
            const redis = this.getRedisClient();
            logger.debug(`Checking Redis cache for user ID: ${userId}`);
            const key = this.getUserCacheKey(userId);
            const cachedData = await redis.get(key);
            if (cachedData) {
                logger.info(`User ID: ${userId} loaded from Redis cache`);
                return JSON.parse(cachedData);
            }
        } catch (error) {
            logger.warn(`Failed to get cached user ${userId}:`, error);
        }
        return null;
    }

    /**
     * 快取單一使用者
     * @param user 使用者資料
     * @private
     */
    private cacheUser = async (user: UserDTO): Promise<void> => {
        try {
            const redis = this.getRedisClient();
            logger.debug(`Caching user ID: ${user.id} in Redis`);
            const key = this.getUserCacheKey(user.id);
            await redis.setEx(key, UserQueriesSvc.DEFAULT_CACHE_TTL, JSON.stringify(user));
        } catch (error) {
            logger.warn(`Failed to cache user ${user.id}:`, error);
        }
    }

    /**
     * 取得所有使用者列表
     * @param options 快取選項
     */
    public getAllUsers = async (options: CacheOptions = {}): Promise<UserDTO[]> => {
        try {
            logger.debug('Getting all users with cache support');

            // 如果不需要刷新快取，先嘗試從快取取得
            if (!options.refresh) {
                const cachedUsers = await this.getCachedAllUsers();
                if (cachedUsers) {
                    return cachedUsers;
                }
            }

            // 快取不存在或需要刷新，從資料庫取得
            logger.debug('Fetching users from database');
            const users = await this.userQueriesRepository.findAll();
            const usersDTO = users.map((u: UserModel) => this.modelToDTO(u));

            logger.info(`Retrieved ${usersDTO.length} users from database`);

            // 更新快取
            await this.cacheAllUsers(usersDTO);

            return usersDTO;
        } catch (error) {
            logger.error('Error fetching all users:', error);
            throw new Error('Failed to fetch users');
        }
    }

    /**
     * 根據 ID 取得使用者
     * @param userId 使用者 ID
     * @param options 快取選項
     */
    public getUserById = async (userId: number, options: CacheOptions = {}): Promise<UserDTO | null> => {
        try {
            logger.info(`Retrieving user by ID: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                logger.warn(`Invalid user ID: ${userId}`);
                return null;
            }

            // 如果不需要刷新快取，先嘗試從快取取得
            if (!options.refresh) {
                const cachedUser = await this.getCachedUser(userId);
                if (cachedUser) {
                    return cachedUser;
                }
            }

            // 快取不存在或需要刷新，從資料庫取得
            logger.debug(`Fetching user ID: ${userId} from database`);
            const user = await this.userQueriesRepository.findById(userId);
            if (!user) {
                logger.warn(`User not found for ID: ${userId}`);
                return null;
            }

            const userDTO = this.modelToDTO(user);

            // 更新快取
            await this.cacheUser(userDTO);

            logger.info(`User ID: ${userId} retrieved successfully`);
            return userDTO;
        } catch (error) {
            logger.error(`Error fetching user by ID ${userId}:`, error);
            throw new Error('Failed to fetch user');
        }
    }

    /**
     * 根據使用者名稱查找使用者
     * @param username 使用者名稱
     */
    public getUserByUsername = async (username: string): Promise<UserDTO | null> => {
        try {
            logger.info(`Retrieving user by username: ${username}`);

            // 驗證輸入
            if (!username || username.trim().length === 0) {
                logger.warn('Invalid username');
                return null;
            }

            // 從資料庫查找
            const user = await this.userQueriesRepository.findByUsername(username.trim());
            if (!user) {
                logger.warn(`User not found for username: ${username}`);
                return null;
            }

            const userDTO = this.modelToDTO(user);
            logger.info(`User found: ${username} (ID: ${userDTO.id})`);
            return userDTO;
        } catch (error) {
            logger.error(`Error fetching user by username ${username}:`, error);
            throw new Error('Failed to fetch user');
        }
    }

    /**
     * 根據電子郵件查找使用者
     * @param email 電子郵件
     */
    public getUserByEmail = async (email: string): Promise<UserDTO | null> => {
        try {
            logger.info(`Retrieving user by email: ${email}`);

            // 驗證輸入
            if (!email || email.trim().length === 0) {
                logger.warn('Invalid email');
                return null;
            }

            // 從資料庫查找
            const user = await this.userQueriesRepository.findByEmail(email.trim());
            if (!user) {
                logger.warn(`User not found for email: ${email}`);
                return null;
            }

            const userDTO = this.modelToDTO(user);
            logger.info(`User found: ${email} (ID: ${userDTO.id})`);
            return userDTO;
        } catch (error) {
            logger.error(`Error fetching user by email ${email}:`, error);
            throw new Error('Failed to fetch user');
        }
    }

    /**
     * 驗證密碼
     * @param password 明文密碼
     * @param hash 密碼雜湊
     */
    public verifyPassword = async (password: string, hash: string): Promise<boolean> => {
        return bcrypt.compare(password, hash);
    }

    /**
     * 根據使用者名稱取得完整使用者資料（包含密碼雜湊，用於登入驗證）
     * @param username 使用者名稱
     * @internal 此方法僅供內部使用，不暴露密碼雜湊給外部
     */
    public getUserWithPasswordByUsername = async (username: string): Promise<UserModel | null> => {
        try {
            logger.debug(`Getting user with password for username: ${username}`);

            // 驗證輸入
            if (!username || username.trim().length === 0) {
                logger.warn('Invalid username');
                return null;
            }

            // 從資料庫查找（包含密碼雜湊）
            const user = await this.userQueriesRepository.findByUsername(username.trim());
            if (!user) {
                logger.warn(`User not found for username: ${username}`);
                return null;
            }

            logger.debug(`User with password found: ${username} (ID: ${user.id})`);
            return user;
        } catch (error) {
            logger.error(`Error fetching user with password by username ${username}:`, error);
            throw new Error('Failed to fetch user');
        }
    }

    /**
     * 檢查使用者是否存在
     * @param userId 使用者 ID
     */
    public userExists = async (userId: number): Promise<boolean> => {
        try {
            logger.debug(`Checking if user exists: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                return false;
            }

            const user = await this.getUserById(userId);
            const exists = user !== null;
            logger.debug(`User ${userId} exists: ${exists}`);
            return exists;
        } catch (error) {
            logger.error(`Error checking user existence ${userId}:`, error);
            return false;
        }
    }

    /**
     * 檢查使用者名稱是否存在
     * @param username 使用者名稱
     * @param excludeUserId 排除的使用者 ID（用於更新時檢查重複）
     */
    public usernameExists = async (username: string, excludeUserId?: number): Promise<boolean> => {
        try {
            logger.debug(`Checking if username exists: ${username}`);

            if (!username || username.trim().length === 0) {
                return false;
            }

            const user = await this.getUserByUsername(username.trim());
            const exists = user !== null && (excludeUserId === undefined || user.id !== excludeUserId);
            logger.debug(`Username ${username} exists: ${exists}`);
            return exists;
        } catch (error) {
            logger.error(`Error checking username existence ${username}:`, error);
            return false;
        }
    }

    /**
     * 檢查電子郵件是否存在
     * @param email 電子郵件
     * @param excludeUserId 排除的使用者 ID（用於更新時檢查重複）
     */
    public emailExists = async (email: string, excludeUserId?: number): Promise<boolean> => {
        try {
            logger.debug(`Checking if email exists: ${email}`);

            if (!email || email.trim().length === 0) {
                return false;
            }

            const user = await this.getUserByEmail(email.trim());
            const exists = user !== null && (excludeUserId === undefined || user.id !== excludeUserId);
            logger.debug(`Email ${email} exists: ${exists}`);
            return exists;
        } catch (error) {
            logger.error(`Error checking email existence ${email}:`, error);
            return false;
        }
    }
}