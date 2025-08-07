/**
 * @fileoverview 無人機狀態查詢控制器
 * 
 * 此文件實作了無人機狀態查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，不包含任何寫入邏輯。
 * 
 * @module DroneStatusQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { DroneStatusQueriesSvc } from '../../services/queries/DroneStatusQueriesSvc.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';

const logger = createLogger('DroneStatusQueries');

/**
 * 無人機狀態查詢控制器類別
 * 
 * 專門處理無人機狀態相關的查詢請求，包含取得無人機狀態資料等功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 * 
 * @class DroneStatusQueries
 * @since 1.0.0
 */
export class DroneStatusQueries {
    private droneStatusService: DroneStatusQueriesSvc;

    constructor() {
        this.droneStatusService = new DroneStatusQueriesSvc();
    }

    /**
     * 取得所有無人機狀態資料
     * @route GET /api/drone-status/data
     */
    async getAllDroneStatuses(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // 記錄請求
            logRequest(req, 'Getting all drone status data');
            logger.info('Drone status data retrieval request received');

            // 呼叫服務層取得資料
            const droneStatuses = await this.droneStatusService.getAllDroneStatuses();

            // 建立成功回應
            const result = ControllerResult.success('無人機狀態資料獲取成功', droneStatuses);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drone status data retrieval completed successfully', {
                count: droneStatuses.length
            });

        } catch (error) {
            logger.error('Error in getAllDroneStatuses', { error });
            next(error);
        }
    }

    /**
     * 根據 ID 取得無人機狀態資料
     * @route GET /api/drone-status/data/:id
     */
    async getDroneStatusById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            // 驗證 ID
            if (isNaN(id)) {
                const result = ControllerResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting drone status data with ID: ${id}`);
            logger.info('Drone status data retrieval request received', { id });

            // 呼叫服務層取得資料
            const droneStatus = await this.droneStatusService.getDroneStatusById(id);

            if (!droneStatus) {
                const result = ControllerResult.notFound('找不到指定的無人機狀態資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機狀態資料獲取成功', droneStatus);
            res.status(result.status).json(result);

            logger.info('Drone status data retrieval completed successfully', { id });

        } catch (error) {
            logger.error('Error in getDroneStatusById', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 根據序號取得無人機狀態資料
     * @route GET /api/drone-status/data/serial/:serial
     */
    async getDroneStatusBySerial(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const serial = req.params.serial;

            if (!serial || typeof serial !== 'string' || serial.trim().length === 0) {
                const result = ControllerResult.badRequest('序號不能為空');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting drone status data with serial: ${serial}`);
            logger.info('Drone status data by serial retrieval request received', { serial });

            const droneStatus = await this.droneStatusService.getDroneStatusBySerial(serial.trim());

            if (!droneStatus) {
                const result = ControllerResult.notFound('找不到指定序號的無人機狀態資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ControllerResult.success('無人機狀態資料獲取成功', droneStatus);
            res.status(result.status).json(result);

            logger.info('Drone status data by serial retrieval completed successfully', { serial });

        } catch (error) {
            logger.error('Error in getDroneStatusBySerial', {
                serial: req.params.serial,
                error
            });
            next(error);
        }
    }

    /**
     * 根據狀態查詢無人機
     * @route GET /api/drone-status/data/status/:status
     */
    async getDroneStatusesByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const status = req.params.status;

            if (!status || typeof status !== 'string' || status.trim().length === 0) {
                const result = ControllerResult.badRequest('狀態參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting drone statuses by status: ${status}`);
            logger.info('Drone statuses by status retrieval request received', { status });

            const droneStatuses = await this.droneStatusService.getDronesByStatus(status.trim() as any);

            const result = ControllerResult.success('無人機狀態資料獲取成功', droneStatuses);
            res.status(result.status).json(result);

            logger.info('Drone statuses by status retrieval completed successfully', {
                status,
                count: droneStatuses.length
            });

        } catch (error) {
            logger.error('Error in getDroneStatusesByStatus', {
                status: req.params.status,
                error
            });
            next(error);
        }
    }

    /**
     * 根據擁有者查詢無人機
     * @route GET /api/drone-status/data/owner/:ownerId
     */
    async getDroneStatusesByOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const ownerId = parseInt(req.params.ownerId);

            if (isNaN(ownerId)) {
                const result = ControllerResult.badRequest('無效的擁有者 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting drone statuses by owner ID: ${ownerId}`);
            logger.info('Drone statuses by owner retrieval request received', { ownerId });

            const droneStatuses = await this.droneStatusService.getDronesByOwner(ownerId);

            const result = ControllerResult.success('無人機狀態資料獲取成功', droneStatuses);
            res.status(result.status).json(result);

            logger.info('Drone statuses by owner retrieval completed successfully', {
                ownerId,
                count: droneStatuses.length
            });

        } catch (error) {
            logger.error('Error in getDroneStatusesByOwner', {
                ownerId: req.params.ownerId,
                error
            });
            next(error);
        }
    }

    /**
     * 根據製造商查詢無人機
     * @route GET /api/drone-status/data/manufacturer/:manufacturer
     */
    async getDroneStatusesByManufacturer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const manufacturer = req.params.manufacturer;

            if (!manufacturer || typeof manufacturer !== 'string' || manufacturer.trim().length === 0) {
                const result = ControllerResult.badRequest('製造商參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            logRequest(req, `Getting drone statuses by manufacturer: ${manufacturer}`);
            logger.info('Drone statuses by manufacturer retrieval request received', { manufacturer });

            const droneStatuses = await this.droneStatusService.getDronesByManufacturer(manufacturer.trim());

            const result = ControllerResult.success('無人機狀態資料獲取成功', droneStatuses);
            res.status(result.status).json(result);

            logger.info('Drone statuses by manufacturer retrieval completed successfully', {
                manufacturer,
                count: droneStatuses.length
            });

        } catch (error) {
            logger.error('Error in getDroneStatusesByManufacturer', {
                manufacturer: req.params.manufacturer,
                error
            });
            next(error);
        }
    }

    /**
     * 取得無人機狀態統計
     * @route GET /api/drone-status/statistics
     */
    async getDroneStatusStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            logRequest(req, 'Getting drone status statistics');
            logger.info('Drone status statistics retrieval request received');

            const statistics = await this.droneStatusService.getDroneStatusStatistics();

            const result = ControllerResult.success('無人機狀態統計獲取成功', statistics);
            res.status(result.status).json(result);

            logger.info('Drone status statistics retrieval completed successfully');

        } catch (error) {
            logger.error('Error in getDroneStatusStatistics', { error });
            next(error);
        }
    }
}