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

import { Router } from 'express';
import { UserActivityController } from '../controllers/UserActivityController.js';
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js';

/**
 * 使用者活動追蹤路由類別
 * 
 * 負責配置和管理所有使用者活動追蹤相關的路由端點
 */
class UserActivityRoutes {
  private router: Router;
  private userActivityController: UserActivityController;
  private authMiddleware: AuthMiddleware;

  // 路由端點常數 - 集中管理所有 API 路徑
  private readonly ROUTES = {
    ACTIVITY: '/activity',
    PAGE_VISIT: '/activity/page-visit',
    SESSION: '/activity/session',
    STATS: '/activity/stats'
  } as const;

  constructor() {
    this.router = Router();
    this.userActivityController = new UserActivityController();
    this.authMiddleware = new AuthMiddleware();
    
    this.setupActivityRoutes();
  }

  /**
   * 設定活動追蹤路由
   */
  private setupActivityRoutes = (): void => {
    // GET /activity - 取得使用者活動資料
    this.router.get(this.ROUTES.ACTIVITY,
      this.authMiddleware.authenticate,
      (req, res) => this.userActivityController.getUserActivity(req, res)
    );

    // POST /activity/page-visit - 記錄頁面造訪
    this.router.post(this.ROUTES.PAGE_VISIT,
      this.authMiddleware.authenticate,
      (req, res) => this.userActivityController.recordPageVisit(req, res)
    );

    // POST /activity/session - 更新會話資訊
    this.router.post(this.ROUTES.SESSION,
      this.authMiddleware.authenticate,
      (req, res) => this.userActivityController.updateSessionInfo(req, res)
    );

    // GET /activity/stats - 取得活動統計資料
    this.router.get(this.ROUTES.STATS,
      this.authMiddleware.authenticate,
      (req, res) => this.userActivityController.getActivityStats(req, res)
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
 * 匯出使用者活動追蹤路由實例
 */
export const userActivityRoutes = new UserActivityRoutes().getRouter();