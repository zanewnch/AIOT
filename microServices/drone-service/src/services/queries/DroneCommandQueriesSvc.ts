/**
 * @fileoverview 無人機指令查詢 Service 實現
 *
 * 此文件實作了無人機指令查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneCommandQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import type {
    CommandStatistics,
    CommandTypeStatistics,
    DroneCommandSummary
} from '../../types/services/IDroneCommandService.js';
import type { IDroneCommandRepository } from '../../types/repositories/IDroneCommandRepository.js';
import type { DroneCommandAttributes, DroneCommandCreationAttributes, DroneCommandType, DroneCommandStatus } from '../../models/DroneCommandModel.js';
import { DroneCommandType as CommandType, DroneCommandStatus as CommandStatus } from '../../models/DroneCommandModel.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { Logger, LogService } from '../../decorators/LoggerDecorator.js';
import { PaginationRequestDto, PaginatedListResponseDto, DroneCommandResponseDto } from '../../dto/index.js';
import { DroneCommandQueriesRepo } from '../../repo/queries/DroneCommandQueriesRepo.js';
import { DtoMapper } from '../../utils/dtoMapper.js';

const logger = createLogger('DroneCommandQueriesSvc');

/**
 * 無人機指令查詢 Service 實現類別
 *
 * 專門處理無人機指令相關的查詢請求，包含取得指令資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneCommandQueriesSvc
 * @since 1.0.0
 */
@injectable()
export class DroneCommandQueriesSvc {
    constructor(
        @inject(TYPES.DroneCommandQueriesRepo)
        private readonly commandRepo: IDroneCommandRepository,
        @inject(TYPES.DroneCommandQueriesRepo)
        private readonly queriesRepo: DroneCommandQueriesRepo
    ) {}

    /**
     * 分頁查詢所有無人機指令 (新增)
     */
    getAllCommandsPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('Getting paginated commands', { pagination });

            const result = await this.queriesRepo.findPaginated(pagination);
            const paginatedResponse = DtoMapper.toPaginatedDroneCommandResponse(result);

            logger.info(`Successfully retrieved ${result.data.length} commands from ${result.totalCount} total`);
            return paginatedResponse;
        } catch (error) {
            logger.error('Error getting paginated commands', { error });
            throw error;
        }
    };

    /**
     * 根據無人機 ID 分頁查詢指令 (新增)
     */
    getCommandsByDroneIdPaginated = async (
        droneId: number,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('Getting paginated commands by drone ID', { droneId, pagination });

            if (!droneId || droneId <= 0) {
                throw new Error('無人機 ID 必須是正整數');
            }

            const result = await this.queriesRepo.findByDroneIdPaginated(droneId, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDroneCommandResponse(result);

            logger.info(`Successfully retrieved ${result.data.length} commands for drone ${droneId}`);
            return paginatedResponse;
        } catch (error) {
            logger.error('Error getting paginated commands by drone ID', { error, droneId });
            throw error;
        }
    };

    /**
     * 根據狀態分頁查詢指令 (新增)
     */
    getCommandsByStatusPaginated = async (
        status: string,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('Getting paginated commands by status', { status, pagination });

            const result = await this.queriesRepo.findByStatusPaginated(status, pagination);
            const paginatedResponse = DtoMapper.toPaginatedDroneCommandResponse(result);

            logger.info(`Successfully retrieved ${result.data.length} commands with status ${status}`);
            return paginatedResponse;
        } catch (error) {
            logger.error('Error getting paginated commands by status', { error, status });
            throw error;
        }
    };

}