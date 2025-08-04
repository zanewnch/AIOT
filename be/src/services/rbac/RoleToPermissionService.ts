/**
 * @fileoverview 角色權限關聯服務層
 *
 * 提供角色與權限關聯管理相關的業務邏輯，整合 Redis 快取以提升效能。
 * 此服務負責處理角色權限的分配、撤銷、查詢等操作。
 *
 * 功能特點：
 * - 角色權限的完整管理操作
 * - Redis 快取機制，減少資料庫查詢
 * - 自動快取失效和更新
 * - 權限分配的安全驗證
 * - 支援批次權限操作
 *
 * 快取策略：
 * - 角色權限快取：role_permissions:{roleId}
 * - 權限角色快取：permission_roles:{permissionId}
 * - 預設快取時間：1 小時
 * - 支援強制重新整理快取
 *
 * 使用場景：
 * - RBAC 角色權限管理
 * - 角色權限分配
 * - 權限角色管理
 * - 角色權限查詢和驗證
 *
 * 效能考量：
 * - 優先使用 Redis 快取
 * - 資料庫查詢僅在快取失效時執行
 * - 支援批量操作減少網路開銷
 * - 自動處理 Redis 連線異常
 *
 * 安全性考量：
 * - 權限分配前驗證角色和權限存在性
 * - 防止重複分配和無效撤銷
 * - 記錄權限變更的操作日誌
 *
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-23
 */

// 匯入角色權限資料存取層，用於角色權限關聯管理操作
import { RolePermissionRepository } from '../../repo/rbac/RolePermissionRepo.js';
import type { IRolePermissionRepository } from '../../types/repositories/IRolePermissionRepository.js';
// 匯入角色資料存取層，用於角色驗證
import { RoleRepository } from '../../repo/rbac/RoleRepo.js';
import type { IRoleRepository } from '../../types/repositories/IRoleRepository.js';
// 匯入權限資料存取層，用於權限驗證
import { PermissionRepository } from '../../repo/rbac/PermissionRepo.js';
import type { IPermissionRepository } from '../../types/repositories/IPermissionRepository.js';
// 匯入模型類型
import { RoleModel } from '../../models/rbac/RoleModel.js';
import { PermissionModel } from '../../models/rbac/PermissionModel.js';
// 匯入 Redis 客戶端配置，用於快取管理
import { getRedisClient } from '../../configs/redisConfig.js';
// 匯入 Redis 客戶端類型定義
import type { RedisClientType } from 'redis';
// 匯入日誌記錄器
import { createLogger } from '../../configs/loggerConfig.js';

// 創建服務專用的日誌記錄器
const logger = createLogger('RoleToPermissionService');

/**
 * 角色權限資料傳輸物件
 */
export interface RolePermissionDTO {
    roleId: number;
    permissionId: number;
    assignedAt: Date;
    role?: {
        id: number;
        name: string;
        displayName?: string;
    };
    permission?: {
        id: number;
        name: string;
        description?: string;
    };
}

/**
 * 權限資料傳輸物件
 */
export interface PermissionDTO {
    id: number;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
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
 * 角色權限關聯服務類別
 */
export class RoleToPermissionService { // 角色權限關聯服務類別，提供完整的角色權限管理功能
    private rolePermissionRepository: IRolePermissionRepository; // 角色權限資料存取層實例，用於角色權限關聯的資料庫操作
    private roleRepository: IRoleRepository; // 角色資料存取層實例，用於角色相關的資料庫操作
    private permissionRepository: IPermissionRepository; // 權限資料存取層實例，用於權限相關的資料庫操作
    private static readonly ROLE_PERMISSIONS_CACHE_PREFIX = 'role_permissions:'; // Redis 中儲存角色權限關聯的鍵值前綴
    private static readonly PERMISSION_ROLES_CACHE_PREFIX = 'permission_roles:'; // Redis 中儲存權限角色關聯的鍵值前綴
    private static readonly DEFAULT_CACHE_TTL = 3600; // 預設快取過期時間，1 小時（3600 秒）

