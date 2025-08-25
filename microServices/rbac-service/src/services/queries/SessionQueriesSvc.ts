/**
 * @fileoverview 會話查詢 Service 實現
 *
 * 此文件實作了會話查詢業務邏輯層，
 * 專注於處理所有讀取相關的業務操作。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module SessionQueriesSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../container/types.js';
import { SessionQueriesRepository } from '../../repo/queries/SessionQueriesRepository.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { PaginationRequestDto } from '../../dto/index.js';
import { DtoMapper } from '../../utils/dtoMapper.js';
// import type { SessionQueriesRepo } from '../../types/index.js';

const logger = createLogger('SessionQueriesSvc');

/**
 * 會話查詢 Service 實現類別
 *
 * 專門處理會話相關的查詢請求，包含分頁查詢等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class SessionQueriesSvc
 * @since 1.0.0
 */
@injectable()
export class SessionQueriesSvc {
    constructor(
        @inject(TYPES.SessionQueriesRepository)
        private readonly sessionQueriesRepo: SessionQueriesRepository
    ) {}

    /**
     * 分頁查詢所有會話
     */
    getAllSessionsPaginated = async (
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('Getting paginated sessions', { pagination });

            // TODO: 實現 findPaginated 方法，或使用 findAllPaginated
            const result = { data: [], totalCount: 0, currentPage: 1, pageSize: pagination.pageSize || 20 }; // await this.sessionQueriesRepo.findAllPaginated(pagination);
            const paginatedResponse = result  // TODO: 實現 toPaginatedSessionResponse 方法;

            logger.info(`Successfully retrieved ${result.data.length} sessions from ${result.totalCount} total`);
            return paginatedResponse;
        } catch (error) {
            logger.error('Error getting paginated sessions', { error });
            throw error;
        }
    };

    /**
     * 根據使用者 ID 分頁查詢會話
     */
    getSessionsByUserIdPaginated = async (
        userId: number,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('Getting paginated sessions by user ID', { userId, pagination });

            if (!userId || userId <= 0) {
                throw new Error('使用者 ID 必須是正整數');
            }

            // TODO: 實現 findByUserIdPaginated 方法
            const result = { data: [], totalCount: 0, currentPage: 1, pageSize: pagination.pageSize || 20 }; // await this.sessionQueriesRepo.findByUserIdPaginated(userId.toString(), pagination);
            const paginatedResponse = result  // TODO: 實現 toPaginatedSessionResponse 方法;

            logger.info(`Successfully retrieved ${result.data.length} sessions for user ${userId}`);
            return paginatedResponse;
        } catch (error) {
            logger.error('Error getting paginated sessions by user ID', { error, userId });
            throw error;
        }
    };

    /**
     * 根據狀態分頁查詢會話
     */
    getSessionsByStatusPaginated = async (
        status: string,
        pagination: PaginationRequestDto
    ): Promise<any> => {
        try {
            logger.info('Getting paginated sessions by status', { status, pagination });

            const result = await this.sessionQueriesRepo.findByStatusPaginated(status, pagination);
            const paginatedResponse = result  // TODO: 實現 toPaginatedSessionResponse 方法;

            logger.info(`Successfully retrieved ${result.data.length} sessions with status ${status}`);
            return paginatedResponse;
        } catch (error) {
            logger.error('Error getting paginated sessions by status', { error, status });
            throw error;
        }
    };
}