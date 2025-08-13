/**
 * @fileoverview 無人機狀態路由配置類別
 * 
 * 處理無人機狀態相關的 HTTP API 路由，採用 CQRS 模式：
 * - Query Routes: 查詢操作 (GET)
 * - Command Routes: 命令操作 (POST, PUT, DELETE)
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Router } from 'express';
import type { IDroneStatusQueries } from '../types/controllers/queries/IDroneStatusQueries.js';
import type { IDroneStatusCommands } from '../types/controllers/commands/IDroneStatusCommands.js';
import type { IDroneRealTimeStatusQueries } from '../types/controllers/queries/IDroneRealTimeStatusQueries.js';
import type { IDroneRealTimeStatusCommands } from '../types/controllers/commands/IDroneRealTimeStatusCommands.js';
import type { IDroneStatusArchiveQueries } from '../types/controllers/queries/IDroneStatusArchiveQueries.js';
import type { IDroneStatusArchiveCommands } from '../types/controllers/commands/IDroneStatusArchiveCommands.js';
import { TYPES } from '../types/dependency-injection.js';

/**
 * 無人機狀態路由類別
 * 
 * 使用 IoC 容器管理依賴注入，提供無人機狀態相關的所有 HTTP API 端點
 * 
 * @class DroneStatusRoutes
 */
@injectable()
export class DroneStatusRoutes {
    private readonly router: Router;

    constructor(
        @inject(TYPES.DroneStatusQueriesCtrl) private readonly droneStatusQueries: IDroneStatusQueries,
        @inject(TYPES.DroneStatusCommandsCtrl) private readonly droneStatusCommands: IDroneStatusCommands,
        @inject(TYPES.DroneRealTimeStatusQueriesCtrl) private readonly droneRealTimeStatusQueries: IDroneRealTimeStatusQueries,
        @inject(TYPES.DroneRealTimeStatusCommandsCtrl) private readonly droneRealTimeStatusCommands: IDroneRealTimeStatusCommands,
        @inject(TYPES.DroneStatusArchiveQueriesCtrl) private readonly droneStatusArchiveQueries: IDroneStatusArchiveQueries,
        @inject(TYPES.DroneStatusArchiveCommandsCtrl) private readonly droneStatusArchiveCommands: IDroneStatusArchiveCommands
    ) {
        this.router = Router();
        this.setupRoutes();
    }

    /**
     * 設定所有路由
     */
    private setupRoutes(): void {
        this.setupQueryRoutes();
        this.setupCommandRoutes();
        this.setupRealtimeRoutes();
        this.setupArchiveRoutes();
    }

    /**
     * 設定查詢路由 (GET 操作)
     */
    private setupQueryRoutes(): void {
        // 獲取所有無人機狀態
        this.router.get('/', (req, res, next) => this.droneStatusQueries.getAllDroneStatuses(req, res, next));

        // 獲取狀態統計資訊
        this.router.get('/statistics', (req, res, next) => this.droneStatusQueries.getDroneStatusStatistics(req, res, next));

        // 根據無人機 ID 獲取最新狀態
        this.router.get('/latest/:droneId', (req, res, next) => this.droneStatusQueries.getLatestDroneStatus(req, res, next));

        // 根據無人機 ID 獲取狀態資料
        this.router.get('/drone/:droneId', (req, res, next) => this.droneStatusQueries.getDroneStatusesByDroneId(req, res, next));

        // 根據時間範圍獲取狀態資料
        this.router.get('/time-range', (req, res, next) => this.droneStatusQueries.getDroneStatusesByTimeRange(req, res, next));

        // 根據 ID 獲取無人機狀態
        this.router.get('/:id', (req, res, next) => this.droneStatusQueries.getDroneStatusById(req, res, next));
    }

