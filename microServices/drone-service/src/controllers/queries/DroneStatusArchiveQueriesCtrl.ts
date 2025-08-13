/**
 * @fileoverview 無人機狀態歷史歸檔查詢控制器
 * 
 * 此文件實作了無人機狀態歷史歸檔查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 * 
 * @module DroneStatusArchiveQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { DroneStatusArchiveQueriesSvc } from '../../services/queries/DroneStatusArchiveQueriesSvc.js';
import { createLogger, logRequest } from '@aiot/shared-packages/loggerConfig.js';
import { ControllerResult } from '@aiot/shared-packages/ControllerResult.js';
import { TYPES } from '../../container/types.js';
import { loggerDecorator } from "../../patterns/LoggerDecorator.js";

const logger = createLogger('DroneStatusArchiveQueries');

/**
 * 無人機狀態歷史歸檔查詢控制器類別
 * 
 * 專門處理無人機狀態歷史歸檔相關的查詢請求，包含取得狀態歷史資料、統計等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 * 
 * @class DroneStatusArchiveQueries
 * @since 1.0.0
 */
@injectable()
export class DroneStatusArchiveQueries {
    constructor(
        @inject(TYPES.DroneStatusArchiveQueriesSvc) private readonly queryService: DroneStatusArchiveQueriesSvc
    ) {}

    /**
     * 取得所有狀態歷史歸檔
     * @route GET /api/drone-status-archive/data
     */
    getAllStatusArchives = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 100;
            const archives = await this.queryService.getAllStatusArchives(limit);
            const result = ControllerResult.success('狀態歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據 ID 取得狀態歷史歸檔
     * @route GET /api/drone-status-archive/data/:id
     */
    getStatusArchiveById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的狀態歷史歸檔 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const archive = await this.queryService.getStatusArchiveById(id);
            
            if (!archive) {
                const result = ControllerResult.notFound('找不到指定的狀態歷史歸檔');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('狀態歷史歸檔資料獲取成功', archive);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據無人機 ID 獲取狀態歷史
     * @route GET /api/drone-status-archive/data/drone/:droneId
     */
    getStatusArchivesByDroneId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);
            const limit = parseInt(req.query.limit as string) || 50;

            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const archives = await this.queryService.getStatusArchivesByDroneId(droneId, limit);
            const result = ControllerResult.success('狀態歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據狀態獲取歷史記錄
     * @route GET /api/drone-status-archive/data/status/:status
     */
    getStatusArchivesByStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const status = req.params.status;
            const limit = parseInt(req.query.limit as string) || 50;

            if (!status || typeof status !== 'string' || status.trim().length === 0) {
                const result = ControllerResult.badRequest('狀態參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            const archives = await this.queryService.getStatusArchivesByStatus(status as any, limit);
            const result = ControllerResult.success('狀態歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據創建者獲取歷史記錄
     * @route GET /api/drone-status-archive/data/created-by/:userId
     */
    getStatusArchivesByCreatedBy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const createdBy = parseInt(req.params.userId);
            const limit = parseInt(req.query.limit as string) || 50;

            if (isNaN(createdBy)) {
                const result = ControllerResult.badRequest('無效的用戶 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const archives = await this.queryService.getStatusArchivesByCreatedBy(createdBy, limit);
            const result = ControllerResult.success('狀態歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據時間範圍獲取歷史記錄
     * @route GET /api/drone-status-archive/data/date-range
     */
    getStatusArchivesByDateRange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

            const archives = await this.queryService.getStatusArchivesByDateRange(startDate, endDate, limit);
            const result = ControllerResult.success('狀態歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據變更原因獲取歷史記錄
     * @route GET /api/drone-status-archive/data/reason/:reason
     */
    getStatusArchivesByReason = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const reason = req.params.reason;
            const limit = parseInt(req.query.limit as string) || 50;

            if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
                const result = ControllerResult.badRequest('變更原因參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            const archives = await this.queryService.getStatusArchivesByReason(reason, limit);
            const result = ControllerResult.success('狀態歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 獲取最新狀態歷史記錄
     * @route GET /api/drone-status-archive/data/latest
     */
    getLatestStatusArchives = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 20;
            const archives = await this.queryService.getLatestStatusArchives(limit);
            const result = ControllerResult.success('最新狀態歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 獲取特定無人機的最新狀態歷史
     * @route GET /api/drone-status-archive/data/drone/:droneId/latest
     */
    getLatestStatusArchiveByDroneId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);

            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const archive = await this.queryService.getLatestStatusArchiveByDroneId(droneId);
            const result = ControllerResult.success('最新狀態歷史歸檔資料獲取成功', archive);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 獲取狀態轉換歷史記錄
     * @route GET /api/drone-status-archive/data/transition
     */
    getStatusArchivesByTransition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const fromStatus = req.query.fromStatus as string;
            const toStatus = req.query.toStatus as string;
            const limit = parseInt(req.query.limit as string) || 50;

            if (!fromStatus || !toStatus) {
                const result = ControllerResult.badRequest('fromStatus 和 toStatus 參數為必填項');
                res.status(result.status).json(result);
                return;
            }

            const archives = await this.queryService.getStatusArchivesByTransition(fromStatus as any, toStatus as any, limit);
            const result = ControllerResult.success('狀態轉換歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 獲取狀態變更統計資料
     * @route GET /api/drone-status-archive/statistics
     */
    getStatusChangeStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = req.query.droneId ? parseInt(req.query.droneId as string) : undefined;
            const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

            // 驗證日期參數
            if (startDate && isNaN(startDate.getTime())) {
                const result = ControllerResult.badRequest('無效的開始日期格式');
                res.status(result.status).json(result);
                return;
            }

            if (endDate && isNaN(endDate.getTime())) {
                const result = ControllerResult.badRequest('無效的結束日期格式');
                res.status(result.status).json(result);
                return;
            }

            const statistics = await this.queryService.getStatusChangeStatistics(startDate, endDate);
            const result = ControllerResult.success('狀態變更統計資料獲取成功', statistics);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }
}