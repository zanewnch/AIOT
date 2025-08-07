/**
 * @fileoverview 無人機位置命令控制器
 * 
 * 此文件實作了無人機位置命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 * 
 * @module DronePositionCommands
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { DronePositionCommandsSvc } from '../../services/commands/DronePositionCommandsSvc.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import { TYPES } from '../../types/container/dependency-injection.js';
import type { DronePositionCreationAttributes } from '../../models/drone/DronePositionModel.js';

const logger = createLogger('DronePositionCommands');

/**
 * 無人機位置命令控制器類別
 * 
 * 專門處理無人機位置相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 * 
 * @class DronePositionCommands
 * @since 1.0.0
 */
@injectable()
export class DronePositionCommands {
    constructor(
        @inject(TYPES.DronePositionCommandsSvc) private readonly dronePositionCommandsSvc: DronePositionCommandsSvc
    ) {}

    /**
     * 創建新的無人機位置資料
     * @route POST /api/drone-position/data
     */
    async createDronePosition(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dronePositionData: DronePositionCreationAttributes = req.body;

            // 基本驗證
            if (!dronePositionData.drone_id || typeof dronePositionData.drone_id !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            if (typeof dronePositionData.latitude !== 'number' || typeof dronePositionData.longitude !== 'number') {
                const result = ControllerResult.badRequest('緯度和經度為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, 'Creating new drone position data');
            logger.info('Drone position creation request received', { data: dronePositionData });

            // 呼叫命令服務層創建資料
            const createdData = await this.dronePositionCommandsSvc.createDronePosition(dronePositionData);

            // 建立成功回應
            const result = ControllerResult.created('無人機位置資料創建成功', createdData);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drone position creation completed successfully', {
                id: createdData.id,
                droneId: createdData.drone_id
            });

        } catch (error) {
            logger.error('Error in createDronePosition', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 更新指定無人機位置資料
     * @route PUT /api/drone-position/data/:id
     */
    async updateDronePosition(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const updateData: Partial<DronePositionCreationAttributes> = req.body;

            // 驗證 ID
            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            // 驗證更新資料中的數值型別
            if (updateData.latitude !== undefined && typeof updateData.latitude !== 'number') {
                const result = ControllerResult.badRequest('緯度必須為數字');
                res.status(result.status).json(result);
                return;
            }

            if (updateData.longitude !== undefined && typeof updateData.longitude !== 'number') {
                const result = ControllerResult.badRequest('經度必須為數字');
                res.status(result.status).json(result);
                return;
            }

            if (updateData.altitude !== undefined && typeof updateData.altitude !== 'number') {
                const result = ControllerResult.badRequest('高度必須為數字');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Updating drone position data with ID: ${id}`);
            logger.info('Drone position update request received', { id, data: updateData });

            // 呼叫命令服務層更新資料
            const updatedData = await this.dronePositionCommandsSvc.updateDronePosition(id, updateData);

            if (!updatedData) {
                const result = ControllerResult.notFound('找不到指定的無人機位置資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機位置資料更新成功', updatedData);
            res.status(result.status).json(result);

            logger.info('Drone position update completed successfully', { id });

        } catch (error) {
            logger.error('Error in updateDronePosition', {
                id: req.params.id,
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 刪除指定無人機位置資料
     * @route DELETE /api/drone-position/data/:id
     */
    async deleteDronePosition(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            // 驗證 ID
            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Deleting drone position data with ID: ${id}`);
            logger.info('Drone position deletion request received', { id });

            // 呼叫命令服務層刪除資料
            await this.dronePositionCommandsSvc.deleteDronePosition(id);

            // 刪除成功（如果沒有拋出錯誤）
            const result = ControllerResult.success('無人機位置資料刪除成功');
            res.status(result.status).json(result);

            logger.info('Drone position deletion completed successfully', { id });

        } catch (error) {
            logger.error('Error in deleteDronePosition', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 批量創建無人機位置資料
     * @route POST /api/drone-position/data/batch
     */
    async createDronePositionsBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dronePositionsData: DronePositionCreationAttributes[] = req.body;

            // 驗證批量資料
            if (!Array.isArray(dronePositionsData) || dronePositionsData.length === 0) {
                const result = ControllerResult.badRequest('請提供有效的無人機位置資料陣列');
                res.status(result.status).json(result);
                return;
            }

            // 驗證每筆資料
            for (let i = 0; i < dronePositionsData.length; i++) {
                const data = dronePositionsData[i];
                if (!data.drone_id || typeof data.drone_id !== 'number') {
                    const result = ControllerResult.badRequest(`第 ${i + 1} 筆資料的無人機 ID 無效`);
                    res.status(result.status).json(result);
                    return;
                }
                if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
                    const result = ControllerResult.badRequest(`第 ${i + 1} 筆資料的緯度或經度無效`);
                    res.status(result.status).json(result);
                    return;
                }
            }

            logRequest(req, `Creating ${dronePositionsData.length} drone position records in batch`);
            logger.info('Drone position batch creation request received', { count: dronePositionsData.length });

            // 呼叫命令服務層批量創建資料
            const createdData = await this.dronePositionCommandsSvc.createDronePositionsBatch(dronePositionsData);

            const result = ControllerResult.created('批量無人機位置資料創建成功', createdData);
            res.status(result.status).json(result);

            logger.info('Drone position batch creation completed successfully', {
                count: createdData.length
            });

        } catch (error) {
            logger.error('Error in createDronePositionsBatch', {
                body: req.body,
                error
            });
            next(error);
        }
    }
}