/**
 * @fileoverview 使用者服務層
 * 
 * 提供使用者管理相關的業務邏輯，整合 Redis 快取以提升效能。
 * 此服務負責處理使用者的 CRUD 操作、使用者資料快取管理、密碼安全處理。
 * 
 * 功能特點：
 * - 使用者的完整 CRUD 操作
 * - Redis 快取機制，減少資料庫查詢
 * - 自動快取失效和更新
 * - 密碼安全處理（bcrypt 加密）
 * - 使用者角色關聯管理
 * 
 * 快取策略：
 * - 單個使用者快取：user:{userId}
 * - 所有使用者快取：users:all
 * - 預設快取時間：1 小時
 * - 支援強制重新整理快取
 * 
 * 使用場景：
 * - RBAC 使用者管理
 * - 使用者認證和授權
 * - 使用者資料維護
 * - 使用者查詢和驗證
 * 
 * 效能考量：
 * - 優先使用 Redis 快取
 * - 資料庫查詢僅在快取失效時執行
 * - 支援批量操作減少網路開銷
 * - 自動處理 Redis 連線異常
 * 
 * 安全性考量：
 * - 密碼使用 bcrypt 加密
 * - 不在 DTO 中返回密碼雜湊
 * - 輸入驗證和清理
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-23
 */

// 匯入使用者資料存取層，用於使用者管理操作
import { UserRepository, IUserRepository } from '../repo/UserRepo.js';
// 匯入使用者模型類型
import { UserModel } from '../models/rbac/UserModel.js';
// 匯入 bcrypt 用於密碼加密
import bcrypt from 'bcrypt';
// 匯入 Redis 客戶端配置，用於快取管理
import { getRedisClient } from '../configs/redisConfig.js';
// 匯入 Redis 客戶端類型定義
import type { RedisClientType } from 'redis';
// 匯入日誌記錄器
import { createLogger } from '../configs/loggerConfig.js';

// 創建服務專用的日誌記錄器
const logger = createLogger('UserService');

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
 * 使用者服務類別
 */
export class UserService {
    private userRepository: IUserRepository;
    private static readonly USER_CACHE_PREFIX = 'user:';
    private static readonly ALL_USERS_KEY = 'users:all';
    private static readonly DEFAULT_CACHE_TTL = 3600; // 1 小時
    private static readonly BCRYPT_SALT_ROUNDS = 10;

