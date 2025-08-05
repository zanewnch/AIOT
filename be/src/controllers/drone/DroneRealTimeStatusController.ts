/**
 * @fileoverview 無人機即時狀態控制器
 * 
 * 此文件實作無人機即時狀態的控制器層，處理所有與即時狀態相關的 HTTP 請求。
 * 提供完整的 RESTful API 端點，包括 CRUD 操作、狀態監控和統計查詢功能。
 * 
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import { 
    DroneRealTimeStatusService, 
    IDroneRealTimeStatusService 
} from '../../services/drone/DroneRealTimeStatusService';
import { 
    DroneRealTimeStatusCreationAttributes,
    DroneRealTimeStatus
} from '../../models/drone/DroneRealTimeStatusModel';
import { ControllerResult } from '../../utils/ControllerResult';

/**
 * 無人機即時狀態控制器類別
 * 
 * 處理所有與無人機即時狀態相關的 HTTP 請求
 * 
 * @class DroneRealTimeStatusController
 */
export class DroneRealTimeStatusController {
    private service: IDroneRealTimeStatusService;

    constructor(service?: IDroneRealTimeStatusService) {
        this.service = service || new DroneRealTimeStatusService();
    }

    /**
     * 創建新的無人機即時狀態記錄
     * 
     * @route POST /api/drone-real-time-status
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public createRealTimeStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const data: DroneRealTimeStatusCreationAttributes = req.body;
            const result = await this.service.createRealTimeStatus(data);
            res.status(201).json(ControllerResult.created('即時狀態記錄創建成功', result));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(400).json(ControllerResult.badRequest(errorMessage));
        }
    };

    /**
     * 根據 ID 獲取即時狀態記錄
     * 
     * @route GET /api/drone-real-time-status/:id
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public getRealTimeStatusById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const result = await this.service.getRealTimeStatusById(id);
            res.status(200).json(ControllerResult.success('獲取成功', result));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(404).json(ControllerResult.notFound(errorMessage));
        }
    };

    /**
     * 根據無人機 ID 獲取即時狀態記錄
     * 
     * @route GET /api/drone-real-time-status/drone/:droneId
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public getRealTimeStatusByDroneId = async (req: Request, res: Response): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);
            const result = await this.service.getRealTimeStatusByDroneId(droneId);

            if (result.isSuccess()) {
                res.status(200).json(ControllerResult.success(result.message, result.data));
            } else {
                res.status(404).json(ControllerResult.notFound(result.message));
            }
        } catch (error) {
            res.status(500).json(ControllerResult.internalError(`獲取即時狀態記錄時發生錯誤: ${error}`));
        }
    };

    /**
     * 獲取所有即時狀態記錄
     * 
     * @route GET /api/drone-real-time-status
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public getAllRealTimeStatuses = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.service.getAllRealTimeStatuses();

            if (result.isSuccess()) {
                res.status(200).json(ControllerResult.success(result.message, result.data));
            } else {
                res.status(500).json(ControllerResult.internalError(result.message));
            }
        } catch (error) {
            res.status(500).json(ControllerResult.internalError(`獲取即時狀態記錄列表時發生錯誤: ${error}`));
        }
    };

    /**
     * 根據狀態獲取即時狀態記錄
     * 
     * @route GET /api/drone-real-time-status/status/:status
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public getRealTimeStatusesByStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const status = req.params.status as DroneRealTimeStatus;
            const result = await this.service.getRealTimeStatusesByStatus(status);

            if (result.isSuccess()) {
                res.status(200).json(ControllerResult.success(result.message, result.data));
            } else {
                res.status(400).json(ControllerResult.badRequest(result.message));
            }
        } catch (error) {
            res.status(500).json(ControllerResult.internalError(`獲取特定狀態的即時狀態記錄時發生錯誤: ${error}`));
        }
    };

    /**
     * 獲取所有在線的無人機
     * 
     * @route GET /api/drone-real-time-status/online
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public getOnlineDrones = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.service.getOnlineDrones();

            if (result.isSuccess()) {
                res.status(200).json(ControllerResult.success(result.message, result.data));
            } else {
                res.status(500).json(ControllerResult.internalError(result.message));
            }
        } catch (error) {
            res.status(500).json(ControllerResult.internalError(`獲取在線無人機列表時發生錯誤: ${error}`));
        }
    };

    /**
     * 獲取離線的無人機
     * 
     * @route GET /api/drone-real-time-status/offline
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public getOfflineDrones = async (req: Request, res: Response): Promise<void> => {
        try {
            const thresholdMinutes = req.query.threshold ? parseInt(req.query.threshold as string) : 5;
            const result = await this.service.getOfflineDrones(thresholdMinutes);

            if (result.isSuccess()) {
                res.status(200).json(ControllerResult.success(result.message, result.data));
            } else {
                res.status(400).json(ControllerResult.badRequest(result.message));
            }
        } catch (error) {
            res.status(500).json(ControllerResult.internalError(`獲取離線無人機列表時發生錯誤: ${error}`));
        }
    };

    /**
     * 更新即時狀態記錄
     * 
     * @route PUT /api/drone-real-time-status/:id
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public updateRealTimeStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const data = req.body;
            const result = await this.service.updateRealTimeStatus(id, data);

            if (result.isSuccess()) {
                res.status(200).json(ControllerResult.success(result.message, result.data));
            } else {
                res.status(400).json(ControllerResult.badRequest(result.message));
            }
        } catch (error) {
            res.status(500).json(ControllerResult.internalError(`更新即時狀態記錄時發生錯誤: ${error}`));
        }
    };

    /**
     * 根據無人機 ID 更新即時狀態記錄
     * 
     * @route PUT /api/drone-real-time-status/drone/:droneId
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public updateRealTimeStatusByDroneId = async (req: Request, res: Response): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);
            const data = req.body;
            const result = await this.service.updateRealTimeStatusByDroneId(droneId, data);

            if (result.isSuccess()) {
                res.status(200).json(ControllerResult.success(result.message, result.data));
            } else {
                res.status(404).json(ControllerResult.notFound(result.message));
            }
        } catch (error) {
            res.status(500).json(ControllerResult.internalError(`更新即時狀態記錄時發生錯誤: ${error}`));
        }
    };

    /**
     * 刪除即時狀態記錄
     * 
     * @route DELETE /api/drone-real-time-status/:id
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public deleteRealTimeStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const result = await this.service.deleteRealTimeStatus(id);

            if (result.isSuccess()) {
                res.status(200).json(ControllerResult.success(result.message, result.data));
            } else {
                res.status(404).json(ControllerResult.notFound(result.message));
            }
        } catch (error) {
            res.status(500).json(ControllerResult.internalError(`刪除即時狀態記錄時發生錯誤: ${error}`));
        }
    };

    /**
     * 根據無人機 ID 刪除即時狀態記錄
     * 
     * @route DELETE /api/drone-real-time-status/drone/:droneId
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public deleteRealTimeStatusByDroneId = async (req: Request, res: Response): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);
            const result = await this.service.deleteRealTimeStatusByDroneId(droneId);

            if (result.isSuccess()) {
                res.status(200).json(ControllerResult.success(result.message, result.data));
            } else {
                res.status(404).json(ControllerResult.notFound(result.message));
            }
        } catch (error) {
            res.status(500).json(ControllerResult.internalError(`刪除即時狀態記錄時發生錯誤: ${error}`));
        }
    };

    /**
     * Upsert 即時狀態記錄
     * 
     * @route POST /api/drone-real-time-status/drone/:droneId/upsert
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public upsertRealTimeStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);
            const data: DroneRealTimeStatusCreationAttributes = req.body;
            const result = await this.service.upsertRealTimeStatus(droneId, data);

            if (result.isSuccess()) {
                res.status(200).json(ControllerResult.success(result.message, result.data));
            } else {
                res.status(400).json(ControllerResult.badRequest(result.message));
            }
        } catch (error) {
            res.status(500).json(ControllerResult.internalError(`更新/創建即時狀態記錄時發生錯誤: ${error}`));
        }
    };

    /**
     * 更新心跳包
     * 
     * @route POST /api/drone-real-time-status/drone/:droneId/heartbeat
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public updateHeartbeat = async (req: Request, res: Response): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);
            const result = await this.service.updateHeartbeat(droneId);

            if (result.isSuccess()) {
                res.status(200).json(ControllerResult.success(result.message, result.data));
            } else {
                res.status(400).json(ControllerResult.badRequest(result.message));
            }
        } catch (error) {
            res.status(500).json(ControllerResult.internalError(`更新心跳包時發生錯誤: ${error}`));
        }
    };

    /**
     * 獲取電池統計資訊
     * 
     * @route GET /api/drone-real-time-status/statistics/battery
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public getBatteryStatistics = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.service.getBatteryStatistics();

            if (result.isSuccess()) {
                res.status(200).json(ControllerResult.success(result.message, result.data));
            } else {
                res.status(500).json(ControllerResult.internalError(result.message));
            }
        } catch (error) {
            res.status(500).json(ControllerResult.internalError(`獲取電池統計資訊時發生錯誤: ${error}`));
        }
    };

    /**
     * 獲取狀態統計資訊
     * 
     * @route GET /api/drone-real-time-status/statistics/status
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public getStatusStatistics = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.service.getStatusStatistics();

            if (result.isSuccess()) {
                res.status(200).json(ControllerResult.success(result.message, result.data));
            } else {
                res.status(500).json(ControllerResult.internalError(result.message));
            }
        } catch (error) {
            res.status(500).json(ControllerResult.internalError(`獲取狀態統計資訊時發生錯誤: ${error}`));
        }
    };

    /**
     * 獲取儀表板摘要資訊
     * 
     * @route GET /api/drone-real-time-status/dashboard/summary
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.service.getDashboardSummary();

            if (result.isSuccess()) {
                res.status(200).json(ControllerResult.success(result.message, result.data));
            } else {
                res.status(500).json(ControllerResult.internalError(result.message));
            }
        } catch (error) {
            res.status(500).json(ControllerResult.internalError(`獲取儀表板摘要時發生錯誤: ${error}`));
        }
    };

    /**
     * 檢查低電量無人機
     * 
     * @route GET /api/drone-real-time-status/low-battery
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public checkLowBatteryDrones = async (req: Request, res: Response): Promise<void> => {
        try {
            const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 20;
            const result = await this.service.checkLowBatteryDrones(threshold);

            if (result.isSuccess()) {
                res.status(200).json(ControllerResult.success(result.message, result.data));
            } else {
                res.status(400).json(ControllerResult.badRequest(result.message));
            }
        } catch (error) {
            res.status(500).json(ControllerResult.internalError(`檢查低電量無人機時發生錯誤: ${error}`));
        }
    };

    /**
     * 標記無人機為離線狀態
     * 
     * @route POST /api/drone-real-time-status/drone/:droneId/offline
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     */
    public markDroneOffline = async (req: Request, res: Response): Promise<void> => {
        try {
            const droneId = parseInt(req.params.droneId);
            const { errorMessage } = req.body;
            const result = await this.service.markDroneOffline(droneId, errorMessage);

            if (result.isSuccess()) {
                res.status(200).json(ControllerResult.success(result.message, result.data));
            } else {
                res.status(404).json(ControllerResult.notFound(result.message));
            }
        } catch (error) {
            res.status(500).json(ControllerResult.internalError(`標記無人機離線狀態時發生錯誤: ${error}`));
        }
    };
}