/**
 * @fileoverview 無人機狀態查詢控制器
 *
 * 此文件實作了無人機狀態查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneStatusQueriesController
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {Request, Response} from 'express';
import { DroneStatusQueriesService } from '../../services/queries/DroneStatusQueriesService.js';
import {createLogger} from '../../configs/loggerConfig.js';
import {ResResult} from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';
import {PaginationRequestDto} from '../../dto/index.js';
import {DroneStatus} from '../../models/DroneStatusModel.js';

const logger = createLogger('DroneStatusQueriesController');

/**
 * 無人機狀態查詢控制器類別
 *
 * 專門處理無人機狀態相關的查詢請求，包含取得無人機狀態資料等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneStatusQueriesController
 * @since 1.0.0
 */
@injectable()
export class DroneStatusQueriesController {
    constructor(
        @inject(TYPES.DroneStatusQueriesSvc) private readonly droneStatusService: DroneStatusQueriesService
    ) {
    }

    /**
     * 分頁查詢所有無人機狀態（新增統一方法）
     * @route GET /api/drone-statuses/data/paginated
     */
    getAllStatusesPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'createdAt',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.droneStatusService.getAllStatusesPaginated(pagination);
            const result = ResResult.fromPaginatedResponse('無人機狀態分頁查詢成功', paginatedResult);
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('分頁查詢無人機狀態失敗', { error });
            const result = ResResult.internalError('分頁查詢無人機狀態失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據狀態分頁查詢無人機（新增統一方法）
     * @route GET /api/drone-statuses/data/status/:status/paginated
     */
    getStatusesByStatusPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const status = req.params.status as DroneStatus;

            if (!status || !Object.values(DroneStatus).includes(status)) {
                const result = ResResult.badRequest('無效的無人機狀態');
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

            const paginatedResult = await this.droneStatusService.getStatusesByStatusPaginated(status, pagination);
            const result = ResResult.fromPaginatedResponse(
                `狀態為 ${status} 的無人機分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據狀態分頁查詢無人機失敗', { error });
            const result = ResResult.internalError('根據狀態分頁查詢無人機失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據無人機 ID 分頁查詢狀態（新版統一方法）
     * @route GET /api/drone-statuses/data/drone/:droneId/paginated
     */
    getStatusesByDroneIdPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);

            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID');
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

            const paginatedResult = await this.droneStatusService.getStatusesByDroneIdPaginated(droneId, pagination);
            const result = ResResult.fromPaginatedResponse(
                `無人機 ${droneId} 的狀態分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據無人機 ID 分頁查詢狀態失敗', { error });
            const result = ResResult.internalError('根據無人機 ID 分頁查詢狀態失敗');
            res.status(result.status).json(result);
        }
    };

}