/**
 * @fileoverview 無人機指令佇列查詢控制器
 *
 * 此文件實作了無人機指令佇列查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneCommandQueueQueriesController
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {Request, Response} from 'express';
import {DroneCommandQueueQueriesService} from "./../../services/commands/from.*Service.jsCommandsService.js"';
import {createLogger} from '../../configs/loggerConfig.js';
import {ResResult} from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';
import {DroneCommandQueueStatus} from '../../models/DroneCommandQueueModel.js';
import {PaginationRequestDto} from '../../dto/index.js';

const logger = createLogger('DroneCommandQueueQueriesController');

/**
 * 無人機指令佇列查詢控制器類別
 *
 * 專門處理無人機指令佇列相關的查詢請求，包含取得佇列資料等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneCommandQueueQueriesController
 * @since 1.0.0
 */
@injectable()
export class DroneCommandQueueQueriesController {
    constructor(
        @inject(TYPES.DroneCommandQueueQueriesService) private readonly queryService: DroneCommandQueueQueriesService
    ) {
    }

    /**
     * 分頁查詢所有指令佇列（新增統一方法）
     * @route GET /api/drone-command-queue/data/paginated
     */
    getAllDroneCommandQueuesPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'created_at',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getAllDroneCommandQueuesPaginated(pagination);
            const result = ResResult.fromPaginatedResponse('指令佇列分頁查詢成功', paginatedResult);
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('分頁查詢指令佇列失敗', { error });
            const result = ResResult.internalError('分頁查詢指令佇列失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據無人機 ID 分頁查詢指令佇列（新增統一方法）
     * @route GET /api/drone-command-queue/data/drone/:droneId/paginated
     */
    getDroneCommandQueuesByDroneIdPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);

            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'created_at',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getDroneCommandQueuesByDroneIdPaginated(droneId, pagination);
            const result = ResResult.fromPaginatedResponse(
                `無人機 ${droneId} 的指令佇列分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據無人機 ID 分頁查詢指令佇列失敗', { error });
            const result = ResResult.internalError('根據無人機 ID 分頁查詢指令佇列失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據狀態分頁查詢指令佇列（新增統一方法）
     * @route GET /api/drone-command-queue/data/status/:status/paginated
     */
    getDroneCommandQueuesByStatusPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const status = req.params.status;

            if (!status || typeof status !== 'string' || status.trim().length === 0) {
                const result = ResResult.badRequest('狀態參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'created_at',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getDroneCommandQueuesByStatusPaginated(status as DroneCommandQueueStatus, pagination);
            const result = ResResult.fromPaginatedResponse(
                `狀態為 ${status} 的指令佇列分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據狀態分頁查詢指令佇列失敗', { error });
            const result = ResResult.internalError('根據狀態分頁查詢指令佇列失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據優先級分頁查詢指令佇列（新增統一方法）
     * @route GET /api/drone-command-queue/data/priority/:priority/paginated
     */
    getDroneCommandQueuesByPriorityPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const priority = parseInt(req.params.priority);

            if (isNaN(priority)) {
                const result = ResResult.badRequest('無效的優先級格式');
                res.status(result.status).json(result);
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'created_at',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getDroneCommandQueuesByPriorityPaginated(priority, pagination);
            const result = ResResult.fromPaginatedResponse(
                `優先級為 ${priority} 的指令佇列分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據優先級分頁查詢指令佇列失敗', { error });
            const result = ResResult.internalError('根據優先級分頁查詢指令佇列失敗');
            res.status(result.status).json(result);
        }
    };

}