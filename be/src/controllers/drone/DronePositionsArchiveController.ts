/**
 * @fileoverview 無人機位置歷史歸檔控制器
 * 負責處理無人機位置歷史歸檔的 HTTP 端點
 * 提供位置歷史查詢、統計分析和軌跡分析的 API 功能
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @description API 端點說明：
 * - GET /api/drone-positions-archive/data - 取得所有位置歷史歸檔資料
 * - GET /api/drone-positions-archive/data/:id - 取得指定位置歷史資料
 * - POST /api/drone-positions-archive/data - 創建新的位置歷史記錄
 * - PUT /api/drone-positions-archive/data/:id - 更新指定位置歷史資料
 * - DELETE /api/drone-positions-archive/data/:id - 刪除指定位置歷史資料
 * - GET /api/drone-positions-archive/data/drone/:droneId - 根據無人機 ID 查詢歷史
 * - GET /api/drone-positions-archive/data/time-range - 根據時間範圍查詢歷史
 * - GET /api/drone-positions-archive/data/batch/:batchId - 根據批次查詢歷史
 * - GET /api/drone-positions-archive/data/geo-bounds - 根據地理邊界查詢歷史
 * - GET /api/drone-positions-archive/trajectory/:droneId - 查詢無人機軌跡
 * - GET /api/drone-positions-archive/statistics/trajectory/:droneId - 軌跡統計分析
 * - GET /api/drone-positions-archive/statistics/battery/:droneId - 電池使用統計
 * - GET /api/drone-positions-archive/statistics/position/:droneId - 位置分佈統計
 * - GET /api/drone-positions-archive/analysis/patterns/:droneId - 飛行模式分析
 * - GET /api/drone-positions-archive/analysis/anomalies/:droneId - 異常位置檢測
 * - GET /api/drone-positions-archive/reports/summary/:droneId - 軌跡摘要報告
 */

import { Request, Response, NextFunction } from 'express';
import { DronePositionsArchiveService } from '../../services/drone/DronePositionsArchiveService.js';
import type { IDronePositionsArchiveService } from '../../types/services/IDronePositionsArchiveService.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';
import type { DronePositionsArchiveCreationAttributes } from '../../models/DronePositionsArchiveModel.js';

// 創建控制器專用的日誌記錄器
const logger = createLogger('DronePositionsArchiveController');

/**
 * 無人機位置歷史歸檔控制器類別
 *
 * 處理所有與無人機位置歷史歸檔相關的 HTTP 請求
 * 使用 Service 層進行業務邏輯處理
 *
 * @class DronePositionsArchiveController
 */
export class DronePositionsArchiveController {
    private archiveService: IDronePositionsArchiveService;

    /**
     * 建構子
     */
    constructor() {
        this.archiveService = new DronePositionsArchiveService();
    }

