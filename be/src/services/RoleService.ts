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
export class RoleService {
    private roleRepository: IRoleRepository;
    private static readonly ROLE_CACHE_PREFIX = 'role:';
    private static readonly ALL_ROLES_KEY = 'roles:all';
    private static readonly DEFAULT_CACHE_TTL = 3600; // 1 小時

    /**
     * 建構函式
     * @param roleRepository 角色資料存取層
     */
    constructor(
        roleRepository: IRoleRepository = new RoleRepository()
    ) {
        this.roleRepository = roleRepository;
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
     * 產生角色快取鍵值
     * @param roleId 角色 ID
     */
    private getRoleCacheKey(roleId: number): string {
        return `${RoleService.ROLE_CACHE_PREFIX}${roleId}`;
    }

    /**
     * 將模型轉換為 DTO
     * @param model 角色模型
     */
    private modelToDTO(model: RoleModel): RoleDTO {
        return {
            id: model.id,
            name: model.name,
            displayName: model.displayName,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt
        };
    }

    /**
     * 從快取取得所有角色
     */
    private async getCachedAllRoles(): Promise<RoleDTO[] | null> {
        try {
            const redis = this.getRedisClient();
            logger.debug('Checking Redis cache for all roles');
            const cachedData = await redis.get(RoleService.ALL_ROLES_KEY);
            if (cachedData) {
                logger.info('Roles loaded from Redis cache');
                return JSON.parse(cachedData);
            }
        } catch (error) {
            logger.warn('Failed to get cached roles:', error);
        }
        return null;
    }

    /**
     * 快取所有角色
     * @param roles 角色列表
     */
    private async cacheAllRoles(roles: RoleDTO[]): Promise<void> {
        try {
            const redis = this.getRedisClient();
            logger.debug('Caching all roles in Redis');
            await redis.setEx(
                RoleService.ALL_ROLES_KEY,
                RoleService.DEFAULT_CACHE_TTL,
                JSON.stringify(roles)
            );

            // 同時快取每個單獨的角色
            for (const role of roles) {
                const key = this.getRoleCacheKey(role.id);
                await redis.setEx(key, RoleService.DEFAULT_CACHE_TTL, JSON.stringify(role));
            }
            logger.debug('Roles cached successfully');
        } catch (error) {
            logger.warn('Failed to cache roles:', error);
        }
    }

    /**
     * 從快取取得單一角色
     * @param roleId 角色 ID
     */
    private async getCachedRole(roleId: number): Promise<RoleDTO | null> {
        try {
            const redis = this.getRedisClient();
            logger.debug(`Checking Redis cache for role ID: ${roleId}`);
            const key = this.getRoleCacheKey(roleId);
            const cachedData = await redis.get(key);
            if (cachedData) {
                logger.info(`Role ID: ${roleId} loaded from Redis cache`);
                return JSON.parse(cachedData);
            }
        } catch (error) {
            logger.warn(`Failed to get cached role ${roleId}:`, error);
        }
        return null;
    }

    /**
     * 快取單一角色
     * @param role 角色資料
     */
    private async cacheRole(role: RoleDTO): Promise<void> {
        try {
            const redis = this.getRedisClient();
            logger.debug(`Caching role ID: ${role.id} in Redis`);
            const key = this.getRoleCacheKey(role.id);
            await redis.setEx(key, RoleService.DEFAULT_CACHE_TTL, JSON.stringify(role));
        } catch (error) {
            logger.warn(`Failed to cache role ${role.id}:`, error);
        }
    }

    /**
     * 清除角色管理快取
     * @param roleId 角色 ID（可選）
     */
    private async clearRoleManagementCache(roleId?: number): Promise<void> {
        try {
            const redis = this.getRedisClient();
            if (roleId) {
                // 清除單個角色快取
                logger.debug(`Clearing Redis cache for role ID: ${roleId}`);
                const key = this.getRoleCacheKey(roleId);
                await redis.del(key);
            }
            
            // 總是清除所有角色列表快取
            await redis.del(RoleService.ALL_ROLES_KEY);
            logger.debug('Role management caches cleared successfully');
        } catch (error) {
            logger.warn('Failed to clear role management cache:', error);
        }
    }

    /**
     * 取得所有角色列表
     */
    public async getAllRoles(): Promise<RoleDTO[]> {
        try {
            logger.debug('Getting all roles with cache support');

            // 先嘗試從快取取得
            const cachedRoles = await this.getCachedAllRoles();
            if (cachedRoles) {
                return cachedRoles;
            }

            // 快取不存在，從資料庫取得
            logger.debug('Fetching roles from database');
            const roles = await this.roleRepository.findAll();
            const rolesDTO = roles.map(r => this.modelToDTO(r));

            logger.info(`Retrieved ${rolesDTO.length} roles from database`);

            // 更新快取
            await this.cacheAllRoles(rolesDTO);

            return rolesDTO;
        } catch (error) {
            logger.error('Error fetching all roles:', error);
            throw new Error('Failed to fetch roles');
        }
    }

    /**
     * 根據 ID 取得角色
     * @param roleId 角色 ID
     */
    public async getRoleById(roleId: number): Promise<RoleDTO | null> {
        try {
            logger.info(`Retrieving role by ID: ${roleId}`);

            // 驗證輸入
            if (!roleId || roleId <= 0) {
                logger.warn(`Invalid role ID: ${roleId}`);
                return null;
            }

            // 先嘗試從快取取得
            const cachedRole = await this.getCachedRole(roleId);
            if (cachedRole) {
                return cachedRole;
            }

            // 快取不存在，從資料庫取得
            logger.debug(`Fetching role ID: ${roleId} from database`);
            const role = await this.roleRepository.findById(roleId);
            if (!role) {
                logger.warn(`Role not found for ID: ${roleId}`);
                return null;
            }

            const roleDTO = this.modelToDTO(role);

            // 更新快取
            await this.cacheRole(roleDTO);

            logger.info(`Role ID: ${roleId} retrieved successfully`);
            return roleDTO;
        } catch (error) {
            logger.error(`Error fetching role by ID ${roleId}:`, error);
            throw new Error('Failed to fetch role');
        }
    }

    /**
     * 建立新角色
     * @param roleData 角色資料
     */
    public async createRole(roleData: CreateRoleRequest): Promise<RoleDTO> {
        try {
            logger.info(`Creating new role: ${roleData.name}`);

            // 驗證輸入
            if (!roleData.name || roleData.name.trim().length === 0) {
                throw new Error('Role name is required');
            }

            // 檢查角色是否已存在
            const exists = await this.roleRepository.exists(roleData.name.trim());
            if (exists) {
                throw new Error(`Role with name '${roleData.name}' already exists`);
            }

            // 建立角色
            const role = await this.roleRepository.create({
                name: roleData.name.trim(),
                displayName: roleData.displayName?.trim()
            });

            const roleDTO = this.modelToDTO(role);

            // 更新快取
            await this.cacheRole(roleDTO);
            // 清除所有角色列表快取，強制下次重新載入
            await this.clearRoleManagementCache();

            logger.info(`Role created successfully: ${roleData.name} (ID: ${roleDTO.id})`);
            return roleDTO;
        } catch (error) {
            logger.error('Error creating role:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to create role');
        }
    }

    /**
     * 更新角色
     * @param roleId 角色 ID
     * @param updateData 更新資料
     */
    public async updateRole(roleId: number, updateData: UpdateRoleRequest): Promise<RoleDTO | null> {
        try {
            logger.info(`Updating role ID: ${roleId}`);

            // 驗證輸入
            if (!roleId || roleId <= 0) {
                throw new Error('Invalid role ID');
            }

            if (!updateData.name && !updateData.displayName) {
                throw new Error('At least one field (name or displayName) must be provided for update');
            }

            // 準備更新資料
            const updatePayload: any = {};
            if (updateData.name !== undefined) {
                updatePayload.name = updateData.name.trim();
                
                // 檢查新名稱是否已被其他角色使用
                if (updatePayload.name) {
                    const existingRole = await this.roleRepository.findByName(updatePayload.name);
                    if (existingRole && existingRole.id !== roleId) {
                        throw new Error(`Role with name '${updatePayload.name}' already exists`);
                    }
                }
            }
            if (updateData.displayName !== undefined) {
                updatePayload.displayName = updateData.displayName?.trim();
            }

            // 更新角色
            const updatedRole = await this.roleRepository.update(roleId, updatePayload);
            if (!updatedRole) {
                logger.warn(`Role update failed - role not found for ID: ${roleId}`);
                return null;
            }

            const roleDTO = this.modelToDTO(updatedRole);

            // 更新快取
            await this.cacheRole(roleDTO);
            // 清除所有角色列表快取
            await this.clearRoleManagementCache();

            logger.info(`Role updated successfully: ID ${roleId}`);
            return roleDTO;
        } catch (error) {
            logger.error(`Error updating role ${roleId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to update role');
        }
    }

    /**
     * 刪除角色
     * @param roleId 角色 ID
     */
    public async deleteRole(roleId: number): Promise<boolean> {
        try {
            logger.info(`Deleting role ID: ${roleId}`);

            // 驗證輸入
            if (!roleId || roleId <= 0) {
                throw new Error('Invalid role ID');
            }

            // 檢查角色是否存在
            const existingRole = await this.roleRepository.findById(roleId);
            if (!existingRole) {
                logger.warn(`Role deletion failed - role not found for ID: ${roleId}`);
                return false;
            }

            // 刪除角色
            const deleted = await this.roleRepository.delete(roleId);
            if (deleted) {
                // 清除快取
                await this.clearRoleManagementCache(roleId);
                logger.info(`Role deleted successfully: ID ${roleId}`);
            }

            return deleted;
        } catch (error) {
            logger.error(`Error deleting role ${roleId}:`, error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to delete role');
        }
    }

    /**
     * 根據名稱查找角色
     * @param roleName 角色名稱
     */
    public async getRoleByName(roleName: string): Promise<RoleDTO | null> {
        try {
            logger.info(`Retrieving role by name: ${roleName}`);

            // 驗證輸入
            if (!roleName || roleName.trim().length === 0) {
                logger.warn('Invalid role name');
                return null;
            }

            // 從資料庫查找
            const role = await this.roleRepository.findByName(roleName.trim());
            if (!role) {
                logger.warn(`Role not found for name: ${roleName}`);
                return null;
            }

            const roleDTO = this.modelToDTO(role);
            logger.info(`Role found: ${roleName} (ID: ${roleDTO.id})`);
            return roleDTO;
        } catch (error) {
            logger.error(`Error fetching role by name ${roleName}:`, error);
            throw new Error('Failed to fetch role');
        }
    }

    /**
     * 檢查角色是否存在
     * @param roleName 角色名稱
     */
    public async roleExists(roleName: string): Promise<boolean> {
        try {
            return await this.roleRepository.exists(roleName);
        } catch (error) {
            logger.error('Failed to check role existence:', error);
            return false;
        }
    }
}