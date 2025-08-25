/**
 * @fileoverview 使用者角色關聯查詢 Service 實現
 *
 * 此文件實作了使用者角色關聯查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module UserToRoleQueriesService
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { UserRoleQueriesRepositorysitory } from.*Repositorysitorysitory.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { PaginationRequestDto } from '../../dto/index.js';
import { DtoMapper } from '../../utils/dtoMapper.js';

const logger = createLogger('UserToRoleQueriesService');

/**
 * 使用者角色關聯查詢 Service 實現類別
 *
 * 專門處理使用者角色關聯相關的查詢請求，包含分頁查詢等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class UserToRoleQueriesService
 * @since 1.0.0
 */
@injectable()
export class UserToRoleQueriesService {
    constructor(
        @inject(TYPES.UserRoleQueriesRepositorysitory)
        private readonly userRoleQueriesRepositorysitory: UserRoleQueriesRepositorysitory
    ) {}

    /**
     * 分頁查詢所有使用者角色關聯
     */
    getAllUserRolesPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('Getting paginated user role associations', { pagination });

            const result = await this.userRoleQueriesRepositorysitory.findPaginated(pagination);
            const paginatedResponse = DtoMapper.toPaginatedUserRoleResponse(result);

            logger.info(`Successfully retrieved ${result.data.length} user role associations from ${result.totalCount} total`);
            return paginatedResponse;
        } catch (error) {
            logger.error('Error getting paginated user role associations', { error });
            throw error;
        }
    };

    /**
     * 根據使用者 ID 分頁查詢角色關聯
     */
    getUserRolesByUserIdPaginated = async (
        userId: number,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('Getting paginated roles by user ID', { userId, pagination });

            if (!userId || userId <= 0) {
                throw new Error('使用者 ID 必須是正整數');
            }

            const result = await this.userRoleQueriesRepositorysitory.findByUserIdPaginated(userId, pagination);
            const paginatedResponse = DtoMapper.toPaginatedUserRoleResponse(result);

            logger.info(`Successfully retrieved ${result.data.length} role associations for user ${userId}`);
            return paginatedResponse;
        } catch (error) {
            logger.error('Error getting paginated roles by user ID', { error, userId });
            throw error;
        }
    };

    /**
     * 根據角色 ID 分頁查詢使用者關聯
     */
    getUserRolesByRoleIdPaginated = async (
        roleId: number,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('Getting paginated users by role ID', { roleId, pagination });

            if (!roleId || roleId <= 0) {
                throw new Error('角色 ID 必須是正整數');
            }

            const result = await this.userRoleQueriesRepositorysitory.findByRoleIdPaginated(roleId, pagination);
            const paginatedResponse = DtoMapper.toPaginatedUserRoleResponse(result);

            logger.info(`Successfully retrieved ${result.data.length} user associations for role ${roleId}`);
            return paginatedResponse;
        } catch (error) {
            logger.error('Error getting paginated users by role ID', { error, roleId });
            throw error;
        }
    };
}