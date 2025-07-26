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
    this.initializeRoutes();
  }

  /**
   * 初始化所有認證路由
   */
  private initializeRoutes(): void {
    this.setupLoginRoute();
    this.setupLogoutRoute();
  }

  /**
   * 設定使用者登入路由
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
   */
  private setupLoginRoute(): void {
    this.router.post('/api/auth/login', 
      ActivityTrackingMiddleware.trackLogin,
      this.authController.login
    );
  }

  /**
   * 設定使用者登出路由
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
   */
  private setupLogoutRoute(): void {
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