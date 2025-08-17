/**
 * @fileoverview API Gateway 路由配置
 * @description 配置所有微服務的路由轉發規則
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { ConsulService } from '../services/ConsulService.js';
import { ProxyMiddleware } from '../middleware/ProxyMiddleware.js';
import { GatewayController } from '../controllers/GatewayController.js';
import { HealthService } from '../services/HealthService.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { AuthTestController } from '../controllers/AuthTestController.js';
import { loggerConfig } from '../configs/loggerConfig.js';
import { ResResult } from '../utils/ResResult.js';

/**
 * 創建 API 路由配置
 * @param consulService - Consul 服務實例
 * @param healthService - 健康檢查服務實例
 * @returns Express Router
 */
export function createApiRoutes(consulService: ConsulService, healthService: HealthService): Router {
    const router = Router();
    const gatewayController = new GatewayController(consulService);
    const proxyMiddleware = gatewayController.getProxyMiddleware();
    const logger = loggerConfig;

    // ==========================================================================
    // Gateway 管理端點
    // ==========================================================================

    /**
     * Gateway 基本資訊
     */
    router.get('/', gatewayController.getGatewayInfo);

    /**
     * Gateway 健康檢查
     */
    router.get('/health', async (req, res) => {
        try {
            const gatewayHealth = healthService.getGatewayHealth();
            ResResult.success(res, gatewayHealth, 'Gateway is healthy');
        } catch (error) {
            logger.error('❌ Gateway health check failed:', error);
            ResResult.fail(res, 'Gateway health check failed', 500);
        }
    });

    /**
     * 系統整體健康狀態
     */
    router.get('/health/system', async (req, res) => {
        try {
            const systemHealth = await healthService.getSystemHealth();
            
            if (systemHealth.status === 'healthy') {
                ResResult.success(res, systemHealth, 'System is healthy');
            } else {
                ResResult.success(res, systemHealth, `System status: ${systemHealth.status}`, 206);
            }
        } catch (error) {
            logger.error('❌ System health check failed:', error);
            ResResult.fail(res, 'System health check failed', 500);
        }
    });

    /**
     * 所有微服務健康狀態
     */
    router.get('/health/services', gatewayController.getServicesHealth);

    /**
     * 特定服務健康檢查
     */
    router.get('/health/services/:serviceName', async (req, res) => {
        try {
            const { serviceName } = req.params;
            const healthResult = await healthService.checkServiceHealth(serviceName);
            
            if (healthResult.healthy) {
                ResResult.success(res, healthResult, `Service ${serviceName} is healthy`);
            } else {
                ResResult.serviceUnavailable(res, serviceName, `Service ${serviceName} is unhealthy`);
            }
        } catch (error) {
            logger.error(`❌ Service health check failed for ${req.params.serviceName}:`, error);
            ResResult.fail(res, 'Service health check failed', 500);
        }
    });

    /**
     * 服務可用性統計
     */
    router.get('/health/services/:serviceName/availability', async (req, res) => {
        try {
            const { serviceName } = req.params;
            const timeRange = parseInt(req.query.hours as string) || 24;
            
            const availability = healthService.getServiceAvailability(serviceName, timeRange);
            ResResult.success(res, availability, `Availability statistics for ${serviceName}`);
        } catch (error) {
            logger.error(`❌ Failed to get availability for ${req.params.serviceName}:`, error);
            ResResult.fail(res, 'Failed to get service availability', 500);
        }
    });

    /**
     * 服務詳細資訊
     */
    router.get('/services/:serviceName', gatewayController.getServiceDetails);

    /**
     * 服務連通性檢查
     */
    router.get('/services/:serviceName/connectivity', gatewayController.checkServiceConnectivity);

    /**
     * 路由配置資訊
     */
    router.get('/routes', gatewayController.getRoutingConfig);

    /**
     * 刷新服務發現
     */
    router.post('/refresh', gatewayController.refreshServiceDiscovery);

    // ==========================================================================
    // 認證測試端點
    // ==========================================================================

    /**
     * 公開測試端點
     */
    router.get('/test/public', 
        AuthMiddleware.optional({ logAuthEvents: false }),
        AuthTestController.testPublicAccess
    );

    /**
     * 基本認證測試
     */
    router.get('/test/auth', 
        AuthMiddleware.required(),
        AuthTestController.testAuth
    );

    /**
     * 權限測試 - 需要無人機權限
     */
    router.get('/test/permissions', 
        AuthMiddleware.requirePermissions('drone:read'),
        AuthTestController.testPermissions
    );

    /**
     * 管理員測試 - 需要管理員角色
     */
    router.get('/test/admin', 
        AuthMiddleware.requireAdmin(),
        AuthTestController.testAdminAccess
    );

    /**
     * 無人機權限測試
     */
    router.get('/test/drone', 
        AuthMiddleware.requirePermissions('drone:read', 'drone:write'),
        AuthTestController.testDroneAccess
    );

    // ==========================================================================
    // 微服務代理路由
    // ==========================================================================

    /**
     * RBAC 服務路由 - 認證端點 (公開，不需要認證)
     */
    router.use('/auth/*', 
        // 對於 auth 端點，我們使用可選認證以支援登入/登出
        AuthMiddleware.optional({
            skipPaths: ['/auth'], // 登入端點跳過認證
            checkBlacklist: true,
            logAuthEvents: true
        }),
        proxyMiddleware.createDynamicProxy({
            target: 'rbac-service',
            pathPrefix: '/api/auth',
            useGrpc: true,
            httpPort: 3051,
            timeout: 30000,
            retries: 3
        })
    );

    /**
     * RBAC 服務路由 - 權限管理端點 (需要認證)
     */
    router.use('/rbac/*',
        AuthMiddleware.required({
            checkBlacklist: true,
            extractPermissions: true,
            logAuthEvents: true
        }),
        proxyMiddleware.createDynamicProxy({
            target: 'rbac-service',
            pathPrefix: '/api/rbac',
            useGrpc: true,
            httpPort: 3051,
            timeout: 30000,
            retries: 3
        })
    );

    /**
     * Drone 服務路由 (需要認證和權限)
     */
    router.use('/drone/*',
        AuthMiddleware.requirePermissions('drone:read', 'drone:write'),
        proxyMiddleware.createDynamicProxy({
            target: 'drone-service',
            pathPrefix: '/api/drone',
            useGrpc: true,
            httpPort: 3052,
            timeout: 30000,
            retries: 3
        })
    );

    /**
     * General 服務路由 (需要認證)
     */
    router.use('/general/*',
        AuthMiddleware.required({
            checkBlacklist: true,
            extractPermissions: true
        }),
        proxyMiddleware.createDynamicProxy({
            target: 'general-service',
            pathPrefix: '/api/general',
            useGrpc: true,
            httpPort: 3053,
            timeout: 30000,
            retries: 3
        })
    );

    /**
     * Docs 服務路由 (公開訪問)
     */
    router.use('/docs/*',
        // 文檔可以公開訪問，但如果有認證則記錄
        AuthMiddleware.optional({
            logAuthEvents: false
        }),
        proxyMiddleware.createDynamicProxy({
            target: 'docs-service',
            pathPrefix: '/api/docs',
            useGrpc: false,
            httpPort: 3054,
            timeout: 15000,
            retries: 2
        })
    );

    // ==========================================================================
    // WebSocket 代理路由
    // ==========================================================================

    /**
     * Drone WebSocket 服務代理
     * 注意：WebSocket 升級需要在應用程式層級處理
     */
    router.use('/ws/drone', (req, res, next) => {
        // 這裡只是標記，實際的 WebSocket 代理在 app.ts 中處理
        req.headers['x-websocket-target'] = 'drone-websocket-service';
        next();
    });

    // ==========================================================================
    // 錯誤處理和 404
    // ==========================================================================

    /**
     * API 404 處理
     */
    router.use('*', (req, res) => {
        logger.warn(`🚫 API route not found: ${req.method} ${req.originalUrl}`);
        ResResult.notFound(res, `API endpoint ${req.originalUrl} not found`);
    });

    logger.info('✅ API routes configured successfully');
    return router;
}

/**
 * 創建 WebSocket 代理路由
 * @param consulService - Consul 服務實例
 * @returns WebSocket 代理中間件
 */
export function createWebSocketRoutes(consulService: ConsulService) {
    const proxyMiddleware = new ProxyMiddleware(consulService);
    
    return {
        // Socket.io 代理到 drone-websocket-service
        '/socket.io': proxyMiddleware.createWebSocketProxy({
            target: 'drone-websocket-service',
            pathPrefix: '/socket.io',
            useGrpc: false,
            httpPort: 3004
        })
    };
}