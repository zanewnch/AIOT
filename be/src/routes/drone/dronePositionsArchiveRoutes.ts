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
import { DronePositionsArchiveQueries } from '../../controllers/queries/DronePositionsArchiveQueriesCtrl.js';
import { DronePositionsArchiveCommands } from '../../controllers/commands/DronePositionsArchiveCommandsCtrl.js';
import { AuthMiddleware } from '../../middlewares/AuthMiddleware.js';

/**
 * 無人機位置歷史歸檔路由類別
 *
 * 負責配置和管理所有無人機位置歷史歸檔相關的路由端點
 * 使用 CQRS 模式分離查詢和命令操作
 */
class DronePositionsArchiveRoutes {
  private router: Router;
  private queryController: DronePositionsArchiveQueries;
  private commandController: DronePositionsArchiveCommands;
  private authMiddleware: AuthMiddleware;

  // 路由端點常數 - 集中管理所有 API 路徑
  private readonly ROUTES = {
    // 基本 CRUD
    DATA: '/api/drone-positions-archive/data',
    DATA_BY_ID: '/api/drone-positions-archive/data/:id',
    DATA_ORIGINAL: '/api/drone-positions-archive/data/original/:originalId',
    DATA_BULK: '/api/drone-positions-archive/data/bulk',

    // 查詢功能
    BY_DRONE_ID: '/api/drone-positions-archive/data/drone/:droneId',
    BY_TIME_RANGE: '/api/drone-positions-archive/data/time-range',
    BY_BATCH_ID: '/api/drone-positions-archive/data/batch/:batchId',
    BY_GEO_BOUNDS: '/api/drone-positions-archive/data/geo-bounds',
    TRAJECTORY: '/api/drone-positions-archive/trajectory/:droneId',
    LATEST: '/api/drone-positions-archive/data/latest',
    LATEST_BY_DRONE: '/api/drone-positions-archive/data/drone/:droneId/latest',

    // 統計功能
    STATS_COUNT: '/api/drone-positions-archive/statistics/count',
    STATS_TRAJECTORY: '/api/drone-positions-archive/statistics/trajectory/:droneId',
    STATS_BATTERY: '/api/drone-positions-archive/statistics/battery/:droneId',
    STATS_POSITION: '/api/drone-positions-archive/statistics/position/:droneId',
    STATS_BATCH: '/api/drone-positions-archive/statistics/batch/:batchId',

    // 分析功能
    ANALYSIS_PATTERNS: '/api/drone-positions-archive/analysis/patterns/:droneId',
    ANALYSIS_ANOMALIES: '/api/drone-positions-archive/analysis/anomalies/:droneId',

    // 報告功能
    REPORTS_SUMMARY: '/api/drone-positions-archive/reports/summary/:droneId',

    // 批次操作
    DELETE_BEFORE: '/api/drone-positions-archive/data/before/:beforeDate',
    DELETE_BATCH: '/api/drone-positions-archive/data/batch/:batchId'
  } as const;

  constructor() {
    this.router = Router();
    this.queryController = new DronePositionsArchiveQueries();
    this.commandController = new DronePositionsArchiveCommands();
    this.authMiddleware = new AuthMiddleware();

    this.setupCrudRoutes();
    this.setupQueryRoutes();
    this.setupStatisticsRoutes();
    this.setupAnalysisRoutes();
    this.setupReportRoutes();
    this.setupBatchRoutes();
  }

  /**
   * 設定基本 CRUD 路由
   */
  private setupCrudRoutes = (): void => {
    // GET /api/drone-positions-archive/data - 獲取所有位置歷史歸檔 (查詢操作)
    this.router.get(this.ROUTES.DATA,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getAllPositionArchives(req, res, next)
    );

    // GET /api/drone-positions-archive/data/:id - 根據 ID 獲取位置歷史歸檔 (查詢操作)
    this.router.get(this.ROUTES.DATA_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getPositionArchiveById(req, res, next)
    );

    // GET /api/drone-positions-archive/data/original/:originalId - 根據原始 ID 獲取歸檔 (查詢操作)
    this.router.get(this.ROUTES.DATA_ORIGINAL,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getPositionArchiveByOriginalId(req, res, next)
    );

    // POST /api/drone-positions-archive/data - 創建位置歷史歸檔記錄 (命令操作)
    this.router.post(this.ROUTES.DATA,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.createPositionArchive(req, res, next)
    );

    // POST /api/drone-positions-archive/data/bulk - 批量創建位置歷史歸檔記錄 (命令操作)
    this.router.post(this.ROUTES.DATA_BULK,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.bulkCreatePositionArchives(req, res, next)
    );

    // PUT /api/drone-positions-archive/data/:id - 更新位置歷史歸檔資料 (命令操作)
    this.router.put(this.ROUTES.DATA_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.updatePositionArchive(req, res, next)
    );

    // DELETE /api/drone-positions-archive/data/:id - 刪除位置歷史歸檔資料 (命令操作)
    this.router.delete(this.ROUTES.DATA_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.deletePositionArchive(req, res, next)
    );
  };

