/**
 * @fileoverview 無人機指令歷史歸檔命令控制器
 * 
 * 此文件實作了無人機指令歷史歸檔命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含創建、更新、刪除等寫入邏輯。
 * 
 * @module DroneCommandsArchiveCommands
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { DroneCommandsArchiveCommandsSvc } from '../../services/commands/DroneCommandsArchiveCommandsSvc.js';
import { createLogger, logRequest } from '@aiot/shared-packages/loggerConfig.js';
import { ControllerResult } from '@aiot/shared-packages/ControllerResult.js';
import { TYPES } from '../../types/dependency-injection.js';
import { Logger, LogController } from '../../decorators/LoggerDecorator.js';
import type { DroneCommandsArchiveCreationAttributes } from '../../models/DroneCommandsArchiveModel.js';

const logger = createLogger('DroneCommandsArchiveCommands');

/**
 * 無人機指令歷史歸檔命令控制器類別
 * 
 * 專門處理無人機指令歷史歸檔相關的命令請求，包含創建、更新、刪除等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 * 
 * @class DroneCommandsArchiveCommands
 * @since 1.0.0
 */
@injectable()
export class DroneCommandsArchiveCommands {
    constructor(
        @inject(TYPES.DroneCommandsArchiveCommandsSvc) private readonly commandService: DroneCommandsArchiveCommandsSvc
    ) {}

    /**
     * 創建指令歷史歸檔記錄
     * @route POST /api/drone-commands-archive/data
     */
    @LogController()
    async createCommandArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const archiveData: DroneCommandsArchiveCreationAttributes = req.body;

            // 基本驗證
            if (!archiveData.drone_id || typeof archiveData.drone_id !== 'number') {
                const result = ControllerResult.badRequest('無人機 ID 為必填項且必須為數字');
                res.status(result.status).json(result);
                return;
            }

            if (!archiveData.command_type || typeof archiveData.command_type !== 'string') {
                const result = ControllerResult.badRequest('指令類型為必填項');
                res.status(result.status).json(result);
                return;
            }
const createdArchive = await this.commandService.createCommandArchive(archiveData);
            const result = ControllerResult.created('指令歷史歸檔記錄創建成功', createdArchive);

            res.status(result.status).json(result);
} catch (error) {
            next(error);
        }
    }

    /**
     * 更新指令歷史歸檔資料
     * @route PUT /api/drone-commands-archive/data/:id
     */
    @LogController()
    async updateCommandArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const updateData: Partial<DroneCommandsArchiveCreationAttributes> = req.body;

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
const updatedArchive = await this.commandService.updateCommandArchive(id, updateData);

            if (!updatedArchive) {
                const result = ControllerResult.notFound('找不到指定的指令歷史歸檔記錄');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('指令歷史歸檔資料更新成功', updatedArchive);
            res.status(result.status).json(result);
} catch (error) {
            next(error);
        }
    }

    /**
     * 刪除指令歷史歸檔資料
     * @route DELETE /api/drone-commands-archive/data/:id
     */
    @LogController()
    async deleteCommandArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }
const isDeleted = await this.commandService.deleteCommandArchive(id);

            if (!isDeleted) {
                const result = ControllerResult.notFound('找不到指定的指令歷史歸檔記錄');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('指令歷史歸檔資料刪除成功');
            res.status(result.status).json(result);
} catch (error) {
            next(error);
        }
    }
}