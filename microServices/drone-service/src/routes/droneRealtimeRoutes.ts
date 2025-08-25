/**
 * @fileoverview 無人機即時狀態路由配置類別
 * 
 * 處理無人機即時狀態相關的 HTTP API 路由，專門用於 WebSocket 和即時通訊：
 * - Real-time Status: 即時狀態監控
 * - Live Updates: 即時更新推送
 * - Connection Management: 連線管理
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Router } from 'express';
import type { IDroneRealTimeStatusQueries } from '../types/controllers/queries/IDroneRealTimeStatusQueries.js';
import type { IDroneRealTimeStatusCommands } from '../types/controllers/commands/IDroneRealTimeStatusCommands.js';
import { TYPES } from '../container/types.js';
import { Logger, LogRoute } from '../decorators/LoggerDecorator.js';

/**
 * 無人機即時狀態路由類別
 * 
 * 使用 IoC 容器管理依賴注入，提供無人機即時狀態相關的所有 HTTP API 端點
 * 
 * @class DroneRealtimeRoutes
 */
@injectable()
export class DroneRealtimeRoutes {
    private readonly router: Router;

    constructor(
        @inject(TYPES.DroneRealTimeStatusQueriesController) private readonly droneRealTimeStatusQueries: IDroneRealTimeStatusQueries,
        @inject(TYPES.DroneRealTimeStatusCommandsController) private readonly droneRealTimeStatusCommands: IDroneRealTimeStatusCommands
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
    }

    /**
     * 設定即時狀態查詢路由 (GET 操作)
     */
    private setupQueryRoutes(): void {
        // === 分頁查詢即時狀態路由 ===
        // 分頁查詢所有無人機的即時狀態
        this.router.get('/status/paginated', (req, res, next) => this.droneRealTimeStatusQueries.getAllRealTimeStatusesPaginated(req, res));

        // 根據無人機 ID 分頁查詢即時狀態
        this.router.get('/status/drone/:droneId/paginated', (req, res, next) => this.droneRealTimeStatusQueries.getRealTimeStatusesByDroneIdPaginated(req, res));

        // 根據狀態分頁查詢即時狀態
        this.router.get('/status/status/:status/paginated', (req, res, next) => this.droneRealTimeStatusQueries.getRealTimeStatusesByStatusPaginated(req, res));

        // 根據連線狀態分頁查詢
        this.router.get('/status/connection/:connection/paginated', (req, res, next) => this.droneRealTimeStatusQueries.getRealTimeStatusesByConnectionPaginated(req, res));
    }

    /**
     * 設定即時狀態命令路由 (POST, PUT, DELETE 操作)
     */
    private setupCommandRoutes(): void {
        // 更新即時狀態
        this.router.put('/status/:droneId', (req, res, next) => this.droneRealTimeStatusCommands.updateRealTimeStatus(req, res, next));

        // 廣播訊息到所有連線的無人機
        this.router.post('/broadcast', (req, res, next) => this.droneRealTimeStatusCommands.broadcastMessage(req, res));

        // 發送通知到指定無人機
        this.router.post('/notify/:droneId', (req, res, next) => this.droneRealTimeStatusCommands.sendNotification(req, res));

        // 強制斷開無人機連線
        this.router.delete('/connections/:droneId', (req, res, next) => this.droneRealTimeStatusCommands.disconnectDrone(req, res));
    }

    /**
     * 獲取路由器實例
     */
    getRouter(): Router {
        return this.router;
    }
}