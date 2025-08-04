/**
 * @fileoverview 無人機指令路由配置
 *
 * 此文件定義了無人機指令相關的路由端點，包括：
 * - 指令管理（CRUD 操作）
 * - selectAll 和 selectPagination 功能
 * - 指令發送（起飛、降落、移動、懸停、返航）
 * - 指令狀態管理（執行、完成、失敗、取消）
 * - 指令查詢和統計分析
 * - 批次操作和重試功能
 *
 * @module Routes/DroneCommandRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express';
import { DroneCommandController } from '../../controllers/drone/DroneCommandController.js';
import { AuthMiddleware } from '../../middlewares/AuthMiddleware.js';

/**
 * 無人機指令路由類別
 *
 * 負責配置和管理所有無人機指令相關的路由端點
 */
class DroneCommandRoutes {
  private router: Router;
  private commandController: DroneCommandController;
  private authMiddleware: AuthMiddleware;

  // 路由端點常數 - 集中管理所有 API 路徑
  private readonly ROUTES = {
    // 基本 CRUD
    DATA: '/api/drone-commands/data',
    DATA_BY_ID: '/api/drone-commands/data/:id',
    DATA_BATCH: '/api/drone-commands/data/batch',

    // 查詢功能
    BY_DRONE_ID: '/api/drone-commands/data/drone/:droneId',
    BY_STATUS: '/api/drone-commands/data/status/:status',
    BY_TYPE: '/api/drone-commands/data/type/:type',
    BY_ISSUED_BY: '/api/drone-commands/data/issued-by/:userId',
    BY_DATE_RANGE: '/api/drone-commands/data/date-range',
    PENDING_BY_DRONE: '/api/drone-commands/data/drone/:droneId/pending',
    EXECUTING_BY_DRONE: '/api/drone-commands/data/drone/:droneId/executing',
    LATEST: '/api/drone-commands/data/latest',
    FAILED: '/api/drone-commands/data/failed',

    // 指令發送
    SEND_TAKEOFF: '/api/drone-commands/send/takeoff',
    SEND_LAND: '/api/drone-commands/send/land',
    SEND_MOVE: '/api/drone-commands/send/move',
    SEND_HOVER: '/api/drone-commands/send/hover',
    SEND_RETURN: '/api/drone-commands/send/return',

    // 指令狀態管理
    EXECUTE: '/api/drone-commands/:id/execute',
    COMPLETE: '/api/drone-commands/:id/complete',
    FAIL: '/api/drone-commands/:id/fail',
    CANCEL: '/api/drone-commands/:id/cancel',
    RETRY: '/api/drone-commands/:id/retry',

    // 統計和分析
    STATISTICS: '/api/drone-commands/statistics',
    TYPE_STATISTICS: '/api/drone-commands/statistics/types',
    SUMMARY: '/api/drone-commands/summary/:droneId'
  } as const;

  constructor() {
    this.router = Router();
    this.commandController = new DroneCommandController();
    this.authMiddleware = new AuthMiddleware();

    this.setupCrudRoutes();
    this.setupQueryRoutes();
    this.setupCommandRoutes();
    this.setupStatusRoutes();
    this.setupStatisticsRoutes();
  }

  /**
   * 設定基本 CRUD 路由
   */
  private setupCrudRoutes = (): void => {
    // GET /api/drone-commands/data - 獲取所有指令
    this.router.get(this.ROUTES.DATA,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.getAllCommands(req, res, next)
    );

    // GET /api/drone-commands/data/:id - 根據 ID 獲取指令
    this.router.get(this.ROUTES.DATA_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.getCommandById(req, res, next)
    );

    // POST /api/drone-commands/data - 建立新指令
    this.router.post(this.ROUTES.DATA,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.createCommand(req, res, next)
    );

    // POST /api/drone-commands/data/batch - 批量建立指令
    this.router.post(this.ROUTES.DATA_BATCH,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.createBatchCommands(req, res, next)
    );

    // PUT /api/drone-commands/data/:id - 更新指令
    this.router.put(this.ROUTES.DATA_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.updateCommand(req, res, next)
    );

    // DELETE /api/drone-commands/data/:id - 刪除指令
    this.router.delete(this.ROUTES.DATA_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.deleteCommand(req, res, next)
    );
  };

