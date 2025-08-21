/**
 * @fileoverview 無人機狀態命令控制器
 *
 * 此文件實作了無人機狀態命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 *
 * @module DroneStatusCommandsCtrl
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {NextFunction, Request, Response} from 'express';
import {DroneStatusCommandsSvc} from '../../services/commands/DroneStatusCommandsSvc.js';
import {createLogger} from '../../configs/loggerConfig.js';
import {ResResult} from '../../utils/ResResult.js';
import {TYPES} from '../../container/types.js';
import {loggerDecorator} from '../../patterns/LoggerDecorator.js';
import type {DroneStatus, DroneStatusCreationAttributes} from '../../models/DroneStatusModel.js';

const logger = createLogger('DroneStatusCommandsCtrl');

/**
 * 無人機狀態命令控制器類別
 *
 * 專門處理無人機狀態相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 *
 * @class DroneStatusCommandsCtrl
 * @since 1.0.0
 */
@injectable()
export class DroneStatusCommandsCtrl {
    /**
     * 創建新的無人機狀態資料
     * @route POST /api/drone-status/data
     */
    createDroneStatus = loggerDecorator(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneStatusData: DroneStatusCreationAttributes = req.body;

            // 呼叫服務層創建資料
            const createdData = await this.droneStatusService.createDroneStatus(droneStatusData);

            // 建立成功回應
            const result = ResResult.created('無人機狀態資料創建成功', createdData);

            // 回傳結果
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }, 'createDroneStatus')
    /**
     * 更新指定無人機狀態資料
     * @route PUT /api/drone-status/data/:id
     */
    updateDroneStatus = loggerDecorator(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const updateData: Partial<DroneStatusCreationAttributes> = req.body;

            // 驗證 ID
            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            // 呼叫服務層更新資料
            const updatedData = await this.droneStatusService.updateDroneStatus(id, updateData);

            if (!updatedData) {
                const result = ResResult.notFound('找不到指定的無人機狀態資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('無人機狀態資料更新成功', updatedData);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }, 'updateDroneStatus')
    /**
     * 刪除指定無人機狀態資料
     * @route DELETE /api/drone-status/data/:id
     */
    deleteDroneStatus = loggerDecorator(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            // 驗證 ID
            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            // 呼叫服務層刪除資料
            await this.droneStatusService.deleteDroneStatus(id);

            // 刪除成功（如果沒有拋出錯誤）
            const result = ResResult.success('無人機狀態資料刪除成功');
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }, 'deleteDroneStatus')
    /**
     * 更新無人機狀態
     * @route PATCH /api/drone-status/data/:id/status
     */
    updateDroneStatusOnly = loggerDecorator(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const {status} = req.body;

            // 驗證 ID
            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            // 驗證狀態
            if (!status || typeof status !== 'string' || status.trim().length === 0) {
                const result = ResResult.badRequest('狀態不能為空');
                res.status(result.status).json(result);
                return;
            }

            // 呼叫服務層更新狀態
            const updatedData = await this.droneStatusService.updateDroneStatusOnly(id, status as DroneStatus);

            if (!updatedData) {
                const result = ResResult.notFound('找不到指定的無人機狀態資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('無人機狀態更新成功', updatedData);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }, 'updateDroneStatusOnly')

    constructor(
        @inject(TYPES.DroneStatusCommandsSvc) private readonly droneStatusService: DroneStatusCommandsSvc
    ) {
    }
}