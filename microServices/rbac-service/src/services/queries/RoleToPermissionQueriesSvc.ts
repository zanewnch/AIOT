/**
 * @fileoverview 角色權限關聯查詢服務實現
 *
 * 此文件實作了角色權限關聯查詢業務邏輯層，
 * 專注於處理所有讀取和權限檢查相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * 功能特點：
 * - 角色權限查詢和驗證
 * - 權限角色查詢
 * - Redis 快取機制，減少資料庫查詢
 * - 角色權限檢查功能
 * - 批量查詢功能
 *
 * 快取策略：
 * - 角色權限快取：role_permissions:{roleId}
 * - 權限角色快取：permission_roles:{permissionId}
 * - 預設快取時間：1 小時
 * - 支援強制重新整理快取
 *
 * 使用場景：
 * - RBAC 角色權限查詢
 * - 權限驗證和檢查
 * - 角色權限關聯查詢
 *
 * @module RoleToPermissionQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
// 匯入角色權限查詢資料存取層
import { RolePermissionQueriesRepository } from '../../repo/queries/RolePermissionQueriesRepo.js';
// 匯入角色查詢資料存取層
import { RoleQueriesRepository } from '../../repo/queries/RoleQueriesRepo.js';
// 匯入權限查詢資料存取層
import { PermissionQueriesRepository } from '../../repo/queries/PermissionQueriesRepo.js';
// 匯入模型類型
import { RoleModel } from '../../models/RoleModel.js';
import { PermissionModel } from '../../models/PermissionModel.js';
// 匯入 Redis 客戶端配置，用於快取管理
import { getRedisClient } from '../../configs/redisConfig.js';
// 匯入 Redis 客戶端類型定義
import type { RedisClientType } from 'redis';
// 匯入日誌記錄器
import { createLogger } from '../../configs/loggerConfig.js';

// 創建服務專用的日誌記錄器
const logger = createLogger('RoleToPermissionQueriesSvc');

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
 * 角色權限關聯查詢服務介面
 * 定義所有查詢相關的方法
 */
export interface IRoleToPermissionQueriesService {
    getRolePermissions(roleId: number): Promise<PermissionDTO[]>;
    roleHasPermission(roleId: number, permissionId: number): Promise<boolean>;
    getPermissionRoles(permissionId: number): Promise<RoleDTO[]>;
    getAllRolePermissions(): Promise<Array<{ id: string, roleId: number, permissionId: number, assignedAt: string }>>;
}

/**
 * 角色權限關聯查詢服務實現類別
 *
 * 專門處理角色權限關聯相關的查詢請求，包含權限檢查、權限列表查詢等功能。
 * 遵循 CQRS 原則，所有方法都是唯讀操作。
 * 
 * @class RoleToPermissionQueriesSvc
 * @implements IRoleToPermissionQueriesService
 * @since 1.0.0
 */
@injectable()
export class RoleToPermissionQueriesSvc implements IRoleToPermissionQueriesService {
    private rolePermissionQueriesRepository: RolePermissionQueriesRepository; // 角色權限查詢資料存取層實例，用於角色權限關聯的資料庫查詢操作
    private roleQueriesRepository: RoleQueriesRepository; // 角色查詢資料存取層實例，用於角色相關的資料庫查詢操作
    private permissionQueriesRepository: PermissionQueriesRepository; // 權限查詢資料存取層實例，用於權限相關的資料庫查詢操作
    private static readonly ROLE_PERMISSIONS_CACHE_PREFIX = 'role_permissions:'; // Redis 中儲存角色權限關聯的鍵值前綴
    private static readonly PERMISSION_ROLES_CACHE_PREFIX = 'permission_roles:'; // Redis 中儲存權限角色關聯的鍵值前綴
    private static readonly DEFAULT_CACHE_TTL = 3600; // 預設快取過期時間，1 小時（3600 秒）

