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
import { DroneStatusController } from '../controllers/DroneStatusController.js';
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js';
import { ErrorHandleMiddleware } from '../middlewares/ErrorHandleMiddleware.js';

/**
 * 無人機狀態路由類別
 *
 * 負責配置和管理所有無人機狀態資料相關的路由端點
 */
class DroneStatusRoutes {
  private router: Router;
  private droneStatusController: DroneStatusController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.droneStatusController = new DroneStatusController();
    this.authMiddleware = new AuthMiddleware();
    
    // 直接在 constructor 中設定所有路由
    
    // TODO: selectAll 和 selectPagination 功能 (待 controller 實作)
    // this.router.get('/api/drone-status/all', this.authMiddleware.authenticate, this.droneStatusController.selectAll);
    // this.router.get('/api/drone-status/pagination', this.authMiddleware.authenticate, this.droneStatusController.selectPagination);
    
    // 基本 CRUD 操作
    this.router.get('/api/drone-status/data', this.authMiddleware.authenticate, this.droneStatusController.getAllDroneStatuses);
    this.router.get('/api/drone-status/data/:id', this.authMiddleware.authenticate, this.droneStatusController.getDroneStatusById);
    this.router.get('/api/drone-status/data/serial/:serial', this.authMiddleware.authenticate, this.droneStatusController.getDroneStatusBySerial);
    this.router.post('/api/drone-status/data', this.authMiddleware.authenticate, this.droneStatusController.createDroneStatus);
    this.router.put('/api/drone-status/data/:id', this.authMiddleware.authenticate, this.droneStatusController.updateDroneStatus);
    this.router.delete('/api/drone-status/data/:id', this.authMiddleware.authenticate, this.droneStatusController.deleteDroneStatus);
    
    // 查詢功能
    this.router.get('/api/drone-status/data/status/:status', this.authMiddleware.authenticate, this.droneStatusController.getDronesByStatus);
    this.router.get('/api/drone-status/data/owner/:ownerId', this.authMiddleware.authenticate, this.droneStatusController.getDronesByOwner);
    this.router.get('/api/drone-status/data/manufacturer/:manufacturer', this.authMiddleware.authenticate, this.droneStatusController.getDronesByManufacturer);
    this.router.patch('/api/drone-status/data/:id/status', this.authMiddleware.authenticate, this.droneStatusController.updateDroneStatusOnly);
    this.router.get('/api/drone-status/statistics', this.authMiddleware.authenticate, this.droneStatusController.getDroneStatusStatistics);
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
 * 匯出無人機狀態路由實例
 */
export const droneStatusRoutes = new DroneStatusRoutes().getRouter();