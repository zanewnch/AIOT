/**
 * @fileoverview 角色服務層
 * 
 * 提供角色管理相關的業務邏輯，整合 Redis 快取以提升效能。
 * 此服務負責處理角色的 CRUD 操作、角色資料快取管理。
 * 
 * 功能特點：
 * - 角色的完整 CRUD 操作
 * - Redis 快取機制，減少資料庫查詢
 * - 自動快取失效和更新
 * - 角色權限關聯管理
 * 
 * 快取策略：
 * - 單個角色快取：role:{roleId}
 * - 所有角色快取：roles:all
 * - 預設快取時間：1 小時
 * - 支援強制重新整理快取
 * 
 * 使用場景：
 * - RBAC 角色管理
 * - 角色權限分配
 * - 角色資料維護
 * - 角色查詢和驗證
 * 
 * 效能考量：
 * - 優先使用 Redis 快取
 * - 資料庫查詢僅在快取失效時執行
 * - 支援批量操作減少網路開銷
 * - 自動處理 Redis 連線異常
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-23
 */

// 匯入角色資料存取層，用於角色管理操作
import { RoleRepository, IRoleRepository } from '../repo/RoleRepo.js';
// 匯入角色模型類型
import { RoleModel } from '../models/rbac/RoleModel.js';
// 匯入 Redis 客戶端配置，用於快取管理
import { getRedisClient } from '../configs/redisConfig.js';
// 匯入 Redis 客戶端類型定義
import type { RedisClientType } from 'redis';
// 匯入日誌記錄器
import { createLogger } from '../configs/loggerConfig.js';

// 創建服務專用的日誌記錄器
const logger = createLogger('RoleService');

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
 * 建立角色請求物件
 */
export interface CreateRoleRequest {
    name: string;
    displayName?: string;
}

/**
 * 更新角色請求物件
 */
export interface UpdateRoleRequest {
    name?: string;
    displayName?: string;
}

/**
 * 角色服務類別
 */
export class RoleService { // 角色服務類別，提供完整的角色管理功能
    private roleRepository: IRoleRepository; // 角色資料存取層實例，用於資料庫操作
    private static readonly ROLE_CACHE_PREFIX = 'role:'; // Redis 快取鍵值前綴，用於單一角色快取
    private static readonly ALL_ROLES_KEY = 'roles:all'; // Redis 快取鍵值，用於所有角色列表快取
    private static readonly DEFAULT_CACHE_TTL = 3600; // 預設快取過期時間，1 小時（3600 秒）