    /**
     * 設定命令路由 (POST, PUT, DELETE 操作)
     */
    private setupCommandRoutes(): void {
        // 建立新的無人機狀態記錄
        this.router.post('/', (req, res, next) => this.droneStatusCommands.createDroneStatus(req, res, next));

        // 批次建立無人機狀態記錄
        this.router.post('/batch', (req, res, next) => this.droneStatusCommands.bulkCreateDroneStatuses(req, res, next));

        // 更新無人機狀態
        this.router.put('/:id', (req, res, next) => this.droneStatusCommands.updateDroneStatus(req, res, next));

        // 刪除無人機狀態記錄
        this.router.delete('/:id', (req, res, next) => this.droneStatusCommands.deleteDroneStatus(req, res, next));

        // 清空指定無人機的所有狀態記錄
        this.router.delete('/drone/:droneId', (req, res, next) => this.droneStatusCommands.clearStatusesByDroneId(req, res, next));
    }

    /**
     * 設定即時狀態路由
     */
    private setupRealtimeRoutes(): void {
        // 獲取所有無人機的即時狀態
        this.router.get('/realtime', (req, res, next) => this.droneRealTimeStatusQueries.getAllRealTimeStatuses(req, res, next));

        // 根據無人機 ID 獲取即時狀態
        this.router.get('/realtime/:droneId', (req, res, next) => this.droneRealTimeStatusQueries.getRealTimeStatusByDroneId(req, res, next));

        // 獲取連線狀態
        this.router.get('/realtime/connections', (req, res, next) => this.droneRealTimeStatusQueries.getConnectionStatuses(req, res, next));

        // 獲取即時狀態統計
        this.router.get('/realtime/statistics', (req, res, next) => this.droneRealTimeStatusQueries.getRealTimeStatusStatistics(req, res, next));

        // 更新即時狀態
        this.router.put('/realtime/:droneId', (req, res, next) => this.droneRealTimeStatusCommands.updateRealTimeStatus(req, res, next));

        // 廣播訊息
        this.router.post('/realtime/broadcast', (req, res, next) => this.droneRealTimeStatusCommands.broadcastMessage(req, res, next));

        // 發送通知
        this.router.post('/realtime/notify/:droneId', (req, res, next) => this.droneRealTimeStatusCommands.sendNotification(req, res, next));

        // 斷開無人機連線
        this.router.delete('/realtime/:droneId', (req, res, next) => this.droneRealTimeStatusCommands.disconnectDrone(req, res, next));
    }

    /**
     * 設定歷史歸檔路由
     */
    private setupArchiveRoutes(): void {
        // 獲取所有歷史狀態記錄
        this.router.get('/archive', (req, res, next) => this.droneStatusArchiveQueries.getAllArchivedStatuses(req, res, next));

        // 根據無人機 ID 獲取歷史狀態
        this.router.get('/archive/drone/:droneId', (req, res, next) => this.droneStatusArchiveQueries.getArchivedStatusesByDroneId(req, res, next));

        // 根據時間範圍獲取歷史狀態
        this.router.get('/archive/time-range', (req, res, next) => this.droneStatusArchiveQueries.getArchivedStatusesByTimeRange(req, res, next));

        // 獲取歷史狀態統計
        this.router.get('/archive/statistics', (req, res, next) => this.droneStatusArchiveQueries.getArchivedStatusStatistics(req, res, next));

        // 根據 ID 獲取歷史狀態詳情
        this.router.get('/archive/:id', (req, res, next) => this.droneStatusArchiveQueries.getArchivedStatusById(req, res, next));

        // 歸檔狀態記錄
        this.router.post('/archive', (req, res, next) => this.droneStatusArchiveCommands.archiveStatus(req, res, next));

        // 批次歸檔狀態記錄
        this.router.post('/archive/batch', (req, res, next) => this.droneStatusArchiveCommands.bulkArchiveStatuses(req, res, next));

        // 刪除歷史狀態記錄
        this.router.delete('/archive/:id', (req, res, next) => this.droneStatusArchiveCommands.deleteArchivedStatus(req, res, next));

        // 清理舊的歷史狀態記錄
        this.router.delete('/archive/cleanup', (req, res, next) => this.droneStatusArchiveCommands.cleanupOldArchives(req, res, next));
    }

    /**
     * 獲取路由器實例
     */
    getRouter(): Router {
        return this.router;
    }
}