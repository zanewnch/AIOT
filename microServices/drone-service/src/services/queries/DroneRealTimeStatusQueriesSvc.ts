/**
 * @fileoverview 無人機即時狀態查詢 Service 實現
 *
 * 此文件實作了無人機即時狀態查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneRealTimeStatusQueriesService
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { DroneRealTimeStatusQueriesRepo } from '../../repo/queries/DroneRealTimeStatusQueriesRepo.js';
import { 
    DroneRealTimeStatusModel, 
    DroneRealTimeStatus,
    DroneRealTimeStatusAttributes
} from '../../models/DroneRealTimeStatusModel.js';
import { PaginationRequestDto } from '../../dto/index.js';
import { DtoMapper } from '../../utils/dtoMapper.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('DroneRealTimeStatusQueriesService');

/**
 * 無人機即時狀態查詢 Service 實現類別
 *
 * 專門處理無人機即時狀態相關的查詢請求，包含取得狀態資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneRealTimeStatusQueriesService
 * @since 1.0.0
 */
@injectable()
export class DroneRealTimeStatusQueriesSvc {
    private droneRealTimeStatusQueriesRepo: DroneRealTimeStatusQueriesRepo;

    constructor(
        @inject(TYPES.DroneRealTimeStatusQueriesRepo) droneRealTimeStatusQueriesRepo: DroneRealTimeStatusQueriesRepo
    ) {
        this.droneRealTimeStatusQueriesRepo = droneRealTimeStatusQueriesRepo;
    }

    /**
     * 分頁查詢所有即時狀態（新增統一方法）
     */
    getAllRealTimeStatusesPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('分頁查詢所有即時狀態', { pagination });

            const result = await this.droneRealTimeStatusQueriesRepo.findPaginated(pagination);
            const paginatedResponse = DtoMapper.toPaginatedDroneRealTimeStatusResponse(result);

            logger.info(`成功獲取 ${result.data.length} 個即時狀態，總共 ${result.totalCount} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('分頁查詢即時狀態失敗', { error });
            throw error;
        }
    };

    /**
     * 根據無人機 ID 分頁查詢即時狀態（新增統一方法）
     */
    getRealTimeStatusesByDroneIdPaginated = async (
        droneId: number,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據無人機 ID 分頁查詢即時狀態', { droneId, pagination });

            const result = await this.droneRealTimeStatusQueriesRepo.findByDroneIdPaginated(droneId, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDroneRealTimeStatusResponse(result);

            logger.info(`成功獲取無人機 ${droneId} 的即時狀態 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據無人機 ID 分頁查詢即時狀態失敗', { error, droneId });
            throw error;
        }
    };

    /**
     * 根據狀態分頁查詢即時狀態（新增統一方法）
     */
    getRealTimeStatusesByStatusPaginated = async (
        status: DroneRealTimeStatus,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據狀態分頁查詢即時狀態', { status, pagination });

            const result = await this.droneRealTimeStatusQueriesRepo.findByStatusPaginated(status, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDroneRealTimeStatusResponse(result);

            logger.info(`成功獲取狀態為 ${status} 的即時狀態 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據狀態分頁查詢即時狀態失敗', { error, status });
            throw error;
        }
    };

    /**
     * 根據連線狀態分頁查詢即時狀態（新增統一方法）
     */
    getRealTimeStatusesByConnectionPaginated = async (
        isConnected: boolean,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據連線狀態分頁查詢即時狀態', { isConnected, pagination });

            const result = await this.droneRealTimeStatusQueriesRepo.findByConnectionPaginated(isConnected, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDroneRealTimeStatusResponse(result);

            logger.info(`成功獲取連線狀態為 ${isConnected} 的即時狀態 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據連線狀態分頁查詢即時狀態失敗', { error, isConnected });
            throw error;
        }
    };

}