  /**
   * 設定查詢路由
   */
  private setupQueryRoutes = (): void => {
    // GET /api/drone-positions-archive/data/drone/:droneId - 根據無人機 ID 查詢位置歷史歸檔
    this.router.get(this.ROUTES.BY_DRONE_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getPositionArchivesByDroneId(req, res, next)
    );

    // GET /api/drone-positions-archive/data/time-range - 根據時間範圍查詢位置歷史歸檔
    this.router.get(this.ROUTES.BY_TIME_RANGE,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getPositionArchivesByTimeRange(req, res, next)
    );

    // GET /api/drone-positions-archive/data/batch/:batchId - 根據歸檔批次 ID 查詢資料
    this.router.get(this.ROUTES.BY_BATCH_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getPositionArchivesByBatchId(req, res, next)
    );

    // GET /api/drone-positions-archive/data/geo-bounds - 根據地理邊界查詢位置歷史歸檔
    this.router.get(this.ROUTES.BY_GEO_BOUNDS,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getPositionArchivesByGeoBounds(req, res, next)
    );

    // GET /api/drone-positions-archive/trajectory/:droneId - 根據無人機和時間範圍查詢軌跡
    this.router.get(this.ROUTES.TRAJECTORY,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getTrajectoryByDroneAndTime(req, res, next)
    );

    // GET /api/drone-positions-archive/data/latest - 取得最新的歷史歸檔記錄
    this.router.get(this.ROUTES.LATEST,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getLatestPositionArchives(req, res, next)
    );

    // GET /api/drone-positions-archive/data/drone/:droneId/latest - 取得特定無人機的最新歷史歸檔記錄
    this.router.get(this.ROUTES.LATEST_BY_DRONE,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getLatestPositionArchiveByDroneId(req, res, next)
    );
  };

  /**
   * 設定統計路由
   */
  private setupStatisticsRoutes = (): void => {
    // GET /api/drone-positions-archive/statistics/count - 統計總記錄數
    this.router.get(this.ROUTES.STATS_COUNT,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getTotalArchiveCount(req, res, next)
    );

    // GET /api/drone-positions-archive/statistics/trajectory/:droneId - 計算軌跡統計資料
    this.router.get(this.ROUTES.STATS_TRAJECTORY,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.calculateTrajectoryStatistics(req, res, next)
    );

    // GET /api/drone-positions-archive/statistics/battery/:droneId - 計算電池使用統計資料
    this.router.get(this.ROUTES.STATS_BATTERY,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.calculateBatteryUsageStatistics(req, res, next)
    );

    // GET /api/drone-positions-archive/statistics/position/:droneId - 計算位置分佈統計資料
    this.router.get(this.ROUTES.STATS_POSITION,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.calculatePositionDistributionStatistics(req, res, next)
    );

    // GET /api/drone-positions-archive/statistics/batch/:batchId - 取得歸檔批次統計資料
    this.router.get(this.ROUTES.STATS_BATCH,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getArchiveBatchStatistics(req, res, next)
    );
  };

  /**
   * 設定分析路由
   */
  private setupAnalysisRoutes = (): void => {
    // GET /api/drone-positions-archive/analysis/patterns/:droneId - 分析飛行模式
    this.router.get(this.ROUTES.ANALYSIS_PATTERNS,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.analyzeFlightPatterns(req, res, next)
    );

    // GET /api/drone-positions-archive/analysis/anomalies/:droneId - 檢測異常位置資料
    this.router.get(this.ROUTES.ANALYSIS_ANOMALIES,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.detectAnomalousPositions(req, res, next)
    );
  };

  /**
   * 設定報告路由
   */
  private setupReportRoutes = (): void => {
    // GET /api/drone-positions-archive/reports/summary/:droneId - 產生軌跡摘要報告
    this.router.get(this.ROUTES.REPORTS_SUMMARY,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.generateTrajectorySummaryReport(req, res, next)
    );
  };

  /**
   * 設定批次操作路由
   */
  private setupBatchRoutes = (): void => {
    // DELETE /api/drone-positions-archive/data/before/:beforeDate - 刪除指定時間之前的歸檔資料
    this.router.delete(this.ROUTES.DELETE_BEFORE,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.deleteArchivesBeforeDate(req, res, next)
    );

    // DELETE /api/drone-positions-archive/data/batch/:batchId - 刪除指定批次的歸檔資料
    this.router.delete(this.ROUTES.DELETE_BATCH,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.deleteArchiveBatch(req, res, next)
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
 * 匯出無人機位置歷史歸檔路由實例
 */
export const dronePositionsArchiveRoutes = new DronePositionsArchiveRoutes().getRouter();