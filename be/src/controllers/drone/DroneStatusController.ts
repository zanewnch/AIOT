/**
 * @fileoverview 無人機狀態資料控制器
 * 負責處理無人機狀態資料的 HTTP 端點
 * 提供無人機基本資訊和狀態管理的 CRUD 操作功能
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @description API 端點說明：
 * - GET /api/drone-status/data - 取得所有無人機狀態資料
 * - GET /api/drone-status/data/:id - 取得指定無人機狀態資料
 * - GET /api/drone-status/data/serial/:serial - 根據序號取得無人機狀態資料
 * - POST /api/drone-status/data - 創建新的無人機狀態資料
 * - PUT /api/drone-status/data/:id - 更新指定無人機狀態資料
 * - DELETE /api/drone-status/data/:id - 刪除指定無人機狀態資料
 * - GET /api/drone-status/data/status/:status - 根據狀態查詢無人機
 * - GET /api/drone-status/data/owner/:ownerId - 根據擁有者查詢無人機
 * - GET /api/drone-status/data/manufacturer/:manufacturer - 根據製造商查詢無人機
 * - PATCH /api/drone-status/data/:id/status - 更新無人機狀態
 * - GET /api/drone-status/statistics - 取得無人機狀態統計
 */

import { Request, Response, NextFunction } from 'express';
import { DroneStatusService } from '../services/DroneStatusService.js';
import type { IDroneStatusService } from '../types/services/IDroneStatusService.js';
import { createLogger, logRequest } from '../configs/loggerConfig.js';
import { ControllerResult } from '../utils/ControllerResult.js';
import type { DroneStatusCreationAttributes, DroneStatus } from '../models/DroneStatusModel.js';

// 創建控制器專用的日誌記錄器
const logger = createLogger('DroneStatusController');

/**
 * 無人機狀態控制器類別
 *
 * 處理所有與無人機狀態資料相關的 HTTP 請求
 * 使用 Service 層進行業務邏輯處理
 *
 * @class DroneStatusController
 */
export class DroneStatusController {
    private droneStatusService: IDroneStatusService;

    /**
     * 建構子
     *
     * @param {IDroneStatusService} droneStatusService - 無人機狀態服務實例
     */
    constructor() {
        this.droneStatusService = new DroneStatusService();
    }

