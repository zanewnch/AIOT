/**
 * @fileoverview Gateway 路由索引
 * @description 統一管理 Gateway Service 的所有路由配置
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { loggerConfig } from '../configs/loggerConfig.js';
import { ResResult } from '../utils/ResResult.js';

/**
 * 創建主要的 Gateway 路由器
 * @returns Express Router
 */
export function createMainRoutes(): Router {
    const router = Router();

    /**
     * Gateway Service 根端點
     */
    router.get('/', (req, res) => {
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
    router.get('/health', (req, res) => {
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
     * API 文件重導向端點
     */
    router.get('/docs', (req, res) => {
        res.redirect('/api/docs/');
    });

    // 記錄路由初始化
    loggerConfig.info('✅ Main Gateway routes initialized');
    return router;
}

// 保持向後兼容性
export const gatewayRoutes = createMainRoutes();