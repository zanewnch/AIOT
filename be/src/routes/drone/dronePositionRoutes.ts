/**
 * @fileoverview 無人機位置資料路由配置
 *
 * 此文件定義了無人機位置資料相關的路由端點，包括：
 * - 無人機位置資料查詢
 * - 無人機位置資料更新
 * - 支援即時位置資料處理
 *
 * 提供無人機 GPS 位置、飛行狀態和系統資訊的完整 API。
 * 所有端點都需要 JWT 認證。
 *
 * @module Routes/DronePositionRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express';
import { DronePositionController } from '../../controllers/drone/DronePositionController.js';
import { AuthMiddleware } from '../../middlewares/AuthMiddleware.js';
import { ErrorHandleMiddleware } from '../../middlewares/ErrorHandleMiddleware.js';

/**
 * 無人機位置路由類別
 *
 * 負責配置和管理所有無人機位置資料相關的路由端點
 */
class DronePositionRoutes {
  private router: Router;
  private dronePositionController: DronePositionController;
  private authMiddleware: AuthMiddleware;

  // 路由端點常數 - 集中管理所有 API 路徑
  private readonly ROUTES = {
    // 基本 CRUD
    DATA: '/api/drone-position/data',
    DATA_BY_ID: '/api/drone-position/data/:id',

    // 查詢功能
    BY_DRONE_ID: '/api/drone-position/data/drone/:droneId',
    LATEST: '/api/drone-position/data/latest',

    // TODO: 待 controller 實作的功能
    // ALL: '/api/drone-position/all',
    // PAGINATION: '/api/drone-position/pagination'
  } as const;

  constructor() {
    this.router = Router();
    this.dronePositionController = new DronePositionController();
    this.authMiddleware = new AuthMiddleware();

    this.setupCrudRoutes();
    this.setupQueryRoutes();
  }

  /**
   * 設定基本 CRUD 路由
   */
  private setupCrudRoutes = (): void => {
    // GET /api/drone-position/data - 獲取所有無人機位置資料
    this.router.get(this.ROUTES.DATA,
      this.authMiddleware.authenticate,
      (req, res, next) => this.dronePositionController.getAllDronePositions(req, res, next)
    );

    // GET /api/drone-position/data/:id - 根據 ID 獲取無人機位置資料
    this.router.get(this.ROUTES.DATA_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.dronePositionController.getDronePositionById(req, res, next)
    );

    // POST /api/drone-position/data - 創建無人機位置資料
    this.router.post(this.ROUTES.DATA,
      this.authMiddleware.authenticate,
      (req, res, next) => this.dronePositionController.createDronePosition(req, res, next)
    );

    // PUT /api/drone-position/data/:id - 更新無人機位置資料
    this.router.put(this.ROUTES.DATA_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.dronePositionController.updateDronePosition(req, res, next)
    );

    // DELETE /api/drone-position/data/:id - 刪除無人機位置資料
    this.router.delete(this.ROUTES.DATA_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.dronePositionController.deleteDronePosition(req, res, next)
    );
  };

  /**
   * 設定查詢路由
   */
  private setupQueryRoutes = (): void => {
    // GET /api/drone-position/data/latest - 獲取最新無人機位置資料
    this.router.get(this.ROUTES.LATEST,
      this.authMiddleware.authenticate,
      (req, res, next) => this.dronePositionController.getLatestDronePositions(req, res, next)
    );

    // GET /api/drone-position/data/drone/:droneId - 根據無人機 ID 獲取位置資料
    this.router.get(this.ROUTES.BY_DRONE_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.dronePositionController.getDronePositionsByDroneId(req, res, next)
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
 * 匯出無人機位置路由實例
 */
export const dronePositionRoutes = new DronePositionRoutes().getRouter();

// 為了向下相容，也匯出原名稱
export const rtkRoutes = dronePositionRoutes;