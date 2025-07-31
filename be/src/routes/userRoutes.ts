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
    
    // 直接在 constructor 中設定所有路由
    this.router.use(ActivityTrackingMiddleware.trackActivity);
    this.router.use('/api/user', userPreferenceRoutes);
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