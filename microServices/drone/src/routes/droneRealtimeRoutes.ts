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
import { TYPES } from '../types/dependency-injection.js';
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
        @inject(TYPES.DroneRealTimeStatusQueriesCtrl) private readonly droneRealTimeStatusQueries: IDroneRealTimeStatusQueries,
        @inject(TYPES.DroneRealTimeStatusCommandsCtrl) private readonly droneRealTimeStatusCommands: IDroneRealTimeStatusCommands
    ) {
        this.router = Router();
        this.setupRoutes();
    }

    /**
     * 設定所有路由
     */
    @LogRoute()
    private setupRoutes(): void {
        this.setupQueryRoutes();
        this.setupCommandRoutes();
    }

    /**
     * 設定即時狀態查詢路由 (GET 操作)
     */
    @LogRoute()
    private setupQueryRoutes(): void {
        // 獲取所有無人機的即時狀態總覽
        this.router.get('/status', (req, res, next) => this.droneRealTimeStatusQueries.getAllRealTimeStatuses(req, res, next));

        // 根據無人機 ID 獲取即時狀態
        this.router.get('/status/:droneId', (req, res, next) => this.droneRealTimeStatusQueries.getRealTimeStatusByDroneId(req, res, next));

        // 獲取連線狀態
        this.router.get('/connections', (req, res, next) => this.droneRealTimeStatusQueries.getConnectionStatuses(req, res, next));

        // 獲取即時狀態統計
        this.router.get('/statistics', (req, res, next) => this.droneRealTimeStatusQueries.getRealTimeStatusStatistics(req, res, next));
    }

    /**
     * 設定即時狀態命令路由 (POST, PUT, DELETE 操作)
     */
    @LogRoute()
    private setupCommandRoutes(): void {
        // 更新即時狀態
        this.router.put('/status/:droneId', (req, res, next) => this.droneRealTimeStatusCommands.updateRealTimeStatus(req, res, next));

        // 廣播訊息到所有連線的無人機
        this.router.post('/broadcast', (req, res, next) => this.droneRealTimeStatusCommands.broadcastMessage(req, res, next));

        // 發送通知到指定無人機
        this.router.post('/notify/:droneId', (req, res, next) => this.droneRealTimeStatusCommands.sendNotification(req, res, next));

        // 強制斷開無人機連線
        this.router.delete('/connections/:droneId', (req, res, next) => this.droneRealTimeStatusCommands.disconnectDrone(req, res, next));
    }

    /**
     * 獲取路由器實例
     */
    @LogRoute()
    getRouter(): Router {
        return this.router;
    }
}