/**
 * @fileoverview 無人機位置歷史歸檔路由配置
 *
 * 此文件定義了無人機位置歷史歸檔相關的路由端點，包括：
 * - 位置歷史資料查詢和管理
 * - 軌跡分析和統計
 * - 地理邊界和時間範圍查詢
 * - 飛行模式分析和異常檢測
 * - 批次操作和報告生成
 *
 * 提供完整的無人機位置歷史追蹤和分析功能，包含歷史記錄、統計分析和趨勢預測。
 * 所有端點都需要 JWT 認證。
 *
 * @module Routes/DronePositionsArchiveRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express';
import { DronePositionsArchiveController } from '../controllers/DronePositionsArchiveController.js';
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js';
import { ErrorHandleMiddleware } from '../middlewares/ErrorHandleMiddleware.js';

/**
 * 無人機位置歷史歸檔路由類別
 *
 * 負責配置和管理所有無人機位置歷史歸檔相關的路由端點
 */
class DronePositionsArchiveRoutes {
  private router: Router;
  private archiveController: DronePositionsArchiveController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.archiveController = new DronePositionsArchiveController();
    this.authMiddleware = new AuthMiddleware();
    
    // 直接在 constructor 中設定所有路由
    
    // TODO: selectAll 和 selectPagination 功能 (待 controller 實作)
    // this.router.get('/api/drone-positions-archive/all', this.authMiddleware.authenticate, this.archiveController.selectAll);
    // this.router.get('/api/drone-positions-archive/pagination', this.authMiddleware.authenticate, this.archiveController.selectPagination);
    
    // 基本 CRUD 操作
    this.router.get('/api/drone-positions-archive/data', this.authMiddleware.authenticate, this.archiveController.getAllPositionArchives);
    this.router.get('/api/drone-positions-archive/data/:id', this.authMiddleware.authenticate, this.archiveController.getPositionArchiveById);
    this.router.post('/api/drone-positions-archive/data', this.authMiddleware.authenticate, this.archiveController.createPositionArchive);
    this.router.delete('/api/drone-positions-archive/data/:id', this.authMiddleware.authenticate, this.archiveController.deletePositionArchive);
    
