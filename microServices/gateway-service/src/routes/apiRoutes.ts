/**
 * @fileoverview API Gateway 路由配置
 * @description 配置所有微服務的路由轉發規則
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { ProxyMiddleware } from '../middleware/ProxyMiddleware.js';
import { GatewayController } from '../controllers/GatewayController.js';
import { HealthConfig } from '../configs/healthConfig.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { AuthTestController } from '../controllers/AuthTestController.js';
import { loggerConfig } from '../configs/loggerConfig.js';
import { ResResult } from '../utils/ResResult.js';
import docsRoutes from './docsRoutes.js';

/**
 * 創建 API 路由配置
 * @param healthConfig - 健康檢查配置實例
 * @returns Express Router
 */
export function createApiRoutes(healthConfig: HealthConfig): Router {
    const router = Router();
    const proxyMiddleware = new ProxyMiddleware();
    const gatewayController = new GatewayController(proxyMiddleware);
    const authTestController = new AuthTestController();
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
    router.get('/health', async (_req, res) => {
        try {
            const gatewayHealth = healthConfig.getGatewayHealth();
            ResResult.success(res, gatewayHealth, 'Gateway is healthy');
        } catch (error) {
            logger.error('❌ Gateway health check failed:', error);
            ResResult.fail(res, 'Gateway health check failed', 500);
        }
    });

    /**
     * 系統整體健康狀態
     */
    router.get('/health/system', async (_req, res) => {
        try {
            const systemHealth = await healthConfig.getSystemHealth();
            
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
            const healthResult = await healthConfig.checkServiceHealth(serviceName);
            
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
            
            const availability = healthConfig.getServiceAvailability(serviceName, timeRange);
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
        authTestController.testPublicAccess
    );

    /**
     * 基本認證測試
     */
    router.get('/test/auth', 
        AuthMiddleware.required(),
        authTestController.testAuth
    );

    /**
     * 權限測試 - 需要無人機權限
     */
    router.get('/test/permissions', 
        AuthMiddleware.requirePermissions('drone.read'),
        authTestController.testPermissions
    );

    /**
     * 管理員測試 - 需要管理員角色
     */
    router.get('/test/admin', 
        AuthMiddleware.requireAdmin(),
        authTestController.testAdminAccess
    );

    /**
     * 無人機權限測試
     */
    router.get('/test/drone', 
        AuthMiddleware.requirePermissions('drone.read', 'drone.update'),
        authTestController.testDroneAccess
    );

    // ==========================================================================
    // 文檔統一首頁路由
    // ==========================================================================

    /**
     * 文檔中心首頁路由
     * 提供統一的文檔入口點和服務列表
     */
    router.use('/docs', 
        AuthMiddleware.optional({ logAuthEvents: false }),
        docsRoutes
    );

    // ==========================================================================
    // 微服務代理路由
    // ==========================================================================

    /**
     * Auth 服務路由 - 認證端點 (公開，不需要認證)
     * 支援 /auth 和 /auth/* 路徑
     */
    router.use('/auth', 
        // 對於 auth 端點，我們使用可選認證以支援登入/登出
        AuthMiddleware.optional({
            skipPaths: ['/auth'], // 登入端點跳過認證
            checkBlacklist: true,
            logAuthEvents: true
        }),
        proxyMiddleware.createDynamicProxy({
            target: 'auth-service',
            pathPrefix: '',
            useGrpc: true,
            httpPort: 3055,  // Auth Service 使用新的端口
            timeout: 30000,
            retries: 3
        })
    );

    /**
     * RBAC 服務路由 - 權限管理端點 (需要認證)
     */
    router.use('/rbac',
        AuthMiddleware.required({
            checkBlacklist: true,
            extractPermissions: true,
            logAuthEvents: true
        }),
        proxyMiddleware.createDynamicProxy({
            target: 'rbac-service',
            pathPrefix: '',
            useGrpc: true,
            httpPort: 3051,
            timeout: 30000,
            retries: 3
        })
    );

    /**
     * Drone 服務路由 (需要認證和權限)
     */
    router.use('/drone',
        AuthMiddleware.requirePermissions('drone.read', 'drone.update'),
        proxyMiddleware.createDynamicProxy({
            target: 'drone-service',
            pathPrefix: '',
            useGrpc: true,
            httpPort: 3052,
            timeout: 30000,
            retries: 3
        })
    );

    /**
     * General 服務路由 (需要認證)
     */
    router.use('/general',
        AuthMiddleware.required({
            checkBlacklist: true,
            extractPermissions: true
        }),
        proxyMiddleware.createDynamicProxy({
            target: 'general-service',
            pathPrefix: '',
            useGrpc: true,
            httpPort: 3053,
            timeout: 30000,
            retries: 3
        })
    );


    /**
     * Scheduler 服務路由 (需要管理員權限)
     */
    router.use('/scheduler',
        AuthMiddleware.requireAdmin(),
        proxyMiddleware.createDynamicProxy({
            target: 'scheduler-service',
            pathPrefix: '',
            useGrpc: false,
            httpPort: 3001,
            timeout: 30000,
            retries: 3
        })
    );

    /**
     * Archive Processor 服務路由 (需要管理員權限)
     */
    router.use('/archive',
        AuthMiddleware.requireAdmin(),
        proxyMiddleware.createDynamicProxy({
            target: 'archive-processor-service',
            pathPrefix: '',
            useGrpc: false,
            httpPort: 3005,
            timeout: 60000, // 較長超時時間，因為歸檔處理可能需要更多時間
            retries: 2
        })
    );

    /**
     * LLM 服務路由 - 直接代理到 AI Engine
     * 提供統一的 LLM 介面，包含文字生成、對話和串流功能
     */
    router.use('/llm',
        AuthMiddleware.optional({
            logAuthEvents: true,
            checkBlacklist: false  // LLM 服務可以允許未登入用戶使用基本功能
        }),
        proxyMiddleware.createDynamicProxy({
            target: 'llm-service',
            pathPrefix: '',
            useGrpc: false,
            httpPort: 8021,
            timeout: 120000, // LLM 推理需要更長時間
            retries: 2
        })
    );

    /**
     * LLM AI Engine 直接存取路由 (僅限管理員或開發調試)
     * 提供對底層 AI 引擎的直接存取，用於調試和高級功能
     */
    router.use('/ai-engine',
        AuthMiddleware.requireAdmin(),
        proxyMiddleware.createDynamicProxy({
            target: 'llm-service',
            pathPrefix: '',
            useGrpc: false,
            httpPort: 8021,
            timeout: 120000, // AI 推理需要更長時間
            retries: 2
        })
    );

    // ==========================================================================
    // 文檔代理路由 - 分散式文檔架構
    // ==========================================================================

    /**
     * RBAC 服務文檔路由
     * - /docs/rbac/docs - EJS 服務說明頁面
     * - /docs/rbac/typedoc - TypeDoc 技術文檔
     */
    router.use('/docs/rbac',
        AuthMiddleware.optional({ logAuthEvents: false }),
        proxyMiddleware.createDynamicProxy({
            target: 'rbac-service',
            pathPrefix: '',
            useGrpc: false,
            httpPort: 3051,
            timeout: 30000,
            retries: 3
        })
    );

    /**
     * Drone 服務文檔路由
     * - /docs/drone/docs - EJS 服務說明頁面  
     * - /docs/drone/typedoc - TypeDoc 技術文檔
     */
    router.use('/docs/drone',
        AuthMiddleware.optional({ logAuthEvents: false }),
        proxyMiddleware.createDynamicProxy({
            target: 'drone-service',
            pathPrefix: '',
            useGrpc: false,
            httpPort: 3052,
            timeout: 30000,
            retries: 3
        })
    );

    /**
     * General 服務文檔路由
     * - /docs/general/docs - EJS 服務說明頁面
     * - /docs/general/typedoc - TypeDoc 技術文檔
     */
    router.use('/docs/general',
        AuthMiddleware.optional({ logAuthEvents: false }),
        proxyMiddleware.createDynamicProxy({
            target: 'general-service',
            pathPrefix: '',
            useGrpc: false,
            httpPort: 3053,
            timeout: 30000,
            retries: 3
        })
    );

    /**
     * Auth 服務文檔路由
     * - /docs/auth/docs - EJS 服務說明頁面
     * - /docs/auth/typedoc - TypeDoc 技術文檔
     */
    router.use('/docs/auth',
        AuthMiddleware.optional({ logAuthEvents: false }),
        proxyMiddleware.createDynamicProxy({
            target: 'auth-service',
            pathPrefix: '',
            useGrpc: false,
            httpPort: 3055,
            timeout: 30000,
            retries: 3
        })
    );

    // ==========================================================================
    // WebSocket 代理路由
    // ==========================================================================

    /**
     * Drone WebSocket 服務代理
     * 注意：WebSocket 升級需要在應用程式層級處理
     */
    router.use('/ws/drone', (req, _res, next) => {
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
 * @returns WebSocket 代理中間件
 */
export function createWebSocketRoutes() {
    const proxyMiddleware = new ProxyMiddleware();
    
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