  /**
   * 設定查詢路由
   */
  private setupQueryRoutes = (): void => {
    // GET /api/drone-commands/data/drone/:droneId - 根據無人機 ID 獲取指令
    this.router.get(this.ROUTES.BY_DRONE_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.getCommandsByDroneId(req, res, next)
    );

    // GET /api/drone-commands/data/status/:status - 根據狀態獲取指令
    this.router.get(this.ROUTES.BY_STATUS,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.getCommandsByStatus(req, res, next)
    );

    // GET /api/drone-commands/data/type/:type - 根據類型獲取指令
    this.router.get(this.ROUTES.BY_TYPE,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.getCommandsByType(req, res, next)
    );

    // GET /api/drone-commands/data/issued-by/:userId - 根據發送者獲取指令
    this.router.get(this.ROUTES.BY_ISSUED_BY,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.getCommandsByIssuedBy(req, res, next)
    );

    // GET /api/drone-commands/data/date-range - 根據時間範圍獲取指令
    this.router.get(this.ROUTES.BY_DATE_RANGE,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.getCommandsByDateRange(req, res, next)
    );

    // GET /api/drone-commands/data/drone/:droneId/pending - 獲取待執行指令
    this.router.get(this.ROUTES.PENDING_BY_DRONE,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.getPendingCommandsByDroneId(req, res, next)
    );

    // GET /api/drone-commands/data/drone/:droneId/executing - 獲取執行中指令
    this.router.get(this.ROUTES.EXECUTING_BY_DRONE,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.getExecutingCommandByDroneId(req, res, next)
    );

    // GET /api/drone-commands/data/latest - 獲取最新指令
    this.router.get(this.ROUTES.LATEST,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.getLatestCommands(req, res, next)
    );

    // GET /api/drone-commands/data/failed - 獲取失敗指令
    this.router.get(this.ROUTES.FAILED,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.getFailedCommands(req, res, next)
    );
  };

  /**
   * 設定指令發送路由
   */
  private setupCommandRoutes = (): void => {
    // POST /api/drone-commands/send/takeoff - 發送起飛指令
    this.router.post(this.ROUTES.SEND_TAKEOFF,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.sendTakeoffCommand(req, res, next)
    );

    // POST /api/drone-commands/send/land - 發送降落指令
    this.router.post(this.ROUTES.SEND_LAND,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.sendLandCommand(req, res, next)
    );

    // POST /api/drone-commands/send/move - 發送移動指令
    this.router.post(this.ROUTES.SEND_MOVE,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.sendMoveCommand(req, res, next)
    );

    // POST /api/drone-commands/send/hover - 發送懸停指令
    this.router.post(this.ROUTES.SEND_HOVER,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.sendHoverCommand(req, res, next)
    );

    // POST /api/drone-commands/send/return - 發送返航指令
    this.router.post(this.ROUTES.SEND_RETURN,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.sendReturnCommand(req, res, next)
    );
  };

  /**
   * 設定指令狀態管理路由
   */
  private setupStatusRoutes = (): void => {
    // PUT /api/drone-commands/:id/execute - 執行指令
    this.router.put(this.ROUTES.EXECUTE,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.executeCommand(req, res, next)
    );

    // PUT /api/drone-commands/:id/complete - 完成指令
    this.router.put(this.ROUTES.COMPLETE,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.completeCommand(req, res, next)
    );

    // PUT /api/drone-commands/:id/fail - 標記指令失敗
    this.router.put(this.ROUTES.FAIL,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.failCommand(req, res, next)
    );

    // PUT /api/drone-commands/:id/cancel - 取消指令
    this.router.put(this.ROUTES.CANCEL,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.cancelCommand(req, res, next)
    );

    // POST /api/drone-commands/:id/retry - 重試失敗指令
    this.router.post(this.ROUTES.RETRY,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.retryFailedCommand(req, res, next)
    );
  };

  /**
   * 設定統計路由
   */
  private setupStatisticsRoutes = (): void => {
    // GET /api/drone-commands/statistics - 獲取指令統計
    this.router.get(this.ROUTES.STATISTICS,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.getCommandStatistics(req, res, next)
    );

    // GET /api/drone-commands/statistics/types - 獲取指令類型統計
    this.router.get(this.ROUTES.TYPE_STATISTICS,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.getCommandTypeStatistics(req, res, next)
    );

    // GET /api/drone-commands/summary/:droneId - 獲取無人機指令摘要
    this.router.get(this.ROUTES.SUMMARY,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.getDroneCommandSummary(req, res, next)
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
 * 匯出無人機指令路由實例
 */
export const droneCommandRoutes = new DroneCommandRoutes().getRouter();