/**
 * @fileoverview 無人機指令佇列命令控制器
 *
 * 此文件實作了無人機指令佇列命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * @module DroneCommandQueueCommandsController
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {NextFunction, Request, Response} from 'express';
import {DroneCommandQueueCommandsService} from "./../../services/commands/from.*Service.jsCommandsService.js"';
import {createLogger} from '../../configs/loggerConfig.js';
import {ResResult} from 'aiot-shared-packages';
import {TYPES} from '../../container/types.js';
import {DroneCommandQueueStatus} from '../../models/DroneCommandQueueModel.js';
import type {DroneCommandQueueCreationAttributes} from '../../types/services/IDroneCommandQueueService.js';

const logger = createLogger('DroneCommandQueueCommandsController');

/**
 * 無人機指令佇列命令控制器類別
 *
 * 專門處理無人機指令佇列相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 *
 * @class DroneCommandQueueCommandsController
 * @since 1.0.0
 */
@injectable()
export class DroneCommandQueueCommandsController {
    constructor(
        @inject(TYPES.DroneCommandQueueCommandsService) private readonly commandService: DroneCommandQueueCommandsService
    ) {
    }

    /**
     * 創建新的無人機指令佇列
     * @route POST /api/drone-command-queue/data
     */
    createDroneCommandQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const queueData: DroneCommandQueueCreationAttributes = req.body;

            // 基本驗證 (使用佇列模型的屬性)
            if (!queueData.name || typeof queueData.name !== 'string') {
                const result = ResResult.badRequest('佇列名稱為必填項');
                res.status(result.status).json(result);
                return;
            }

            if (typeof queueData.auto_execute !== 'boolean') {
                const result = ResResult.badRequest('自動執行設定為必填項');
                res.status(result.status).json(result);
                return;
            }

            const createdData = await this.commandService.createDroneCommandQueue(queueData);

            const result = ResResult.created('無人機指令佇列創建成功', createdData);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 更新指定無人機指令佇列
     * @route PUT /api/drone-command-queue/data/:id
     */
    updateDroneCommandQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const updateData: Partial<DroneCommandQueueCreationAttributes> = req.body;

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }
            const updatedData = await this.commandService.updateDroneCommandQueue(id, updateData);

            if (!updatedData) {
                const result = ResResult.notFound('找不到指定的無人機指令佇列');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('無人機指令佇列更新成功', updatedData);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 刪除指定無人機指令佇列
     * @route DELETE /api/drone-command-queue/data/:id
     */
    deleteDroneCommandQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }
            const deletedRows = await this.commandService.deleteDroneCommandQueue(id);

            if (deletedRows === 0) {
                const result = ResResult.notFound('找不到指定的無人機指令佇列');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('無人機指令佇列刪除成功');
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 將指令加入佇列
     * @route POST /api/drone-command-queue/enqueue
     */
    enqueueDroneCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {droneId, commandType, commandData, priority = 1} = req.body;

            // 基本驗證
            if (!droneId || typeof droneId !== 'number') {
                const result = ResResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            if (!commandType || typeof commandType !== 'string') {
                const result = ResResult.badRequest('指令類型為必填項');
                res.status(result.status).json(result);
                return;
            }
            const enqueuedCommand = await this.commandService.enqueueDroneCommand(
                droneId,
                commandType,
                commandData,
                priority
            );

            const result = ResResult.created('無人機指令已加入佇列', enqueuedCommand);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 從佇列中移除並執行下一個指令
     * @route POST /api/drone-command-queue/dequeue/:droneId
     */
    dequeueDroneCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);

            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }
            const dequeuedCommand = await this.commandService.dequeueDroneCommand(droneId);

            if (!dequeuedCommand) {
                const result = ResResult.notFound('沒有待執行的無人機指令');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('無人機指令已從佇列中取出', dequeuedCommand);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 清空指定無人機的指令佇列
     * @route DELETE /api/drone-command-queue/clear/:droneId
     */
    clearDroneCommandQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);

            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }
            const clearedCount = await this.commandService.clearDroneCommandQueue(droneId);

            const result = ResResult.success(`已清空 ${clearedCount} 個無人機指令`, {clearedCount});
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 更新指令佇列狀態
     * @route PATCH /api/drone-command-queue/:id/status
     */
    updateDroneCommandQueueStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const {status} = req.body;

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            if (!status || typeof status !== 'string') {
                const result = ResResult.badRequest('狀態為必填項');
                res.status(result.status).json(result);
                return;
            }

            // 驗證狀態是否為有效的枚舉值
            const validStatuses = Object.values(DroneCommandQueueStatus);
            if (!validStatuses.includes(status as DroneCommandQueueStatus)) {
                const result = ResResult.badRequest(`無效的狀態值。允許的狀態: ${validStatuses.join(', ')}`);
                res.status(result.status).json(result);
                return;
            }
            const updatedData = await this.commandService.updateDroneCommandQueueStatus(id, status as DroneCommandQueueStatus);

            if (!updatedData) {
                const result = ResResult.notFound('找不到指定的無人機指令佇列');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('無人機指令佇列狀態更新成功', updatedData);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 開始執行佇列
     * @route POST /api/drone-command-queues/:id/start
     */
    startDroneCommandQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }
            const result = ResResult.success('無人機指令佇列已開始執行');
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 暫停佇列執行
     * @route POST /api/drone-command-queues/:id/pause
     */
    pauseDroneCommandQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }
            const result = ResResult.success('無人機指令佇列已暫停執行');
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 重置佇列
     * @route POST /api/drone-command-queues/:id/reset
     */
    resetDroneCommandQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }
            const result = ResResult.success('無人機指令佇列已重置');
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 向佇列添加指令
     * @route POST /api/drone-command-queues/:id/commands
     */
    addCommandToQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const {commandType, commandData, priority = 1} = req.body;

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            if (!commandType) {
                const result = ResResult.badRequest('指令類型為必填項');
                res.status(result.status).json(result);
                return;
            }
            const result = ResResult.success('指令已加入佇列', {
                queueId: id,
                commandType,
                priority
            });
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }
}