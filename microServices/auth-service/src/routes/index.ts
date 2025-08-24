/**
 * @fileoverview Auth 服務路由統一註冊中心
 *
 * 此文件負責管理和註冊認證相關的 HTTP API 路由，並提供一個單一入口
 * 將 Auth 子路由掛載到 Express 應用上。
 *
 * @module Routes/Auth
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Application } from 'express';
import { inject, injectable } from 'inversify';
import { AuthRoutes } from './authRoutes.js';
import { TYPES } from '../container/types.js';
import docsRoutes from './docsRoutes.js';
import readmeRoutes from './readmeRoutes.js';
import { AuthMCPRoutes } from './mcpRoutes.js';

/**
 * 路由註冊器類別
 * 使用 InversifyJS 依賴注入管理路由註冊
 */
@injectable()
class RouteRegistrar {
    constructor(
        @inject(TYPES.AuthRoutes) private authRoutes: AuthRoutes,
        @inject(TYPES.AuthMCPRoutes) private mcpRoutes: AuthMCPRoutes
    ) {}

    /**
     * 註冊所有路由到 Express 應用程式
     * @param app Express 應用實例
     */
    public registerRoutes(app: Application): void {
        try {
            // 註冊健康檢查路由 - 用於運維監控 (Liveness/Readiness)
            app.get('/health', (req, res) => {
                res.status(200).json({
                    status: 'healthy',
                    service: 'auth-service',
                    timestamp: new Date().toISOString(),
                    version: '1.0.0'
                });
            });
            console.log('✅ Health check route registered at /health');

            // 註冊認證路由 - 掛載 AuthRoutes 到根路徑
            app.use('/', this.authRoutes.getRouter());
            console.log('✅ Auth routes registered at /');

            // 註冊 MCP 路由 (供 LLM AI Engine 調用)
            app.use('/api/mcp', this.mcpRoutes.getRouter());
            console.log('✅ MCP routes registered at /api/mcp');

            // 註冊文檔路由
            app.use('/', docsRoutes);
            console.log('✅ Documentation routes registered at /docs and /typedoc');

            // 註冊 README 路由
            app.use('/', readmeRoutes);
            console.log('✅ README route registered at /readme');

            console.log('🚀 All Auth routes registered successfully');
        } catch (error) {
            console.error('❌ Failed to register routes:', error);
            throw error;
        }
    }
}

/**
 * 註冊所有 API 路由到 Express 應用程式
 * 使用容器獲取 RouteRegistrar 實例並註冊路由
 *
 * @param app Express 應用實例
 * @param container InversifyJS 容器實例
 * @public
 */
export function registerRoutes(app: Application, container: any): void {
    const routeRegistrar = container.get<RouteRegistrar>(TYPES.RouteRegistrar);
    routeRegistrar.registerRoutes(app);
}

// 匯出 RouteRegistrar 類別以供容器註冊
export { RouteRegistrar };