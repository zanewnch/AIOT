/**
 * @fileoverview 無人機狀態歷史歸檔查詢控制器
 *
 * 此文件實作了無人機狀態歷史歸檔查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneStatusArchiveQueriesCtrl
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {Request, Response} from 'express';
import {DroneStatusArchiveQueriesSvc} from '../../services/queries/DroneStatusArchiveQueriesSvc.js';
import {createLogger} from '../../configs/loggerConfig.js';
import {ResResult} from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';
import {PaginationRequestDto} from '../../dto/index.js';
import {DroneStatus} from '../../models/DroneStatusModel.js';

const logger = createLogger('DroneStatusArchiveQueriesCtrl');

/**
 * 無人機狀態歷史歸檔查詢控制器類別
 *
 * 專門處理無人機狀態歷史歸檔相關的查詢請求，包含取得狀態歷史資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneStatusArchiveQueriesCtrl
 * @since 1.0.0
 */
@injectable()
export class DroneStatusArchiveQueriesCtrl {
    constructor(
        @inject(TYPES.DroneStatusArchiveQueriesSvc) private readonly queryService: DroneStatusArchiveQueriesSvc
    ) {
    }


    /**
     * 分頁查詢所有狀態歷史歸檔（新增統一方法）
     * @route GET /api/drone-status-archive/data/paginated
     */
    getAllStatusArchivesPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'archived_at',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getAllStatusArchivesPaginated(pagination);
            const result = ResResult.fromPaginatedResponse('狀態歷史歸檔分頁查詢成功', paginatedResult);
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('分頁查詢狀態歷史歸檔失敗', { error });
            const result = ResResult.internalError('分頁查詢狀態歷史歸檔失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據無人機 ID 分頁查詢狀態歷史歸檔（新增統一方法）
     * @route GET /api/drone-status-archive/data/drone/:droneId/paginated
     */
    getStatusArchivesByDroneIdPaginated = async (req: Request, res: Response): Promise<void> => {
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
                sortBy: req.query.sortBy as string || 'archived_at',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getStatusArchivesByDroneIdPaginated(droneId, pagination);
            const result = ResResult.fromPaginatedResponse(
                `無人機 ${droneId} 的狀態歷史歸檔分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據無人機 ID 分頁查詢狀態歷史歸檔失敗', { error });
            const result = ResResult.internalError('根據無人機 ID 分頁查詢狀態歷史歸檔失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據狀態分頁查詢歷史記錄（新增統一方法）
     * @route GET /api/drone-status-archive/data/status/:status/paginated
     */
    getStatusArchivesByStatusPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const status = req.params.status as DroneStatus;

            if (!status || !Object.values(DroneStatus).includes(status)) {
                const result = ResResult.badRequest('無效的狀態參數');
                res.status(result.status).json(result);
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'archived_at',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getStatusArchivesByStatusPaginated(status, pagination);
            const result = ResResult.fromPaginatedResponse(
                `狀態為 ${status} 的歷史記錄分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據狀態分頁查詢歷史記錄失敗', { error });
            const result = ResResult.internalError('根據狀態分頁查詢歷史記錄失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據時間範圍分頁查詢歷史記錄（新增統一方法）
     * @route GET /api/drone-status-archive/data/date-range/paginated
     */
    getStatusArchivesByDateRangePaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const startDate = new Date(req.query.startDate as string);
            const endDate = new Date(req.query.endDate as string);

            // 驗證日期參數
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                const result = ResResult.badRequest('無效的日期格式');
                res.status(result.status).json(result);
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'archived_at',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.queryService.getStatusArchivesByDateRangePaginated(startDate, endDate, pagination);
            const result = ResResult.fromPaginatedResponse(
                '時間範圍內的歷史記錄分頁查詢成功', 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據時間範圍分頁查詢歷史記錄失敗', { error });
            const result = ResResult.internalError('根據時間範圍分頁查詢歷史記錄失敗');
            res.status(result.status).json(result);
        }
    };
}