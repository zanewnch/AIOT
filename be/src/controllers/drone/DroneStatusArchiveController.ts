/**
 * @fileoverview 無人機狀態歷史控制器
 * 負責處理無人機狀態變更歷史的 HTTP 端點
 * 提供狀態變更記錄、查詢和統計分析的 API 功能
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @description API 端點說明：
 * - GET /api/drone-status-archive/data - 取得所有狀態歷史資料
 * - GET /api/drone-status-archive/data/:id - 取得指定狀態歷史資料
 * - POST /api/drone-status-archive/data - 創建新的狀態歷史記錄
 * - PUT /api/drone-status-archive/data/:id - 更新指定狀態歷史資料
 * - DELETE /api/drone-status-archive/data/:id - 刪除指定狀態歷史資料
 * - GET /api/drone-status-archive/data/drone/:droneId - 根據無人機 ID 查詢歷史
 * - GET /api/drone-status-archive/data/status/:status - 根據狀態查詢歷史
 * - GET /api/drone-status-archive/data/creator/:createdBy - 根據操作者查詢歷史
 * - GET /api/drone-status-archive/data/date-range - 根據時間範圍查詢歷史
 * - GET /api/drone-status-archive/data/reason/:reason - 根據變更原因查詢歷史
 * - GET /api/drone-status-archive/data/latest - 取得最新狀態變更記錄
 * - GET /api/drone-status-archive/data/drone/:droneId/latest - 取得特定無人機最新狀態變更
 * - GET /api/drone-status-archive/data/transition - 根據狀態轉換查詢歷史
 * - POST /api/drone-status-archive/record-change - 記錄狀態變更
 * - GET /api/drone-status-archive/statistics - 取得狀態變更統計
 * - GET /api/drone-status-archive/trend/:droneId - 取得狀態變更趨勢
 * - GET /api/drone-status-archive/activity-summary/:droneId - 取得無人機活動摘要
 */

import { Request, Response, NextFunction } from 'express';
import { DroneStatusArchiveService } from '../../services/drone/DroneStatusArchiveService.js';
import type { IDroneStatusArchiveService } from '../../types/services/IDroneStatusArchiveService.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import type { DroneStatusArchiveCreationAttributes, DroneStatus } from '../../models/drone/DroneStatusArchiveModel.js';

// 創建控制器專用的日誌記錄器
const logger = createLogger('DroneStatusArchiveController');

/**
 * 無人機狀態歷史控制器類別
 *
 * 處理所有與無人機狀態變更歷史相關的 HTTP 請求
 * 使用 Service 層進行業務邏輯處理
 *
 * @class DroneStatusArchiveController
 */
export class DroneStatusArchiveController {
    private archiveService: IDroneStatusArchiveService;

    /**
     * 建構子
     *
     * @param {IDroneStatusArchiveService} archiveService - 狀態歷史服務實例
     */
    constructor() {
        this.archiveService = new DroneStatusArchiveService();
    }

