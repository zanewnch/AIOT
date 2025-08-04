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
import { DronePositionController } from '../controllers/DronePositionController.js';
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js';
import { ErrorHandleMiddleware } from '../middlewares/ErrorHandleMiddleware.js';

/**
 * 無人機位置路由類別
 *
 * 負責配置和管理所有無人機位置資料相關的路由端點
 */
class DronePositionRoutes {
  private router: Router;
  private dronePositionController: DronePositionController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.dronePositionController = new DronePositionController();
    this.authMiddleware = new AuthMiddleware();
    
    // 直接在 constructor 中設定所有路由
    
    // TODO: selectAll 和 selectPagination 功能 (待 controller 實作)
    // this.router.get('/api/drone-position/all', this.authMiddleware.authenticate, this.dronePositionController.selectAll);
    // this.router.get('/api/drone-position/pagination', this.authMiddleware.authenticate, this.dronePositionController.selectPagination);
    
    // 基本 CRUD 操作
    this.router.get('/api/drone-position/data', this.authMiddleware.authenticate, this.dronePositionController.getAllDronePositions);
    this.router.get('/api/drone-position/data/:id', this.authMiddleware.authenticate, this.dronePositionController.getDronePositionById);
    this.router.post('/api/drone-position/data', this.authMiddleware.authenticate, this.dronePositionController.createDronePosition);
    this.router.put('/api/drone-position/data/:id', this.authMiddleware.authenticate, this.dronePositionController.updateDronePosition);
    this.router.delete('/api/drone-position/data/:id', this.authMiddleware.authenticate, this.dronePositionController.deleteDronePosition);
    
    // 查詢功能
    this.router.get('/api/drone-position/data/latest', this.authMiddleware.authenticate, this.dronePositionController.getLatestDronePositions);
    this.router.get('/api/drone-position/data/drone/:droneId', this.authMiddleware.authenticate, this.dronePositionController.getDronePositionsByDroneId);
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
 * 匯出無人機位置路由實例
 */
export const dronePositionRoutes = new DronePositionRoutes().getRouter();

// 為了向下相容，也匯出原名稱
export const rtkRoutes = dronePositionRoutes;