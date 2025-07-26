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
import { ErrorHandleMiddleware } from '../middlewares/errorHandleMiddleware.js';

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
    this.initializeRoutes();
  }

  /**
   * 初始化所有進度追蹤路由
   */
  private initializeRoutes(): void {
    this.setupGetProgressRoute();
    this.setupGetProgressStreamRoute();
  }

  /**
   * 設定取得任務進度路由
   * 
   * 此端點用於查詢指定任務的當前執行進度，包括完成百分比、
   * 狀態訊息、執行步驟等詳細資訊。需要 JWT 認證才能訪問。
   * 
   * @route GET /api/progress/:taskId
   * @param {string} taskId - 任務唯一識別碼 (UUID 格式)
   * @group Progress - 進度追蹤相關端點
   * @security JWT - 需要有效的 JWT 認證令牌
   * @returns {Object} 200 - 任務進度資訊
   * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
   * @returns {Object} 404 - 任務不存在
   * @returns {Object} 500 - 伺服器錯誤
   */
  private setupGetProgressRoute(): void {
    this.router.get('/:taskId', 
      this.authMiddleware.authenticate,
      this.progressController.getProgress
    );
  }

  /**
   * 設定取得即時進度串流路由
   * 
   * 此端點使用 Server-Sent Events (SSE) 提供即時進度更新。
   * 客戶端可以持續監聽任務的進度變化，支援 'progress' 和 'completed' 事件。
   * 適用於長時間運行的任務，提供即時的進度反饋。
   * 
   * @route GET /api/progress/:taskId/stream
   * @param {string} taskId - 任務唯一識別碼 (UUID 格式)
   * @group Progress - 進度追蹤相關端點
   * @security JWT - 需要有效的 JWT 認證令牌
   * @returns {text/event-stream} 200 - SSE 即時進度串流
   * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
   * @returns {Object} 404 - 任務不存在
   * @returns {Object} 500 - 伺服器錯誤
   */
  private setupGetProgressStreamRoute(): void {
    this.router.get('/:taskId/stream', 
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