/**
 * @fileoverview 使用者相關路由配置
 * 
 * 此文件定義了使用者相關的主要路由配置，包括：
 * - 使用者偏好設定路由整合
 * - 使用者活動追蹤路由整合
 * - 全域活動追蹤中間件配置
 * 
 * 作為使用者相關功能的路由聚合器，統一管理所有使用者相關的端點。
 * 自動為所有子路由應用活動追蹤中間件。
 * 
 * @module Routes/UserRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express';
import { userPreferenceRoutes } from './userPreferenceRoutes.js';
import { userActivityRoutes } from './userActivityRoutes.js';
import { ActivityTrackingMiddleware } from '../middlewares/ActivityTrackingMiddleware.js';

/**
 * 使用者路由類別
 * 
 * 負責配置和管理所有使用者相關的路由端點，作為路由聚合器
 */
class UserRoutes {
  private router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  /**
   * 初始化所有使用者路由
   */
  private initializeRoutes(): void {
    this.setupGlobalMiddleware();
    this.setupUserPreferenceRoutes();
    this.setupUserActivityRoutes();
  }

  /**
   * 設定全域中間件
   * 
   * 為所有使用者相關的路由自動應用活動追蹤中間件，
   * 確保所有使用者操作都會被記錄用於分析和審計。
   */
  private setupGlobalMiddleware(): void {
    this.router.use(ActivityTrackingMiddleware.trackActivity);
  }

  /**
   * 設定使用者偏好設定路由
   * 
   * 將使用者偏好設定相關的路由整合到 /api/user 路徑下。
   * 包含以下端點：
   * - GET /api/user/preferences - 取得使用者偏好設定
   * - PUT /api/user/preferences - 更新使用者偏好設定
   * - POST /api/user/preferences - 建立使用者偏好設定
   * 
   * @see userPreferenceRoutes
   */
  private setupUserPreferenceRoutes(): void {
    this.router.use('/api/user', userPreferenceRoutes);
  }

  /**
   * 設定使用者活動追蹤路由
   * 
   * 將使用者活動追蹤相關的路由整合到 /api/user 路徑下。
   * 包含以下端點：
   * - GET /api/user/activity - 取得使用者活動資料
   * - POST /api/user/activity/page-visit - 記錄頁面造訪
   * - POST /api/user/activity/session - 更新會話資訊
   * - GET /api/user/activity/stats - 取得活動統計資料
   * 
   * @see userActivityRoutes
   */
  private setupUserActivityRoutes(): void {
    this.router.use('/api/user', userActivityRoutes);
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
 * 匯出使用者路由實例
 */
export const userRoutes = new UserRoutes().getRouter();