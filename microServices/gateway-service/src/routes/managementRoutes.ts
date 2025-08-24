/**
 * @fileoverview Gateway 管理路由
 * @description Gateway 監控、統計、配置等管理功能的路由定義
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { GatewayManagementController } from '../controllers/GatewayManagementController.js';
import { MonitoringMiddleware } from '../middleware/MonitoringMiddleware.js';
import { LoadBalancerMiddleware } from '../middleware/LoadBalancerMiddleware.js';
import { RateLimitMiddleware } from '../middleware/RateLimitMiddleware.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';

/**
 * 創建管理路由
 */
export function createManagementRoutes(
    monitoringMiddleware: MonitoringMiddleware,
    loadBalancerMiddleware: LoadBalancerMiddleware,
    rateLimitMiddleware: RateLimitMiddleware
): Router {
    const router = Router();
    const managementController = new GatewayManagementController(
        monitoringMiddleware,
        loadBalancerMiddleware,
        rateLimitMiddleware
    );

    // 管理員權限檢查中間件
    const requireAdmin = AuthMiddleware.requireAdmin();

    // ==========================================================================
    // Gateway 狀態和監控端點
    // ==========================================================================

    /**
     * 獲取 Gateway 整體狀態
     * GET /api/management/status
     */
    router.get('/status', managementController.getGatewayStatus);

    /**
     * 獲取詳細監控統計
     * GET /api/management/monitoring/stats
     */
    router.get('/monitoring/stats', requireAdmin, managementController.getMonitoringStats);

    /**
     * 獲取實時指標（Server-Sent Events）
     * GET /api/management/monitoring/realtime
     */
    router.get('/monitoring/realtime', requireAdmin, managementController.getRealtimeMetrics);

    /**
     * 重置統計數據
     * POST /api/management/monitoring/reset
     */
    router.post('/monitoring/reset', requireAdmin, managementController.resetStats);

    // ==========================================================================
    // 負載均衡管理端點
    // ==========================================================================

    /**
     * 獲取負載均衡狀態
     * GET /api/management/load-balancer/status
     * GET /api/management/load-balancer/status/:serviceName
     */
    router.get('/load-balancer/status/:serviceName?', requireAdmin, managementController.getLoadBalancerStatus);

    /**
     * 手動設置服務實例健康狀態
     * PUT /api/management/load-balancer/:serviceName/:instanceId/health
     */
    router.put('/load-balancer/:serviceName/:instanceId/health', 
        requireAdmin, 
        managementController.setInstanceHealth
    );

    // ==========================================================================
    // 性能和分析端點
    // ==========================================================================

    /**
     * 獲取端點性能報告
     * GET /api/management/performance/endpoints
     */
    router.get('/performance/endpoints', requireAdmin, managementController.getEndpointPerformance);

    /**
     * 獲取用戶活動報告
     * GET /api/management/analytics/users?limit=20
     */
    router.get('/analytics/users', requireAdmin, managementController.getUserActivity);

    // ==========================================================================
    // Gateway 配置端點
    // ==========================================================================

    /**
     * 獲取 Gateway 配置資訊
     * GET /api/management/configuration
     */
    router.get('/configuration', requireAdmin, managementController.getConfiguration);

    return router;
}