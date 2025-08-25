/**
 * @fileoverview 角色查詢 Service 實現
 *
 * 此文件實作了角色查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module RoleQueriesService
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { RoleQueriesRepository } from '../../repo/queries/RoleQueriesRepository.js';
import { TYPES } from '../../container/types.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { PaginationRequestDto } from '../../dto/index.js';
import { DtoMapper } from '../../utils/dtoMapper.js';

const logger = createLogger('RoleQueriesService');

/**
 * 角色查詢 Service 實現類別
 *
 * 專門處理角色相關的查詢請求，包含取得角色資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class RoleQueriesService
 * @since 1.0.0
 */
@injectable()
export class RoleQueriesService {
    private roleRepository: RoleQueriesRepository;

    constructor(
        @inject(TYPES.RoleQueriesRepository) roleRepository: RoleQueriesRepository
    ) {
        this.roleRepository = roleRepository;
    }

    /**
     * 分頁查詢所有角色（新增統一方法）
     */
    getAllRolesPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('分頁查詢所有角色', { pagination });

            const result = await this.roleRepository.getAllRolesPaginated(pagination);
            const paginatedResponse = DtoMapper.toPaginatedRoleResponse(result);

            logger.info(`成功獲取 ${result.data.length} 個角色，總共 ${result.totalCount} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('分頁查詢角色失敗', { error });
            throw error;
        }
    };

    /**
     * 根據類型分頁查詢角色（新增統一方法）
     */
    getRolesByTypePaginated = async (
        type: string,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據類型分頁查詢角色', { type, pagination });

            const result = await this.roleRepository.getRolesByTypePaginated(type, pagination);
            const paginatedResponse = DtoMapper.toPaginatedRoleResponse(result);

            logger.info(`成功獲取類型為 ${type} 的角色 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據類型分頁查詢角色失敗', { error, type });
            throw error;
        }
    };

    /**
     * 根據狀態分頁查詢角色（新增統一方法）
     */
    getRolesByStatusPaginated = async (
        status: string,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據狀態分頁查詢角色', { status, pagination });

            const result = await this.roleRepository.getRolesByStatusPaginated(status, pagination);
            const paginatedResponse = DtoMapper.toPaginatedRoleResponse(result);

            logger.info(`成功獲取狀態為 ${status} 的角色 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據狀態分頁查詢角色失敗', { error, status });
            throw error;
        }
    };

    /**
     * 根據權限分頁查詢角色（新增統一方法）
     */
    getRolesByPermissionPaginated = async (
        permissionId: number,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據權限分頁查詢角色', { permissionId, pagination });

            const result = await this.roleRepository.getRolesByPermissionPaginated(permissionId, pagination);
            const paginatedResponse = DtoMapper.toPaginatedRoleResponse(result);

            logger.info(`成功獲取權限 ${permissionId} 的角色 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據權限分頁查詢角色失敗', { error, permissionId });
            throw error;
        }
    };

    // Basic CRUD methods for gRPC compatibility
    getRoles = async () => {
        // Stub implementation - return empty array
        return [];
    };

    getRoleById = async (_id: string) => {
        // Stub implementation - return null
        return null;
    };
}