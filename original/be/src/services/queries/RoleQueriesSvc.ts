/**
 * @fileoverview 角色查詢服務實現
 *
 * 此文件實作了角色查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * 功能特點：
 * - 角色查詢和資料擷取
 * - Redis 快取機制，減少資料庫查詢
 * - 角色存在性檢查
 * - 支援快取選項控制
 *
 * 快取策略：
 * - 單個角色快取：role:{roleId}
 * - 所有角色快取：roles:all
 * - 預設快取時間：1 小時
 * - 支援強制重新整理快取
 *
 * @module RoleQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { RoleQueriesRepository } from '../../repo/queries/rbac/RoleQueriesRepo.js';
import type { RoleModel } from '../../models/rbac/RoleModel.js';
import { getRedisClient } from '../../configs/redisConfig.js';
import type { RedisClientType } from 'redis';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('RoleQueriesSvc');

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
 * 快取選項介面
 */
export interface CacheOptions {
    forceRefresh?: boolean;
    ttl?: number;
}

/**
 * 角色查詢服務介面
 */
export interface IRoleQueriesService {
    getAllRoles(): Promise<RoleDTO[]>;
    getRoleById(roleId: number): Promise<RoleDTO | null>;
    getRoleByName(roleName: string): Promise<RoleDTO | null>;
    roleExists(roleName: string): Promise<boolean>;
}

/**
 * 角色查詢服務實現類別
 *
 * 專門處理角色相關的查詢請求，包含角色資料查詢、存在性檢查等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 * 
 * @class RoleQueriesSvc
 * @implements {IRoleQueriesService}
 * @since 1.0.0
 */
@injectable()
export class RoleQueriesSvc implements IRoleQueriesService {
    private roleRepository: RoleQueriesRepository;
    private static readonly ROLE_CACHE_PREFIX = 'role:';
    private static readonly ALL_ROLES_KEY = 'roles:all';
    private static readonly DEFAULT_CACHE_TTL = 3600; // 1 小時

    constructor() {
        this.roleRepository = new RoleQueriesRepository();
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
            return getRedisClient();
        } catch (error) {
            logger.warn('Redis not available, falling back to database queries');
            throw new Error('Redis connection is not available');
        }
    }

    /**
     * 產生角色快取鍵值
     * @param roleId 角色 ID
     * @private
     */
    private getRoleCacheKey(roleId: number): string {
        return `${RoleQueriesSvc.ROLE_CACHE_PREFIX}${roleId}`;
    }

    /**
     * 將模型轉換為 DTO
     * @param model 角色模型
     * @private
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
     * @private
     */
    private async getCachedAllRoles(): Promise<RoleDTO[] | null> {
        try {
            const redis = this.getRedisClient();
            logger.debug('Checking Redis cache for all roles');
            const cachedData = await redis.get(RoleQueriesSvc.ALL_ROLES_KEY);
            if (cachedData) {
                logger.info('Roles loaded from Redis cache');
                return JSON.parse(cachedData) as RoleDTO[];
            }
        } catch (error) {
            logger.warn('Failed to get cached roles:', error);
        }
        return null;
    }

    /**
     * 從快取取得單一角色
     * @param roleId 角色 ID
     * @private
     */
    private async getCachedRole(roleId: number): Promise<RoleDTO | null> {
        try {
            const redis = this.getRedisClient();
            logger.debug(`Checking Redis cache for role ID: ${roleId}`);
            const key = this.getRoleCacheKey(roleId);
            const cachedData = await redis.get(key);
            if (cachedData) {
                logger.info(`Role ID: ${roleId} loaded from Redis cache`);
                return JSON.parse(cachedData) as RoleDTO;
            }
        } catch (error) {
            logger.warn(`Failed to get cached role ${roleId}:`, error);
        }
        return null;
    }

    // ==================== 公開查詢方法 ====================

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

            logger.info(`Role ID: ${roleId} retrieved successfully`);
            return roleDTO;
        } catch (error) {
            logger.error(`Error fetching role by ID ${roleId}:`, error);
            throw new Error('Failed to fetch role');
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