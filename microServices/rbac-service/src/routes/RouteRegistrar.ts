/**
 * @fileoverview RBAC Service RouteRegistrar
 * 
 * 使用 InversifyJS 依賴注入管理所有路由註冊
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2025-08-23
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Application, Router } from 'express';
import { TYPES } from '../container/types.js';
import { RBACMCPRoutes } from './mcpRoutes.js';
import readmeRoutes from './readmeRoutes.js';

/**
 * RBAC Service 路由註冊器
 * 
 * 負責統一管理和註冊所有路由到 Express 應用程式
 */
@injectable()
export class RouteRegistrar {
    constructor(
        @inject(TYPES.RBACRoutes) private rbacRoutes: Router,
        @inject(TYPES.DocsRoutes) private docsRoutes: Router,
        @inject(TYPES.RBACMCPRoutes) private mcpRoutes: RBACMCPRoutes
    ) {}

    /**
     * 註冊所有路由到 Express 應用程式
     * 
     * @param app Express 應用程式實例
     */
    public registerRoutes = (app: Application): void => {
        console.log('🛣️  Registering RBAC API routes...');

        try {
            // 註冊健康檢查路由
            app.get('/health', (req, res) => {
                res.status(200).json({
                    status: 'healthy',
                    service: 'rbac-service',
                    timestamp: new Date().toISOString(),
                    version: '1.0.0'
                });
            });
            console.log('✅ Health check route registered at /health');

            // 註冊文檔路由
            app.use('/', this.docsRoutes);
            console.log('✅ Documentation routes registered at /docs and /typedoc');

            // 註冊 README 路由
            app.use('/', readmeRoutes);
            console.log('✅ README route registered at /readme');

            // 註冊 RBAC 路由
            app.use('/', this.rbacRoutes);
            console.log('✅ RBAC routes registered at /');

            // 註冊 MCP 路由 (供 LLM AI Engine 調用)
            app.use('/api/mcp', this.mcpRoutes.getRouter());
            console.log('✅ MCP routes registered at /api/mcp');

            console.log('🚀 All RBAC routes registered successfully (including MCP support)');
        } catch (error) {
            console.error('❌ Failed to register RBAC routes:', error);
            throw error;
        }
    };
}