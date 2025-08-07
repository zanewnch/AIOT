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
import { createLogger, logRequest } from '../../../../../packages/loggerConfig.js';
import { ControllerResult } from '../../../../../packages/ControllerResult.js';
import { TYPES } from '../../types/dependency-injection.js';

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
    async getAllDroneRealTimeStatuses(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Getting all drone real-time status data');
            logger.info('Drone real-time status data retrieval request received');

            const droneStatuses = await this.droneRealTimeStatusQueriesService.getAllDroneRealTimeStatuses();

            const result = ControllerResult.success('無人機即時狀態資料獲取成功', droneStatuses);
            res.status(result.status).json(result);

            logger.info('Drone real-time status data retrieval completed successfully', {
                count: droneStatuses.length
            });

        } catch (error) {
            logger.error('Error in getAllDroneRealTimeStatuses', { error });
            next(error);
        }
    }

    /**
     * 根據 ID 取得無人機即時狀態資料
     * @route GET /api/drone-realtime-status/data/:id
     */
    async getDroneRealTimeStatusById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting drone real-time status data with ID: ${id}`);
            logger.info('Drone real-time status data retrieval request received', { id });

            const droneStatus = await this.droneRealTimeStatusQueriesService.getDroneRealTimeStatusById(id);

            if (!droneStatus) {
                const result = ControllerResult.notFound('找不到指定的無人機即時狀態資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機即時狀態資料獲取成功', droneStatus);
            res.status(result.status).json(result);

            logger.info('Drone real-time status data retrieval completed successfully', { id });

        } catch (error) {
            logger.error('Error in getDroneRealTimeStatusById', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 根據無人機 ID 取得即時狀態資料
     * @route GET /api/drone-realtime-status/data/drone/:droneId
     */
    async getDroneRealTimeStatusByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting drone real-time status by drone ID: ${droneId}`);
            logger.info('Drone real-time status by drone ID retrieval request received', { droneId });

            const droneStatus = await this.droneRealTimeStatusQueriesService.getDroneRealTimeStatusByDroneId(droneId);

            if (!droneStatus) {
                const result = ControllerResult.notFound('找不到該無人機的即時狀態資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機即時狀態資料獲取成功', droneStatus);
            res.status(result.status).json(result);

            logger.info('Drone real-time status by drone ID retrieval completed successfully', { droneId });

        } catch (error) {
            logger.error('Error in getDroneRealTimeStatusByDroneId', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 根據狀態查詢無人機即時狀態
     * @route GET /api/drone-realtime-status/data/status/:status
     */
    async getDroneRealTimeStatusesByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const status = req.params.status;

            if (!status || typeof status !== 'string' || status.trim().length === 0) {
                const result = ControllerResult.badRequest('狀態參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting drone real-time statuses by status: ${status}`);
            logger.info('Drone real-time statuses by status retrieval request received', { status });

            const droneStatuses = await this.droneRealTimeStatusQueriesService.getDroneRealTimeStatusesByStatus(status.trim());

            const result = ControllerResult.success('無人機即時狀態資料獲取成功', droneStatuses);
            res.status(result.status).json(result);

            logger.info('Drone real-time statuses by status retrieval completed successfully', {
                status,
                count: droneStatuses.length
            });

        } catch (error) {
            logger.error('Error in getDroneRealTimeStatusesByStatus', {
                status: req.params.status,
                error
            });
            next(error);
        }
    }

    /**
     * 取得活躍中的無人機即時狀態
     * @route GET /api/drone-realtime-status/data/active
     */
    async getActiveDroneRealTimeStatuses(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Getting active drone real-time status data');
            logger.info('Active drone real-time status data retrieval request received');

            const activeStatuses = await this.droneRealTimeStatusQueriesService.getActiveDroneRealTimeStatuses();

            const result = ControllerResult.success('活躍無人機即時狀態資料獲取成功', activeStatuses);
            res.status(result.status).json(result);

            logger.info('Active drone real-time status data retrieval completed successfully', {
                count: activeStatuses.length
            });

        } catch (error) {
            logger.error('Error in getActiveDroneRealTimeStatuses', { error });
            next(error);
        }
    }

    /**
     * 取得無人機即時狀態統計
     * @route GET /api/drone-realtime-status/statistics
     */
    async getDroneRealTimeStatusStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Getting drone real-time status statistics');
            logger.info('Drone real-time status statistics retrieval request received');

            const statistics = await this.droneRealTimeStatusQueriesService.getDroneRealTimeStatusStatistics();

            const result = ControllerResult.success('無人機即時狀態統計獲取成功', statistics);
            res.status(result.status).json(result);

            logger.info('Drone real-time status statistics retrieval completed successfully');

        } catch (error) {
            logger.error('Error in getDroneRealTimeStatusStatistics', { error });
            next(error);
        }
    }
}