    /**
     * 取得所有無人機狀態資料
     *
     * @route GET /api/drone-status/data
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getAllDroneStatuses(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // 記錄請求
            logRequest(req.originalUrl, req.method, 'Getting all drone status data');
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
     *
     * @route GET /api/drone-status/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getDroneStatusById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting drone status data by ID: ${id}`);
            logger.info('Drone status data by ID request received', { id });

            // 呼叫服務層取得資料
            const droneStatus = await this.droneStatusService.getDroneStatusById(id);

            // 建立成功回應
            const result = ControllerResult.success('無人機狀態資料獲取成功', droneStatus);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drone status data by ID retrieval completed successfully', { id });

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
     *
     * @route GET /api/drone-status/data/serial/:serial
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getDroneStatusBySerial(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneSerial = req.params.serial;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting drone status data by serial: ${droneSerial}`);
            logger.info('Drone status data by serial request received', { droneSerial });

            // 呼叫服務層取得資料
            const droneStatus = await this.droneStatusService.getDroneStatusBySerial(droneSerial);

            // 建立成功回應
            const result = ControllerResult.success('無人機狀態資料獲取成功', droneStatus);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drone status data by serial retrieval completed successfully', { droneSerial });

        } catch (error) {
            logger.error('Error in getDroneStatusBySerial', {
                droneSerial: req.params.serial,
                error
            });
            next(error);
        }
    }

    /**
     * 創建新的無人機狀態資料
     *
     * @route POST /api/drone-status/data
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async createDroneStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneStatusData: DroneStatusCreationAttributes = req.body;

            // 記錄請求
            logRequest(req.originalUrl, req.method, 'Creating new drone status data');
            logger.info('Drone status data creation request received', { droneStatusData });

            // 呼叫服務層創建資料
            const createdData = await this.droneStatusService.createDroneStatus(droneStatusData);

            // 建立創建成功回應
            const result = ControllerResult.created('無人機狀態資料創建成功', createdData);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drone status data creation completed successfully', {
                id: createdData.id
            });

        } catch (error) {
            logger.error('Error in createDroneStatus', {
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 更新無人機狀態資料
     *
     * @route PUT /api/drone-status/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async updateDroneStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const updateData: Partial<DroneStatusCreationAttributes> = req.body;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Updating drone status data with ID: ${id}`);
            logger.info('Drone status data update request received', { id, updateData });

            // 呼叫服務層更新資料
            const updatedData = await this.droneStatusService.updateDroneStatus(id, updateData);

            // 建立成功回應
            const result = ControllerResult.success('無人機狀態資料更新成功', updatedData);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drone status data update completed successfully', { id });

        } catch (error) {
            logger.error('Error in updateDroneStatus', {
                id: req.params.id,
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 刪除無人機狀態資料
     *
     * @route DELETE /api/drone-status/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async deleteDroneStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Deleting drone status data with ID: ${id}`);
            logger.info('Drone status data deletion request received', { id });

            // 呼叫服務層刪除資料
            await this.droneStatusService.deleteDroneStatus(id);

            // 建立成功回應
            const result = ControllerResult.success('無人機狀態資料刪除成功');

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drone status data deletion completed successfully', { id });

        } catch (error) {
            logger.error('Error in deleteDroneStatus', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 根據狀態查詢無人機
     *
     * @route GET /api/drone-status/data/status/:status
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getDronesByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const status = req.params.status as DroneStatus;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting drones by status: ${status}`);
            logger.info('Drones by status request received', { status });

            // 呼叫服務層取得資料
            const droneStatuses = await this.droneStatusService.getDronesByStatus(status);

            // 建立成功回應
            const result = ControllerResult.success('無人機狀態資料獲取成功', droneStatuses);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drones by status retrieval completed successfully', {
                status,
                count: droneStatuses.length
            });

        } catch (error) {
            logger.error('Error in getDronesByStatus', {
                status: req.params.status,
                error
            });
            next(error);
        }
    }

    /**
     * 根據擁有者查詢無人機
     *
     * @route GET /api/drone-status/data/owner/:ownerId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getDronesByOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const ownerId = parseInt(req.params.ownerId);

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting drones by owner: ${ownerId}`);
            logger.info('Drones by owner request received', { ownerId });

            // 呼叫服務層取得資料
            const droneStatuses = await this.droneStatusService.getDronesByOwner(ownerId);

            // 建立成功回應
            const result = ControllerResult.success('無人機狀態資料獲取成功', droneStatuses);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drones by owner retrieval completed successfully', {
                ownerId,
                count: droneStatuses.length
            });

        } catch (error) {
            logger.error('Error in getDronesByOwner', {
                ownerId: req.params.ownerId,
                error
            });
            next(error);
        }
    }

    /**
     * 根據製造商查詢無人機
     *
     * @route GET /api/drone-status/data/manufacturer/:manufacturer
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getDronesByManufacturer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const manufacturer = req.params.manufacturer;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting drones by manufacturer: ${manufacturer}`);
            logger.info('Drones by manufacturer request received', { manufacturer });

            // 呼叫服務層取得資料
            const droneStatuses = await this.droneStatusService.getDronesByManufacturer(manufacturer);

            // 建立成功回應
            const result = ControllerResult.success('無人機狀態資料獲取成功', droneStatuses);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drones by manufacturer retrieval completed successfully', {
                manufacturer,
                count: droneStatuses.length
            });

        } catch (error) {
            logger.error('Error in getDronesByManufacturer', {
                manufacturer: req.params.manufacturer,
                error
            });
            next(error);
        }
    }

    /**
     * 更新無人機狀態
     *
     * @route PATCH /api/drone-status/data/:id/status
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async updateDroneStatusOnly(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const { status } = req.body;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Updating drone status for ID: ${id} to ${status}`);
            logger.info('Drone status update request received', { id, status });

            // 呼叫服務層更新狀態
            const updatedData = await this.droneStatusService.updateDroneStatusOnly(id, status);

            // 建立成功回應
            const result = ControllerResult.success('無人機狀態更新成功', updatedData);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drone status update completed successfully', { id, status });

        } catch (error) {
            logger.error('Error in updateDroneStatusOnly', {
                id: req.params.id,
                status: req.body.status,
                error
            });
            next(error);
        }
    }

    /**
     * 取得無人機狀態統計
     *
     * @route GET /api/drone-status/statistics
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getDroneStatusStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // 記錄請求
            logRequest(req.originalUrl, req.method, 'Getting drone status statistics');
            logger.info('Drone status statistics request received');

            // 呼叫服務層取得統計資料
            const statistics = await this.droneStatusService.getDroneStatusStatistics();

            // 建立成功回應
            const result = ControllerResult.success('無人機狀態統計獲取成功', statistics);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drone status statistics retrieval completed successfully', { statistics });

        } catch (error) {
            logger.error('Error in getDroneStatusStatistics', { error });
            next(error);
        }
    }
}

// 創建控制器實例並匯出方法
const droneStatusController = new DroneStatusController();

export const getAllDroneStatuses = droneStatusController.getAllDroneStatuses.bind(droneStatusController);
export const getDroneStatusById = droneStatusController.getDroneStatusById.bind(droneStatusController);
export const getDroneStatusBySerial = droneStatusController.getDroneStatusBySerial.bind(droneStatusController);
export const createDroneStatus = droneStatusController.createDroneStatus.bind(droneStatusController);
export const updateDroneStatus = droneStatusController.updateDroneStatus.bind(droneStatusController);
export const deleteDroneStatus = droneStatusController.deleteDroneStatus.bind(droneStatusController);
export const getDronesByStatus = droneStatusController.getDronesByStatus.bind(droneStatusController);
export const getDronesByOwner = droneStatusController.getDronesByOwner.bind(droneStatusController);
export const getDronesByManufacturer = droneStatusController.getDronesByManufacturer.bind(droneStatusController);
export const updateDroneStatusOnly = droneStatusController.updateDroneStatusOnly.bind(droneStatusController);
export const getDroneStatusStatistics = droneStatusController.getDroneStatusStatistics.bind(droneStatusController);