/**
 * @fileoverview 無人機即時狀態查詢控制器
 *
 * 此文件實作了無人機即時狀態查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneRealTimeStatusQueriesController
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {Request, Response} from 'express';
import { DroneRealTimeStatusQueriesSvc } from '../../services/queries/DroneRealTimeStatusQueriesSvc.js';
import {createLogger} from '../../configs/loggerConfig.js';
import {ResResult} from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';
import {PaginationRequestDto} from '../../dto/index.js';
import {DroneRealTimeStatus} from '../../models/DroneRealTimeStatusModel.js';

const logger = createLogger('DroneRealTimeStatusQueriesController');

/**
 * 無人機即時狀態查詢控制器類別
 *
 * 專門處理無人機即時狀態相關的查詢請求，包含取得即時狀態等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneRealTimeStatusQueriesController
 * @since 1.0.0
 */
@injectable()
export class DroneRealTimeStatusQueriesCtrl {
    constructor(
        @inject(TYPES.DroneRealTimeStatusQueriesSvc) private readonly droneRealTimeStatusQueriesSvc: DroneRealTimeStatusQueriesSvc
    ) {
    }

    /**
     * 分頁查詢所有即時狀態（新增統一方法）
     * @route GET /api/drone-realtime-status/data/paginated
     */
    getAllRealTimeStatusesPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'last_seen',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.droneRealTimeStatusQueriesSvc.getAllRealTimeStatusesPaginated(pagination);
            const result = ResResult.fromPaginatedResponse('即時狀態分頁查詢成功', paginatedResult);
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('分頁查詢即時狀態失敗', { error });
            const result = ResResult.internalError('分頁查詢即時狀態失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據無人機 ID 分頁查詢即時狀態（新增統一方法）
     * @route GET /api/drone-realtime-status/data/drone/:droneId/paginated
     */
    getRealTimeStatusesByDroneIdPaginated = async (req: Request, res: Response): Promise<void> => {
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
                sortBy: req.query.sortBy as string || 'last_seen',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.droneRealTimeStatusQueriesSvc.getRealTimeStatusesByDroneIdPaginated(droneId, pagination);
            const result = ResResult.fromPaginatedResponse(
                `無人機 ${droneId} 的即時狀態分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據無人機 ID 分頁查詢即時狀態失敗', { error });
            const result = ResResult.internalError('根據無人機 ID 分頁查詢即時狀態失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據狀態分頁查詢即時狀態（新增統一方法）
     * @route GET /api/drone-realtime-status/data/status/:status/paginated
     */
    getRealTimeStatusesByStatusPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const status = req.params.status as DroneRealTimeStatus;

            if (!status || !Object.values(DroneRealTimeStatus).includes(status)) {
                const result = ResResult.badRequest('無效的狀態參數');
                res.status(result.status).json(result);
                return;
            }

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'last_seen',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.droneRealTimeStatusQueriesSvc.getRealTimeStatusesByStatusPaginated(status, pagination);
            const result = ResResult.fromPaginatedResponse(
                `狀態為 ${status} 的即時狀態分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據狀態分頁查詢即時狀態失敗', { error });
            const result = ResResult.internalError('根據狀態分頁查詢即時狀態失敗');
            res.status(result.status).json(result);
        }
    };

    /**
     * 根據連線狀態分頁查詢即時狀態（新增統一方法）
     * @route GET /api/drone-realtime-status/data/connected/:isConnected/paginated
     */
    getRealTimeStatusesByConnectionPaginated = async (req: Request, res: Response): Promise<void> => {
        try {
            const isConnected = req.params.isConnected === 'true';

            const pagination = {
                page: parseInt(req.query.page as string) || 1,
                pageSize: parseInt(req.query.pageSize as string) || 20,
                sortBy: req.query.sortBy as string || 'last_seen',
                sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
                search: req.query.search as string,
                get offset() { return ((this.page || 1) - 1) * (this.pageSize || 20); }
            } as PaginationRequestDto;

            const paginatedResult = await this.droneRealTimeStatusQueriesSvc.getRealTimeStatusesByConnectionPaginated(isConnected, pagination);
            const result = ResResult.fromPaginatedResponse(
                `連線狀態為 ${isConnected ? '已連線' : '未連線'} 的即時狀態分頁查詢成功`, 
                paginatedResult
            );
            
            res.status(result.status).json(result);
        } catch (error) {
            logger.error('根據連線狀態分頁查詢即時狀態失敗', { error });
            const result = ResResult.internalError('根據連線狀態分頁查詢即時狀態失敗');
            res.status(result.status).json(result);
        }
    };


}