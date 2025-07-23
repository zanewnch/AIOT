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
import { RolePermissionRepository, IRolePermissionRepository } from '../repo/RolePermissionRepo.js';
// 匯入角色資料存取層，用於角色驗證
import { RoleRepository, IRoleRepository } from '../repo/RoleRepo.js';
// 匯入權限資料存取層，用於權限驗證
import { PermissionRepository, IPermissionRepository } from '../repo/PermissionRepo.js';
// 匯入模型類型
import { RoleModel } from '../models/rbac/RoleModel.js';
import { PermissionModel } from '../models/rbac/PermissionModel.js';
// 匯入 Redis 客戶端配置，用於快取管理
import { getRedisClient } from '../configs/redisConfig.js';
// 匯入 Redis 客戶端類型定義
import type { RedisClientType } from 'redis';
// 匯入日誌記錄器
import { createLogger } from '../configs/loggerConfig.js';

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
export class RoleToPermissionService {
    private rolePermissionRepository: IRolePermissionRepository;
    private roleRepository: IRoleRepository;
    private permissionRepository: IPermissionRepository;
    private static readonly ROLE_PERMISSIONS_CACHE_PREFIX = 'role_permissions:';
    private static readonly PERMISSION_ROLES_CACHE_PREFIX = 'permission_roles:';
    private static readonly DEFAULT_CACHE_TTL = 3600; // 1 小時

