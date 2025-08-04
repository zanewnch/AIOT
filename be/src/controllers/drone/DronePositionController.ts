/**
 * @fileoverview 無人機位置資料控制器
 * 負責處理無人機位置資料的 HTTP 端點
 * 提供無人機即時位置資料的 CRUD 操作功能
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @description API 端點說明：
 * - GET /api/drone-position/data - 取得所有無人機位置資料
 * - GET /api/drone-position/data/:id - 取得指定無人機位置資料
 * - POST /api/drone-position/data - 創建新的無人機位置資料
 * - PUT /api/drone-position/data/:id - 更新指定無人機位置資料
 * - DELETE /api/drone-position/data/:id - 刪除指定無人機位置資料
 */

import { Request, Response, NextFunction } from 'express'; // 匯入 Express 的核心型別定義
import { DronePositionService } from '../../services/drone/DronePositionService.js'; // 匯入無人機位置服務層
import type { IDronePositionService } from '../../types/services/IDronePositionService.js'; // 匯入無人機位置服務介面
import { createLogger, logRequest } from '../../configs/loggerConfig.js'; // 匯入日誌記錄器
import { ControllerResult } from '../../utils/ControllerResult.js'; // 匯入控制器結果介面
import type { DronePositionCreationAttributes } from '../../models/drone/DronePositionModel.js'; // 匯入無人機位置類型

// 創建控制器專用的日誌記錄器
const logger = createLogger('DronePositionController');

/**
 * 無人機位置控制器類別
 *
 * 處理所有與無人機位置資料相關的 HTTP 請求
 * 使用 Service 層進行業務邏輯處理
 *
 * @class DronePositionController
 */
export class DronePositionController {
    private dronePositionService: IDronePositionService;

    /**
     * 建構子
     *
     * @param {IDronePositionService} dronePositionService - 無人機位置服務實例
     */
    constructor() {
        this.dronePositionService = new DronePositionService();
    }

    /**
     * 取得所有無人機位置資料
     *
     * @route GET /api/drone-position/data
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     *
     * @example
     * ```json
     * // 成功回應 (200)
     * {
     *   "status": 200,
     *   "message": "無人機位置資料獲取成功",
     *   "data": [
     *     {
     *       "id": 1,
     *       "drone_id": 1,
     *       "latitude": 25.033964,
     *       "longitude": 121.564468,
     *       "altitude": 100.5,
     *       "timestamp": "2024-01-01T00:00:00.000Z",
     *       "createdAt": "2024-01-01T00:00:00.000Z",
     *       "updatedAt": "2024-01-01T00:00:00.000Z"
     *     }
     *   ]
     * }
     * ```
     */
    async getAllDronePositions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // 記錄請求
            logRequest(req, 'Getting all drone position data');
            logger.info('Drone position data retrieval request received');

            // 呼叫服務層取得資料
            const dronePositions = await this.dronePositionService.getAllDronePositions();

