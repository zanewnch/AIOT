/**
 * @fileoverview 動態文檔路由
 * 
 * 提供 microservice 架構的動態文檔展示，包括：
 * - 服務概覽和架構圖
 * - 實時 API 狀態和端點測試
 * - 服務間依賴關係展示
 * - 健康檢查和監控面板
 * 
 * @module docsRoutes
 * @author AIOT Team
 * @since 1.0.0
 */

import { Router } from 'express';
import { container } from '../container/container.js';
import { TYPES } from '../container/types.js';
import { DocsController } from '../controllers/queries/DocsQueriesCtrl.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('DocsRoutes');
const router = Router();

/**
 * 文檔控制器路由
 */
try {
    const docsController = container.get<DocsController>(TYPES.DocsController);

    /**
     * 主文檔頁面
     * @route GET /docs
     */
    router.get('/', docsController.getMainDocs.bind(docsController));

    /**
     * 架構概覽頁面
     * @route GET /docs/architecture
     */
    router.get('/architecture', docsController.getArchitectureDocs.bind(docsController));

    /**
     * API 測試面板
     * @route GET /docs/api-testing
     */
    router.get('/api-testing', docsController.getApiTestingDocs.bind(docsController));

    /**
     * 服務監控面板
     * @route GET /docs/monitoring
     */
    router.get('/monitoring', docsController.getMonitoringDocs.bind(docsController));

    /**
     * 源代碼查看器
     * @route GET /docs/source-code
     */
    router.get('/source-code', docsController.getSourceCodeDocs.bind(docsController));

    /**
     * 獲取服務狀態 API (AJAX)
     * @route GET /docs/api/services-status
     */
    router.get('/api/services-status', docsController.getServicesStatus.bind(docsController));

    /**
     * 測試 API 端點 (AJAX)
     * @route POST /docs/api/test-endpoint
     */
    router.post('/api/test-endpoint', docsController.testApiEndpoint.bind(docsController));

    /**
     * 獲取源代碼內容 (AJAX)
     * @route GET /docs/api/source-code/:fileName
     */
    router.get('/api/source-code/:fileName', docsController.getSourceCodeApi.bind(docsController));

    logger.info('Documentation routes registered successfully');
} catch (error) {
    logger.error('Failed to register docs routes:', error);
    
    // 提供錯誤回退路由
    router.get('*', (req, res) => {
        res.status(500).json({
            status: 500,
            message: 'Documentation service unavailable',
            error: 'Failed to initialize docs controller'
        });
    });
}

export { router as DocsRoutes };