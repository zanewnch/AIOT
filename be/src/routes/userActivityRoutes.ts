/**
 * @fileoverview 使用者活動追蹤路由配置
 * 
 * 此文件定義了使用者活動追蹤相關的路由端點，包括：
 * - 使用者活動資料查詢
 * - 頁面造訪記錄
 * - 會話資訊更新
 * - 活動統計資料取得
 * 
 * 這些路由用於追蹤和分析使用者在系統中的行為模式，
 * 支援使用者體驗分析和系統優化。所有端點都需要 JWT 認證。
 * 
 * @module Routes/UserActivityRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express'; // 引入 Express 路由器模組
import { UserActivityController } from '../controller/UserActivityController.js'; // 引入使用者活動控制器
import { AuthMiddleware } from '../middleware/AuthMiddleware.js'; // 引入認證中間件

/**
 * 創建 Express 路由器實例
 * 用於定義使用者活動追蹤相關的路由端點
 */
const router = Router();

/**
 * 創建使用者活動控制器實例
 * 處理使用者活動追蹤相關的業務邏輯
 */
const userActivityController = new UserActivityController();

/**
 * 創建認證中間件實例
 * 處理 JWT 認證驗證
 */
const authMiddleware = new AuthMiddleware();

/**
 * 取得使用者活動資料
 * 
 * 此端點用於獲取當前使用者的活動記錄，包括登入記錄、頁面造訪、
 * 操作記錄等詳細資訊。支援時間範圍過濾和分頁功能。
 * 
 * @route GET /api/user/activity
 * @group UserActivity - 使用者活動追蹤相關端點
 * @security JWT - 需要有效的 JWT 認證令牌
 * @returns {Object} 200 - 使用者活動資料列表
 * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
 * @returns {Object} 500 - 伺服器錯誤
 * 
 * @example
 * GET /api/user/activity
 * Authorization: Bearer <JWT_TOKEN>
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "activityType": "login",
 *       "timestamp": "2024-01-01T10:00:00Z",
 *       "ipAddress": "192.168.1.100",
 *       "userAgent": "Mozilla/5.0...",
 *       "details": {...}
 *     }
 *   ]
 * }
 */
router.get('/activity', 
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  userActivityController.getUserActivity.bind(userActivityController) // 執行獲取使用者活動資料
);

/**
 * 記錄頁面造訪
 * 
 * 此端點用於記錄使用者的頁面造訪行為，包括造訪的頁面 URL、
 * 停留時間和瀏覽器資訊。用於分析使用者行為模式。
 * 
 * @route POST /api/user/activity/page-visit
 * @group UserActivity - 使用者活動追蹤相關端點
 * @security JWT - 需要有效的 JWT 認證令牌
 * @param {Object} body - 頁面造訪資訊
 * @returns {Object} 201 - 頁面造訪記錄成功
 * @returns {Object} 400 - 請求參數錯誤
 * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
 * @returns {Object} 500 - 伺服器錯誤
 * 
 * @example
 * POST /api/user/activity/page-visit
 * Authorization: Bearer <JWT_TOKEN>
 * Content-Type: application/json
 * 
 * {
 *   "pageUrl": "/dashboard",
 *   "pageTitle": "Dashboard",
 *   "duration": 30000,
 *   "referrer": "/login"
 * }
 */
router.post('/activity/page-visit', 
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  userActivityController.recordPageVisit.bind(userActivityController) // 執行記錄頁面造訪
);

/**
 * 更新會話資訊
 * 
 * 此端點用於更新使用者的會話資訊，包括會話狀態、
 * 最後活動時間和設備資訊。用於維護使用者會話的準確性。
 * 
 * @route POST /api/user/activity/session
 * @group UserActivity - 使用者活動追蹤相關端點
 * @security JWT - 需要有效的 JWT 認證令牌
 * @param {Object} body - 會話資訊
 * @returns {Object} 200 - 會話資訊更新成功
 * @returns {Object} 400 - 請求參數錯誤
 * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
 * @returns {Object} 500 - 伺服器錯誤
 * 
 * @example
 * POST /api/user/activity/session
 * Authorization: Bearer <JWT_TOKEN>
 * Content-Type: application/json
 * 
 * {
 *   "sessionId": "sess_12345",
 *   "lastActivity": "2024-01-01T10:30:00Z",
 *   "deviceInfo": {
 *     "browser": "Chrome",
 *     "os": "Windows",
 *     "device": "Desktop"
 *   }
 * }
 */
router.post('/activity/session', 
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  userActivityController.updateSessionInfo.bind(userActivityController) // 執行更新會話資訊
);

/**
 * 取得活動統計資料
 * 
 * 此端點用於獲取使用者活動的統計資料，包括登入次數、
 * 頁面造訪統計、使用時間分析等。用於生成使用者行為報告。
 * 
 * @route GET /api/user/activity/stats
 * @group UserActivity - 使用者活動追蹤相關端點
 * @security JWT - 需要有效的 JWT 認證令牌
 * @returns {Object} 200 - 活動統計資料
 * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
 * @returns {Object} 500 - 伺服器錯誤
 * 
 * @example
 * GET /api/user/activity/stats
 * Authorization: Bearer <JWT_TOKEN>
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "totalLogins": 45,
 *     "totalPageViews": 234,
 *     "averageSessionDuration": 1800,
 *     "mostVisitedPages": [
 *       { "page": "/dashboard", "visits": 89 },
 *       { "page": "/profile", "visits": 56 }
 *     ],
 *     "activityTrends": {...}
 *   }
 * }
 */
router.get('/activity/stats', 
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  userActivityController.getActivityStats.bind(userActivityController) // 執行獲取活動統計資料
);

/**
 * 匯出使用者活動追蹤路由模組
 * 
 * 將配置好的路由器匯出，供主應用程式使用。
 * 此路由器包含所有使用者活動追蹤相關的端點。
 */
export { router as userActivityRoutes };