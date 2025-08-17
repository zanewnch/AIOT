/**
 * @fileoverview 無人機指令命令控制器 - 使用正確的 Decorator Pattern
 *
 * 這是一個展示如何正確使用 Decorator Pattern 的範例文件。
 * 移除了 TypeScript @decorator 語法糖，改用真正的設計模式實現。
 *
 * @module DroneCommandCommands
 * @author AIOT Team
 * @since 1.0.0
 * @version 2.0.0 - 修正為正確的 Decorator Pattern
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {NextFunction, Request, Response} from 'express';
import {DroneCommandCommandsSvc} from '../services/commands/DroneCommandCommandsSvc.js';
import {createLogger, logRequest} from '@aiot/shared-packages/loggerConfig.js';
import {ControllerResult} from '@aiot/shared-packages/ResResult.js';
import {TYPES} from '../container/types.js';
import type {DroneCommandCreationAttributes} from '../models/DroneCommandModel.js';

// 導入正確的 Decorator Pattern
import {createLoggedController, Logger, LoggerFactory} from '../patterns/LoggerDecorator.js';

/**
 * Logger Factory 實現 - 適配現有的 logger 系統
 */
class DroneServiceLoggerFactory implements LoggerFactory {
    createLogger(name: string): Logger {
        const logger = createLogger(name);
        return {
            info: (message: string, meta?: any) => logger.info(message, meta),
            error: (message: string, meta?: any) => logger.error(message, meta),
            debug: (message: string, meta?: any) => logger.debug(message, meta),
            warn: (message: string, meta?: any) => logger.warn(message, meta)
        };
    }

    logRequest(req: Request, message: string, level?: string): void {
        logRequest(req, message, level as any);
    }
}

/**
 * 原始的無人機指令命令控制器類別（無裝飾器）
 *
 * 專門處理無人機指令相關的命令請求，包含創建、更新、刪除、發送指令等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 *
 * @class DroneCommandCommandsBase
 * @since 2.0.0
 */
@injectable()
export class DroneCommandCommandsBase {
    constructor(
        @inject(TYPES.DroneCommandCommandsSvc) private readonly commandService: DroneCommandCommandsSvc
    ) {
    }

    /**
     * 創建新的無人機指令
     * @route POST /api/drone-commands/data
     */
    createCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const commandData: DroneCommandCreationAttributes = req.body;

            // 基本驗證
            if (!commandData.drone_id || !commandData.command_type || !commandData.command_data) {
                const result = ControllerResult.badRequest('缺少必要的指令資料');
                res.status(result.status).json(result);
                return;
            }

            const command = await this.commandService.createCommand(commandData);

            const result = ControllerResult.created('無人機指令創建成功', command);
            res.status(result.status).json(result);
        } catch (error) {
            const result = ControllerResult.internalError(`創建無人機指令失敗: ${(error as Error).message}`);
            res.status(result.status).json(result);
        }
    };

    /**
     * 更新無人機指令
     * @route PUT /api/drone-commands/:id
     */
    updateCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const commandId = parseInt(req.params.id, 10);
            const updateData = req.body;

            if (isNaN(commandId)) {
                const result = ControllerResult.badRequest('無效的指令 ID');
                res.status(result.status).json(result);
                return;
            }

            const updatedCommand = await this.commandService.updateCommand(commandId, updateData);

            if (!updatedCommand) {
                const result = ControllerResult.notFound(`指令 ${commandId} 不存在`);
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機指令更新成功', updatedCommand);
            res.status(result.status).json(result);
        } catch (error) {
            const result = ControllerResult.internalError(`更新無人機指令失敗: ${(error as Error).message}`);
            res.status(result.status).json(result);
        }
    };

    /**
     * 刪除無人機指令
     * @route DELETE /api/drone-commands/:id
     */
    deleteCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const commandId = parseInt(req.params.id, 10);

            if (isNaN(commandId)) {
                const result = ControllerResult.badRequest('無效的指令 ID');
                res.status(result.status).json(result);
                return;
            }

            const deleted = await this.commandService.deleteCommand(commandId);

            if (!deleted) {
                const result = ControllerResult.notFound(`指令 ${commandId} 不存在`);
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機指令刪除成功');
            res.status(result.status).json(result);
        } catch (error) {
            const result = ControllerResult.internalError(`刪除無人機指令失敗: ${(error as Error).message}`);
            res.status(result.status).json(result);
        }
    };

    /**
     * 執行無人機指令
     * @route POST /api/drone-commands/:id/execute
     */
    executeCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const commandId = parseInt(req.params.id, 10);

            if (isNaN(commandId)) {
                const result = ControllerResult.badRequest('無效的指令 ID');
                res.status(result.status).json(result);
                return;
            }

            const executionResult = await this.commandService.executeCommand(commandId);

            const result = ControllerResult.success('無人機指令執行成功', executionResult);
            res.status(result.status).json(result);
        } catch (error) {
            const result = ControllerResult.internalError(`執行無人機指令失敗: ${(error as Error).message}`);
            res.status(result.status).json(result);
        }
    };

    /**
     * 取消無人機指令
     * @route POST /api/drone-commands/:id/cancel
     */
    cancelCommand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const commandId = parseInt(req.params.id, 10);
            const {reason} = req.body;

            if (isNaN(commandId)) {
                const result = ControllerResult.badRequest('無效的指令 ID');
                res.status(result.status).json(result);
                return;
            }

            const cancelResult = await this.commandService.cancelCommand(commandId, reason);

            const result = ControllerResult.success('無人機指令取消成功', cancelResult);
            res.status(result.status).json(result);
        } catch (error) {
            const result = ControllerResult.internalError(`取消無人機指令失敗: ${(error as Error).message}`);
            res.status(result.status).json(result);
        }
    };
}

/**
 * 工廠方法：創建帶有日誌功能的無人機指令控制器
 *
 * 使用正確的 Decorator Pattern 來包裝控制器，提供自動日誌記錄功能。
 *
 * @param commandService - 無人機指令服務實例
 * @returns 帶有日誌功能的控制器實例
 */
export const createDroneCommandCommands = (commandService: DroneCommandCommandsSvc) => {
    const baseController = new DroneCommandCommandsBase(commandService);
    const loggerFactory = new DroneServiceLoggerFactory();

    return createLoggedController(
        baseController,
        'DroneCommandCommands',
        loggerFactory,
        {
            logExecutionTime: true,
            logRequest: true,
            logErrors: true,
            logLevel: 'info'
        }
    );
};

/**
 * 為了保持向後兼容性，導出帶有日誌功能的類別
 *
 * 注意：這個導出主要是為了與現有的 DI 容器兼容。
 * 建議使用 createDroneCommandCommands 工廠方法。
 */
export {DroneCommandCommandsBase as DroneCommandCommands};