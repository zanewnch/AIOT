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
import { TYPES } from '../container/types.js';
import { ControllerResult } from '../utils/ControllerResult.js';
import { createLogger } from '../configs/loggerConfig.js';

const logger = createLogger('RouteManager');

/**
 * 路由管理器類別
 * 
 * 負責統一註冊所有 API 路由，使用 IoC 容器管理依賴
 * 
 * @class RouteManager
 */
@injectable()
export class RouteManager {
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
    registerAllRoutes = (app: Application): void => {
        logger.info('🛣️  Registering all API routes...');

        try {
            // 註冊健康檢查路由
            app.use('/', this.healthRoutes.getRouter());
            logger.info('✅ Health routes registered');

            // 註冊用戶偏好設定路由
            app.use('/api/user-preferences', this.userPreferenceRoutes.getRouter());
            logger.info('✅ User preference routes registered');

            // 註冊動態文檔路由
            app.use('/api/docs', this.docsRoutes.getRouter());
            logger.info('✅ Docs routes registered');

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
            
            ControllerResult.error(res, 'Route not found', 404, 'ROUTE_NOT_FOUND');
        });
    }
}