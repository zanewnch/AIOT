/**
 * @fileoverview RTK 定位資料路由配置
 * 
 * 此文件定義了 RTK (Real-Time Kinematic) 定位資料相關的路由端點，包括：
 * - RTK 定位資料查詢
 * - RTK 定位資料更新
 * - 支援即時定位資料處理
 * 
 * RTK 是一種高精度的 GPS 定位技術，能提供公分級的定位精度。
 * 所有端點都需要 JWT 認證。
 * 
 * @module Routes/RtkRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express'; // 引入 Express 路由器模組
import { RTKController } from '../controllers/RTKController.js'; // 引入 RTK 控制器
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js'; // 引入認證中間件
import { ErrorHandleMiddleware } from '../middlewares/errorHandleMiddleware.js'; // 引入錯誤處理中間件

/**
 * 創建 Express 路由器實例
 * 用於定義 RTK 定位資料相關的路由端點
 */
const router = Router();

/**
 * 創建 RTK 控制器實例
 * 處理 RTK 定位資料相關的業務邏輯
 */
const rtkController = new RTKController();

/**
 * 創建 JWT 認證中間件實例
 * 用於驗證使用者的認證令牌
 */
const jwtAuth = new AuthMiddleware();

/**
 * 取得所有 RTK 定位資料
 * 
 * 此端點用於獲取系統中所有的 RTK 定位資料，包括經緯度、高度和時間戳記。
 * 支援分頁和過濾功能，適用於地理資訊系統和定位追蹤應用。
 * 需要 JWT 認證。
 * 
 * @route GET /api/rtk/data
 * @group RTK - RTK 定位資料相關端點
 * @security JWT - 需要有效的 JWT 認證令牌
 * @returns {Array<Object>} 200 - RTK 定位資料列表
 * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
 * @returns {Object} 500 - 伺服器錯誤
 * 
 * @example
 * GET /api/rtk/data
 * Authorization: Bearer <jwt-token>
 * 
 * Response:
 * [
 *   {
 *     "id": 1,
 *     "latitude": 25.0330,
 *     "longitude": 121.5654,
 *     "altitude": 45.0,
 *     "timestamp": "2024-01-01 12:00:00",
 *     "accuracy": 0.02,
 *     "satelliteCount": 12
 *   }
 * ]
 */
router.get('/api/rtk/data', 
  jwtAuth.authenticate, // 驗證 JWT 認證令牌
  rtkController.getRTKData // 執行獲取 RTK 定位資料
);

/**
 * 更新指定 RTK 定位資料
 * 
 * 此端點用於更新指定 ID 的 RTK 定位資料，包括經緯度、高度和時間戳記。
 * 適用於定位資料的修正和校準操作。需要 JWT 認證。
 * 
 * @route PUT /api/rtk/data/:id
 * @param {string} id - RTK 資料唯一識別碼
 * @group RTK - RTK 定位資料相關端點
 * @security JWT - 需要有效的 JWT 認證令牌
 * @param {Object} body - 更新的 RTK 定位資料
 * @returns {Object} 200 - RTK 資料更新成功
 * @returns {Object} 400 - 請求參數錯誤
 * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
 * @returns {Object} 404 - RTK 資料不存在
 * @returns {Object} 500 - 伺服器錯誤
 * 
 * @example
 * PUT /api/rtk/data/123
 * Authorization: Bearer <jwt-token>
 * Content-Type: application/json
 * 
 * {
 *   "latitude": 25.0330,
 *   "longitude": 121.5654,
 *   "altitude": 45.0,
 *   "timestamp": "2024-01-01 12:00:00",
 *   "accuracy": 0.02,
 *   "satelliteCount": 12
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "RTK data updated successfully",
 *   "data": {
 *     "id": 123,
 *     "latitude": 25.0330,
 *     "longitude": 121.5654,
 *     "altitude": 45.0,
 *     "timestamp": "2024-01-01 12:00:00",
 *     "accuracy": 0.02,
 *     "satelliteCount": 12
 *   }
 * }
 */
router.put('/api/rtk/data/:id', 
  jwtAuth.authenticate, // 驗證 JWT 認證令牌
  rtkController.updateRTKData // 執行更新 RTK 定位資料
);

/**
 * 匯出 RTK 路由模組
 * 
 * 將配置好的路由器匯出，供主應用程式使用。
 * 此路由器包含所有 RTK 定位資料相關的端點。
 */
export { router as rtkRoutes };