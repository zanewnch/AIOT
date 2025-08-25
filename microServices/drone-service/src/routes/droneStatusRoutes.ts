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
import { TYPES } from '../container/types.js';
import { Logger, LogRoute } from '../decorators/LoggerDecorator.js';

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
        @inject(TYPES.DroneStatusQueriesController) private readonly droneStatusQueries: IDroneStatusQueries,
        @inject(TYPES.DroneStatusCommandsController) private readonly droneStatusCommands: IDroneStatusCommands,
        @inject(TYPES.DroneRealTimeStatusQueriesController) private readonly droneRealTimeStatusQueries: IDroneRealTimeStatusQueries,
        @inject(TYPES.DroneRealTimeStatusCommandsController) private readonly droneRealTimeStatusCommands: IDroneRealTimeStatusCommands,
        @inject(TYPES.DroneStatusArchiveQueriesController) private readonly droneStatusArchiveQueries: IDroneStatusArchiveQueries,
        @inject(TYPES.DroneStatusArchiveCommandsController) private readonly droneStatusArchiveCommands: IDroneStatusArchiveCommands
    ) {
        this.router = Router();
        this.setupRoutes();
    }

    /**
     * 設定所有路由
     */
    private setupRoutes(): void {
        // 先設定更具體的路由，避免被通配符路由攔截
        this.setupArchiveRoutes();
        this.setupRealtimeRoutes();
        this.setupQueryRoutes();
        this.setupCommandRoutes();
    }

    /**
     * 設定查詢路由 (GET 操作)
     */
    private setupQueryRoutes(): void {
        // === 分頁查詢路由 ===
        // 分頁查詢所有無人機狀態
        this.router.get('/data/paginated', (req, res, next) => this.droneStatusQueries.getAllStatusesPaginated(req, res));

        // 根據狀態分頁查詢
        this.router.get('/data/status/:status/paginated', (req, res, next) => this.droneStatusQueries.getStatusesByStatusPaginated(req, res));

        // 根據無人機 ID 分頁查詢狀態
        this.router.get('/data/drone/:droneId/paginated', (req, res, next) => this.droneStatusQueries.getStatusesByDroneIdPaginated(req, res));
    }

    /**
     * 設定命令路由 (POST, PUT, DELETE 操作)
     */
    private setupCommandRoutes(): void {
        // 建立新的無人機狀態記錄
        this.router.post('/', (req, res, next) => this.droneStatusCommands.createDroneStatus(req, res));

        // 批次建立無人機狀態記錄
        this.router.post('/batch', (req, res, next) => this.droneStatusCommands.bulkCreateDroneStatuses(req, res));

        // 更新無人機狀態
        this.router.put('/:id', (req, res, next) => this.droneStatusCommands.updateDroneStatus(req, res));

        // 刪除無人機狀態記錄
        this.router.delete('/:id', (req, res, next) => this.droneStatusCommands.deleteDroneStatus(req, res));

        // 清空指定無人機的所有狀態記錄
        this.router.delete('/drone/:droneId', (req, res, next) => this.droneStatusCommands.clearStatusesByDroneId(req, res));
    }

    /**
     * 設定即時狀態路由
     */
    private setupRealtimeRoutes(): void {
        // === 分頁查詢即時狀態路由 ===
        // 分頁查詢所有無人機的即時狀態
        this.router.get('/realtime/data/paginated', (req, res, next) => this.droneRealTimeStatusQueries.getAllRealTimeStatusesPaginated(req, res));

        // 根據無人機 ID 分頁查詢即時狀態
        this.router.get('/realtime/data/drone/:droneId/paginated', (req, res, next) => this.droneRealTimeStatusQueries.getRealTimeStatusesByDroneIdPaginated(req, res));

        // 根據狀態分頁查詢即時狀態
        this.router.get('/realtime/data/status/:status/paginated', (req, res, next) => this.droneRealTimeStatusQueries.getRealTimeStatusesByStatusPaginated(req, res));

        // 根據連線狀態分頁查詢
        this.router.get('/realtime/data/connection/:connection/paginated', (req, res, next) => this.droneRealTimeStatusQueries.getRealTimeStatusesByConnectionPaginated(req, res));

        // === 命令操作路由 ===
        // 更新即時狀態
        this.router.put('/realtime/:droneId', (req, res, next) => this.droneRealTimeStatusCommands.updateRealTimeStatus(req, res));

        // 廣播訊息
        this.router.post('/realtime/broadcast', (req, res, next) => this.droneRealTimeStatusCommands.broadcastMessage(req, res));

        // 發送通知
        this.router.post('/realtime/notify/:droneId', (req, res, next) => this.droneRealTimeStatusCommands.sendNotification(req, res));

        // 斷開無人機連線
        this.router.delete('/realtime/:droneId', (req, res, next) => this.droneRealTimeStatusCommands.disconnectDrone(req, res));
    }

    /**
     * 設定歷史歸檔路由
     */
    private setupArchiveRoutes(): void {
        // === 分頁查詢歷史狀態記錄 ===
        // 分頁查詢所有歷史狀態記錄
        this.router.get('/archive/data/paginated', (req, res, next) => this.droneStatusArchiveQueries.getAllStatusArchivesPaginated(req, res));

        // 根據無人機 ID 分頁查詢歷史狀態
        this.router.get('/archive/data/drone/:droneId/paginated', (req, res, next) => this.droneStatusArchiveQueries.getStatusArchivesByDroneIdPaginated(req, res));

        // 根據狀態分頁查詢歷史記錄
        this.router.get('/archive/data/status/:status/paginated', (req, res, next) => this.droneStatusArchiveQueries.getStatusArchivesByStatusPaginated(req, res));

        // 根據時間範圍分頁查詢歷史狀態
        this.router.get('/archive/data/date-range/paginated', (req, res, next) => this.droneStatusArchiveQueries.getStatusArchivesByDateRangePaginated(req, res));

        // === 命令操作路由 ===
        // 歸檔狀態記錄
        this.router.post('/archive', (req, res, next) => this.droneStatusArchiveCommands.archiveStatus(req, res));

        // 批次歸檔狀態記錄
        this.router.post('/archive/batch', (req, res, next) => this.droneStatusArchiveCommands.bulkArchiveStatuses(req, res));

        // 刪除歷史狀態記錄
        this.router.delete('/archive/:id', (req, res, next) => this.droneStatusArchiveCommands.deleteArchivedStatus(req, res));

        // 清理舊的歷史狀態記錄
        this.router.delete('/archive/cleanup', (req, res, next) => this.droneStatusArchiveCommands.cleanupOldArchives(req, res));
    }

    /**
     * 獲取路由器實例
     */
    getRouter(): Router {
        return this.router;
    }
}