    /**
     * 建構函式
     * 初始化角色服務，設定資料存取層實例
     * @param roleRepository 角色資料存取層實例（可選，預設使用 RoleRepository）
     */
    constructor( // 建構函式，初始化角色服務
        roleRepository: IRoleRepository = new RoleRepository() // 角色資料存取層，預設建立新的 RoleRepository 實例
    ) {
        this.roleRepository = roleRepository; // 設定角色資料存取層實例，用於與資料庫互動
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
     * 產生角色快取鍵值
     * @param roleId 角色 ID
     */
    private getRoleCacheKey(roleId: number): string { // 私有方法：產生角色快取鍵值
        return `${RoleService.ROLE_CACHE_PREFIX}${roleId}`; // 結合快取前綴和角色 ID 產生唯一的快取鍵值
    }

    /**
     * 將模型轉換為 DTO
     * @param model 角色模型
     */
    private modelToDTO(model: RoleModel): RoleDTO { // 私有方法：將角色模型轉換為資料傳輸物件
        return { // 建立並回傳角色 DTO 物件
            id: model.id, // 角色 ID
            name: model.name, // 角色名稱
            displayName: model.displayName, // 角色顯示名稱
            createdAt: model.createdAt, // 角色建立時間
            updatedAt: model.updatedAt // 角色最後更新時間
        };
    }

    /**
     * 從快取取得所有角色
     */
    private async getCachedAllRoles(): Promise<RoleDTO[] | null> { // 私有異步方法：從 Redis 快取取得所有角色
        try { // 嘗試從 Redis 取得快取資料
            const redis = this.getRedisClient(); // 取得 Redis 客戶端實例
            logger.debug('Checking Redis cache for all roles'); // 記錄檢查 Redis 快取的除錯日誌
            const cachedData = await redis.get(RoleService.ALL_ROLES_KEY); // 從 Redis 取得所有角色的快取資料
            if (cachedData) { // 如果快取資料存在
                logger.info('Roles loaded from Redis cache'); // 記錄從快取載入角色的資訊日誌
                return JSON.parse(cachedData); // 解析 JSON 字串並回傳角色陣列
            }
        } catch (error) { // 捕獲快取取得過程中的錯誤
            logger.warn('Failed to get cached roles:', error); // 記錄快取取得失敗的警告日誌
        }
        return null; // 快取不存在或發生錯誤時回傳 null
    }

    /**
     * 快取所有角色
     * @param roles 角色列表
     */
    private async cacheAllRoles(roles: RoleDTO[]): Promise<void> { // 私有異步方法：將所有角色資料快取到 Redis
        try { // 嘗試執行快取操作
            const redis = this.getRedisClient(); // 取得 Redis 客戶端實例
            logger.debug('Caching all roles in Redis'); // 記錄快取所有角色的除錯日誌
            await redis.setEx( // 使用帶過期時間的設定方法
                RoleService.ALL_ROLES_KEY, // 所有角色的快取鍵值
                RoleService.DEFAULT_CACHE_TTL, // 快取過期時間（秒）
                JSON.stringify(roles) // 將角色陣列序列化為 JSON 字串
            );

            // 同時快取每個單獨的角色
            for (const role of roles) { // 遍歷所有角色
                const key = this.getRoleCacheKey(role.id); // 產生個別角色的快取鍵值
                await redis.setEx(key, RoleService.DEFAULT_CACHE_TTL, JSON.stringify(role)); // 快取單一角色資料
            }
            logger.debug('Roles cached successfully'); // 記錄快取成功的除錯日誌
        } catch (error) { // 捕獲快取過程中的錯誤
            logger.warn('Failed to cache roles:', error); // 記錄快取失敗的警告日誌
        }
    }

    /**
     * 從快取取得單一角色
     * @param roleId 角色 ID
     */
    private async getCachedRole(roleId: number): Promise<RoleDTO | null> { // 私有異步方法：從 Redis 快取取得單一角色
        try { // 嘗試從 Redis 取得指定角色的快取資料
            const redis = this.getRedisClient(); // 取得 Redis 客戶端實例
            logger.debug(`Checking Redis cache for role ID: ${roleId}`); // 記錄檢查特定角色快取的除錯日誌
            const key = this.getRoleCacheKey(roleId); // 產生角色的快取鍵值
            const cachedData = await redis.get(key); // 從 Redis 取得角色快取資料
            if (cachedData) { // 如果快取資料存在
                logger.info(`Role ID: ${roleId} loaded from Redis cache`); // 記錄從快取載入角色的資訊日誌
                return JSON.parse(cachedData); // 解析 JSON 字串並回傳角色物件
            }
        } catch (error) { // 捕獲快取取得過程中的錯誤
            logger.warn(`Failed to get cached role ${roleId}:`, error); // 記錄特定角色快取取得失敗的警告日誌
        }
        return null; // 快取不存在或發生錯誤時回傳 null
    }

    /**
     * 快取單一角色
     * @param role 角色資料
     */
    private async cacheRole(role: RoleDTO): Promise<void> { // 私有異步方法：將單一角色資料快取到 Redis
        try { // 嘗試執行角色快取操作
            const redis = this.getRedisClient(); // 取得 Redis 客戶端實例
            logger.debug(`Caching role ID: ${role.id} in Redis`); // 記錄快取特定角色的除錯日誌
            const key = this.getRoleCacheKey(role.id); // 產生角色的快取鍵值
            await redis.setEx(key, RoleService.DEFAULT_CACHE_TTL, JSON.stringify(role)); // 設定帶過期時間的角色快取
        } catch (error) { // 捕獲快取過程中的錯誤
            logger.warn(`Failed to cache role ${role.id}:`, error); // 記錄特定角色快取失敗的警告日誌
        }
    }

    /**
     * 清除角色管理快取
     * @param roleId 角色 ID（可選）
     */
    private async clearRoleManagementCache(roleId?: number): Promise<void> { // 私有異步方法：清除角色管理相關的 Redis 快取
        try { // 嘗試執行快取清除操作
            const redis = this.getRedisClient(); // 取得 Redis 客戶端實例
            if (roleId) { // 如果提供了角色 ID
                // 清除單個角色快取
                logger.debug(`Clearing Redis cache for role ID: ${roleId}`); // 記錄清除特定角色快取的除錯日誌
                const key = this.getRoleCacheKey(roleId); // 產生角色的快取鍵值
                await redis.del(key); // 從 Redis 刪除指定角色的快取
            }
            
            // 總是清除所有角色列表快取
            await redis.del(RoleService.ALL_ROLES_KEY); // 刪除所有角色列表的快取，確保下次取得最新資料
            logger.debug('Role management caches cleared successfully'); // 記錄快取清除成功的除錯日誌
        } catch (error) { // 捕獲快取清除過程中的錯誤
            logger.warn('Failed to clear role management cache:', error); // 記錄快取清除失敗的警告日誌
        }
    }

    /**
     * 取得所有角色列表
     */
    public async getAllRoles(): Promise<RoleDTO[]> { // 公開異步方法：取得所有角色列表
        try { // 嘗試執行角色列表取得操作
            logger.debug('Getting all roles with cache support'); // 記錄開始取得所有角色的除錯日誌

            // 先嘗試從快取取得
            const cachedRoles = await this.getCachedAllRoles(); // 調用私有方法從 Redis 快取取得所有角色
            if (cachedRoles) { // 如果快取中有資料
                return cachedRoles; // 直接回傳快取的角色列表，提升效能
            }

            // 快取不存在，從資料庫取得
            logger.debug('Fetching roles from database'); // 記錄從資料庫查詢角色的除錯日誌
            const roles = await this.roleRepository.findAll(); // 調用資料存取層取得所有角色模型
            const rolesDTO = roles.map(r => this.modelToDTO(r)); // 將所有角色模型轉換為 DTO 物件

            logger.info(`Retrieved ${rolesDTO.length} roles from database`); // 記錄從資料庫取得角色數量的資訊日誌

            // 更新快取
            await this.cacheAllRoles(rolesDTO); // 調用私有方法將角色列表快取到 Redis

            return rolesDTO; // 回傳角色 DTO 列表
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error('Error fetching all roles:', error); // 記錄取得所有角色失敗的錯誤日誌
            throw new Error('Failed to fetch roles'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 根據 ID 取得角色
     * @param roleId 角色 ID
     */
    public async getRoleById(roleId: number): Promise<RoleDTO | null> { // 公開異步方法：根據 ID 取得角色
        try { // 嘗試執行角色取得操作
            logger.info(`Retrieving role by ID: ${roleId}`); // 記錄開始根據 ID 取得角色的資訊日誌

            // 驗證輸入
            if (!roleId || roleId <= 0) { // 檢查角色 ID 是否有效（大於 0）
                logger.warn(`Invalid role ID: ${roleId}`); // 記錄無效角色 ID 的警告日誌
                return null; // 回傳 null 表示未找到角色
            }

            // 先嘗試從快取取得
            const cachedRole = await this.getCachedRole(roleId); // 調用私有方法從 Redis 快取取得角色
            if (cachedRole) { // 如果快取中有資料
                return cachedRole; // 直接回傳快取的角色資料，提升效能
            }

            // 快取不存在，從資料庫取得
            logger.debug(`Fetching role ID: ${roleId} from database`); // 記錄從資料庫查詢角色的除錯日誌
            const role = await this.roleRepository.findById(roleId); // 調用資料存取層根據 ID 取得角色模型
            if (!role) { // 如果資料庫中不存在該角色
                logger.warn(`Role not found for ID: ${roleId}`); // 記錄角色不存在的警告日誌
                return null; // 回傳 null 表示未找到角色
            }

            const roleDTO = this.modelToDTO(role); // 將角色模型轉換為 DTO 物件

            // 更新快取
            await this.cacheRole(roleDTO); // 調用私有方法將角色資料快取到 Redis

            logger.info(`Role ID: ${roleId} retrieved successfully`); // 記錄角色取得成功的資訊日誌
            return roleDTO; // 回傳角色 DTO 物件
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error fetching role by ID ${roleId}:`, error); // 記錄根據 ID 取得角色失敗的錯誤日誌
            throw new Error('Failed to fetch role'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 建立新角色
     * @param roleData 角色資料
     */
    public async createRole(roleData: CreateRoleRequest): Promise<RoleDTO> { // 公開異步方法：建立新角色
        try { // 嘗試執行角色建立操作
            logger.info(`Creating new role: ${roleData.name}`); // 記錄開始建立新角色的資訊日誌

            // 驗證輸入
            if (!roleData.name || roleData.name.trim().length === 0) { // 檢查角色名稱是否有效（非空且去除空格後長度大於 0）
                throw new Error('Role name is required'); // 拋出錯誤，要求提供角色名稱
            }

            // 檢查角色是否已存在
            const exists = await this.roleRepository.exists(roleData.name.trim()); // 調用資料存取層檢查角色名稱是否已存在
            if (exists) { // 如果角色已存在
                throw new Error(`Role with name '${roleData.name}' already exists`); // 拋出錯誤，表示角色名稱已存在
            }

            // 建立角色
            const role = await this.roleRepository.create({ // 調用資料存取層建立新角色
                name: roleData.name.trim(), // 角色名稱（去除前後空格）
                displayName: roleData.displayName?.trim() || roleData.name.trim() // 角色顯示名稱（如果未提供則使用角色名稱）
            });

            const roleDTO = this.modelToDTO(role); // 將新建立的角色模型轉換為 DTO 物件

            // 更新快取
            await this.cacheRole(roleDTO); // 調用私有方法將新角色快取到 Redis
            // 清除所有角色列表快取，強制下次重新載入
            await this.clearRoleManagementCache(); // 清除角色列表快取，確保下次查詢會包含新角色

            logger.info(`Role created successfully: ${roleData.name} (ID: ${roleDTO.id})`); // 記錄角色建立成功的資訊日誌
            return roleDTO; // 回傳新建立的角色 DTO 物件
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error('Error creating role:', error); // 記錄建立角色失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to create role'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 更新角色
     * @param roleId 角色 ID
     * @param updateData 更新資料
     */
    public async updateRole(roleId: number, updateData: UpdateRoleRequest): Promise<RoleDTO | null> { // 公開異步方法：更新角色
        try { // 嘗試執行角色更新操作
            logger.info(`Updating role ID: ${roleId}`); // 記錄開始更新角色的資訊日誌

            // 驗證輸入
            if (!roleId || roleId <= 0) { // 檢查角色 ID 是否有效（大於 0）
                throw new Error('Invalid role ID'); // 拋出錯誤，表示角色 ID 無效
            }

            if (!updateData.name && !updateData.displayName) { // 檢查至少提供一個更新欄位
                throw new Error('At least one field (name or displayName) must be provided for update'); // 拋出錯誤，要求提供更新欄位
            }

            // 準備更新資料
            const updatePayload: any = {}; // 建立更新資料物件
            if (updateData.name !== undefined) { // 如果提供了新的角色名稱
                updatePayload.name = updateData.name.trim(); // 去除前後空格並設定新名稱
                
                // 檢查新名稱是否已被其他角色使用
                if (updatePayload.name) { // 如果新名稱不為空
                    const existingRole = await this.roleRepository.findByName(updatePayload.name); // 查找是否已有同名角色
                    if (existingRole && existingRole.id !== roleId) { // 如果存在同名角色且不是當前更新的角色
                        throw new Error(`Role with name '${updatePayload.name}' already exists`); // 拋出錯誤，表示名稱已存在
                    }
                }
            }
            if (updateData.displayName !== undefined) { // 如果提供了新的顯示名稱
                updatePayload.displayName = updateData.displayName?.trim(); // 去除前後空格並設定新顯示名稱
            }

            // 更新角色
            const updatedRole = await this.roleRepository.update(roleId, updatePayload); // 調用資料存取層更新角色
            if (!updatedRole) { // 如果更新失敗（角色不存在）
                logger.warn(`Role update failed - role not found for ID: ${roleId}`); // 記錄角色更新失敗的警告日誌
                return null; // 回傳 null 表示更新失敗
            }

            const roleDTO = this.modelToDTO(updatedRole); // 將更新後的角色模型轉換為 DTO 物件

            // 更新快取
            await this.cacheRole(roleDTO); // 調用私有方法更新角色快取
            // 清除所有角色列表快取
            await this.clearRoleManagementCache(); // 清除角色列表快取，確保下次查詢會反映更新

            logger.info(`Role updated successfully: ID ${roleId}`); // 記錄角色更新成功的資訊日誌
            return roleDTO; // 回傳更新後的角色 DTO 物件
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error updating role ${roleId}:`, error); // 記錄更新角色失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to update role'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 刪除角色
     * @param roleId 角色 ID
     */
    public async deleteRole(roleId: number): Promise<boolean> { // 公開異步方法：刪除角色
        try { // 嘗試執行角色刪除操作
            logger.info(`Deleting role ID: ${roleId}`); // 記錄開始刪除角色的資訊日誌

            // 驗證輸入
            if (!roleId || roleId <= 0) { // 檢查角色 ID 是否有效（大於 0）
                throw new Error('Invalid role ID'); // 拋出錯誤，表示角色 ID 無效
            }

            // 檢查角色是否存在
            const existingRole = await this.roleRepository.findById(roleId); // 調用資料存取層查找角色
            if (!existingRole) { // 如果角色不存在
                logger.warn(`Role deletion failed - role not found for ID: ${roleId}`); // 記錄角色不存在的警告日誌
                return false; // 回傳 false 表示刪除失敗
            }

            // 刪除角色
            const deleted = await this.roleRepository.delete(roleId); // 調用資料存取層刪除角色
            if (deleted) { // 如果刪除成功
                // 清除快取
                await this.clearRoleManagementCache(roleId); // 調用私有方法清除相關快取，包含單一角色和列表快取
                logger.info(`Role deleted successfully: ID ${roleId}`); // 記錄角色刪除成功的資訊日誌
            }

            return deleted; // 回傳刪除操作的結果（true 或 false）
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error deleting role ${roleId}:`, error); // 記錄刪除角色失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to delete role'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 根據名稱查找角色
     * @param roleName 角色名稱
     */
    public async getRoleByName(roleName: string): Promise<RoleDTO | null> { // 公開異步方法：根據名稱查找角色
        try { // 嘗試執行根據名稱查找角色的操作
            logger.info(`Retrieving role by name: ${roleName}`); // 記錄開始根據名稱取得角色的資訊日誌

            // 驗證輸入
            if (!roleName || roleName.trim().length === 0) { // 檢查角色名稱是否有效（非空且去除空格後長度大於 0）
                logger.warn('Invalid role name'); // 記錄無效角色名稱的警告日誌
                return null; // 回傳 null 表示未找到角色
            }

            // 從資料庫查找
            const role = await this.roleRepository.findByName(roleName.trim()); // 調用資料存取層根據名稱查找角色（去除前後空格）
            if (!role) { // 如果資料庫中不存在該角色
                logger.warn(`Role not found for name: ${roleName}`); // 記錄角色不存在的警告日誌
                return null; // 回傳 null 表示未找到角色
            }

            const roleDTO = this.modelToDTO(role); // 將角色模型轉換為 DTO 物件
            logger.info(`Role found: ${roleName} (ID: ${roleDTO.id})`); // 記錄找到角色的資訊日誌
            return roleDTO; // 回傳角色 DTO 物件
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error fetching role by name ${roleName}:`, error); // 記錄根據名稱取得角色失敗的錯誤日誌
            throw new Error('Failed to fetch role'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 檢查角色是否存在
     * @param roleName 角色名稱
     */
    public async roleExists(roleName: string): Promise<boolean> { // 公開異步方法：檢查角色是否存在
        try { // 嘗試執行角色存在性檢查
            return await this.roleRepository.exists(roleName); // 調用資料存取層檢查角色名稱是否存在，回傳布林值
        } catch (error) { // 捕獲檢查過程中的錯誤
            logger.error('Failed to check role existence:', error); // 記錄檢查角色存在性失敗的錯誤日誌
            return false; // 出現錯誤時預設回傳 false，表示角色不存在
        }
    }
}