/**
 * @fileoverview 無人機狀態歷史歸檔命令控制器
 * 
 * 此文件實作了無人機狀態歷史歸檔命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 * 
 * @module DroneStatusArchiveCommands
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { DroneStatusArchiveCommandsSvc } from '../../services/commands/DroneStatusArchiveCommandsSvc.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import { TYPES } from '../../types/container/dependency-injection.js';
import type { DroneStatusArchiveCreationAttributes } from '../../models/drone/DroneStatusArchiveModel.js';

const logger = createLogger('DroneStatusArchiveCommands');

/**
 * 無人機狀態歷史歸檔命令控制器類別
 * 
 * 專門處理無人機狀態歷史歸檔相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 * 
 * @class DroneStatusArchiveCommands
 * @since 1.0.0
 */
@injectable()
export class DroneStatusArchiveCommands {
    constructor(
        @inject(TYPES.DroneStatusArchiveCommandsSvc) private readonly commandService: DroneStatusArchiveCommandsSvc
    ) {}

    /**
     * 創建狀態歷史歸檔
     * @route POST /api/drone-status-archive/data
     */
    async createStatusArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const archiveData: DroneStatusArchiveCreationAttributes = req.body;

            // 基本驗證
            if (!archiveData.drone_id || typeof archiveData.drone_id !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            if (!archiveData.status) {
                const result = ControllerResult.badRequest('無人機狀態為必填項');
                res.status(result.status).json(result);
                return;
            }
            
            if (!archiveData.reason || archiveData.reason.trim() === '') {
                const result = ControllerResult.badRequest('變更原因為必填項');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Creating status archive for drone ID: ${archiveData.drone_id}`);
            logger.info('Status archive creation request received', {
                drone_id: archiveData.drone_id,
                status: archiveData.status,
                previous_status: archiveData.previous_status,
                reason: archiveData.reason
            });

            const createdArchive = await this.commandService.createStatusArchive(archiveData);
            const result = ControllerResult.created('狀態歷史歸檔記錄創建成功', createdArchive);

            res.status(result.status).json(result);
            logger.info('Status archive creation completed successfully', {
                id: createdArchive.id,
                drone_id: archiveData.drone_id
            });

        } catch (error) {
            logger.error('Error in createStatusArchive', {
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 更新狀態歷史歸檔
     * @route PUT /api/drone-status-archive/data/:id
     */
    async updateStatusArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const updateData: Partial<DroneStatusArchiveCreationAttributes> = req.body;

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            if (!updateData || Object.keys(updateData).length === 0) {
                const result = ControllerResult.badRequest('更新資料不能為空');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Updating status archive with ID: ${id}`);
            logger.info('Status archive update request received', { id, updateData });

            const updatedArchive = await this.commandService.updateStatusArchive(id, updateData);

            if (!updatedArchive) {
                const result = ControllerResult.notFound('找不到指定的狀態歷史歸檔記錄');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('狀態歷史歸檔資料更新成功', updatedArchive);
            res.status(result.status).json(result);

            logger.info('Status archive update completed successfully', { id });

        } catch (error) {
            logger.error('Error in updateStatusArchive', {
                id: req.params.id,
                body: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 刪除狀態歷史歸檔
     * @route DELETE /api/drone-status-archive/data/:id
     */
    async deleteStatusArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Deleting status archive with ID: ${id}`);
            logger.info('Status archive deletion request received', { id });

            await this.commandService.deleteStatusArchive(id);

            const result = ControllerResult.success('狀態歷史歸檔資料刪除成功');
            res.status(result.status).json(result);

            logger.info('Status archive deletion completed successfully', { id });

        } catch (error) {
            logger.error('Error in deleteStatusArchive', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }
}