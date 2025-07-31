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

  constructor() {
    this.router = Router();
    this.userActivityController = new UserActivityController();
    this.authMiddleware = new AuthMiddleware();
    
    // 直接在 constructor 中設定所有路由
    this.router.get('/activity', 
      this.authMiddleware.authenticate,
      this.userActivityController.getUserActivity.bind(this.userActivityController)
    );

    this.router.post('/activity/page-visit', 
      this.authMiddleware.authenticate,
      this.userActivityController.recordPageVisit.bind(this.userActivityController)
    );

    this.router.post('/activity/session', 
      this.authMiddleware.authenticate,
      this.userActivityController.updateSessionInfo.bind(this.userActivityController)
    );

    this.router.get('/activity/stats', 
      this.authMiddleware.authenticate,
      this.userActivityController.getActivityStats.bind(this.userActivityController)
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
 * 匯出使用者活動追蹤路由實例
 */
export const userActivityRoutes = new UserActivityRoutes().getRouter();