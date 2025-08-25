/**
 * @fileoverview 角色查詢 Repositorysitorysitory - CQRS 查詢端
 * 
 * 專門處理角色資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-23
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { Op } from 'sequelize';
import { RoleModel } from '../../models/RoleModel.js';
import { PermissionModel } from '../../models/PermissionModel.js';
import { UserModel } from '../../models/UserModel.js';
import { PaginationRequestDto, PaginatedResult } from '../../dto/index.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('RoleQueriesRepositorysitory');

/**
 * 角色查詢 Repositorysitorysitory 實現類別 - CQRS 查詢端
 * 
 * 專門處理角色資料的查詢操作，遵循 CQRS 模式
 * 
 * @class RoleQueriesRepositorysitory
 */
@injectable()
export class RoleQueriesRepositorysitorysitory {

    /**
     * 統一分頁查詢方法
     * 
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @param {Record<string, any>} filters - 額外篩選條件
     * @returns {Promise<PaginatedResult<RoleModel>>} 分頁結果
     */
    findPaginated = async (
        pagination: PaginationRequestDto,
        filters: Record<string, any> = {}
    ): Promise<PaginatedResult<RoleModel>> => {
        try {
            const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'DESC', search } = pagination;
            const offset = (page - 1) * pageSize;

            logger.info('Fetching paginated roles', { pagination, filters });

            // 建立查詢條件
            let whereCondition: any = { ...filters };

            // 搜尋條件 - 支援角色名稱、顯示名稱搜尋
            if (search) {
                whereCondition = {
                    ...whereCondition,
                    [Op.or]: [
                        { name: { [Op.like]: `%${search}%` } },
                        { displayName: { [Op.like]: `%${search}%` } },
                        { description: { [Op.like]: `%${search}%` } }
                    ]
                };
            }

            // 查詢分頁數據
            const { count: totalCount, rows: data } = await RoleModel.findAndCountAll({
                where: whereCondition,
                order: [[sortBy, sortOrder]],
                limit: pageSize,
                offset: offset
            });

            const result: PaginatedResult<RoleModel> = {
                data,
                totalCount,
                currentPage: page,
                pageSize
            };

            logger.info(`Successfully fetched paginated roles: page ${page}, ${data.length}/${totalCount} records`);
            return result;
        } catch (error) {
            logger.error('Error fetching paginated roles', { pagination, filters, error });
            throw error;
        }
    };

    /**
     * 分頁查詢所有角色
     * 
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<RoleModel>>} 分頁結果
     */
    getAllRolesPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<RoleModel>> => {
        return this.findPaginated(pagination);
    };

    /**
     * 根據類型分頁查詢角色
     * 
     * @param {string} type - 角色類型
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<RoleModel>>} 分頁結果
     */
    getRolesByTypePaginated = async (
        type: string,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<RoleModel>> => {
        return this.findPaginated(pagination, { type });
    };

    /**
     * 根據狀態分頁查詢角色
     * 
     * @param {string} status - 角色狀態
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<RoleModel>>} 分頁結果
     */
    getRolesByStatusPaginated = async (
        status: string,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<RoleModel>> => {
        return this.findPaginated(pagination, { status });
    };

    /**
     * 根據權限分頁查詢角色
     * 
     * @param {number} permissionId - 權限 ID
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<RoleModel>>} 分頁結果
     */
    getRolesByPermissionPaginated = async (
        permissionId: number,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<RoleModel>> => {
        try {
            const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'DESC', search } = pagination;
            const offset = (page - 1) * pageSize;

            logger.info('Fetching roles by permission paginated', { permissionId, pagination });

            // 建立查詢條件
            const includeCondition: any = {
                model: PermissionModel,
                as: 'permissions',
                where: { id: permissionId },
                through: { attributes: [] }
            };

            let whereCondition: any = {};

            // 搜尋條件
            if (search) {
                whereCondition = {
                    [Op.or]: [
                        { name: { [Op.like]: `%${search}%` } },
                        { displayName: { [Op.like]: `%${search}%` } },
                        { description: { [Op.like]: `%${search}%` } }
                    ]
                };
            }

            // 查詢分頁數據
            const { count: totalCount, rows: data } = await RoleModel.findAndCountAll({
                where: whereCondition,
                include: [includeCondition],
                order: [[sortBy, sortOrder]],
                limit: pageSize,
                offset: offset
            });

            const result: PaginatedResult<RoleModel> = {
                data,
                totalCount,
                currentPage: page,
                pageSize
            };

            logger.info(`Successfully fetched roles by permission: permissionId ${permissionId}, page ${page}, ${data.length}/${totalCount} records`);
            return result;
        } catch (error) {
            logger.error('Error fetching roles by permission paginated', { permissionId, pagination, error });
            throw error;
        }
    };

    /**
     * 根據用戶分頁查詢角色
     * 
     * @param {number} userId - 用戶 ID
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<RoleModel>>} 分頁結果
     */
    getRolesByUserPaginated = async (
        userId: number,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<RoleModel>> => {
        try {
            const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'DESC', search } = pagination;
            const offset = (page - 1) * pageSize;

            logger.info('Fetching roles by user paginated', { userId, pagination });

            // 建立查詢條件
            const includeCondition: any = {
                model: UserModel,
                as: 'users',
                where: { id: userId },
                through: { attributes: [] }
            };

            let whereCondition: any = {};

            // 搜尋條件
            if (search) {
                whereCondition = {
                    [Op.or]: [
                        { name: { [Op.like]: `%${search}%` } },
                        { displayName: { [Op.like]: `%${search}%` } },
                        { description: { [Op.like]: `%${search}%` } }
                    ]
                };
            }

            // 查詢分頁數據
            const { count: totalCount, rows: data } = await RoleModel.findAndCountAll({
                where: whereCondition,
                include: [includeCondition],
                order: [[sortBy, sortOrder]],
                limit: pageSize,
                offset: offset
            });

            const result: PaginatedResult<RoleModel> = {
                data,
                totalCount,
                currentPage: page,
                pageSize
            };

            logger.info(`Successfully fetched roles by user: userId ${userId}, page ${page}, ${data.length}/${totalCount} records`);
            return result;
        } catch (error) {
            logger.error('Error fetching roles by user paginated', { userId, pagination, error });
            throw error;
        }
    };
}