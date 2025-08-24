/**
 * @fileoverview Gateway 路由索引
 * @description 統一管理 Gateway Service 的所有路由配置
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { loggerConfig } from '../configs/loggerConfig.js';
import { ResResult } from '../utils/ResResult.js';
import docsRoutes from './docsRoutes.js';
import readmeRoutes from './readmeRoutes.js';


/**
 * 創建主要的 Gateway 路由器
 * @returns Express Router
 */
export function createMainRoutes(): Router {
    const router = Router();

    /**
     * Gateway Service 根端點
     */
    router.get('/', (_req, res) => {
        const gatewayInfo = {
            service: 'AIOT API Gateway',
            version: '1.0.0',
            description: 'Express.js API Gateway for AIOT Microservices',
            features: [
                'Service Discovery with Consul',
                'Load Balancing',
                'Health Monitoring',
                'gRPC to HTTP Translation',
                'WebSocket Proxying'
            ],
            endpoints: {
                health: '/health',
                systemHealth: '/api/health/system',
                services: '/api/health/services',
                routes: '/api/routes',
                auth: '/api/auth/*',
                rbac: '/api/rbac/*',
                drone: '/api/drone/*',
                general: '/api/general/*',
                docs: '/api/docs/*',
                scheduler: '/api/scheduler/*',
                archive: '/api/archive/*',
                websocket: '/socket.io/*'
            },
            documentation: '/api/docs',
            timestamp: new Date().toISOString()
        };

        ResResult.success(res, gatewayInfo, 'AIOT API Gateway is running');
    });

    /**
     * 簡單健康檢查端點
     */
    router.get('/health', (_req, res) => {
        const healthInfo = {
            status: 'healthy',
            service: 'gateway-service',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
            }
        };

        ResResult.success(res, healthInfo, 'Gateway is healthy');
    });

    /**
     * 文檔路由說明：
     * 使用分散式文檔架構，每個微服務提供自己的文檔，
     * Gateway 提供統一的文檔中心和代理功能
     * 統一文檔首頁：/api/docs
     * 各服務文檔：/api/docs/{service-name}/{docs|typedoc}
     */

    // 註冊文檔路由
    router.use('/api/docs', docsRoutes);
    loggerConfig.info('✅ Documentation routes registered at /api/docs');

    // 註冊 README 路由
    router.use('/api/gateway', readmeRoutes);
    loggerConfig.info('✅ README routes registered at /api/gateway');

    // 記錄路由初始化
    loggerConfig.info('✅ Main Gateway routes initialized');
    return router;
}

// 保持向後兼容性
export const gatewayRoutes = createMainRoutes();