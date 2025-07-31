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
import { DroneStatusArchiveController } from '../controllers/DroneStatusArchiveController.js';
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js';

/**
 * 無人機狀態歷史路由類別
 *
 * 負責配置和管理所有無人機狀態變更歷史相關的路由端點
 */
class DroneStatusArchiveRoutes {
  private router: Router;
  private archiveController: DroneStatusArchiveController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.archiveController = new DroneStatusArchiveController();
    this.authMiddleware = new AuthMiddleware();
    
    // 直接在 constructor 中設定所有路由
    
    // TODO: selectAll 和 selectPagination 功能 (待 controller 實作)
    // this.router.get('/api/drone-status-archive/all', this.authMiddleware.authenticate, this.archiveController.selectAll);
    // this.router.get('/api/drone-status-archive/pagination', this.authMiddleware.authenticate, this.archiveController.selectPagination);
    
    // 基本 CRUD 操作
    this.router.get('/api/drone-status-archive/data', this.authMiddleware.authenticate, this.archiveController.getAllStatusArchives);
    this.router.get('/api/drone-status-archive/data/:id', this.authMiddleware.authenticate, this.archiveController.getStatusArchiveById);
    this.router.post('/api/drone-status-archive/data', this.authMiddleware.authenticate, this.archiveController.createStatusArchive);
    this.router.put('/api/drone-status-archive/data/:id', this.authMiddleware.authenticate, this.archiveController.updateStatusArchive);
    this.router.delete('/api/drone-status-archive/data/:id', this.authMiddleware.authenticate, this.archiveController.deleteStatusArchive);

    // 查詢功能
    this.router.get('/api/drone-status-archive/data/drone/:droneId', this.authMiddleware.authenticate, this.archiveController.getStatusArchivesByDroneId);
    this.router.get('/api/drone-status-archive/data/status/:status', this.authMiddleware.authenticate, this.archiveController.getStatusArchivesByStatus);
    this.router.get('/api/drone-status-archive/data/created-by/:userId', this.authMiddleware.authenticate, this.archiveController.getStatusArchivesByCreatedBy);
    this.router.get('/api/drone-status-archive/data/date-range', this.authMiddleware.authenticate, this.archiveController.getStatusArchivesByDateRange);
    this.router.get('/api/drone-status-archive/data/reason/:reason', this.authMiddleware.authenticate, this.archiveController.getStatusArchivesByReason);
    this.router.get('/api/drone-status-archive/data/latest', this.authMiddleware.authenticate, this.archiveController.getLatestStatusArchives);
    this.router.get('/api/drone-status-archive/data/drone/:droneId/latest', this.authMiddleware.authenticate, this.archiveController.getLatestStatusArchiveByDroneId);
    this.router.get('/api/drone-status-archive/data/transition', this.authMiddleware.authenticate, this.archiveController.getStatusArchivesByTransition);

    // 統計功能
    this.router.get('/api/drone-status-archive/statistics', this.authMiddleware.authenticate, this.archiveController.getStatusChangeStatistics);
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
 * 匯出無人機狀態歷史路由實例
 */
export const droneStatusArchiveRoutes = new DroneStatusArchiveRoutes().getRouter();