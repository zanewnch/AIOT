/**
 * @fileoverview 無人機位置歷史歸檔查詢控制器
 * 
 * 此文件實作了無人機位置歷史歸檔查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 * 
 * @module DronePositionsArchiveQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { DronePositionsArchiveService } from '../../services/drone/DronePositionsArchiveService.js';
import type { IDronePositionsArchiveService } from '../../types/services/IDronePositionsArchiveService.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';

const logger = createLogger('DronePositionsArchiveQueries');

/**
 * 無人機位置歷史歸檔查詢控制器類別
 * 
 * 專門處理無人機位置歷史歸檔相關的查詢請求，包含取得歷史資料、統計分析等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 * 
 * @class DronePositionsArchiveQueries
 * @since 1.0.0
 */
export class DronePositionsArchiveQueries {
    private archiveService: IDronePositionsArchiveService;

    constructor() {
        this.archiveService = new DronePositionsArchiveService();
    }

    /**
     * 取得所有位置歷史歸檔
     * @route GET /api/drone-positions-archive/data
     */
    async getAllPositionArchives(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 100;

            logRequest(req, `Getting all position archives with limit: ${limit}`);
            logger.info('Position archives retrieval request received', { limit });

            const archives = await this.archiveService.getAllPositionArchives(limit);
            const result = ControllerResult.success('位置歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Position archives retrieval completed successfully', {
                count: archives.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getAllPositionArchives', { error, limit: req.query.limit });
            next(error);
        }
    }

    /**
     * 根據 ID 取得位置歷史歸檔
     * @route GET /api/drone-positions-archive/data/:id
     */
    async getPositionArchiveById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的位置歷史歸檔 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting position archive by ID: ${id}`);
            logger.info('Position archive by ID request received', { id });

            const archive = await this.archiveService.getPositionArchiveById(id);
            
            if (!archive) {
                const result = ControllerResult.notFound('找不到指定的位置歷史歸檔');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('位置歷史歸檔資料獲取成功', archive);
            res.status(result.status).json(result);
            
            logger.info('Position archive by ID retrieval completed successfully', { id });
        } catch (error) {
            logger.error('Error in getPositionArchiveById', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 根據原始 ID 取得歸檔
     * @route GET /api/drone-positions-archive/data/original/:originalId
     */
    async getPositionArchiveByOriginalId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const originalId = parseInt(req.params.originalId);

            if (isNaN(originalId)) {
                const result = ControllerResult.badRequest('無效的原始 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting position archive by original ID: ${originalId}`);
            logger.info('Position archive by original ID request received', { originalId });

            const archive = await this.archiveService.getPositionArchiveByOriginalId(originalId);
            
