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

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  /**
   * 初始化所有初始化路由
   */
  private initializeRoutes(): void {
    // 健康檢查路由
    this.router.get('/api/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Server is running'
      });
    });
  }

  /**
   * 獲取配置好的路由器實例
   * @returns Express Router 實例
   */
  public getRouter(): Router {
    return this.router;
  }
}

// 創建並匯出路由實例
const initRoutesInstance = new InitRoutes();
export const initRoutes = initRoutesInstance.getRouter();