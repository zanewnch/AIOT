/**
 * @fileoverview 無人機即時狀態路由配置
 * 
 * 此文件定義所有與無人機即時狀態相關的 API 路由。
 * 提供完整的 RESTful API 端點，包括 CRUD 操作、狀態監控和統計查詢功能。
 * 使用 CQRS 模式分離查詢和命令操作。
 * 
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Router } from 'express';
import { DroneRealTimeStatusQueries } from '../../controllers/queries/DroneRealTimeStatusQueriesCtrl.js';
import { DroneRealTimeStatusCommands } from '../../controllers/commands/DroneRealTimeStatusCommandsCtrl.js';
import { AuthMiddleware } from '../../middlewares/AuthMiddleware.js';

/**
 * 無人機即時狀態路由類別
 * 
 * 負責配置和管理所有無人機即時狀態相關的路由端點
 * 使用 CQRS 模式分離查詢和命令操作
 */
class DroneRealTimeStatusRoutes {
    private router: Router;
    private queryController: DroneRealTimeStatusQueries;
    private commandController: DroneRealTimeStatusCommands;
    private authMiddleware: AuthMiddleware;

    constructor() {
        this.router = Router();
        this.queryController = new DroneRealTimeStatusQueries();
        this.commandController = new DroneRealTimeStatusCommands();
        this.authMiddleware = new AuthMiddleware();

        this.setupRoutes();
    }

