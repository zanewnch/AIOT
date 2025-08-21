/**
 * @fileoverview 無人機位置歷史歸檔查詢控制器
 *
 * 此文件實作了無人機位置歷史歸檔查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 *
 * @module DronePositionsArchiveQueriesCtrl
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {NextFunction, Request, Response} from 'express';
import {DronePositionsArchiveQueriesSvc} from '../../services/queries/DronePositionsArchiveQueriesSvc.js';
import {createLogger} from '../../configs/loggerConfig.js';
import {ResResult} from '@aiot/shared-packages';
import {TYPES} from '../../container/types.js';

const logger = createLogger('DronePositionsArchiveQueriesCtrl');

/**
 * 無人機位置歷史歸檔查詢控制器類別
 *
 * 專門處理無人機位置歷史歸檔相關的查詢請求，包含取得歷史資料、統計分析等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 *
 * @class DronePositionsArchiveQueriesCtrl
 * @since 1.0.0
 */
@injectable()
export class DronePositionsArchiveQueriesCtrl {
    constructor(
        @inject(TYPES.DronePositionsArchiveQueriesSvc) private readonly archiveService: DronePositionsArchiveQueriesSvc
    ) {
    }

    /**
     * 取得所有位置歷史歸檔
     * @route GET /api/drone-positions-archive/data
     */
    getAllPositionArchives = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 100;
            const archives = await this.archiveService.getAllPositionArchives(limit);
            const result = ResResult.success('位置歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據 ID 取得位置歷史歸檔
     * @route GET /api/drone-positions-archive/data/:id
     */
    getPositionArchiveById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的位置歷史歸檔 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const archive = await this.archiveService.getPositionArchiveById(id);

            if (!archive) {
                const result = ResResult.notFound('找不到指定的位置歷史歸檔');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('位置歷史歸檔資料獲取成功', archive);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據原始 ID 取得歸檔
     * @route GET /api/drone-positions-archive/data/original/:originalId
     */
    getPositionArchiveByOriginalId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const originalId = parseInt(req.params.originalId);

            if (isNaN(originalId)) {
                const result = ResResult.badRequest('無效的原始 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const archive = await this.archiveService.getPositionArchiveByOriginalId(originalId);

            if (!archive) {
                const result = ResResult.notFound('找不到指定的位置歷史歸檔');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('位置歷史歸檔資料獲取成功', archive);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據無人機 ID 查詢位置歷史歸檔
     * @route GET /api/drone-positions-archive/data/drone/:droneId
     */
    getPositionArchivesByDroneId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);
            const limit = parseInt(req.query.limit as string) || 50;

            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const archives = await this.archiveService.getPositionArchivesByDroneId(droneId, limit);
            const result = ResResult.success('位置歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據時間範圍查詢位置歷史歸檔
     * @route GET /api/drone-positions-archive/data/time-range
     */
    getPositionArchivesByTimeRange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);
            const limit = parseInt(req.query.limit as string) || 100;

            // 驗證日期參數
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ResResult.badRequest('無效的時間格式');
                res.status(result.status).json(result);
                return;
            }

            const archives = await this.archiveService.getPositionArchivesByTimeRange(startTime, endTime, limit);
            const result = ResResult.success('位置歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據歸檔批次 ID 查詢資料
     * @route GET /api/drone-positions-archive/data/batch/:batchId
     */
    getPositionArchivesByBatchId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const batchId = req.params.batchId;
            const limit = parseInt(req.query.limit as string) || 50;

            if (!batchId || typeof batchId !== 'string' || batchId.trim().length === 0) {
                const result = ResResult.badRequest('批次 ID 參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            const archives = await this.archiveService.getPositionArchivesByBatchId(batchId);
            const result = ResResult.success('位置歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據地理邊界查詢位置歷史歸檔
     * @route GET /api/drone-positions-archive/data/geo-bounds
     */
    getPositionArchivesByGeoBounds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const {minLat, maxLat, minLon, maxLon, limit = 100} = req.query;

            // 驗證地理座標參數
            const coords = {
                minLat: parseFloat(minLat as string),
                maxLat: parseFloat(maxLat as string),
                minLon: parseFloat(minLon as string),
                maxLon: parseFloat(maxLon as string)
            };

            if (Object.values(coords).some(isNaN)) {
                const result = ResResult.badRequest('無效的地理座標格式');
                res.status(result.status).json(result);
                return;
            }

            const archives = await this.archiveService.getPositionArchivesByGeoBounds(
                coords.minLat, coords.maxLat, coords.minLon, coords.maxLon, parseInt(limit as string)
            );
            const result = ResResult.success('位置歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據無人機和時間範圍查詢軌跡
     * @route GET /api/drone-positions-archive/trajectory/:droneId
     */
    getTrajectoryByDroneAndTime = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            if (isNaN(droneId) || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ResResult.badRequest('無效的參數格式');
                res.status(result.status).json(result);
                return;
            }

            const trajectory = await this.archiveService.getTrajectoryByDroneAndTime(droneId, startTime, endTime);
            const result = ResResult.success('軌跡資料獲取成功', trajectory);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得最新的歷史歸檔記錄
     * @route GET /api/drone-positions-archive/data/latest
     */
    getLatestPositionArchives = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 20;
            const archives = await this.archiveService.getLatestPositionArchives(limit);
            const result = ResResult.success('最新位置歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得特定無人機的最新歷史歸檔記錄
     * @route GET /api/drone-positions-archive/data/drone/:droneId/latest
     */
    getLatestPositionArchiveByDroneId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);

            if (isNaN(droneId)) {
                const result = ResResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const archive = await this.archiveService.getLatestPositionArchiveByDroneId(droneId);
            const result = ResResult.success('最新位置歷史歸檔資料獲取成功', archive);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 統計總記錄數
     * @route GET /api/drone-positions-archive/statistics/count
     */
    getTotalArchiveCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const count = await this.archiveService.getTotalArchiveCount();
            const result = ResResult.success('歸檔總數獲取成功', {count});
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 計算軌跡統計資料
     * @route GET /api/drone-positions-archive/statistics/trajectory/:droneId
     */
    calculateTrajectoryStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            if (isNaN(droneId) || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ResResult.badRequest('無效的參數格式');
                res.status(result.status).json(result);
                return;
            }

            const stats = await this.archiveService.calculateTrajectoryStatistics(droneId, startTime, endTime);
            const result = ResResult.success('軌跡統計資料獲取成功', stats);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 計算電池使用統計資料
     * @route GET /api/drone-positions-archive/statistics/battery/:droneId
     */
    calculateBatteryUsageStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            if (isNaN(droneId) || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ResResult.badRequest('無效的參數格式');
                res.status(result.status).json(result);
                return;
            }

            const stats = await this.archiveService.calculateBatteryUsageStatistics(droneId, startTime, endTime);
            const result = ResResult.success('電池使用統計資料獲取成功', stats);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 計算位置分佈統計資料
     * @route GET /api/drone-positions-archive/statistics/position/:droneId
     */
    calculatePositionDistributionStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            if (isNaN(droneId) || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ResResult.badRequest('無效的參數格式');
                res.status(result.status).json(result);
                return;
            }

            const stats = await this.archiveService.calculatePositionDistributionStatistics(droneId, startTime, endTime);
            const result = ResResult.success('位置分佈統計資料獲取成功', stats);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得歸檔批次統計資料
     * @route GET /api/drone-positions-archive/statistics/batch/:batchId
     */
    getArchiveBatchStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const batchId = req.params.batchId;

            if (!batchId || typeof batchId !== 'string' || batchId.trim().length === 0) {
                const result = ResResult.badRequest('批次 ID 參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            const stats = await this.archiveService.getArchiveBatchStatistics(batchId);
            const result = ResResult.success('歸檔批次統計資料獲取成功', stats);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 分析飛行模式
     * @route GET /api/drone-positions-archive/analysis/patterns/:droneId
     */
    analyzeFlightPatterns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            if (isNaN(droneId) || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ResResult.badRequest('無效的參數格式');
                res.status(result.status).json(result);
                return;
            }

            const patterns = await this.archiveService.analyzeFlightPatterns(droneId, startTime, endTime);
            const result = ResResult.success('飛行模式分析完成', patterns);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 檢測異常位置資料
     * @route GET /api/drone-positions-archive/analysis/anomalies/:droneId
     */
    detectAnomalousPositions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            if (isNaN(droneId) || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ResResult.badRequest('無效的參數格式');
                res.status(result.status).json(result);
                return;
            }

            const anomalies = await this.archiveService.detectAnomalousPositions(droneId, startTime, endTime);
            const result = ResResult.success('異常位置檢測完成', anomalies);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 產生軌跡摘要報告
     * @route GET /api/drone-positions-archive/reports/summary/:droneId
     */
    generateTrajectorySummaryReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            if (isNaN(droneId) || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ResResult.badRequest('無效的參數格式');
                res.status(result.status).json(result);
                return;
            }

            const report = await this.archiveService.generateTrajectorySummaryReport(droneId, startTime, endTime);
            const result = ResResult.success('軌跡摘要報告生成完成', report);

            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }
}