    // 主要查詢功能
    this.router.get('/api/drone-positions-archive/data/drone/:droneId', this.authMiddleware.authenticate, this.archiveController.getPositionArchivesByDroneId);
    this.router.get('/api/drone-positions-archive/data/latest', this.authMiddleware.authenticate, this.archiveController.getLatestPositionArchives);
  }

  private _oldInitializeRoutes(): void {
    // 基本 CRUD 操作
    this.setupGetAllPositionArchivesRoute();
    this.setupGetPositionArchiveByIdRoute();
    this.setupGetPositionArchiveByOriginalIdRoute();
    this.setupCreatePositionArchiveRoute();
    this.setupBulkCreatePositionArchivesRoute();
    this.setupUpdatePositionArchiveRoute();
    this.setupDeletePositionArchiveRoute();

    // 查詢功能
    this.setupGetPositionArchivesByDroneIdRoute();
    this.setupGetPositionArchivesByTimeRangeRoute();
    this.setupGetPositionArchivesByBatchIdRoute();
    this.setupGetPositionArchivesByGeoBoundsRoute();
    this.setupGetTrajectoryByDroneAndTimeRoute();
    this.setupGetLatestPositionArchivesRoute();
    this.setupGetLatestPositionArchiveByDroneIdRoute();

    // 統計功能
    this.setupGetTotalArchiveCountRoute();
    this.setupCalculateTrajectoryStatisticsRoute();
    this.setupCalculateBatteryUsageStatisticsRoute();
    this.setupCalculatePositionDistributionStatisticsRoute();
    this.setupGetArchiveBatchStatisticsRoute();

    // 分析功能
    this.setupAnalyzeFlightPatternsRoute();
    this.setupDetectAnomalousPositionsRoute();

    // 報告功能
    this.setupGenerateTrajectorySummaryReportRoute();

    // 批次操作
    this.setupDeleteArchivesBeforeDateRoute();
    this.setupDeleteArchiveBatchRoute();
  }

  /**
   * 設定取得所有位置歷史歸檔資料路由
   *
   * @route GET /api/drone-positions-archive/data
   */
  private setupGetAllPositionArchivesRoute(): void {
    this.router.get('/api/drone-positions-archive/data',
      this.authMiddleware.authenticate,
      this.archiveController.getAllPositionArchives
    );
  }

  /**
   * 設定根據 ID 取得位置歷史歸檔資料路由
   *
   * @route GET /api/drone-positions-archive/data/:id
   */
  private setupGetPositionArchiveByIdRoute(): void {
    this.router.get('/api/drone-positions-archive/data/:id',
      this.authMiddleware.authenticate,
      this.archiveController.getPositionArchiveById
    );
  }

  /**
   * 設定根據原始 ID 取得歸檔資料路由
   *
   * @route GET /api/drone-positions-archive/data/original/:originalId
   */
  private setupGetPositionArchiveByOriginalIdRoute(): void {
    this.router.get('/api/drone-positions-archive/data/original/:originalId',
      this.authMiddleware.authenticate,
      this.archiveController.getPositionArchiveByOriginalId
    );
  }

  /**
   * 設定創建位置歷史歸檔記錄路由
   *
   * @route POST /api/drone-positions-archive/data
   */
  private setupCreatePositionArchiveRoute(): void {
    this.router.post('/api/drone-positions-archive/data',
      this.authMiddleware.authenticate,
      this.archiveController.createPositionArchive
    );
  }

  /**
   * 設定批量創建位置歷史歸檔記錄路由
   *
   * @route POST /api/drone-positions-archive/data/bulk
   */
  private setupBulkCreatePositionArchivesRoute(): void {
    this.router.post('/api/drone-positions-archive/data/bulk',
      this.authMiddleware.authenticate,
      this.archiveController.bulkCreatePositionArchives
    );
  }

  /**
   * 設定更新位置歷史歸檔資料路由
   *
   * @route PUT /api/drone-positions-archive/data/:id
   */
  private setupUpdatePositionArchiveRoute(): void {
    this.router.put('/api/drone-positions-archive/data/:id',
      this.authMiddleware.authenticate,
      this.archiveController.updatePositionArchive
    );
  }

  /**
   * 設定刪除位置歷史歸檔資料路由
   *
   * @route DELETE /api/drone-positions-archive/data/:id
   */
  private setupDeletePositionArchiveRoute(): void {
    this.router.delete('/api/drone-positions-archive/data/:id',
      this.authMiddleware.authenticate,
      this.archiveController.deletePositionArchive
    );
  }

  /**
   * 設定根據無人機 ID 查詢位置歷史歸檔路由
   *
   * @route GET /api/drone-positions-archive/data/drone/:droneId
   */
  private setupGetPositionArchivesByDroneIdRoute(): void {
    this.router.get('/api/drone-positions-archive/data/drone/:droneId',
      this.authMiddleware.authenticate,
      this.archiveController.getPositionArchivesByDroneId
    );
  }

  /**
   * 設定根據時間範圍查詢位置歷史歸檔路由
   *
   * @route GET /api/drone-positions-archive/data/time-range
   */
  private setupGetPositionArchivesByTimeRangeRoute(): void {
    this.router.get('/api/drone-positions-archive/data/time-range',
      this.authMiddleware.authenticate,
      this.archiveController.getPositionArchivesByTimeRange
    );
  }

  /**
   * 設定根據歸檔批次 ID 查詢資料路由
   *
   * @route GET /api/drone-positions-archive/data/batch/:batchId
   */
  private setupGetPositionArchivesByBatchIdRoute(): void {
    this.router.get('/api/drone-positions-archive/data/batch/:batchId',
      this.authMiddleware.authenticate,
      this.archiveController.getPositionArchivesByBatchId
    );
  }

  /**
   * 設定根據地理邊界查詢位置歷史歸檔路由
   *
   * @route GET /api/drone-positions-archive/data/geo-bounds
   */
  private setupGetPositionArchivesByGeoBoundsRoute(): void {
    this.router.get('/api/drone-positions-archive/data/geo-bounds',
      this.authMiddleware.authenticate,
      this.archiveController.getPositionArchivesByGeoBounds
    );
  }

  /**
   * 設定根據無人機和時間範圍查詢軌跡路由
   *
   * @route GET /api/drone-positions-archive/trajectory/:droneId
   */
  private setupGetTrajectoryByDroneAndTimeRoute(): void {
    this.router.get('/api/drone-positions-archive/trajectory/:droneId',
      this.authMiddleware.authenticate,
      this.archiveController.getTrajectoryByDroneAndTime
    );
  }

  /**
   * 設定取得最新的歷史歸檔記錄路由
   *
   * @route GET /api/drone-positions-archive/data/latest
   */
  private setupGetLatestPositionArchivesRoute(): void {
    this.router.get('/api/drone-positions-archive/data/latest',
      this.authMiddleware.authenticate,
      this.archiveController.getLatestPositionArchives
    );
  }

  /**
   * 設定取得特定無人機的最新歷史歸檔記錄路由
   *
   * @route GET /api/drone-positions-archive/data/drone/:droneId/latest
   */
  private setupGetLatestPositionArchiveByDroneIdRoute(): void {
    this.router.get('/api/drone-positions-archive/data/drone/:droneId/latest',
      this.authMiddleware.authenticate,
      this.archiveController.getLatestPositionArchiveByDroneId
    );
  }

  /**
   * 設定統計總記錄數路由
   *
   * @route GET /api/drone-positions-archive/statistics/count
   */
  private setupGetTotalArchiveCountRoute(): void {
    this.router.get('/api/drone-positions-archive/statistics/count',
      this.authMiddleware.authenticate,
      this.archiveController.getTotalArchiveCount
    );
  }

  /**
   * 設定計算軌跡統計資料路由
   *
   * @route GET /api/drone-positions-archive/statistics/trajectory/:droneId
   */
  private setupCalculateTrajectoryStatisticsRoute(): void {
    this.router.get('/api/drone-positions-archive/statistics/trajectory/:droneId',
      this.authMiddleware.authenticate,
      this.archiveController.calculateTrajectoryStatistics
    );
  }

  /**
   * 設定計算電池使用統計資料路由
   *
   * @route GET /api/drone-positions-archive/statistics/battery/:droneId
   */
  private setupCalculateBatteryUsageStatisticsRoute(): void {
    this.router.get('/api/drone-positions-archive/statistics/battery/:droneId',
      this.authMiddleware.authenticate,
      this.archiveController.calculateBatteryUsageStatistics
    );
  }

  /**
   * 設定計算位置分佈統計資料路由
   *
   * @route GET /api/drone-positions-archive/statistics/position/:droneId
   */
  private setupCalculatePositionDistributionStatisticsRoute(): void {
    this.router.get('/api/drone-positions-archive/statistics/position/:droneId',
      this.authMiddleware.authenticate,
      this.archiveController.calculatePositionDistributionStatistics
    );
  }

  /**
   * 設定取得歸檔批次統計資料路由
   *
   * @route GET /api/drone-positions-archive/statistics/batch/:batchId
   */
  private setupGetArchiveBatchStatisticsRoute(): void {
    this.router.get('/api/drone-positions-archive/statistics/batch/:batchId',
      this.authMiddleware.authenticate,
      this.archiveController.getArchiveBatchStatistics
    );
  }

  /**
   * 設定分析飛行模式路由
   *
   * @route GET /api/drone-positions-archive/analysis/patterns/:droneId
   */
  private setupAnalyzeFlightPatternsRoute(): void {
    this.router.get('/api/drone-positions-archive/analysis/patterns/:droneId',
      this.authMiddleware.authenticate,
      this.archiveController.analyzeFlightPatterns
    );
  }

  /**
   * 設定檢測異常位置資料路由
   *
   * @route GET /api/drone-positions-archive/analysis/anomalies/:droneId
   */
  private setupDetectAnomalousPositionsRoute(): void {
    this.router.get('/api/drone-positions-archive/analysis/anomalies/:droneId',
      this.authMiddleware.authenticate,
      this.archiveController.detectAnomalousPositions
    );
  }

  /**
   * 設定產生軌跡摘要報告路由
   *
   * @route GET /api/drone-positions-archive/reports/summary/:droneId
   */
  private setupGenerateTrajectorySummaryReportRoute(): void {
    this.router.get('/api/drone-positions-archive/reports/summary/:droneId',
      this.authMiddleware.authenticate,
      this.archiveController.generateTrajectorySummaryReport
    );
  }

  /**
   * 設定刪除指定時間之前的歸檔資料路由
   *
   * @route DELETE /api/drone-positions-archive/data/before/:beforeDate
   */
  private setupDeleteArchivesBeforeDateRoute(): void {
    this.router.delete('/api/drone-positions-archive/data/before/:beforeDate',
      this.authMiddleware.authenticate,
      this.archiveController.deleteArchivesBeforeDate
    );
  }

  /**
   * 設定刪除指定批次的歸檔資料路由
   *
   * @route DELETE /api/drone-positions-archive/data/batch/:batchId
   */
  private setupDeleteArchiveBatchRoute(): void {
    this.router.delete('/api/drone-positions-archive/data/batch/:batchId',
      this.authMiddleware.authenticate,
      this.archiveController.deleteArchiveBatch
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
 * 匯出無人機位置歷史歸檔路由實例
 */
export const dronePositionsArchiveRoutes = new DronePositionsArchiveRoutes().getRouter();