/**
 * @fileoverview 角色權限關聯查詢 Service 實現
 *
 * 此文件實作了角色權限關聯查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module RoleToPermissionQueriesService
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { RolePermissionQueriesRepository } from '../../repo/queries/RolePermissionQueriesRepository.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { PaginationRequestDto } from '../../dto/index.js';
import { DtoMapper } from '../../utils/dtoMapper.js';

const logger = createLogger('RoleToPermissionQueriesService');

/**
 * 角色權限關聯查詢 Service 實現類別
 *
 * 專門處理角色權限關聯相關的查詢請求，包含分頁查詢等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class RoleToPermissionQueriesService
 * @since 1.0.0
 */
@injectable()
export class RoleToPermissionQueriesService {
    constructor(
        @inject(TYPES.RolePermissionQueriesRepository)
        private readonly rolePermissionQueriesRepository: RolePermissionQueriesRepository
    ) {}

    /**
     * 分頁查詢所有角色權限關聯
     */
    getAllRolePermissionsPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('Getting paginated role permission associations', { pagination });

            const result = await this.rolePermissionQueriesRepository.findPaginated(pagination);
            const paginatedResponse = DtoMapper.toPaginatedRolePermissionResponse(result);

            logger.info(`Successfully retrieved ${result.data.length} role permission associations from ${result.totalCount} total`);
            return paginatedResponse;
        } catch (error) {
            logger.error('Error getting paginated role permission associations', { error });
            throw error;
        }
    };

    /**
     * 根據角色 ID 分頁查詢權限關聯
     */
    getRolePermissionsByRoleIdPaginated = async (
        roleId: number,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('Getting paginated permissions by role ID', { roleId, pagination });

            if (!roleId || roleId <= 0) {
                throw new Error('角色 ID 必須是正整數');
            }

            const result = await this.rolePermissionQueriesRepository.findByRoleIdPaginated(roleId, pagination);
            const paginatedResponse = DtoMapper.toPaginatedRolePermissionResponse(result);

            logger.info(`Successfully retrieved ${result.data.length} permission associations for role ${roleId}`);
            return paginatedResponse;
        } catch (error) {
            logger.error('Error getting paginated permissions by role ID', { error, roleId });
            throw error;
        }
    };

    /**
     * 根據權限 ID 分頁查詢角色關聯
     */
    getRolePermissionsByPermissionIdPaginated = async (
        permissionId: number,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('Getting paginated roles by permission ID', { permissionId, pagination });

            if (!permissionId || permissionId <= 0) {
                throw new Error('權限 ID 必須是正整數');
            }

            const result = await this.rolePermissionQueriesRepository.findByPermissionIdPaginated(permissionId, pagination);
            const paginatedResponse = DtoMapper.toPaginatedRolePermissionResponse(result);

            logger.info(`Successfully retrieved ${result.data.length} role associations for permission ${permissionId}`);
            return paginatedResponse;
        } catch (error) {
            logger.error('Error getting paginated roles by permission ID', { error, permissionId });
            throw error;
        }
    };
}