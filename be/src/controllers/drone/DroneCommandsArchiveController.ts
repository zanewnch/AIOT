/**
 * @fileoverview 無人機指令歷史歸檔控制器
 * 負責處理無人機指令歷史歸檔的 HTTP 端點
 * 提供指令歷史查詢、統計分析和執行記錄的 API 功能
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @description API 端點說明：
 * - GET /api/drone-commands-archive/data - 取得所有指令歷史歸檔資料
 * - GET /api/drone-commands-archive/data/:id - 取得指定指令歷史資料
 * - POST /api/drone-commands-archive/data - 創建新的指令歷史記錄
 * - PUT /api/drone-commands-archive/data/:id - 更新指定指令歷史資料
 * - DELETE /api/drone-commands-archive/data/:id - 刪除指定指令歷史資料
 * - GET /api/drone-commands-archive/data/drone/:droneId - 根據無人機 ID 查詢歷史
 * - GET /api/drone-commands-archive/data/time-range - 根據時間範圍查詢歷史
 * - GET /api/drone-commands-archive/data/command-type/:commandType - 根據指令類型查詢
 * - GET /api/drone-commands-archive/data/status/:status - 根據指令狀態查詢
 */

import { Request, Response, NextFunction } from 'express';
import { DroneCommandsArchiveService } from '../../services/drone/DroneCommandsArchiveService.js';
import type { IDroneCommandsArchiveService } from '../../types/services/IDroneCommandsArchiveService.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import type { DroneCommandsArchiveCreationAttributes } from '../../models/drone/DroneCommandsArchiveModel.js';

// 創建控制器專用的日誌記錄器
const logger = createLogger('DroneCommandsArchiveController');

/**
 * 無人機指令歷史歸檔控制器類別
 *
 * 處理所有與無人機指令歷史歸檔相關的 HTTP 請求
 * 使用 Service 層進行業務邏輯處理
 *
 * @class DroneCommandsArchiveController
 */
export class DroneCommandsArchiveController {
    private archiveService: IDroneCommandsArchiveService;

    /**
     * 建構子
     */
    constructor() {
        this.archiveService = new DroneCommandsArchiveService();
    }

