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
import {inject, injectable} from 'inversify';
import {NextFunction, Request, Response} from 'express';
import {DroneRealTimeStatusQueriesSvc} from '../../services/queries/DroneRealTimeStatusQueriesSvc.js';
import {createLogger} from '../../configs/loggerConfig.js';
import {ResResult} from '../../utils/ResResult.js';
import {TYPES} from '../../container/types.js';

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
    ) {
    }

    /**
     * 取得所有無人機即時狀態資料（支援分頁）
     * @route GET /api/drone-realtime-status/data
     * @query page - 頁碼（從 1 開始）
     * @query pageSize - 每頁數量
     * @query sortBy - 排序欄位
     * @query sortOrder - 排序方向（ASC/DESC）
     */
    getAllDroneRealTimeStatuses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
                const droneStatuses = await this.droneRealTimeStatusQueriesService.getAllDroneRealTimeStatuses();
                const result = ResResult.success('無人機即時狀態資料獲取成功', droneStatuses);
                res.status(result.status).json(result);
                return;
            }

            // 使用分頁查詢
            const paginatedResult = await this.droneRealTimeStatusQueriesService.getDroneRealTimeStatusesPaginated(paginationParams);
            const result = ResResult.success('無人機即時狀態資料獲取成功', paginatedResult);

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
                const result = ResResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const droneStatus = await this.droneRealTimeStatusQueriesService.getDroneRealTimeStatusById(id);

            if (!droneStatus) {
                const result = ResResult.notFound('找不到指定的無人機即時狀態資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('無人機即時狀態資料獲取成功', droneStatus);
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
                const result = ResResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const droneStatus = await this.droneRealTimeStatusQueriesService.getDroneRealTimeStatusByDroneId(droneId);

            if (!droneStatus) {
                const result = ResResult.notFound('找不到該無人機的即時狀態資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('無人機即時狀態資料獲取成功', droneStatus);
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
                const result = ResResult.badRequest('狀態參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            const droneStatuses = await this.droneRealTimeStatusQueriesService.getDroneRealTimeStatusesByStatus(status.trim());

            const result = ResResult.success('無人機即時狀態資料獲取成功', droneStatuses);
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
            const result = ResResult.success('活躍無人機即時狀態資料獲取成功', droneStatuses);
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

            const result = ResResult.success('無人機即時狀態統計獲取成功', statistics);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }
}