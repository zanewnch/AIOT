/**
 * @fileoverview 無人機狀態查詢 Service 實現
 *
 * 此文件實作了無人機狀態查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneStatusQueriesSvc
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
import type { IDroneStatusRepository } from '../../types/repositories/IDroneStatusRepository.js';
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

const logger = createLogger('DroneStatusQueriesSvc');

/**
 * 無人機狀態查詢 Service 實現類別
 *
 * 專門處理無人機狀態相關的查詢請求，包含取得狀態資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneStatusQueriesSvc
 * @since 1.0.0
 */
@injectable()
export class DroneStatusQueriesSvc {
    private droneStatusRepo: DroneStatusQueriesRepo;

    constructor(
        @inject(TYPES.DroneStatusQueriesRepo) droneStatusRepo: DroneStatusQueriesRepo
    ) {
        this.droneStatusRepo = droneStatusRepo;
    }

    /**
     * 分頁查詢所有無人機狀態（新增統一方法）
     */
    getAllStatusesPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('分頁查詢所有無人機狀態', { pagination });

            const result = await this.droneStatusRepo.findPaginated(pagination);
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

            const result = await this.droneStatusRepo.findByStatusPaginated(status, pagination);
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

            const result = await this.droneStatusRepo.findByDroneIdPaginated(droneId, pagination);
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
            const result = await this.droneStatusRepo.findBySerial(serial);
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

            const result = await this.droneStatusRepo.findById(id);
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

            const result = await this.droneStatusRepo.findAllByStatus(status);
            const dtos = result.map(item => DtoMapper.toDroneStatusResponseDto(item));

            logger.info(`成功獲取狀態為 ${status} 的無人機 ${result.length} 個`);
            return dtos;
        } catch (error) {
            logger.error('根據狀態獲取無人機列表失敗', { error, status });
            throw error;
        }
    };

}