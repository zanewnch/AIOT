/**
 * @fileoverview 使用者相關路由配置
 * 
 * 此文件定義了使用者相關的主要路由配置，包括：
 * - 使用者偏好設定路由整合
 * 
 * 作為使用者相關功能的路由聚合器，統一管理所有使用者相關的端點。
 * 
 * @module Routes/UserRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express';
import { userPreferenceRoutes } from './userPreferenceRoutes.js';

/**
 * 使用者路由類別
 * 
 * 負責配置和管理所有使用者相關的路由端點，作為路由聚合器
 */
class UserRoutes {
  private router: Router;

  // 路由端點常數 - 集中管理所有 API 路徑
  private readonly ROUTES = {
    USER_BASE: '/api/user'
  } as const;

  constructor() {
    this.router = Router();
    
    this.setupUserRoutes();
  }

  /**
   * 設定使用者路由
   */
  private setupUserRoutes = (): void => {
    // 使用者偏好設定路由
    this.router.use(this.ROUTES.USER_BASE, userPreferenceRoutes);
    
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
 * 匯出使用者路由實例
 */
export const userRoutes = new UserRoutes().getRouter();