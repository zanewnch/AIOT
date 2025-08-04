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
import { DroneCommandController } from '../controllers/DroneCommandController.js';
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js';

/**
 * 無人機指令路由類別
 *
 * 負責配置和管理所有無人機指令相關的路由端點
 */
class DroneCommandRoutes {
  private router: Router;
  private commandController: DroneCommandController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.commandController = new DroneCommandController();
    this.authMiddleware = new AuthMiddleware();
    
    // 直接在 constructor 中設定所有路由
    
    // TODO: selectAll 和 selectPagination 功能 (待 controller 實作)
    // this.router.get('/api/drone-commands/all', this.authMiddleware.authenticate, this.commandController.selectAll);
    // this.router.get('/api/drone-commands/pagination', this.authMiddleware.authenticate, this.commandController.selectPagination);
    
    // 基本 CRUD 操作
    this.router.get('/api/drone-commands/data', this.authMiddleware.authenticate, this.commandController.getAllCommands);
    this.router.get('/api/drone-commands/data/:id', this.authMiddleware.authenticate, this.commandController.getCommandById);
    this.router.post('/api/drone-commands/data', this.authMiddleware.authenticate, this.commandController.createCommand);
    this.router.post('/api/drone-commands/data/batch', this.authMiddleware.authenticate, this.commandController.createBatchCommands);
    this.router.put('/api/drone-commands/data/:id', this.authMiddleware.authenticate, this.commandController.updateCommand);
    this.router.delete('/api/drone-commands/data/:id', this.authMiddleware.authenticate, this.commandController.deleteCommand);

    // 查詢功能
    this.router.get('/api/drone-commands/data/drone/:droneId', this.authMiddleware.authenticate, this.commandController.getCommandsByDroneId);
    this.router.get('/api/drone-commands/data/status/:status', this.authMiddleware.authenticate, this.commandController.getCommandsByStatus);
    this.router.get('/api/drone-commands/data/type/:type', this.authMiddleware.authenticate, this.commandController.getCommandsByType);
    this.router.get('/api/drone-commands/data/issued-by/:userId', this.authMiddleware.authenticate, this.commandController.getCommandsByIssuedBy);
    this.router.get('/api/drone-commands/data/date-range', this.authMiddleware.authenticate, this.commandController.getCommandsByDateRange);
    this.router.get('/api/drone-commands/data/drone/:droneId/pending', this.authMiddleware.authenticate, this.commandController.getPendingCommandsByDroneId);
    this.router.get('/api/drone-commands/data/drone/:droneId/executing', this.authMiddleware.authenticate, this.commandController.getExecutingCommandByDroneId);
    this.router.get('/api/drone-commands/data/latest', this.authMiddleware.authenticate, this.commandController.getLatestCommands);
    this.router.get('/api/drone-commands/data/failed', this.authMiddleware.authenticate, this.commandController.getFailedCommands);

    // 指令發送功能
    this.router.post('/api/drone-commands/send/takeoff', this.authMiddleware.authenticate, this.commandController.sendTakeoffCommand);
    this.router.post('/api/drone-commands/send/land', this.authMiddleware.authenticate, this.commandController.sendLandCommand);
    this.router.post('/api/drone-commands/send/move', this.authMiddleware.authenticate, this.commandController.sendMoveCommand);
    this.router.post('/api/drone-commands/send/hover', this.authMiddleware.authenticate, this.commandController.sendHoverCommand);
    this.router.post('/api/drone-commands/send/return', this.authMiddleware.authenticate, this.commandController.sendReturnCommand);

    // 指令狀態管理
    this.router.put('/api/drone-commands/:id/execute', this.authMiddleware.authenticate, this.commandController.executeCommand);
    this.router.put('/api/drone-commands/:id/complete', this.authMiddleware.authenticate, this.commandController.completeCommand);
    this.router.put('/api/drone-commands/:id/fail', this.authMiddleware.authenticate, this.commandController.failCommand);
    this.router.put('/api/drone-commands/:id/cancel', this.authMiddleware.authenticate, this.commandController.cancelCommand);
    this.router.post('/api/drone-commands/:id/retry', this.authMiddleware.authenticate, this.commandController.retryFailedCommand);

    // 統計和分析功能
    this.router.get('/api/drone-commands/statistics', this.authMiddleware.authenticate, this.commandController.getCommandStatistics);
    this.router.get('/api/drone-commands/statistics/types', this.authMiddleware.authenticate, this.commandController.getCommandTypeStatistics);
    this.router.get('/api/drone-commands/summary/:droneId', this.authMiddleware.authenticate, this.commandController.getDroneCommandSummary);
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
 * 匯出無人機指令路由實例
 */
export const droneCommandRoutes = new DroneCommandRoutes().getRouter();