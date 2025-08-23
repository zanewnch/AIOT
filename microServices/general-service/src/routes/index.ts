/**
 * @fileoverview General 微服務路由統一註冊中心
 * 
 * 此文件負責管理和註冊所有的 HTTP API 路由，採用 CQRS 架構和 IoC 容器：
 * - 使用 class-based 路由配置
 * - 透過依賴注入管理路由控制器
 * - 支援 Query/Command 分離模式
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Application } from 'express';
import { UserPreferenceRoutes } from './userPreferenceRoutes.js';
import { DocsRoutes } from './docsRoutes.js';
import { HealthRoutes } from './healthRoutes.js';
import simpleDocsRoutes from './simpleDocsRoutes.js';
import { TYPES } from '../container/types.js';
import { ResResult } from 'aiot-shared-packages';
import { createLogger } from '../configs/loggerConfig.js';

const logger = createLogger('RouteRegistrar');

/**
 * 路由註冊器類別
 * 
 * 負責統一註冊所有 API 路由，使用 IoC 容器管理依賴
 * 
 * @class RouteRegistrar
 */
@injectable()
export class RouteRegistrar {
    constructor(
        @inject(TYPES.HealthRoutes) private readonly healthRoutes: HealthRoutes,
        @inject(TYPES.UserPreferenceRoutes) private readonly userPreferenceRoutes: UserPreferenceRoutes,
        @inject(TYPES.DocsRoutes) private readonly docsRoutes: DocsRoutes
    ) {}

    /**
     * 註冊所有 API 路由到 Express 應用程式
     * 
     * @param app Express 應用程式實例
     */
    registerRoutes = (app: Application): void => {
        logger.info('🛣️  Registering all API routes...');

        try {
            // 註冊健康檢查路由 (API Gateway: /api/health → strip_path=true → 轉發到 /health)
            app.use('/', this.healthRoutes.getRouter());
            logger.info('✅ Health routes registered');

            // 註冊用戶偏好設定路由 (API Gateway: /api/user-preferences → strip_path=true → 轉發到 /user-preferences)  
            app.use('/user-preferences', this.userPreferenceRoutes.getRouter());
            logger.info('✅ User preference routes registered');

            // 註冊資訊端點路由 (API Gateway: /api/info → strip_path=true → 轉發到 /info)
            app.use('/', this.docsRoutes.getRouter());
            logger.info('✅ Info routes registered');

            // 註冊統一文檔路由 (/docs 和 /typedoc)
            app.use('/', simpleDocsRoutes);
            logger.info('✅ Unified documentation routes registered at /docs and /typedoc');

            // 註冊全域錯誤處理
            this.registerGlobalErrorHandling(app);
            logger.info('✅ Global error handling registered');

            logger.info('🚀 All routes registered successfully');
        } catch (error) {
            logger.error('❌ Failed to register routes:', error);
            throw error;
        }
    }

    /**
     * 註冊全域錯誤處理
     * 
     * @param app Express 應用程式實例
     */
    private registerGlobalErrorHandling = (app: Application): void => {
        // 404 處理器
        app.use('*', (req, res) => {
            logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
            
            const result = ResResult.notFound('Route not found');
            res.status(result.status).json(result);
        });
    }
}