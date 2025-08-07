/**
 * @fileoverview 首頁路由模組
 * 處理應用程式首頁的路由請求
 */

import express, { Request, Response, Router } from 'express';

/**
 * 首頁路由類別
 *
 * 負責配置和管理首頁相關的路由端點
 */
class HomeRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  /**
   * 初始化所有首頁路由
   */
  private initializeRoutes(): void {
    this.setupHomeRoute();
    this.setupStructureDocsRoute();
  }

  /**
   * 設定首頁路由
   *
   * GET / - 渲染首頁模板
   */
  private setupHomeRoute(): void {
    this.router.get('/', (_req: Request, res: Response) => {
      res.render('index');
    });
  }

  /**
   * 設定專案結構文檔路由
   *
   * GET /api/docs/structure_docs - 渲染專案結構文檔模板
   */
  private setupStructureDocsRoute(): void {
    this.router.get('/api/docs/structure_docs', (_req: Request, res: Response) => {
      res.render('structure_docs');
    });
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

export const homeRoutes = new HomeRoutes().getRouter();