/**
 * @fileoverview 無人機指令歷史歸檔查詢控制器
 * 
 * 此文件實作了無人機指令歷史歸檔查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 * 
 * @module DroneCommandsArchiveQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { DroneCommandsArchiveQueriesSvc } from '../../services/queries/DroneCommandsArchiveQueriesSvc.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import { TYPES } from '../../types/container/dependency-injection.js';

const logger = createLogger('DroneCommandsArchiveQueries');

/**
 * 無人機指令歷史歸檔查詢控制器類別
 * 
 * 專門處理無人機指令歷史歸檔相關的查詢請求，包含取得指令資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 * 
 * @class DroneCommandsArchiveQueries
 * @since 1.0.0
 */
@injectable()
export class DroneCommandsArchiveQueries {
    constructor(
        @inject(TYPES.DroneCommandsArchiveQueriesSvc) private readonly queryService: DroneCommandsArchiveQueriesSvc
    ) {}

    /**
     * 取得所有指令歷史歸檔資料
     * @route GET /api/drone-commands-archive/data
     */
    async getAllCommandsArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 100;

            logRequest(req, `Getting all commands archive with limit: ${limit}`);
            logger.info('Commands archive retrieval request received', { limit });

            const archives = await this.queryService.getAllCommandsArchive(limit);
            const result = ControllerResult.success('指令歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Commands archive retrieval completed successfully', {
                count: archives.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getAllCommandsArchive', { error, limit: req.query.limit });
            next(error);
        }
    }

    /**
     * 根據 ID 取得指令歷史歸檔資料
     * @route GET /api/drone-commands-archive/data/:id
     */
    async getCommandArchiveById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的指令歷史歸檔 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting command archive by ID: ${id}`);
            logger.info('Command archive by ID request received', { id });

            const archive = await this.queryService.getCommandArchiveById(id);
            
            if (!archive) {
                const result = ControllerResult.notFound('找不到指定的指令歷史歸檔');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('指令歷史歸檔資料獲取成功', archive);
            res.status(result.status).json(result);
            
            logger.info('Command archive by ID retrieval completed successfully', { id });
        } catch (error) {
            logger.error('Error in getCommandArchiveById', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 根據無人機 ID 查詢指令歷史歸檔
     * @route GET /api/drone-commands-archive/data/drone/:droneId
     */
    async getCommandArchivesByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const limit = parseInt(req.query.limit as string) || 50;

            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting command archives by drone ID: ${droneId}`);
            logger.info('Command archives by drone ID request received', { droneId, limit });

            const archives = await this.queryService.getCommandArchivesByDroneId(droneId, limit);
            const result = ControllerResult.success('指令歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Command archives by drone ID retrieval completed successfully', {
                droneId,
                count: archives.length
            });
        } catch (error) {
            logger.error('Error in getCommandArchivesByDroneId', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 根據時間範圍查詢指令歷史歸檔
     * @route GET /api/drone-commands-archive/data/time-range
     */
    async getCommandArchivesByTimeRange(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);
            const limit = parseInt(req.query.limit as string) || 100;

            // 驗證日期參數
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ControllerResult.badRequest('無效的時間格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting command archives by time range: ${startTime} to ${endTime}`);
            logger.info('Command archives by time range request received', { startTime, endTime, limit });

            const archives = await this.queryService.getCommandArchivesByTimeRange(startTime, endTime, limit);
            const result = ControllerResult.success('指令歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Command archives by time range retrieval completed successfully', {
                startTime,
                endTime,
                count: archives.length
            });
        } catch (error) {
            logger.error('Error in getCommandArchivesByTimeRange', {
                startTime: req.query.startTime,
                endTime: req.query.endTime,
                error
            });
            next(error);
        }
    }

    /**
     * 根據指令類型查詢歷史歸檔
     * @route GET /api/drone-commands-archive/data/command-type/:commandType
     */
    async getCommandArchivesByType(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const commandType = req.params.commandType;
            const limit = parseInt(req.query.limit as string) || 50;

            if (!commandType || typeof commandType !== 'string' || commandType.trim().length === 0) {
                const result = ControllerResult.badRequest('指令類型參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting command archives by type: ${commandType}`);
            logger.info('Command archives by type request received', { commandType, limit });

            const archives = await this.queryService.getCommandArchivesByType(commandType as any, limit);
            const result = ControllerResult.success('指令歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Command archives by type retrieval completed successfully', {
                commandType,
                count: archives.length
            });
        } catch (error) {
            logger.error('Error in getCommandArchivesByType', {
                commandType: req.params.commandType,
                error
            });
            next(error);
        }
    }

    /**
     * 根據指令狀態查詢歷史歸檔
     * @route GET /api/drone-commands-archive/data/status/:status
     */
    async getCommandArchivesByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const status = req.params.status;
            const limit = parseInt(req.query.limit as string) || 50;

            if (!status || typeof status !== 'string' || status.trim().length === 0) {
                const result = ControllerResult.badRequest('狀態參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting command archives by status: ${status}`);
            logger.info('Command archives by status request received', { status, limit });

            const archives = await this.queryService.getCommandArchivesByStatus(status as any, limit);
            const result = ControllerResult.success('指令歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Command archives by status retrieval completed successfully', {
                status,
                count: archives.length
            });
        } catch (error) {
            logger.error('Error in getCommandArchivesByStatus', {
                status: req.params.status,
                error
            });
            next(error);
        }
    }
}