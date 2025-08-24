/**
 * @fileoverview 無人機位置歷史歸檔查詢 Service 實現
 *
 * 此文件實作了無人機位置歷史歸檔查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DronePositionsArchiveQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { DronePositionsArchiveQueriesRepo } from '../../repo/queries/DronePositionsArchiveQueriesRepo.js';
import type { DronePositionsArchiveAttributes } from '../../models/DronePositionsArchiveModel.js';
import { PaginationRequestDto } from '../../dto/index.js';
import { DtoMapper } from '../../utils/dtoMapper.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('DronePositionsArchiveQueriesSvc');

/**
 * 無人機位置歷史歸檔查詢 Service 實現類別
 *
 * 專門處理無人機位置歷史歸檔相關的查詢請求，包含取得歷史資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DronePositionsArchiveQueriesSvc
 * @since 1.0.0
 */
@injectable()
export class DronePositionsArchiveQueriesSvc {
    constructor(
        @inject(TYPES.DronePositionsArchiveQueriesRepo)
        private readonly archiveRepo: DronePositionsArchiveQueriesRepo
    ) {}

    /**
     * 分頁查詢所有位置歷史歸檔（新增統一方法）
     */
    getAllPositionsArchivePaginated = async (
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('分頁查詢所有位置歷史歸檔', { pagination });

            const result = await this.archiveRepo.findPaginated(pagination);
            const paginatedResponse = DtoMapper.toPaginatedDronePositionsArchiveResponse(result);

            logger.info(`成功獲取 ${result.data.length} 個位置歷史歸檔，總共 ${result.totalCount} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('分頁查詢位置歷史歸檔失敗', { error });
            throw error;
        }
    };

    /**
     * 根據無人機 ID 分頁查詢位置歷史歸檔（新增統一方法）
     */
    getPositionsArchiveByDroneIdPaginated = async (
        droneId: number,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據無人機 ID 分頁查詢位置歷史歸檔', { droneId, pagination });

            const result = await this.archiveRepo.findByDroneIdPaginated(droneId, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDronePositionsArchiveResponse(result);

            logger.info(`成功獲取無人機 ${droneId} 的位置歷史歸檔 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據無人機 ID 分頁查詢位置歷史歸檔失敗', { error, droneId });
            throw error;
        }
    };

    /**
     * 根據批次 ID 分頁查詢位置歷史歸檔（新增統一方法）
     */
    getPositionsArchiveByBatchIdPaginated = async (
        batchId: string,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據批次 ID 分頁查詢位置歷史歸檔', { batchId, pagination });

            const result = await this.archiveRepo.findByBatchIdPaginated(batchId, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDronePositionsArchiveResponse(result);

            logger.info(`成功獲取批次 ${batchId} 的位置歷史歸檔 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據批次 ID 分頁查詢位置歷史歸檔失敗', { error, batchId });
            throw error;
        }
    };

    /**
     * 根據時間範圍分頁查詢位置歷史歸檔（新增統一方法）
     */
    getPositionsArchiveByTimeRangePaginated = async (
        startTime: Date,
        endTime: Date,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據時間範圍分頁查詢位置歷史歸檔', { startTime, endTime, pagination });

            const result = await this.archiveRepo.findByTimeRangePaginated(startTime, endTime, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDronePositionsArchiveResponse(result);

            logger.info(`成功獲取時間範圍內的位置歷史歸檔 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據時間範圍分頁查詢位置歷史歸檔失敗', { error, startTime, endTime });
            throw error;
        }
    };


}