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
import { TYPES } from '../types/dependency-injection.js';
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
        @inject(TYPES.ArchiveTaskQueriesCtrl) private readonly archiveTaskQueries: IArchiveTaskQueries,
        @inject(TYPES.ArchiveTaskCommandsCtrl) private readonly archiveTaskCommands: IArchiveTaskCommands
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
        // 獲取所有歸檔任務
        this.router.get('/', (req, res, next) => this.archiveTaskQueries.getAllTasks(req, res, next));

        // 獲取歸檔任務統計資訊
        this.router.get('/statistics', (req, res, next) => this.archiveTaskQueries.getTaskStatistics(req, res, next));

        // 獲取歸檔任務資料（用於前端表格顯示）
        this.router.get('/data', (req, res, next) => this.archiveTaskQueries.getTasksData(req, res, next));

        // 根據 ID 獲取歸檔任務
        this.router.get('/:id', (req, res, next) => this.archiveTaskQueries.getTaskById(req, res, next));
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