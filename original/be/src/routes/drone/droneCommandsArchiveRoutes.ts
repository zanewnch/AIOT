/**
 * @fileoverview 無人機指令歷史歸檔路由配置
 *
 * 此文件定義了無人機指令歷史歸檔相關的路由端點，包括：
 * - 指令歷史資料查詢和管理  
 * - 根據無人機、時間、類型、狀態查詢
 * - 指令執行記錄和分析
 *
 * 提供完整的無人機指令歷史追蹤和分析功能，包含歷史記錄和執行統計。
 * 所有端點都需要 JWT 認證。
 *
 * @module Routes/DroneCommandsArchiveRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express';
import { DroneCommandsArchiveQueries } from '../../controllers/queries/DroneCommandsArchiveQueriesCtrl.js';
import { DroneCommandsArchiveCommands } from '../../controllers/commands/DroneCommandsArchiveCommandsCtrl.js';
import { AuthMiddleware } from '../../middlewares/AuthMiddleware.js';
import { container } from '../../container/container.js';
import { TYPES } from '../../types/container/dependency-injection.js';

/**
 * 無人機指令歷史歸檔路由類別
 *
 * 負責配置和管理所有無人機指令歷史歸檔相關的路由端點
 * 使用 CQRS 模式分離查詢和命令操作
 */
class DroneCommandsArchiveRoutes {
  private router: Router;
  private queryController: DroneCommandsArchiveQueries;
  private commandController: DroneCommandsArchiveCommands;
  private authMiddleware: AuthMiddleware;

  // 路由端點常數 - 集中管理所有 API 路徑
  private readonly ROUTES = {
    // 基本 CRUD
    DATA: '/api/drone-commands-archive/data',
    DATA_BY_ID: '/api/drone-commands-archive/data/:id',
    
    // 查詢功能
    BY_DRONE_ID: '/api/drone-commands-archive/data/drone/:droneId',
    BY_TIME_RANGE: '/api/drone-commands-archive/data/time-range',
    BY_COMMAND_TYPE: '/api/drone-commands-archive/data/command-type/:commandType',
    BY_STATUS: '/api/drone-commands-archive/data/status/:status'
  } as const;

  constructor() {
    this.router = Router();
    this.queryController = container.get<DroneCommandsArchiveQueries>(TYPES.DroneCommandsArchiveQueriesCtrl);
    this.commandController = container.get<DroneCommandsArchiveCommands>(TYPES.DroneCommandsArchiveCommandsCtrl);
    this.authMiddleware = new AuthMiddleware();
    
    this.setupCrudRoutes();
    this.setupQueryRoutes();
  }

  /**
   * 設定基本 CRUD 路由
   */
  private setupCrudRoutes = (): void => {
    // GET /api/drone-commands-archive/data - 獲取所有指令歷史歸檔 (查詢操作)
    this.router.get(this.ROUTES.DATA,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getAllCommandsArchive(req, res, next)
    );

    // GET /api/drone-commands-archive/data/:id - 根據 ID 獲取指令歷史歸檔 (查詢操作)
    this.router.get(this.ROUTES.DATA_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getCommandArchiveById(req, res, next)
    );

    // POST /api/drone-commands-archive/data - 創建指令歷史歸檔記錄 (命令操作)
    this.router.post(this.ROUTES.DATA,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.createCommandArchive(req, res, next)
    );

    // PUT /api/drone-commands-archive/data/:id - 更新指令歷史歸檔資料 (命令操作)
    this.router.put(this.ROUTES.DATA_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.updateCommandArchive(req, res, next)
    );

    // DELETE /api/drone-commands-archive/data/:id - 刪除指令歷史歸檔資料 (命令操作)
    this.router.delete(this.ROUTES.DATA_BY_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.commandController.deleteCommandArchive(req, res, next)
    );
  };

  /**
   * 設定查詢路由
   */
  private setupQueryRoutes = (): void => {
    // GET /api/drone-commands-archive/data/drone/:droneId - 根據無人機 ID 查詢指令歷史歸檔 (查詢操作)
    this.router.get(this.ROUTES.BY_DRONE_ID,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getCommandArchivesByDroneId(req, res, next)
    );

    // GET /api/drone-commands-archive/data/time-range - 根據時間範圍查詢指令歷史歸檔 (查詢操作)
    this.router.get(this.ROUTES.BY_TIME_RANGE,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getCommandArchivesByTimeRange(req, res, next)
    );

    // GET /api/drone-commands-archive/data/command-type/:commandType - 根據指令類型查詢歷史歸檔 (查詢操作)
    this.router.get(this.ROUTES.BY_COMMAND_TYPE,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getCommandArchivesByType(req, res, next)
    );

    // GET /api/drone-commands-archive/data/status/:status - 根據指令狀態查詢歷史歸檔 (查詢操作)
    this.router.get(this.ROUTES.BY_STATUS,
      this.authMiddleware.authenticate,
      (req, res, next) => this.queryController.getCommandArchivesByStatus(req, res, next)
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
 * 匯出無人機指令歷史歸檔路由實例
 */
export const droneCommandsArchiveRoutes = new DroneCommandsArchiveRoutes().getRouter();