            if (!archive) {
                const result = ControllerResult.notFound('找不到指定的位置歷史歸檔');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('位置歷史歸檔資料獲取成功', archive);
            res.status(result.status).json(result);
            
            logger.info('Position archive by original ID retrieval completed successfully', { originalId });
        } catch (error) {
            logger.error('Error in getPositionArchiveByOriginalId', {
                originalId: req.params.originalId,
                error
            });
            next(error);
        }
    }

    /**
     * 根據無人機 ID 查詢位置歷史歸檔
     * @route GET /api/drone-positions-archive/data/drone/:droneId
     */
    async getPositionArchivesByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const limit = parseInt(req.query.limit as string) || 50;

            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting position archives by drone ID: ${droneId}`);
            logger.info('Position archives by drone ID request received', { droneId, limit });

            const archives = await this.archiveService.getPositionArchivesByDroneId(droneId, limit);
            const result = ControllerResult.success('位置歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Position archives by drone ID retrieval completed successfully', {
                droneId,
                count: archives.length
            });
        } catch (error) {
            logger.error('Error in getPositionArchivesByDroneId', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 根據時間範圍查詢位置歷史歸檔
     * @route GET /api/drone-positions-archive/data/time-range
     */
    async getPositionArchivesByTimeRange(req: Request, res: Response, next: NextFunction): Promise<void> {
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

            logRequest(req, `Getting position archives by time range: ${startTime} to ${endTime}`);
            logger.info('Position archives by time range request received', { startTime, endTime, limit });

            const archives = await this.archiveService.getPositionArchivesByTimeRange(startTime, endTime, limit);
            const result = ControllerResult.success('位置歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Position archives by time range retrieval completed successfully', {
                startTime,
                endTime,
                count: archives.length
            });
        } catch (error) {
            logger.error('Error in getPositionArchivesByTimeRange', {
                startTime: req.query.startTime,
                endTime: req.query.endTime,
                error
            });
            next(error);
        }
    }

    /**
     * 根據歸檔批次 ID 查詢資料
     * @route GET /api/drone-positions-archive/data/batch/:batchId
     */
    async getPositionArchivesByBatchId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const batchId = req.params.batchId;
            const limit = parseInt(req.query.limit as string) || 50;

            if (!batchId || typeof batchId !== 'string' || batchId.trim().length === 0) {
                const result = ControllerResult.badRequest('批次 ID 參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting position archives by batch ID: ${batchId}`);
            logger.info('Position archives by batch ID request received', { batchId, limit });

            const archives = await this.archiveService.getPositionArchivesByBatchId(batchId, limit);
            const result = ControllerResult.success('位置歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Position archives by batch ID retrieval completed successfully', {
                batchId,
                count: archives.length
            });
        } catch (error) {
            logger.error('Error in getPositionArchivesByBatchId', {
                batchId: req.params.batchId,
                error
            });
            next(error);
        }
    }

    /**
     * 根據地理邊界查詢位置歷史歸檔
     * @route GET /api/drone-positions-archive/data/geo-bounds
     */
    async getPositionArchivesByGeoBounds(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { minLat, maxLat, minLon, maxLon, limit = 100 } = req.query;

            // 驗證地理座標參數
            const coords = { 
                minLat: parseFloat(minLat as string), 
                maxLat: parseFloat(maxLat as string), 
                minLon: parseFloat(minLon as string), 
                maxLon: parseFloat(maxLon as string) 
            };

            if (Object.values(coords).some(isNaN)) {
                const result = ControllerResult.badRequest('無效的地理座標格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting position archives by geo bounds`);
            logger.info('Position archives by geo bounds request received', { ...coords, limit });

            const archives = await this.archiveService.getPositionArchivesByGeoBounds(
                coords.minLat, coords.maxLat, coords.minLon, coords.maxLon, parseInt(limit as string)
            );
            const result = ControllerResult.success('位置歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Position archives by geo bounds retrieval completed successfully', {
                ...coords,
                count: archives.length
            });
        } catch (error) {
            logger.error('Error in getPositionArchivesByGeoBounds', { query: req.query, error });
            next(error);
        }
    }

    /**
     * 根據無人機和時間範圍查詢軌跡
     * @route GET /api/drone-positions-archive/trajectory/:droneId
     */
    async getTrajectoryByDroneAndTime(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            if (isNaN(droneId) || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ControllerResult.badRequest('無效的參數格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting trajectory for drone ${droneId}`);
            logger.info('Trajectory request received', { droneId, startTime, endTime });

            const trajectory = await this.archiveService.getTrajectoryByDroneAndTime(droneId, startTime, endTime);
            const result = ControllerResult.success('軌跡資料獲取成功', trajectory);

            res.status(result.status).json(result);
            logger.info('Trajectory retrieval completed successfully', { droneId });
        } catch (error) {
            logger.error('Error in getTrajectoryByDroneAndTime', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 取得最新的歷史歸檔記錄
     * @route GET /api/drone-positions-archive/data/latest
     */
    async getLatestPositionArchives(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 20;

            logRequest(req, `Getting latest position archives with limit: ${limit}`);
            logger.info('Latest position archives request received', { limit });

            const archives = await this.archiveService.getLatestPositionArchives(limit);
            const result = ControllerResult.success('最新位置歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Latest position archives retrieval completed successfully', {
                count: archives.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getLatestPositionArchives', { limit: req.query.limit, error });
            next(error);
        }
    }

    /**
     * 取得特定無人機的最新歷史歸檔記錄
     * @route GET /api/drone-positions-archive/data/drone/:droneId/latest
     */
    async getLatestPositionArchiveByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            if (isNaN(droneId)) {
                const result = ControllerResult.badRequest('無效的無人機 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting latest position archive for drone: ${droneId}`);
            logger.info('Latest position archive by drone ID request received', { droneId });

            const archive = await this.archiveService.getLatestPositionArchiveByDroneId(droneId);
            const result = ControllerResult.success('最新位置歷史歸檔資料獲取成功', archive);

            res.status(result.status).json(result);
            logger.info('Latest position archive by drone ID retrieval completed successfully', { droneId });
        } catch (error) {
            logger.error('Error in getLatestPositionArchiveByDroneId', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 統計總記錄數
     * @route GET /api/drone-positions-archive/statistics/count
     */
    async getTotalArchiveCount(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Getting total archive count');
            logger.info('Total archive count request received');

            const count = await this.archiveService.getTotalArchiveCount();
            const result = ControllerResult.success('總記錄數獲取成功', { totalCount: count });

            res.status(result.status).json(result);
            logger.info('Total archive count retrieval completed successfully', { count });
        } catch (error) {
            logger.error('Error in getTotalArchiveCount', { error });
            next(error);
        }
    }

    /**
     * 計算軌跡統計資料
     * @route GET /api/drone-positions-archive/statistics/trajectory/:droneId
     */
    async calculateTrajectoryStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            if (isNaN(droneId) || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ControllerResult.badRequest('無效的參數格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Calculating trajectory statistics for drone: ${droneId}`);
            logger.info('Trajectory statistics request received', { droneId, startTime, endTime });

            const stats = await this.archiveService.calculateTrajectoryStatistics(droneId, startTime, endTime);
            const result = ControllerResult.success('軌跡統計資料獲取成功', stats);

            res.status(result.status).json(result);
            logger.info('Trajectory statistics calculation completed successfully', { droneId });
        } catch (error) {
            logger.error('Error in calculateTrajectoryStatistics', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 計算電池使用統計資料
     * @route GET /api/drone-positions-archive/statistics/battery/:droneId
     */
    async calculateBatteryUsageStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            if (isNaN(droneId) || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ControllerResult.badRequest('無效的參數格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Calculating battery usage statistics for drone: ${droneId}`);
            logger.info('Battery usage statistics request received', { droneId, startTime, endTime });

            const stats = await this.archiveService.calculateBatteryUsageStatistics(droneId, startTime, endTime);
            const result = ControllerResult.success('電池使用統計資料獲取成功', stats);

            res.status(result.status).json(result);
            logger.info('Battery usage statistics calculation completed successfully', { droneId });
        } catch (error) {
            logger.error('Error in calculateBatteryUsageStatistics', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 計算位置分佈統計資料
     * @route GET /api/drone-positions-archive/statistics/position/:droneId
     */
    async calculatePositionDistributionStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            if (isNaN(droneId) || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ControllerResult.badRequest('無效的參數格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Calculating position distribution statistics for drone: ${droneId}`);
            logger.info('Position distribution statistics request received', { droneId, startTime, endTime });

            const stats = await this.archiveService.calculatePositionDistributionStatistics(droneId, startTime, endTime);
            const result = ControllerResult.success('位置分佈統計資料獲取成功', stats);

            res.status(result.status).json(result);
            logger.info('Position distribution statistics calculation completed successfully', { droneId });
        } catch (error) {
            logger.error('Error in calculatePositionDistributionStatistics', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 取得歸檔批次統計資料
     * @route GET /api/drone-positions-archive/statistics/batch/:batchId
     */
    async getArchiveBatchStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const batchId = req.params.batchId;

            if (!batchId || typeof batchId !== 'string' || batchId.trim().length === 0) {
                const result = ControllerResult.badRequest('批次 ID 參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting archive batch statistics for batch: ${batchId}`);
            logger.info('Archive batch statistics request received', { batchId });

            const stats = await this.archiveService.getArchiveBatchStatistics(batchId);
            const result = ControllerResult.success('歸檔批次統計資料獲取成功', stats);

            res.status(result.status).json(result);
            logger.info('Archive batch statistics retrieval completed successfully', { batchId });
        } catch (error) {
            logger.error('Error in getArchiveBatchStatistics', {
                batchId: req.params.batchId,
                error
            });
            next(error);
        }
    }

    /**
     * 分析飛行模式
     * @route GET /api/drone-positions-archive/analysis/patterns/:droneId
     */
    async analyzeFlightPatterns(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            if (isNaN(droneId) || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ControllerResult.badRequest('無效的參數格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Analyzing flight patterns for drone: ${droneId}`);
            logger.info('Flight patterns analysis request received', { droneId, startTime, endTime });

            const patterns = await this.archiveService.analyzeFlightPatterns(droneId, startTime, endTime);
            const result = ControllerResult.success('飛行模式分析完成', patterns);

            res.status(result.status).json(result);
            logger.info('Flight patterns analysis completed successfully', { droneId });
        } catch (error) {
            logger.error('Error in analyzeFlightPatterns', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 檢測異常位置資料
     * @route GET /api/drone-positions-archive/analysis/anomalies/:droneId
     */
    async detectAnomalousPositions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            if (isNaN(droneId) || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ControllerResult.badRequest('無效的參數格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Detecting anomalous positions for drone: ${droneId}`);
            logger.info('Anomalous positions detection request received', { droneId, startTime, endTime });

            const anomalies = await this.archiveService.detectAnomalousPositions(droneId, startTime, endTime);
            const result = ControllerResult.success('異常位置檢測完成', anomalies);

            res.status(result.status).json(result);
            logger.info('Anomalous positions detection completed successfully', { droneId });
        } catch (error) {
            logger.error('Error in detectAnomalousPositions', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }

    /**
     * 產生軌跡摘要報告
     * @route GET /api/drone-positions-archive/reports/summary/:droneId
     */
    async generateTrajectorySummaryReport(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            if (isNaN(droneId) || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                const result = ControllerResult.badRequest('無效的參數格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Generating trajectory summary report for drone: ${droneId}`);
            logger.info('Trajectory summary report request received', { droneId, startTime, endTime });

            const report = await this.archiveService.generateTrajectorySummaryReport(droneId, startTime, endTime);
            const result = ControllerResult.success('軌跡摘要報告生成完成', report);

            res.status(result.status).json(result);
            logger.info('Trajectory summary report generation completed successfully', { droneId });
        } catch (error) {
            logger.error('Error in generateTrajectorySummaryReport', {
                droneId: req.params.droneId,
                error
            });
            next(error);
        }
    }
}