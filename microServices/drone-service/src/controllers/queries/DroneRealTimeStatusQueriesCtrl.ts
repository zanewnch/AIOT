/**
 * @fileoverview 無人機即時狀態查詢控制器
 * 
 * 此文件實作了無人機即時狀態查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 * 
 * @module DroneRealTimeStatusQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { DroneRealTimeStatusQueriesSvc } from '../../services/queries/DroneRealTimeStatusQueriesSvc.js';
import { createLogger, logRequest } from '@aiot/shared-packages/loggerConfig.js';
import { ControllerResult } from '@aiot/shared-packages/ControllerResult.js';
import { TYPES } from '../../container/types.js';
import { loggerDecorator } from "../../patterns/LoggerDecorator.js";

const logger = createLogger('DroneRealTimeStatusQueries');

/**
 * 無人機即時狀態查詢控制器類別
 * 
 * 專門處理無人機即時狀態相關的查詢請求，包含取得即時狀態等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 * 
 * @class DroneRealTimeStatusQueries
 * @since 1.0.0
 */
@injectable()
export class DroneRealTimeStatusQueries {
    constructor(
        @inject(TYPES.DroneStatusQueriesSvc) private readonly droneRealTimeStatusQueriesService: DroneRealTimeStatusQueriesSvc
    ) {}

    /**
     * 取得所有無人機即時狀態資料
     * @route GET /api/drone-realtime-status/data
     */
    getAllDroneRealTimeStatuses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 100;
            const droneStatuses = await this.droneRealTimeStatusQueriesService.getAllDroneRealTimeStatuses(limit);
            const result = ControllerResult.success('無人機即時狀態資料獲取成功', droneStatuses);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據 ID 取得無人機即時狀態資料
     * @route GET /api/drone-realtime-status/data/:id
     */
    getDroneRealTimeStatusById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const droneStatus = await this.droneRealTimeStatusQueriesService.getDroneRealTimeStatusById(id);

            if (!droneStatus) {
                const result = ControllerResult.notFound('找不到指定的無人機即時狀態資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機即時狀態資料獲取成功', droneStatus);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據無人機 ID 取得即時狀態資料
     * @route GET /api/drone-realtime-status/data/drone/:droneId
     */
    getDroneRealTimeStatusByDroneId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);

            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const droneStatus = await this.droneRealTimeStatusQueriesService.getDroneRealTimeStatusByDroneId(droneId);

            if (!droneStatus) {
                const result = ControllerResult.notFound('找不到該無人機的即時狀態資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機即時狀態資料獲取成功', droneStatus);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據狀態查詢無人機即時狀態
     * @route GET /api/drone-realtime-status/data/status/:status
     */
    getDroneRealTimeStatusesByStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const status = req.params.status;

            if (!status || typeof status !== 'string' || status.trim().length === 0) {
                const result = ControllerResult.badRequest('狀態參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            const droneStatuses = await this.droneRealTimeStatusQueriesService.getDroneRealTimeStatusesByStatus(status.trim());

            const result = ControllerResult.success('無人機即時狀態資料獲取成功', droneStatuses);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得活躍中的無人機即時狀態
     * @route GET /api/drone-realtime-status/data/active
     */
    getActiveDroneRealTimeStatuses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneStatuses = await this.droneRealTimeStatusQueriesService.getActiveDroneRealTimeStatuses();
            const result = ControllerResult.success('活躍無人機即時狀態資料獲取成功', droneStatuses);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得無人機即時狀態統計
     * @route GET /api/drone-realtime-status/statistics
     */
    getDroneRealTimeStatusStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const statistics = await this.droneRealTimeStatusQueriesService.getDroneRealTimeStatusStatistics();

            const result = ControllerResult.success('無人機即時狀態統計獲取成功', statistics);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }
}