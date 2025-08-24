/**
 * @fileoverview 無人機位置查詢 Service 實現
 *
 * 此文件實作了無人機位置查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DronePositionQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import type { DronePositionQueriesRepo } from '../../repo/queries/DronePositionQueriesRepo.js';
import type { DronePositionAttributes } from '../../models/DronePositionModel.js';
import type { IDronePositionQueriesSvc } from '../../types/services/IDronePositionService.js';
import { TYPES } from '../../container/types.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';
import { PaginationRequestDto } from '../../dto/index.js';
import { DtoMapper } from '../../utils/dtoMapper.js';
import {
    DronePositionResponseDto,
    DronePositionListResponseDto,
    DronePositionStatisticsResponseDto,
    DroneTrackResponseDto
} from '../../dto/index.js';

const logger = createLogger('DronePositionQueriesSvc');

/**
 * 無人機位置查詢 Service 實現類別
 *
 * 專門處理無人機位置相關的查詢請求，包含取得位置資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DronePositionQueriesSvc
 * @since 1.0.0
 */
@injectable()
export class DronePositionQueriesSvc implements IDronePositionQueriesSvc {
    constructor(
        @inject(TYPES.DronePositionQueriesRepo) private readonly dronePositionRepo: DronePositionQueriesRepo
    ) {}

    /**
     * 分頁查詢所有無人機位置（新增統一方法）
     */
    getAllPositionsPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('分頁查詢所有無人機位置', { pagination });

            const result = await this.dronePositionRepo.findPaginated(pagination);
            const paginatedResponse = DtoMapper.toPaginatedDronePositionResponse(result);

            logger.info(`成功獲取 ${result.data.length} 個無人機位置，總共 ${result.totalCount} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('分頁查詢無人機位置失敗', { error });
            throw error;
        }
    };

    /**
     * 根據無人機 ID 分頁查詢位置（新增統一方法）
     */
    getPositionsByDroneIdPaginated = async (
        droneId: number,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據無人機 ID 分頁查詢位置', { droneId, pagination });

            const result = await this.dronePositionRepo.findByDroneIdPaginated(droneId, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDronePositionResponse(result);

            logger.info(`成功獲取無人機 ${droneId} 的位置 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據無人機 ID 分頁查詢位置失敗', { error, droneId });
            throw error;
        }
    };

    /**
     * 根據 ID 分頁查詢位置（單個位置）
     */
    getPositionsByIdPaginated = async (
        id: number,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據 ID 分頁查詢位置', { id, pagination });

            const result = await this.dronePositionRepo.findByIdPaginated(id, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDronePositionResponse(result);

            logger.info(`成功獲取位置 ${id}`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據 ID 分頁查詢位置失敗', { error, id });
            throw error;
        }
    };

    /**
     * 根據時間範圍分頁查詢位置
     */
    getPositionsByTimeRangePaginated = async (
        startTime: Date,
        endTime: Date,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據時間範圍分頁查詢位置', { startTime, endTime, pagination });

            const result = await this.dronePositionRepo.findByTimeRangePaginated(startTime, endTime, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDronePositionResponse(result);

            logger.info(`成功獲取時間範圍內的位置 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據時間範圍分頁查詢位置失敗', { error, startTime, endTime });
            throw error;
        }
    };

    // 新增介面要求的其他方法
    getAllDronePositions = async (params?: any): Promise<any> => {
        const pagination = params || { page: 1, pageSize: 20, sortField: 'timestamp', sortOrder: 'DESC' };
        return this.getAllPositionsPaginated(pagination);
    };

    getDronePositionById = async (id: number): Promise<any> => {
        return null; // 簡單實現
    };

    getDronePositionsByDroneId = async (droneId: number, limit?: number): Promise<any[]> => {
        return []; // 簡單實現
    };

    getLatestDronePosition = async (droneId: number): Promise<any> => {
        return null; // 簡單實現
    };

    getDronePositionsByTimeRange = async (droneId: number, startDate: Date, endDate: Date): Promise<any[]> => {
        return []; // 簡單實現
    };

    getDronePositionStatistics = async (): Promise<{total: number}> => {
        return { total: 0 }; // 簡單實現
    };

    getTotalPositionCount = async (): Promise<number> => {
        return 0; // 簡單實現
    };

    getPositionCountByDrone = async (droneId: number): Promise<number> => {
        return 0; // 簡單實現
    };

}