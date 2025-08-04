/**
 * @fileoverview 無人機指令控制器
 * 負責處理無人機指令的 HTTP 端點
 * 提供指令發送、狀態管理和執行監控的 API 功能
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @description API 端點說明：
 * - GET /api/drone-commands/data - 取得所有指令
 * - GET /api/drone-commands/data/:id - 取得指定指令
 * - POST /api/drone-commands/data - 創建新指令
 * - POST /api/drone-commands/data/batch - 批量創建指令
 * - PUT /api/drone-commands/data/:id - 更新指令
 * - DELETE /api/drone-commands/data/:id - 刪除指令
 * - GET /api/drone-commands/data/drone/:droneId - 根據無人機查詢指令
 * - GET /api/drone-commands/data/status/:status - 根據狀態查詢指令
 * - GET /api/drone-commands/data/type/:type - 根據類型查詢指令
 * - POST /api/drone-commands/send/takeoff - 發送起飛指令
 * - POST /api/drone-commands/send/land - 發送降落指令
 * - POST /api/drone-commands/send/move - 發送移動指令
 * - POST /api/drone-commands/send/hover - 發送懸停指令
 * - POST /api/drone-commands/send/return - 發送返航指令
 * - PUT /api/drone-commands/:id/execute - 執行指令
 * - PUT /api/drone-commands/:id/complete - 完成指令
 * - PUT /api/drone-commands/:id/fail - 標記指令失敗
 * - PUT /api/drone-commands/:id/cancel - 取消指令
 * - GET /api/drone-commands/statistics - 取得指令統計
 * - GET /api/drone-commands/statistics/types - 取得指令類型統計
 * - GET /api/drone-commands/summary/:droneId - 取得無人機指令摘要
 */

import { Request, Response, NextFunction } from 'express';
import { DroneCommandService } from '../services/DroneCommandService.js';
import type { IDroneCommandService } from '../types/services/IDroneCommandService.js';
import type { PaginationParams } from '../types/ApiResponseType.js';
import { createLogger, logRequest } from '../configs/loggerConfig.js';
import { ControllerResult } from '../utils/ControllerResult.js';
import type { DroneCommandCreationAttributes, DroneCommandType, DroneCommandStatus } from '../models/DroneCommandModel.js';

// 創建控制器專用的日誌記錄器
const logger = createLogger('DroneCommandController');

/**
 * 無人機指令控制器類別
 *
 * 處理所有與無人機指令相關的 HTTP 請求
 * 使用 Service 層進行業務邏輯處理
 *
 * @class DroneCommandController
 */
export class DroneCommandController {
    private commandService: IDroneCommandService;

    /**
     * 建構子
     */
    constructor() {
        this.commandService = new DroneCommandService();
    }

