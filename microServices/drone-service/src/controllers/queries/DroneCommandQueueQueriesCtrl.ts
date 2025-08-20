/**
 * @fileoverview 無人機指令佇列查詢控制器
 *
 * 此文件實作了無人機指令佇列查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DroneCommandQueueQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {NextFunction, Request, Response} from 'express';
import {DroneCommandQueueQueriesSvc} from '../../services/queries/DroneCommandQueueQueriesSvc.js';
import {createLogger} from '../../configs/loggerConfig.js';
import {ResResult} from '../../utils/ResResult.js';
import {TYPES} from '../../container/types.js';
import {DroneCommandQueueStatus} from '../../models/DroneCommandQueueModel.js';

const logger = createLogger('DroneCommandQueueQueries');

/**
 * 無人機指令佇列查詢控制器類別
 *
 * 專門處理無人機指令佇列相關的查詢請求，包含取得佇列資料等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DroneCommandQueueQueries
 * @since 1.0.0
 */
@injectable()
export class DroneCommandQueueQueries {
    constructor(
        @inject(TYPES.DroneCommandQueueQueriesSvc) private readonly queryService: DroneCommandQueueQueriesSvc
    ) {
    }

    /**
     * 取得所有無人機指令佇列資料（支援分頁）
     * @route GET /api/drone-command-queue/data
     * @query page - 頁碼（從 1 開始）
     * @query pageSize - 每頁數量
     * @query sortBy - 排序欄位
     * @query sortOrder - 排序方向（ASC/DESC）
     */
    getAllDroneCommandQueues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
                const queues = await this.queryService.getAllDroneCommandQueues();
                const result = ResResult.success('無人機指令佇列獲取成功', queues);
                res.status(result.status).json(result);
                return;
            }

            // 使用分頁查詢
            const paginatedResult = await this.queryService.getDroneCommandQueuesPaginated(paginationParams);
            const result = ResResult.success('無人機指令佇列獲取成功', paginatedResult);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據 ID 取得無人機指令佇列資料
     * @route GET /api/drone-command-queue/data/:id
     */
    getDroneCommandQueueById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const commandQueue = await this.queryService.getDroneCommandQueueById(id);

            if (!commandQueue) {
                const result = ResResult.notFound('找不到指定的無人機指令佇列資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('無人機指令佇列資料獲取成功', commandQueue);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據無人機 ID 取得指令佇列
     * @route GET /api/drone-command-queue/data/drone/:droneId
     */
    getDroneCommandQueueByDroneId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);

            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const commandQueue = await this.queryService.getDroneCommandQueueByDroneId(droneId);

            const result = ResResult.success('無人機指令佇列資料獲取成功', commandQueue);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據狀態取得指令佇列
     * @route GET /api/drone-command-queue/data/status/:status
     */
    getDroneCommandQueuesByStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const status = req.params.status;

            if (!status || typeof status !== 'string' || status.trim().length === 0) {
                const result = ResResult.badRequest('狀態參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            const commandQueues = await this.queryService.getDroneCommandQueuesByStatus(status.trim() as DroneCommandQueueStatus);

            const result = ResResult.success('無人機指令佇列資料獲取成功', commandQueues);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據優先級取得指令佇列
     * @route GET /api/drone-command-queue/data/priority/:priority
     */
    getDroneCommandQueuesByPriority = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const priority = parseInt(req.params.priority);

            if (isNaN(priority)) {
                const result = ResResult.badRequest('無效的優先級格式');
                res.status(result.status).json(result);
                return;
            }

            const commandQueues = await this.queryService.getDroneCommandQueuesByPriority(priority);

            const result = ResResult.success('無人機指令佇列資料獲取成功', commandQueues);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得待執行的指令佇列
     * @route GET /api/drone-command-queue/data/pending
     */
    getPendingDroneCommandQueues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pendingQueues = await this.queryService.getPendingDroneCommandQueues();

            const result = ResResult.success('待執行指令佇列獲取成功', pendingQueues);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得指令佇列統計資料
     * @route GET /api/drone-command-queue/statistics
     */
    getDroneCommandQueueStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const statistics = await this.queryService.getDroneCommandQueueStatistics();

            const result = ResResult.success('無人機指令佇列統計資料獲取成功', statistics);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得無人機的下一個指令
     * @route GET /api/drone-command-queue/next/:droneId
     */
    getNextDroneCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);

            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const nextCommand = await this.queryService.getNextDroneCommand(droneId);

            if (!nextCommand) {
                const result = ResResult.notFound('沒有待執行的無人機指令');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('下一個無人機指令獲取成功', nextCommand);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得佇列統計
     * @route GET /api/drone-command-queues/statistics
     */
    getQueueStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const statistics = await this.queryService.getDroneCommandQueueStatistics();
            const result = ResResult.success('佇列統計獲取成功', statistics);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }
}