    /**
     * 設定所有路由
     */
    private setupRoutes(): void {

        // ===== 基本 CRUD 操作 =====
        
        /**
         * 創建新的無人機即時狀態記錄 (命令操作)
         * POST /api/drone-real-time-status
         */
        this.router.post('/', 
            this.authMiddleware.authenticate,
            (req, res, next) => this.commandController.createRealTimeStatus(req, res, next)
        );

        /**
         * 獲取所有即時狀態記錄 (查詢操作)
         * GET /api/drone-real-time-status
         */
        this.router.get('/', 
            this.authMiddleware.authenticate,
            (req, res, next) => this.queryController.getAllRealTimeStatuses(req, res, next)
        );

        /**
         * 根據 ID 獲取即時狀態記錄 (查詢操作)
         * GET /api/drone-real-time-status/:id
         */
        this.router.get('/:id', 
            this.authMiddleware.authenticate,
            (req, res, next) => this.queryController.getRealTimeStatusById(req, res, next)
        );

        /**
         * 更新即時狀態記錄 (命令操作)
         * PUT /api/drone-real-time-status/:id
         */
        this.router.put('/:id', 
            this.authMiddleware.authenticate,
            (req, res, next) => this.commandController.updateRealTimeStatus(req, res, next)
        );

        /**
         * 刪除即時狀態記錄 (命令操作)
         * DELETE /api/drone-real-time-status/:id
         */
        this.router.delete('/:id', 
            this.authMiddleware.authenticate,
            (req, res, next) => this.commandController.deleteRealTimeStatus(req, res, next)
        );

        // ===== 無人機相關操作 =====

        /**
         * 根據無人機 ID 獲取即時狀態記錄 (查詢操作)
         * GET /api/drone-real-time-status/drone/:droneId
         */
        this.router.get('/drone/:droneId', 
            this.authMiddleware.authenticate,
            (req, res, next) => this.queryController.getRealTimeStatusByDroneId(req, res, next)
        );

        /**
         * 根據無人機 ID 更新即時狀態記錄 (命令操作)
         * PUT /api/drone-real-time-status/drone/:droneId
         */
        this.router.put('/drone/:droneId', 
            this.authMiddleware.authenticate,
            (req, res, next) => this.commandController.updateRealTimeStatusByDroneId(req, res, next)
        );

        /**
         * 根據無人機 ID 刪除即時狀態記錄 (命令操作)
         * DELETE /api/drone-real-time-status/drone/:droneId
         */
        this.router.delete('/drone/:droneId', 
            this.authMiddleware.authenticate,
            (req, res, next) => this.commandController.deleteRealTimeStatusByDroneId(req, res, next)
        );

        /**
         * Upsert 即時狀態記錄（根據無人機 ID）(命令操作)
         * POST /api/drone-real-time-status/drone/:droneId/upsert
         */
        this.router.post('/drone/:droneId/upsert', 
            this.authMiddleware.authenticate,
            (req, res, next) => this.commandController.upsertRealTimeStatus(req, res, next)
        );

        /**
         * 更新心跳包（最後連線時間）(命令操作)
         * POST /api/drone-real-time-status/drone/:droneId/heartbeat
         */
        this.router.post('/drone/:droneId/heartbeat', 
            this.authMiddleware.authenticate,
            (req, res, next) => this.commandController.updateHeartbeat(req, res, next)
        );

        /**
         * 標記無人機為離線狀態 (命令操作)
         * POST /api/drone-real-time-status/drone/:droneId/offline
         */
        this.router.post('/drone/:droneId/offline', 
            this.authMiddleware.authenticate,
            (req, res, next) => this.commandController.markDroneOffline(req, res, next)
        );

        // ===== 狀態篩選查詢 =====

        /**
         * 根據狀態獲取即時狀態記錄 (查詢操作)
         * GET /api/drone-real-time-status/status/:status
         */
        this.router.get('/status/:status', 
            this.authMiddleware.authenticate,
            (req, res, next) => this.queryController.getRealTimeStatusesByStatus(req, res, next)
        );

        /**
         * 獲取所有在線的無人機 (查詢操作)
         * GET /api/drone-real-time-status/online
         */
        this.router.get('/online', 
            this.authMiddleware.authenticate,
            (req, res, next) => this.queryController.getOnlineDrones(req, res, next)
        );

        /**
         * 獲取離線的無人機 (查詢操作)
         * GET /api/drone-real-time-status/offline
         * Query params: ?threshold=5 (離線判定時間閾值，單位分鐘)
         */
        this.router.get('/offline', 
            this.authMiddleware.authenticate,
            (req, res, next) => this.queryController.getOfflineDrones(req, res, next)
        );

        /**
         * 檢查低電量無人機 (查詢操作)
         * GET /api/drone-real-time-status/low-battery
         * Query params: ?threshold=20 (電量閾值，預設20%)
         */
        this.router.get('/low-battery', 
            this.authMiddleware.authenticate,
            (req, res, next) => this.queryController.checkLowBatteryDrones(req, res, next)
        );

        // ===== 統計和儀表板 =====

        /**
         * 獲取電池統計資訊 (查詢操作)
         * GET /api/drone-real-time-status/statistics/battery
         */
        this.router.get('/statistics/battery', 
            this.authMiddleware.authenticate,
            (req, res, next) => this.queryController.getBatteryStatistics(req, res, next)
        );

        /**
         * 獲取狀態統計資訊 (查詢操作)
         * GET /api/drone-real-time-status/statistics/status
         */
        this.router.get('/statistics/status', 
            this.authMiddleware.authenticate,
            (req, res, next) => this.queryController.getStatusStatistics(req, res, next)
        );

        /**
         * 獲取儀表板摘要資訊 (查詢操作)
         * GET /api/drone-real-time-status/dashboard/summary
         */
        this.router.get('/dashboard/summary', 
            this.authMiddleware.authenticate,
            (req, res, next) => this.queryController.getDashboardSummary(req, res, next)
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
 * 無人機即時狀態路由實例
 */
export const droneRealTimeStatusRoutes = new DroneRealTimeStatusRoutes().getRouter();

/**
 * 為了向下相容，也匯出創建函數
 * @deprecated 請使用 droneRealTimeStatusRoutes 實例
 */
export const createDroneRealTimeStatusRoutes = (): Router => {
    return new DroneRealTimeStatusRoutes().getRouter();
};