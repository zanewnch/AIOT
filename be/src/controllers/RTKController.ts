/**
 * @fileoverview RTK 定位資料控制器
 * 負責處理 RTK（Real-Time Kinematic）定位資料的 HTTP 端點
 * 提供即時動態定位資料的 CRUD 操作功能
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @description API 端點說明：
 * - GET /api/rtk/data - 取得所有 RTK 定位資料
 * - GET /api/rtk/data/:id - 取得指定 RTK 定位資料
 * - POST /api/rtk/data - 創建新的 RTK 定位資料
 * - PUT /api/rtk/data/:id - 更新指定 RTK 定位資料
 * - DELETE /api/rtk/data/:id - 刪除指定 RTK 定位資料
 */

import { Request, Response, NextFunction } from 'express'; // 匯入 Express 的核心型別定義
import { RTKService } from '../services/RTKService.js'; // 匯入 RTK 服務層
import type { IRTKService } from '../types/services/IRTKService.js'; // 匯入 RTK 服務介面
import { createLogger, logRequest } from '../configs/loggerConfig.js'; // 匯入日誌記錄器
import { ControllerResult } from '../utils/ControllerResult.js'; // 匯入控制器結果介面
import type { RTKCreationAttributes } from '../models/RTKModel.js'; // 匯入 RTK 類型

// 創建控制器專用的日誌記錄器
const logger = createLogger('RTKController');

/**
 * RTK 控制器類別
 *
 * 處理所有與 RTK 定位資料相關的 HTTP 請求
 * 使用 Service 層進行業務邏輯處理
 *
 * @class RTKController
 */
export class RTKController {
    private rtkService: IRTKService;

    /**
     * 建構子
     *
     * @param {IRTKService} rtkService - RTK 服務實例
     */
    constructor() {
        this.rtkService = new RTKService();
    }

    /**
     * 取得所有 RTK 定位資料
     *
     * @route GET /api/rtk/data
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
     *   "message": "RTK 資料獲取成功",
     *   "data": [
     *     {
     *       "id": 1,
     *       "latitude": 25.033964,
     *       "longitude": 121.564468,
     *       "createdAt": "2024-01-01T00:00:00.000Z",
     *       "updatedAt": "2024-01-01T00:00:00.000Z"
     *     }
     *   ]
     * }
     * ```
     */
    async getAllRTKData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // 記錄請求
            logRequest(req, 'Getting all RTK data');
            logger.info('RTK data retrieval request received');

            // 呼叫服務層取得資料
            const rtkData = await this.rtkService.getAllRTKData();

            // 建立成功回應
            const result = ControllerResult.success('RTK 資料獲取成功', rtkData);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('RTK data retrieval completed successfully', {
                count: rtkData.length
            });

        } catch (error) {
            logger.error('Error in getAllRTKData', { error });
            next(error);
        }
    }

    /**
     * 根據 ID 取得 RTK 定位資料
     *
     * @route GET /api/rtk/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getRTKDataById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            // 記錄請求
            logRequest(req, `Getting RTK data by ID: ${id}`);
            logger.info('RTK data by ID request received', { id });

            // 呼叫服務層取得資料
            const rtkData = await this.rtkService.getRTKDataById(id);

            // 建立成功回應
            const result = ControllerResult.success('RTK 資料獲取成功', rtkData);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('RTK data by ID retrieval completed successfully', { id });

        } catch (error) {
            logger.error('Error in getRTKDataById', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 創建新的 RTK 定位資料
     *
     * @route POST /api/rtk/data
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async createRTKData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const rtkData: RTKCreationAttributes = req.body;

            // 記錄請求
            logRequest(req, 'Creating new RTK data');
            logger.info('RTK data creation request received', { rtkData });

            // 呼叫服務層創建資料
            const createdData = await this.rtkService.createRTKData(rtkData);

            // 建立創建成功回應
            const result = ControllerResult.created('RTK 資料創建成功', createdData);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('RTK data creation completed successfully', {
                id: createdData.id
            });

        } catch (error) {
            logger.error('Error in createRTKData', {
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 更新 RTK 定位資料
     *
     * @route PUT /api/rtk/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async updateRTKData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const updateData: Partial<RTKCreationAttributes> = req.body;

            // 記錄請求
            logRequest(req, `Updating RTK data with ID: ${id}`);
            logger.info('RTK data update request received', { id, updateData });

            // 呼叫服務層更新資料
            const updatedData = await this.rtkService.updateRTKData(id, updateData);

            // 建立成功回應
            const result = ControllerResult.success('RTK 資料更新成功', updatedData);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('RTK data update completed successfully', { id });

        } catch (error) {
            logger.error('Error in updateRTKData', {
                id: req.params.id,
                requestBody: req.body,
                error
            });
            next(error);
        }
    }

    /**
     * 刪除 RTK 定位資料
     *
     * @route DELETE /api/rtk/data/:id
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async deleteRTKData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            // 記錄請求
            logRequest(req, `Deleting RTK data with ID: ${id}`);
            logger.info('RTK data deletion request received', { id });

            // 呼叫服務層刪除資料
            await this.rtkService.deleteRTKData(id);

            // 建立成功回應
            const result = ControllerResult.success('RTK 資料刪除成功');

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('RTK data deletion completed successfully', { id });

        } catch (error) {
            logger.error('Error in deleteRTKData', {
                id: req.params.id,
                error
            });
            next(error);
        }
    }

    /**
     * 取得最新的 RTK 定位資料
     *
     * @route GET /api/rtk/data/latest
     * @param {Request} req - Express 請求物件
     * @param {Response} res - Express 回應物件
     * @param {NextFunction} next - Express 下一個中介軟體函式
     * @returns {Promise<void>}
     */
    async getLatestRTKData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 10;

            // 記錄請求
            logRequest(req, `Getting latest RTK data with limit: ${limit}`);
            logger.info('Latest RTK data request received', { limit });

            // 呼叫服務層取得最新資料
            const latestData = await this.rtkService.getLatestRTKData(limit);

            // 建立成功回應
            const result = ControllerResult.success('最新 RTK 資料獲取成功', latestData);

            // 回傳結果
            res.status(result.status).json(result);

            logger.info('Latest RTK data retrieval completed successfully', {
                count: latestData.length,
                limit
            });

        } catch (error) {
            logger.error('Error in getLatestRTKData', {
                limit: req.query.limit,
                error
            });
            next(error);
        }
    }
}

// 創建控制器實例並匯出方法
const rtkController = new RTKController();

export const getAllRTKData = rtkController.getAllRTKData.bind(rtkController);
export const getRTKDataById = rtkController.getRTKDataById.bind(rtkController);
export const createRTKData = rtkController.createRTKData.bind(rtkController);
export const updateRTKData = rtkController.updateRTKData.bind(rtkController);
export const deleteRTKData = rtkController.deleteRTKData.bind(rtkController);
export const getLatestRTKData = rtkController.getLatestRTKData.bind(rtkController);