    /**
     * 建構函式
     * @param rolePermissionQueriesRepository 角色權限查詢資料存取層
     * @param roleQueriesRepository 角色查詢資料存取層
     * @param permissionQueriesRepository 權限查詢資料存取層
     */
    constructor( // 建構函式，初始化角色權限關聯查詢服務
        rolePermissionQueriesRepository: RolePermissionQueriesRepository = new RolePermissionQueriesRepository(), // 角色權限查詢資料存取層，預設建立新的實例
        roleQueriesRepository: RoleQueriesRepository = new RoleQueriesRepository(), // 角色查詢資料存取層，預設建立新的實例
        permissionQueriesRepository: PermissionQueriesRepository = new PermissionQueriesRepository() // 權限查詢資料存取層，預設建立新的實例
    ) {
        this.rolePermissionQueriesRepository = rolePermissionQueriesRepository; // 設定角色權限查詢資料存取層實例，用於角色權限關聯查詢操作
        this.roleQueriesRepository = roleQueriesRepository; // 設定角色查詢資料存取層實例，用於角色查詢和驗證
        this.permissionQueriesRepository = permissionQueriesRepository; // 設定權限查詢資料存取層實例，用於權限查詢和驗證
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
        return `${RoleToPermissionQueriesSvc.ROLE_PERMISSIONS_CACHE_PREFIX}${roleId}`; // 結合角色權限快取前綴和角色 ID 產生唯一的快取鍵值
    }

