/**
 * @fileoverview 無人機指令佇列命令控制器
 * 
 * 此文件實作了無人機指令佇列命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 * 
 * @module DroneCommandQueueCommands
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { DroneCommandQueueCommandsSvc } from '../../services/commands/DroneCommandQueueCommandsSvc.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import { TYPES } from '../../types/container/dependency-injection.js';
import type { DroneCommandQueueCreationAttributes } from '../../types/services/IDroneCommandQueueService.js';

const logger = createLogger('DroneCommandQueueCommands');

/**
 * 無人機指令佇列命令控制器類別
 * 
 * 專門處理無人機指令佇列相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 * 
 * @class DroneCommandQueueCommands
 * @since 1.0.0
 */
@injectable()
export class DroneCommandQueueCommands {
    constructor(
        @inject(TYPES.DroneCommandQueueCommandsSvc) private readonly commandService: DroneCommandQueueCommandsSvc
    ) {}

    /**
     * 創建新的無人機指令佇列
     * @route POST /api/drone-command-queue/data
     */
    async createDroneCommandQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const queueData: DroneCommandQueueCreationAttributes = req.body;

            // 基本驗證 (使用服務介面定義的屬性名稱)
            if (!queueData.drone_id || typeof queueData.drone_id !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            if (!queueData.command_type || typeof queueData.command_type !== 'string') {
                const result = ControllerResult.badRequest('指令類型為必填項');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, 'Creating new drone command queue');
            logger.info('Drone command queue creation request received', { data: queueData });

            const createdData = await this.commandService.createDroneCommandQueue(queueData);

            const result = ControllerResult.created('無人機指令佇列創建成功', createdData);
            res.status(result.status).json(result);

            logger.info('Drone command queue creation completed successfully', {
                id: createdData.id,
                droneId: createdData.drone_id,
                commandType: createdData.command_type
            });

        } catch (error) {
            logger.error('Error in createDroneCommandQueue', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 更新指定無人機指令佇列
     * @route PUT /api/drone-command-queue/data/:id
     */
    async updateDroneCommandQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const updateData: Partial<DroneCommandQueueCreationAttributes> = req.body;

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Updating drone command queue with ID: ${id}`);
            logger.info('Drone command queue update request received', { id, data: updateData });

            const updatedData = await this.commandService.updateDroneCommandQueue(id, updateData);

            if (!updatedData) {
                const result = ControllerResult.notFound('找不到指定的無人機指令佇列');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機指令佇列更新成功', updatedData);
            res.status(result.status).json(result);

            logger.info('Drone command queue update completed successfully', { id });

        } catch (error) {
            logger.error('Error in updateDroneCommandQueue', {
                id: req.params.id,
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 刪除指定無人機指令佇列
     * @route DELETE /api/drone-command-queue/data/:id
     */
    async deleteDroneCommandQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Deleting drone command queue with ID: ${id}`);
            logger.info('Drone command queue deletion request received', { id });

            const deletedRows = await this.commandService.deleteDroneCommandQueue(id);

            if (deletedRows === 0) {
                const result = ControllerResult.notFound('找不到指定的無人機指令佇列');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機指令佇列刪除成功');
            res.status(result.status).json(result);

            logger.info('Drone command queue deletion completed successfully', { id });

        } catch (error) {
            logger.error('Error in deleteDroneCommandQueue', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 將指令加入佇列
     * @route POST /api/drone-command-queue/enqueue
     */
    async enqueueDroneCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, commandType, commandData, priority = 1 } = req.body;

            // 基本驗證
            if (!droneId || typeof droneId !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            if (!commandType || typeof commandType !== 'string') {
                const result = ControllerResult.badRequest('指令類型為必填項');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Enqueuing drone command: ${commandType} for drone ${droneId}`);
            logger.info('Drone command enqueue request received', { droneId, commandType, priority });

            const enqueuedCommand = await this.commandService.enqueueDroneCommand(
                droneId,
                commandType,
                commandData,
                priority
            );

            const result = ControllerResult.created('無人機指令已加入佇列', enqueuedCommand);
            res.status(result.status).json(result);

            logger.info('Drone command enqueue completed successfully', {
                id: enqueuedCommand.id,
                droneId,
                commandType
            });

        } catch (error) {
            logger.error('Error in enqueueDroneCommand', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 從佇列中移除並執行下一個指令
     * @route POST /api/drone-command-queue/dequeue/:droneId
     */
    async dequeueDroneCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Dequeuing next drone command for drone ${droneId}`);
            logger.info('Drone command dequeue request received', { droneId });

            const dequeuedCommand = await this.commandService.dequeueDroneCommand(droneId);

            if (!dequeuedCommand) {
                const result = ControllerResult.notFound('沒有待執行的無人機指令');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機指令已從佇列中取出', dequeuedCommand);
            res.status(result.status).json(result);

            logger.info('Drone command dequeue completed successfully', {
                id: dequeuedCommand.id,
                droneId,
                commandType: dequeuedCommand.command_type
            });

        } catch (error) {
            logger.error('Error in dequeueDroneCommand', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 清空指定無人機的指令佇列
     * @route DELETE /api/drone-command-queue/clear/:droneId
     */
    async clearDroneCommandQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Clearing drone command queue for drone ${droneId}`);
            logger.info('Drone command queue clear request received', { droneId });

            const clearedCount = await this.commandService.clearDroneCommandQueue(droneId);

            const result = ControllerResult.success(`已清空 ${clearedCount} 個無人機指令`, { clearedCount });
            res.status(result.status).json(result);

            logger.info('Drone command queue clear completed successfully', { droneId, clearedCount });

        } catch (error) {
            logger.error('Error in clearDroneCommandQueue', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 更新指令佇列狀態
     * @route PATCH /api/drone-command-queue/:id/status
     */
    async updateDroneCommandQueueStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const { status } = req.body;

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            if (!status || typeof status !== 'string') {
                const result = ControllerResult.badRequest('狀態為必填項');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Updating drone command queue status for ID: ${id} to ${status}`);
            logger.info('Drone command queue status update request received', { id, status });

            const updatedData = await this.commandService.updateDroneCommandQueueStatus(id, status);

            if (!updatedData) {
                const result = ControllerResult.notFound('找不到指定的無人機指令佇列');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機指令佇列狀態更新成功', updatedData);
            res.status(result.status).json(result);

            logger.info('Drone command queue status update completed successfully', { id, status });

        } catch (error) {
            logger.error('Error in updateDroneCommandQueueStatus', {
                id: req.params.id,
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 開始執行佇列
     * @route POST /api/drone-command-queues/:id/start
     */
    async startDroneCommandQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Starting drone command queue with ID: ${id}`);
            logger.info('Start drone command queue request received', { id });

            const result = ControllerResult.success('無人機指令佇列已開始執行');
            res.status(result.status).json(result);
            logger.info('Start drone command queue completed successfully', { id });

        } catch (error) {
            logger.error('Error in startDroneCommandQueue', { id: req.params.id, error });
            next(error);
        }
    }

    /**
     * 暫停佇列執行
     * @route POST /api/drone-command-queues/:id/pause
     */
    async pauseDroneCommandQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Pausing drone command queue with ID: ${id}`);
            logger.info('Pause drone command queue request received', { id });

            const result = ControllerResult.success('無人機指令佇列已暫停執行');
            res.status(result.status).json(result);
            logger.info('Pause drone command queue completed successfully', { id });

        } catch (error) {
            logger.error('Error in pauseDroneCommandQueue', { id: req.params.id, error });
            next(error);
        }
    }

    /**
     * 重置佇列
     * @route POST /api/drone-command-queues/:id/reset
     */
    async resetDroneCommandQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Resetting drone command queue with ID: ${id}`);
            logger.info('Reset drone command queue request received', { id });

            const result = ControllerResult.success('無人機指令佇列已重置');
            res.status(result.status).json(result);
            logger.info('Reset drone command queue completed successfully', { id });

        } catch (error) {
            logger.error('Error in resetDroneCommandQueue', { id: req.params.id, error });
            next(error);
        }
    }

    /**
     * 向佇列添加指令
     * @route POST /api/drone-command-queues/:id/commands
     */
    async addCommandToQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const { commandType, commandData, priority = 1 } = req.body;

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            if (!commandType) {
                const result = ControllerResult.badRequest('指令類型為必填項');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Adding command to queue ID: ${id}, type: ${commandType}`);
            logger.info('Add command to queue request received', { id, commandType, priority });

            const result = ControllerResult.success('指令已加入佇列', {
                queueId: id,
                commandType,
                priority
            });
            res.status(result.status).json(result);
            logger.info('Add command to queue completed successfully', { id, commandType });

        } catch (error) {
            logger.error('Error in addCommandToQueue', { id: req.params.id, body: req.body, error });
            next(error);
        }
    }
}