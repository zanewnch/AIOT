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
import { AuthQueries } from '../controllers/queries/AuthQueriesCtrl.js';
import { AuthCommands } from '../controllers/commands/AuthCommandsCtrl.js';
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js';

/**
 * 認證路由類別
 * 
 * 負責配置和管理所有認證相關的路由端點
 */
class AuthRoutes {
  private router: Router;
  private authQueries: AuthQueries;
  private authCommands: AuthCommands;
  private authMiddleware: AuthMiddleware;

  // 路由端點常數 - 集中管理所有 API 路徑
  private readonly ROUTES = {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me'
  } as const;

  constructor() {
    this.router = Router();
    this.authQueries = new AuthQueries();
    this.authCommands = new AuthCommands();
    this.authMiddleware = new AuthMiddleware();
    
    this.setupAuthRoutes();
  }

  /**
   * 設定認證路由
   */
  private setupAuthRoutes = (): void => {
    // POST /api/auth/login - 使用者登入 (Command)
    this.router.post(this.ROUTES.LOGIN, 
      (req, res, next) => this.authCommands.login(req, res, next)
    );
    
    // POST /api/auth/logout - 使用者登出 (Command)
    this.router.post(this.ROUTES.LOGOUT,
      this.authMiddleware.authenticate,
      (req, res, next) => this.authCommands.logout(req, res, next)
    );

    // GET /api/auth/me - 獲取當前使用者資訊 (Query)
    this.router.get(this.ROUTES.ME,
      this.authMiddleware.authenticate,
      (req, res, next) => this.authQueries.me(req, res, next)
    );
  };

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