/**
 * @fileoverview 權限查詢 Service 實現
 *
 * 此文件實作了權限查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module PermissionQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { PermissionQueriesRepo } from '../../repo/queries/PermissionQueriesRepo.js';
import { TYPES } from '../../container/types.js';
import type { PermissionModel } from '../../models/PermissionModel.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { LoggerDecorator } from 'aiot-shared-packages';
import { PaginationRequestDto, PaginatedResult } from '../../dto/index.js';
import { DtoMapper } from '../../utils/dtoMapper.js';
import {
    PermissionResponseDto,
    PermissionListResponseDto,
    PermissionStatisticsResponseDto
} from '../../dto/index.js';

const logger = createLogger('PermissionQueriesSvc');

/**
 * 權限查詢 Service 實現類別
 *
 * 專門處理權限相關的查詢請求，包含取得權限資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class PermissionQueriesSvc
 * @since 1.0.0
 */
@injectable()
export class PermissionQueriesSvc {
    private permissionRepo: PermissionQueriesRepo;

    constructor(
        @inject(TYPES.PermissionQueriesRepo) permissionRepo: PermissionQueriesRepo
    ) {
        this.permissionRepo = permissionRepo;
    }

    /**
     * 分頁查詢所有權限（新增統一方法）
     */
    getAllPermissionsPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('分頁查詢所有權限', { pagination });

            const result = await this.permissionRepo.getAllPermissionsPaginated(pagination);
            const paginatedResponse = DtoMapper.toPaginatedPermissionResponse(result);

            logger.info(`成功獲取 ${result.data.length} 個權限，總共 ${result.totalCount} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('分頁查詢權限失敗', { error });
            throw error;
        }
    };

    /**
     * 根據資源分頁查詢權限（新增統一方法）
     */
    getPermissionsByResourcePaginated = async (
        resource: string,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據資源分頁查詢權限', { resource, pagination });

            const result = await this.permissionRepo.getPermissionsByResourcePaginated(resource, pagination);
            const paginatedResponse = DtoMapper.toPaginatedPermissionResponse(result);

            logger.info(`成功獲取資源 ${resource} 的權限 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據資源分頁查詢權限失敗', { error, resource });
            throw error;
        }
    };

    /**
     * 根據動作分頁查詢權限（新增統一方法）
     */
    getPermissionsByActionPaginated = async (
        action: string,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據動作分頁查詢權限', { action, pagination });

            const result = await this.permissionRepo.getPermissionsByActionPaginated(action, pagination);
            const paginatedResponse = DtoMapper.toPaginatedPermissionResponse(result);

            logger.info(`成功獲取動作 ${action} 的權限 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據動作分頁查詢權限失敗', { error, action });
            throw error;
        }
    };

    /**
     * 根據類型分頁查詢權限（新增統一方法）
     */
    getPermissionsByTypePaginated = async (
        type: string,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據類型分頁查詢權限', { type, pagination });

            const result = await this.permissionRepo.getPermissionsByTypePaginated(type, pagination);
            const paginatedResponse = DtoMapper.toPaginatedPermissionResponse(result);

            logger.info(`成功獲取類型為 ${type} 的權限 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據類型分頁查詢權限失敗', { error, type });
            throw error;
        }
    };

    /**
     * 根據狀態分頁查詢權限（新增統一方法）
     */
    getPermissionsByStatusPaginated = async (
        status: string,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據狀態分頁查詢權限', { status, pagination });

            const result = await this.permissionRepo.getPermissionsByStatusPaginated(status, pagination);
            const paginatedResponse = DtoMapper.toPaginatedPermissionResponse(result);

            logger.info(`成功獲取狀態為 ${status} 的權限 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據狀態分頁查詢權限失敗', { error, status });
            throw error;
        }
    };
}