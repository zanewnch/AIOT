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

  // 路由端點常數 - 集中管理所有 API 路徑
  private readonly ROUTES = {
    PROGRESS: '/api/progress/:taskId',
    PROGRESS_STREAM: '/api/progress/:taskId/stream'
  } as const;

  constructor() {
    this.router = Router();
    this.progressController = new ProgressController();
    this.authMiddleware = new AuthMiddleware();
    
    this.setupProgressRoutes();
  }

  /**
   * 設定進度追蹤路由
   */
  private setupProgressRoutes = (): void => {
    // GET /api/progress/:taskId - 獲取任務進度
    this.router.get(this.ROUTES.PROGRESS,
      this.authMiddleware.authenticate,
      (req, res) => this.progressController.getProgress(req, res)
    );

    // GET /api/progress/:taskId/stream - 獲取進度串流 (Server-Sent Events)
    this.router.get(this.ROUTES.PROGRESS_STREAM,
      this.authMiddleware.authenticate,
      (req, res) => this.progressController.getProgressStream(req, res)
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
 * 匯出進度追蹤路由實例
 */
export const progressRoutes = new ProgressRoutes().getRouter();