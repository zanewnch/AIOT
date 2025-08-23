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
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { RoleQueriesRepo } from '../../repo/queries/RoleQueriesRepo.js';
import type { RoleModel } from '../../models/RoleModel.js';
// //  // 暫時停用
// import { getRedisClient } from 'aiot-shared-packages';
import type { RedisClientType } from 'redis';
import { createLogger } from '../../configs/loggerConfig.js';
import { PaginationParams, PaginatedResult, PaginationUtils, RoleDTO, IRoleQueriesService } from '../../types/index.js';

const logger = createLogger('RoleQueriesSvc');


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
export class RoleQueriesSvc { // implements IRoleQueriesService {
    private static readonly ROLE_CACHE_PREFIX = 'role:';
    private static readonly DEFAULT_CACHE_TTL = 3600; // 1 小時

    constructor(
        @inject(TYPES.RoleQueriesRepo) private readonly roleRepo: RoleQueriesRepo
    ) {
        // Redis 功能暫時停用
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
     * 從快取取得單一角色
     * @param roleId 角色 ID
     * @private
     */
    private getCachedRole = async (roleId: number): Promise<RoleDTO | null> => {
        const key = this.getRoleCacheKey(roleId);
        
        // Redis 功能暫時停用
        return null;
    }

    // ==================== 公開查詢方法 ====================


    /**
     * 根據 ID 取得角色
     * @param roleId 角色 ID
     */
    public getRoleById = async (roleId: number): Promise<RoleDTO | null> => {
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
            const role = await this.roleRepo.findById(roleId);
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
    public getRoleByName = async (roleName: string): Promise<RoleDTO | null> => {
        try {
            logger.info(`Retrieving role by name: ${roleName}`);

            // 驗證輸入
            if (!roleName || roleName.trim().length === 0) {
                logger.warn('Invalid role name');
                return null;
            }

            // 從資料庫查找
            const role = await this.roleRepo.findByName(roleName.trim());
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
    public roleExists = async (roleName: string): Promise<boolean> => {
        try {
            return await this.roleRepo.exists(roleName);
        } catch (error) {
            logger.error('Failed to check role existence:', error);
            return false;
        }
    }

    /**
     * 獲取所有角色列表（支持分頁）
     * 
     * @param params 分頁參數，默認 page=1, pageSize=20
     * @returns 分頁角色結果
     */
    public async getAllRoles(params: PaginationParams = { page: 1, pageSize: 20, sortBy: 'id', sortOrder: 'DESC' }): Promise<PaginatedResult<RoleDTO>> {
        try {
            logger.debug('Getting roles with pagination', params);

            // 驗證分頁參數
            const validatedParams = PaginationUtils.validatePaginationParams(params, {
                defaultPage: 1,
                defaultPageSize: 10,
                maxPageSize: 100,
                defaultSortBy: 'id',
                defaultSortOrder: 'DESC',
                allowedSortFields: ['id', 'name', 'displayName', 'createdAt', 'updatedAt']
            });

            // 從存儲庫獲取分頁數據
            const offset = PaginationUtils.calculateOffset(validatedParams.page, validatedParams.pageSize);
            
            // 獲取總數和分頁數據
            const [roles, total] = await Promise.all([
                this.roleRepo.findPaginated(
                    validatedParams.pageSize, 
                    offset, 
                    validatedParams.sortBy, 
                    validatedParams.sortOrder
                ),
                this.roleRepo.count()
            ]);

            // 轉換為 DTO
            const roleDTOs = roles.map(role => this.modelToDTO(role));

            // 創建分頁結果
            const result = PaginationUtils.createPaginatedResult(
                roleDTOs,
                total,
                validatedParams.page,
                validatedParams.pageSize
            );

            logger.info('Successfully fetched roles with pagination', {
                page: result.page,
                pageSize: result.pageSize,
                total: result.total,
                totalPages: result.totalPages
            });

            return result;
        } catch (error) {
            logger.error('Error fetching roles with pagination:', error);
            throw new Error('Failed to fetch roles with pagination');
        }
    }
}