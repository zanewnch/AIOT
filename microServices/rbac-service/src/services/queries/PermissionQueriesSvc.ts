/**
 * @fileoverview 權限查詢服務實現
 *
 * 此文件實作了權限查詢業務邏輯層，
 * 專注於處理所有讀取和權限檢查相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * 功能特點：
 * - 使用者權限檢查(單一、任一、全部)
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
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { UserQueriesRepo } from '../../repo/queries/UserQueriesRepo.js';
import { PermissionQueriesRepo } from '../../repo/queries/PermissionQueriesRepo.js';
import type { PermissionModel } from '../../models/PermissionModel.js';

import type { RedisClientType } from 'redis';
import { createLogger, logPermissionCheck } from '../../configs/loggerConfig.js';
import * as sharedPackages from 'aiot-shared-packages';
import type {
    PermissionDTO,
    UserPermissions,
    CacheOptions,
    IPermissionQueriesService
} from '../../types/index.js';

import { PaginationParams, PaginatedResult, PaginationUtils } from '../../types/PaginationTypes.js';

const logger = createLogger('PermissionQueriesSvc');

/**
 * 搜尋條件介面
 */
export interface PermissionSearchCriteria {
    /** 名稱搜尋模式 */
    namePattern?: string;
    /** 描述搜尋模式 */
    descriptionPattern?: string;
    /** 開始日期 */
    startDate?: Date;
    /** 結束日期 */
    endDate?: Date;
    /** 包含的權限 ID 列表 */
    includeIds?: number[];
    /** 排除的權限 ID 列表 */
    excludeIds?: number[];
}

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
    private static readonly PERMISSIONS_CACHE_PREFIX = 'user_permissions:';
    private static readonly PERMISSION_CACHE_PREFIX = 'permission:';
    private static readonly DEFAULT_CACHE_TTL = 3600; // 1 小時

    constructor(
        @inject(TYPES.UserQueriesRepo) private readonly userRepo: UserQueriesRepo,
        @inject(TYPES.PermissionQueriesRepo) private readonly permissionRepo: PermissionQueriesRepo
    ) {
    }

    /**
     * 安全執行 Redis 操作
     * @param operation Redis 操作函式
     * @param operationName 操作名稱
     * @param fallbackValue 操作失敗時的預設返回值
     * @private
     */
    private safeRedisOperation = async <T>(
        operation: (redis: RedisClientType) => Promise<T>,
        operationName: string,
        fallbackValue: T
    ): Promise<T> => {
        try {
            const redis = sharedPackages.getRedisClient();
            const result = await operation(redis);
            logger.debug(`Redis operation ${operationName} completed successfully`);
            return result;
        } catch (error) {
            logger.warn(`Redis operation ${operationName} failed:`, error);
            return fallbackValue;
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
     * @returns 使用者權限資料或 null(當快取不存在或發生錯誤時)
     * @private
     */
    private async getCachedUserPermissions(userId: number): Promise<UserPermissions | null> {
        const cacheKey = this.getPermissionsCacheKey(userId);
        
        return await this.safeRedisOperation(
            async (redis: RedisClientType) => {
                const cachedData = await redis.get(cacheKey);
                return cachedData ? JSON.parse(cachedData) as UserPermissions : null;
            },
            'getCachedUserPermissions',
            null
        );
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
            const user = await this.userRepo.findByIdWithRolesAndPermissions(userId);

            if (!user) {
                logger.warn(`User ${userId} not found in database`);
                return null;
            }

            // 提取所有權限(來自角色)
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
     * 從快取取得單一權限
     * @param permissionId 權限 ID
     * @private
     */
    private async getCachedPermission(permissionId: number): Promise<PermissionDTO | null> {
        const key = this.getPermissionCacheKey(permissionId);
        
        return await this.safeRedisOperation(
            async (redis: RedisClientType) => {
                logger.debug(`Checking Redis cache for permission ID: ${permissionId}`);
                const cachedData = await redis.get(key);
                if (cachedData) {
                    logger.info(`Permission ID: ${permissionId} loaded from Redis cache`);
                    return JSON.parse(cachedData);
                }
                return null;
            },
            `getCachedPermission(${permissionId})`,
            null
        );
    }

    // ==================== 公開查詢方法 ====================

    /**
     * 取得使用者權限資料(支援快取)
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
     * 檢查使用者是否具有任一權限(OR 邏輯)
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
     * 檢查使用者是否具有所有權限(AND 邏輯)
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
            return await this.permissionRepo.exists(permissionName);
        } catch (error) {
            logger.error('Failed to check permission existence:', error);
            return false;
        }
    }

    // ==================== 權限管理查詢方法 ====================


    /**
     * 根據 ID 取得權限
     * @param permissionId 權限 ID
     * @returns 權限資料或 null
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
            const permission = await this.permissionRepo.findById(permissionId);
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
     * 獲取所有權限列表(支持分頁)
     * @param params 分頁參數，默認 page=1, pageSize=20
     * @returns 分頁權限結果
     */
    public async getAllPermissions(params: PaginationParams = { page: 1, pageSize: 20, sortBy: 'id', sortOrder: 'DESC' }): Promise<PaginatedResult<PermissionDTO>> {
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
                this.permissionRepo.findPaginated(
                    validatedParams.pageSize, 
                    offset, 
                    validatedParams.sortBy, 
                    validatedParams.sortOrder
                ),
                this.permissionRepo.count()
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

    /**
     * 根據名稱查找權限
     * @param name 權限名稱
     * @returns 權限 DTO 或 null
     */
    public async getPermissionByName(name: string): Promise<PermissionDTO | null> {
        try {
            logger.info(`Retrieving permission by name: ${name}`);

            // 驗證輸入
            if (!name || name.trim().length === 0) {
                logger.warn('Invalid permission name');
                return null;
            }

            // 從資料庫查找
            const permission = await this.permissionRepo.findByName(name.trim());
            if (!permission) {
                logger.warn(`Permission not found for name: ${name}`);
                return null;
            }

            const permissionDTO = this.modelToDTO(permission);
            logger.info(`Permission found: ${name} (ID: ${permissionDTO.id})`);
            return permissionDTO;
        } catch (error) {
            logger.error(`Error fetching permission by name ${name}:`, error);
            throw new Error('Failed to fetch permission');
        }
    }

    /**
     * 按名稱模糊搜尋權限(支持分頁)
     * @param namePattern 名稱搜尋模式
     * @param params 分頁參數，默認 page=1, pageSize=20
     * @returns 分頁權限結果
     */
    public async getPermissionsByNamePattern(
        namePattern: string, 
        params: PaginationParams = { page: 1, pageSize: 20, sortBy: 'name', sortOrder: 'ASC' }
    ): Promise<PaginatedResult<PermissionDTO>> {
        try {
            logger.debug('Searching permissions by name pattern', { namePattern, params });

            // 驗證輸入
            if (!namePattern || namePattern.trim().length === 0) {
                logger.warn('Invalid name pattern');
                throw new Error('Name pattern cannot be empty');
            }

            // 驗證分頁參數
            const validatedParams = PaginationUtils.validatePaginationParams(params, {
                defaultPage: 1,
                defaultPageSize: 10,
                maxPageSize: 100,
                defaultSortBy: 'name',
                defaultSortOrder: 'ASC',
                allowedSortFields: ['id', 'name', 'createdAt', 'updatedAt']
            });

            // 從存儲庫獲取分頁數據
            const offset = PaginationUtils.calculateOffset(validatedParams.page, validatedParams.pageSize);
            
            // 獲取總數和分頁數據 (假設 repository 有對應方法)
            const searchPattern = `%${namePattern.trim()}%`;
            const [permissions, total] = await Promise.all([
                this.permissionRepo.findByNamePatternPaginated(
                    searchPattern,
                    validatedParams.pageSize, 
                    offset, 
                    validatedParams.sortBy, 
                    validatedParams.sortOrder
                ),
                this.permissionRepo.countByNamePattern(searchPattern)
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

            logger.info('Successfully searched permissions by name pattern', {
                namePattern,
                page: result.page,
                pageSize: result.pageSize,
                total: result.total,
                totalPages: result.totalPages
            });

            return result;
        } catch (error) {
            logger.error('Error searching permissions by name pattern:', error);
            throw new Error('Failed to search permissions by name pattern');
        }
    }

    /**
     * 按描述搜尋權限(支持分頁)
     * @param descriptionPattern 描述搜尋模式
     * @param params 分頁參數，默認 page=1, pageSize=20
     * @returns 分頁權限結果
     */
    public async getPermissionsByDescription(
        descriptionPattern: string, 
        params: PaginationParams = { page: 1, pageSize: 20, sortBy: 'name', sortOrder: 'ASC' }
    ): Promise<PaginatedResult<PermissionDTO>> {
        try {
            logger.debug('Searching permissions by description', { descriptionPattern, params });

            // 驗證輸入
            if (!descriptionPattern || descriptionPattern.trim().length === 0) {
                logger.warn('Invalid description pattern');
                throw new Error('Description pattern cannot be empty');
            }

            // 驗證分頁參數
            const validatedParams = PaginationUtils.validatePaginationParams(params, {
                defaultPage: 1,
                defaultPageSize: 10,
                maxPageSize: 100,
                defaultSortBy: 'name',
                defaultSortOrder: 'ASC',
                allowedSortFields: ['id', 'name', 'createdAt', 'updatedAt']
            });

            // 從存儲庫獲取分頁數據
            const offset = PaginationUtils.calculateOffset(validatedParams.page, validatedParams.pageSize);
            
            // 獲取總數和分頁數據 (假設 repository 有對應方法)
            const searchPattern = `%${descriptionPattern.trim()}%`;
            const [permissions, total] = await Promise.all([
                this.permissionRepo.findByDescriptionPatternPaginated(
                    searchPattern,
                    validatedParams.pageSize, 
                    offset, 
                    validatedParams.sortBy, 
                    validatedParams.sortOrder
                ),
                this.permissionRepo.countByDescriptionPattern(searchPattern)
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

            logger.info('Successfully searched permissions by description', {
                descriptionPattern,
                page: result.page,
                pageSize: result.pageSize,
                total: result.total,
                totalPages: result.totalPages
            });

            return result;
        } catch (error) {
            logger.error('Error searching permissions by description:', error);
            throw new Error('Failed to search permissions by description');
        }
    }

    /**
     * 按創建時間範圍查詢權限(支持分頁)
     * @param startDate 開始日期
     * @param endDate 結束日期
     * @param params 分頁參數
     * @returns 分頁權限結果
     */

    /**
     * 按日期範圍搜尋權限(支持分頁)
     * @param startDate 開始日期
     * @param endDate 結束日期  
     * @param params 分頁參數，默認 page=1, pageSize=20
     * @returns 分頁權限結果
     */
    public async getPermissionsByDateRange(
        startDate: Date, 
        endDate: Date,
        params: PaginationParams = { page: 1, pageSize: 20, sortBy: 'createdAt', sortOrder: 'DESC' }
    ): Promise<PaginatedResult<PermissionDTO>> {
        try {
            logger.debug('Getting permissions by date range', { startDate, endDate, params });

            // 驗證輸入
            if (!startDate || !endDate) {
                throw new Error('Start date and end date are required');
            }

            if (startDate >= endDate) {
                throw new Error('Start date must be before end date');
            }

            // 驗證分頁參數
            const validatedParams = PaginationUtils.validatePaginationParams(params, {
                defaultPage: 1,
                defaultPageSize: 10,
                maxPageSize: 100,
                defaultSortBy: 'createdAt',
                defaultSortOrder: 'DESC',
                allowedSortFields: ['id', 'name', 'createdAt', 'updatedAt']
            });

            // 從存儲庫獲取分頁數據
            const offset = PaginationUtils.calculateOffset(validatedParams.page, validatedParams.pageSize);
            
            // 獲取總數和分頁數據 (假設 repository 有對應方法)
            const [permissions, total] = await Promise.all([
                this.permissionRepo.findByDateRangePaginated(
                    startDate,
                    endDate,
                    validatedParams.pageSize, 
                    offset, 
                    validatedParams.sortBy, 
                    validatedParams.sortOrder
                ),
                this.permissionRepo.countByDateRange(startDate, endDate)
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

            logger.info('Successfully fetched permissions by date range', {
                startDate,
                endDate,
                page: result.page,
                pageSize: result.pageSize,
                total: result.total,
                totalPages: result.totalPages
            });

            return result;
        } catch (error) {
            logger.error('Error fetching permissions by date range:', error);
            throw new Error('Failed to fetch permissions by date range');
        }
    }


    /**
     * 組合條件搜尋權限(支持分頁)
     * @param criteria 搜尋條件
     * @param params 分頁參數
     * @returns 分頁權限結果
     */

    /**
     * 綜合搜尋權限(支持多條件搜尋和分頁)
     * @param criteria 搜尋條件
     * @param params 分頁參數，默認 page=1, pageSize=20
     * @returns 分頁權限結果
     */
    public async searchPermissions(
        criteria: PermissionSearchCriteria = {},
        params: PaginationParams = { page: 1, pageSize: 20, sortBy: 'name', sortOrder: 'ASC' }
    ): Promise<PaginatedResult<PermissionDTO>> {
        try {
            logger.debug('Searching permissions with criteria', { criteria, params });

            // 驗證分頁參數
            const validatedParams = PaginationUtils.validatePaginationParams(params, {
                defaultPage: 1,
                defaultPageSize: 10,
                maxPageSize: 100,
                defaultSortBy: 'name',
                defaultSortOrder: 'ASC',
                allowedSortFields: ['id', 'name', 'createdAt', 'updatedAt']
            });

            // 從存儲庫獲取分頁數據
            const offset = PaginationUtils.calculateOffset(validatedParams.page, validatedParams.pageSize);
            
            // 獲取總數和分頁數據 (假設 repository 有對應方法)
            const [permissions, total] = await Promise.all([
                this.permissionRepo.searchPaginated(
                    criteria,
                    validatedParams.pageSize, 
                    offset, 
                    validatedParams.sortBy, 
                    validatedParams.sortOrder
                ),
                this.permissionRepo.countByCriteria(criteria)
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

            logger.info('Successfully searched permissions with criteria', {
                criteria,
                page: result.page,
                pageSize: result.pageSize,
                total: result.total,
                totalPages: result.totalPages
            });

            return result;
        } catch (error) {
            logger.error('Error searching permissions with criteria:', error);
            throw new Error('Failed to search permissions with criteria');
        }
    }

    /**
     * 檢查使用者是否有特定權限
     * 
     * @param userId 使用者 ID
     * @param permission 權限名稱
     * @param options 快取選項
     * @returns 是否有權限
     */
    public async hasPermission(userId: number, permission: string, options: CacheOptions = {}): Promise<boolean> {
        try {
            const userPermissions = await this.getUserPermissions(userId, options);
            if (!userPermissions) {
                return false;
            }

            return userPermissions.permissions.includes(permission);
        } catch (error) {
            logger.error(`Error checking permission ${permission} for user ${userId}:`, error);
            return false;
        }
    }
}