import { Router } from 'express';
import { RTKController } from '../controller/RTKController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { ErrorHandleMiddleware } from '../middleware/errorHandleMiddleware.js';

/**
 * RTK 定位資料相關路由配置
 * 
 * 處理 RTK（Real-Time Kinematic）定位資料的 API 路由設定。
 * 包含資料查詢和更新功能，並套用 JWT 驗證中間件。
 * 
 * @module Routes
 */

const router = Router();
const rtkController = new RTKController();
const jwtAuth = new AuthMiddleware();

/**
 * GET /api/rtk/data
 * -------------------------------------------------
 * 取得所有 RTK 定位資料
 * 
 * 中間件：
 * - JWT 驗證：需要有效的 JWT token
 * 
 * @example
 * ```bash
 * GET /api/rtk/data
 * Authorization: Bearer <jwt-token>
 * ```
 * 
 * @example 回應格式
 * ```json
 * [
 *   {
 *     "id": 1,
 *     "latitude": 25.0330,
 *     "longitude": 121.5654,
 *     "altitude": 45.0,
 *     "timestamp": "2024-01-01 12:00:00"
 *   }
 * ]
 * ```
 */
router.get('/api/rtk/data', 
  jwtAuth.authenticate,
  rtkController.getRTKData
);

/**
 * PUT /api/rtk/data/:id
 * -------------------------------------------------
 * 更新指定 RTK 定位資料
 * 
 * 中間件：
 * - JWT 驗證：需要有效的 JWT token
 * 
 * @example
 * ```bash
 * PUT /api/rtk/data/123
 * Authorization: Bearer <jwt-token>
 * Content-Type: application/json
 * 
 * {
 *   "latitude": 25.0330,
 *   "longitude": 121.5654,
 *   "altitude": 45.0,
 *   "timestamp": "2024-01-01 12:00:00"
 * }
 * ```
 * 
 * @example 成功回應
 * ```json
 * {
 *   "success": true,
 *   "message": "RTK data updated successfully",
 *   "data": {
 *     "id": 123,
 *     "latitude": 25.0330,
 *     "longitude": 121.5654,
 *     "altitude": 45.0,
 *     "timestamp": "2024-01-01 12:00:00"
 *   }
 * }
 * ```
 */
router.put('/api/rtk/data/:id', 
  jwtAuth.authenticate,
  rtkController.updateRTKData
);

export { router as rtkRoutes };