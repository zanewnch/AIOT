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
import { TYPES } from '../container/types.js';
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
        // 先設定更具體的路由，避免被通配符路由攔截
        this.setupQueueRoutes();
        this.setupArchiveRoutes();
        this.setupQueryRoutes();
        this.setupCommandRoutes();
    }

    /**
     * 設定查詢路由 (GET 操作)
     */
    private setupQueryRoutes(): void {
        // === 分頁查詢路由 ===
        // 分頁查詢所有無人機命令
        this.router.get('/data/paginated', (req, res, next) => this.droneCommandQueries.getAllCommandsPaginated(req, res));

        // 根據無人機 ID 分頁查詢命令
        this.router.get('/data/drone/:droneId/paginated', (req, res, next) => this.droneCommandQueries.getCommandsByDroneIdPaginated(req, res));

        // 根據狀態分頁查詢命令
        this.router.get('/data/status/:status/paginated', (req, res, next) => this.droneCommandQueries.getCommandsByStatusPaginated(req, res));
    }

    /**
     * 設定命令佇列路由
     */
    private setupQueueRoutes(): void {
        // === 分頁查詢路由 ===
        // 分頁查詢所有命令佇列
        this.router.get('/queue/data/paginated', (req, res, next) => this.droneCommandQueueQueries.getAllDroneCommandQueuesPaginated(req, res));

        // 根據無人機 ID 分頁查詢佇列
        this.router.get('/queue/data/drone/:droneId/paginated', (req, res, next) => this.droneCommandQueueQueries.getDroneCommandQueuesByDroneIdPaginated(req, res));

        // 根據狀態分頁查詢佇列
        this.router.get('/queue/data/status/:status/paginated', (req, res, next) => this.droneCommandQueueQueries.getDroneCommandQueuesByStatusPaginated(req, res));

        // 根據優先級分頁查詢佇列
        this.router.get('/queue/data/priority/:priority/paginated', (req, res, next) => this.droneCommandQueueQueries.getDroneCommandQueuesByPriorityPaginated(req, res));

        // === 命令操作路由 ===
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
        // === 分頁查詢路由 ===
        // 分頁查詢所有歷史歸檔
        this.router.get('/archive/data/paginated', (req, res, next) => this.droneCommandsArchiveQueries.getAllCommandsArchivePaginated(req, res));

        // 根據無人機 ID 分頁查詢歷史歸檔
        this.router.get('/archive/data/drone/:droneId/paginated', (req, res, next) => this.droneCommandsArchiveQueries.getCommandsArchiveByDroneIdPaginated(req, res));

        // 根據指令類型分頁查詢歷史歸檔
        this.router.get('/archive/data/command-type/:commandType/paginated', (req, res, next) => this.droneCommandsArchiveQueries.getCommandsArchiveByCommandTypePaginated(req, res));

        // 根據狀態分頁查詢歷史歸檔
        this.router.get('/archive/data/status/:status/paginated', (req, res, next) => this.droneCommandsArchiveQueries.getCommandsArchiveByStatusPaginated(req, res));

        // === 命令操作路由 ===
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