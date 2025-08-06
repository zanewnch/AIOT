/**
 * @fileoverview 無人機位置查詢控制器
 * 
 * 此文件實作了無人機位置查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 * 
 * @module DronePositionQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { DronePositionService } from '../../services/drone/DronePositionService.js';
import type { IDronePositionService } from '../../types/services/IDronePositionService.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';

const logger = createLogger('DronePositionQueries');

/**
 * 無人機位置查詢控制器類別
 * 
 * 專門處理無人機位置相關的查詢請求，包含取得位置資料等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 * 
 * @class DronePositionQueries
 * @since 1.0.0
 */
export class DronePositionQueries {
    private dronePositionService: IDronePositionService;

    constructor() {
        this.dronePositionService = new DronePositionService();
    }

    /**
     * 取得所有無人機位置資料
     * @route GET /api/drone-position/data
     */
    async getAllDronePositions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // 記錄請求
            logRequest(req, 'Getting all drone position data');
            logger.info('Drone position data retrieval request received');

            // 呼叫服務層取得資料
            const dronePositions = await this.dronePositionService.getAllDronePositions();

            // 建立成功回應
            const result = ControllerResult.success('無人機位置資料獲取成功', dronePositions);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drone position data retrieval completed successfully', {
                count: dronePositions.length
            });

        } catch (error) {
            logger.error('Error in getAllDronePositions', { error });
            next(error);
        }
    }

    /**
     * 根據 ID 取得無人機位置資料
     * @route GET /api/drone-position/data/:id
     */
    async getDronePositionById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            // 驗證 ID
            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting drone position data with ID: ${id}`);
            logger.info('Drone position data retrieval request received', { id });

            // 呼叫服務層取得資料
            const dronePosition = await this.dronePositionService.getDronePositionById(id);

            if (!dronePosition) {
                const result = ControllerResult.notFound('找不到指定的無人機位置資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機位置資料獲取成功', dronePosition);
            res.status(result.status).json(result);

            logger.info('Drone position data retrieval completed successfully', { id });

        } catch (error) {
            logger.error('Error in getDronePositionById', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 根據無人機 ID 取得位置資料
     * @route GET /api/drone-position/data/drone/:droneId
     */
    async getDronePositionsByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            // 驗證 Drone ID
            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting drone positions by drone ID: ${droneId}`);
            logger.info('Drone positions by drone ID retrieval request received', { droneId });

            const dronePositions = await this.dronePositionService.getDronePositionsByDroneId(droneId);

            const result = ControllerResult.success('無人機位置資料獲取成功', dronePositions);
            res.status(result.status).json(result);

            logger.info('Drone positions by drone ID retrieval completed successfully', {
                droneId,
                count: dronePositions.length
            });

        } catch (error) {
            logger.error('Error in getDronePositionsByDroneId', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 取得最新的無人機位置資料
     * @route GET /api/drone-position/data/latest/:droneId
     */
    async getLatestDronePosition(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            // 驗證 Drone ID
            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting latest drone position for drone ID: ${droneId}`);
            logger.info('Latest drone position retrieval request received', { droneId });

            const latestPosition = await this.dronePositionService.getLatestDronePosition(droneId);

            if (!latestPosition) {
                const result = ControllerResult.notFound('找不到該無人機的位置資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('最新無人機位置資料獲取成功', latestPosition);
            res.status(result.status).json(result);

            logger.info('Latest drone position retrieval completed successfully', { droneId });

        } catch (error) {
            logger.error('Error in getLatestDronePosition', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 根據時間範圍取得無人機位置資料
     * @route GET /api/drone-position/data/timerange/:droneId
     */
    async getDronePositionsByTimeRange(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const { startTime, endTime } = req.query;

            // 驗證 Drone ID
            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            // 驗證時間參數
            if (!startTime || !endTime) {
                const result = ControllerResult.badRequest('需要提供開始時間和結束時間');
                res.status(result.status).json(result);
                return;
            }

            const start = new Date(startTime as string);
            const end = new Date(endTime as string);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                const result = ControllerResult.badRequest('無效的時間格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting drone positions by time range for drone ID: ${droneId}`);
            logger.info('Drone positions by time range retrieval request received', { droneId, startTime, endTime });

            const dronePositions = await this.dronePositionService.getDronePositionsByTimeRange(droneId, start, end);

            const result = ControllerResult.success('無人機位置資料獲取成功', dronePositions);
            res.status(result.status).json(result);

            logger.info('Drone positions by time range retrieval completed successfully', {
                droneId,
                count: dronePositions.length
            });

        } catch (error) {
            logger.error('Error in getDronePositionsByTimeRange', {
                droneId: req.params.droneId,
                query: req.query,
                error
            });
            next(error);
        }
    }
}