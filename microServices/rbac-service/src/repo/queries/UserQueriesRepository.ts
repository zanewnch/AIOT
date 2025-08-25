/**
 * @fileoverview 用戶查詢 Repositorysitorysitory - CQRS 查詢端
 * 
 * 專門處理用戶資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-23
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { Op } from 'sequelize';
import { UserModel } from '../../models/UserModel.js';
import { RoleModel } from '../../models/RoleModel.js';
import { PermissionModel } from '../../models/PermissionModel.js';
import { PaginationRequestDto, PaginatedResult } from '../../dto/index.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('UserQueriesRepositorysitory');

/**
 * 用戶查詢 Repositorysitorysitory 實現類別 - CQRS 查詢端
 * 
 * 專門處理用戶資料的查詢操作，遵循 CQRS 模式
 * 
 * @class UserQueriesRepositorysitory
 */
@injectable()
export class UserQueriesRepositorysitorysitory {

    /**
     * 統一分頁查詢方法
     * 
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @param {Record<string, any>} filters - 額外篩選條件
     * @returns {Promise<PaginatedResult<UserModel>>} 分頁結果
     */
    findPaginated = async (
        pagination: PaginationRequestDto,
        filters: Record<string, any> = {}
    ): Promise<PaginatedResult<UserModel>> => {
        try {
            const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'DESC', search } = pagination;
            const offset = (page - 1) * pageSize;

            logger.info('Fetching paginated users', { pagination, filters });

            // 建立查詢條件
            let whereCondition: any = { ...filters };

            // 搜尋條件 - 支援用戶名、電子郵件搜尋
            if (search) {
                whereCondition = {
                    ...whereCondition,
                    [Op.or]: [
                        { username: { [Op.like]: `%${search}%` } },
                        { email: { [Op.like]: `%${search}%` } },
                        { displayName: { [Op.like]: `%${search}%` } }
                    ]
                };
            }

            // 查詢分頁數據
            const { count: totalCount, rows: data } = await UserModel.findAndCountAll({
                where: whereCondition,
                order: [[sortBy, sortOrder]],
                limit: pageSize,
                offset: offset
            });

            const result: PaginatedResult<UserModel> = {
                data,
                totalCount,
                currentPage: page,
                pageSize
            };

            logger.info(`Successfully fetched paginated users: page ${page}, ${data.length}/${totalCount} records`);
            return result;
        } catch (error) {
            logger.error('Error fetching paginated users', { pagination, filters, error });
            throw error;
        }
    };

    /**
     * 分頁查詢所有用戶
     * 
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<UserModel>>} 分頁結果
     */
    getAllUsersPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<UserModel>> => {
        return this.findPaginated(pagination);
    };

    /**
     * 根據角色分頁查詢用戶
     * 
     * @param {number} roleId - 角色 ID
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<UserModel>>} 分頁結果
     */
    getUsersByRolePaginated = async (
        roleId: number,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<UserModel>> => {
        try {
            const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'DESC', search } = pagination;
            const offset = (page - 1) * pageSize;

            logger.info('Fetching users by role paginated', { roleId, pagination });

            // 建立查詢條件
            const includeCondition: any = {
                model: RoleModel,
                as: 'roles',
                where: { id: roleId },
                through: { attributes: [] }
            };

            let whereCondition: any = {};

            // 搜尋條件
            if (search) {
                whereCondition = {
                    [Op.or]: [
                        { username: { [Op.like]: `%${search}%` } },
                        { email: { [Op.like]: `%${search}%` } },
                        { displayName: { [Op.like]: `%${search}%` } }
                    ]
                };
            }

            // 查詢分頁數據
            const { count: totalCount, rows: data } = await UserModel.findAndCountAll({
                where: whereCondition,
                include: [includeCondition],
                order: [[sortBy, sortOrder]],
                limit: pageSize,
                offset: offset
            });

            const result: PaginatedResult<UserModel> = {
                data,
                totalCount,
                currentPage: page,
                pageSize
            };

            logger.info(`Successfully fetched users by role: roleId ${roleId}, page ${page}, ${data.length}/${totalCount} records`);
            return result;
        } catch (error) {
            logger.error('Error fetching users by role paginated', { roleId, pagination, error });
            throw error;
        }
    };

    /**
     * 根據狀態分頁查詢用戶
     * 
     * @param {string} status - 用戶狀態
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<UserModel>>} 分頁結果
     */
    getUsersByStatusPaginated = async (
        status: string,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<UserModel>> => {
        return this.findPaginated(pagination, { status });
    };

    /**
     * 根據權限分頁查詢用戶
     * 
     * @param {number} permissionId - 權限 ID
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<UserModel>>} 分頁結果
     */
    getUsersByPermissionPaginated = async (
        permissionId: number,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<UserModel>> => {
        try {
            const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'DESC', search } = pagination;
            const offset = (page - 1) * pageSize;

            logger.info('Fetching users by permission paginated', { permissionId, pagination });

            // 建立查詢條件
            const includeCondition: any = {
                model: RoleModel,
                as: 'roles',
                include: [
                    {
                        model: PermissionModel,
                        as: 'permissions',
                        where: { id: permissionId },
                        through: { attributes: [] }
                    }
                ],
                through: { attributes: [] }
            };

            let whereCondition: any = {};

            // 搜尋條件
            if (search) {
                whereCondition = {
                    [Op.or]: [
                        { username: { [Op.like]: `%${search}%` } },
                        { email: { [Op.like]: `%${search}%` } },
                        { displayName: { [Op.like]: `%${search}%` } }
                    ]
                };
            }

            // 查詢分頁數據
            const { count: totalCount, rows: data } = await UserModel.findAndCountAll({
                where: whereCondition,
                include: [includeCondition],
                order: [[sortBy, sortOrder]],
                limit: pageSize,
                offset: offset
            });

            const result: PaginatedResult<UserModel> = {
                data,
                totalCount,
                currentPage: page,
                pageSize
            };

            logger.info(`Successfully fetched users by permission: permissionId ${permissionId}, page ${page}, ${data.length}/${totalCount} records`);
            return result;
        } catch (error) {
            logger.error('Error fetching users by permission paginated', { permissionId, pagination, error });
            throw error;
        }
    };

    /**
     * 根據電子郵件驗證狀態分頁查詢用戶
     * 
     * @param {boolean} isVerified - 是否已驗證
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<UserModel>>} 分頁結果
     */
    getUsersByVerificationPaginated = async (
        isVerified: boolean,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<UserModel>> => {
        return this.findPaginated(pagination, { isVerified });
    };

    /**
     * 獲取所有使用者
     */
    findAll = async (): Promise<UserModel[]> => {
        return await UserModel.findAll({
            order: [['createdAt', 'DESC']]
        });
    };

    /**
     * 根據ID獲取使用者
     */
    findById = async (id: string): Promise<UserModel | null> => {
        return await UserModel.findByPk(id);
    };
}