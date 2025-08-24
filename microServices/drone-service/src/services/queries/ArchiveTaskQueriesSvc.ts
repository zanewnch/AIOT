/**
 * @fileoverview 歸檔任務查詢 Service 實作
 *
 * 此文件實作了歸檔任務查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module ArchiveTaskQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import {
    ArchiveTaskModel,
    ArchiveTaskStatus,
    ArchiveJobType
} from '../../models/ArchiveTaskModel.js';
import type {
    ArchiveTaskStatistics
} from '../../types/services/IArchiveTaskService.js';
import type {
    IArchiveTaskRepository,
    ArchiveTaskQueryOptions
} from '../../types/repositories/IArchiveTaskRepository.js';
import type { PaginationParams, PaginatedResponse } from '../../types/ApiResponseType.js';
import {
    ArchiveTaskResponseDto,
    ArchiveTaskDetailResponseDto,
    ArchiveTaskListResponseDto,
    ArchiveTaskStatisticsResponseDto,
    PaginationRequestDto
} from '../../dto/index.js';

type IArchiveTaskRepo = IArchiveTaskRepository;
import { ArchiveTaskQueriesRepo } from '../../repo/queries/ArchiveTaskQueriesRepo.js';
import { ArchiveTaskCommandsRepository } from '../../repo/commands/ArchiveTaskCommandsRepo.js';
import { TYPES } from '../../container/types.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { DtoMapper } from '../../utils/dtoMapper.js';

/**
 * 歸檔任務查詢 Service 實作類別
 *
 * 專門處理歸檔任務相關的查詢請求，包含取得任務資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class ArchiveTaskQueriesSvc
 * @since 1.0.0
 */
@injectable()
export class ArchiveTaskQueriesSvc {
    private readonly logger = createLogger('ArchiveTaskQueriesSvc');
    private readonly queriesRepo: ArchiveTaskQueriesRepo;
    private readonly commandsRepo: ArchiveTaskCommandsRepository;
    private repo: IArchiveTaskRepo; // 組合介面

    constructor(
        @inject(TYPES.ArchiveTaskQueriesRepo) queriesRepo: ArchiveTaskQueriesRepo,
        @inject(TYPES.ArchiveTaskCommandsRepository) commandsRepo: ArchiveTaskCommandsRepository
    ) {
        this.queriesRepo = queriesRepo;
        this.commandsRepo = commandsRepo;
        
        // 創建組合repository
        this.repo = Object.assign(
            Object.create(Object.getPrototypeOf(this.queriesRepo)),
            this.queriesRepo,
            this.commandsRepo
        ) as IArchiveTaskRepo;
    }

    /**
     * 分頁查詢所有歸檔任務（新增）
     */
    getAllTasksPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            this.logger.info('分頁查詢所有歸檔任務', { pagination });

            const result = await this.queriesRepo.findPaginated(pagination);
            const paginatedResponse = DtoMapper.toPaginatedArchiveTaskResponse(result);

            this.logger.info(`成功獲取 ${result.data.length} 個歸檔任務，總共 ${result.totalCount} 個`);
            return paginatedResponse;
        } catch (error) {
            this.logger.error('分頁查詢歸檔任務失敗', { error });
            throw error;
        }
    };

    /**
     * 根據狀態分頁查詢歸檔任務（新增）
     */
    getTasksByStatusPaginated = async (
        status: ArchiveTaskStatus,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            this.logger.info('根據狀態分頁查詢歸檔任務', { status, pagination });

            const result = await this.queriesRepo.findByStatusPaginated(status, pagination);
            const paginatedResponse = DtoMapper.toPaginatedArchiveTaskResponse(result);

            this.logger.info(`成功獲取狀態為 ${status} 的歸檔任務 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            this.logger.error('根據狀態分頁查詢歸檔任務失敗', { error, status });
            throw error;
        }
    };

    /**
     * 根據任務類型分頁查詢歸檔任務（新增）
     */
    getTasksByJobTypePaginated = async (
        jobType: ArchiveJobType,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            this.logger.info('根據任務類型分頁查詢歸檔任務', { jobType, pagination });

            const result = await this.queriesRepo.findByJobTypePaginated(jobType, pagination);
            const paginatedResponse = DtoMapper.toPaginatedArchiveTaskResponse(result);

            this.logger.info(`成功獲取任務類型為 ${jobType} 的歸檔任務 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            this.logger.error('根據任務類型分頁查詢歸檔任務失敗', { error, jobType });
            throw error;
        }
    };

    /**
     * 根據批次 ID 分頁查詢歸檔任務（新增）
     */
    getTasksByBatchIdPaginated = async (
        batchId: string,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            this.logger.info('根據批次 ID 分頁查詢歸檔任務', { batchId, pagination });

            const result = await this.queriesRepo.findByBatchIdPaginated(batchId, pagination);
            const paginatedResponse = DtoMapper.toPaginatedArchiveTaskResponse(result);

            this.logger.info(`成功獲取批次 ${batchId} 的歸檔任務 ${result.data.length} 個`);
            return paginatedResponse;
        } catch (error) {
            this.logger.error('根據批次 ID 分頁查詢歸檔任務失敗', { error, batchId });
            throw error;
        }
    };

}