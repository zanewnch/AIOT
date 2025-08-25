/**
 * @fileoverview 無人機指令歷史歸檔查詢 Service 實現
 *
 * 此文件實作了無人機指令歷史歸檔查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneCommandsArchiveQueriesService
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { DroneCommandsArchiveQueriesRepository } from '../../repositories/queries/DroneCommandsArchiveQueriesRepository.js';
import type { DroneCommandsArchiveAttributes } from '../../models/DroneCommandsArchiveModel.js';
import { PaginationRequestDto } from '../../dto/index.js';
import { DtoMapper } from '../../utils/dtoMapper.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('DroneCommandsArchiveQueriesService');

/**
 * 無人機指令歷史歸檔查詢 Service 實現類別
 *
 * 專門處理無人機指令歷史歸檔相關的查詢請求，包含取得歸檔資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneCommandsArchiveQueriesService
 * @since 1.0.0
 */
@injectable()
export class DroneCommandsArchiveQueriesService {
    constructor(
        @inject(TYPES.DroneCommandsArchiveQueriesRepositorysitory)
        private readonly archiveRepositorysitory: DroneCommandsArchiveQueriesRepositorysitory
    ) {}

    /**
     * 分頁查詢所有指令歷史歸檔（新增統一方法）
     */
    getAllCommandsArchivePaginated = async (
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('分頁查詢所有指令歷史歸檔', { pagination });

            const result = await this.archiveRepositorysitory.findPaginated(pagination);
            const paginatedResponse = DtoMapper.toPaginatedDroneCommandsArchiveResponse(result);

            logger.info(`成功獲取 ${result.data.length} 個指令歷史歸檔，總共 ${result.totalCount} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('分頁查詢指令歷史歸檔失敗', { error });
            throw error;
        }
    };

    /**
     * 根據無人機 ID 分頁查詢指令歷史歸檔（新增統一方法）
     */
    getCommandsArchiveByDroneIdPaginated = async (
        droneId: number,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據無人機 ID 分頁查詢指令歷史歸檔', { droneId, pagination });

            const result = await this.archiveRepositorysitory.findByDroneIdPaginated(droneId, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDroneCommandsArchiveResponse(result);

            logger.info(`成功獲取無人機 ${droneId} 的指令歷史歸檔 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據無人機 ID 分頁查詢指令歷史歸檔失敗', { error, droneId });
            throw error;
        }
    };

    /**
     * 根據指令類型分頁查詢歷史歸檔（新增統一方法）
     */
    getCommandsArchiveByCommandTypePaginated = async (
        commandType: string,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據指令類型分頁查詢歷史歸檔', { commandType, pagination });

            const result = await this.archiveRepositorysitory.findByCommandTypePaginated(commandType, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDroneCommandsArchiveResponse(result);

            logger.info(`成功獲取指令類型為 ${commandType} 的歷史歸檔 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據指令類型分頁查詢歷史歸檔失敗', { error, commandType });
            throw error;
        }
    };

    /**
     * 根據狀態分頁查詢歷史歸檔（新增統一方法）
     */
    getCommandsArchiveByStatusPaginated = async (
        status: string,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據狀態分頁查詢歷史歸檔', { status, pagination });

            const result = await this.archiveRepositorysitory.findByStatusPaginated(status, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDroneCommandsArchiveResponse(result);

            logger.info(`成功獲取狀態為 ${status} 的歷史歸檔 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據狀態分頁查詢歷史歸檔失敗', { error, status });
            throw error;
        }
    };

}