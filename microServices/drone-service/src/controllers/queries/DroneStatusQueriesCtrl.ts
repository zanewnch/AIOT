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

import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {NextFunction, Request, Response} from 'express';
import {DroneStatusQueriesSvc} from '../../services/queries/DroneStatusQueriesSvc.js';
import {createLogger} from '../../configs/loggerConfig.js';
import {ResResult} from '../../utils/ResResult.js';
import {TYPES} from '../../container/types.js';

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
@injectable()
export class DroneStatusQueries {
    constructor(
        @inject(TYPES.DroneStatusQueriesSvc) private readonly droneStatusService: DroneStatusQueriesSvc
    ) {
    }

    /**
     * 取得所有無人機狀態資料
     * @route GET /api/drone-status/data
     */
    getAllDroneStatuses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const limit = parseInt(req.query.limit as string) || 100;
            const droneStatuses = await this.droneStatusService.getAllDroneStatuses(limit);
            const result = ResResult.success('無人機狀態資料獲取成功', droneStatuses);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據 ID 取得無人機狀態資料
     * @route GET /api/drone-status/data/:id
     */
    getDroneStatusById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = parseInt(req.params.id);

            // 驗證 ID
            if (isNaN(id)) {
                const result = ResResult.badRequest('無效的 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            // 呼叫服務層取得資料
            const droneStatus = await this.droneStatusService.getDroneStatusById(id);

            if (!droneStatus) {
                const result = ResResult.notFound('找不到指定的無人機狀態資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('無人機狀態資料獲取成功', droneStatus);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據序號取得無人機狀態資料
     * @route GET /api/drone-status/data/serial/:serial
     */
    getDroneStatusBySerial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const serial = req.params.serial;

            if (!serial || typeof serial !== 'string' || serial.trim().length === 0) {
                const result = ResResult.badRequest('序號不能為空');
                res.status(result.status).json(result);
                return;
            }

            const droneStatus = await this.droneStatusService.getDroneStatusBySerial(serial.trim());

            if (!droneStatus) {
                const result = ResResult.notFound('找不到指定序號的無人機狀態資料');
                res.status(result.status).json(result);
                return;
            }

            const result = ResResult.success('無人機狀態資料獲取成功', droneStatus);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據狀態查詢無人機
     * @route GET /api/drone-status/data/status/:status
     */
    getDroneStatusesByStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const status = req.params.status;

            if (!status || typeof status !== 'string' || status.trim().length === 0) {
                const result = ResResult.badRequest('狀態參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            const droneStatuses = await this.droneStatusService.getDronesByStatus(status.trim() as any);

            const result = ResResult.success('無人機狀態資料獲取成功', droneStatuses);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據擁有者查詢無人機
     * @route GET /api/drone-status/data/owner/:ownerId
     */
    getDroneStatusesByOwner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const ownerId = parseInt(req.params.ownerId);

            if (isNaN(ownerId)) {
                const result = ResResult.badRequest('無效的擁有者 ID 格式');
                res.status(result.status).json(result);
                return;
            }

            const droneStatuses = await this.droneStatusService.getDronesByOwner(ownerId);

            const result = ResResult.success('無人機狀態資料獲取成功', droneStatuses);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 根據製造商查詢無人機
     * @route GET /api/drone-status/data/manufacturer/:manufacturer
     */
    getDroneStatusesByManufacturer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const manufacturer = req.params.manufacturer;

            if (!manufacturer || typeof manufacturer !== 'string' || manufacturer.trim().length === 0) {
                const result = ResResult.badRequest('製造商參數不能為空');
                res.status(result.status).json(result);
                return;
            }

            const droneStatuses = await this.droneStatusService.getDronesByManufacturer(manufacturer.trim());

            const result = ResResult.success('無人機狀態資料獲取成功', droneStatuses);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * 取得無人機狀態統計
     * @route GET /api/drone-status/statistics
     */
    getDroneStatusStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const statistics = await this.droneStatusService.getDroneStatusStatistics();

            const result = ResResult.success('無人機狀態統計獲取成功', statistics);
            res.status(result.status).json(result);
        } catch (error) {
            next(error);
        }
    }
}