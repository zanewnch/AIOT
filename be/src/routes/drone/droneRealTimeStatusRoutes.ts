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
     * 創建新的無人機即時狀態記錄
     * POST /api/drone-real-time-status
     */
    router.post('/', controller.createRealTimeStatus);

    /**
     * 獲取所有即時狀態記錄
     * GET /api/drone-real-time-status
     */
    router.get('/', controller.getAllRealTimeStatuses);

    /**
     * 根據 ID 獲取即時狀態記錄
     * GET /api/drone-real-time-status/:id
     */
    router.get('/:id', controller.getRealTimeStatusById);

    /**
     * 更新即時狀態記錄
     * PUT /api/drone-real-time-status/:id
     */
    router.put('/:id', controller.updateRealTimeStatus);

    /**
     * 刪除即時狀態記錄
     * DELETE /api/drone-real-time-status/:id
     */
    router.delete('/:id', controller.deleteRealTimeStatus);

    // ===== 無人機相關操作 =====

    /**
     * 根據無人機 ID 獲取即時狀態記錄
     * GET /api/drone-real-time-status/drone/:droneId
     */
    router.get('/drone/:droneId', controller.getRealTimeStatusByDroneId);

    /**
     * 根據無人機 ID 更新即時狀態記錄
     * PUT /api/drone-real-time-status/drone/:droneId
     */
    router.put('/drone/:droneId', controller.updateRealTimeStatusByDroneId);

    /**
     * 根據無人機 ID 刪除即時狀態記錄
     * DELETE /api/drone-real-time-status/drone/:droneId
     */
    router.delete('/drone/:droneId', controller.deleteRealTimeStatusByDroneId);

    /**
     * Upsert 即時狀態記錄（根據無人機 ID）
     * POST /api/drone-real-time-status/drone/:droneId/upsert
     */
    router.post('/drone/:droneId/upsert', controller.upsertRealTimeStatus);

    /**
     * 更新心跳包（最後連線時間）
     * POST /api/drone-real-time-status/drone/:droneId/heartbeat
     */
    router.post('/drone/:droneId/heartbeat', controller.updateHeartbeat);

    /**
     * 標記無人機為離線狀態
     * POST /api/drone-real-time-status/drone/:droneId/offline
     */
    router.post('/drone/:droneId/offline', controller.markDroneOffline);

    // ===== 狀態篩選查詢 =====

    /**
     * 根據狀態獲取即時狀態記錄
     * GET /api/drone-real-time-status/status/:status
     */
    router.get('/status/:status', controller.getRealTimeStatusesByStatus);

    /**
     * 獲取所有在線的無人機
     * GET /api/drone-real-time-status/online
     */
    router.get('/online', controller.getOnlineDrones);

    /**
     * 獲取離線的無人機
     * GET /api/drone-real-time-status/offline
     * Query params: ?threshold=5 (離線判定時間閾值，單位分鐘)
     */
    router.get('/offline', controller.getOfflineDrones);

    /**
     * 檢查低電量無人機
     * GET /api/drone-real-time-status/low-battery
     * Query params: ?threshold=20 (電量閾值，預設20%)
     */
    router.get('/low-battery', controller.checkLowBatteryDrones);

    // ===== 統計和儀表板 =====

    /**
     * 獲取電池統計資訊
     * GET /api/drone-real-time-status/statistics/battery
     */
    router.get('/statistics/battery', controller.getBatteryStatistics);

    /**
     * 獲取狀態統計資訊
     * GET /api/drone-real-time-status/statistics/status
     */
    router.get('/statistics/status', controller.getStatusStatistics);

    /**
     * 獲取儀表板摘要資訊
     * GET /api/drone-real-time-status/dashboard/summary
     */
    router.get('/dashboard/summary', controller.getDashboardSummary);

    return router;
};

/**
 * 無人機即時狀態路由實例
 */
export const droneRealTimeStatusRoutes = createDroneRealTimeStatusRoutes();