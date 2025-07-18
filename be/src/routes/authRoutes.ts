/**
 * @fileoverview 認證相關路由配置
 * 
 * 此文件定義了使用者認證相關的路由端點，包括：
 * - 使用者登入
 * - 使用者登出
 * - 活動追蹤整合
 * 
 * 這些路由處理使用者的身份驗證和會話管理，並集成了
 * 活動追蹤中間件來記錄使用者的登入登出行為。
 * 
 * @module Routes/AuthRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express'; // 引入 Express 路由器模組
import { AuthController } from '../controller/AuthController.js'; // 引入認證控制器
import { AuthMiddleware } from '../middleware/AuthMiddleware.js'; // 引入認證中間件
import { ActivityTrackingMiddleware } from '../middleware/ActivityTrackingMiddleware.js'; // 引入活動追蹤中間件

/**
 * 創建 Express 路由器實例
 * 用於定義認證相關的路由端點
 */
const router = Router();

/**
 * 創建認證控制器實例
 * 處理使用者登入、登出等認證相關的業務邏輯
 */
const authController = new AuthController();

/**
 * 創建認證中間件實例
 * 處理 JWT 認證驗證
 */
const authMiddleware = new AuthMiddleware();

/**
 * 使用者登入
 * 
 * 此端點用於使用者身份驗證，驗證使用者名稱和密碼後
 * 生成 JWT 認證令牌。同時記錄登入活動用於安全審計。
 * 
 * @route POST /api/auth/login
 * @group Auth - 認證相關端點
 * @param {Object} body - 登入資訊
 * @param {string} body.username - 使用者名稱
 * @param {string} body.password - 密碼
 * @returns {Object} 200 - 登入成功，返回 JWT 令牌
 * @returns {Object} 400 - 請求參數錯誤
 * @returns {Object} 401 - 帳號或密碼錯誤
 * @returns {Object} 500 - 伺服器錯誤
 * 
 * @example
 * POST /api/auth/login
 * Content-Type: application/json
 * 
 * {
 *   "username": "user123",
 *   "password": "password123"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": 1,
 *     "username": "user123",
 *     "roles": ["user"]
 *   }
 * }
 */
router.post('/api/auth/login', 
  ActivityTrackingMiddleware.trackLogin, // 追蹤登入活動
  authController.login // 執行使用者登入
);

/**
 * 使用者登出
 * 
 * 此端點用於使用者登出，撤銷 JWT 認證令牌並清除會話。
 * 需要有效的 JWT 認證令牌才能執行登出操作。
 * 同時記錄登出活動用於安全審計。
 * 
 * @route POST /api/auth/logout
 * @group Auth - 認證相關端點
 * @security JWT - 需要有效的 JWT 認證令牌
 * @returns {Object} 200 - 登出成功
 * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
 * @returns {Object} 500 - 伺服器錯誤
 * 
 * @example
 * POST /api/auth/logout
 * Authorization: Bearer <JWT_TOKEN>
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Logout successful"
 * }
 */
router.post('/api/auth/logout',
  authMiddleware.authenticate, // 驗證 JWT 認證令牌（需要登入才能登出）
  ActivityTrackingMiddleware.trackLogout, // 追蹤登出活動
  authController.logout // 執行使用者登出
);

/**
 * 匯出認證路由模組
 * 
 * 將配置好的路由器匯出，供主應用程式使用。
 * 此路由器包含所有認證相關的端點。
 */
export { router as authRoutes };