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
    this.initializeRoutes();
  }

  /**
   * 初始化所有使用者活動追蹤路由
   */
  private initializeRoutes(): void {
    this.setupGetUserActivityRoute();
    this.setupRecordPageVisitRoute();
    this.setupUpdateSessionInfoRoute();
    this.setupGetActivityStatsRoute();
  }

  /**
   * 設定取得使用者活動資料路由
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
   */
  private setupGetUserActivityRoute(): void {
    this.router.get('/activity', 
      this.authMiddleware.authenticate,
      this.userActivityController.getUserActivity.bind(this.userActivityController)
    );
  }

  /**
   * 設定記錄頁面造訪路由
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
   */
  private setupRecordPageVisitRoute(): void {
    this.router.post('/activity/page-visit', 
      this.authMiddleware.authenticate,
      this.userActivityController.recordPageVisit.bind(this.userActivityController)
    );
  }

  /**
   * 設定更新會話資訊路由
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
   */
  private setupUpdateSessionInfoRoute(): void {
    this.router.post('/activity/session', 
      this.authMiddleware.authenticate,
      this.userActivityController.updateSessionInfo.bind(this.userActivityController)
    );
  }

  /**
   * 設定取得活動統計資料路由
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
   */
  private setupGetActivityStatsRoute(): void {
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