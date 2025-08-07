/**
 * @fileoverview 無人機狀態資料路由配置
 *
 * 此文件定義了無人機狀態資料相關的路由端點，包括：
 * - 無人機狀態資料查詢
 * - 無人機狀態資料更新
 * - 支援無人機基本資訊和狀態管理
 *
 * 提供完整的無人機 fleet 管理功能，包含基本資訊、狀態追蹤和統計分析。
 * 所有端點都需要 JWT 認證。
 *
 * @module Routes/DroneStatusRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express';
import { DroneStatusQueries } from '../../controllers/queries/DroneStatusQueriesCtrl.js';
import { DroneStatusCommands } from '../../controllers/commands/DroneStatusCommandsCtrl.js';
import { AuthMiddleware } from '../../middlewares/AuthMiddleware.js';

/**
 * 無人機狀態路由類別
 *
 * 負責配置和管理所有無人機狀態資料相關的路由端點
 * 使用 CQRS 模式分離查詢和命令操作
 */
class DroneStatusRoutes {
  private router: Router;
  private queryController: DroneStatusQueries;
  private commandController: DroneStatusCommands;
  private authMiddleware: AuthMiddleware;

  // 路由端點常數 - 集中管理所有 API 路徑
  private readonly ROUTES = {
    // 基本 CRUD
    DATA: '/api/drone-status/data',
    DATA_BY_ID: '/api/drone-status/data/:id',
    DATA_BY_SERIAL: '/api/drone-status/data/serial/:serial',

    // 查詢功能
    BY_STATUS: '/api/drone-status/data/status/:status',
    BY_OWNER: '/api/drone-status/data/owner/:ownerId',
    BY_MANUFACTURER: '/api/drone-status/data/manufacturer/:manufacturer',
    UPDATE_STATUS_ONLY: '/api/drone-status/data/:id/status',

    // 統計功能
    STATISTICS: '/api/drone-status/statistics',

    // TODO: 待 controller 實作的功能
    // ALL: '/api/drone-status/all',
    // PAGINATION: '/api/drone-status/pagination'
  } as const;

  constructor() {
    this.router = Router();
    this.queryController = new DroneStatusQueries();
    this.commandController = new DroneStatusCommands();
    this.authMiddleware = new AuthMiddleware();

    this.setupCrudRoutes();
    this.setupQueryRoutes();
    this.setupStatisticsRoutes();
  }

  /**
   * 設定基本 CRUD 路由
   */
  private setupCrudRoutes = (): void => {
    // GET /api/drone-status/data - 獲取所有無人機狀態資料 (查詢操作)
    this.router.get(this.ROUTES.DATA,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getAllDroneStatuses(req, res, next)
    );

    // GET /api/drone-status/data/:id - 根據 ID 獲取無人機狀態資料 (查詢操作)
    this.router.get(this.ROUTES.DATA_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getDroneStatusById(req, res, next)
    );

    // GET /api/drone-status/data/serial/:serial - 根據序號獲取無人機狀態資料 (查詢操作)
    this.router.get(this.ROUTES.DATA_BY_SERIAL,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getDroneStatusBySerial(req, res, next)
    );

    // POST /api/drone-status/data - 創建無人機狀態資料 (命令操作)
    this.router.post(this.ROUTES.DATA,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.createDroneStatus(req, res, next)
    );

    // PUT /api/drone-status/data/:id - 更新無人機狀態資料 (命令操作)
    this.router.put(this.ROUTES.DATA_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.updateDroneStatus(req, res, next)
    );

    // DELETE /api/drone-status/data/:id - 刪除無人機狀態資料 (命令操作)
    this.router.delete(this.ROUTES.DATA_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.deleteDroneStatus(req, res, next)
    );
  };

  /**
   * 設定查詢路由
   */
  private setupQueryRoutes = (): void => {
    // GET /api/drone-status/data/status/:status - 根據狀態獲取無人機 (查詢操作)
    this.router.get(this.ROUTES.BY_STATUS,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getDroneStatusesByStatus(req, res, next)
    );

    // GET /api/drone-status/data/owner/:ownerId - 根據擁有者獲取無人機 (查詢操作)
    this.router.get(this.ROUTES.BY_OWNER,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getDroneStatusesByOwner(req, res, next)
    );

    // GET /api/drone-status/data/manufacturer/:manufacturer - 根據製造商獲取無人機 (查詢操作)
    this.router.get(this.ROUTES.BY_MANUFACTURER,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getDroneStatusesByManufacturer(req, res, next)
    );

    // PATCH /api/drone-status/data/:id/status - 僅更新無人機狀態 (命令操作)
    this.router.patch(this.ROUTES.UPDATE_STATUS_ONLY,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.updateDroneStatusOnly(req, res, next)
    );
  };

  /**
   * 設定統計路由
   */
  private setupStatisticsRoutes = (): void => {
    // GET /api/drone-status/statistics - 獲取無人機狀態統計 (查詢操作)
    this.router.get(this.ROUTES.STATISTICS,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getDroneStatusStatistics(req, res, next)
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
 * 匯出無人機狀態路由實例
 */
export const droneStatusRoutes = new DroneStatusRoutes().getRouter();