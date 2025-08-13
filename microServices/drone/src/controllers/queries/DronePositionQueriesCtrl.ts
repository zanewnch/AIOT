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

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { DronePositionQueriesSvc } from '../../services/queries/DronePositionQueriesSvc.js';
import { createLogger, logRequest } from '@aiot/shared-packages/loggerConfig.js';
import { ControllerResult } from '@aiot/shared-packages/ControllerResult.js';
import { IDronePositionQueries } from '../../types/controllers/queries/IDronePositionQueries.js';
import { TYPES } from '../../types/dependency-injection.js';
import { Logger, LogController } from '../../decorators/LoggerDecorator.js';

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
@injectable()
export class DronePositionQueries implements IDronePositionQueries {
    constructor(
        @inject(TYPES.DronePositionQueriesSvc) private readonly dronePositionQueriesSvc: DronePositionQueriesSvc
    ) {}

    /**
     * 取得所有無人機位置資料
     * @route GET /api/drone-position/data
     */
    @LogController()
    async getAllDronePositions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // 記錄請求
} catch (error) {
            next(error);
        }
    }

    /**
     * 根據 ID 取得無人機位置資料
     * @route GET /api/drone-position/data/:id
     */
    @LogController()
    async getDronePositionById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            // 驗證 ID
            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }
// 呼叫查詢服務層取得資料
            const dronePosition = await this.dronePositionQueriesSvc.getDronePositionById(id);

            if (!dronePosition) {
                const result = ControllerResult.notFound('找不到指定的無人機位置資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機位置資料獲取成功', dronePosition);
            res.status(result.status).json(result);
} catch (error) {
            next(error);
        }
    }

    /**
     * 根據無人機 ID 取得位置資料
     * @route GET /api/drone-position/data/drone/:droneId
     */
    @LogController()
    async getDronePositionsByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            // 驗證 Drone ID
            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }
const dronePositions = await this.dronePositionQueriesSvc.getDronePositionsByDroneId(droneId);

            const result = ControllerResult.success('無人機位置資料獲取成功', dronePositions);
            res.status(result.status).json(result);
} catch (error) {
            next(error);
        }
    }

    /**
     * 取得最新的無人機位置資料
     * @route GET /api/drone-position/data/latest/:droneId
     */
    @LogController()
    async getLatestDronePosition(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            // 驗證 Drone ID
            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }
const latestPosition = await this.dronePositionQueriesSvc.getLatestDronePosition(droneId);

            if (!latestPosition) {
                const result = ControllerResult.notFound('找不到該無人機的位置資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('最新無人機位置資料獲取成功', latestPosition);
            res.status(result.status).json(result);
} catch (error) {
            next(error);
        }
    }

    /**
     * 根據時間範圍取得無人機位置資料
     * @route GET /api/drone-position/data/timerange/:droneId
     */
    @LogController()
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
const dronePositions = await this.dronePositionQueriesSvc.getDronePositionsByTimeRange(droneId, start, end);

            const result = ControllerResult.success('無人機位置資料獲取成功', dronePositions);
            res.status(result.status).json(result);
} catch (error) {
            next(error);
        }
    }
}