/**
 * @fileoverview 無人機狀態命令控制器
 * 
 * 此文件實作了無人機狀態命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 * 
 * @module DroneStatusCommands
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { DroneStatusCommandsSvc } from '../../services/commands/DroneStatusCommandsSvc.js';
import { createLogger, logRequest } from '@aiot/shared-packages/loggerConfig.js';
import { ControllerResult } from '@aiot/shared-packages/ControllerResult.js';
import { TYPES } from '../../types/dependency-injection.js';
import type { DroneStatusCreationAttributes, DroneStatus } from '../../models/DroneStatusModel.js';

const logger = createLogger('DroneStatusCommands');

/**
 * 無人機狀態命令控制器類別
 * 
 * 專門處理無人機狀態相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 * 
 * @class DroneStatusCommands
 * @since 1.0.0
 */
@injectable()
export class DroneStatusCommands {
    constructor(
        @inject(TYPES.DroneStatusCommandsSvc) private readonly droneStatusService: DroneStatusCommandsSvc
    ) {}

    /**
     * 創建新的無人機狀態資料
     * @route POST /api/drone-status/data
     */
    async createDroneStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneStatusData: DroneStatusCreationAttributes = req.body;

            logRequest(req, 'Creating new drone status data');
            logger.info('Drone status creation request received', { data: droneStatusData });

            // 呼叫服務層創建資料
            const createdData = await this.droneStatusService.createDroneStatus(droneStatusData);

            // 建立成功回應
            const result = ControllerResult.created('無人機狀態資料創建成功', createdData);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drone status creation completed successfully', {
                id: createdData.id
            });

        } catch (error) {
            logger.error('Error in createDroneStatus', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 更新指定無人機狀態資料
     * @route PUT /api/drone-status/data/:id
     */
    async updateDroneStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const updateData: Partial<DroneStatusCreationAttributes> = req.body;

            // 驗證 ID
            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Updating drone status data with ID: ${id}`);
            logger.info('Drone status update request received', { id, data: updateData });

            // 呼叫服務層更新資料
            const updatedData = await this.droneStatusService.updateDroneStatus(id, updateData);

            if (!updatedData) {
                const result = ControllerResult.notFound('找不到指定的無人機狀態資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機狀態資料更新成功', updatedData);
            res.status(result.status).json(result);

            logger.info('Drone status update completed successfully', { id });

        } catch (error) {
            logger.error('Error in updateDroneStatus', {
                id: req.params.id,
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 刪除指定無人機狀態資料
     * @route DELETE /api/drone-status/data/:id
     */
    async deleteDroneStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            // 驗證 ID
            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Deleting drone status data with ID: ${id}`);
            logger.info('Drone status deletion request received', { id });

            // 呼叫服務層刪除資料
            await this.droneStatusService.deleteDroneStatus(id);

            // 刪除成功（如果沒有拋出錯誤）
            const result = ControllerResult.success('無人機狀態資料刪除成功');
            res.status(result.status).json(result);

            logger.info('Drone status deletion completed successfully', { id });

        } catch (error) {
            logger.error('Error in deleteDroneStatus', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 更新無人機狀態
     * @route PATCH /api/drone-status/data/:id/status
     */
    async updateDroneStatusOnly(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const { status } = req.body;

            // 驗證 ID
            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            // 驗證狀態
            if (!status || typeof status !== 'string' || status.trim().length === 0) {
                const result = ControllerResult.badRequest('狀態不能為空');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Updating drone status only for ID: ${id} to ${status}`);
            logger.info('Drone status only update request received', { id, status });

            // 呼叫服務層更新狀態
            const updatedData = await this.droneStatusService.updateDroneStatusOnly(id, status as DroneStatus);

            if (!updatedData) {
                const result = ControllerResult.notFound('找不到指定的無人機狀態資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機狀態更新成功', updatedData);
            res.status(result.status).json(result);

            logger.info('Drone status only update completed successfully', { id, status });

        } catch (error) {
            logger.error('Error in updateDroneStatusOnly', {
                id: req.params.id,
                body: req.body,
                error
            });
            next(error);
        }
    }
}