    /**
     * 取得所有無人機指令
     *
     * @route GET /api/drone-commands/data
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getAllCommands(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 100;

            logRequest(req.originalUrl, req.method, `Getting all commands with limit: ${limit}`);
            logger.info('Commands retrieval request received', { limit });

            const commands = await this.commandService.getAllCommands(limit);
            const result = ControllerResult.success('無人機指令獲取成功', commands);

            res.status(result.status).json(result);
            logger.info('Commands retrieval completed successfully', {
                count: commands.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getAllCommands', { error, limit: req.query.limit });
            next(error);
        }
    }

    /**
     * 根據 ID 取得無人機指令
     *
     * @route GET /api/drone-commands/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getCommandById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            logRequest(req.originalUrl, req.method, `Getting command by ID: ${id}`);
            logger.info('Command by ID request received', { id });

            const command = await this.commandService.getCommandById(id);
            const result = ControllerResult.success('無人機指令獲取成功', command);

            res.status(result.status).json(result);
            logger.info('Command by ID retrieval completed successfully', { id });
        } catch (error) {
            logger.error('Error in getCommandById', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 創建新的無人機指令
     *
     * @route POST /api/drone-commands/data
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async createCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const commandData: DroneCommandCreationAttributes = req.body;

            logRequest(req.originalUrl, req.method, 'Creating new command');
            logger.info('Command creation request received', { commandData });

            const result = await this.commandService.createCommand(commandData);
            
            if (result.success) {
                const response = ControllerResult.created('無人機指令創建成功', result.command);
                res.status(response.status).json(response);
                logger.info('Command creation completed successfully', {
                    id: result.command.id
                });
            } else {
                const response = ControllerResult.badRequest(result.message, null, result.error);
                res.status(response.status).json(response);
                logger.warn('Command creation failed', { error: result.error });
            }
        } catch (error) {
            logger.error('Error in createCommand', {
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 批量創建無人機指令
     *
     * @route POST /api/drone-commands/data/batch
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async createBatchCommands(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const commandsData: DroneCommandCreationAttributes[] = req.body;

            logRequest(req.originalUrl, req.method, `Batch creating ${commandsData.length} commands`);
            logger.info('Batch command creation request received', { count: commandsData.length });

            const result = await this.commandService.createBatchCommands(commandsData);
            const response = ControllerResult.success('批量指令創建完成', result);

            res.status(response.status).json(response);
            logger.info('Batch command creation completed', {
                total: result.total,
                successful: result.successCount,
                failed: result.failedCount
            });
        } catch (error) {
            logger.error('Error in createBatchCommands', {
                count: req.body?.length,
                error
            });
            next(error);
        }
    }

    /**
     * 更新無人機指令
     *
     * @route PUT /api/drone-commands/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async updateCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const updateData: Partial<DroneCommandCreationAttributes> = req.body;

            logRequest(req.originalUrl, req.method, `Updating command with ID: ${id}`);
            logger.info('Command update request received', { id, updateData });

            const updatedCommand = await this.commandService.updateCommand(id, updateData);
            const result = ControllerResult.success('無人機指令更新成功', updatedCommand);

            res.status(result.status).json(result);
            logger.info('Command update completed successfully', { id });
        } catch (error) {
            logger.error('Error in updateCommand', {
                id: req.params.id,
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 刪除無人機指令
     *
     * @route DELETE /api/drone-commands/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async deleteCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            logRequest(req.originalUrl, req.method, `Deleting command with ID: ${id}`);
            logger.info('Command deletion request received', { id });

            await this.commandService.deleteCommand(id);
            const result = ControllerResult.success('無人機指令刪除成功');

            res.status(result.status).json(result);
            logger.info('Command deletion completed successfully', { id });
        } catch (error) {
            logger.error('Error in deleteCommand', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 根據無人機 ID 查詢指令
     *
     * @route GET /api/drone-commands/data/drone/:droneId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getCommandsByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const limit = parseInt(req.query.limit as string) || 50;

            logRequest(req.originalUrl, req.method, `Getting commands for drone: ${droneId}`);
            logger.info('Commands by drone ID request received', { droneId, limit });

            const commands = await this.commandService.getCommandsByDroneId(droneId, limit);
            const result = ControllerResult.success('無人機指令獲取成功', commands);

            res.status(result.status).json(result);
            logger.info('Commands by drone ID retrieval completed successfully', {
                droneId,
                count: commands.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getCommandsByDroneId', {
                droneId: req.params.droneId,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 根據指令狀態查詢
     *
     * @route GET /api/drone-commands/data/status/:status
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getCommandsByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const status = req.params.status as DroneCommandStatus;
            const limit = parseInt(req.query.limit as string) || 50;

            logRequest(req.originalUrl, req.method, `Getting commands by status: ${status}`);
            logger.info('Commands by status request received', { status, limit });

            const commands = await this.commandService.getCommandsByStatus(status, limit);
            const result = ControllerResult.success('無人機指令獲取成功', commands);

            res.status(result.status).json(result);
            logger.info('Commands by status retrieval completed successfully', {
                status,
                count: commands.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getCommandsByStatus', {
                status: req.params.status,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 根據指令類型查詢
     *
     * @route GET /api/drone-commands/data/type/:type
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getCommandsByType(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const commandType = req.params.type as DroneCommandType;
            const limit = parseInt(req.query.limit as string) || 50;

            logRequest(req.originalUrl, req.method, `Getting commands by type: ${commandType}`);
            logger.info('Commands by type request received', { commandType, limit });

            const commands = await this.commandService.getCommandsByType(commandType, limit);
            const result = ControllerResult.success('無人機指令獲取成功', commands);

            res.status(result.status).json(result);
            logger.info('Commands by type retrieval completed successfully', {
                commandType,
                count: commands.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getCommandsByType', {
                commandType: req.params.type,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 根據發送者查詢指令
     *
     * @route GET /api/drone-commands/data/issued-by/:userId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getCommandsByIssuedBy(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const issuedBy = parseInt(req.params.userId);
            const limit = parseInt(req.query.limit as string) || 50;

            logRequest(req.originalUrl, req.method, `Getting commands by issued by: ${issuedBy}`);
            logger.info('Commands by issued by request received', { issuedBy, limit });

            const commands = await this.commandService.getCommandsByIssuedBy(issuedBy, limit);
            const result = ControllerResult.success('無人機指令獲取成功', commands);

            res.status(result.status).json(result);
            logger.info('Commands by issued by retrieval completed successfully', {
                issuedBy,
                count: commands.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getCommandsByIssuedBy', {
                issuedBy: req.params.userId,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 根據時間範圍查詢指令
     *
     * @route GET /api/drone-commands/data/date-range
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getCommandsByDateRange(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const startDate = new Date(req.query.startDate as string);
            const endDate = new Date(req.query.endDate as string);
            const limit = parseInt(req.query.limit as string) || 100;

            logRequest(req.originalUrl, req.method, `Getting commands by date range: ${startDate} to ${endDate}`);
            logger.info('Commands by date range request received', { startDate, endDate, limit });

            const commands = await this.commandService.getCommandsByDateRange(startDate, endDate, limit);
            const result = ControllerResult.success('無人機指令獲取成功', commands);

            res.status(result.status).json(result);
            logger.info('Commands by date range retrieval completed successfully', {
                startDate,
                endDate,
                count: commands.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getCommandsByDateRange', {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 取得無人機的待執行指令
     *
     * @route GET /api/drone-commands/data/drone/:droneId/pending
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getPendingCommandsByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            logRequest(req.originalUrl, req.method, `Getting pending commands for drone: ${droneId}`);
            logger.info('Pending commands by drone ID request received', { droneId });

            const commands = await this.commandService.getPendingCommandsByDroneId(droneId);
            const result = ControllerResult.success('待執行指令獲取成功', commands);

            res.status(result.status).json(result);
            logger.info('Pending commands by drone ID retrieval completed successfully', {
                droneId,
                count: commands.length
            });
        } catch (error) {
            logger.error('Error in getPendingCommandsByDroneId', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 取得正在執行的指令
     *
     * @route GET /api/drone-commands/data/drone/:droneId/executing
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getExecutingCommandByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            logRequest(req.originalUrl, req.method, `Getting executing command for drone: ${droneId}`);
            logger.info('Executing command by drone ID request received', { droneId });

            const command = await this.commandService.getExecutingCommandByDroneId(droneId);
            const result = ControllerResult.success('執行中指令獲取成功', command);

            res.status(result.status).json(result);
            logger.info('Executing command by drone ID retrieval completed successfully', { droneId });
        } catch (error) {
            logger.error('Error in getExecutingCommandByDroneId', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 取得最新的指令記錄
     *
     * @route GET /api/drone-commands/data/latest
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getLatestCommands(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 20;

            logRequest(req.originalUrl, req.method, `Getting latest commands with limit: ${limit}`);
            logger.info('Latest commands request received', { limit });

            const commands = await this.commandService.getLatestCommands(limit);
            const result = ControllerResult.success('最新指令獲取成功', commands);

            res.status(result.status).json(result);
            logger.info('Latest commands retrieval completed successfully', {
                count: commands.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getLatestCommands', {
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 取得失敗的指令
     *
     * @route GET /api/drone-commands/data/failed
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getFailedCommands(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 50;

            logRequest(req.originalUrl, req.method, `Getting failed commands with limit: ${limit}`);
            logger.info('Failed commands request received', { limit });

            const commands = await this.commandService.getFailedCommands(limit);
            const result = ControllerResult.success('失敗指令獲取成功', commands);

            res.status(result.status).json(result);
            logger.info('Failed commands retrieval completed successfully', {
                count: commands.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getFailedCommands', {
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 發送起飛指令
     *
     * @route POST /api/drone-commands/send/takeoff
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async sendTakeoffCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, issuedBy, altitude, speed } = req.body;

            logRequest(req.originalUrl, req.method, `Sending takeoff command for drone: ${droneId}`);
            logger.info('Takeoff command request received', { droneId, issuedBy, altitude, speed });

            const result = await this.commandService.sendTakeoffCommand(droneId, issuedBy, { altitude, speed });
            
            if (result.success) {
                const response = ControllerResult.created('起飛指令發送成功', result.command);
                res.status(response.status).json(response);
                logger.info('Takeoff command sent successfully', { droneId, commandId: result.command.id });
            } else {
                const response = ControllerResult.badRequest(result.message, null, result.error);
                res.status(response.status).json(response);
                logger.warn('Takeoff command failed', { droneId, error: result.error });
            }
        } catch (error) {
            logger.error('Error in sendTakeoffCommand', {
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 發送降落指令
     *
     * @route POST /api/drone-commands/send/land
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async sendLandCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, issuedBy, speed } = req.body;

            logRequest(req.originalUrl, req.method, `Sending land command for drone: ${droneId}`);
            logger.info('Land command request received', { droneId, issuedBy, speed });

            const result = await this.commandService.sendLandCommand(droneId, issuedBy, { speed });
            
            if (result.success) {
                const response = ControllerResult.created('降落指令發送成功', result.command);
                res.status(response.status).json(response);
                logger.info('Land command sent successfully', { droneId, commandId: result.command.id });
            } else {
                const response = ControllerResult.badRequest(result.message, null, result.error);
                res.status(response.status).json(response);
                logger.warn('Land command failed', { droneId, error: result.error });
            }
        } catch (error) {
            logger.error('Error in sendLandCommand', {
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 發送移動指令
     *
     * @route POST /api/drone-commands/send/move
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async sendMoveCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, issuedBy, latitude, longitude, altitude, speed } = req.body;

            logRequest(req.originalUrl, req.method, `Sending move command for drone: ${droneId}`);
            logger.info('Move command request received', { droneId, issuedBy, latitude, longitude, altitude, speed });

            const result = await this.commandService.sendMoveCommand(droneId, issuedBy, { latitude, longitude, altitude, speed });
            
            if (result.success) {
                const response = ControllerResult.created('移動指令發送成功', result.command);
                res.status(response.status).json(response);
                logger.info('Move command sent successfully', { droneId, commandId: result.command.id });
            } else {
                const response = ControllerResult.badRequest(result.message, null, result.error);
                res.status(response.status).json(response);
                logger.warn('Move command failed', { droneId, error: result.error });
            }
        } catch (error) {
            logger.error('Error in sendMoveCommand', {
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 發送懸停指令
     *
     * @route POST /api/drone-commands/send/hover
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async sendHoverCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, issuedBy, duration } = req.body;

            logRequest(req.originalUrl, req.method, `Sending hover command for drone: ${droneId}`);
            logger.info('Hover command request received', { droneId, issuedBy, duration });

            const result = await this.commandService.sendHoverCommand(droneId, issuedBy, { duration });
            
            if (result.success) {
                const response = ControllerResult.created('懸停指令發送成功', result.command);
                res.status(response.status).json(response);
                logger.info('Hover command sent successfully', { droneId, commandId: result.command.id });
            } else {
                const response = ControllerResult.badRequest(result.message, null, result.error);
                res.status(response.status).json(response);
                logger.warn('Hover command failed', { droneId, error: result.error });
            }
        } catch (error) {
            logger.error('Error in sendHoverCommand', {
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 發送返航指令
     *
     * @route POST /api/drone-commands/send/return
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async sendReturnCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, issuedBy, speed } = req.body;

            logRequest(req.originalUrl, req.method, `Sending return command for drone: ${droneId}`);
            logger.info('Return command request received', { droneId, issuedBy, speed });

            const result = await this.commandService.sendReturnCommand(droneId, issuedBy, { speed });
            
            if (result.success) {
                const response = ControllerResult.created('返航指令發送成功', result.command);
                res.status(response.status).json(response);
                logger.info('Return command sent successfully', { droneId, commandId: result.command.id });
            } else {
                const response = ControllerResult.badRequest(result.message, null, result.error);
                res.status(response.status).json(response);
                logger.warn('Return command failed', { droneId, error: result.error });
            }
        } catch (error) {
            logger.error('Error in sendReturnCommand', {
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 執行指令（標記為執行中）
     *
     * @route PUT /api/drone-commands/:id/execute
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async executeCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const commandId = parseInt(req.params.id);

            logRequest(req.originalUrl, req.method, `Executing command: ${commandId}`);
            logger.info('Execute command request received', { commandId });

            const result = await this.commandService.executeCommand(commandId);
            
            if (result.success) {
                const response = ControllerResult.success('指令開始執行', result.command);
                res.status(response.status).json(response);
                logger.info('Command execution started successfully', { commandId });
            } else {
                const response = ControllerResult.badRequest(result.message, null, result.error);
                res.status(response.status).json(response);
                logger.warn('Command execution failed', { commandId, error: result.error });
            }
        } catch (error) {
            logger.error('Error in executeCommand', {
                commandId: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 完成指令
     *
     * @route PUT /api/drone-commands/:id/complete
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async completeCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const commandId = parseInt(req.params.id);

            logRequest(req.originalUrl, req.method, `Completing command: ${commandId}`);
            logger.info('Complete command request received', { commandId });

            const result = await this.commandService.completeCommand(commandId);
            
            if (result.success) {
                const response = ControllerResult.success('指令執行完成', result.command);
                res.status(response.status).json(response);
                logger.info('Command completed successfully', { commandId });
            } else {
                const response = ControllerResult.badRequest(result.message, null, result.error);
                res.status(response.status).json(response);
                logger.warn('Command completion failed', { commandId, error: result.error });
            }
        } catch (error) {
            logger.error('Error in completeCommand', {
                commandId: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 標記指令失敗
     *
     * @route PUT /api/drone-commands/:id/fail
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async failCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const commandId = parseInt(req.params.id);
            const { errorMessage } = req.body;

            logRequest(req.originalUrl, req.method, `Marking command as failed: ${commandId}`);
            logger.info('Fail command request received', { commandId, errorMessage });

            const result = await this.commandService.failCommand(commandId, errorMessage);
            
            if (result.success) {
                const response = ControllerResult.success('指令標記為失敗', result.command);
                res.status(response.status).json(response);
                logger.info('Command marked as failed successfully', { commandId });
            } else {
                const response = ControllerResult.badRequest(result.message, null, result.error);
                res.status(response.status).json(response);
                logger.warn('Command fail marking failed', { commandId, error: result.error });
            }
        } catch (error) {
            logger.error('Error in failCommand', {
                commandId: req.params.id,
                errorMessage: req.body.errorMessage,
                error
            });
            next(error);
        }
    }

    /**
     * 取消待執行指令
     *
     * @route PUT /api/drone-commands/:id/cancel
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async cancelCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const commandId = parseInt(req.params.id);
            const { reason } = req.body;

            logRequest(req.originalUrl, req.method, `Cancelling command: ${commandId}`);
            logger.info('Cancel command request received', { commandId, reason });

            const result = await this.commandService.cancelCommand(commandId, reason);
            
            if (result.success) {
                const response = ControllerResult.success('指令已取消', result.command);
                res.status(response.status).json(response);
                logger.info('Command cancelled successfully', { commandId });
            } else {
                const response = ControllerResult.badRequest(result.message, null, result.error);
                res.status(response.status).json(response);
                logger.warn('Command cancellation failed', { commandId, error: result.error });
            }
        } catch (error) {
            logger.error('Error in cancelCommand', {
                commandId: req.params.id,
                reason: req.body.reason,
                error
            });
            next(error);
        }
    }

    /**
     * 取得指令統計資料
     *
     * @route GET /api/drone-commands/statistics
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getCommandStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

            logRequest(req.originalUrl, req.method, 'Getting command statistics');
            logger.info('Command statistics request received', { startDate, endDate });

            const statistics = await this.commandService.getCommandStatistics(startDate, endDate);
            const result = ControllerResult.success('指令統計獲取成功', statistics);

            res.status(result.status).json(result);
            logger.info('Command statistics retrieval completed successfully', {
                startDate,
                endDate,
                statistics
            });
        } catch (error) {
            logger.error('Error in getCommandStatistics', {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                error
            });
            next(error);
        }
    }

    /**
     * 取得指令類型統計
     *
     * @route GET /api/drone-commands/statistics/types
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getCommandTypeStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

            logRequest(req.originalUrl, req.method, 'Getting command type statistics');
            logger.info('Command type statistics request received', { startDate, endDate });

            const typeStats = await this.commandService.getCommandTypeStatistics(startDate, endDate);
            const result = ControllerResult.success('指令類型統計獲取成功', typeStats);

            res.status(result.status).json(result);
            logger.info('Command type statistics retrieval completed successfully', {
                startDate,
                endDate,
                typeStatsCount: typeStats.length
            });
        } catch (error) {
            logger.error('Error in getCommandTypeStatistics', {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                error
            });
            next(error);
        }
    }

    /**
     * 取得無人機指令執行摘要
     *
     * @route GET /api/drone-commands/summary/:droneId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getDroneCommandSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            logRequest(req.originalUrl, req.method, `Getting command summary for drone: ${droneId}`);
            logger.info('Drone command summary request received', { droneId });

            const summary = await this.commandService.getDroneCommandSummary(droneId);
            const result = ControllerResult.success('無人機指令摘要獲取成功', summary);

            res.status(result.status).json(result);
            logger.info('Drone command summary retrieval completed successfully', {
                droneId,
                totalCommands: summary.totalCommands
            });
        } catch (error) {
            logger.error('Error in getDroneCommandSummary', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 重試失敗的指令
     *
     * @route POST /api/drone-commands/:id/retry
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async retryFailedCommand(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const commandId = parseInt(req.params.id);
            const { issuedBy } = req.body;

            logRequest(req.originalUrl, req.method, `Retrying failed command: ${commandId}`);
            logger.info('Retry failed command request received', { commandId, issuedBy });

            const result = await this.commandService.retryFailedCommand(commandId, issuedBy);
            
            if (result.success) {
                const response = ControllerResult.created('指令重試成功', result.command);
                res.status(response.status).json(response);
                logger.info('Command retried successfully', { originalCommandId: commandId, newCommandId: result.command.id });
            } else {
                const response = ControllerResult.badRequest(result.message, null, result.error);
                res.status(response.status).json(response);
                logger.warn('Command retry failed', { commandId, error: result.error });
            }
        } catch (error) {
            logger.error('Error in retryFailedCommand', {
                commandId: req.params.id,
                issuedBy: req.body.issuedBy,
                error
            });
            next(error);
        }
    }
}

// 創建控制器實例並匯出方法
const commandController = new DroneCommandController();

export const getAllCommands = commandController.getAllCommands.bind(commandController);
export const getCommandById = commandController.getCommandById.bind(commandController);
export const createCommand = commandController.createCommand.bind(commandController);
export const createBatchCommands = commandController.createBatchCommands.bind(commandController);
export const updateCommand = commandController.updateCommand.bind(commandController);
export const deleteCommand = commandController.deleteCommand.bind(commandController);
export const getCommandsByDroneId = commandController.getCommandsByDroneId.bind(commandController);
export const getCommandsByStatus = commandController.getCommandsByStatus.bind(commandController);
export const getCommandsByType = commandController.getCommandsByType.bind(commandController);
export const getCommandsByIssuedBy = commandController.getCommandsByIssuedBy.bind(commandController);
export const getCommandsByDateRange = commandController.getCommandsByDateRange.bind(commandController);
export const getPendingCommandsByDroneId = commandController.getPendingCommandsByDroneId.bind(commandController);
export const getExecutingCommandByDroneId = commandController.getExecutingCommandByDroneId.bind(commandController);
export const getLatestCommands = commandController.getLatestCommands.bind(commandController);
export const getFailedCommands = commandController.getFailedCommands.bind(commandController);
export const sendTakeoffCommand = commandController.sendTakeoffCommand.bind(commandController);
export const sendLandCommand = commandController.sendLandCommand.bind(commandController);
export const sendMoveCommand = commandController.sendMoveCommand.bind(commandController);
export const sendHoverCommand = commandController.sendHoverCommand.bind(commandController);
export const sendReturnCommand = commandController.sendReturnCommand.bind(commandController);
export const executeCommand = commandController.executeCommand.bind(commandController);
export const completeCommand = commandController.completeCommand.bind(commandController);
export const failCommand = commandController.failCommand.bind(commandController);
export const cancelCommand = commandController.cancelCommand.bind(commandController);
export const getCommandStatistics = commandController.getCommandStatistics.bind(commandController);
export const getCommandTypeStatistics = commandController.getCommandTypeStatistics.bind(commandController);
export const getDroneCommandSummary = commandController.getDroneCommandSummary.bind(commandController);
export const retryFailedCommand = commandController.retryFailedCommand.bind(commandController);