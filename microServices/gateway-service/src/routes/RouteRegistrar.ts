/**
 * @fileoverview Gateway Service RouteRegistrar
 * 
 * 使用 InversifyJS 依賴注入管理所有路由註冊
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2025-08-23
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Application } from 'express';
import { TYPES } from '../container/types.js';
import { GatewayController } from '../controllers/GatewayController.js';
import { AuthTestController } from '../controllers/AuthTestController.js';
import { ProxyMiddleware } from '../middleware/ProxyMiddleware.js';
import { createMainRoutes } from './index.js';

/**
 * Gateway Service 路由註冊器
 * 
 * 負責統一管理和註冊所有路由到 Express 應用程式
 */
@injectable()
export class RouteRegistrar {
    constructor(
        @inject(TYPES.GatewayController) private gatewayController: GatewayController,
        @inject(TYPES.AuthTestController) private authTestController: AuthTestController,
        @inject(TYPES.ProxyMiddleware) private proxyMiddleware: ProxyMiddleware
    ) {}

    /**
     * 註冊所有路由到 Express 應用程式
     * 
     * @param app Express 應用程式實例
     */
    public registerRoutes = (app: Application): void => {
        console.log('🛣️  Registering Gateway Service routes...');

        try {
            // 註冊主要路由（根路由和健康檢查）
            const mainRoutes = createMainRoutes();
            app.use('/', mainRoutes);
            console.log('✅ Main Gateway routes registered');

            // 註冊 API 路由（通過代理中間件）
            app.use('/api', this.proxyMiddleware.createProxy());
            console.log('✅ API proxy routes registered at /api');

            // 註冊認證測試路由
            app.use('/test', this.authTestController.getRouter());
            console.log('✅ Auth test routes registered at /test');

            console.log('🚀 All Gateway routes registered successfully');
        } catch (error) {
            console.error('❌ Failed to register Gateway routes:', error);
            throw error;
        }
    };
}