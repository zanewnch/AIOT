/**
 * @fileoverview 無人機狀態歷史資料路由配置
 *
 * 此文件定義了無人機狀態變更歷史相關的路由端點，包括：
 * - 狀態歷史資料查詢
 * - 狀態變更記錄
 * - 統計分析和趨勢分析
 *
 * @module Routes/DroneStatusArchiveRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express';
import { DroneStatusArchiveQueries } from '../../controllers/queries/DroneStatusArchiveQueriesCtrl.js';
import { DroneStatusArchiveCommands } from '../../controllers/commands/DroneStatusArchiveCommandsCtrl.js';
import { AuthMiddleware } from '../../middlewares/AuthMiddleware.js';

/**
 * 無人機狀態歷史路由類別
 *
 * 負責配置和管理所有無人機狀態變更歷史相關的路由端點
 * 使用 CQRS 模式分離查詢和命令操作
 */
class DroneStatusArchiveRoutes {
  private router: Router;
  private queryController: DroneStatusArchiveQueries;
  private commandController: DroneStatusArchiveCommands;
  private authMiddleware: AuthMiddleware;

  // 路由端點常數 - 集中管理所有 API 路徑
  private readonly ROUTES = {
    // 基本 CRUD
    DATA: '/api/drone-status-archive/data',
    DATA_BY_ID: '/api/drone-status-archive/data/:id',

    // 查詢功能
    BY_DRONE_ID: '/api/drone-status-archive/data/drone/:droneId',
    BY_STATUS: '/api/drone-status-archive/data/status/:status',
    BY_CREATED_BY: '/api/drone-status-archive/data/created-by/:userId',
    BY_DATE_RANGE: '/api/drone-status-archive/data/date-range',
    BY_REASON: '/api/drone-status-archive/data/reason/:reason',
    LATEST: '/api/drone-status-archive/data/latest',
    LATEST_BY_DRONE: '/api/drone-status-archive/data/drone/:droneId/latest',
    BY_TRANSITION: '/api/drone-status-archive/data/transition',

    // 統計功能
    STATISTICS: '/api/drone-status-archive/statistics',

    // TODO: 待 controller 實作的功能
    // ALL: '/api/drone-status-archive/all',
    // PAGINATION: '/api/drone-status-archive/pagination'
  } as const;

  constructor() {
    this.router = Router();
    this.queryController = new DroneStatusArchiveQueries();
    this.commandController = new DroneStatusArchiveCommands();
    this.authMiddleware = new AuthMiddleware();

    this.setupCrudRoutes();
    this.setupQueryRoutes();
    this.setupStatisticsRoutes();
  }

  /**
   * 設定基本 CRUD 路由
   */
  private setupCrudRoutes = (): void => {
    // GET /api/drone-status-archive/data - 獲取所有狀態歷史歸檔 (查詢操作)
    this.router.get(this.ROUTES.DATA,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getAllStatusArchives(req, res, next)
    );

    // GET /api/drone-status-archive/data/:id - 根據 ID 獲取狀態歷史歸檔 (查詢操作)
    this.router.get(this.ROUTES.DATA_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getStatusArchiveById(req, res, next)
    );

    // POST /api/drone-status-archive/data - 創建狀態歷史歸檔 (命令操作)
    this.router.post(this.ROUTES.DATA,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.createStatusArchive(req, res, next)
    );

    // PUT /api/drone-status-archive/data/:id - 更新狀態歷史歸檔 (命令操作)
    this.router.put(this.ROUTES.DATA_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.updateStatusArchive(req, res, next)
    );

    // DELETE /api/drone-status-archive/data/:id - 刪除狀態歷史歸檔 (命令操作)
    this.router.delete(this.ROUTES.DATA_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.deleteStatusArchive(req, res, next)
    );
  };

  /**
   * 設定查詢路由
   */
  private setupQueryRoutes = (): void => {
    // GET /api/drone-status-archive/data/drone/:droneId - 根據無人機 ID 獲取狀態歷史
    this.router.get(this.ROUTES.BY_DRONE_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getStatusArchivesByDroneId(req, res, next)
    );

    // GET /api/drone-status-archive/data/status/:status - 根據狀態獲取歷史記錄
    this.router.get(this.ROUTES.BY_STATUS,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getStatusArchivesByStatus(req, res, next)
    );

    // GET /api/drone-status-archive/data/created-by/:userId - 根據創建者獲取歷史記錄
    this.router.get(this.ROUTES.BY_CREATED_BY,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getStatusArchivesByCreatedBy(req, res, next)
    );

    // GET /api/drone-status-archive/data/date-range - 根據時間範圍獲取歷史記錄
    this.router.get(this.ROUTES.BY_DATE_RANGE,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getStatusArchivesByDateRange(req, res, next)
    );

    // GET /api/drone-status-archive/data/reason/:reason - 根據變更原因獲取歷史記錄
    this.router.get(this.ROUTES.BY_REASON,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getStatusArchivesByReason(req, res, next)
    );

    // GET /api/drone-status-archive/data/latest - 獲取最新狀態歷史記錄
    this.router.get(this.ROUTES.LATEST,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getLatestStatusArchives(req, res, next)
    );

    // GET /api/drone-status-archive/data/drone/:droneId/latest - 獲取特定無人機的最新狀態歷史
    this.router.get(this.ROUTES.LATEST_BY_DRONE,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getLatestStatusArchiveByDroneId(req, res, next)
    );

    // GET /api/drone-status-archive/data/transition - 獲取狀態轉換歷史記錄
    this.router.get(this.ROUTES.BY_TRANSITION,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getStatusArchivesByTransition(req, res, next)
    );
  };

  /**
   * 設定統計路由
   */
  private setupStatisticsRoutes = (): void => {
    // GET /api/drone-status-archive/statistics - 獲取狀態變更統計資料
    this.router.get(this.ROUTES.STATISTICS,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getStatusChangeStatistics(req, res, next)
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
 * 匯出無人機狀態歷史路由實例
 */
export const droneStatusArchiveRoutes = new DroneStatusArchiveRoutes().getRouter();