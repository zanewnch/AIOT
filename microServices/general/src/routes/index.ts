/**
 * @fileoverview general 服務主路由文件
 * 
 * 此文件整合 general 服務的所有路由。
 * 遵循模組化設計，將不同功能的路由分離到不同的文件中。
 * 
 * @module routes
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Router } from 'express';
import { container } from '../container/container.js';
import { TYPES } from '../container/types.js';
import { UserPreferenceRoutes } from './userPreferenceRoutes.js';
import { DocsRoutes } from './docsRoutes.js';
import { createLogger } from '../configs/loggerConfig.js';

const logger = createLogger('Routes');
const router = Router();

/**
 * 健康檢查路由
 * @route GET /api/health
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'general',
        message: 'general service is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

/**
 * 服務資訊路由
 * @route GET /api/info
 */
router.get('/info', (req, res) => {
    res.status(200).json({
        service: 'general',
        description: 'Frontend Setting Management Service',
        version: '1.0.0',
        author: 'AIOT Team',
        features: [
            'User Preference Management',
            'CQRS Architecture',
            'JWT-based Role Authorization',
            'RESTful API'
        ],
        endpoints: {
            health: '/api/health',
            info: '/api/info',
            docs: '/api/docs',
            userPreferences: '/api/user-preferences'
        }
    });
});

/**
 * 用戶偏好設定路由
 */
const userPreferenceRoutes = container.get<UserPreferenceRoutes>(TYPES.UserPreferenceRoutes);
router.use('/user-preferences', userPreferenceRoutes.getRouter());

/**
 * 動態文檔路由
 */
router.use('/docs', DocsRoutes);

/**
 * 404 處理器 - 必須放在所有路由之後
 */
router.use('*', (req, res) => {
    logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        status: 404,
        message: 'Route not found',
        error: 'ROUTE_NOT_FOUND',
        path: req.originalUrl,
        method: req.method
    });
});

export default router;

/**
 * 註冊所有路由的便利函數（向後相容）
 */
export function registerAllRoutes(app: any): void {
    app.use('/api', router);
}