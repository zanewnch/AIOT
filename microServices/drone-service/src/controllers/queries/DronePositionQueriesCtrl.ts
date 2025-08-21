/**
 * @fileoverview 無人機位置查詢控制器
 *
 * 此文件實作了無人機位置查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DronePositionQueriesCtrl
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {NextFunction, Request, Response} from 'express';
import {DronePositionQueriesSvc} from '../../services/queries/DronePositionQueriesSvc.js';
import {createLogger} from '../../configs/loggerConfig.js';
import {ResResult} from '../../utils/ResResult.js';
import {IDronePositionQueriesCtrl} from '../../types/controllers/queries/IDronePositionQueriesCtrl.js';
import {TYPES} from '../../container/types.js';

const logger = createLogger('DronePositionQueriesCtrl');

/**
 * 無人機位置查詢控制器類別
 *
 * 專門處理無人機位置相關的查詢請求，包含取得位置資料等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DronePositionQueriesCtrl
 * @since 1.0.0
 */
@injectable()
export class DronePositionQueriesCtrl implements IDronePositionQueriesCtrl {
    constructor(
        @inject(TYPES.DronePositionQueriesSvc) private readonly dronePositionQueriesSvc: DronePositionQueriesSvc
    ) {
    }

    /**
     * 取得所有無人機位置資料（支援分頁）
     * @route GET /api/drone-position/data
     * @query page - 頁碼（從 1 開始）
     * @query pageSize - 每頁數量
     * @query sortBy - 排序欄位
     * @query sortOrder - 排序方向（ASC/DESC）
     */
    getAllDronePositions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // 解析分頁參數
            const page = parseInt(req.query.page as string) || 1;
            const pageSize = parseInt(req.query.pageSize as string) || 10;
            const sortBy = (req.query.sortBy as string) || 'id';
            const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC';

            const paginationParams = { page, pageSize, sortBy, sortOrder };

            // 檢查是否需要分頁（如果沒有分頁參數，使用舊的無分頁查詢）
            if (!req.query.page && !req.query.pageSize) {
                // 向後兼容：沒有分頁參數時返回所有數據
                const positions = await this.dronePositionQueriesSvc.getAllDronePositions();
                const result = ResResult.success('無人機位置資料獲取成功', positions);
                res.status(result.status).json(result);
                return;
            }

            // 使用分頁查詢
            const paginatedResult = await this.dronePositionQueriesSvc.getAllDronePositions(paginationParams);
            const result = ResResult.success('無人機位置資料獲取成功', paginatedResult);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據 ID 取得無人機位置資料
     * @route GET /api/drone-position/data/:id
     */
    getDronePositionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            // 驗證 ID
            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            // 呼叫查詢服務層取得資料
            const dronePosition = await this.dronePositionQueriesSvc.getDronePositionById(id);

            if (!dronePosition) {
                const result = ResResult.notFound('找不到指定的無人機位置資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('無人機位置資料獲取成功', dronePosition);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據無人機 ID 取得位置資料
     * @route GET /api/drone-position/data/drone/:droneId
     */
    getDronePositionsByDroneId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);

            // 驗證 Drone ID
            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const dronePositions = await this.dronePositionQueriesSvc.getDronePositionsByDroneId(droneId);

            const result = ResResult.success('無人機位置資料獲取成功', dronePositions);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得最新的無人機位置資料
     * @route GET /api/drone-position/data/latest/:droneId
     */
    getLatestDronePosition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);

            // 驗證 Drone ID
            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const latestPosition = await this.dronePositionQueriesSvc.getLatestDronePosition(droneId);

            if (!latestPosition) {
                const result = ResResult.notFound('找不到該無人機的位置資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('最新無人機位置資料獲取成功', latestPosition);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據時間範圍取得無人機位置資料
     * @route GET /api/drone-position/data/timerange/:droneId
     */
    getDronePositionsByTimeRange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);
            const {startTime, endTime} = req.query;

            // 驗證 Drone ID
            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            // 驗證時間參數
            if (!startTime || !endTime) {
                const result = ResResult.badRequest('需要提供開始時間和結束時間');
                res.status(result.status).json(result);
                return;
            }

            const start = new Date(startTime as string);
            const end = new Date(endTime as string);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                const result = ResResult.badRequest('無效的時間格式');
                res.status(result.status).json(result);
                return;
            }

            const dronePositions = await this.dronePositionQueriesSvc.getDronePositionsByTimeRange(droneId, start, end);

            const result = ResResult.success('無人機位置資料獲取成功', dronePositions);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }
}