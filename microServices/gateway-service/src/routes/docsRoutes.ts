/**
 * @fileoverview Gateway 文檔路由
 * @description 統一管理所有微服務的文檔展示和代理
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { loggerConfig } from '../configs/loggerConfig.js';
import { ResResult } from '../utils/ResResult.js';

/**
 * 創建文檔路由
 * @returns Express Router
 */
export function createDocsRoutes(): Router {
    const router = Router();

    /**
     * 統一文檔首頁 - 簡單導航頁面
     */
    router.get('/', (_req, res) => {
        loggerConfig.info('📖 Serving documentation homepage');
        res.render('docs-home');
    });

    /**
     * 文檔健康檢查
     */
    router.get('/health', (_req, res) => {
        const healthInfo = {
            status: 'healthy',
            service: 'docs-proxy',
            description: 'Documentation proxy service is running',
            availableServices: ['rbac', 'drone', 'general', 'auth'],
            timestamp: new Date().toISOString()
        };

        ResResult.success(res, healthInfo, 'Documentation proxy is healthy');
    });


    loggerConfig.info('✅ Documentation routes initialized');
    return router;
}

// 預設匯出
export default createDocsRoutes();