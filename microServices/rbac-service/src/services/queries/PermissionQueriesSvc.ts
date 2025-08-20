/**
 * @fileoverview 權限查詢服務實現
 *
 * 此文件實作了權限查詢業務邏輯層，
 * 專注於處理所有讀取和權限檢查相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * 功能特點：
 * - 使用者權限檢查（單一、任一、全部）
 * - 使用者角色檢查
 * - Redis 快取機制，減少資料庫查詢
 * - 批量權限查詢
 * - 權限管理查詢
 *
 * 快取策略：
 * - 使用者權限快取：user_permissions:{userId}
 * - 使用者角色快取：user_roles:{userId}
 * - 權限快取：permission:{permissionId}
 * - 所有權限快取：permissions:all
 * - 預設快取時間：1 小時
 *
 * @module PermissionQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { UserQueriesRepository } from '../../repo/queries/UserQueriesRepo.js';
import { PermissionQueriesRepository } from '../../repo/queries/PermissionQueriesRepo.js';
import type { PermissionModel } from '../../models/PermissionModel.js';
import { getRedisClient } from '../../configs/redisConfig.js';
import type { RedisClientType } from 'redis';
import { createLogger, logPermissionCheck } from '../../configs/loggerConfig.js';
import type {
    IPermissionQueriesService
} from '../../types/services/IPermissionQueriesService.js';
import type {
    UserPermissions,
    CacheOptions,
    PermissionDTO
} from '../../types/services/IPermissionService.js';
import { PaginationParams, PaginatedResult, PaginationUtils } from '../../types/PaginationTypes.js';

const logger = createLogger('PermissionQueriesSvc');

/**
 * 權限查詢服務實現類別
 *
 * 專門處理權限相關的查詢請求，包含權限檢查、權限列表查詢等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 * 
 * @class PermissionQueriesSvc
 * @implements {IPermissionQueriesService}
 * @since 1.0.0
 */
@injectable()
export class PermissionQueriesSvc implements IPermissionQueriesService {
    private userRepository: UserQueriesRepository;
    private permissionRepository: PermissionQueriesRepository;
    private static readonly PERMISSIONS_CACHE_PREFIX = 'user_permissions:';
    private static readonly ROLES_CACHE_PREFIX = 'user_roles:';
    private static readonly PERMISSION_CACHE_PREFIX = 'permission:';
    private static readonly ALL_PERMISSIONS_KEY = 'permissions:all';
    private static readonly DEFAULT_CACHE_TTL = 3600; // 1 小時

