/**
 * @fileoverview 無人機指令佇列路由配置
 *
 * 此文件定義了無人機指令佇列相關的路由端點，包括：
 * - 佇列管理（CRUD 操作）
 * - 佇列執行控制（開始、暫停、重置）
 * - 指令管理（添加指令到佇列）
 * - 佇列統計和監控
 *
 * 提供完整的無人機指令佇列系統管理功能，包含批次指令規劃和執行控制。
 * 所有端點都需要 JWT 認證。
 *
 * @module Routes/DroneCommandQueueRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express';
import { DroneCommandQueueController } from '../../controllers/drone/DroneCommandQueueController.js';
import { AuthMiddleware } from '../../middlewares/AuthMiddleware.js';

/**
 * 無人機指令佇列路由類別
 *
 * 負責配置和管理所有無人機指令佇列相關的路由端點
 */
class DroneCommandQueueRoutes {
  private router: Router;
  private queueController: DroneCommandQueueController;
  private authMiddleware: AuthMiddleware;

  // 路由端點常數 - 集中管理所有 API 路徑
  private readonly ROUTES = {
    // 基本 CRUD
    QUEUES: '/api/drone-command-queues/data',
    QUEUE_BY_ID: '/api/drone-command-queues/data/:id',
    
    // 佇列控制
    START_QUEUE: '/api/drone-command-queues/:id/start',
    PAUSE_QUEUE: '/api/drone-command-queues/:id/pause',
    RESET_QUEUE: '/api/drone-command-queues/:id/reset',
    
    // 指令管理
    ADD_COMMAND: '/api/drone-command-queues/:id/commands',
    
    // 統計
    STATISTICS: '/api/drone-command-queues/statistics'
  } as const;

  constructor() {
    this.router = Router();
    this.queueController = new DroneCommandQueueController();
    this.authMiddleware = new AuthMiddleware();
    
    this.setupCrudRoutes();
    this.setupControlRoutes();
    this.setupCommandRoutes();
    this.setupStatisticsRoutes();
  }

  /**
   * 設定基本 CRUD 路由
   */
  private setupCrudRoutes = (): void => {
    // GET /api/drone-command-queues/data - 獲取所有指令佇列
    this.router.get(this.ROUTES.QUEUES,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queueController.getAllQueues(req, res, next)
    );

    // GET /api/drone-command-queues/data/:id - 根據 ID 獲取指令佇列
    this.router.get(this.ROUTES.QUEUE_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queueController.getQueueById(req, res, next)
    );

    // POST /api/drone-command-queues/data - 創建指令佇列
    this.router.post(this.ROUTES.QUEUES,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queueController.createQueue(req, res, next)
    );

    // PUT /api/drone-command-queues/data/:id - 更新指令佇列
    this.router.put(this.ROUTES.QUEUE_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queueController.updateQueue(req, res, next)
    );

    // DELETE /api/drone-command-queues/data/:id - 刪除指令佇列
    this.router.delete(this.ROUTES.QUEUE_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queueController.deleteQueue(req, res, next)
    );
  };

  /**
   * 設定佇列控制路由
   */
  private setupControlRoutes = (): void => {
    // POST /api/drone-command-queues/:id/start - 開始執行佇列
    this.router.post(this.ROUTES.START_QUEUE,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queueController.startQueue(req, res, next)
    );

    // POST /api/drone-command-queues/:id/pause - 暫停佇列執行
    this.router.post(this.ROUTES.PAUSE_QUEUE,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queueController.pauseQueue(req, res, next)
    );

    // POST /api/drone-command-queues/:id/reset - 重置佇列
    this.router.post(this.ROUTES.RESET_QUEUE,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queueController.resetQueue(req, res, next)
    );
  };

  /**
   * 設定指令管理路由
   */
  private setupCommandRoutes = (): void => {
    // POST /api/drone-command-queues/:id/commands - 向佇列添加指令
    this.router.post(this.ROUTES.ADD_COMMAND,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queueController.addCommandToQueue(req, res, next)
    );
  };

  /**
   * 設定統計路由
   */
  private setupStatisticsRoutes = (): void => {
    // GET /api/drone-command-queues/statistics - 獲取佇列統計
    this.router.get(this.ROUTES.STATISTICS,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queueController.getQueueStatistics(req, res, next)
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
 * 匯出無人機指令佇列路由實例
 */
export const droneCommandQueueRoutes = new DroneCommandQueueRoutes().getRouter();