    /**
     * 產生權限角色快取鍵值
     * @param permissionId 權限 ID
     */
    private getPermissionRolesCacheKey(permissionId: number): string { // 私有方法：產生權限角色快取鍵值
        return `${RoleToPermissionQueriesSvc.PERMISSION_ROLES_CACHE_PREFIX}${permissionId}`; // 結合權限角色快取前綴和權限 ID 產生唯一的快取鍵值
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
    private getCachedRolePermissions = async (roleId: number): Promise<PermissionDTO[] | null> => { // 私有異步方法：從 Redis 快取取得角色權限
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
    private cacheRolePermissions = async (roleId: number, permissions: PermissionDTO[]): Promise<void> => { // 私有異步方法：將角色權限資料快取到 Redis
        try { // 嘗試執行快取操作
            const redis = this.getRedisClient(); // 取得 Redis 客戶端實例
            logger.debug(`Caching role permissions for ID: ${roleId} in Redis`); // 記錄快取角色權限的除錯日誌
            const key = this.getRolePermissionsCacheKey(roleId); // 產生角色權限的快取鍵值
            await redis.setEx(key, RoleToPermissionQueriesSvc.DEFAULT_CACHE_TTL, JSON.stringify(permissions)); // 設定帶過期時間的角色權限快取
        } catch (error) { // 捕獲快取過程中的錯誤
            logger.warn(`Failed to cache role permissions ${roleId}:`, error); // 記錄角色權限快取失敗的警告日誌
        }
    }

    /**
     * 取得角色的所有權限
     * @param roleId 角色 ID
     */
    public getRolePermissions = async (roleId: number): Promise<PermissionDTO[]> => { // 公開異步方法：取得角色的所有權限
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
            const role = await this.roleQueriesRepository.findById(roleId); // 調用角色查詢資料存取層檢查角色是否存在
            if (!role) { // 如果角色不存在
                logger.warn(`Role not found for ID: ${roleId}`); // 記錄角色不存在的警告日誌
                throw new Error('Role not found'); // 拋出錯誤，表示角色不存在
            }

            // 從資料庫取得角色權限關聯
            logger.debug(`Fetching permissions for role ID: ${roleId} from database`); // 記錄從資料庫查詢角色權限的除錯日誌
            const rolePermissions = await this.rolePermissionQueriesRepository.findAll(); // 調用角色權限查詢資料存取層取得所有角色權限關聯
            
            // 過濾出屬於該角色的權限關聯並獲取權限詳情
            const rolePermissionIds = rolePermissions
                .filter((rp: any) => rp.roleId === roleId)
                .map((rp: any) => rp.permissionId); // 提取屬於該角色的權限 ID
            
            // 並行獲取所有權限詳情
            const permissions = await Promise.all(
                rolePermissionIds.map(permissionId => this.permissionQueriesRepository.findById(permissionId))
            );
            
            // 過濾掉 null 值並轉換為 DTO
            const permissionsDTO = permissions
                .filter(p => p !== null)
                .map(p => this.permissionModelToDTO(p!)); // 將所有權限模型轉換為 DTO 物件

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
     * 檢查角色是否具有特定權限
     * @param roleId 角色 ID
     * @param permissionId 權限 ID
     */
    public roleHasPermission = async (roleId: number, permissionId: number): Promise<boolean> => { // 公開異步方法：檢查角色是否具有特定權限
        try { // 嘗試執行角色權限檢查操作
            logger.debug(`Checking if role ${roleId} has permission ${permissionId}`); // 記錄檢查角色權限的除錯日誌

            // 驗證輸入
            if (!roleId || roleId <= 0 || !permissionId || permissionId <= 0) { // 檢查角色 ID 和權限 ID 是否都有效（大於 0）
                return false; // 如果任一 ID 無效，直接回傳 false
            }

            // 查詢角色權限關聯
            const rolePermission = await this.rolePermissionQueriesRepository.findByRoleAndPermission(roleId, permissionId); // 調用角色權限查詢資料存取層查詢角色權限關聯
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
    public getPermissionRoles = async (permissionId: number): Promise<RoleDTO[]> => { // 公開異步方法：取得權限的所有角色
        try { // 嘗試執行權限角色取得操作
            logger.info(`Getting roles for permission ID: ${permissionId}`); // 記錄開始取得權限角色的資訊日誌

            // 驗證輸入
            if (!permissionId || permissionId <= 0) { // 檢查權限 ID 是否有效（大於 0）
                logger.warn(`Invalid permission ID: ${permissionId}`); // 記錄無效權限 ID 的警告日誌
                throw new Error('Invalid permission ID'); // 拋出錯誤，表示權限 ID 無效
            }

            // 驗證權限是否存在
            const permission = await this.permissionQueriesRepository.findById(permissionId); // 調用權限查詢資料存取層檢查權限是否存在
            if (!permission) { // 如果權限不存在
                logger.warn(`Permission not found for ID: ${permissionId}`); // 記錄權限不存在的警告日誌
                throw new Error('Permission not found'); // 拋出錯誤，表示權限不存在
            }

            // 從資料庫取得權限角色關聯
            logger.debug(`Fetching roles for permission ID: ${permissionId} from database`); // 記錄從資料庫查詢權限角色的除錯日誌
            const rolePermissions = await this.rolePermissionQueriesRepository.findAll(); // 調用角色權限查詢資料存取層取得所有角色權限關聯
            
            // 過濾出擁有該權限的角色關聯並獲取角色詳情
            const permissionRoleIds = rolePermissions
                .filter((rp: any) => rp.permissionId === permissionId)
                .map((rp: any) => rp.roleId); // 提取擁有該權限的角色 ID
            
            // 並行獲取所有角色詳情
            const roles = await Promise.all(
                permissionRoleIds.map(roleId => this.roleQueriesRepository.findById(roleId))
            );
            
            // 過濾掉 null 值並轉換為 DTO
            const rolesDTO = roles
                .filter(r => r !== null)
                .map(r => this.roleModelToDTO(r!)); // 將所有角色模型轉換為 DTO 物件

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
     * 取得所有角色權限關聯數據
     * 只回傳基本的關聯信息，避免 Sequelize 模型關聯錯誤
     */
    public getAllRolePermissions = async (): Promise<Array<{ id: string, roleId: number, permissionId: number, assignedAt: string }>> => { // 公開異步方法：取得所有角色權限關聯數據
        try { // 嘗試執行取得所有角色權限關聯操作
            logger.info('Getting all role-permission associations'); // 記錄開始取得所有角色權限關聯的資訊日誌

            // 從資料庫取得所有角色權限關聯，不包含關聯的角色和權限資訊以避免關聯錯誤
            const rolePermissions = await this.rolePermissionQueriesRepository.findAll(); // 調用角色權限查詢資料存取層取得基本關聯資料

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