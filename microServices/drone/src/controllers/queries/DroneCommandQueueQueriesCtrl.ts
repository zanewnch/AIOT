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
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { DroneCommandQueueQueriesSvc } from '../../services/queries/DroneCommandQueueQueriesSvc.js';
import { createLogger, logRequest } from '../../../../../packages/loggerConfig.js';
import { ControllerResult } from '../../../../../packages/ControllerResult.js';
import { TYPES } from '../../types/dependency-injection.js';

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
    ) {}

    /**
     * 取得所有無人機指令佇列資料
     * @route GET /api/drone-command-queue/data
     */
    async getAllDroneCommandQueues(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Getting all drone command queue data');
            logger.info('Drone command queue data retrieval request received');

            const commandQueues = await this.queryService.getAllDroneCommandQueues();

            const result = ControllerResult.success('無人機指令佇列資料獲取成功', commandQueues);
            res.status(result.status).json(result);

            logger.info('Drone command queue data retrieval completed successfully', {
                count: commandQueues.length
            });

        } catch (error) {
            logger.error('Error in getAllDroneCommandQueues', { error });
            next(error);
        }
    }

    /**
     * 根據 ID 取得無人機指令佇列資料
     * @route GET /api/drone-command-queue/data/:id
     */
    async getDroneCommandQueueById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting drone command queue data with ID: ${id}`);
            logger.info('Drone command queue data retrieval request received', { id });

            const commandQueue = await this.queryService.getDroneCommandQueueById(id);

            if (!commandQueue) {
                const result = ControllerResult.notFound('找不到指定的無人機指令佇列資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機指令佇列資料獲取成功', commandQueue);
            res.status(result.status).json(result);

            logger.info('Drone command queue data retrieval completed successfully', { id });

        } catch (error) {
            logger.error('Error in getDroneCommandQueueById', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 根據無人機 ID 取得指令佇列
     * @route GET /api/drone-command-queue/data/drone/:droneId
     */
    async getDroneCommandQueueByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting drone command queue by drone ID: ${droneId}`);
            logger.info('Drone command queue by drone ID retrieval request received', { droneId });

            const commandQueue = await this.queryService.getDroneCommandQueueByDroneId(droneId);

            const result = ControllerResult.success('無人機指令佇列資料獲取成功', commandQueue);
            res.status(result.status).json(result);

            logger.info('Drone command queue by drone ID retrieval completed successfully', {
                droneId,
                count: commandQueue.length
            });

        } catch (error) {
            logger.error('Error in getDroneCommandQueueByDroneId', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 根據狀態取得指令佇列
     * @route GET /api/drone-command-queue/data/status/:status
     */
    async getDroneCommandQueuesByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const status = req.params.status;

            if (!status || typeof status !== 'string' || status.trim().length === 0) {
                const result = ControllerResult.badRequest('狀態參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting drone command queues by status: ${status}`);
            logger.info('Drone command queues by status retrieval request received', { status });

            const commandQueues = await this.queryService.getDroneCommandQueuesByStatus(status.trim());

            const result = ControllerResult.success('無人機指令佇列資料獲取成功', commandQueues);
            res.status(result.status).json(result);

            logger.info('Drone command queues by status retrieval completed successfully', {
                status,
                count: commandQueues.length
            });

        } catch (error) {
            logger.error('Error in getDroneCommandQueuesByStatus', {
                status: req.params.status,
                error
            });
            next(error);
        }
    }

    /**
     * 根據優先級取得指令佇列
     * @route GET /api/drone-command-queue/data/priority/:priority
     */
    async getDroneCommandQueuesByPriority(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const priority = parseInt(req.params.priority);

            if (isNaN(priority)) {
                const result = ControllerResult.badRequest('無效的優先級格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting drone command queues by priority: ${priority}`);
            logger.info('Drone command queues by priority retrieval request received', { priority });

            const commandQueues = await this.queryService.getDroneCommandQueuesByPriority(priority);

            const result = ControllerResult.success('無人機指令佇列資料獲取成功', commandQueues);
            res.status(result.status).json(result);

            logger.info('Drone command queues by priority retrieval completed successfully', {
                priority,
                count: commandQueues.length
            });

        } catch (error) {
            logger.error('Error in getDroneCommandQueuesByPriority', {
                priority: req.params.priority,
                error
            });
            next(error);
        }
    }

    /**
     * 取得待執行的指令佇列
     * @route GET /api/drone-command-queue/data/pending
     */
    async getPendingDroneCommandQueues(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Getting pending drone command queues');
            logger.info('Pending drone command queues retrieval request received');

            const pendingQueues = await this.queryService.getPendingDroneCommandQueues();

            const result = ControllerResult.success('待執行無人機指令佇列資料獲取成功', pendingQueues);
            res.status(result.status).json(result);

            logger.info('Pending drone command queues retrieval completed successfully', {
                count: pendingQueues.length
            });

        } catch (error) {
            logger.error('Error in getPendingDroneCommandQueues', { error });
            next(error);
        }
    }

    /**
     * 取得指令佇列統計資料
     * @route GET /api/drone-command-queue/statistics
     */
    async getDroneCommandQueueStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Getting drone command queue statistics');
            logger.info('Drone command queue statistics retrieval request received');

            const statistics = await this.queryService.getDroneCommandQueueStatistics();

            const result = ControllerResult.success('無人機指令佇列統計資料獲取成功', statistics);
            res.status(result.status).json(result);

            logger.info('Drone command queue statistics retrieval completed successfully');

        } catch (error) {
            logger.error('Error in getDroneCommandQueueStatistics', { error });
            next(error);
        }
    }

    /**
     * 取得無人機的下一個指令
     * @route GET /api/drone-command-queue/next/:droneId
     */
    async getNextDroneCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting next drone command for drone ID: ${droneId}`);
            logger.info('Next drone command retrieval request received', { droneId });

            const nextCommand = await this.queryService.getNextDroneCommand(droneId);

            if (!nextCommand) {
                const result = ControllerResult.notFound('沒有待執行的無人機指令');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('下一個無人機指令獲取成功', nextCommand);
            res.status(result.status).json(result);

            logger.info('Next drone command retrieval completed successfully', { droneId });

        } catch (error) {
            logger.error('Error in getNextDroneCommand', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 取得佇列統計
     * @route GET /api/drone-command-queues/statistics
     */
    async getQueueStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Getting queue statistics');
            logger.info('Queue statistics request received');

            const statistics = await this.queryService.getDroneCommandQueueStatistics();
            const result = ControllerResult.success('佇列統計獲取成功', statistics);

            res.status(result.status).json(result);
            logger.info('Queue statistics retrieval completed successfully');

        } catch (error) {
            logger.error('Error in getQueueStatistics', { error });
            next(error);
        }
    }
}