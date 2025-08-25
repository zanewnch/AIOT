/**
 * @fileoverview 歸檔任務查詢 Controller 實作
 *
 * 此文件實作了歸檔任務查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module ArchiveTaskQueriesController
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {Request, Response} from 'express';
import { ArchiveTaskQueriesService } from '../../services/queries/ArchiveTaskQueriesService.js';
import {ArchiveJobType, ArchiveTaskStatus} from '../../models/ArchiveTaskModel.js';
import {createLogger} from '../../configs/loggerConfig.js';
import {ResResult} from 'aiot-shared-packages';
import type {IArchiveTaskQueries} from '../../types/controllers/queries/IArchiveTaskQueries.js';
import {TYPES} from '../../container/types.js';
import {PaginationRequestDto} from '../../dto/index.js';

/**
 * 歸檔任務查詢 Controller 類別
 *
 * 專門處理歸檔任務相關的查詢請求，包含列表查詢、詳情查詢、統計資訊等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class ArchiveTaskQueriesController
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const queries = container.get<ArchiveTaskQueriesController>(TYPES.ArchiveTaskQueriesController);
 *
 * // 在路由中使用
 * router.get('/api/archive-tasks', queries.getAllTasks.bind(queries));
 * router.get('/api/archive-tasks/:id', queries.getTaskById.bind(queries));
 * ```
 */
@injectable()
export class ArchiveTaskQueriesController implements IArchiveTaskQueries {
    private readonly logger = createLogger('ArchiveTaskQueriesController');

    constructor(
        @inject(TYPES.ArchiveTaskQueriesService) private readonly queryService: ArchiveTaskQueriesService
    ) {
    }

    /**
     * 分頁查詢所有歸檔任務（新增）
     * @route GET /api/archive-tasks/data/paginated
     */
    getAllTasksPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getAllTasksPaginated(pagination);
            const result = ResResult.fromPaginatedResponse('歸檔任務分頁查詢成功', paginatedResult);
            
            res.status(result.status).json(result);
        } catch (error) {
            this.logger.error('分頁查詢歸檔任務失敗', { error });
            const result = ResResult.internalError('分頁查詢歸檔任務失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據狀態分頁查詢歸檔任務（新增）
     * @route GET /api/archive-tasks/data/status/:status/paginated
     */
    getTasksByStatusPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const status = req.params.status as ArchiveTaskStatus;

            if (!status || !Object.values(ArchiveTaskStatus).includes(status)) {
                const result = ResResult.badRequest('無效的任務狀態');
                res.status(result.status).json(result);
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getTasksByStatusPaginated(status, pagination);
            const result = ResResult.fromPaginatedResponse(
                `狀態為 ${status} 的歸檔任務分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            this.logger.error('根據狀態分頁查詢歸檔任務失敗', { error });
            const result = ResResult.internalError('根據狀態分頁查詢歸檔任務失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據任務類型分頁查詢歸檔任務（新增）
     * @route GET /api/archive-tasks/data/job-type/:jobType/paginated
     */
    getTasksByJobTypePaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const jobType = req.params.jobType as ArchiveJobType;

            if (!jobType || !Object.values(ArchiveJobType).includes(jobType)) {
                const result = ResResult.badRequest('無效的任務類型');
                res.status(result.status).json(result);
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getTasksByJobTypePaginated(jobType, pagination);
            const result = ResResult.fromPaginatedResponse(
                `任務類型為 ${jobType} 的歸檔任務分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            this.logger.error('根據任務類型分頁查詢歸檔任務失敗', { error });
            const result = ResResult.internalError('根據任務類型分頁查詢歸檔任務失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據批次 ID 分頁查詢歸檔任務（新增）
     * @route GET /api/archive-tasks/data/batch/:batchId/paginated
     */
    getTasksByBatchIdPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const batchId = req.params.batchId;

            if (!batchId) {
                const result = ResResult.badRequest('批次 ID 為必填項');
                res.status(result.status).json(result);
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getTasksByBatchIdPaginated(batchId, pagination);
            const result = ResResult.fromPaginatedResponse(
                `批次 ${batchId} 的歸檔任務分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            this.logger.error('根據批次 ID 分頁查詢歸檔任務失敗', { error });
            const result = ResResult.internalError('根據批次 ID 分頁查詢歸檔任務失敗');
            res.status(result.status).json(result);
        }
    };

}