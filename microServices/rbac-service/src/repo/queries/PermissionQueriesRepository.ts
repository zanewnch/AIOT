/**
 * @fileoverview 權限查詢 Repository - CQRS 查詢端
 * 
 * 專門處理權限資料的查詢操作，遵循 CQRS 模式的查詢端原則。
 * 只包含讀取相關的操作方法，不包含任何寫入操作。
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-23
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { Op } from 'sequelize';
import { PermissionModel } from '../../models/PermissionModel.js';
import { RoleModel } from '../../models/RoleModel.js';
import { PaginationRequestDto, PaginatedResult } from '../../dto/index.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('PermissionQueriesRepository');

/**
 * 權限查詢 Repository 實現類別 - CQRS 查詢端
 * 
 * 專門處理權限資料的查詢操作，遵循 CQRS 模式
 * 
 * @class PermissionQueriesRepository
 */
@injectable()
export class PermissionQueriesRepository {

    /**
     * 統一分頁查詢方法
     * 
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @param {Record<string, any>} filters - 額外篩選條件
     * @returns {Promise<PaginatedResult<PermissionModel>>} 分頁結果
     */
    findPaginated = async (
        pagination: PaginationRequestDto,
        filters: Record<string, any> = {}
    ): Promise<PaginatedResult<PermissionModel>> => {
        try {
            const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'DESC', search } = pagination;
            const offset = (page - 1) * pageSize;

            logger.info('Fetching paginated permissions', { pagination, filters });

            // 建立查詢條件
            let whereCondition: any = { ...filters };

            // 搜尋條件 - 支援權限名稱、資源、動作搜尋
            if (search) {
                whereCondition = {
                    ...whereCondition,
                    [Op.or]: [
                        { name: { [Op.like]: `%${search}%` } },
                        { displayName: { [Op.like]: `%${search}%` } },
                        { resource: { [Op.like]: `%${search}%` } },
                        { action: { [Op.like]: `%${search}%` } },
                        { description: { [Op.like]: `%${search}%` } }
                    ]
                };
            }

            // 查詢分頁數據
            const { count: totalCount, rows: data } = await PermissionModel.findAndCountAll({
                where: whereCondition,
                order: [[sortBy, sortOrder]],
                limit: pageSize,
                offset: offset
            });

            const result: PaginatedResult<PermissionModel> = {
                data,
                totalCount,
                currentPage: page,
                pageSize
            };

            logger.info(`Successfully fetched paginated permissions: page ${page}, ${data.length}/${totalCount} records`);
            return result;
        } catch (error) {
            logger.error('Error fetching paginated permissions', { pagination, filters, error });
            throw error;
        }
    };

    /**
     * 分頁查詢所有權限
     * 
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<PermissionModel>>} 分頁結果
     */
    getAllPermissionsPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<PermissionModel>> => {
        return this.findPaginated(pagination);
    };

    /**
     * 根據資源分頁查詢權限
     * 
     * @param {string} resource - 權限資源
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<PermissionModel>>} 分頁結果
     */
    getPermissionsByResourcePaginated = async (
        resource: string,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<PermissionModel>> => {
        return this.findPaginated(pagination, { resource });
    };

    /**
     * 根據動作分頁查詢權限
     * 
     * @param {string} action - 權限動作
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<PermissionModel>>} 分頁結果
     */
    getPermissionsByActionPaginated = async (
        action: string,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<PermissionModel>> => {
        return this.findPaginated(pagination, { action });
    };

    /**
     * 根據類型分頁查詢權限
     * 
     * @param {string} type - 權限類型
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<PermissionModel>>} 分頁結果
     */
    getPermissionsByTypePaginated = async (
        type: string,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<PermissionModel>> => {
        return this.findPaginated(pagination, { type });
    };

    /**
     * 根據角色分頁查詢權限
     * 
     * @param {number} roleId - 角色 ID
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<PaginatedResult<PermissionModel>>} 分頁結果
     */
    getPermissionsByRolePaginated = async (
        roleId: number,
        pagination: PaginationRequestDto
    ): Promise<PaginatedResult<PermissionModel>> => {
        try {
            const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'DESC', search } = pagination;
            const offset = (page - 1) * pageSize;

            logger.info('Fetching permissions by role paginated', { roleId, pagination });

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
                        { name: { [Op.like]: `%${search}%` } },
                        { displayName: { [Op.like]: `%${search}%` } },
                        { resource: { [Op.like]: `%${search}%` } },
                        { action: { [Op.like]: `%${search}%` } },
                        { description: { [Op.like]: `%${search}%` } }
                    ]
                };
            }

            // 查詢分頁數據
            const { count: totalCount, rows: data } = await PermissionModel.findAndCountAll({
                where: whereCondition,
                include: [includeCondition],
                order: [[sortBy, sortOrder]],
                limit: pageSize,
                offset: offset
            });

            const result: PaginatedResult<PermissionModel> = {
                data,
                totalCount,
                currentPage: page,
                pageSize
            };

            logger.info(`Successfully fetched permissions by role: roleId ${roleId}, page ${page}, ${data.length}/${totalCount} records`);
            return result;
        } catch (error) {
            logger.error('Error fetching permissions by role paginated', { roleId, pagination, error });
            throw error;
        }
    };
}