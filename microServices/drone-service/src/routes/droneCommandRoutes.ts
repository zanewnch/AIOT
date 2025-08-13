/**
 * @fileoverview 無人機命令路由配置類別
 * 
 * 處理無人機命令相關的 HTTP API 路由，採用 CQRS 模式：
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
import type { IDroneCommandQueries } from '../types/controllers/queries/IDroneCommandQueries.js';
import type { IDroneCommandCommands } from '../types/controllers/commands/IDroneCommandCommands.js';
import type { IDroneCommandQueueQueries } from '../types/controllers/queries/IDroneCommandQueueQueries.js';
import type { IDroneCommandQueueCommands } from '../types/controllers/commands/IDroneCommandQueueCommands.js';
import type { IDroneCommandsArchiveQueries } from '../types/controllers/queries/IDroneCommandsArchiveQueries.js';
import type { IDroneCommandsArchiveCommands } from '../types/controllers/commands/IDroneCommandsArchiveCommands.js';
import { TYPES } from '../types/dependency-injection.js';
import { Logger, LogRoute } from '../decorators/LoggerDecorator.js';

/**
 * 無人機命令路由類別
 * 
 * 使用 IoC 容器管理依賴注入，提供無人機命令相關的所有 HTTP API 端點
 * 
 * @class DroneCommandRoutes
 */
@injectable()
export class DroneCommandRoutes {
    private readonly router: Router;

    constructor(
        @inject(TYPES.DroneCommandQueriesCtrl) private readonly droneCommandQueries: IDroneCommandQueries,
        @inject(TYPES.DroneCommandCommandsCtrl) private readonly droneCommandCommands: IDroneCommandCommands,
        @inject(TYPES.DroneCommandQueueQueriesCtrl) private readonly droneCommandQueueQueries: IDroneCommandQueueQueries,
        @inject(TYPES.DroneCommandQueueCommandsCtrl) private readonly droneCommandQueueCommands: IDroneCommandQueueCommands,
        @inject(TYPES.DroneCommandsArchiveQueriesCtrl) private readonly droneCommandsArchiveQueries: IDroneCommandsArchiveQueries,
        @inject(TYPES.DroneCommandsArchiveCommandsCtrl) private readonly droneCommandsArchiveCommands: IDroneCommandsArchiveCommands
    ) {
        this.router = Router();
        this.setupRoutes();
    }

    /**
     * 設定所有路由
     */
    private setupRoutes(): void {
        this.setupQueryRoutes();
        this.setupQueueRoutes();
        this.setupArchiveRoutes();
        this.setupCommandRoutes();
    }

    /**
     * 設定查詢路由 (GET 操作)
     */
    private setupQueryRoutes(): void {
        // 獲取所有無人機命令
        this.router.get('/', (req, res, next) => this.droneCommandQueries.getAllCommands(req, res, next));

        // 獲取無人機命令資料（用於前端表格顯示）
        this.router.get('/data', (req, res, next) => this.droneCommandQueries.getAllCommands(req, res, next));

        // 根據 ID 獲取無人機命令
        this.router.get('/:id', (req, res, next) => this.droneCommandQueries.getCommandById(req, res, next));
    }

    /**
     * 設定命令佇列路由
     */
    private setupQueueRoutes(): void {
        // 獲取命令佇列統計
        this.router.get('/queue', (req, res, next) => this.droneCommandQueueQueries.getQueueStatistics(req, res, next));

        // 獲取待執行的命令佇列
        this.router.get('/queue/pending', (req, res, next) => this.droneCommandQueueQueries.getPendingDroneCommandQueues(req, res, next));

        // 新增命令到佇列
        this.router.post('/queue', (req, res, next) => this.droneCommandQueueCommands.enqueueDroneCommand(req, res, next));

        // 處理佇列中的下一個命令
        this.router.post('/queue/process-next/:droneId', (req, res, next) => this.droneCommandQueueCommands.dequeueDroneCommand(req, res, next));

        // 清空命令佇列
        this.router.delete('/queue/:droneId', (req, res, next) => this.droneCommandQueueCommands.clearDroneCommandQueue(req, res, next));
    }

    /**
     * 設定歷史命令路由
     */
    private setupArchiveRoutes(): void {
        // 獲取歷史命令記錄
        this.router.get('/archive', (req, res, next) => this.droneCommandsArchiveQueries.getAllCommandsArchive(req, res, next));

        // 根據 ID 獲取歷史命令詳情
        this.router.get('/archive/:id', (req, res, next) => this.droneCommandsArchiveQueries.getCommandArchiveById(req, res, next));

        // 歸檔指定命令
        this.router.post('/archive', (req, res, next) => this.droneCommandsArchiveCommands.createCommandArchive(req, res, next));

        // 批次歸檔命令
        this.router.post('/archive/batch', (req, res, next) => this.droneCommandsArchiveCommands.createCommandArchive(req, res, next));
    }

    /**
     * 設定命令路由 (POST, PUT, DELETE 操作)
     */
    private setupCommandRoutes(): void {
        // 建立新的無人機命令
        this.router.post('/', (req, res, next) => this.droneCommandCommands.createCommand(req, res, next));

        // 更新無人機命令
        this.router.put('/:id', (req, res, next) => this.droneCommandCommands.updateCommand(req, res, next));

        // 刪除無人機命令
        this.router.delete('/:id', (req, res, next) => this.droneCommandCommands.deleteCommand(req, res, next));

        // 執行無人機命令
        this.router.post('/:id/execute', (req, res, next) => this.droneCommandCommands.executeCommand(req, res, next));

        // 取消無人機命令
        this.router.post('/:id/cancel', (req, res, next) => this.droneCommandCommands.cancelCommand(req, res, next));
    }

    /**
     * 獲取路由器實例
     */
    getRouter(): Router {
        return this.router;
    }
}