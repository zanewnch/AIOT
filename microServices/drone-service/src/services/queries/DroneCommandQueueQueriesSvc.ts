/**
 * @fileoverview 無人機指令佇列查詢 Service 實現
 *
 * 此文件實作了無人機指令佇列查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneCommandQueueQueriesService
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { DroneCommandQueueStatus } from '../../models/DroneCommandQueueModel.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { PaginationRequestDto } from '../../dto/index.js';
import { TYPES } from '../../container/types.js';
import { DtoMapper } from '../../utils/dtoMapper.js';
import { DroneCommandQueueQueriesRepo } from '../../repo/queries/DroneCommandQueueQueriesRepo.js';

const logger = createLogger('DroneCommandQueueQueriesService');

/**
 * 無人機指令佇列查詢 Service 實現類別
 *
 * 專門處理無人機指令佇列相關的查詢請求，包含取得佇列資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneCommandQueueQueriesService
 * @since 1.0.0
 */
@injectable()
export class DroneCommandQueueQueriesSvc {

    constructor(
        @inject(TYPES.DroneCommandQueueQueriesRepo)
        private readonly droneCommandQueueQueriesRepo: DroneCommandQueueQueriesRepo
    ) {
    }

    /**
     * 分頁查詢所有指令佇列（新增統一方法）
     */
    getAllDroneCommandQueuesPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('分頁查詢所有指令佇列', { pagination });

            const result = await this.droneCommandQueueQueriesRepo.findPaginated(pagination);
            // 將 DroneCommandQueueModel 映射為 DroneCommandModel 兼容格式
            const adaptedResult = {
                ...result,
                data: result.data.map((queue: any) => ({
                    ...queue,
                    command_data: {},
                    issued_by: 1,
                    issued_at: queue.createdAt || new Date(),
                    executed_at: null,
                    completed_at: null,
                    error_message: '',
                    retry_count: 0
                }))
            };
            const paginatedResponse = DtoMapper.toPaginatedDroneCommandResponse(adaptedResult);

            logger.info(`成功獲取 ${result.data.length} 個指令佇列，總共 ${result.totalCount} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('分頁查詢指令佇列失敗', { error });
            throw error;
        }
    };

    /**
     * 根據無人機 ID 分頁查詢指令佇列（新增統一方法）
     */
    getDroneCommandQueuesByDroneIdPaginated = async (
        droneId: number,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據無人機 ID 分頁查詢指令佇列', { droneId, pagination });

            const result = await this.droneCommandQueueQueriesRepo.findByDroneIdPaginated(droneId, pagination);
            // 將 DroneCommandQueueModel 映射為 DroneCommandModel 兼容格式
            const adaptedResult = {
                ...result,
                data: result.data.map((queue: any) => ({
                    ...queue,
                    command_data: {},
                    issued_by: 1,
                    issued_at: queue.createdAt || new Date(),
                    executed_at: null,
                    completed_at: null,
                    error_message: '',
                    retry_count: 0
                }))
            };
            const paginatedResponse = DtoMapper.toPaginatedDroneCommandResponse(adaptedResult);

            logger.info(`成功獲取無人機 ${droneId} 的指令佇列 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據無人機 ID 分頁查詢指令佇列失敗', { error, droneId });
            throw error;
        }
    };

    /**
     * 根據狀態分頁查詢指令佇列（新增統一方法）
     */
    getDroneCommandQueuesByStatusPaginated = async (
        status: DroneCommandQueueStatus,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據狀態分頁查詢指令佇列', { status, pagination });

            const result = await this.droneCommandQueueQueriesRepo.findByStatusPaginated(status, pagination);
            // 將 DroneCommandQueueModel 映射為 DroneCommandModel 兼容格式
            const adaptedResult = {
                ...result,
                data: result.data.map((queue: any) => ({
                    ...queue,
                    command_data: {},
                    issued_by: 1,
                    issued_at: queue.createdAt || new Date(),
                    executed_at: null,
                    completed_at: null,
                    error_message: '',
                    retry_count: 0
                }))
            };
            const paginatedResponse = DtoMapper.toPaginatedDroneCommandResponse(adaptedResult);

            logger.info(`成功獲取狀態為 ${status} 的指令佇列 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據狀態分頁查詢指令佇列失敗', { error, status });
            throw error;
        }
    };

    /**
     * 根據優先級分頁查詢指令佇列（新增統一方法）
     */
    getDroneCommandQueuesByPriorityPaginated = async (
        priority: number,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('根據優先級分頁查詢指令佇列', { priority, pagination });

            const result = await this.droneCommandQueueQueriesRepo.findByPriorityPaginated(priority, pagination);
            // 將 DroneCommandQueueModel 映射為 DroneCommandModel 兼容格式
            const adaptedResult = {
                ...result,
                data: result.data.map((queue: any) => ({
                    ...queue,
                    command_data: {},
                    issued_by: 1,
                    issued_at: queue.createdAt || new Date(),
                    executed_at: null,
                    completed_at: null,
                    error_message: '',
                    retry_count: 0
                }))
            };
            const paginatedResponse = DtoMapper.toPaginatedDroneCommandResponse(adaptedResult);

            logger.info(`成功獲取優先級為 ${priority} 的指令佇列 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            logger.error('根據優先級分頁查詢指令佇列失敗', { error, priority });
            throw error;
        }
    };

}