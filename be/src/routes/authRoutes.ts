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

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js';
import { ActivityTrackingMiddleware } from '../middlewares/ActivityTrackingMiddleware.js';

/**
 * 認證路由類別
 * 
 * 負責配置和管理所有認證相關的路由端點
 */
class AuthRoutes {
  private router: Router;
  private authController: AuthController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.authMiddleware = new AuthMiddleware();
    
    // 直接在 constructor 中設定所有路由
    this.router.post('/api/auth/login', 
      ActivityTrackingMiddleware.trackLogin,
      this.authController.login
    );
    
    this.router.post('/api/auth/logout',
      this.authMiddleware.authenticate,
      ActivityTrackingMiddleware.trackLogout,
      this.authController.logout
    );
  }

  /**
   * 取得路由器實例
   * 
   * @returns {Router} Express 路由器實例
   */
  public getRouter(): Router {
    return this.router;
  }
}

/**
 * 匯出認證路由實例
 */
export const authRoutes = new AuthRoutes().getRouter();