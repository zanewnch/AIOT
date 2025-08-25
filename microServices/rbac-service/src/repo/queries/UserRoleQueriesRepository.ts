/**
 * @fileoverview 用戶角色關係查詢 Repositorysitorysitory - CQRS 查詢端
 * 
 * 專門處理用戶角色關係資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-23
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { Op } from 'sequelize';
import { UserRoleModel } from '../../models/UserToRoleModel.js';
import { UserModel } from '../../models/UserModel.js';
import { RoleModel } from '../../models/RoleModel.js';
import { PaginationRequestDto, PaginatedResult } from '../../dto/index.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('UserRoleQueriesRepositorysitory');

/**
 * 用戶角色關係查詢 Repositorysitorysitory 實現類別 - CQRS 查詢端
 * 
 * 專門處理用戶角色關係資料的查詢操作，遵循 CQRS 模式
 * 
 * @class UserRoleQueriesRepositorysitory
 */
@injectable()
export class UserRoleQueriesRepositorysitorysitory {

    /**
     * 統一分頁查詢方法
     * 
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @param {Record<string, any>} filters - 額外篩選條件
     * @returns {Promise<PaginatedResult<UserRoleModel>>} 分頁結果
     */
    findPaginated = async (
        pagination: PaginationRequestDto,
        filters: Record<string, any> = {}
    ): Promise<PaginatedResult<UserRoleModel>> => {
        try {
            const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'DESC', search } = pagination;
            const offset = (page - 1) * pageSize;

            logger.info('Fetching paginated user roles', { pagination, filters });

            // 建立查詢條件
            let whereCondition: any = { ...filters };

            // 如果有搜尋條件，需要在包含的 user 或 role 中搜尋
            const includeConditions = [
                {
                    model: UserModel,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'displayName'],
                    required: false
                },
                {
                    model: RoleModel,
                    as: 'role',
                    attributes: ['id', 'name', 'displayName', 'type'],
                    required: false
                }
            ];

            // 搜尋條件 - 在用戶名、角色名中搜尋
            if (search) {
                includeConditions[0].where = {
                    [Op.or]: [
                        { username: { [Op.like]: `%${search}%` } },
                        { email: { [Op.like]: `%${search}%` } },
                        { displayName: { [Op.like]: `%${search}%` } }
                    ]
                } as any;
                includeConditions[1].where = {
                    [Op.or]: [
                        { name: { [Op.like]: `%${search}%` } },
                        { displayName: { [Op.like]: `%${search}%` } }
                    ]
                } as any;
            }

            // 查詢分頁數據
            const { count: totalCount, rows: data } = await UserRoleModel.findAndCountAll({
                where: whereCondition,
                include: includeConditions,
                order: [[sortBy, sortOrder]],
                limit: pageSize,
                offset: offset
            });

            const result: PaginatedResult<UserRoleModel> = {
                data,
                totalCount,
                currentPage: page,
                pageSize
            };

            logger.info(`Successfully fetched paginated user roles: page ${page}, ${data.length}/${totalCount} records`);
            return result;
        } catch (error) {
            logger.error('Error fetching paginated user roles', { pagination, filters, error });
            throw error;
        }
    };

    /**
     * 分頁查詢所有用戶角色關係
     * 
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<UserRoleModel>>} 分頁結果
     */
    getAllUserRolesPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<UserRoleModel>> => {
        return this.findPaginated(pagination);
    };

    /**
     * 根據用戶分頁查詢角色關係
     * 
     * @param {number} userId - 用戶 ID
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<UserRoleModel>>} 分頁結果
     */
    getUserRolesByUserPaginated = async (
        userId: number,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<UserRoleModel>> => {
        return this.findPaginated(pagination, { user_id: userId });
    };

    /**
     * 根據角色分頁查詢用戶關係
     * 
     * @param {number} roleId - 角色 ID
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<UserRoleModel>>} 分頁結果
     */
    getUserRolesByRolePaginated = async (
        roleId: number,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<UserRoleModel>> => {
        return this.findPaginated(pagination, { role_id: roleId });
    };

    /**
     * 根據狀態分頁查詢用戶角色關係
     * 
     * @param {string} status - 關係狀態
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<UserRoleModel>>} 分頁結果
     */
    getUserRolesByStatusPaginated = async (
        status: string,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<UserRoleModel>> => {
        return this.findPaginated(pagination, { status });
    };

    /**
     * 分頁查詢過期的用戶角色關係
     * 
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<UserRoleModel>>} 分頁結果
     */
    getExpiredUserRolesPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<UserRoleModel>> => {
        const filters = {
            expires_at: {
                [Op.lt]: new Date()
            }
        };
        return this.findPaginated(pagination, filters);
    };

    /**
     * 分頁查詢有效的用戶角色關係
     * 
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<UserRoleModel>>} 分頁結果
     */
    getActiveUserRolesPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<UserRoleModel>> => {
        const filters = {
            [Op.or]: [
                { expires_at: null },
                { expires_at: { [Op.gt]: new Date() } }
            ]
        };
        return this.findPaginated(pagination, filters);
    };
}