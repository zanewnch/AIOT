import { Router } from 'express';
import { AuthController } from '../controller/AuthController.js';
import { ErrorHandleMiddleware } from '../middleware/errorHandleMiddleware.js';

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

/**
 * 使用者登入路由
 * POST /api/auth/login
 * 
 * 中間件：
 * - ErrorHandleMiddleware.handle: 統一錯誤處理
 */
router.post('/api/auth/login', 
  authController.login
);

/**
 * 使用者登出路由  
 * POST /api/auth/logout
 * 
 * 中間件：
 * - ErrorHandleMiddleware.handle: 統一錯誤處理
 */
router.post('/api/auth/logout',
  authController.logout
);

export { router as authRoutes };