    /**
     * 建構函式
     * @param userRepository 使用者資料存取層
     */
    constructor(
        userRepository: IUserRepository = new UserRepository()
    ) {
        this.userRepository = userRepository;
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
     * 產生使用者快取鍵值
     * @param userId 使用者 ID
     */
    private getUserCacheKey(userId: number): string {
        return `${UserService.USER_CACHE_PREFIX}${userId}`;
    }

    /**
     * 將模型轉換為 DTO（過濾敏感資訊）
     * @param model 使用者模型
     */
    private modelToDTO(model: UserModel): UserDTO {
        return {
            id: model.id,
            username: model.username,
            email: model.email,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt
        };
    }

    /**
     * 加密密碼
     * @param password 明文密碼
     */
    private async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, UserService.BCRYPT_SALT_ROUNDS);
    }

    /**
     * 驗證密碼
     * @param password 明文密碼
     * @param hash 密碼雜湊
     */
    public async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    /**
     * 從快取取得所有使用者
     */
    private async getCachedAllUsers(): Promise<UserDTO[] | null> {
        try {
            const redis = this.getRedisClient();
            logger.debug('Checking Redis cache for all users');
            const cachedData = await redis.get(UserService.ALL_USERS_KEY);
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
     */
    private async cacheAllUsers(users: UserDTO[]): Promise<void> {
        try {
            const redis = this.getRedisClient();
            logger.debug('Caching all users in Redis');
            await redis.setEx(
                UserService.ALL_USERS_KEY,
                UserService.DEFAULT_CACHE_TTL,
                JSON.stringify(users)
            );

            // 同時快取每個單獨的使用者
            for (const user of users) {
                const key = this.getUserCacheKey(user.id);
                await redis.setEx(key, UserService.DEFAULT_CACHE_TTL, JSON.stringify(user));
            }
            logger.debug('Users cached successfully');
        } catch (error) {
            logger.warn('Failed to cache users:', error);
        }
    }

    /**
     * 從快取取得單一使用者
     * @param userId 使用者 ID
     */
    private async getCachedUser(userId: number): Promise<UserDTO | null> {
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
     */
    private async cacheUser(user: UserDTO): Promise<void> {
        try {
            const redis = this.getRedisClient();
            logger.debug(`Caching user ID: ${user.id} in Redis`);
            const key = this.getUserCacheKey(user.id);
            await redis.setEx(key, UserService.DEFAULT_CACHE_TTL, JSON.stringify(user));
        } catch (error) {
            logger.warn(`Failed to cache user ${user.id}:`, error);
        }
    }

    /**
     * 清除使用者管理快取
     * @param userId 使用者 ID（可選）
     */
    private async clearUserManagementCache(userId?: number): Promise<void> {
        try {
            const redis = this.getRedisClient();
            if (userId) {
                // 清除單個使用者快取
                logger.debug(`Clearing Redis cache for user ID: ${userId}`);
                const key = this.getUserCacheKey(userId);
                await redis.del(key);
            }
            
            // 總是清除所有使用者列表快取
            await redis.del(UserService.ALL_USERS_KEY);
            logger.debug('User management caches cleared successfully');
        } catch (error) {
            logger.warn('Failed to clear user management cache:', error);
        }
    }

    /**
     * 取得所有使用者列表
     */
    public async getAllUsers(): Promise<UserDTO[]> {
        try {
            logger.debug('Getting all users with cache support');

            // 先嘗試從快取取得
            const cachedUsers = await this.getCachedAllUsers();
            if (cachedUsers) {
                return cachedUsers;
            }

            // 快取不存在，從資料庫取得
            logger.debug('Fetching users from database');
            const users = await this.userRepository.findAll();
            const usersDTO = users.map(u => this.modelToDTO(u));

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
     */
    public async getUserById(userId: number): Promise<UserDTO | null> {
        try {
            logger.info(`Retrieving user by ID: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                logger.warn(`Invalid user ID: ${userId}`);
                return null;
            }

            // 先嘗試從快取取得
            const cachedUser = await this.getCachedUser(userId);
            if (cachedUser) {
                return cachedUser;
            }

            // 快取不存在，從資料庫取得
            logger.debug(`Fetching user ID: ${userId} from database`);
            const user = await this.userRepository.findById(userId);
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
     * 建立新使用者
     * @param userData 使用者資料
     */
    public async createUser(userData: CreateUserRequest): Promise<UserDTO> {
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

            // 檢查使用者名稱是否已存在
            const existingUser = await this.userRepository.findByUsername(userData.username.trim());
            if (existingUser) {
                throw new Error(`User with username '${userData.username}' already exists`);
            }

            // 檢查電子郵件是否已存在
            const existingEmail = await this.userRepository.findByEmail(userData.email.trim());
            if (existingEmail) {
                throw new Error(`User with email '${userData.email}' already exists`);
            }

            // 加密密碼
            const passwordHash = await this.hashPassword(userData.password);

            // 建立使用者
            const user = await this.userRepository.create({
                username: userData.username.trim(),
                email: userData.email.trim(),
                passwordHash
            });

            const userDTO = this.modelToDTO(user);

            // 更新快取
            await this.cacheUser(userDTO);
            // 清除所有使用者列表快取，強制下次重新載入
            await this.clearUserManagementCache();

            logger.info(`User created successfully: ${userData.username} (ID: ${userDTO.id})`);
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
    public async updateUser(userId: number, updateData: UpdateUserRequest): Promise<UserDTO | null> {
        try {
            logger.info(`Updating user ID: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                throw new Error('Invalid user ID');
            }

            if (!updateData.username && !updateData.email && !updateData.password) {
                throw new Error('At least one field (username, email, or password) must be provided for update');
            }

            // 準備更新資料
            const updatePayload: any = {};
            
            if (updateData.username !== undefined) {
                updatePayload.username = updateData.username.trim();
                
                // 檢查新使用者名稱是否已被其他使用者使用
                if (updatePayload.username) {
                    const existingUser = await this.userRepository.findByUsername(updatePayload.username);
                    if (existingUser && existingUser.id !== userId) {
                        throw new Error(`User with username '${updatePayload.username}' already exists`);
                    }
                }
            }
            
            if (updateData.email !== undefined) {
                updatePayload.email = updateData.email.trim();
                
                // 檢查新電子郵件是否已被其他使用者使用
                if (updatePayload.email) {
                    const existingUser = await this.userRepository.findByEmail(updatePayload.email);
                    if (existingUser && existingUser.id !== userId) {
                        throw new Error(`User with email '${updatePayload.email}' already exists`);
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
            const updatedUser = await this.userRepository.update(userId, updatePayload);
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
    public async deleteUser(userId: number): Promise<boolean> {
        try {
            logger.info(`Deleting user ID: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                throw new Error('Invalid user ID');
            }

            // 檢查使用者是否存在
            const existingUser = await this.userRepository.findById(userId);
            if (!existingUser) {
                logger.warn(`User deletion failed - user not found for ID: ${userId}`);
                return false;
            }

            // 刪除使用者
            const deleted = await this.userRepository.delete(userId);
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
     * 根據使用者名稱查找使用者
     * @param username 使用者名稱
     */
    public async getUserByUsername(username: string): Promise<UserDTO | null> {
        try {
            logger.info(`Retrieving user by username: ${username}`);

            // 驗證輸入
            if (!username || username.trim().length === 0) {
                logger.warn('Invalid username');
                return null;
            }

            // 從資料庫查找
            const user = await this.userRepository.findByUsername(username.trim());
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
    public async getUserByEmail(email: string): Promise<UserDTO | null> {
        try {
            logger.info(`Retrieving user by email: ${email}`);

            // 驗證輸入
            if (!email || email.trim().length === 0) {
                logger.warn('Invalid email');
                return null;
            }

            // 從資料庫查找
            const user = await this.userRepository.findByEmail(email.trim());
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
     * 驗證使用者登入
     * @param username 使用者名稱
     * @param password 密碼
     */
    public async validateUserLogin(username: string, password: string): Promise<UserDTO | null> {
        try {
            logger.info(`Validating login for user: ${username}`);

            // 驗證輸入
            if (!username || !password) {
                logger.warn('Username and password are required');
                return null;
            }

            // 查找使用者（包含密碼雜湊）
            const user = await this.userRepository.findByUsername(username.trim());
            if (!user) {
                logger.warn(`User not found for login: ${username}`);
                return null;
            }

            // 驗證密碼
            const isValidPassword = await this.verifyPassword(password, user.passwordHash);
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
}