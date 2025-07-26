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
import { RoleRepository } from '../repo/RoleRepo.js';
import { IRoleRepository } from '../types/repositories/IRoleRepository.js';
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
export class UserToRoleService { // 使用者角色關聯服務類別，提供完整的使用者角色管理功能
    private userRoleRepository: IUserRoleRepository; // 使用者角色資料存取層實例，用於使用者角色關聯的資料庫操作
    private userRepository: IUserRepository; // 使用者資料存取層實例，用於使用者相關的資料庫操作
    private roleRepository: IRoleRepository; // 角色資料存取層實例，用於角色相關的資料庫操作
    private static readonly USER_ROLES_CACHE_PREFIX = 'user_roles:'; // Redis 中儲存使用者角色關聯的鍵值前綴
    private static readonly ROLE_USERS_CACHE_PREFIX = 'role_users:'; // Redis 中儲存角色使用者關聯的鍵值前綴
    private static readonly DEFAULT_CACHE_TTL = 3600; // 預設快取過期時間，1 小時（3600 秒）

    /**
     * 建構函式
     * @param userRoleRepository 使用者角色資料存取層
     * @param userRepository 使用者資料存取層
     * @param roleRepository 角色資料存取層
     */
    constructor( // 建構函式，初始化使用者角色關聯服務
        userRoleRepository: IUserRoleRepository = new UserRoleRepository(), // 使用者角色資料存取層，預設建立新的實例
        userRepository: IUserRepository = new UserRepository(), // 使用者資料存取層，預設建立新的實例
        roleRepository: IRoleRepository = new RoleRepository() // 角色資料存取層，預設建立新的實例
    ) {
        this.userRoleRepository = userRoleRepository; // 設定使用者角色資料存取層實例，用於使用者角色關聯操作
        this.userRepository = userRepository; // 設定使用者資料存取層實例，用於使用者驗證和查詢
        this.roleRepository = roleRepository; // 設定角色資料存取層實例，用於角色驗證和查詢
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
     * 產生使用者角色快取鍵值
     * @param userId 使用者 ID
     */
    private getUserRolesCacheKey(userId: number): string { // 私有方法：產生使用者角色快取鍵值
        return `${UserToRoleService.USER_ROLES_CACHE_PREFIX}${userId}`; // 結合使用者角色快取前綴和使用者 ID 產生唯一的快取鍵值
    }

    /**
     * 產生角色使用者快取鍵值
     * @param roleId 角色 ID
     */
    private getRoleUsersCacheKey(roleId: number): string { // 私有方法：產生角色使用者快取鍵值
        return `${UserToRoleService.ROLE_USERS_CACHE_PREFIX}${roleId}`; // 結合角色使用者快取前綴和角色 ID 產生唯一的快取鍵值
    }

    /**
     * 將角色模型轉換為 DTO
     * @param model 角色模型
     */
    private roleModelToDTO(model: RoleModel): RoleDTO { // 私有方法：將角色模型轉換為資料傳輸物件
        return { // 建立並回傳角色 DTO 物件，不包含內部實作細節
            id: model.id, // 角色 ID
            name: model.name, // 角色名稱
            displayName: model.displayName, // 角色顯示名稱
            createdAt: model.createdAt, // 角色建立時間
            updatedAt: model.updatedAt // 角色最後更新時間
        };
    }

    /**
     * 將使用者模型轉換為 DTO
     * @param model 使用者模型
     */
    private userModelToDTO(model: UserModel): UserDTO { // 私有方法：將使用者模型轉換為資料傳輸物件
        return { // 建立並回傳使用者 DTO 物件，不包含密碼雜湊等敏感資訊
            id: model.id, // 使用者 ID
            username: model.username, // 使用者名稱
            email: model.email || '', // 電子郵件地址，如果為 undefined 則使用空字串
            createdAt: model.createdAt, // 使用者帳號建立時間
            updatedAt: model.updatedAt // 使用者資料最後更新時間
        };
    }

    /**
     * 從快取取得使用者角色
     * @param userId 使用者 ID
     */
    private async getCachedUserRoles(userId: number): Promise<RoleDTO[] | null> { // 私有異步方法：從 Redis 快取取得使用者角色
        try { // 嘗試從 Redis 取得快取資料
            const redis = this.getRedisClient(); // 取得 Redis 客戶端實例
            logger.debug(`Checking Redis cache for user roles: ${userId}`); // 記錄檢查使用者角色快取的除錯日誌
            const key = this.getUserRolesCacheKey(userId); // 產生使用者角色的快取鍵值
            const cachedData = await redis.get(key); // 從 Redis 取得使用者角色快取資料
            if (cachedData) { // 如果快取資料存在
                logger.info(`User roles for ID: ${userId} loaded from Redis cache`); // 記錄從快取載入使用者角色的資訊日誌
                return JSON.parse(cachedData); // 解析 JSON 字串並回傳角色陣列
            }
        } catch (error) { // 捕獲快取取得過程中的錯誤
            logger.warn(`Failed to get cached user roles ${userId}:`, error); // 記錄取得使用者角色快取失敗的警告日誌
        }
        return null; // 快取不存在或發生錯誤時回傳 null
    }

    /**
     * 快取使用者角色
     * @param userId 使用者 ID
     * @param roles 角色列表
     */
    private async cacheUserRoles(userId: number, roles: RoleDTO[]): Promise<void> { // 私有異步方法：將使用者角色資料快取到 Redis
        try { // 嘗試執行快取操作
            const redis = this.getRedisClient(); // 取得 Redis 客戶端實例
            logger.debug(`Caching user roles for ID: ${userId} in Redis`); // 記錄快取使用者角色的除錯日誌
            const key = this.getUserRolesCacheKey(userId); // 產生使用者角色的快取鍵值
            await redis.setEx(key, UserToRoleService.DEFAULT_CACHE_TTL, JSON.stringify(roles)); // 設定帶過期時間的使用者角色快取
        } catch (error) { // 捕獲快取過程中的錯誤
            logger.warn(`Failed to cache user roles ${userId}:`, error); // 記錄使用者角色快取失敗的警告日誌
        }
    }

    /**
     * 清除使用者角色管理快取
     * @param userId 使用者 ID（可選）
     * @param roleId 角色 ID（可選）
     */
    private async clearUserRoleCache(userId?: number, roleId?: number): Promise<void> { // 私有異步方法：清除使用者角色管理相關的 Redis 快取
        try { // 嘗試執行快取清除操作
            const redis = this.getRedisClient(); // 取得 Redis 客戶端實例
            if (userId) { // 如果提供了使用者 ID
                // 清除使用者角色快取
                logger.debug(`Clearing Redis cache for user roles: ${userId}`); // 記錄清除使用者角色快取的除錯日誌
                const userKey = this.getUserRolesCacheKey(userId); // 產生使用者角色的快取鍵值
                await redis.del(userKey); // 從 Redis 刪除使用者角色快取
            }
            if (roleId) { // 如果提供了角色 ID
                // 清除角色使用者快取
                logger.debug(`Clearing Redis cache for role users: ${roleId}`); // 記錄清除角色使用者快取的除錯日誌
                const roleKey = this.getRoleUsersCacheKey(roleId); // 產生角色使用者的快取鍵值
                await redis.del(roleKey); // 從 Redis 刪除角色使用者快取
            }
            logger.debug('User role management caches cleared successfully'); // 記錄快取清除成功的除錯日誌
        } catch (error) { // 捕獲快取清除過程中的錯誤
            logger.warn('Failed to clear user role management cache:', error); // 記錄快取清除失敗的警告日誌
        }
    }

    /**
     * 取得使用者的所有角色
     * @param userId 使用者 ID
     */
    public async getUserRoles(userId: number): Promise<RoleDTO[]> { // 公開異步方法：取得使用者的所有角色
        try { // 嘗試執行使用者角色取得操作
            logger.info(`Getting roles for user ID: ${userId}`); // 記錄開始取得使用者角色的資訊日誌

            // 驗證輸入
            if (!userId || userId <= 0) { // 檢查使用者 ID 是否有效（大於 0）
                logger.warn(`Invalid user ID: ${userId}`); // 記錄無效使用者 ID 的警告日誌
                throw new Error('Invalid user ID'); // 拋出錯誤，表示使用者 ID 無效
            }

            // 先嘗試從快取取得
            const cachedRoles = await this.getCachedUserRoles(userId); // 調用私有方法從 Redis 快取取得使用者角色
            if (cachedRoles) { // 如果快取中有資料
                return cachedRoles; // 直接回傳快取的角色列表，提升效能
            }

            // 驗證使用者是否存在
            const user = await this.userRepository.findById(userId); // 調用使用者資料存取層檢查使用者是否存在
            if (!user) { // 如果使用者不存在
                logger.warn(`User not found for ID: ${userId}`); // 記錄使用者不存在的警告日誌
                throw new Error('User not found'); // 拋出錯誤，表示使用者不存在
            }

            // 從資料庫取得使用者角色
            logger.debug(`Fetching roles for user ID: ${userId} from database`); // 記錄從資料庫查詢使用者角色的除錯日誌
            const roles = await this.userRoleRepository.findRolesByUserId(userId); // 調用使用者角色資料存取層取得使用者的所有角色
            const rolesDTO = roles.map(r => this.roleModelToDTO(r)); // 將所有角色模型轉換為 DTO 物件

            logger.info(`Retrieved ${rolesDTO.length} roles for user ID: ${userId}`); // 記錄取得使用者角色數量的資訊日誌

            // 更新快取
            await this.cacheUserRoles(userId, rolesDTO); // 調用私有方法將使用者角色快取到 Redis

            return rolesDTO; // 回傳使用者角色 DTO 列表
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error getting roles for user ${userId}:`, error); // 記錄取得使用者角色失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to get user roles'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 為使用者分配角色
     * @param userId 使用者 ID
     * @param roleIds 角色 ID 陣列
     */
    public async assignRolesToUser(userId: number, roleIds: number[]): Promise<void> { // 公開異步方法：為使用者分配角色
        try { // 嘗試執行角色分配操作
            logger.info(`Assigning roles ${roleIds.join(', ')} to user ID: ${userId}`); // 記錄開始為使用者分配角色的資訊日誌

            // 驗證輸入
            if (!userId || userId <= 0) { // 檢查使用者 ID 是否有效（大於 0）
                throw new Error('Invalid user ID'); // 拋出錯誤，表示使用者 ID 無效
            }
            if (!roleIds || roleIds.length === 0) { // 檢查是否提供了至少一個角色 ID
                throw new Error('At least one role ID must be provided'); // 拋出錯誤，要求提供至少一個角色 ID
            }

            // 驗證使用者是否存在
            const user = await this.userRepository.findById(userId); // 調用使用者資料存取層檢查使用者是否存在
            if (!user) { // 如果使用者不存在
                throw new Error('User not found'); // 拋出錯誤，表示使用者不存在
            }

            // 驗證所有角色是否存在
            for (const roleId of roleIds) { // 遍歷所有要分配的角色 ID
                if (!roleId || roleId <= 0) { // 檢查角色 ID 是否有效
                    throw new Error(`Invalid role ID: ${roleId}`); // 拋出錯誤，表示角色 ID 無效
                }
                const role = await this.roleRepository.findById(roleId); // 調用角色資料存取層檢查角色是否存在
                if (!role) { // 如果角色不存在
                    throw new Error(`Role not found: ${roleId}`); // 拋出錯誤，表示角色不存在
                }
            }

            // 分配角色
            const successfullyAssigned: number[] = []; // 初始化成功分配的角色 ID 陣列
            for (const roleId of roleIds) { // 遍歷所有要分配的角色 ID
                try { // 嘗試為當前角色分配給使用者
                    const [, created] = await this.userRoleRepository.findOrCreate(userId, roleId); // 調用使用者角色資料存取層的尋找或建立方法
                    if (created) { // 如果成功建立了新的使用者角色關聯
                        successfullyAssigned.push(roleId); // 將角色 ID 加入成功分配列表
                        logger.debug(`Role ${roleId} assigned to user ${userId}`); // 記錄角色分配成功的除錯日誌
                    } else { // 如果使用者角色關聯已經存在
                        logger.debug(`Role ${roleId} already assigned to user ${userId}`); // 記錄角色已經分配的除錯日誌
                    }
                } catch (error) { // 捕獲單個角色分配過程中的錯誤
                    logger.warn(`Failed to assign role ${roleId} to user ${userId}:`, error); // 記錄角色分配失敗的警告日誌
                }
            }

            // 清除相關快取
            await this.clearUserRoleCache(userId); // 清除使用者角色快取
            for (const roleId of successfullyAssigned) { // 遍歷所有成功分配的角色 ID
                await this.clearUserRoleCache(undefined, roleId); // 清除相關角色使用者快取
            }

            logger.info(`Successfully assigned ${successfullyAssigned.length} roles to user ID: ${userId}`); // 記錄成功分配角色數量的資訊日誌
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error assigning roles to user ${userId}:`, error); // 記錄為使用者分配角色失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to assign roles to user'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 從使用者撤銷角色
     * @param userId 使用者 ID
     * @param roleId 角色 ID
     */
    public async removeRoleFromUser(userId: number, roleId: number): Promise<boolean> { // 公開異步方法：從使用者撤銷角色
        try { // 嘗試執行角色撤銷操作
            logger.info(`Removing role ${roleId} from user ID: ${userId}`); // 記錄開始從使用者撤銷角色的資訊日誌

            // 驗證輸入
            if (!userId || userId <= 0) { // 檢查使用者 ID 是否有效（大於 0）
                throw new Error('Invalid user ID'); // 拋出錯誤，表示使用者 ID 無效
            }
            if (!roleId || roleId <= 0) { // 檢查角色 ID 是否有效（大於 0）
                throw new Error('Invalid role ID'); // 拋出錯誤，表示角色 ID 無效
            }

            // 驗證使用者是否存在
            const user = await this.userRepository.findById(userId); // 調用使用者資料存取層檢查使用者是否存在
            if (!user) { // 如果使用者不存在
                throw new Error('User not found'); // 拋出錯誤，表示使用者不存在
            }

            // 驗證角色是否存在
            const role = await this.roleRepository.findById(roleId); // 調用角色資料存取層檢查角色是否存在
            if (!role) { // 如果角色不存在
                throw new Error('Role not found'); // 拋出錯誤，表示角色不存在
            }

            // 撤銷角色
            const removed = await this.userRoleRepository.delete(userId, roleId); // 調用使用者角色資料存取層刪除使用者角色關聯

            if (removed) { // 如果成功撤銷了角色
                // 清除相關快取
                await this.clearUserRoleCache(userId, roleId); // 清除使用者角色和角色使用者相關的快取
                logger.info(`Role ${roleId} removed from user ID: ${userId}`); // 記錄角色撤銷成功的資訊日誌
            } else { // 如果角色本來就不屬於該使用者
                logger.warn(`Role ${roleId} was not assigned to user ID: ${userId}`); // 記錄角色未分配給使用者的警告日誌
            }

            return removed; // 回傳撤銷操作的結果（true 或 false）
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error removing role from user ${userId}:`, error); // 記錄從使用者撤銷角色失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to remove role from user'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 檢查使用者是否具有特定角色
     * @param userId 使用者 ID
     * @param roleId 角色 ID
     */
    public async userHasRole(userId: number, roleId: number): Promise<boolean> { // 公開異步方法：檢查使用者是否具有特定角色
        try { // 嘗試執行使用者角色檢查操作
            logger.debug(`Checking if user ${userId} has role ${roleId}`); // 記錄檢查使用者角色的除錯日誌

            // 驗證輸入
            if (!userId || userId <= 0 || !roleId || roleId <= 0) { // 檢查使用者 ID 和角色 ID 是否都有效（大於 0）
                return false; // 如果任一 ID 無效，直接回傳 false
            }

            // 查詢使用者角色關聯
            const userRole = await this.userRoleRepository.findByUserAndRole(userId, roleId); // 調用使用者角色資料存取層查詢使用者角色關聯
            const hasRole = !!userRole; // 將查詢結果轉換為布林值（存在為 true，不存在為 false）

            logger.debug(`User ${userId} ${hasRole ? 'has' : 'does not have'} role ${roleId}`); // 記錄使用者角色檢查結果的除錯日誌
            return hasRole; // 回傳使用者是否具有角色的布林值
        } catch (error) { // 捕獲檢查過程中的錯誤
            logger.error(`Error checking user role ${userId}-${roleId}:`, error); // 記錄檢查使用者角色失敗的錯誤日誌
            return false; // 出現錯誤時預設回傳 false
        }
    }

    /**
     * 取得角色的所有使用者
     * @param roleId 角色 ID
     */
    public async getRoleUsers(roleId: number): Promise<UserDTO[]> { // 公開異步方法：取得角色的所有使用者
        try { // 嘗試執行角色使用者取得操作
            logger.info(`Getting users for role ID: ${roleId}`); // 記錄開始取得角色使用者的資訊日誌

            // 驗證輸入
            if (!roleId || roleId <= 0) { // 檢查角色 ID 是否有效（大於 0）
                logger.warn(`Invalid role ID: ${roleId}`); // 記錄無效角色 ID 的警告日誌
                throw new Error('Invalid role ID'); // 拋出錯誤，表示角色 ID 無效
            }

            // 驗證角色是否存在
            const role = await this.roleRepository.findById(roleId); // 調用角色資料存取層檢查角色是否存在
            if (!role) { // 如果角色不存在
                logger.warn(`Role not found for ID: ${roleId}`); // 記錄角色不存在的警告日誌
                throw new Error('Role not found'); // 拋出錯誤，表示角色不存在
            }

            // 從資料庫取得角色使用者
            logger.debug(`Fetching users for role ID: ${roleId} from database`); // 記錄從資料庫查詢角色使用者的除錯日誌
            const users = await this.userRoleRepository.findUsersByRoleId(roleId); // 調用使用者角色資料存取層取得角色的所有使用者
            const usersDTO = users.map(u => this.userModelToDTO(u)); // 將所有使用者模型轉換為 DTO 物件

            logger.info(`Retrieved ${usersDTO.length} users for role ID: ${roleId}`); // 記錄取得角色使用者數量的資訊日誌
            return usersDTO; // 回傳角色使用者 DTO 列表
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error getting users for role ${roleId}:`, error); // 記錄取得角色使用者失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to get role users'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 批次撤銷使用者的所有角色
     * @param userId 使用者 ID
     */
    public async removeAllRolesFromUser(userId: number): Promise<number> { // 公開異步方法：批次撤銷使用者的所有角色
        try { // 嘗試執行批次角色撤銷操作
            logger.info(`Removing all roles from user ID: ${userId}`); // 記錄開始撤銷使用者所有角色的資訊日誌

            // 驗證輸入
            if (!userId || userId <= 0) { // 檢查使用者 ID 是否有效（大於 0）
                throw new Error('Invalid user ID'); // 拋出錯誤，表示使用者 ID 無效
            }

            // 驗證使用者是否存在
            const user = await this.userRepository.findById(userId); // 調用使用者資料存取層檢查使用者是否存在
            if (!user) { // 如果使用者不存在
                throw new Error('User not found'); // 拋出錯誤，表示使用者不存在
            }

            // 獲取使用者目前的角色
            const currentRoles = await this.getUserRoles(userId); // 調用公開方法取得使用者當前擁有的所有角色
            const roleIds = currentRoles.map(r => r.id); // 提取所有角色的 ID 列表，用於後續快取清理

            // 撤銷所有角色
            const removedCount = await this.userRoleRepository.deleteByUserId(userId); // 調用使用者角色資料存取層批次刪除使用者的所有角色關聯

            if (removedCount > 0) { // 如果成功撤銷了至少一個角色
                // 清除相關快取
                await this.clearUserRoleCache(userId); // 清除使用者角色快取
                for (const roleId of roleIds) { // 遍歷所有被撤銷的角色 ID
                    await this.clearUserRoleCache(undefined, roleId); // 清除相關角色使用者快取
                }
            }

            logger.info(`Removed ${removedCount} roles from user ID: ${userId}`); // 記錄成功撤銷角色數量的資訊日誌
            return removedCount; // 回傳實際撤銷的角色數量
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error removing all roles from user ${userId}:`, error); // 記錄撤銷使用者所有角色失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to remove all roles from user'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 批次撤銷角色的所有使用者
     * @param roleId 角色 ID
     */
    public async removeAllUsersFromRole(roleId: number): Promise<number> { // 公開異步方法：批次撤銷角色的所有使用者
        try { // 嘗試執行批次使用者撤銷操作
            logger.info(`Removing all users from role ID: ${roleId}`); // 記錄開始撤銷角色所有使用者的資訊日誌

            // 驗證輸入
            if (!roleId || roleId <= 0) { // 檢查角色 ID 是否有效（大於 0）
                throw new Error('Invalid role ID'); // 拋出錯誤，表示角色 ID 無效
            }

            // 驗證角色是否存在
            const role = await this.roleRepository.findById(roleId); // 調用角色資料存取層檢查角色是否存在
            if (!role) { // 如果角色不存在
                throw new Error('Role not found'); // 拋出錯誤，表示角色不存在
            }

            // 獲取角色目前的使用者
            const currentUsers = await this.getRoleUsers(roleId); // 調用公開方法取得角色當前關聯的所有使用者
            const userIds = currentUsers.map(u => u.id); // 提取所有使用者的 ID 列表，用於後續快取清理

            // 撤銷所有使用者
            const removedCount = await this.userRoleRepository.deleteByRoleId(roleId); // 調用使用者角色資料存取層批次刪除角色的所有使用者關聯

            if (removedCount > 0) { // 如果成功撤銷了至少一個使用者
                // 清除相關快取
                await this.clearUserRoleCache(undefined, roleId); // 清除角色使用者快取
                for (const userId of userIds) { // 遍歷所有被撤銷的使用者 ID
                    await this.clearUserRoleCache(userId); // 清除相關使用者角色快取
                }
            }

            logger.info(`Removed ${removedCount} users from role ID: ${roleId}`); // 記錄成功撤銷使用者數量的資訊日誌
            return removedCount; // 回傳實際撤銷的使用者數量
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error removing all users from role ${roleId}:`, error); // 記錄撤銷角色所有使用者失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to remove all users from role'); // 拋出通用錯誤訊息
        }
    }
}