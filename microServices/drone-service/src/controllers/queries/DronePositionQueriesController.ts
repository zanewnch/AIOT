/**
 * @fileoverview 無人機位置查詢控制器
 *
 * 此文件實作了無人機位置查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DronePositionQueriesController
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {Request, Response} from 'express';
import {DronePositionQueriesService} from "./../../services/commands/from.*Service.jsCommandsService.js"';
import {createLogger} from '../../configs/loggerConfig.js';
import {ResResult} from 'aiot-shared-packages';
import {IDronePositionQueries} from '../../types/controllers/queries/IDronePositionQueries.js';
import {TYPES} from '../../container/types.js';
import {PaginationRequestDto} from '../../dto/index.js';

const logger = createLogger('DronePositionQueriesController');

/**
 * 無人機位置查詢控制器類別
 *
 * 專門處理無人機位置相關的查詢請求，包含取得位置資料等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DronePositionQueriesController
 * @since 1.0.0
 */
@injectable()
export class DronePositionQueriesController implements IDronePositionQueries {
    constructor(
        @inject(TYPES.DronePositionQueriesService) private readonly dronePositionQueriesService: DronePositionQueriesService
    ) {
    }

    /**
     * 分頁查詢所有無人機位置（新增）
     * @route GET /api/drone-positions/data/paginated
     */
    getAllPositionsPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'timestamp',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.dronePositionQueriesService.getAllPositionsPaginated(pagination);
            const result = ResResult.fromPaginatedResponse('無人機位置分頁查詢成功', paginatedResult);
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('分頁查詢無人機位置失敗', { error });
            const result = ResResult.internalError('分頁查詢無人機位置失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據無人機 ID 分頁查詢位置（新增）
     * @route GET /api/drone-positions/data/drone/:droneId/paginated
     */
    getPositionsByDroneIdPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId, 10);

            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID');
                res.status(result.status).json(result);
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'timestamp',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.dronePositionQueriesService.getPositionsByDroneIdPaginated(droneId, pagination);
            const result = ResResult.fromPaginatedResponse(
                `無人機 ${droneId} 的位置分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據無人機 ID 分頁查詢位置失敗', { error });
            const result = ResResult.internalError('根據無人機 ID 分頁查詢位置失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據 ID 取得無人機位置資料（新版統一方法）
     * @route GET /api/drone-positions/data/:id/paginated
     */
    getPositionByIdPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const pagination = {
                page: 1,
                pageSize: 1,
                sortBy: 'timestamp',
                sortOrder: 'DESC' as const,
                get offset() { return 0; }
            } as PaginationRequestDto;

            const paginatedResult = await this.dronePositionQueriesService.getPositionsByIdPaginated(id, pagination);
            const result = ResResult.fromPaginatedResponse('無人機位置資料獲取成功', paginatedResult);
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據 ID 查詢無人機位置失敗', { error });
            const result = ResResult.internalError('根據 ID 查詢無人機位置失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據時間範圍分頁查詢位置（新版統一方法）
     * @route GET /api/drone-positions/data/time-range/paginated
     */
    getPositionsByTimeRangePaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ResResult.badRequest('無效的時間格式');
                res.status(result.status).json(result);
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'timestamp',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.dronePositionQueriesService.getPositionsByTimeRangePaginated(
                startTime, 
                endTime, 
                pagination
            );
            const result = ResResult.fromPaginatedResponse(
                '時間範圍內的位置分頁查詢成功',
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據時間範圍分頁查詢位置失敗', { error });
            const result = ResResult.internalError('根據時間範圍分頁查詢位置失敗');
            res.status(result.status).json(result);
        }
    };

}