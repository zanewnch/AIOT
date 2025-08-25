/**
 * @fileoverview 無人機狀態查詢 Service 實現
 *
 * 此文件實作了無人機狀態查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneStatusQueriesService
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { DroneStatusQueriesRepo } from '../../repo/queries/DroneStatusQueriesRepo.js';
import { TYPES } from '../../container/types.js';
import type { DroneStatusAttributes } from '../../models/DroneStatusModel.js';
import { DroneStatus } from '../../models/DroneStatusModel.js';
import type { IDroneStatusQueriesSvc } from '../../types/services/IDroneStatusSvc.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';
import { PaginationParams, PaginatedResult, PaginationUtils } from '../../types/PaginationTypes.js';
import { PaginationRequestDto } from '../../dto/index.js';
import { DtoMapper } from '../../utils/dtoMapper.js';
import {
    DroneStatusResponseDto,
    DroneStatusListResponseDto,
    DroneStatusStatisticsResponseDto
} from '../../dto/index.js';

const logger = createLogger('DroneStatusQueriesService');

/**
 * 無人機狀態查詢 Service 實現類別
 *
 * 專門處理無人機狀態相關的查詢請求，包含取得狀態資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneStatusQueriesService
 * @since 1.0.0
 */
@injectable()
export class DroneStatusQueriesSvc implements IDroneStatusQueriesSvc {
    private droneStatusQueriesRepo: DroneStatusQueriesRepo;

    constructor(
        @inject(TYPES.DroneStatusQueriesRepo) droneStatusQueriesRepo: DroneStatusQueriesRepo
    ) {
        this.droneStatusQueriesRepo = droneStatusQueriesRepo;
    }

    /**
     * 分頁查詢所有無人機狀態（新增統一方法）
     */
    getAllStatusesPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('分頁查詢所有無人機狀態', { pagination });

            const result = await this.droneStatusQueriesRepo.findPaginated(pagination);
            const paginatedResponse = DtoMapper.toPaginatedDroneStatusResponse(result);

            logger.info(`成功獲取 ${result.data.length} 個無人機狀態，總共 ${result.totalCount} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('分頁查詢無人機狀態失敗', { error });
            throw error;
        }
    };

    /**
     * 根據狀態分頁查詢無人機（新增統一方法）
     */
    getStatusesByStatusPaginated = async (
        status: DroneStatus,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據狀態分頁查詢無人機狀態', { status, pagination });

            const result = await this.droneStatusQueriesRepo.findByStatusPaginated(status, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDroneStatusResponse(result);

            logger.info(`成功獲取狀態為 ${status} 的無人機狀態 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據狀態分頁查詢無人機狀態失敗', { error, status });
            throw error;
        }
    };

    /**
     * 根據無人機 ID 分頁查詢狀態
     */
    getStatusesByDroneIdPaginated = async (
        droneId: number,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據無人機 ID 分頁查詢狀態', { droneId, pagination });

            const result = await this.droneStatusQueriesRepo.findByDroneIdPaginated(droneId, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDroneStatusResponse(result);

            logger.info(`成功獲取無人機 ${droneId} 的狀態 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據無人機 ID 分頁查詢狀態失敗', { error, droneId });
            throw error;
        }
    };

    /**
     * 檢查無人機序列號是否存在
     */
    isDroneSerialExists = async (serial: string): Promise<boolean> => {
        try {
            logger.info('檢查無人機序列號是否存在', { serial });
            
            // 假設在無人機狀態表中檢查
            const result = await this.droneStatusQueriesRepo.findBySerial(serial);
            return result !== null;
        } catch (error) {
            logger.error('檢查無人機序列號失敗', { error, serial });
            throw error;
        }
    };

    /**
     * 根據 ID 獲取無人機狀態
     */
    getDroneStatusById = async (id: number): Promise<any> => {
        try {
            logger.info('根據 ID 獲取無人機狀態', { id });

            const result = await this.droneStatusQueriesRepo.findById(id);
            if (!result) {
                return null;
            }

            const dto = DtoMapper.toDroneStatusResponseDto(result);
            logger.info(`成功獲取無人機狀態 ${id}`);
            return dto;
        } catch (error) {
            logger.error('根據 ID 獲取無人機狀態失敗', { error, id });
            throw error;
        }
    };

    /**
     * 根據狀態獲取無人機列表
     */
    getDronesByStatus = async (status: DroneStatus): Promise<any[]> => {
        try {
            logger.info('根據狀態獲取無人機列表', { status });

            const result = await this.droneStatusQueriesRepo.findAllByStatus(status);
            const dtos = result.map((item: any) => DtoMapper.toDroneStatusResponseDto(item));

            logger.info(`成功獲取狀態為 ${status} 的無人機 ${result.length} 個`);
            return dtos;
        } catch (error) {
            logger.error('根據狀態獲取無人機列表失敗', { error, status });
            throw error;
        }
    };

    // 接口要求的方法實現

    /**
     * 獲取所有無人機狀態
     */
    getAllDroneStatuses = async (params?: any): Promise<any> => {
        const pagination = params || { page: 1, pageSize: 20, sortBy: 'updatedAt', sortOrder: 'DESC', offset: 0 };
        return this.getAllStatusesPaginated(pagination);
    };

    /**
     * 根據無人機 ID 獲取狀態列表
     */
    getDroneStatusesByDroneId = async (droneId: string): Promise<DroneStatusAttributes[]> => {
        try {
            const pagination = { page: 1, pageSize: 50, sortBy: 'updatedAt', sortOrder: 'DESC' as const, offset: 0 };
            const result = await this.droneStatusQueriesRepo.findByDroneIdPaginated(parseInt(droneId), pagination);
            return result.data;
        } catch (error) {
            logger.error('根據無人機ID獲取狀態記錄失敗', { droneId, error });
            return [];
        }
    };

    /**
     * 獲取無人機最新狀態
     */
    getLatestDroneStatus = async (): Promise<DroneStatusAttributes | null> => {
        try {
            const pagination = { page: 1, pageSize: 1, sortBy: 'updatedAt', sortOrder: 'DESC' as const, offset: 0 };
            const result = await this.droneStatusQueriesRepo.findPaginated(pagination);
            return result.data.length > 0 ? result.data[0] : null;
        } catch (error) {
            logger.error('獲取最新狀態記錄失敗', { error });
            return null;
        }
    };

    /**
     * 根據時間範圍獲取狀態記錄
     */
    getDroneStatusesByTimeRange = async (startDate: Date, endDate: Date): Promise<DroneStatusAttributes[]> => {
        try {
            const pagination = { page: 1, pageSize: 100, sortBy: 'updatedAt', sortOrder: 'ASC' as const, offset: 0 };
            const result = await this.droneStatusQueriesRepo.findPaginated(pagination);
            // 根據時間範圍過濾
            const filteredData = result.data.filter(status => 
                status.createdAt >= startDate && status.createdAt <= endDate
            );
            return filteredData;
        } catch (error) {
            logger.error('根據時間範圍獲取狀態記錄失敗', { startDate, endDate, error });
            return [];
        }
    };

    /**
     * 獲取狀態統計
     */
    getDroneStatusStatistics = async (): Promise<{total: number}> => {
        try {
            const pagination = { page: 1, pageSize: 1, sortBy: 'id', sortOrder: 'ASC' as const, offset: 0 };
            const result = await this.droneStatusQueriesRepo.findPaginated(pagination);
            return { total: result.totalCount };
        } catch (error) {
            logger.error('獲取狀態統計失敗', { error });
            return { total: 0 };
        }
    };

}