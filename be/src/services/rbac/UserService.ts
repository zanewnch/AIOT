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
import { UserModel } from '../../models/rbac/UserModel.js';
// 匯入 bcrypt 用於密碼加密
import bcrypt from 'bcrypt';
// 匯入 Redis 客戶端配置，用於快取管理
import { getRedisClient } from '../../configs/redisConfig.js';
// 匯入 Redis 客戶端類型定義
import type { RedisClientType } from 'redis';
// 匯入日誌記錄器
import { createLogger } from '../../configs/loggerConfig.js';

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
export class UserService { // 使用者服務類別，提供完整的使用者管理功能
    private userRepository: IUserRepository; // 使用者資料存取層實例，用於資料庫操作
    private static readonly USER_CACHE_PREFIX = 'user:'; // Redis 中儲存個別使用者資料的鍵值前綴
    private static readonly ALL_USERS_KEY = 'users:all'; // Redis 中儲存所有使用者列表的鍵值
    private static readonly DEFAULT_CACHE_TTL = 3600; // 預設快取過期時間，1 小時（3600 秒）
    private static readonly BCRYPT_SALT_ROUNDS = 10; // bcrypt 密碼加密的鹽值輪數，影響加密強度和效能

    /**
     * 建構函式
     * 初始化使用者服務，設定資料存取層實例
     * @param userRepository 使用者資料存取層實例（可選，預設使用 UserRepository）
     */
    constructor( // 建構函式，初始化使用者服務
        userRepository: IUserRepository = new UserRepository() // 使用者資料存取層，預設建立新的 UserRepository 實例
    ) {
        this.userRepository = userRepository; // 設定使用者資料存取層實例，用於與資料庫互動
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
    private getRedisClient(): RedisClientType { // 私有方法：取得 Redis 客戶端實例
        try { // 嘗試建立 Redis 連線
            // 嘗試取得 Redis 客戶端實例
            return getRedisClient(); // 調用 Redis 配置模組取得客戶端連線
        } catch (error) { // 捕獲 Redis 連線錯誤
            // 記錄警告訊息，提示將回退到資料庫查詢
            logger.warn('Redis not available, falling back to database queries'); // 記錄 Redis 不可用的警告日誌
            // 拋出錯誤以讓上層處理
            throw new Error('Redis connection is not available'); // 拋出錯誤，讓呼叫方知道 Redis 連線失敗
        }
    }

    /**
     * 產生使用者快取鍵值
     * @param userId 使用者 ID
     */
    private getUserCacheKey(userId: number): string { // 私有方法：產生使用者快取鍵值
        return `${UserService.USER_CACHE_PREFIX}${userId}`; // 結合快取前綴和使用者 ID 產生唯一的快取鍵值
    }

    /**
     * 將模型轉換為 DTO（過濾敏感資訊）
     * @param model 使用者模型
     */
    private modelToDTO(model: UserModel): UserDTO { // 私有方法：將使用者模型轉換為資料傳輸物件（過濾敏感資訊）
        return { // 建立並回傳使用者 DTO 物件，不包含密碼雜湊等敏感資訊
            id: model.id, // 使用者 ID
            username: model.username, // 使用者名稱
            email: model.email || '', // 電子郵件地址，如果為 undefined 則使用空字串
            createdAt: model.createdAt, // 使用者帳號建立時間
            updatedAt: model.updatedAt // 使用者資料最後更新時間
        };
    }

    /**
     * 加密密碼
     * @param password 明文密碼
     */
    private async hashPassword(password: string): Promise<string> { // 私有異步方法：加密密碼
        return bcrypt.hash(password, UserService.BCRYPT_SALT_ROUNDS); // 使用 bcrypt 加密明文密碼，使用預設的鹽值輪數
    }

    /**
     * 驗證密碼
     * @param password 明文密碼
     * @param hash 密碼雜湊
     */
    public async verifyPassword(password: string, hash: string): Promise<boolean> { // 公開異步方法：驗證密碼
        return bcrypt.compare(password, hash); // 使用 bcrypt 比對明文密碼與雜湊密碼，回傳比對結果
    }

    /**
     * 從快取取得所有使用者
     */
    private async getCachedAllUsers(): Promise<UserDTO[] | null> { // 私有異步方法：從 Redis 快取取得所有使用者
        try { // 嘗試從 Redis 取得快取資料
            const redis = this.getRedisClient(); // 取得 Redis 客戶端實例
            logger.debug('Checking Redis cache for all users'); // 記錄檢查 Redis 快取的除錯日誌
            const cachedData = await redis.get(UserService.ALL_USERS_KEY); // 從 Redis 取得所有使用者的快取資料
            if (cachedData) { // 如果快取資料存在
                logger.info('Users loaded from Redis cache'); // 記錄從快取載入使用者的資訊日誌
                return JSON.parse(cachedData); // 解析 JSON 字串並回傳使用者陣列
            }
        } catch (error) { // 捕獲快取取得過程中的錯誤
            logger.warn('Failed to get cached users:', error); // 記錄快取取得失敗的警告日誌
        }
        return null; // 快取不存在或發生錯誤時回傳 null
    }

    /**
     * 快取所有使用者
     * @param users 使用者列表
     */
    private async cacheAllUsers(users: UserDTO[]): Promise<void> { // 私有異步方法：將所有使用者資料快取到 Redis
        try { // 嘗試執行快取操作
            const redis = this.getRedisClient(); // 取得 Redis 客戶端實例
            logger.debug('Caching all users in Redis'); // 記錄快取所有使用者的除錯日誌
            await redis.setEx( // 使用帶過期時間的設定方法
                UserService.ALL_USERS_KEY, // 所有使用者的快取鍵值
                UserService.DEFAULT_CACHE_TTL, // 快取過期時間（秒）
                JSON.stringify(users) // 將使用者陣列序列化為 JSON 字串
            );

            // 同時快取每個單獨的使用者
            for (const user of users) { // 遍歷所有使用者
                const key = this.getUserCacheKey(user.id); // 產生個別使用者的快取鍵值
                await redis.setEx(key, UserService.DEFAULT_CACHE_TTL, JSON.stringify(user)); // 快取單一使用者資料
            }
            logger.debug('Users cached successfully'); // 記錄快取成功的除錯日誌
        } catch (error) { // 捕獲快取過程中的錯誤
            logger.warn('Failed to cache users:', error); // 記錄快取失敗的警告日誌
        }
    }

    /**
     * 從快取取得單一使用者
     * @param userId 使用者 ID
     */
    private async getCachedUser(userId: number): Promise<UserDTO | null> { // 私有異步方法：從 Redis 快取取得單一使用者
        try { // 嘗試從 Redis 取得指定使用者的快取資料
            const redis = this.getRedisClient(); // 取得 Redis 客戶端實例
            logger.debug(`Checking Redis cache for user ID: ${userId}`); // 記錄檢查特定使用者快取的除錯日誌
            const key = this.getUserCacheKey(userId); // 產生使用者的快取鍵值
            const cachedData = await redis.get(key); // 從 Redis 取得使用者快取資料
            if (cachedData) { // 如果快取資料存在
                logger.info(`User ID: ${userId} loaded from Redis cache`); // 記錄從快取載入使用者的資訊日誌
                return JSON.parse(cachedData); // 解析 JSON 字串並回傳使用者物件
            }
        } catch (error) { // 捕獲快取取得過程中的錯誤
            logger.warn(`Failed to get cached user ${userId}:`, error); // 記錄特定使用者快取取得失敗的警告日誌
        }
        return null; // 快取不存在或發生錯誤時回傳 null
    }

    /**
     * 快取單一使用者
     * @param user 使用者資料
     */
    private async cacheUser(user: UserDTO): Promise<void> { // 私有異步方法：將單一使用者資料快取到 Redis
        try { // 嘗試執行使用者快取操作
            const redis = this.getRedisClient(); // 取得 Redis 客戶端實例
            logger.debug(`Caching user ID: ${user.id} in Redis`); // 記錄快取特定使用者的除錯日誌
            const key = this.getUserCacheKey(user.id); // 產生使用者的快取鍵值
            await redis.setEx(key, UserService.DEFAULT_CACHE_TTL, JSON.stringify(user)); // 設定帶過期時間的使用者快取
        } catch (error) { // 捕獲快取過程中的錯誤
            logger.warn(`Failed to cache user ${user.id}:`, error); // 記錄特定使用者快取失敗的警告日誌
        }
    }

    /**
     * 清除使用者管理快取
     * @param userId 使用者 ID（可選）
     */
    private async clearUserManagementCache(userId?: number): Promise<void> { // 私有異步方法：清除使用者管理相關的 Redis 快取
        try { // 嘗試執行快取清除操作
            const redis = this.getRedisClient(); // 取得 Redis 客戶端實例
            if (userId) { // 如果提供了使用者 ID
                // 清除單個使用者快取
                logger.debug(`Clearing Redis cache for user ID: ${userId}`); // 記錄清除特定使用者快取的除錯日誌
                const key = this.getUserCacheKey(userId); // 產生使用者的快取鍵值
                await redis.del(key); // 從 Redis 刪除指定使用者的快取
            }

            // 總是清除所有使用者列表快取
            await redis.del(UserService.ALL_USERS_KEY); // 刪除所有使用者列表的快取，確保下次取得最新資料
            logger.debug('User management caches cleared successfully'); // 記錄快取清除成功的除錯日誌
        } catch (error) { // 捕獲快取清除過程中的錯誤
            logger.warn('Failed to clear user management cache:', error); // 記錄快取清除失敗的警告日誌
        }
    }

    /**
     * 取得所有使用者列表
     */
    public async getAllUsers(): Promise<UserDTO[]> { // 公開異步方法：取得所有使用者列表
        try { // 嘗試執行使用者列表取得操作
            logger.debug('Getting all users with cache support'); // 記錄開始取得所有使用者的除錯日誌

            // 先嘗試從快取取得
            const cachedUsers = await this.getCachedAllUsers(); // 調用私有方法從 Redis 快取取得所有使用者
            if (cachedUsers) { // 如果快取中有資料
                return cachedUsers; // 直接回傳快取的使用者列表，提升效能
            }

            // 快取不存在，從資料庫取得
            logger.debug('Fetching users from database'); // 記錄從資料庫查詢使用者的除錯日誌
            const users = await this.userRepository.findAll(); // 調用資料存取層取得所有使用者模型
            const usersDTO = users.map(u => this.modelToDTO(u)); // 將所有使用者模型轉換為 DTO 物件

            logger.info(`Retrieved ${usersDTO.length} users from database`); // 記錄從資料庫取得使用者數量的資訊日誌

            // 更新快取
            await this.cacheAllUsers(usersDTO); // 調用私有方法將使用者列表快取到 Redis

            return usersDTO; // 回傳使用者 DTO 列表
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error('Error fetching all users:', error); // 記錄取得所有使用者失敗的錯誤日誌
            throw new Error('Failed to fetch users'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 根據 ID 取得使用者
     * @param userId 使用者 ID
     */
    public async getUserById(userId: number): Promise<UserDTO | null> { // 公開異步方法：根據 ID 取得使用者
        try { // 嘗試執行使用者取得操作
            logger.info(`Retrieving user by ID: ${userId}`); // 記錄開始根據 ID 取得使用者的資訊日誌

            // 驗證輸入
            if (!userId || userId <= 0) { // 檢查使用者 ID 是否有效（大於 0）
                logger.warn(`Invalid user ID: ${userId}`); // 記錄無效使用者 ID 的警告日誌
                return null; // 回傳 null 表示未找到使用者
            }

            // 先嘗試從快取取得
            const cachedUser = await this.getCachedUser(userId); // 調用私有方法從 Redis 快取取得使用者
            if (cachedUser) { // 如果快取中有資料
                return cachedUser; // 直接回傳快取的使用者資料，提升效能
            }

            // 快取不存在，從資料庫取得
            logger.debug(`Fetching user ID: ${userId} from database`); // 記錄從資料庫查詢使用者的除錯日誌
            const user = await this.userRepository.findById(userId); // 調用資料存取層根據 ID 取得使用者模型
            if (!user) { // 如果資料庫中不存在該使用者
                logger.warn(`User not found for ID: ${userId}`); // 記錄使用者不存在的警告日誌
                return null; // 回傳 null 表示未找到使用者
            }

            const userDTO = this.modelToDTO(user); // 將使用者模型轉換為 DTO 物件

            // 更新快取
            await this.cacheUser(userDTO); // 調用私有方法將使用者資料快取到 Redis

            logger.info(`User ID: ${userId} retrieved successfully`); // 記錄使用者取得成功的資訊日誌
            return userDTO; // 回傳使用者 DTO 物件
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error fetching user by ID ${userId}:`, error); // 記錄根據 ID 取得使用者失敗的錯誤日誌
            throw new Error('Failed to fetch user'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 建立新使用者
     * @param userData 使用者資料
     */
    public async createUser(userData: CreateUserRequest): Promise<UserDTO> { // 公開異步方法：建立新使用者
        try { // 嘗試執行使用者建立操作
            logger.info(`Creating new user: ${userData.username}`); // 記錄開始建立新使用者的資訊日誌

            // 驗證輸入
            if (!userData.username || userData.username.trim().length === 0) { // 檢查使用者名稱是否有效（非空且去除空格後長度大於 0）
                throw new Error('Username is required'); // 拋出錯誤，要求提供使用者名稱
            }
            if (!userData.email || userData.email.trim().length === 0) { // 檢查電子郵件是否有效（非空且去除空格後長度大於 0）
                throw new Error('Email is required'); // 拋出錯誤，要求提供電子郵件
            }
            if (!userData.password || userData.password.length < 6) { // 檢查密碼是否符合最低長度要求（至少 6 個字元）
                throw new Error('Password must be at least 6 characters long'); // 拋出錯誤，要求密碼至少 6 個字元
            }

            // 檢查使用者名稱是否已存在
            const existingUser = await this.userRepository.findByUsername(userData.username.trim()); // 調用資料存取層檢查使用者名稱是否已存在
            if (existingUser) { // 如果使用者名稱已存在
                throw new Error(`User with username '${userData.username}' already exists`); // 拋出錯誤，表示使用者名稱已存在
            }

            // 檢查電子郵件是否已存在
            const existingEmail = await this.userRepository.findByEmail(userData.email.trim()); // 調用資料存取層檢查電子郵件是否已存在
            if (existingEmail) { // 如果電子郵件已存在
                throw new Error(`User with email '${userData.email}' already exists`); // 拋出錯誤，表示電子郵件已存在
            }

            // 加密密碼
            const passwordHash = await this.hashPassword(userData.password); // 調用私有方法使用 bcrypt 加密明文密碼

            // 建立使用者
            const user = await this.userRepository.create({ // 調用資料存取層建立新使用者
                username: userData.username.trim(), // 使用者名稱（去除前後空格）
                email: userData.email.trim(), // 電子郵件（去除前後空格）
                passwordHash // 加密後的密碼雜湊
            });

            const userDTO = this.modelToDTO(user); // 將新建立的使用者模型轉換為 DTO 物件

            // 更新快取
            await this.cacheUser(userDTO); // 調用私有方法將新使用者快取到 Redis
            // 清除所有使用者列表快取，強制下次重新載入
            await this.clearUserManagementCache(); // 清除使用者列表快取，確保下次查詢會包含新使用者

            logger.info(`User created successfully: ${userData.username} (ID: ${userDTO.id})`); // 記錄使用者建立成功的資訊日誌
            return userDTO; // 回傳新建立的使用者 DTO 物件
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error('Error creating user:', error); // 記錄建立使用者失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to create user'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 更新使用者
     * @param userId 使用者 ID
     * @param updateData 更新資料
     */
    public async updateUser(userId: number, updateData: UpdateUserRequest): Promise<UserDTO | null> { // 公開異步方法：更新使用者
        try { // 嘗試執行使用者更新操作
            logger.info(`Updating user ID: ${userId}`); // 記錄開始更新使用者的資訊日誌

            // 驗證輸入
            if (!userId || userId <= 0) { // 檢查使用者 ID 是否有效（大於 0）
                throw new Error('Invalid user ID'); // 拋出錯誤，表示使用者 ID 無效
            }

            if (!updateData.username && !updateData.email && !updateData.password) { // 檢查至少提供一個更新欄位
                throw new Error('At least one field (username, email, or password) must be provided for update'); // 拋出錯誤，要求提供更新欄位
            }

            // 準備更新資料
            const updatePayload: any = {}; // 建立更新資料物件

            if (updateData.username !== undefined) { // 如果提供了新的使用者名稱
                updatePayload.username = updateData.username.trim(); // 去除前後空格並設定新名稱

                // 檢查新使用者名稱是否已被其他使用者使用
                if (updatePayload.username) { // 如果新名稱不為空
                    const existingUser = await this.userRepository.findByUsername(updatePayload.username); // 查找是否已有同名使用者
                    if (existingUser && existingUser.id !== userId) { // 如果存在同名使用者且不是當前更新的使用者
                        throw new Error(`User with username '${updatePayload.username}' already exists`); // 拋出錯誤，表示名稱已存在
                    }
                }
            }

            if (updateData.email !== undefined) { // 如果提供了新的電子郵件
                updatePayload.email = updateData.email.trim(); // 去除前後空格並設定新電子郵件

                // 檢查新電子郵件是否已被其他使用者使用
                if (updatePayload.email) { // 如果新電子郵件不為空
                    const existingUser = await this.userRepository.findByEmail(updatePayload.email); // 查找是否已有同一電子郵件的使用者
                    if (existingUser && existingUser.id !== userId) { // 如果存在同一電子郵件的使用者且不是當前更新的使用者
                        throw new Error(`User with email '${updatePayload.email}' already exists`); // 拋出錯誤，表示電子郵件已存在
                    }
                }
            }

            if (updateData.password !== undefined) { // 如果提供了新密碼
                if (updateData.password.length < 6) { // 檢查新密碼是否符合最低長度要求
                    throw new Error('Password must be at least 6 characters long'); // 拋出錯誤，要求密碼至少 6 個字元
                }
                updatePayload.passwordHash = await this.hashPassword(updateData.password); // 加密新密碼並設定到更新資料中
            }

            // 更新使用者
            const updatedUser = await this.userRepository.update(userId, updatePayload); // 調用資料存取層更新使用者
            if (!updatedUser) { // 如果更新失敗（使用者不存在）
                logger.warn(`User update failed - user not found for ID: ${userId}`); // 記錄使用者更新失敗的警告日誌
                return null; // 回傳 null 表示更新失敗
            }

            const userDTO = this.modelToDTO(updatedUser); // 將更新後的使用者模型轉換為 DTO 物件

            // 更新快取
            await this.cacheUser(userDTO); // 調用私有方法更新使用者快取
            // 清除所有使用者列表快取
            await this.clearUserManagementCache(); // 清除使用者列表快取，確保下次查詢會反映更新

            logger.info(`User updated successfully: ID ${userId}`); // 記錄使用者更新成功的資訊日誌
            return userDTO; // 回傳更新後的使用者 DTO 物件
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error updating user ${userId}:`, error); // 記錄更新使用者失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to update user'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 刪除使用者
     * @param userId 使用者 ID
     */
    public async deleteUser(userId: number): Promise<boolean> { // 公開異步方法：刪除使用者
        try { // 嘗試執行使用者刪除操作
            logger.info(`Deleting user ID: ${userId}`); // 記錄開始刪除使用者的資訊日誌

            // 驗證輸入
            if (!userId || userId <= 0) { // 檢查使用者 ID 是否有效（大於 0）
                throw new Error('Invalid user ID'); // 拋出錯誤，表示使用者 ID 無效
            }

            // 檢查使用者是否存在
            const existingUser = await this.userRepository.findById(userId); // 調用資料存取層查找使用者
            if (!existingUser) { // 如果使用者不存在
                logger.warn(`User deletion failed - user not found for ID: ${userId}`); // 記錄使用者不存在的警告日誌
                return false; // 回傳 false 表示刪除失敗
            }

            // 刪除使用者
            const deleted = await this.userRepository.delete(userId); // 調用資料存取層刪除使用者
            if (deleted) { // 如果刪除成功
                // 清除快取
                await this.clearUserManagementCache(userId); // 調用私有方法清除相關快取，包含單一使用者和列表快取
                logger.info(`User deleted successfully: ID ${userId}`); // 記錄使用者刪除成功的資訊日誌
            }

            return deleted; // 回傳刪除操作的結果（true 或 false）
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error deleting user ${userId}:`, error); // 記錄刪除使用者失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to delete user'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 根據使用者名稱查找使用者
     * @param username 使用者名稱
     */
    public async getUserByUsername(username: string): Promise<UserDTO | null> { // 公開異步方法：根據使用者名稱查找使用者
        try { // 嘗試執行根據使用者名稱查找使用者的操作
            logger.info(`Retrieving user by username: ${username}`); // 記錄開始根據使用者名稱取得使用者的資訊日誌

            // 驗證輸入
            if (!username || username.trim().length === 0) { // 檢查使用者名稱是否有效（非空且去除空格後長度大於 0）
                logger.warn('Invalid username'); // 記錄無效使用者名稱的警告日誌
                return null; // 回傳 null 表示未找到使用者
            }

            // 從資料庫查找
            const user = await this.userRepository.findByUsername(username.trim()); // 調用資料存取層根據使用者名稱查找使用者（去除前後空格）
            if (!user) { // 如果資料庫中不存在該使用者
                logger.warn(`User not found for username: ${username}`); // 記錄使用者不存在的警告日誌
                return null; // 回傳 null 表示未找到使用者
            }

            const userDTO = this.modelToDTO(user); // 將使用者模型轉換為 DTO 物件
            logger.info(`User found: ${username} (ID: ${userDTO.id})`); // 記錄找到使用者的資訊日誌
            return userDTO; // 回傳使用者 DTO 物件
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error fetching user by username ${username}:`, error); // 記錄根據使用者名稱取得使用者失敗的錯誤日誌
            throw new Error('Failed to fetch user'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 根據電子郵件查找使用者
     * @param email 電子郵件
     */
    public async getUserByEmail(email: string): Promise<UserDTO | null> { // 公開異步方法：根據電子郵件查找使用者
        try { // 嘗試執行根據電子郵件查找使用者的操作
            logger.info(`Retrieving user by email: ${email}`); // 記錄開始根據電子郵件取得使用者的資訊日誌

            // 驗證輸入
            if (!email || email.trim().length === 0) { // 檢查電子郵件是否有效（非空且去除空格後長度大於 0）
                logger.warn('Invalid email'); // 記錄無效電子郵件的警告日誌
                return null; // 回傳 null 表示未找到使用者
            }

            // 從資料庫查找
            const user = await this.userRepository.findByEmail(email.trim()); // 調用資料存取層根據電子郵件查找使用者（去除前後空格）
            if (!user) { // 如果資料庫中不存在該使用者
                logger.warn(`User not found for email: ${email}`); // 記錄使用者不存在的警告日誌
                return null; // 回傳 null 表示未找到使用者
            }

            const userDTO = this.modelToDTO(user); // 將使用者模型轉換為 DTO 物件
            logger.info(`User found: ${email} (ID: ${userDTO.id})`); // 記錄找到使用者的資訊日誌
            return userDTO; // 回傳使用者 DTO 物件
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error fetching user by email ${email}:`, error); // 記錄根據電子郵件取得使用者失敗的錯誤日誌
            throw new Error('Failed to fetch user'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 驗證使用者登入
     * @param username 使用者名稱
     * @param password 密碼
     */
    public async validateUserLogin(username: string, password: string): Promise<UserDTO | null> { // 公開異步方法：驗證使用者登入
        try { // 嘗試執行使用者登入驗證操作
            logger.info(`Validating login for user: ${username}`); // 記錄開始驗證使用者登入的資訊日誌

            // 驗證輸入
            if (!username || !password) { // 檢查使用者名稱和密碼是否都有提供
                logger.warn('Username and password are required'); // 記錄缺少使用者名稱或密碼的警告日誌
                return null; // 回傳 null 表示驗證失敗
            }

            // 查找使用者（包含密碼雜湊）
            const user = await this.userRepository.findByUsername(username.trim()); // 調用資料存取層查找使用者（需要密碼雜湊進行比對）
            if (!user) { // 如果找不到使用者
                logger.warn(`User not found for login: ${username}`); // 記錄登入時找不到使用者的警告日誌
                return null; // 回傳 null 表示驗證失敗
            }

            // 驗證密碼
            const isValidPassword = await this.verifyPassword(password, user.passwordHash); // 調用公開方法使用 bcrypt 比對明文密碼與雜湊密碼
            if (!isValidPassword) { // 如果密碼不匹配
                logger.warn(`Invalid password for user: ${username}`); // 記錄密碼驗證失敗的警告日誌
                return null; // 回傳 null 表示驗證失敗
            }

            const userDTO = this.modelToDTO(user); // 將使用者模型轉換為 DTO 物件（不包含密碼雜湊）
            logger.info(`User login validated successfully: ${username} (ID: ${userDTO.id})`); // 記錄使用者登入驗證成功的資訊日誌
            return userDTO; // 回傳驗證成功的使用者 DTO 物件
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error validating user login ${username}:`, error); // 記錄驗證使用者登入失敗的錯誤日誌
            throw new Error('Failed to validate user login'); // 拋出通用錯誤訊息
        }
    }
}