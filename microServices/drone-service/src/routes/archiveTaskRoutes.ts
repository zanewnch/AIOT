/**
 * @fileoverview 歸檔任務路由配置類別
 * 
 * 處理歸檔任務相關的 HTTP API 路由，採用 CQRS 模式：
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
import type { IArchiveTaskQueries } from '../types/controllers/queries/IArchiveTaskQueries.js';
import type { IArchiveTaskCommands } from '../types/controllers/commands/IArchiveTaskCommands.js';
import { TYPES } from '../container/types.js';
import { Logger, LogRoute } from '../decorators/LoggerDecorator.js';

/**
 * 歸檔任務路由類別
 * 
 * 使用 IoC 容器管理依賴注入，提供歸檔任務相關的所有 HTTP API 端點
 * 
 * @class ArchiveTaskRoutes
 */
@injectable()
export class ArchiveTaskRoutes {
    private readonly router: Router;

    constructor(
        @inject(TYPES.ArchiveTaskQueriesController) private readonly archiveTaskQueries: IArchiveTaskQueries,
        @inject(TYPES.ArchiveTaskCommandsController) private readonly archiveTaskCommands: IArchiveTaskCommands
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
     * 設定查詢路由 (GET 操作)
     */
    private setupQueryRoutes(): void {
        // === 分頁查詢路由 ===
        // 分頁查詢所有歸檔任務
        this.router.get('/data/paginated', (req, res, next) => this.archiveTaskQueries.getAllTasksPaginated(req, res));

        // 根據狀態分頁查詢任務
        this.router.get('/data/status/:status/paginated', (req, res, next) => this.archiveTaskQueries.getTasksByStatusPaginated(req, res));

        // 根據任務類型分頁查詢
        this.router.get('/data/job-type/:jobType/paginated', (req, res, next) => this.archiveTaskQueries.getTasksByJobTypePaginated(req, res));

        // 根據批次 ID 分頁查詢
        this.router.get('/data/batch/:batchId/paginated', (req, res, next) => this.archiveTaskQueries.getTasksByBatchIdPaginated(req, res));
    }

    /**
     * 設定命令路由 (POST, PUT, DELETE 操作)
     */
    private setupCommandRoutes(): void {
        // 建立新的歸檔任務
        this.router.post('/', (req, res, next) => this.archiveTaskCommands.createTask(req, res, next));

        // 批次建立歸檔任務
        this.router.post('/batch', (req, res, next) => this.archiveTaskCommands.createBatchTasks(req, res, next));

        // 啟動歸檔任務執行
        this.router.post('/:id/execute', (req, res, next) => this.archiveTaskCommands.executeTask(req, res, next));

        // 取消歸檔任務執行
        this.router.post('/:id/cancel', (req, res, next) => this.archiveTaskCommands.cancelTask(req, res, next));

        // 重試歸檔任務
        this.router.post('/:id/retry', (req, res, next) => this.archiveTaskCommands.retryTask(req, res, next));

        // 清理舊任務
        this.router.delete('/cleanup', (req, res, next) => this.archiveTaskCommands.cleanupOldTasks(req, res, next));
    }

    /**
     * 獲取路由器實例
     */
    getRouter(): Router {
        return this.router;
    }
}