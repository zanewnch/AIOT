/**
 * @fileoverview 無人機指令查詢控制器
 * 
 * 此文件實作了無人機指令查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 * 
 * @module DroneCommandQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { DroneCommandQueriesSvc } from '../../services/queries/DroneCommandQueriesSvc.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import { TYPES } from '../../types/container/dependency-injection.js';

const logger = createLogger('DroneCommandQueries');

/**
 * 無人機指令查詢控制器類別
 * 
 * 專門處理無人機指令相關的查詢請求，包含取得指令資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 * 
 * @class DroneCommandQueries
 * @since 1.0.0
 */
@injectable()
export class DroneCommandQueries {
    constructor(
        @inject(TYPES.DroneCommandQueriesSvc) private readonly queryService: DroneCommandQueriesSvc
    ) {}

    /**
     * 取得所有無人機指令
     * @route GET /api/drone-commands/data
     */
    async getAllCommands(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 100;

            logRequest(req, `Getting all commands with limit: ${limit}`);
            logger.info('Commands retrieval request received', { limit });

            const commands = await this.queryService.getAllCommands(limit);
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
     * @route GET /api/drone-commands/data/:id
     */
    async getCommandById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的指令 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting command by ID: ${id}`);
            logger.info('Command by ID request received', { id });

            const command = await this.queryService.getCommandById(id);
            
            if (!command) {
                const result = ControllerResult.notFound('找不到指定的無人機指令');
                res.status(result.status).json(result);
                return;
            }

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
     * 根據無人機查詢指令
     * @route GET /api/drone-commands/data/drone/:droneId
     */
    async getCommandsByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const limit = parseInt(req.query.limit as string) || 50;

            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting commands by drone ID: ${droneId}`);
            logger.info('Commands by drone ID request received', { droneId, limit });

            const commands = await this.queryService.getCommandsByDroneId(droneId, limit);
            const result = ControllerResult.success('無人機指令獲取成功', commands);