    constructor() {
        this.userRepository = new UserQueriesRepository();
        this.permissionRepository = new PermissionQueriesRepository();
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
     * 生成使用者權限快取鍵值
     * @param userId 使用者 ID
     * @returns 權限快取鍵值
     * @private
     */
    private getPermissionsCacheKey(userId: number): string {
        return `${PermissionQueriesSvc.PERMISSIONS_CACHE_PREFIX}${userId}`;
    }

    /**
     * 生成使用者角色快取鍵值
     * @param userId 使用者 ID
     * @returns 角色快取鍵值
     * @private
     */
    private getRolesCacheKey(userId: number): string {
        return `${PermissionQueriesSvc.ROLES_CACHE_PREFIX}${userId}`;
    }

    /**
     * 產生權限快取鍵值
     * @param permissionId 權限 ID
     * @private
     */
    private getPermissionCacheKey(permissionId: number): string {
        return `${PermissionQueriesSvc.PERMISSION_CACHE_PREFIX}${permissionId}`;
    }

    /**
     * 從快取取得使用者權限資料
     * @param userId 使用者 ID
     * @returns 使用者權限資料或 null（當快取不存在或發生錯誤時）
     * @private
     */
    private async getCachedUserPermissions(userId: number): Promise<UserPermissions | null> {
        try {
            const redis = this.getRedisClient();
            const cacheKey = this.getPermissionsCacheKey(userId);
            const cachedData = await redis.get(cacheKey);

            if (cachedData) {
                return JSON.parse(cachedData) as UserPermissions;
            }

            return null;
        } catch (error) {
            logger.warn('Failed to get cached permissions:', error);
            return null;
        }
    }

    /**
     * 從資料庫取得使用者權限資料
     * @param userId 使用者 ID
     * @returns 使用者權限資料或 null
     * @private
     */
    private async fetchUserPermissionsFromDB(userId: number): Promise<UserPermissions | null> {
        try {
            logger.debug(`Querying database for user ${userId} with roles and permissions`);
            const user = await this.userRepository.findByIdWithRolesAndPermissions(userId);

            if (!user) {
                logger.warn(`User ${userId} not found in database`);
                return null;
            }

            // 提取所有權限（來自角色）
            const permissions = new Set<string>();
            const roles = new Set<string>();

            if (user.roles) {
                logger.debug(`User ${userId} has ${user.roles.length} roles`);
                for (const role of user.roles) {
                    roles.add(role.name);
                    logger.debug(`Processing role '${role.name}' for user ${userId}`);

                    if (role.permissions) {
                        logger.debug(`Role '${role.name}' has ${role.permissions.length} permissions`);
                        for (const permission of role.permissions) {
                            permissions.add(permission.name);
                        }
                    }
                }
            } else {
                logger.warn(`User ${userId} has no roles assigned`);
            }

            const result = {
                userId: user.id,
                username: user.username,
                permissions: Array.from(permissions),
                roles: Array.from(roles),
                lastUpdated: Date.now()
            };

            logger.info(`User ${userId} (${user.username}) permissions loaded: ${result.permissions.join(', ')}`);
            logger.info(`User ${userId} (${user.username}) roles: ${result.roles.join(', ')}`);

            return result;
        } catch (error) {
            logger.error('Failed to fetch user permissions from database:', error);
            return null;
        }
    }

    /**
     * 將模型轉換為 DTO
     * @param model 權限模型
     * @private
     */
    private modelToDTO(model: PermissionModel): PermissionDTO {
        return {
            id: model.id,
            name: model.name,
            description: model.description,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt
        };
    }

    /**
     * 從快取取得所有權限
     * @private
     */
    private async getCachedAllPermissions(): Promise<PermissionDTO[] | null> {
        try {
            const redis = this.getRedisClient();
            logger.debug('Checking Redis cache for all permissions');
            const cachedData = await redis.get(PermissionQueriesSvc.ALL_PERMISSIONS_KEY);
            if (cachedData) {
                logger.info('Permissions loaded from Redis cache');
                return JSON.parse(cachedData);
            }
        } catch (error) {
            logger.warn('Failed to get cached permissions:', error);
        }
        return null;
    }

    /**
     * 從快取取得單一權限
     * @param permissionId 權限 ID
     * @private
     */
    private async getCachedPermission(permissionId: number): Promise<PermissionDTO | null> {
        try {
            const redis = this.getRedisClient();
            logger.debug(`Checking Redis cache for permission ID: ${permissionId}`);
            const key = this.getPermissionCacheKey(permissionId);
            const cachedData = await redis.get(key);
            if (cachedData) {
                logger.info(`Permission ID: ${permissionId} loaded from Redis cache`);
                return JSON.parse(cachedData);
            }
        } catch (error) {
            logger.warn(`Failed to get cached permission ${permissionId}:`, error);
        }
        return null;
    }

    // ==================== 公開查詢方法 ====================

    /**
     * 取得使用者權限資料（支援快取）
     * @param userId 使用者 ID
     * @param options 快取選項
     * @returns 使用者權限資料或 null
     */
    public async getUserPermissions(
        userId: number,
        options: CacheOptions = {}
    ): Promise<UserPermissions | null> {
        const { forceRefresh = false } = options;

        logger.debug(`Getting permissions for user ${userId} (forceRefresh: ${forceRefresh})`);

        // 如果不強制重新整理，先嘗試從快取取得
        if (!forceRefresh) {
            const cachedPermissions = await this.getCachedUserPermissions(userId);
            if (cachedPermissions) {
                logger.debug(`Found cached permissions for user ${userId}`);
                return cachedPermissions;
            }
        }

        // 從資料庫取得權限資料
        logger.debug(`Fetching permissions from database for user ${userId}`);
        const permissions = await this.fetchUserPermissionsFromDB(userId);

        if (permissions) {
            logger.info(`Retrieved permissions for user ${userId}: ${permissions.permissions.length} permissions, ${permissions.roles.length} roles`);
        } else {
            logger.warn(`No permissions found for user ${userId}`);
        }

        return permissions;
    }

    /**
     * 檢查使用者是否具有特定權限
     * @param userId 使用者 ID
     * @param permissionName 權限名稱
     * @param options 快取選項
     * @returns 是否具有權限
     */
    public async userHasPermission(
        userId: number,
        permissionName: string,
        options: CacheOptions = {}
    ): Promise<boolean> {
        logger.debug(`Checking permission '${permissionName}' for user ${userId}`);

        const userPermissions = await this.getUserPermissions(userId, options);

        if (!userPermissions) {
            logger.warn(`User ${userId} not found or has no permissions`);
            logPermissionCheck(userId, permissionName, false, { reason: 'User not found' });
            return false;
        }

        const hasPermission = userPermissions.permissions.includes(permissionName);

        // 記錄權限檢查結果
        logPermissionCheck(userId, permissionName, hasPermission, {
            userRoles: userPermissions.roles,
            userPermissions: userPermissions.permissions
        });

        logger.debug(`Permission check result for user ${userId}: ${hasPermission ? 'GRANTED' : 'DENIED'}`);

        return hasPermission;
    }

    /**
     * 檢查使用者是否具有任一權限（OR 邏輯）
     * @param userId 使用者 ID
     * @param permissions 權限名稱陣列
     * @param options 快取選項
     * @returns 是否具有任一權限
     */
    public async userHasAnyPermission(
        userId: number,
        permissions: string[],
        options: CacheOptions = {}
    ): Promise<boolean> {
        const userPermissions = await this.getUserPermissions(userId, options);

        if (!userPermissions) {
            return false;
        }

        return permissions.some(permission =>
            userPermissions.permissions.includes(permission)
        );
    }

    /**
     * 檢查使用者是否具有所有權限（AND 邏輯）
     * @param userId 使用者 ID
     * @param permissions 權限名稱陣列
     * @param options 快取選項
     * @returns 是否具有所有權限
     */
    public async userHasAllPermissions(
        userId: number,
        permissions: string[],
        options = {}
    ): Promise<boolean> {
        const userPermissions = await this.getUserPermissions(userId, options);

        if (!userPermissions) {
            return false;
        }

        return permissions.every(permission =>
            userPermissions.permissions.includes(permission)
        );
    }

    /**
     * 檢查使用者是否具有特定角色
     * @param userId 使用者 ID
     * @param roleName 角色名稱
     * @param options 快取選項
     * @returns 是否具有角色
     */
    public async userHasRole(
        userId: number,
        roleName: string,
        options = {}
    ): Promise<boolean> {
        const userPermissions = await this.getUserPermissions(userId, options);

        if (!userPermissions) {
            return false;
        }

        return userPermissions.roles.includes(roleName);
    }

    /**
     * 取得使用者所有權限列表
     * @param userId 使用者 ID
     * @param options 快取選項
     * @returns 權限名稱陣列
     */
    public async getUserPermissionsList(
        userId: number,
        options = {}
    ): Promise<string[]> {
        const userPermissions = await this.getUserPermissions(userId, options);
        return userPermissions ? userPermissions.permissions : [];
    }

    /**
     * 取得使用者所有角色列表
     * @param userId 使用者 ID
     * @param options 快取選項
     * @returns 角色名稱陣列
     */
    public async getUserRolesList(
        userId: number,
        options = {}
    ): Promise<string[]> {
        const userPermissions = await this.getUserPermissions(userId, options);
        return userPermissions ? userPermissions.roles : [];
    }

    /**
     * 批量取得多個使用者的權限資料
     * @param userIds 使用者 ID 陣列
     * @param options 快取選項
     * @returns 使用者權限資料陣列
     */
    public async getBatchUserPermissions(
        userIds: number[],
        options = {}
    ): Promise<(UserPermissions | null)[]> {
        const promises = userIds.map(userId =>
            this.getUserPermissions(userId, options)
        );

        return Promise.all(promises);
    }

    /**
     * 檢查權限是否存在於系統中
     * @param permissionName 權限名稱
     * @returns 權限是否存在
     */
    public async permissionExists(permissionName: string): Promise<boolean> {
        try {
            return await this.permissionRepository.exists(permissionName);
        } catch (error) {
            logger.error('Failed to check permission existence:', error);
            return false;
        }
    }

    // ==================== 權限管理查詢方法 ====================

    /**
     * 取得所有權限列表
     */
    public async getAllPermissions(): Promise<PermissionDTO[]> {
        try {
            logger.debug('Getting all permissions with cache support');

            // 先嘗試從快取取得
            const cachedPermissions = await this.getCachedAllPermissions();
            if (cachedPermissions) {
                return cachedPermissions;
            }

            // 快取不存在，從資料庫取得
            logger.debug('Fetching permissions from database');
            const permissions = await this.permissionRepository.findAll();
            const permissionsDTO = permissions.map(p => this.modelToDTO(p));

            logger.info(`Retrieved ${permissionsDTO.length} permissions from database`);

            return permissionsDTO;
        } catch (error) {
            logger.error('Error fetching all permissions:', error);
            throw new Error('Failed to fetch permissions');
        }
    }

    /**
     * 根據 ID 取得權限
     * @param permissionId 權限 ID
     */
    public async getPermissionById(permissionId: number): Promise<PermissionDTO | null> {
        try {
            logger.info(`Retrieving permission by ID: ${permissionId}`);

            // 驗證輸入
            if (!permissionId || permissionId <= 0) {
                logger.warn(`Invalid permission ID: ${permissionId}`);
                return null;
            }

            // 先嘗試從快取取得
            const cachedPermission = await this.getCachedPermission(permissionId);
            if (cachedPermission) {
                return cachedPermission;
            }

            // 快取不存在，從資料庫取得
            logger.debug(`Fetching permission ID: ${permissionId} from database`);
            const permission = await this.permissionRepository.findById(permissionId);
            if (!permission) {
                logger.warn(`Permission not found for ID: ${permissionId}`);
                return null;
            }

            const permissionDTO = this.modelToDTO(permission);

            logger.info(`Permission ID: ${permissionId} retrieved successfully`);
            return permissionDTO;
        } catch (error) {
            logger.error(`Error fetching permission by ID ${permissionId}:`, error);
            throw new Error('Failed to fetch permission');
        }
    }

    /**
     * 分頁查詢權限列表
     * 
     * @param params 分頁參數
     * @returns 分頁權限結果
     */
    public async getPermissionsPaginated(params: PaginationParams): Promise<PaginatedResult<PermissionDTO>> {
        try {
            logger.debug('Getting permissions with pagination', params);

            // 驗證分頁參數
            const validatedParams = PaginationUtils.validatePaginationParams(params, {
                defaultPage: 1,
                defaultPageSize: 10,
                maxPageSize: 100,
                defaultSortBy: 'id',
                defaultSortOrder: 'DESC',
                allowedSortFields: ['id', 'name', 'category', 'isActive', 'createdAt', 'updatedAt']
            });

            // 從存儲庫獲取分頁數據
            const offset = PaginationUtils.calculateOffset(validatedParams.page, validatedParams.pageSize);
            
            // 獲取總數和分頁數據
            const [permissions, total] = await Promise.all([
                this.permissionRepository.findPaginated(
                    validatedParams.pageSize, 
                    offset, 
                    validatedParams.sortBy, 
                    validatedParams.sortOrder
                ),
                this.permissionRepository.count()
            ]);

            // 轉換為 DTO
            const permissionDTOs = permissions.map(permission => this.modelToDTO(permission));

            // 創建分頁結果
            const result = PaginationUtils.createPaginatedResult(
                permissionDTOs,
                total,
                validatedParams.page,
                validatedParams.pageSize
            );

            logger.info('Successfully fetched permissions with pagination', {
                page: result.page,
                pageSize: result.pageSize,
                total: result.total,
                totalPages: result.totalPages
            });

            return result;
        } catch (error) {
            logger.error('Error fetching permissions with pagination:', error);
            throw new Error('Failed to fetch permissions with pagination');
        }
    }
}