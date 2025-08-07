/**
 * @fileoverview 系統初始化路由配置
 *
 * 此文件定義了系統初始化相關的路由端點，包括健康檢查等基本功能。
 *
 * @module Routes/InitRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express';

/**
 * 初始化路由類別
 * 負責配置和管理所有系統初始化相關的路由端點
 */
class InitRoutes {
  private router: Router;

  // 路由端點常數 - 集中管理所有 API 路徑
  private readonly ROUTES = {
    HEALTH: '/api/health'
  } as const;

  constructor() {
    this.router = Router();
    this.setupHealthRoutes();
  }

  /**
   * 設定健康檢查路由
   */
  private setupHealthRoutes = (): void => {
    // GET /api/health - 系統健康檢查
    this.router.get(this.ROUTES.HEALTH, (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Server is running'
      });
    });
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
 * 匯出系統初始化路由實例
 */
export const initRoutes = new InitRoutes().getRouter();