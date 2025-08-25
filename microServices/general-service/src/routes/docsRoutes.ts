/**
 * @fileoverview 動態文檔路由類別 - InversifyJS + Arrow Functions 版本
 * 
 * 使用 class 封裝路由邏輯，結合 InversifyJS 依賴注入和 arrow functions。
 * 提供 microservice 架構的動態文檔展示，包括：
 * - 服務概覽和架構圖
 * - 實時 API 狀態和端點測試
 * - 服務間依賴關係展示
 * - 健康檢查和監控面板
 * 
 * @module DocsRoutes
 * @author AIOT Team
 * @since 1.0.0
 * @version 2.0.0
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Router } from 'express';
import { TYPES } from '../container/types.js';
import { DocsQueriesController } from '../controllers/queries/DocsQueriesCtrl.js';
import { Logger, LogRoute } from '../decorators/LoggerDecorator.js';

/**
 * 動態文檔路由類別
 * 
 * 使用 InversifyJS 進行依賴注入，class 內的方法使用 arrow functions
 * 避免 this 綁定問題並提供更清晰的代碼結構
 */
@injectable()
export class DocsRoutes {
    private readonly router: Router;

    constructor(
        @inject(TYPES.DocsController) 
        private readonly docsController: DocsQueriesController
    ) {
        this.router = Router();
        this.setupRoutes();
    }

    /**
     * 設定所有路由
     */
    private setupRoutes = (): void => {
        try {
            this.setupPageRoutes();
            this.setupApiRoutes();
            this.setupErrorHandling();
        } catch (error) {
            this.setupErrorFallback();
        }
    }

    /**
     * 設定頁面路由
     */
    private setupPageRoutes = (): void => {
        /**
         * 主文檔頁面
         * @route GET /docs
         */
        this.router.get('/', this.getMainDocs);

        /**
         * 架構概覽頁面
         * @route GET /docs/architecture
         */
        this.router.get('/architecture', this.getArchitectureDocs);

        /**
         * API 測試面板
         * @route GET /docs/api-testing
         */
        this.router.get('/api-testing', this.getApiTestingDocs);

        /**
         * 服務監控面板
         * @route GET /docs/monitoring
         */
        this.router.get('/monitoring', this.getMonitoringDocs);

        /**
         * 源代碼查看器
         * @route GET /docs/source-code
         */
        this.router.get('/source-code', this.getSourceCodeDocs);
    }

    /**
     * 設定 API 路由
     */
    private setupApiRoutes = (): void => {
        /**
         * 獲取服務狀態 API (AJAX)
         * @route GET /docs/api/services-status
         */
        this.router.get('/api/services-status', this.getServicesStatus);

        /**
         * 測試 API 端點 (AJAX)
         * @route POST /docs/api/test-endpoint
         */
        this.router.post('/api/test-endpoint', this.testApiEndpoint);

        /**
         * 獲取源代碼內容 (AJAX)
         * @route GET /docs/api/source-code/:fileName
         */
        this.router.get('/api/source-code/:fileName', this.getSourceCodeApi);
    }

    /**
     * 設定錯誤處理
     */
    private setupErrorHandling = (): void => {
        // 404 處理器放在最後
        this.router.use('*', this.handleNotFound);
    }

    /**
     * 設定錯誤回退路由
     */
    private setupErrorFallback = (): void => {
        this.router.get('*', this.handleServiceUnavailable);
    }

    // ==============================================
    // 頁面路由處理器 (Arrow Functions)
    // ==============================================

    /**
     * 主文檔頁面處理器
     */
    private getMainDocs = (req: any, res: any, next: any) => {
        return this.docsController.getMainDocs(req, res, next);
    }

    /**
     * 架構概覽頁面處理器
     */
    private getArchitectureDocs = (req: any, res: any, next: any) => {
        return this.docsController.getArchitectureDocs(req, res, next);
    }

    /**
     * API 測試面板處理器
     */
    private getApiTestingDocs = (req: any, res: any, next: any) => {
        return this.docsController.getApiTestingDocs(req, res, next);
    }

    /**
     * 服務監控面板處理器
     */
    private getMonitoringDocs = (req: any, res: any, next: any) => {
        return this.docsController.getMonitoringDocs(req, res, next);
    }

    /**
     * 源代碼查看器處理器
     */
    private getSourceCodeDocs = (req: any, res: any, next: any) => {
        return this.docsController.getSourceCodeDocs(req, res, next);
    }

    // ==============================================
    // API 路由處理器 (Arrow Functions)
    // ==============================================

    /**
     * 獲取服務狀態處理器
     */
    private getServicesStatus = (req: any, res: any, next: any) => {
        return this.docsController.getServicesStatus(req, res, next);
    }

    /**
     * 測試 API 端點處理器
     */
    private testApiEndpoint = (req: any, res: any, next: any) => {
        return this.docsController.testApiEndpoint(req, res, next);
    }

    /**
     * 獲取源代碼內容處理器
     */
    private getSourceCodeApi = (req: any, res: any, next: any) => {
        return this.docsController.getSourceCodeApi(req, res, next);
    }

    // ==============================================
    // 錯誤處理器 (Arrow Functions)
    // ==============================================

    /**
     * 404 處理器
     */
    private handleNotFound = (req: any, res: any) => {
        res.status(404).json({
            status: 404,
            message: 'Documentation page not found',
            error: 'ROUTE_NOT_FOUND',
            path: req.originalUrl,
            method: req.method
        });
    }

    /**
     * 服務不可用處理器
     */
    private handleServiceUnavailable = (req: any, res: any) => {
        res.status(500).json({
            status: 500,
            message: 'Documentation service unavailable',
            error: 'Failed to initialize docs controller'
        });
    }

    /**
     * 獲取路由器實例
     */
    getRouter(): Router {
        return this.router;
    }
}