    /**
     * 取得所有位置歷史歸檔資料
     *
     * @route GET /api/drone-positions-archive/data
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getAllPositionArchives(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 100;

            logRequest(req.originalUrl, req.method, `Getting all position archives with limit: ${limit}`);
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
     * 根據 ID 取得位置歷史歸檔資料
     *
     * @route GET /api/drone-positions-archive/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getPositionArchiveById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            logRequest(req.originalUrl, req.method, `Getting position archive by ID: ${id}`);
            logger.info('Position archive by ID request received', { id });

            const archive = await this.archiveService.getPositionArchiveById(id);
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
     * 根據原始 ID 取得歸檔資料
     *
     * @route GET /api/drone-positions-archive/data/original/:originalId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getPositionArchiveByOriginalId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const originalId = parseInt(req.params.originalId);

            logRequest(req.originalUrl, req.method, `Getting position archive by original ID: ${originalId}`);
            logger.info('Position archive by original ID request received', { originalId });

            const archive = await this.archiveService.getPositionArchiveByOriginalId(originalId);
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
     * 創建新的位置歷史歸檔記錄
     *
     * @route POST /api/drone-positions-archive/data
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async createPositionArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const archiveData: DronePositionsArchiveCreationAttributes = req.body;

            logRequest(req.originalUrl, req.method, 'Creating new position archive');
            logger.info('Position archive creation request received', { archiveData });

            const createdData = await this.archiveService.createPositionArchive(archiveData);
            const result = ControllerResult.created('位置歷史歸檔記錄創建成功', createdData);

            res.status(result.status).json(result);
            logger.info('Position archive creation completed successfully', {
                id: createdData.id
            });
        } catch (error) {
            logger.error('Error in createPositionArchive', {
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 批量創建位置歷史歸檔記錄
     *
     * @route POST /api/drone-positions-archive/data/bulk
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async bulkCreatePositionArchives(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const archiveDataArray: DronePositionsArchiveCreationAttributes[] = req.body;

            logRequest(req.originalUrl, req.method, `Bulk creating ${archiveDataArray.length} position archives`);
            logger.info('Bulk position archive creation request received', { count: archiveDataArray.length });

            const createdData = await this.archiveService.bulkCreatePositionArchives(archiveDataArray);
            const result = ControllerResult.created('批量位置歷史歸檔記錄創建成功', createdData);

            res.status(result.status).json(result);
            logger.info('Bulk position archive creation completed successfully', {
                count: createdData.length
            });
        } catch (error) {
            logger.error('Error in bulkCreatePositionArchives', {
                count: req.body?.length,
                error
            });
            next(error);
        }
    }

    /**
     * 更新位置歷史歸檔資料
     *
     * @route PUT /api/drone-positions-archive/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async updatePositionArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const updateData: Partial<DronePositionsArchiveCreationAttributes> = req.body;

            logRequest(req.originalUrl, req.method, `Updating position archive with ID: ${id}`);
            logger.info('Position archive update request received', { id, updateData });

            const updatedData = await this.archiveService.updatePositionArchive(id, updateData);
            const result = ControllerResult.success('位置歷史歸檔資料更新成功', updatedData);

            res.status(result.status).json(result);
            logger.info('Position archive update completed successfully', { id });
        } catch (error) {
            logger.error('Error in updatePositionArchive', {
                id: req.params.id,
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 刪除位置歷史歸檔資料
     *
     * @route DELETE /api/drone-positions-archive/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async deletePositionArchive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            logRequest(req.originalUrl, req.method, `Deleting position archive with ID: ${id}`);
            logger.info('Position archive deletion request received', { id });

            await this.archiveService.deletePositionArchive(id);
            const result = ControllerResult.success('位置歷史歸檔資料刪除成功');

            res.status(result.status).json(result);
            logger.info('Position archive deletion completed successfully', { id });
        } catch (error) {
            logger.error('Error in deletePositionArchive', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 根據無人機 ID 查詢位置歷史歸檔
     *
     * @route GET /api/drone-positions-archive/data/drone/:droneId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getPositionArchivesByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const limit = parseInt(req.query.limit as string) || 100;

            logRequest(req.originalUrl, req.method, `Getting position archives for drone: ${droneId}`);
            logger.info('Position archives by drone ID request received', { droneId, limit });

            const archives = await this.archiveService.getPositionArchivesByDroneId(droneId, limit);
            const result = ControllerResult.success('位置歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Position archives by drone ID retrieval completed successfully', {
                droneId,
                count: archives.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getPositionArchivesByDroneId', {
                droneId: req.params.droneId,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 根據時間範圍查詢位置歷史歸檔
     *
     * @route GET /api/drone-positions-archive/data/time-range
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getPositionArchivesByTimeRange(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);
            const limit = parseInt(req.query.limit as string) || 500;

            logRequest(req.originalUrl, req.method, `Getting position archives by time range: ${startTime} to ${endTime}`);
            logger.info('Position archives by time range request received', { startTime, endTime, limit });

            const archives = await this.archiveService.getPositionArchivesByTimeRange(startTime, endTime, limit);
            const result = ControllerResult.success('位置歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Position archives by time range retrieval completed successfully', {
                startTime,
                endTime,
                count: archives.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getPositionArchivesByTimeRange', {
                startTime: req.query.startTime,
                endTime: req.query.endTime,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 根據歸檔批次 ID 查詢資料
     *
     * @route GET /api/drone-positions-archive/data/batch/:batchId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getPositionArchivesByBatchId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const batchId = req.params.batchId;

            logRequest(req.originalUrl, req.method, `Getting position archives by batch ID: ${batchId}`);
            logger.info('Position archives by batch ID request received', { batchId });

            const archives = await this.archiveService.getPositionArchivesByBatchId(batchId);
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
     *
     * @route GET /api/drone-positions-archive/data/geo-bounds
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getPositionArchivesByGeoBounds(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const minLat = parseFloat(req.query.minLat as string);
            const maxLat = parseFloat(req.query.maxLat as string);
            const minLng = parseFloat(req.query.minLng as string);
            const maxLng = parseFloat(req.query.maxLng as string);
            const limit = parseInt(req.query.limit as string) || 200;

            logRequest(req.originalUrl, req.method, `Getting position archives by geo bounds`);
            logger.info('Position archives by geo bounds request received', { minLat, maxLat, minLng, maxLng, limit });

            const archives = await this.archiveService.getPositionArchivesByGeoBounds(minLat, maxLat, minLng, maxLng, limit);
            const result = ControllerResult.success('位置歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Position archives by geo bounds retrieval completed successfully', {
                minLat, maxLat, minLng, maxLng,
                count: archives.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getPositionArchivesByGeoBounds', {
                minLat: req.query.minLat,
                maxLat: req.query.maxLat,
                minLng: req.query.minLng,
                maxLng: req.query.maxLng,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 根據無人機和時間範圍查詢軌跡
     *
     * @route GET /api/drone-positions-archive/trajectory/:droneId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getTrajectoryByDroneAndTime(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);
            const limit = parseInt(req.query.limit as string) || 1000;

            logRequest(req.originalUrl, req.method, `Getting trajectory for drone: ${droneId}`);
            logger.info('Trajectory request received', { droneId, startTime, endTime, limit });

            const trajectory = await this.archiveService.getTrajectoryByDroneAndTime(droneId, startTime, endTime, limit);
            const result = ControllerResult.success('無人機軌跡資料獲取成功', trajectory);

            res.status(result.status).json(result);
            logger.info('Trajectory retrieval completed successfully', {
                droneId,
                count: trajectory.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getTrajectoryByDroneAndTime', {
                droneId: req.params.droneId,
                startTime: req.query.startTime,
                endTime: req.query.endTime,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 取得最新的歷史歸檔記錄
     *
     * @route GET /api/drone-positions-archive/data/latest
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getLatestPositionArchives(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 50;

            logRequest(req.originalUrl, req.method, `Getting latest position archives with limit: ${limit}`);
            logger.info('Latest position archives request received', { limit });

            const archives = await this.archiveService.getLatestPositionArchives(limit);
            const result = ControllerResult.success('最新位置歷史歸檔資料獲取成功', archives);

            res.status(result.status).json(result);
            logger.info('Latest position archives retrieval completed successfully', {
                count: archives.length,
                limit
            });
        } catch (error) {
            logger.error('Error in getLatestPositionArchives', {
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 取得特定無人機的最新歷史歸檔記錄
     *
     * @route GET /api/drone-positions-archive/data/drone/:droneId/latest
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getLatestPositionArchiveByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);

            logRequest(req.originalUrl, req.method, `Getting latest position archive for drone: ${droneId}`);
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
     *
     * @route GET /api/drone-positions-archive/statistics/count
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getTotalArchiveCount(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req.originalUrl, req.method, 'Getting total archive count');
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
     *
     * @route GET /api/drone-positions-archive/statistics/trajectory/:droneId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async calculateTrajectoryStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            logRequest(req.originalUrl, req.method, `Calculating trajectory statistics for drone: ${droneId}`);
            logger.info('Trajectory statistics request received', { droneId, startTime, endTime });

            const statistics = await this.archiveService.calculateTrajectoryStatistics(droneId, startTime, endTime);
            const result = ControllerResult.success('軌跡統計資料計算成功', statistics);

            res.status(result.status).json(result);
            logger.info('Trajectory statistics calculation completed successfully', { droneId });
        } catch (error) {
            logger.error('Error in calculateTrajectoryStatistics', {
                droneId: req.params.droneId,
                startTime: req.query.startTime,
                endTime: req.query.endTime,
                error
            });
            next(error);
        }
    }

    /**
     * 計算電池使用統計資料
     *
     * @route GET /api/drone-positions-archive/statistics/battery/:droneId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async calculateBatteryUsageStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            logRequest(req.originalUrl, req.method, `Calculating battery usage statistics for drone: ${droneId}`);
            logger.info('Battery usage statistics request received', { droneId, startTime, endTime });

            const statistics = await this.archiveService.calculateBatteryUsageStatistics(droneId, startTime, endTime);
            const result = ControllerResult.success('電池使用統計資料計算成功', statistics);

            res.status(result.status).json(result);
            logger.info('Battery usage statistics calculation completed successfully', { droneId });
        } catch (error) {
            logger.error('Error in calculateBatteryUsageStatistics', {
                droneId: req.params.droneId,
                startTime: req.query.startTime,
                endTime: req.query.endTime,
                error
            });
            next(error);
        }
    }

    /**
     * 計算位置分佈統計資料
     *
     * @route GET /api/drone-positions-archive/statistics/position/:droneId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async calculatePositionDistributionStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            logRequest(req.originalUrl, req.method, `Calculating position distribution statistics for drone: ${droneId}`);
            logger.info('Position distribution statistics request received', { droneId, startTime, endTime });

            const statistics = await this.archiveService.calculatePositionDistributionStatistics(droneId, startTime, endTime);
            const result = ControllerResult.success('位置分佈統計資料計算成功', statistics);

            res.status(result.status).json(result);
            logger.info('Position distribution statistics calculation completed successfully', { droneId });
        } catch (error) {
            logger.error('Error in calculatePositionDistributionStatistics', {
                droneId: req.params.droneId,
                startTime: req.query.startTime,
                endTime: req.query.endTime,
                error
            });
            next(error);
        }
    }

    /**
     * 取得歸檔批次統計資料
     *
     * @route GET /api/drone-positions-archive/statistics/batch/:batchId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getArchiveBatchStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const batchId = req.params.batchId;

            logRequest(req.originalUrl, req.method, `Getting archive batch statistics for batch: ${batchId}`);
            logger.info('Archive batch statistics request received', { batchId });

            const statistics = await this.archiveService.getArchiveBatchStatistics(batchId);
            const result = ControllerResult.success('歸檔批次統計資料獲取成功', statistics);

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
     *
     * @route GET /api/drone-positions-archive/analysis/patterns/:droneId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async analyzeFlightPatterns(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            logRequest(req.originalUrl, req.method, `Analyzing flight patterns for drone: ${droneId}`);
            logger.info('Flight patterns analysis request received', { droneId, startTime, endTime });

            const patterns = await this.archiveService.analyzeFlightPatterns(droneId, startTime, endTime);
            const result = ControllerResult.success('飛行模式分析完成', patterns);

            res.status(result.status).json(result);
            logger.info('Flight patterns analysis completed successfully', { droneId, patternsCount: patterns.length });
        } catch (error) {
            logger.error('Error in analyzeFlightPatterns', {
                droneId: req.params.droneId,
                startTime: req.query.startTime,
                endTime: req.query.endTime,
                error
            });
            next(error);
        }
    }

    /**
     * 檢測異常位置資料
     *
     * @route GET /api/drone-positions-archive/analysis/anomalies/:droneId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async detectAnomalousPositions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            logRequest(req.originalUrl, req.method, `Detecting anomalous positions for drone: ${droneId}`);
            logger.info('Anomalous positions detection request received', { droneId, startTime, endTime });

            const anomalies = await this.archiveService.detectAnomalousPositions(droneId, startTime, endTime);
            const result = ControllerResult.success('異常位置資料檢測完成', anomalies);

            res.status(result.status).json(result);
            logger.info('Anomalous positions detection completed successfully', { droneId, anomaliesCount: anomalies.length });
        } catch (error) {
            logger.error('Error in detectAnomalousPositions', {
                droneId: req.params.droneId,
                startTime: req.query.startTime,
                endTime: req.query.endTime,
                error
            });
            next(error);
        }
    }

    /**
     * 產生軌跡摘要報告
     *
     * @route GET /api/drone-positions-archive/reports/summary/:droneId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async generateTrajectorySummaryReport(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const startTime = new Date(req.query.startTime as string);
            const endTime = new Date(req.query.endTime as string);

            logRequest(req.originalUrl, req.method, `Generating trajectory summary report for drone: ${droneId}`);
            logger.info('Trajectory summary report request received', { droneId, startTime, endTime });

            const report = await this.archiveService.generateTrajectorySummaryReport(droneId, startTime, endTime);
            const result = ControllerResult.success('軌跡摘要報告產生成功', report);

            res.status(result.status).json(result);
            logger.info('Trajectory summary report generation completed successfully', { droneId });
        } catch (error) {
            logger.error('Error in generateTrajectorySummaryReport', {
                droneId: req.params.droneId,
                startTime: req.query.startTime,
                endTime: req.query.endTime,
                error
            });
            next(error);
        }
    }

    /**
     * 刪除指定時間之前的歸檔資料
     *
     * @route DELETE /api/drone-positions-archive/data/before/:beforeDate
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async deleteArchivesBeforeDate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const beforeDate = new Date(req.params.beforeDate);

            logRequest(req.originalUrl, req.method, `Deleting archives before date: ${beforeDate}`);
            logger.info('Delete archives before date request received', { beforeDate });

            const deletedCount = await this.archiveService.deleteArchivesBeforeDate(beforeDate);
            const result = ControllerResult.success('歸檔資料刪除成功', { deletedCount });

            res.status(result.status).json(result);
            logger.info('Archives deletion completed successfully', { deletedCount });
        } catch (error) {
            logger.error('Error in deleteArchivesBeforeDate', {
                beforeDate: req.params.beforeDate,
                error
            });
            next(error);
        }
    }

    /**
     * 刪除指定批次的歸檔資料
     *
     * @route DELETE /api/drone-positions-archive/data/batch/:batchId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async deleteArchiveBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const batchId = req.params.batchId;

            logRequest(req.originalUrl, req.method, `Deleting archive batch: ${batchId}`);
            logger.info('Delete archive batch request received', { batchId });

            const deletedCount = await this.archiveService.deleteArchiveBatch(batchId);
            const result = ControllerResult.success('歸檔批次刪除成功', { deletedCount });

            res.status(result.status).json(result);
            logger.info('Archive batch deletion completed successfully', { batchId, deletedCount });
        } catch (error) {
            logger.error('Error in deleteArchiveBatch', {
                batchId: req.params.batchId,
                error
            });
            next(error);
        }
    }
}

// 創建控制器實例並匯出方法
const archiveController = new DronePositionsArchiveController();

export const getAllPositionArchives = archiveController.getAllPositionArchives.bind(archiveController);
export const getPositionArchiveById = archiveController.getPositionArchiveById.bind(archiveController);
export const getPositionArchiveByOriginalId = archiveController.getPositionArchiveByOriginalId.bind(archiveController);
export const createPositionArchive = archiveController.createPositionArchive.bind(archiveController);
export const bulkCreatePositionArchives = archiveController.bulkCreatePositionArchives.bind(archiveController);
export const updatePositionArchive = archiveController.updatePositionArchive.bind(archiveController);
export const deletePositionArchive = archiveController.deletePositionArchive.bind(archiveController);
export const getPositionArchivesByDroneId = archiveController.getPositionArchivesByDroneId.bind(archiveController);
export const getPositionArchivesByTimeRange = archiveController.getPositionArchivesByTimeRange.bind(archiveController);
export const getPositionArchivesByBatchId = archiveController.getPositionArchivesByBatchId.bind(archiveController);
export const getPositionArchivesByGeoBounds = archiveController.getPositionArchivesByGeoBounds.bind(archiveController);
export const getTrajectoryByDroneAndTime = archiveController.getTrajectoryByDroneAndTime.bind(archiveController);
export const getLatestPositionArchives = archiveController.getLatestPositionArchives.bind(archiveController);
export const getLatestPositionArchiveByDroneId = archiveController.getLatestPositionArchiveByDroneId.bind(archiveController);
export const getTotalArchiveCount = archiveController.getTotalArchiveCount.bind(archiveController);
export const calculateTrajectoryStatistics = archiveController.calculateTrajectoryStatistics.bind(archiveController);
export const calculateBatteryUsageStatistics = archiveController.calculateBatteryUsageStatistics.bind(archiveController);
export const calculatePositionDistributionStatistics = archiveController.calculatePositionDistributionStatistics.bind(archiveController);
export const getArchiveBatchStatistics = archiveController.getArchiveBatchStatistics.bind(archiveController);
export const analyzeFlightPatterns = archiveController.analyzeFlightPatterns.bind(archiveController);
export const detectAnomalousPositions = archiveController.detectAnomalousPositions.bind(archiveController);
export const generateTrajectorySummaryReport = archiveController.generateTrajectorySummaryReport.bind(archiveController);
export const deleteArchivesBeforeDate = archiveController.deleteArchivesBeforeDate.bind(archiveController);
export const deleteArchiveBatch = archiveController.deleteArchiveBatch.bind(archiveController);