            // 建立成功回應
            const result = ControllerResult.success('無人機位置資料獲取成功', dronePositions);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drone position data retrieval completed successfully', {
                count: dronePositions.length
            });

        } catch (error) {
            logger.error('Error in getAllDronePositions', { error });
            next(error);
        }
    }

    /**
     * 根據 ID 取得無人機位置資料
     *
     * @route GET /api/drone-position/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getDronePositionById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting drone position data by ID: ${id}`);
            logger.info('Drone position data by ID request received', { id });

            // 呼叫服務層取得資料
            const dronePosition = await this.dronePositionService.getDronePositionById(id);

            // 建立成功回應
            const result = ControllerResult.success('無人機位置資料獲取成功', dronePosition);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drone position data by ID retrieval completed successfully', { id });

        } catch (error) {
            logger.error('Error in getDronePositionById', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 創建新的無人機位置資料
     *
     * @route POST /api/drone-position/data
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async createDronePosition(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dronePositionData: DronePositionCreationAttributes = req.body;

            // 記錄請求
            logRequest(req.originalUrl, req.method, 'Creating new drone position data');
            logger.info('Drone position data creation request received', { dronePositionData });

            // 呼叫服務層創建資料
            const createdData = await this.dronePositionService.createDronePosition(dronePositionData);

            // 建立創建成功回應
            const result = ControllerResult.created('無人機位置資料創建成功', createdData);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drone position data creation completed successfully', {
                id: createdData.id
            });

        } catch (error) {
            logger.error('Error in createDronePosition', {
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 更新無人機位置資料
     *
     * @route PUT /api/drone-position/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async updateDronePosition(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const updateData: Partial<DronePositionCreationAttributes> = req.body;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Updating drone position data with ID: ${id}`);
            logger.info('Drone position data update request received', { id, updateData });

            // 呼叫服務層更新資料
            const updatedData = await this.dronePositionService.updateDronePosition(id, updateData);

            // 建立成功回應
            const result = ControllerResult.success('無人機位置資料更新成功', updatedData);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drone position data update completed successfully', { id });

        } catch (error) {
            logger.error('Error in updateDronePosition', {
                id: req.params.id,
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 刪除無人機位置資料
     *
     * @route DELETE /api/drone-position/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async deleteDronePosition(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Deleting drone position data with ID: ${id}`);
            logger.info('Drone position data deletion request received', { id });

            // 呼叫服務層刪除資料
            await this.dronePositionService.deleteDronePosition(id);

            // 建立成功回應
            const result = ControllerResult.success('無人機位置資料刪除成功');

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drone position data deletion completed successfully', { id });

        } catch (error) {
            logger.error('Error in deleteDronePosition', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 取得最新的無人機位置資料
     *
     * @route GET /api/drone-position/data/latest
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getLatestDronePositions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 10;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting latest drone position data with limit: ${limit}`);
            logger.info('Latest drone position data request received', { limit });

            // 呼叫服務層取得最新資料
            const latestData = await this.dronePositionService.getLatestDronePositions(limit);

            // 建立成功回應
            const result = ControllerResult.success('最新無人機位置資料獲取成功', latestData);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Latest drone position data retrieval completed successfully', {
                count: latestData.length,
                limit
            });

        } catch (error) {
            logger.error('Error in getLatestDronePositions', {
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }

    /**
     * 根據無人機 ID 取得位置資料
     *
     * @route GET /api/drone-position/data/drone/:droneId
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getDronePositionsByDroneId(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const droneId = parseInt(req.params.droneId);
            const limit = parseInt(req.query.limit as string) || 10;

            // 記錄請求
            logRequest(req.originalUrl, req.method, `Getting drone positions for drone ID: ${droneId}`);
            logger.info('Drone positions by drone ID request received', { droneId, limit });

            // 呼叫服務層取得資料
            const dronePositions = await this.dronePositionService.getDronePositionsByDroneId(droneId, limit);

            // 建立成功回應
            const result = ControllerResult.success('無人機位置資料獲取成功', dronePositions);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Drone positions by drone ID retrieval completed successfully', {
                droneId,
                count: dronePositions.length,
                limit
            });

        } catch (error) {
            logger.error('Error in getDronePositionsByDroneId', {
                droneId: req.params.droneId,
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }
}

// 創建控制器實例並匯出方法
const dronePositionController = new DronePositionController();

export const getAllDronePositions = dronePositionController.getAllDronePositions.bind(dronePositionController);
export const getDronePositionById = dronePositionController.getDronePositionById.bind(dronePositionController);
export const createDronePosition = dronePositionController.createDronePosition.bind(dronePositionController);
export const updateDronePosition = dronePositionController.updateDronePosition.bind(dronePositionController);
export const deleteDronePosition = dronePositionController.deleteDronePosition.bind(dronePositionController);
export const getLatestDronePositions = dronePositionController.getLatestDronePositions.bind(dronePositionController);
export const getDronePositionsByDroneId = dronePositionController.getDronePositionsByDroneId.bind(dronePositionController);