    /**
     * 取得所有指令歷史歸檔資料
     *
     * @route GET /api/drone-commands-archive/data
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getAllCommandsArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 100;

            logRequest(req, `Getting all commands archive with limit: ${limit}`);
            logger.info('Commands archive retrieval request received', { limit });

            const archives = await this.archiveService.getAllCommandsArchive(limit);
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
     *
     * @route GET /api/drone-commands-archive/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getCommandArchiveById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            logRequest(req, `Getting command archive by ID: ${id}`);
            logger.info('Command archive by ID request received', { id });

            const archive = await this.archiveService.getCommandArchiveById(id);
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
     * 創建新的指令歷史歸檔記錄
     *
     * @route POST /api/drone-commands-archive/data
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async createCommandArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const archiveData: DroneCommandsArchiveCreationAttributes = req.body;

            logRequest(req, 'Creating new command archive');
            logger.info('Command archive creation request received', { archiveData });

            const createdData = await this.archiveService.createCommandArchive(archiveData);
            const result = ControllerResult.created('指令歷史歸檔記錄創建成功', createdData);

            res.status(result.status).json(result);
            logger.info('Command archive creation completed successfully', {
                id: createdData.id
            });
        } catch (error) {
            logger.error('Error in createCommandArchive', {
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 更新指令歷史歸檔資料
     *
     * @route PUT /api/drone-commands-archive/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async updateCommandArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const updateData: Partial<DroneCommandsArchiveCreationAttributes> = req.body;

            logRequest(req, `Updating command archive with ID: ${id}`);
            logger.info('Command archive update request received', { id, updateData });

            const updatedData = await this.archiveService.updateCommandArchive(id, updateData);
            const result = ControllerResult.success('指令歷史歸檔資料更新成功', updatedData);

            res.status(result.status).json(result);
            logger.info('Command archive update completed successfully', { id });
        } catch (error) {
            logger.error('Error in updateCommandArchive', {
                id: req.params.id,
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 刪除指令歷史歸檔資料
     *
     * @route DELETE /api/drone-commands-archive/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async deleteCommandArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            logRequest(req, `Deleting command archive with ID: ${id}`);
            logger.info('Command archive deletion request received', { id });

            const success = await this.archiveService.deleteCommandArchive(id);
            const result = ControllerResult.success('指令歷史歸檔資料刪除成功', { deleted: success });

            res.status(result.status).json(result);
            logger.info('Command archive deletion completed successfully', { id, success });
        } catch (error) {
            logger.error('Error in deleteCommandArchive', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 根據無人機 ID 查詢指令歷史歸檔
     *
     * @route GET /api/drone-commands-archive/data/drone/:droneId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getCommandArchivesByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const limit = parseInt(req.query.limit as string) || 100;

            logRequest(req, `Getting command archives for drone: ${droneId}`);
            logger.info('Command archives by drone ID request received', { droneId, limit });

            const archives = await this.archiveService.getCommandArchivesByDroneId(droneId, limit);
            const result = ControllerResult.success('指令歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Command archives by drone ID retrieval completed successfully', {
                droneId,
                count: archives.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getCommandArchivesByDroneId', {
                droneId: req.params.droneId,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 根據時間範圍查詢指令歷史歸檔
     *
     * @route GET /api/drone-commands-archive/data/time-range
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getCommandArchivesByTimeRange(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);
            const limit = parseInt(req.query.limit as string) || 100;

            logRequest(req, `Getting command archives by time range: ${startTime} to ${endTime}`);
            logger.info('Command archives by time range request received', { startTime, endTime, limit });

            const archives = await this.archiveService.getCommandArchivesByTimeRange(startTime, endTime, limit);
            const result = ControllerResult.success('指令歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Command archives by time range retrieval completed successfully', {
                startTime,
                endTime,
                count: archives.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getCommandArchivesByTimeRange', {
                startTime: req.query.startTime,
                endTime: req.query.endTime,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 根據指令類型查詢指令歷史歸檔
     *
     * @route GET /api/drone-commands-archive/data/command-type/:commandType
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getCommandArchivesByType(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const commandType = req.params.commandType;
            const limit = parseInt(req.query.limit as string) || 100;

            logRequest(req, `Getting command archives by command type: ${commandType}`);
            logger.info('Command archives by type request received', { commandType, limit });

            const archives = await this.archiveService.getCommandArchivesByType(commandType, limit);
            const result = ControllerResult.success('指令歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Command archives by type retrieval completed successfully', {
                commandType,
                count: archives.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getCommandArchivesByType', {
                commandType: req.params.commandType,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 根據指令狀態查詢指令歷史歸檔
     *
     * @route GET /api/drone-commands-archive/data/status/:status
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getCommandArchivesByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const status = req.params.status;
            const limit = parseInt(req.query.limit as string) || 100;

            logRequest(req, `Getting command archives by status: ${status}`);
            logger.info('Command archives by status request received', { status, limit });

            const archives = await this.archiveService.getCommandArchivesByStatus(status, limit);
            const result = ControllerResult.success('指令歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Command archives by status retrieval completed successfully', {
                status,
                count: archives.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getCommandArchivesByStatus', {
                status: req.params.status,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }
}

// 創建控制器實例並匯出方法
const archiveController = new DroneCommandsArchiveController();

export const getAllCommandsArchive = archiveController.getAllCommandsArchive.bind(archiveController);
export const getCommandArchiveById = archiveController.getCommandArchiveById.bind(archiveController);
export const createCommandArchive = archiveController.createCommandArchive.bind(archiveController);
export const updateCommandArchive = archiveController.updateCommandArchive.bind(archiveController);
export const deleteCommandArchive = archiveController.deleteCommandArchive.bind(archiveController);
export const getCommandArchivesByDroneId = archiveController.getCommandArchivesByDroneId.bind(archiveController);
export const getCommandArchivesByTimeRange = archiveController.getCommandArchivesByTimeRange.bind(archiveController);
export const getCommandArchivesByType = archiveController.getCommandArchivesByType.bind(archiveController);
export const getCommandArchivesByStatus = archiveController.getCommandArchivesByStatus.bind(archiveController);