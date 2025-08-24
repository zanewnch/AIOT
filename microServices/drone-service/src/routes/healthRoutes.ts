/**
 * @fileoverview 健康檢查路由配置
 *
 * 提供微服務健康狀態檢查端點，用於：
 * - API Gateway 的健康檢查
 * - Consul 的服務健康監控
 * - 系統監控和負載均衡
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import {Request, Response, Router} from 'express';
import {ResResult} from 'aiot-shared-packages';

const router = Router();

/**
 * 健康檢查端點
 * @route GET /health
 */
router.get('/health', (req: Request, res: Response) => {
    const healthStatus = {
        status: 'healthy',
        service: 'drone-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    };

    const result = ResResult.success('Service is healthy', healthStatus);
    res.status(result.status).json(result);
});

/**
 * 詳細健康檢查端點
 * @route GET /health/detailed
 */
router.get('/health/detailed', (req: Request, res: Response) => {
    const healthStatus = {
        status: 'healthy',
        service: 'drone-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
        },
        environment: process.env.NODE_ENV || 'development'
    };

    const result = ResResult.success('Service is healthy', healthStatus);
    res.status(result.status).json(result);
});

export {router as healthRoutes};