            res.status(result.status).json(result);
            logger.info('Commands by drone ID retrieval completed successfully', {
                droneId,
                count: commands.length
            });
        } catch (error) {
            logger.error('Error in getCommandsByDroneId', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 根據狀態查詢指令
     * @route GET /api/drone-commands/data/status/:status
     */
    async getCommandsByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const status = req.params.status;
            const limit = parseInt(req.query.limit as string) || 50;

            if (!status || typeof status !== 'string' || status.trim().length === 0) {
                const result = ControllerResult.badRequest('狀態參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting commands by status: ${status}`);
            logger.info('Commands by status request received', { status, limit });

            const commands = await this.queryService.getCommandsByStatus(status as any, limit);
            const result = ControllerResult.success('無人機指令獲取成功', commands);

            res.status(result.status).json(result);
            logger.info('Commands by status retrieval completed successfully', {
                status,
                count: commands.length
            });
        } catch (error) {
            logger.error('Error in getCommandsByStatus', {
                status: req.params.status,
                error
            });
            next(error);
        }
    }

    /**
     * 根據類型查詢指令
     * @route GET /api/drone-commands/data/type/:type
     */
    async getCommandsByType(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const type = req.params.type;
            const limit = parseInt(req.query.limit as string) || 50;

            if (!type || typeof type !== 'string' || type.trim().length === 0) {
                const result = ControllerResult.badRequest('類型參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting commands by type: ${type}`);
            logger.info('Commands by type request received', { type, limit });

            const commands = await this.queryService.getCommandsByType(type as any, limit);
            const result = ControllerResult.success('無人機指令獲取成功', commands);

            res.status(result.status).json(result);
            logger.info('Commands by type retrieval completed successfully', {
                type,
                count: commands.length
            });
        } catch (error) {
            logger.error('Error in getCommandsByType', {
                type: req.params.type,
                error
            });
            next(error);
        }
    }

    /**
     * 取得指令統計
     * @route GET /api/drone-commands/statistics
     */
    async getCommandStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Getting command statistics');
            logger.info('Command statistics request received');

            const statistics = await this.queryService.getCommandStatistics();
            const result = ControllerResult.success('無人機指令統計獲取成功', statistics);

            res.status(result.status).json(result);
            logger.info('Command statistics retrieval completed successfully');
        } catch (error) {
            logger.error('Error in getCommandStatistics', { error });
            next(error);
        }
    }

    /**
     * 取得指令類型統計
     * @route GET /api/drone-commands/statistics/types
     */
    async getCommandTypeStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Getting command type statistics');
            logger.info('Command type statistics request received');

            const typeStats = await this.queryService.getCommandTypeStatistics();
            const result = ControllerResult.success('無人機指令類型統計獲取成功', typeStats);

            res.status(result.status).json(result);
            logger.info('Command type statistics retrieval completed successfully');
        } catch (error) {
            logger.error('Error in getCommandTypeStatistics', { error });
            next(error);
        }
    }

    /**
     * 取得無人機指令摘要
     * @route GET /api/drone-commands/summary/:droneId
     */
    async getCommandSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting command summary for drone ID: ${droneId}`);
            logger.info('Command summary request received', { droneId });

            const summary = await this.queryService.getDroneCommandSummary(droneId);
            const result = ControllerResult.success('無人機指令摘要獲取成功', summary);

            res.status(result.status).json(result);
            logger.info('Command summary retrieval completed successfully', { droneId });
        } catch (error) {
            logger.error('Error in getCommandSummary', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 取得待執行的指令
     * @route GET /api/drone-commands/data/pending
     */
    async getPendingCommands(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 50;

            logRequest(req, `Getting pending commands with limit: ${limit}`);
            logger.info('Pending commands request received', { limit });

            const commands = await this.queryService.getLatestCommands(limit);
            const result = ControllerResult.success('待執行無人機指令獲取成功', commands);

            res.status(result.status).json(result);
            logger.info('Pending commands retrieval completed successfully', {
                count: commands.length
            });
        } catch (error) {
            logger.error('Error in getPendingCommands', { error });
            next(error);
        }
    }

    /**
     * 取得執行中的指令
     * @route GET /api/drone-commands/data/executing
     */
    async getExecutingCommands(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 50;

            logRequest(req, `Getting executing commands with limit: ${limit}`);
            logger.info('Executing commands request received', { limit });

            const commands = await this.queryService.getLatestCommands(limit);
            const result = ControllerResult.success('執行中無人機指令獲取成功', commands);

            res.status(result.status).json(result);
            logger.info('Executing commands retrieval completed successfully', {
                count: commands.length
            });
        } catch (error) {
            logger.error('Error in getExecutingCommands', { error });
            next(error);
        }
    }

    /**
     * 取得最新的指令記錄
     * @route GET /api/drone-commands/data/latest
     */
    async getLatestCommands(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 20;

            logRequest(req, `Getting latest commands with limit: ${limit}`);
            logger.info('Latest commands request received', { limit });

            const commands = await this.queryService.getLatestCommands(limit);
            const result = ControllerResult.success('最新指令獲取成功', commands);

            res.status(result.status).json(result);
            logger.info('Latest commands retrieval completed successfully', {
                count: commands.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getLatestCommands', { limit: req.query.limit, error });
            next(error);
        }
    }

    /**
     * 取得失敗的指令
     * @route GET /api/drone-commands/data/failed
     */
    async getFailedCommands(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 50;

            logRequest(req, `Getting failed commands with limit: ${limit}`);
            logger.info('Failed commands request received', { limit });

            const commands = await this.queryService.getFailedCommands(limit);
            const result = ControllerResult.success('失敗指令獲取成功', commands);

            res.status(result.status).json(result);
            logger.info('Failed commands retrieval completed successfully', {
                count: commands.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getFailedCommands', { limit: req.query.limit, error });
            next(error);
        }
    }

    /**
     * 根據發送者查詢指令
     * @route GET /api/drone-commands/data/issued-by/:userId
     */
    async getCommandsByIssuedBy(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const issuedBy = parseInt(req.params.userId);
            const limit = parseInt(req.query.limit as string) || 50;

            // 驗證 issuedBy 參數
            if (isNaN(issuedBy)) {
                const result = ControllerResult.badRequest('無效的用戶 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting commands by issued by: ${issuedBy}`);
            logger.info('Commands by issued by request received', { issuedBy, limit });

            const commands = await this.queryService.getCommandsByIssuedBy(issuedBy, limit);
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
     * @route GET /api/drone-commands/data/date-range
     */
    async getCommandsByDateRange(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const startDate = new Date(req.query.startDate as string);
            const endDate = new Date(req.query.endDate as string);
            const limit = parseInt(req.query.limit as string) || 100;

            // 驗證日期參數
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                const result = ControllerResult.badRequest('無效的日期格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting commands by date range: ${startDate} to ${endDate}`);
            logger.info('Commands by date range request received', { startDate, endDate, limit });

            const commands = await this.queryService.getCommandsByDateRange(startDate, endDate, limit);
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
     * @route GET /api/drone-commands/data/drone/:droneId/pending
     */
    async getPendingCommandsByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            // 驗證 droneId 參數
            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting pending commands for drone: ${droneId}`);
            logger.info('Pending commands by drone ID request received', { droneId });

            const commands = await this.queryService.getPendingCommandsByDroneId(droneId);
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
     * @route GET /api/drone-commands/data/drone/:droneId/executing
     */
    async getExecutingCommandByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            // 驗證 droneId 參數
            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting executing command for drone: ${droneId}`);
            logger.info('Executing command by drone ID request received', { droneId });

            const command = await this.queryService.getExecutingCommandByDroneId(droneId);
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
     * 取得無人機指令執行摘要
     * @route GET /api/drone-commands/summary/:droneId
     */
    async getDroneCommandSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            // 驗證 droneId 參數
            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting command summary for drone: ${droneId}`);
            logger.info('Drone command summary request received', { droneId });

            const summary = await this.queryService.getDroneCommandSummary(droneId);
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
}