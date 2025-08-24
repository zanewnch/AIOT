/**
 * @fileoverview 無人機狀態歷史查詢 Service 實現
 *
 * 此文件實作了無人機狀態歷史查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneStatusArchiveQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import type { DroneStatusArchiveAttributes } from '../../models/DroneStatusArchiveModel.js';
import { DroneStatus } from '../../models/DroneStatusModel.js';
import { DroneStatusArchiveQueriesRepo } from '../../repo/queries/DroneStatusArchiveQueriesRepo.js';
import { PaginationRequestDto } from '../../dto/index.js';
import { DtoMapper } from '../../utils/dtoMapper.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';

const logger = createLogger('DroneStatusArchiveQueriesSvc');

/**
 * 無人機狀態歷史查詢 Service 實現類別
 *
 * 專門處理無人機狀態歷史相關的查詢請求，包含取得狀態歷史資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneStatusArchiveQueriesSvc
 * @since 1.0.0
 */
@injectable()
export class DroneStatusArchiveQueriesSvc {
    constructor(
        @inject(TYPES.DroneStatusArchiveQueriesRepo)
        private readonly archiveRepository: DroneStatusArchiveQueriesRepo
    ) {}


    /**
     * 統一分頁查詢所有狀態歷史歸檔
     * 
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<any>} 分頁狀態歷史歸檔 DTO
     */
    getAllStatusArchivesPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('Getting paginated status archives', { pagination });
            const result = await this.archiveRepository.findPaginated(pagination);
            const paginatedResponse = DtoMapper.toPaginatedDroneStatusArchiveResponse(result);

            logger.info(`Successfully retrieved paginated status archives: page ${pagination.page}`);
            return paginatedResponse;
        } catch (error) {
            logger.error('Error getting paginated status archives', { pagination, error });
            throw error;
        }
    };

    /**
     * 根據無人機 ID 統一分頁查詢狀態歷史
     * 
     * @param {number} droneId - 無人機 ID
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<any>} 分頁狀態歷史歸檔 DTO
     */
    getStatusArchivesByDroneIdPaginated = async (
        droneId: number,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            // 驗證無人機 ID
            if (!droneId || droneId <= 0) {
                throw new Error('無效的無人機 ID');
            }

            logger.info('Getting paginated status archives by drone ID', { droneId, pagination });
            const result = await this.archiveRepository.findByDroneIdPaginated(droneId, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDroneStatusArchiveResponse(result);

            logger.info(`Successfully retrieved paginated status archives for drone ${droneId}: page ${pagination.page}`);
            return paginatedResponse;
        } catch (error) {
            logger.error('Error getting paginated status archives by drone ID', { droneId, pagination, error });
            throw error;
        }
    };

    /**
     * 根據狀態統一分頁查詢歷史記錄
     * 
     * @param {DroneStatus} status - 無人機狀態
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<any>} 分頁狀態歷史歸檔 DTO
     */
    getStatusArchivesByStatusPaginated = async (
        status: DroneStatus,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            // 驗證狀態
            if (!Object.values(DroneStatus).includes(status)) {
                throw new Error('無效的無人機狀態');
            }

            logger.info('Getting paginated status archives by status', { status, pagination });
            const result = await this.archiveRepository.findByStatusPaginated(status, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDroneStatusArchiveResponse(result);

            logger.info(`Successfully retrieved paginated status archives with status ${status}: page ${pagination.page}`);
            return paginatedResponse;
        } catch (error) {
            logger.error('Error getting paginated status archives by status', { status, pagination, error });
            throw error;
        }
    };

    /**
     * 根據時間範圍統一分頁查詢歷史記錄
     * 
     * @param {Date} startDate - 開始時間
     * @param {Date} endDate - 結束時間
     * @param {PaginationRequestDto} pagination - 分頁參數
     * @returns {Promise<any>} 分頁狀態歷史歸檔 DTO
     */
    getStatusArchivesByDateRangePaginated = async (
        startDate: Date,
        endDate: Date,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            // 驗證時間範圍
            if (!startDate || !endDate) {
                throw new Error('開始時間和結束時間不能為空');
            }
            if (startDate >= endDate) {
                throw new Error('開始時間必須早於結束時間');
            }

            logger.info('Getting paginated status archives by date range', { startDate, endDate, pagination });
            const result = await this.archiveRepository.findByDateRangePaginated(startDate, endDate, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDroneStatusArchiveResponse(result);

            logger.info(`Successfully retrieved paginated status archives in date range: page ${pagination.page}`);
            return paginatedResponse;
        } catch (error) {
            logger.error('Error getting paginated status archives by date range', { startDate, endDate, pagination, error });
            throw error;
        }
    };
}