/**
 * @fileoverview 無人機位置路由配置類別
 * 
 * 處理無人機位置相關的 HTTP API 路由，採用 CQRS 模式：
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
import type { IDronePositionQueries } from '../types/controllers/queries/IDronePositionQueries.js';
import type { IDronePositionCommands } from '../types/controllers/commands/IDronePositionCommands.js';
import type { IDronePositionsArchiveQueries } from '../types/controllers/queries/IDronePositionsArchiveQueries.js';
import type { IDronePositionsArchiveCommands } from '../types/controllers/commands/IDronePositionsArchiveCommands.js';
import { TYPES } from '../container/types.js';
import { Logger, LogRoute } from '../decorators/LoggerDecorator.js';
import { ApiGatewayHeadersMiddleware } from '../middleware/ApiGatewayHeadersMiddleware.js';

/**
 * 無人機位置路由類別
 * 
 * 使用 IoC 容器管理依賴注入，提供無人機位置相關的所有 HTTP API 端點
 * 
 * @class DronePositionRoutes
 */
@injectable()
export class DronePositionRoutes {
    private readonly router: Router;

    constructor(
        @inject(TYPES.DronePositionQueriesCtrl) private readonly dronePositionQueries: IDronePositionQueries,
        @inject(TYPES.DronePositionCommandsCtrl) private readonly dronePositionCommands: IDronePositionCommands,
        @inject(TYPES.DronePositionsArchiveQueriesCtrl) private readonly dronePositionsArchiveQueries: IDronePositionsArchiveQueries,
        @inject(TYPES.DronePositionsArchiveCommandsCtrl) private readonly dronePositionsArchiveCommands: IDronePositionsArchiveCommands
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
        this.setupQueryRoutes();
        this.setupCommandRoutes();
    }

    /**
     * 設定查詢路由 (GET 操作)
     * 使用 API Gateway Headers 中間件獲取用戶信息，由 Express.js Gateway 處理權限驗證
     */
    private setupQueryRoutes(): void {
        // 獲取所有無人機位置 - 權限由 Express.js Gateway 處理
        this.router.get('/', 
            ApiGatewayHeadersMiddleware.extractUserInfo,
            (req, res, next) => this.dronePositionQueries.getAllDronePositions(req, res, next)
        );

        // 根據無人機 ID 獲取最新位置 - 權限由 API Gateway + JWT 處理
        this.router.get('/latest/:droneId', 
            ApiGatewayHeadersMiddleware.extractUserInfo,
            (req, res, next) => this.dronePositionQueries.getLatestDronePosition(req, res, next)
        );

        // 根據無人機 ID 獲取位置資料 - 權限由 API Gateway + JWT 處理
        this.router.get('/drone/:droneId', 
            ApiGatewayHeadersMiddleware.extractUserInfo,
            (req, res, next) => this.dronePositionQueries.getDronePositionsByDroneId(req, res, next)
        );

        // 根據時間範圍獲取位置資料 - 權限由 API Gateway + JWT 處理
        this.router.get('/time-range', 
            ApiGatewayHeadersMiddleware.extractUserInfo,
            (req, res, next) => this.dronePositionQueries.getDronePositionsByTimeRange(req, res, next)
        );

        // 根據 ID 獲取無人機位置 - 權限由 API Gateway + JWT 處理
        this.router.get('/:id', 
            ApiGatewayHeadersMiddleware.extractUserInfo,
            (req, res, next) => this.dronePositionQueries.getDronePositionById(req, res, next)
        );
    }

    /**
     * 設定歸檔路由
     */
    private setupArchiveRoutes(): void {
        // 獲取所有歷史位置記錄
        this.router.get('/archive', (req, res, next) => this.dronePositionsArchiveQueries.getAllPositionArchives(req, res, next));

        // 根據無人機 ID 獲取歷史位置
        this.router.get('/archive/drone/:droneId', (req, res, next) => this.dronePositionsArchiveQueries.getPositionArchivesByDroneId(req, res, next));

        // 根據時間範圍獲取歷史位置
        this.router.get('/archive/time-range', (req, res, next) => this.dronePositionsArchiveQueries.getPositionArchivesByTimeRange(req, res, next));

        // 獲取軌跡資料
        this.router.get('/archive/trajectory', (req, res, next) => this.dronePositionsArchiveQueries.getTrajectoryByDroneAndTime(req, res, next));

        // 根據 ID 獲取歷史位置詳情
        this.router.get('/archive/:id', (req, res, next) => this.dronePositionsArchiveQueries.getPositionArchiveById(req, res, next));

        // 建立歷史位置記錄
        this.router.post('/archive', (req, res, next) => this.dronePositionsArchiveCommands.createPositionArchive(req, res, next));

        // 批次建立歷史位置記錄
        this.router.post('/archive/batch', (req, res, next) => this.dronePositionsArchiveCommands.bulkCreatePositionArchives(req, res, next));

        // 刪除指定歷史位置記錄
        this.router.delete('/archive/:id', (req, res, next) => this.dronePositionsArchiveCommands.deletePositionArchive(req, res, next));

        // 清理舊的歷史位置記錄
        this.router.delete('/archive/cleanup', (req, res, next) => this.dronePositionsArchiveCommands.deleteArchivesBeforeDate(req, res, next));
    }

    /**
     * 設定命令路由 (POST, PUT, DELETE 操作)
     */
    private setupCommandRoutes(): void {
        // 注意：命令相關的路由會在實現相關控制器後新增
        // 目前 DronePositionCommands 控制器可能尚未實現這些方法
    }

    /**
     * 獲取路由器實例
     */
    getRouter(): Router {
        return this.router;
    }
}