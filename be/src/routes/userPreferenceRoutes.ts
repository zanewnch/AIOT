/**
 * @fileoverview 使用者偏好設定路由配置
 * 
 * 此文件定義了使用者偏好設定相關的路由端點，包括：
 * - 取得使用者偏好設定
 * - 更新使用者偏好設定
 * - 建立使用者偏好設定
 * 
 * 這些路由處理使用者的個人化設定，包括介面主題、語言、時區、
 * 自動儲存、通知偏好等設定選項。所有端點都需要 JWT 認證。
 * 
 * @module Routes/UserPreferenceRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express'; // 引入 Express 路由器模組
import { UserPreferenceController } from '../controllers/UserPreferenceController.js'; // 引入使用者偏好設定控制器
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js'; // 引入認證中間件

/**
 * 創建 Express 路由器實例
 * 用於定義使用者偏好設定相關的路由端點
 */
const router = Router();

/**
 * 創建使用者偏好設定控制器實例
 * 處理使用者偏好設定相關的業務邏輯
 */
const userPreferenceController = new UserPreferenceController();

/**
 * 創建認證中間件實例
 * 處理 JWT 認證相關功能
 */
const authMiddleware = new AuthMiddleware();

/**
 * 取得使用者偏好設定
 * 
 * 此端點用於獲取當前使用者的偏好設定，包括介面主題、語言、
 * 時區、自動儲存、通知偏好等個人化設定。
 * 
 * @route GET /api/user/preferences
 * @group UserPreference - 使用者偏好設定相關端點
 * @security JWT - 需要有效的 JWT 認證令牌
 * @returns {Object} 200 - 使用者偏好設定
 * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
 * @returns {Object} 404 - 使用者偏好設定不存在
 * @returns {Object} 500 - 伺服器錯誤
 * 
 * @example
 * GET /api/user/preferences
 * Authorization: Bearer <JWT_TOKEN>
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "theme": "dark",
 *     "language": "zh-TW",
 *     "timezone": "Asia/Taipei",
 *     "autoSave": true,
 *     "notifications": {
 *       "email": true,
 *       "push": false,
 *       "sms": false
 *     },
 *     "dateFormat": "YYYY-MM-DD",
 *     "pageSize": 20
 *   }
 * }
 */
router.get('/preferences', 
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  userPreferenceController.getUserPreferences.bind(userPreferenceController) // 執行獲取使用者偏好設定
);

/**
 * 更新使用者偏好設定
 * 
 * 此端點用於更新使用者的偏好設定，支援部分更新。
 * 只需要提供要更新的設定項目，未提供的項目將保持原有設定。
 * 
 * @route PUT /api/user/preferences
 * @group UserPreference - 使用者偏好設定相關端點
 * @security JWT - 需要有效的 JWT 認證令牌
 * @param {Object} body - 要更新的偏好設定
 * @returns {Object} 200 - 偏好設定更新成功
 * @returns {Object} 400 - 請求參數錯誤
 * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
 * @returns {Object} 404 - 使用者偏好設定不存在
 * @returns {Object} 500 - 伺服器錯誤
 * 
 * @example
 * PUT /api/user/preferences
 * Authorization: Bearer <JWT_TOKEN>
 * Content-Type: application/json
 * 
 * {
 *   "theme": "light",
 *   "language": "en-US",
 *   "notifications": {
 *     "email": false,
 *     "push": true
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "User preferences updated successfully",
 *   "data": {
 *     "theme": "light",
 *     "language": "en-US",
 *     "timezone": "Asia/Taipei",
 *     "autoSave": true,
 *     "notifications": {
 *       "email": false,
 *       "push": true,
 *       "sms": false
 *     }
 *   }
 * }
 */
router.put('/preferences', 
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  userPreferenceController.updateUserPreferences.bind(userPreferenceController) // 執行更新使用者偏好設定
);

/**
 * 建立使用者偏好設定
 * 
 * 此端點用於為新使用者建立初始偏好設定。
 * 通常在使用者首次登入或註冊時調用，設定預設值。
 * 
 * @route POST /api/user/preferences
 * @group UserPreference - 使用者偏好設定相關端點
 * @security JWT - 需要有效的 JWT 認證令牌
 * @param {Object} body - 初始偏好設定
 * @returns {Object} 201 - 偏好設定建立成功
 * @returns {Object} 400 - 請求參數錯誤
 * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
 * @returns {Object} 409 - 使用者偏好設定已存在
 * @returns {Object} 500 - 伺服器錯誤
 * 
 * @example
 * POST /api/user/preferences
 * Authorization: Bearer <JWT_TOKEN>
 * Content-Type: application/json
 * 
 * {
 *   "theme": "dark",
 *   "language": "zh-TW",
 *   "timezone": "Asia/Taipei",
 *   "autoSave": true,
 *   "notifications": {
 *     "email": true,
 *     "push": false,
 *     "sms": false
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "User preferences created successfully",
 *   "data": {
 *     "id": 1,
 *     "userId": 123,
 *     "theme": "dark",
 *     "language": "zh-TW",
 *     "timezone": "Asia/Taipei",
 *     "autoSave": true,
 *     "notifications": {
 *       "email": true,
 *       "push": false,
 *       "sms": false
 *     },
 *     "createdAt": "2024-01-01T10:00:00Z"
 *   }
 * }
 */
router.post('/preferences', 
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  userPreferenceController.createUserPreferences.bind(userPreferenceController) // 執行建立使用者偏好設定
);

/**
 * 匯出使用者偏好設定路由模組
 * 
 * 將配置好的路由器匯出，供主應用程式使用。
 * 此路由器包含所有使用者偏好設定相關的端點。
 */
export { router as userPreferenceRoutes };