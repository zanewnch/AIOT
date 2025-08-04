/**
 * @fileoverview 進度追蹤路由配置
 *
 * 此文件定義了進度追蹤相關的路由端點，包括：
 * - 任務進度查詢
 * - 即時進度串流 (Server-Sent Events)
 * - 進度狀態監控
 *
 * 這些路由提供完整的任務進度追蹤功能，支援即時更新和
 * 長時間運行任務的進度監控。所有端點都需要 JWT 認證。
 *
 * @module Routes/ProgressRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express';
import { ProgressController } from '../controllers/ProgressController.js';
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js';
import { ErrorHandleMiddleware } from '../middlewares/ErrorHandleMiddleware.js';

/**
 * 進度追蹤路由類別
 *
 * 負責配置和管理所有進度追蹤相關的路由端點
 */
class ProgressRoutes {
  private router: Router;
  private progressController: ProgressController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.progressController = new ProgressController();
    this.authMiddleware = new AuthMiddleware();
    
    // 直接在 constructor 中設定所有路由
    this.router.get('/api/progress/:taskId',
      this.authMiddleware.authenticate,
      this.progressController.getProgress
    );

    this.router.get('/api/progress/:taskId/stream',
      this.authMiddleware.authenticate,
      this.progressController.getProgressStream
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
 * 匯出進度追蹤路由實例
 */
export const progressRoutes = new ProgressRoutes().getRouter();