    /**
     * 建構函式
     * @param rolePermissionRepository 角色權限資料存取層
     * @param roleRepository 角色資料存取層
     * @param permissionRepository 權限資料存取層
     */
    constructor( // 建構函式，初始化角色權限關聯服務
        rolePermissionRepository: IRolePermissionRepository = new RolePermissionRepository(), // 角色權限資料存取層，預設建立新的實例
        roleRepository: IRoleRepository = new RoleRepository(), // 角色資料存取層，預設建立新的實例
        permissionRepository: IPermissionRepository = new PermissionRepository() // 權限資料存取層，預設建立新的實例
    ) {
        this.rolePermissionRepository = rolePermissionRepository; // 設定角色權限資料存取層實例，用於角色權限關聯操作
        this.roleRepository = roleRepository; // 設定角色資料存取層實例，用於角色驗證和查詢
        this.permissionRepository = permissionRepository; // 設定權限資料存取層實例，用於權限驗證和查詢
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
     * 產生角色權限快取鍵值
     * @param roleId 角色 ID
     */
    private getRolePermissionsCacheKey(roleId: number): string { // 私有方法：產生角色權限快取鍵值
        return `${RoleToPermissionService.ROLE_PERMISSIONS_CACHE_PREFIX}${roleId}`; // 結合角色權限快取前綴和角色 ID 產生唯一的快取鍵值
    }

    /**
     * 產生權限角色快取鍵值
     * @param permissionId 權限 ID
     */
    private getPermissionRolesCacheKey(permissionId: number): string { // 私有方法：產生權限角色快取鍵值
        return `${RoleToPermissionService.PERMISSION_ROLES_CACHE_PREFIX}${permissionId}`; // 結合權限角色快取前綴和權限 ID 產生唯一的快取鍵值
    }

    /**
     * 將權限模型轉換為 DTO
     * @param model 權限模型
     */
    private permissionModelToDTO(model: PermissionModel): PermissionDTO { // 私有方法：將權限模型轉換為資料傳輸物件
        return { // 建立並回傳權限 DTO 物件，不包含內部實作細節
            id: model.id, // 權限 ID
            name: model.name, // 權限名稱
            description: model.description, // 權限描述
            createdAt: model.createdAt, // 權限建立時間
            updatedAt: model.updatedAt // 權限最後更新時間
        };
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
     * 從快取取得角色權限
     * @param roleId 角色 ID
     */
    private async getCachedRolePermissions(roleId: number): Promise<PermissionDTO[] | null> { // 私有異步方法：從 Redis 快取取得角色權限
        try { // 嘗試從 Redis 取得快取資料
            const redis = this.getRedisClient(); // 取得 Redis 客戶端實例
            logger.debug(`Checking Redis cache for role permissions: ${roleId}`); // 記錄檢查角色權限快取的除錯日誌
            const key = this.getRolePermissionsCacheKey(roleId); // 產生角色權限的快取鍵值
            const cachedData = await redis.get(key); // 從 Redis 取得角色權限快取資料
            if (cachedData) { // 如果快取資料存在
                logger.info(`Role permissions for ID: ${roleId} loaded from Redis cache`); // 記錄從快取載入角色權限的資訊日誌
                return JSON.parse(cachedData); // 解析 JSON 字串並回傳權限陣列
            }
        } catch (error) { // 捕獲快取取得過程中的錯誤
            logger.warn(`Failed to get cached role permissions ${roleId}:`, error); // 記錄取得角色權限快取失敗的警告日誌
        }
        return null; // 快取不存在或發生錯誤時回傳 null
    }

    /**
     * 快取角色權限
     * @param roleId 角色 ID
     * @param permissions 權限列表
     */
    private async cacheRolePermissions(roleId: number, permissions: PermissionDTO[]): Promise<void> { // 私有異步方法：將角色權限資料快取到 Redis
        try { // 嘗試執行快取操作
            const redis = this.getRedisClient(); // 取得 Redis 客戶端實例
            logger.debug(`Caching role permissions for ID: ${roleId} in Redis`); // 記錄快取角色權限的除錯日誌
            const key = this.getRolePermissionsCacheKey(roleId); // 產生角色權限的快取鍵值
            await redis.setEx(key, RoleToPermissionService.DEFAULT_CACHE_TTL, JSON.stringify(permissions)); // 設定帶過期時間的角色權限快取
        } catch (error) { // 捕獲快取過程中的錯誤
            logger.warn(`Failed to cache role permissions ${roleId}:`, error); // 記錄角色權限快取失敗的警告日誌
        }
    }

    /**
     * 清除角色權限管理快取
     * @param roleId 角色 ID（可選）
     * @param permissionId 權限 ID（可選）
     */
    private async clearRolePermissionCache(roleId?: number, permissionId?: number): Promise<void> { // 私有異步方法：清除角色權限管理相關的 Redis 快取
        try { // 嘗試執行快取清除操作
            const redis = this.getRedisClient(); // 取得 Redis 客戶端實例
            if (roleId) { // 如果提供了角色 ID
                // 清除角色權限快取
                logger.debug(`Clearing Redis cache for role permissions: ${roleId}`); // 記錄清除角色權限快取的除錯日誌
                const roleKey = this.getRolePermissionsCacheKey(roleId); // 產生角色權限的快取鍵值
                await redis.del(roleKey); // 從 Redis 刪除角色權限快取
            }
            if (permissionId) { // 如果提供了權限 ID
                // 清除權限角色快取
                logger.debug(`Clearing Redis cache for permission roles: ${permissionId}`); // 記錄清除權限角色快取的除錯日誌
                const permissionKey = this.getPermissionRolesCacheKey(permissionId); // 產生權限角色的快取鍵值
                await redis.del(permissionKey); // 從 Redis 刪除權限角色快取
            }
            logger.debug('Role permission management caches cleared successfully'); // 記錄快取清除成功的除錯日誌
        } catch (error) { // 捕獲快取清除過程中的錯誤
            logger.warn('Failed to clear role permission management cache:', error); // 記錄快取清除失敗的警告日誌
        }
    }

    /**
     * 取得角色的所有權限
     * @param roleId 角色 ID
     */
    public async getRolePermissions(roleId: number): Promise<PermissionDTO[]> { // 公開異步方法：取得角色的所有權限
        try { // 嘗試執行角色權限取得操作
            logger.info(`Getting permissions for role ID: ${roleId}`); // 記錄開始取得角色權限的資訊日誌

            // 驗證輸入
            if (!roleId || roleId <= 0) { // 檢查角色 ID 是否有效（大於 0）
                logger.warn(`Invalid role ID: ${roleId}`); // 記錄無效角色 ID 的警告日誌
                throw new Error('Invalid role ID'); // 拋出錯誤，表示角色 ID 無效
            }

            // 先嘗試從快取取得
            const cachedPermissions = await this.getCachedRolePermissions(roleId); // 調用私有方法從 Redis 快取取得角色權限
            if (cachedPermissions) { // 如果快取中有資料
                return cachedPermissions; // 直接回傳快取的權限列表，提升效能
            }

            // 驗證角色是否存在
            const role = await this.roleRepository.findById(roleId); // 調用角色資料存取層檢查角色是否存在
            if (!role) { // 如果角色不存在
                logger.warn(`Role not found for ID: ${roleId}`); // 記錄角色不存在的警告日誌
                throw new Error('Role not found'); // 拋出錯誤，表示角色不存在
            }

            // 從資料庫取得角色權限
            logger.debug(`Fetching permissions for role ID: ${roleId} from database`); // 記錄從資料庫查詢角色權限的除錯日誌
            const permissions = await this.rolePermissionRepository.findPermissionsByRoleId(roleId); // 調用角色權限資料存取層取得角色的所有權限
            const permissionsDTO = permissions.map(p => this.permissionModelToDTO(p)); // 將所有權限模型轉換為 DTO 物件

            logger.info(`Retrieved ${permissionsDTO.length} permissions for role ID: ${roleId}`); // 記錄取得角色權限數量的資訊日誌

            // 更新快取
            await this.cacheRolePermissions(roleId, permissionsDTO); // 調用私有方法將角色權限快取到 Redis

            return permissionsDTO; // 回傳角色權限 DTO 列表
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error getting permissions for role ${roleId}:`, error); // 記錄取得角色權限失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to get role permissions'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 為角色分配權限
     * @param roleId 角色 ID
     * @param permissionIds 權限 ID 陣列
     */
    public async assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<void> { // 公開異步方法：為角色分配權限
        try { // 嘗試執行權限分配操作
            logger.info(`Assigning permissions ${permissionIds.join(', ')} to role ID: ${roleId}`); // 記錄開始為角色分配權限的資訊日誌

            // 驗證輸入
            if (!roleId || roleId <= 0) { // 檢查角色 ID 是否有效（大於 0）
                throw new Error('Invalid role ID'); // 拋出錯誤，表示角色 ID 無效
            }
            if (!permissionIds || permissionIds.length === 0) { // 檢查是否提供了至少一個權限 ID
                throw new Error('At least one permission ID must be provided'); // 拋出錯誤，要求提供至少一個權限 ID
            }

            // 驗證角色是否存在
            const role = await this.roleRepository.findById(roleId); // 調用角色資料存取層檢查角色是否存在
            if (!role) { // 如果角色不存在
                throw new Error('Role not found'); // 拋出錯誤，表示角色不存在
            }

            // 驗證所有權限是否存在
            for (const permissionId of permissionIds) { // 遍歷所有要分配的權限 ID
                if (!permissionId || permissionId <= 0) { // 檢查權限 ID 是否有效
                    throw new Error(`Invalid permission ID: ${permissionId}`); // 拋出錯誤，表示權限 ID 無效
                }
                const permission = await this.permissionRepository.findById(permissionId); // 調用權限資料存取層檢查權限是否存在
                if (!permission) { // 如果權限不存在
                    throw new Error(`Permission not found: ${permissionId}`); // 拋出錯誤，表示權限不存在
                }
            }

            // 分配權限
            const successfullyAssigned: number[] = []; // 初始化成功分配的權限 ID 陣列
            for (const permissionId of permissionIds) { // 遍歷所有要分配的權限 ID
                try { // 嘗試為當前權限分配給角色
                    const [, created] = await this.rolePermissionRepository.findOrCreate(roleId, permissionId); // 調用角色權限資料存取層的尋找或建立方法
                    if (created) { // 如果成功建立了新的角色權限關聯
                        successfullyAssigned.push(permissionId); // 將權限 ID 加入成功分配列表
                        logger.debug(`Permission ${permissionId} assigned to role ${roleId}`); // 記錄權限分配成功的除錯日誌
                    } else { // 如果角色權限關聯已經存在
                        logger.debug(`Permission ${permissionId} already assigned to role ${roleId}`); // 記錄權限已經分配的除錯日誌
                    }
                } catch (error) { // 捕獲單個權限分配過程中的錯誤
                    logger.warn(`Failed to assign permission ${permissionId} to role ${roleId}:`, error); // 記錄權限分配失敗的警告日誌
                }
            }

            // 清除相關快取
            await this.clearRolePermissionCache(roleId); // 清除角色權限快取
            for (const permissionId of successfullyAssigned) { // 遍歷所有成功分配的權限 ID
                await this.clearRolePermissionCache(undefined, permissionId); // 清除相關權限角色快取
            }

            logger.info(`Successfully assigned ${successfullyAssigned.length} permissions to role ID: ${roleId}`); // 記錄成功分配權限數量的資訊日誌
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error assigning permissions to role ${roleId}:`, error); // 記錄為角色分配權限失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to assign permissions to role'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 從角色撤銷權限
     * @param roleId 角色 ID
     * @param permissionId 權限 ID
     */
    public async removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean> { // 公開異步方法：從角色撤銷權限
        try { // 嘗試執行權限撤銷操作
            logger.info(`Removing permission ${permissionId} from role ID: ${roleId}`); // 記錄開始從角色撤銷權限的資訊日誌

            // 驗證輸入
            if (!roleId || roleId <= 0) { // 檢查角色 ID 是否有效（大於 0）
                throw new Error('Invalid role ID'); // 拋出錯誤，表示角色 ID 無效
            }
            if (!permissionId || permissionId <= 0) { // 檢查權限 ID 是否有效（大於 0）
                throw new Error('Invalid permission ID'); // 拋出錯誤，表示權限 ID 無效
            }

            // 驗證角色是否存在
            const role = await this.roleRepository.findById(roleId); // 調用角色資料存取層檢查角色是否存在
            if (!role) { // 如果角色不存在
                throw new Error('Role not found'); // 拋出錯誤，表示角色不存在
            }

            // 驗證權限是否存在
            const permission = await this.permissionRepository.findById(permissionId); // 調用權限資料存取層檢查權限是否存在
            if (!permission) { // 如果權限不存在
                throw new Error('Permission not found'); // 拋出錯誤，表示權限不存在
            }

            // 撤銷權限
            const removed = await this.rolePermissionRepository.delete(roleId, permissionId); // 調用角色權限資料存取層刪除角色權限關聯

            if (removed) { // 如枟成功撤銷了權限
                // 清除相關快取
                await this.clearRolePermissionCache(roleId, permissionId); // 清除角色權限和權限角色相關的快取
                logger.info(`Permission ${permissionId} removed from role ID: ${roleId}`); // 記錄權限撤銷成功的資訊日誌
            } else { // 如果權限本來就不屬於該角色
                logger.warn(`Permission ${permissionId} was not assigned to role ID: ${roleId}`); // 記錄權限未分配給角色的警告日誌
            }

            return removed; // 回傳撤銷操作的結果（true 或 false）
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error removing permission from role ${roleId}:`, error); // 記錄從角色撤銷權限失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to remove permission from role'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 檢查角色是否具有特定權限
     * @param roleId 角色 ID
     * @param permissionId 權限 ID
     */
    public async roleHasPermission(roleId: number, permissionId: number): Promise<boolean> { // 公開異步方法：檢查角色是否具有特定權限
        try { // 嘗試執行角色權限檢查操作
            logger.debug(`Checking if role ${roleId} has permission ${permissionId}`); // 記錄檢查角色權限的除錯日誌

            // 驗證輸入
            if (!roleId || roleId <= 0 || !permissionId || permissionId <= 0) { // 檢查角色 ID 和權限 ID 是否都有效（大於 0）
                return false; // 如果任一 ID 無效，直接回傳 false
            }

            // 查詢角色權限關聯
            const rolePermission = await this.rolePermissionRepository.findByRoleAndPermission(roleId, permissionId); // 調用角色權限資料存取層查詢角色權限關聯
            const hasPermission = !!rolePermission; // 將查詢結果轉換為布林值（存在為 true，不存在為 false）

            logger.debug(`Role ${roleId} ${hasPermission ? 'has' : 'does not have'} permission ${permissionId}`); // 記錄角色權限檢查結果的除錯日誌
            return hasPermission; // 回傳角色是否具有權限的布林值
        } catch (error) { // 捕獲檢查過程中的錯誤
            logger.error(`Error checking role permission ${roleId}-${permissionId}:`, error); // 記錄檢查角色權限失敗的錯誤日誌
            return false; // 出現錯誤時預設回傳 false
        }
    }

    /**
     * 取得權限的所有角色
     * @param permissionId 權限 ID
     */
    public async getPermissionRoles(permissionId: number): Promise<RoleDTO[]> { // 公開異步方法：取得權限的所有角色
        try { // 嘗試執行權限角色取得操作
            logger.info(`Getting roles for permission ID: ${permissionId}`); // 記錄開始取得權限角色的資訊日誌

            // 驗證輸入
            if (!permissionId || permissionId <= 0) { // 檢查權限 ID 是否有效（大於 0）
                logger.warn(`Invalid permission ID: ${permissionId}`); // 記錄無效權限 ID 的警告日誌
                throw new Error('Invalid permission ID'); // 拋出錯誤，表示權限 ID 無效
            }

            // 驗證權限是否存在
            const permission = await this.permissionRepository.findById(permissionId); // 調用權限資料存取層檢查權限是否存在
            if (!permission) { // 如果權限不存在
                logger.warn(`Permission not found for ID: ${permissionId}`); // 記錄權限不存在的警告日誌
                throw new Error('Permission not found'); // 拋出錯誤，表示權限不存在
            }

            // 從資料庫取得權限角色
            logger.debug(`Fetching roles for permission ID: ${permissionId} from database`); // 記錄從資料庫查詢權限角色的除錯日誌
            const roles = await this.rolePermissionRepository.findRolesByPermissionId(permissionId); // 調用角色權限資料存取層取得權限的所有角色
            const rolesDTO = roles.map(r => this.roleModelToDTO(r)); // 將所有角色模型轉換為 DTO 物件

            logger.info(`Retrieved ${rolesDTO.length} roles for permission ID: ${permissionId}`); // 記錄取得權限角色數量的資訊日誌
            return rolesDTO; // 回傳權限角色 DTO 列表
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error getting roles for permission ${permissionId}:`, error); // 記錄取得權限角色失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to get permission roles'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 批次撤銷角色的所有權限
     * @param roleId 角色 ID
     */
    public async removeAllPermissionsFromRole(roleId: number): Promise<number> { // 公開異步方法：批次撤銷角色的所有權限
        try { // 嘗試執行批次權限撤銷操作
            logger.info(`Removing all permissions from role ID: ${roleId}`); // 記錄開始撤銷角色所有權限的資訊日誌

            // 驗證輸入
            if (!roleId || roleId <= 0) { // 檢查角色 ID 是否有效（大於 0）
                throw new Error('Invalid role ID'); // 拋出錯誤，表示角色 ID 無效
            }

            // 驗證角色是否存在
            const role = await this.roleRepository.findById(roleId); // 調用角色資料存取層檢查角色是否存在
            if (!role) { // 如果角色不存在
                throw new Error('Role not found'); // 拋出錯誤，表示角色不存在
            }

            // 獲取角色目前的權限
            const currentPermissions = await this.getRolePermissions(roleId); // 調用公開方法取得角色當前擁有的所有權限
            const permissionIds = currentPermissions.map(p => p.id); // 提取所有權限的 ID 列表，用於後續快取清理

            // 撤銷所有權限
            const removedCount = await this.rolePermissionRepository.deleteByRoleId(roleId); // 調用角色權限資料存取層批次刪除角色的所有權限關聯

            if (removedCount > 0) { // 如果成功撤銷了至少一個權限
                // 清除相關快取
                await this.clearRolePermissionCache(roleId); // 清除角色權限快取
                for (const permissionId of permissionIds) { // 遍歷所有被撤銷的權限 ID
                    await this.clearRolePermissionCache(undefined, permissionId); // 清除相關權限角色快取
                }
            }

            logger.info(`Removed ${removedCount} permissions from role ID: ${roleId}`); // 記錄成功撤銷權限數量的資訊日誌
            return removedCount; // 回傳實際撤銷的權限數量
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error removing all permissions from role ${roleId}:`, error); // 記錄撤銷角色所有權限失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to remove all permissions from role'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 批次撤銷權限的所有角色
     * @param permissionId 權限 ID
     */
    public async removeAllRolesFromPermission(permissionId: number): Promise<number> { // 公開異步方法：批次撤銷權限的所有角色
        try { // 嘗試執行批次角色撤銷操作
            logger.info(`Removing all roles from permission ID: ${permissionId}`); // 記錄開始撤銷權限所有角色的資訊日誌

            // 驗證輸入
            if (!permissionId || permissionId <= 0) { // 檢查權限 ID 是否有效（大於 0）
                throw new Error('Invalid permission ID'); // 拋出錯誤，表示權限 ID 無效
            }

            // 驗證權限是否存在
            const permission = await this.permissionRepository.findById(permissionId); // 調用權限資料存取層檢查權限是否存在
            if (!permission) { // 如果權限不存在
                throw new Error('Permission not found'); // 拋出錯誤，表示權限不存在
            }

            // 獲取權限目前的角色
            const currentRoles = await this.getPermissionRoles(permissionId); // 調用公開方法取得權限當前關聯的所有角色
            const roleIds = currentRoles.map(r => r.id); // 提取所有角色的 ID 列表，用於後續快取清理

            // 撤銷所有角色
            const removedCount = await this.rolePermissionRepository.deleteByPermissionId(permissionId); // 調用角色權限資料存取層批次刪除權限的所有角色關聯

            if (removedCount > 0) { // 如果成功撤銷了至少一個角色
                // 清除相關快取
                await this.clearRolePermissionCache(undefined, permissionId); // 清除權限角色快取
                for (const roleId of roleIds) { // 遍歷所有被撤銷的角色 ID
                    await this.clearRolePermissionCache(roleId); // 清除相關角色權限快取
                }
            }

            logger.info(`Removed ${removedCount} roles from permission ID: ${permissionId}`); // 記錄成功撤銷角色數量的資訊日誌
            return removedCount; // 回傳實際撤銷的角色數量
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error(`Error removing all roles from permission ${permissionId}:`, error); // 記錄撤銷權限所有角色失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to remove all roles from permission'); // 拋出通用錯誤訊息
        }
    }

    /**
     * 取得所有角色權限關聯數據
     * 只回傳基本的關聯信息，避免 Sequelize 模型關聯錯誤
     */
    public async getAllRolePermissions(): Promise<Array<{ id: string, roleId: number, permissionId: number, assignedAt: string }>> { // 公開異步方法：取得所有角色權限關聯數據
        try { // 嘗試執行取得所有角色權限關聯操作
            logger.info('Getting all role-permission associations'); // 記錄開始取得所有角色權限關聯的資訊日誌

            // 從資料庫取得所有角色權限關聯，不包含關聯的角色和權限資訊以避免關聯錯誤
            const rolePermissions = await this.rolePermissionRepository.findAll(false); // 調用角色權限資料存取層取得基本關聯資料

            // 轉換為簡化的 DTO 格式
            const rolePermissionsDTO = rolePermissions.map((rp: any) => ({ // 將角色權限關聯轉換為簡化的 DTO 格式
                id: `${rp.roleId}-${rp.permissionId}`, // 組合 ID，避免使用可能不存在的資料庫 ID
                roleId: rp.roleId, // 角色 ID
                permissionId: rp.permissionId, // 權限 ID
                assignedAt: (rp.createdAt || new Date()).toISOString() // 分配時間轉為 ISO 字串格式
            }));

            logger.info(`Retrieved ${rolePermissionsDTO.length} role-permission associations`); // 記錄取得角色權限關聯數量的資訊日誌
            return rolePermissionsDTO; // 回傳簡化的角色權限關聯 DTO 列表
        } catch (error) { // 捕獲過程中的任何錯誤
            logger.error('Error getting all role permissions:', error); // 記錄取得所有角色權限關聯失敗的錯誤日誌
            if (error instanceof Error) { // 如果是 Error 類型的錯誤
                throw error; // 直接重新拋出，保持原始錯誤訊息
            }
            throw new Error('Failed to get all role permissions'); // 拋出通用錯誤訊息
        }
    }
}