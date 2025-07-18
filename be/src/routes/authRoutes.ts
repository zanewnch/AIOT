import { Router } from 'express';
import { AuthController } from '../controller/AuthController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { ActivityTrackingMiddleware } from '../middleware/ActivityTrackingMiddleware.js';

/**
 * 認證相關路由配置
 * 
 * 處理使用者登入、登出等認證功能的路由設定，
 * 包含錯誤處理中間件的套用。
 * 
 * @module Routes
 */

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

/**
 * 使用者登入路由
 * POST /api/auth/login
 * 
 * 中間件：
 * - ActivityTrackingMiddleware.trackLogin: 追蹤登入活動
 */
router.post('/api/auth/login', 
  ActivityTrackingMiddleware.trackLogin,
  authController.login
);

/**
 * 使用者登出路由  
 * POST /api/auth/logout
 * 
 * 中間件：
 * - jwtAuth.authenticate: JWT 驗證（需要登入才能登出）
 * - ActivityTrackingMiddleware.trackLogout: 追蹤登出活動
 */
router.post('/api/auth/logout',
  authMiddleware.authenticate,
  ActivityTrackingMiddleware.trackLogout,
  authController.logout
);

export { router as authRoutes };