    /**
     * 建構函式
     * @param rolePermissionRepository 角色權限資料存取層
     * @param roleRepository 角色資料存取層
     * @param permissionRepository 權限資料存取層
     */
    constructor(
        rolePermissionRepository: IRolePermissionRepository = new RolePermissionRepository(),
        roleRepository: IRoleRepository = new RoleRepository(),
        permissionRepository: IPermissionRepository = new PermissionRepository()
    ) {
        this.rolePermissionRepository = rolePermissionRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
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
     * 產生角色權限快取鍵值
     * @param roleId 角色 ID
     */
    private getRolePermissionsCacheKey(roleId: number): string {
        return `${RoleToPermissionService.ROLE_PERMISSIONS_CACHE_PREFIX}${roleId}`;
    }

    /**
     * 產生權限角色快取鍵值
     * @param permissionId 權限 ID
     */
    private getPermissionRolesCacheKey(permissionId: number): string {
        return `${RoleToPermissionService.PERMISSION_ROLES_CACHE_PREFIX}${permissionId}`;
    }

    /**
     * 將權限模型轉換為 DTO
     * @param model 權限模型
     */
    private permissionModelToDTO(model: PermissionModel): PermissionDTO {
        return {
            id: model.id,
            name: model.name,
            description: model.description,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt
        };
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
     * 從快取取得角色權限
     * @param roleId 角色 ID
     */
    private async getCachedRolePermissions(roleId: number): Promise<PermissionDTO[] | null> {
        try {
            const redis = this.getRedisClient();
            logger.debug(`Checking Redis cache for role permissions: ${roleId}`);
            const key = this.getRolePermissionsCacheKey(roleId);
            const cachedData = await redis.get(key);
            if (cachedData) {
                logger.info(`Role permissions for ID: ${roleId} loaded from Redis cache`);
                return JSON.parse(cachedData);
            }
        } catch (error) {
            logger.warn(`Failed to get cached role permissions ${roleId}:`, error);
        }
        return null;
    }

    /**
     * 快取角色權限
     * @param roleId 角色 ID
     * @param permissions 權限列表
     */
    private async cacheRolePermissions(roleId: number, permissions: PermissionDTO[]): Promise<void> {
        try {
            const redis = this.getRedisClient();
            logger.debug(`Caching role permissions for ID: ${roleId} in Redis`);
            const key = this.getRolePermissionsCacheKey(roleId);
            await redis.setEx(key, RoleToPermissionService.DEFAULT_CACHE_TTL, JSON.stringify(permissions));
        } catch (error) {
            logger.warn(`Failed to cache role permissions ${roleId}:`, error);
        }
    }

    /**
     * 清除角色權限管理快取
     * @param roleId 角色 ID（可選）
     * @param permissionId 權限 ID（可選）
     */
    private async clearRolePermissionCache(roleId?: number, permissionId?: number): Promise<void> {
        try {
            const redis = this.getRedisClient();
            if (roleId) {
                // 清除角色權限快取
                logger.debug(`Clearing Redis cache for role permissions: ${roleId}`);
                const roleKey = this.getRolePermissionsCacheKey(roleId);
                await redis.del(roleKey);
            }
            if (permissionId) {
                // 清除權限角色快取
                logger.debug(`Clearing Redis cache for permission roles: ${permissionId}`);
                const permissionKey = this.getPermissionRolesCacheKey(permissionId);
                await redis.del(permissionKey);
            }
            logger.debug('Role permission management caches cleared successfully');
        } catch (error) {
            logger.warn('Failed to clear role permission management cache:', error);
        }
    }

    /**
     * 取得角色的所有權限
     * @param roleId 角色 ID
     */
    public async getRolePermissions(roleId: number): Promise<PermissionDTO[]> {
        try {
            logger.info(`Getting permissions for role ID: ${roleId}`);

            // 驗證輸入
            if (!roleId || roleId <= 0) {
                logger.warn(`Invalid role ID: ${roleId}`);
                throw new Error('Invalid role ID');
            }

            // 先嘗試從快取取得
            const cachedPermissions = await this.getCachedRolePermissions(roleId);
            if (cachedPermissions) {
                return cachedPermissions;
            }

            // 驗證角色是否存在
            const role = await this.roleRepository.findById(roleId);
            if (!role) {
                logger.warn(`Role not found for ID: ${roleId}`);
                throw new Error('Role not found');
            }

            // 從資料庫取得角色權限
            logger.debug(`Fetching permissions for role ID: ${roleId} from database`);
            const permissions = await this.rolePermissionRepository.findPermissionsByRoleId(roleId);
            const permissionsDTO = permissions.map(p => this.permissionModelToDTO(p));

            logger.info(`Retrieved ${permissionsDTO.length} permissions for role ID: ${roleId}`);

            // 更新快取
            await this.cacheRolePermissions(roleId, permissionsDTO);

            return permissionsDTO;
        } catch (error) {
            logger.error(`Error getting permissions for role ${roleId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to get role permissions');
        }
    }

    /**
     * 為角色分配權限
     * @param roleId 角色 ID
     * @param permissionIds 權限 ID 陣列
     */
    public async assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<void> {
        try {
            logger.info(`Assigning permissions ${permissionIds.join(', ')} to role ID: ${roleId}`);

            // 驗證輸入
            if (!roleId || roleId <= 0) {
                throw new Error('Invalid role ID');
            }
            if (!permissionIds || permissionIds.length === 0) {
                throw new Error('At least one permission ID must be provided');
            }

            // 驗證角色是否存在
            const role = await this.roleRepository.findById(roleId);
            if (!role) {
                throw new Error('Role not found');
            }

            // 驗證所有權限是否存在
            for (const permissionId of permissionIds) {
                if (!permissionId || permissionId <= 0) {
                    throw new Error(`Invalid permission ID: ${permissionId}`);
                }
                const permission = await this.permissionRepository.findById(permissionId);
                if (!permission) {
                    throw new Error(`Permission not found: ${permissionId}`);
                }
            }

            // 分配權限
            const successfullyAssigned: number[] = [];
            for (const permissionId of permissionIds) {
                try {
                    const [, created] = await this.rolePermissionRepository.findOrCreate(roleId, permissionId);
                    if (created) {
                        successfullyAssigned.push(permissionId);
                        logger.debug(`Permission ${permissionId} assigned to role ${roleId}`);
                    } else {
                        logger.debug(`Permission ${permissionId} already assigned to role ${roleId}`);
                    }
                } catch (error) {
                    logger.warn(`Failed to assign permission ${permissionId} to role ${roleId}:`, error);
                }
            }

            // 清除相關快取
            await this.clearRolePermissionCache(roleId);
            for (const permissionId of successfullyAssigned) {
                await this.clearRolePermissionCache(undefined, permissionId);
            }

            logger.info(`Successfully assigned ${successfullyAssigned.length} permissions to role ID: ${roleId}`);
        } catch (error) {
            logger.error(`Error assigning permissions to role ${roleId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to assign permissions to role');
        }
    }

    /**
     * 從角色撤銷權限
     * @param roleId 角色 ID
     * @param permissionId 權限 ID
     */
    public async removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean> {
        try {
            logger.info(`Removing permission ${permissionId} from role ID: ${roleId}`);

            // 驗證輸入
            if (!roleId || roleId <= 0) {
                throw new Error('Invalid role ID');
            }
            if (!permissionId || permissionId <= 0) {
                throw new Error('Invalid permission ID');
            }

            // 驗證角色是否存在
            const role = await this.roleRepository.findById(roleId);
            if (!role) {
                throw new Error('Role not found');
            }

            // 驗證權限是否存在
            const permission = await this.permissionRepository.findById(permissionId);
            if (!permission) {
                throw new Error('Permission not found');
            }

            // 撤銷權限
            const removed = await this.rolePermissionRepository.delete(roleId, permissionId);

            if (removed) {
                // 清除相關快取
                await this.clearRolePermissionCache(roleId, permissionId);
                logger.info(`Permission ${permissionId} removed from role ID: ${roleId}`);
            } else {
                logger.warn(`Permission ${permissionId} was not assigned to role ID: ${roleId}`);
            }

            return removed;
        } catch (error) {
            logger.error(`Error removing permission from role ${roleId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to remove permission from role');
        }
    }

    /**
     * 檢查角色是否具有特定權限
     * @param roleId 角色 ID
     * @param permissionId 權限 ID
     */
    public async roleHasPermission(roleId: number, permissionId: number): Promise<boolean> {
        try {
            logger.debug(`Checking if role ${roleId} has permission ${permissionId}`);

            // 驗證輸入
            if (!roleId || roleId <= 0 || !permissionId || permissionId <= 0) {
                return false;
            }

            // 查詢角色權限關聯
            const rolePermission = await this.rolePermissionRepository.findByRoleAndPermission(roleId, permissionId);
            const hasPermission = !!rolePermission;

            logger.debug(`Role ${roleId} ${hasPermission ? 'has' : 'does not have'} permission ${permissionId}`);
            return hasPermission;
        } catch (error) {
            logger.error(`Error checking role permission ${roleId}-${permissionId}:`, error);
            return false;
        }
    }

    /**
     * 取得權限的所有角色
     * @param permissionId 權限 ID
     */
    public async getPermissionRoles(permissionId: number): Promise<RoleDTO[]> {
        try {
            logger.info(`Getting roles for permission ID: ${permissionId}`);

            // 驗證輸入
            if (!permissionId || permissionId <= 0) {
                logger.warn(`Invalid permission ID: ${permissionId}`);
                throw new Error('Invalid permission ID');
            }

            // 驗證權限是否存在
            const permission = await this.permissionRepository.findById(permissionId);
            if (!permission) {
                logger.warn(`Permission not found for ID: ${permissionId}`);
                throw new Error('Permission not found');
            }

            // 從資料庫取得權限角色
            logger.debug(`Fetching roles for permission ID: ${permissionId} from database`);
            const roles = await this.rolePermissionRepository.findRolesByPermissionId(permissionId);
            const rolesDTO = roles.map(r => this.roleModelToDTO(r));

            logger.info(`Retrieved ${rolesDTO.length} roles for permission ID: ${permissionId}`);
            return rolesDTO;
        } catch (error) {
            logger.error(`Error getting roles for permission ${permissionId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to get permission roles');
        }
    }

    /**
     * 批次撤銷角色的所有權限
     * @param roleId 角色 ID
     */
    public async removeAllPermissionsFromRole(roleId: number): Promise<number> {
        try {
            logger.info(`Removing all permissions from role ID: ${roleId}`);

            // 驗證輸入
            if (!roleId || roleId <= 0) {
                throw new Error('Invalid role ID');
            }

            // 驗證角色是否存在
            const role = await this.roleRepository.findById(roleId);
            if (!role) {
                throw new Error('Role not found');
            }

            // 獲取角色目前的權限
            const currentPermissions = await this.getRolePermissions(roleId);
            const permissionIds = currentPermissions.map(p => p.id);

            // 撤銷所有權限
            const removedCount = await this.rolePermissionRepository.deleteByRoleId(roleId);

            if (removedCount > 0) {
                // 清除相關快取
                await this.clearRolePermissionCache(roleId);
                for (const permissionId of permissionIds) {
                    await this.clearRolePermissionCache(undefined, permissionId);
                }
            }

            logger.info(`Removed ${removedCount} permissions from role ID: ${roleId}`);
            return removedCount;
        } catch (error) {
            logger.error(`Error removing all permissions from role ${roleId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to remove all permissions from role');
        }
    }

    /**
     * 批次撤銷權限的所有角色
     * @param permissionId 權限 ID
     */
    public async removeAllRolesFromPermission(permissionId: number): Promise<number> {
        try {
            logger.info(`Removing all roles from permission ID: ${permissionId}`);

            // 驗證輸入
            if (!permissionId || permissionId <= 0) {
                throw new Error('Invalid permission ID');
            }

            // 驗證權限是否存在
            const permission = await this.permissionRepository.findById(permissionId);
            if (!permission) {
                throw new Error('Permission not found');
            }

            // 獲取權限目前的角色
            const currentRoles = await this.getPermissionRoles(permissionId);
            const roleIds = currentRoles.map(r => r.id);

            // 撤銷所有角色
            const removedCount = await this.rolePermissionRepository.deleteByPermissionId(permissionId);

            if (removedCount > 0) {
                // 清除相關快取
                await this.clearRolePermissionCache(undefined, permissionId);
                for (const roleId of roleIds) {
                    await this.clearRolePermissionCache(roleId);
                }
            }

            logger.info(`Removed ${removedCount} roles from permission ID: ${permissionId}`);
            return removedCount;
        } catch (error) {
            logger.error(`Error removing all roles from permission ${permissionId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to remove all roles from permission');
        }
    }
}