    /**
     * 取得所有狀態歷史資料
     *
     * @route GET /api/drone-status-archive/data
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getAllStatusArchives(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 100;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting all status archives with limit: ${limit}`);
            logger.info('Status archives retrieval request received', { limit });

            // 呼叫服務層取得資料
            const archives = await this.archiveService.getAllStatusArchives(limit);

            // 建立成功回應
            const result = ControllerResult.success('狀態歷史資料獲取成功', archives);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Status archives retrieval completed successfully', {
                count: archives.length,
                limit
            });

        } catch (error) {
            logger.error('Error in getAllStatusArchives', { error, limit: req.query.limit });
            next(error);
        }
    }

    /**
     * 根據 ID 取得狀態歷史資料
     *
     * @route GET /api/drone-status-archive/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getStatusArchiveById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting status archive by ID: ${id}`);
            logger.info('Status archive by ID request received', { id });

            // 呼叫服務層取得資料
            const archive = await this.archiveService.getStatusArchiveById(id);

            // 建立成功回應
            const result = ControllerResult.success('狀態歷史資料獲取成功', archive);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Status archive by ID retrieval completed successfully', { id });

        } catch (error) {
            logger.error('Error in getStatusArchiveById', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 創建新的狀態歷史記錄
     *
     * @route POST /api/drone-status-archive/data
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async createStatusArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const archiveData: DroneStatusArchiveCreationAttributes = req.body;

            // 記錄請求
            logRequest(req.originalUrl, req.method, 'Creating new status archive');
            logger.info('Status archive creation request received', { archiveData });

            // 呼叫服務層創建資料
            const createdData = await this.archiveService.createStatusArchive(archiveData);

            // 建立創建成功回應
            const result = ControllerResult.created('狀態歷史記錄創建成功', createdData);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Status archive creation completed successfully', {
                id: createdData.id
            });

        } catch (error) {
            logger.error('Error in createStatusArchive', {
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 更新狀態歷史資料
     *
     * @route PUT /api/drone-status-archive/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async updateStatusArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const updateData: Partial<DroneStatusArchiveCreationAttributes> = req.body;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Updating status archive with ID: ${id}`);
            logger.info('Status archive update request received', { id, updateData });

            // 呼叫服務層更新資料
            const updatedData = await this.archiveService.updateStatusArchive(id, updateData);

            // 建立成功回應
            const result = ControllerResult.success('狀態歷史資料更新成功', updatedData);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Status archive update completed successfully', { id });

        } catch (error) {
            logger.error('Error in updateStatusArchive', {
                id: req.params.id,
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 刪除狀態歷史資料
     *
     * @route DELETE /api/drone-status-archive/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async deleteStatusArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Deleting status archive with ID: ${id}`);
            logger.info('Status archive deletion request received', { id });

            // 呼叫服務層刪除資料
            await this.archiveService.deleteStatusArchive(id);

            // 建立成功回應
            const result = ControllerResult.success('狀態歷史資料刪除成功');

            // 回傳結果
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

    /**
     * 根據無人機 ID 查詢狀態歷史
     *
     * @route GET /api/drone-status-archive/data/drone/:droneId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getStatusArchivesByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const limit = parseInt(req.query.limit as string) || 50;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting status archives for drone: ${droneId}`);
            logger.info('Status archives by drone ID request received', { droneId, limit });

            // 呼叫服務層取得資料
            const archives = await this.archiveService.getStatusArchivesByDroneId(droneId, limit);

            // 建立成功回應
            const result = ControllerResult.success('狀態歷史資料獲取成功', archives);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Status archives by drone ID retrieval completed successfully', {
                droneId,
                count: archives.length,
                limit
            });

        } catch (error) {
            logger.error('Error in getStatusArchivesByDroneId', {
                droneId: req.params.droneId,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 根據狀態查詢歷史記錄
     *
     * @route GET /api/drone-status-archive/data/status/:status
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getStatusArchivesByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const status = req.params.status as DroneStatus;
            const limit = parseInt(req.query.limit as string) || 50;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting status archives by status: ${status}`);
            logger.info('Status archives by status request received', { status, limit });

            // 呼叫服務層取得資料
            const archives = await this.archiveService.getStatusArchivesByStatus(status, limit);

            // 建立成功回應
            const result = ControllerResult.success('狀態歷史資料獲取成功', archives);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Status archives by status retrieval completed successfully', {
                status,
                count: archives.length,
                limit
            });

        } catch (error) {
            logger.error('Error in getStatusArchivesByStatus', {
                status: req.params.status,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 根據操作者查詢歷史記錄
     *
     * @route GET /api/drone-status-archive/data/creator/:createdBy
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getStatusArchivesByCreatedBy(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const createdBy = parseInt(req.params.createdBy);
            const limit = parseInt(req.query.limit as string) || 50;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting status archives by creator: ${createdBy}`);
            logger.info('Status archives by creator request received', { createdBy, limit });

            // 呼叫服務層取得資料
            const archives = await this.archiveService.getStatusArchivesByCreatedBy(createdBy, limit);

            // 建立成功回應
            const result = ControllerResult.success('狀態歷史資料獲取成功', archives);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Status archives by creator retrieval completed successfully', {
                createdBy,
                count: archives.length,
                limit
            });

        } catch (error) {
            logger.error('Error in getStatusArchivesByCreatedBy', {
                createdBy: req.params.createdBy,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 根據時間範圍查詢歷史記錄
     *
     * @route GET /api/drone-status-archive/data/date-range
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getStatusArchivesByDateRange(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const startDate = new Date(req.query.startDate as string);
            const endDate = new Date(req.query.endDate as string);
            const limit = parseInt(req.query.limit as string) || 100;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting status archives by date range: ${startDate} to ${endDate}`);
            logger.info('Status archives by date range request received', { startDate, endDate, limit });

            // 呼叫服務層取得資料
            const archives = await this.archiveService.getStatusArchivesByDateRange(startDate, endDate, limit);

            // 建立成功回應
            const result = ControllerResult.success('狀態歷史資料獲取成功', archives);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Status archives by date range retrieval completed successfully', {
                startDate,
                endDate,
                count: archives.length,
                limit
            });

        } catch (error) {
            logger.error('Error in getStatusArchivesByDateRange', {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 根據變更原因查詢歷史記錄
     *
     * @route GET /api/drone-status-archive/data/reason/:reason
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getStatusArchivesByReason(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const reason = decodeURIComponent(req.params.reason);
            const limit = parseInt(req.query.limit as string) || 50;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting status archives by reason: ${reason}`);
            logger.info('Status archives by reason request received', { reason, limit });

            // 呼叫服務層取得資料
            const archives = await this.archiveService.getStatusArchivesByReason(reason, limit);

            // 建立成功回應
            const result = ControllerResult.success('狀態歷史資料獲取成功', archives);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Status archives by reason retrieval completed successfully', {
                reason,
                count: archives.length,
                limit
            });

        } catch (error) {
            logger.error('Error in getStatusArchivesByReason', {
                reason: req.params.reason,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 取得最新的狀態變更記錄
     *
     * @route GET /api/drone-status-archive/data/latest
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getLatestStatusArchives(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 20;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting latest status archives with limit: ${limit}`);
            logger.info('Latest status archives request received', { limit });

            // 呼叫服務層取得資料
            const archives = await this.archiveService.getLatestStatusArchives(limit);

            // 建立成功回應
            const result = ControllerResult.success('最新狀態歷史資料獲取成功', archives);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Latest status archives retrieval completed successfully', {
                count: archives.length,
                limit
            });

        } catch (error) {
            logger.error('Error in getLatestStatusArchives', {
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 取得特定無人機的最新狀態變更
     *
     * @route GET /api/drone-status-archive/data/drone/:droneId/latest
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getLatestStatusArchiveByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting latest status archive for drone: ${droneId}`);
            logger.info('Latest status archive by drone ID request received', { droneId });

            // 呼叫服務層取得資料
            const archive = await this.archiveService.getLatestStatusArchiveByDroneId(droneId);

            // 建立成功回應
            const result = ControllerResult.success('最新狀態歷史資料獲取成功', archive);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Latest status archive by drone ID retrieval completed successfully', { droneId });

        } catch (error) {
            logger.error('Error in getLatestStatusArchiveByDroneId', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 根據狀態轉換查詢歷史記錄
     *
     * @route GET /api/drone-status-archive/data/transition
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getStatusArchivesByTransition(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const fromStatus = (req.query.from as string) === 'null' ? null : (req.query.from as DroneStatus);
            const toStatus = req.query.to as DroneStatus;
            const limit = parseInt(req.query.limit as string) || 50;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting status archives by transition: ${fromStatus} -> ${toStatus}`);
            logger.info('Status archives by transition request received', { fromStatus, toStatus, limit });

            // 呼叫服務層取得資料
            const archives = await this.archiveService.getStatusArchivesByTransition(fromStatus, toStatus, limit);

            // 建立成功回應
            const result = ControllerResult.success('狀態轉換歷史資料獲取成功', archives);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Status archives by transition retrieval completed successfully', {
                fromStatus,
                toStatus,
                count: archives.length,
                limit
            });

        } catch (error) {
            logger.error('Error in getStatusArchivesByTransition', {
                from: req.query.from,
                to: req.query.to,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 記錄狀態變更
     *
     * @route POST /api/drone-status-archive/record-change
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async recordStatusChange(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { droneId, newStatus, previousStatus, reason, details, createdBy } = req.body;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Recording status change for drone: ${droneId}`);
            logger.info('Status change recording request received', {
                droneId,
                newStatus,
                previousStatus,
                reason
            });

            // 呼叫服務層記錄狀態變更
            const archive = await this.archiveService.recordStatusChange(
                droneId,
                newStatus,
                previousStatus,
                reason,
                details,
                createdBy
            );

            // 建立成功回應
            const result = ControllerResult.created('狀態變更記錄成功', archive);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Status change recording completed successfully', {
                droneId,
                archiveId: archive.id,
                transition: `${previousStatus} -> ${newStatus}`
            });

        } catch (error) {
            logger.error('Error in recordStatusChange', {
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 取得狀態變更統計
     *
     * @route GET /api/drone-status-archive/statistics
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getStatusChangeStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

            // 記錄請求
            logRequest(req.originalUrl, req.method, 'Getting status change statistics');
            logger.info('Status change statistics request received', { startDate, endDate });

            // 呼叫服務層取得統計資料
            const statistics = await this.archiveService.getStatusChangeStatistics(startDate, endDate);

            // 建立成功回應
            const result = ControllerResult.success('狀態變更統計獲取成功', statistics);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Status change statistics retrieval completed successfully', {
                startDate,
                endDate,
                statisticsCount: Object.keys(statistics).length
            });

        } catch (error) {
            logger.error('Error in getStatusChangeStatistics', {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                error
            });
            next(error);
        }
    }

    /**
     * 取得狀態變更趨勢
     *
     * @route GET /api/drone-status-archive/trend/:droneId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getStatusChangeTrend(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const days = parseInt(req.query.days as string) || 30;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting status change trend for drone: ${droneId}`);
            logger.info('Status change trend request received', { droneId, days });

            // 呼叫服務層取得趨勢資料
            const trend = await this.archiveService.getStatusChangeTrend(droneId, days);

            // 建立成功回應
            const result = ControllerResult.success('狀態變更趨勢獲取成功', trend);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Status change trend retrieval completed successfully', {
                droneId,
                days,
                dataPoints: trend.length
            });

        } catch (error) {
            logger.error('Error in getStatusChangeTrend', {
                droneId: req.params.droneId,
                days: req.query.days,
                error
            });
            next(error);
        }
    }

    /**
     * 取得無人機活動摘要
     *
     * @route GET /api/drone-status-archive/activity-summary/:droneId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getDroneActivitySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const days = parseInt(req.query.days as string) || 7;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting activity summary for drone: ${droneId}`);
            logger.info('Drone activity summary request received', { droneId, days });

            // 呼叫服務層取得活動摘要
            const summary = await this.archiveService.getDroneActivitySummary(droneId, days);

            // 建立成功回應
            const result = ControllerResult.success('無人機活動摘要獲取成功', summary);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drone activity summary retrieval completed successfully', {
                droneId,
                days,
                summary
            });

        } catch (error) {
            logger.error('Error in getDroneActivitySummary', {
                droneId: req.params.droneId,
                days: req.query.days,
                error
            });
            next(error);
        }
    }
}

// 創建控制器實例並匯出方法
const archiveController = new DroneStatusArchiveController();

export const getAllStatusArchives = archiveController.getAllStatusArchives.bind(archiveController);
export const getStatusArchiveById = archiveController.getStatusArchiveById.bind(archiveController);
export const createStatusArchive = archiveController.createStatusArchive.bind(archiveController);
export const updateStatusArchive = archiveController.updateStatusArchive.bind(archiveController);
export const deleteStatusArchive = archiveController.deleteStatusArchive.bind(archiveController);
export const getStatusArchivesByDroneId = archiveController.getStatusArchivesByDroneId.bind(archiveController);
export const getStatusArchivesByStatus = archiveController.getStatusArchivesByStatus.bind(archiveController);
export const getStatusArchivesByCreatedBy = archiveController.getStatusArchivesByCreatedBy.bind(archiveController);
export const getStatusArchivesByDateRange = archiveController.getStatusArchivesByDateRange.bind(archiveController);
export const getStatusArchivesByReason = archiveController.getStatusArchivesByReason.bind(archiveController);
export const getLatestStatusArchives = archiveController.getLatestStatusArchives.bind(archiveController);
export const getLatestStatusArchiveByDroneId = archiveController.getLatestStatusArchiveByDroneId.bind(archiveController);
export const getStatusArchivesByTransition = archiveController.getStatusArchivesByTransition.bind(archiveController);
export const recordStatusChange = archiveController.recordStatusChange.bind(archiveController);
export const getStatusChangeStatistics = archiveController.getStatusChangeStatistics.bind(archiveController);
export const getStatusChangeTrend = archiveController.getStatusChangeTrend.bind(archiveController);
export const getDroneActivitySummary = archiveController.getDroneActivitySummary.bind(archiveController);