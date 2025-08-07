/**
 * @fileoverview 無人機即時狀態命令控制器
 * 
 * 此文件實作了無人機即時狀態命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 * 
 * @module DroneRealTimeStatusCommands
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { DroneRealTimeStatusCommandsSvc } from '../../services/commands/DroneRealTimeStatusCommandsSvc.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import type { DroneRealTimeStatusCreationAttributes as ExternalCreationAttributes } from '../../types/services/IDroneRealTimeStatusService.js';

const logger = createLogger('DroneRealTimeStatusCommands');

/**
 * 無人機即時狀態命令控制器類別
 * 
 * 專門處理無人機即時狀態相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 * 
 * @class DroneRealTimeStatusCommands
 * @since 1.0.0
 */
export class DroneRealTimeStatusCommands {
    private droneRealTimeStatusCommandsService: DroneRealTimeStatusCommandsSvc;

    constructor() {
        this.droneRealTimeStatusCommandsService = new DroneRealTimeStatusCommandsSvc();
    }

    /**
     * 創建新的無人機即時狀態資料
     * @route POST /api/drone-realtime-status/data
     */
    async createDroneRealTimeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const statusData: ExternalCreationAttributes = req.body;

            // 基本驗證
            if (!statusData.drone_id || typeof statusData.drone_id !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, 'Creating new drone real-time status data');
            logger.info('Drone real-time status creation request received', { data: statusData });

            const createdData = await this.droneRealTimeStatusCommandsService.createDroneRealTimeStatus(statusData);

            const result = ControllerResult.created('無人機即時狀態資料創建成功', createdData);
            res.status(result.status).json(result);

            logger.info('Drone real-time status creation completed successfully', {
                id: createdData.id,
                droneId: createdData.drone_id
            });

        } catch (error) {
            logger.error('Error in createDroneRealTimeStatus', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 更新指定無人機即時狀態資料
     * @route PUT /api/drone-realtime-status/data/:id
     */
    async updateDroneRealTimeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const updateData: Partial<ExternalCreationAttributes> = req.body;

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Updating drone real-time status data with ID: ${id}`);
            logger.info('Drone real-time status update request received', { id, data: updateData });

            const updatedData = await this.droneRealTimeStatusCommandsService.updateDroneRealTimeStatus(id, updateData);

            if (!updatedData) {
                const result = ControllerResult.notFound('找不到指定的無人機即時狀態資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機即時狀態資料更新成功', updatedData);
            res.status(result.status).json(result);

            logger.info('Drone real-time status update completed successfully', { id });

        } catch (error) {
            logger.error('Error in updateDroneRealTimeStatus', {
                id: req.params.id,
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 刪除指定無人機即時狀態資料
     * @route DELETE /api/drone-realtime-status/data/:id
     */
    async deleteDroneRealTimeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Deleting drone real-time status data with ID: ${id}`);
            logger.info('Drone real-time status deletion request received', { id });

            const deletedRows = await this.droneRealTimeStatusCommandsService.deleteDroneRealTimeStatus(id);

            if (deletedRows === 0) {
                const result = ControllerResult.notFound('找不到指定的無人機即時狀態資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機即時狀態資料刪除成功');
            res.status(result.status).json(result);

            logger.info('Drone real-time status deletion completed successfully', { id });

        } catch (error) {
            logger.error('Error in deleteDroneRealTimeStatus', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 更新無人機即時狀態
     * @route PATCH /api/drone-realtime-status/data/:droneId/status
     */
    async updateDroneRealTimeStatusByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const statusData: Partial<ExternalCreationAttributes> = req.body;

            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Updating drone real-time status for drone ID: ${droneId}`);
            logger.info('Drone real-time status by drone ID update request received', { droneId, data: statusData });

            const updatedData = await this.droneRealTimeStatusCommandsService.updateDroneRealTimeStatusByDroneId(droneId, statusData);

            if (!updatedData) {
                const result = ControllerResult.notFound('找不到該無人機的即時狀態資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機即時狀態更新成功', updatedData);
            res.status(result.status).json(result);

            logger.info('Drone real-time status by drone ID update completed successfully', { droneId });

        } catch (error) {
            logger.error('Error in updateDroneRealTimeStatusByDroneId', {
                droneId: req.params.droneId,
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 批量更新無人機即時狀態
     * @route PUT /api/drone-realtime-status/data/batch
     */
    async updateDroneRealTimeStatusesBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const statusUpdates: Array<{ droneId: number; statusData: Partial<ExternalCreationAttributes> }> = req.body;

            if (!Array.isArray(statusUpdates) || statusUpdates.length === 0) {
                const result = ControllerResult.badRequest('請提供有效的狀態更新資料陣列');
                res.status(result.status).json(result);
                return;
            }

            // 驗證每筆資料
            for (let i = 0; i < statusUpdates.length; i++) {
                const update = statusUpdates[i];
                if (!update.droneId || typeof update.droneId !== 'number') {
                    const result = ControllerResult.badRequest(`第 ${i + 1} 筆資料的無人機 ID 無效`);
                    res.status(result.status).json(result);
                    return;
                }
            }

            logRequest(req, `Batch updating ${statusUpdates.length} drone real-time statuses`);
            logger.info('Drone real-time status batch update request received', { count: statusUpdates.length });

            const updatedStatuses = await this.droneRealTimeStatusCommandsService.updateDroneRealTimeStatusesBatch(statusUpdates);

            const result = ControllerResult.success('批量無人機即時狀態更新成功', updatedStatuses);
            res.status(result.status).json(result);

            logger.info('Drone real-time status batch update completed successfully', {
                count: updatedStatuses.length
            });

        } catch (error) {
            logger.error('Error in updateDroneRealTimeStatusesBatch', {
                body: req.body,
                error
            });
            next(error);
        }
    }
}