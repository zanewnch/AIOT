/**
 * @fileoverview Drone Service 文檔路由
 * @description 提供 Drone 服務的文檔端點，包含服務說明和技術文檔
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * 創建文檔路由
 * @returns Express Router
 */
export function createDocsRoutes(): Router {
    const router = Router();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    /**
     * Drone 服務說明頁面 (EJS)
     * 提供人類可讀的服務功能介紹和使用範例
     */
    router.get('/docs', (req, res) => {
        try {
            const serviceInfo = {
                serviceName: 'Drone Service',
                version: '1.0.0',
                description: 'AIOT 無人機控制與監控微服務',
                lastUpdated: new Date().toISOString()
            };

            res.render('drone-docs', serviceInfo);
        } catch (error) {
            console.error('❌ Failed to render drone docs:', error);
            res.status(500).json({
                status: 500,
                message: 'Failed to load service documentation',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    /**
     * TypeDoc 技術文檔
     * 直接服務 TypeDoc 生成的 HTML 檔案
     */
    router.get('/typedoc', (req, res) => {
        try {
            const docsPath = path.join(__dirname, '../../docs/index.html');
            
            // 檢查 TypeDoc 文檔是否存在
            const fs = require('fs');
            if (fs.existsSync(docsPath)) {
                res.sendFile(docsPath);
            } else {
                res.status(404).json({
                    status: 404,
                    message: 'TypeDoc documentation not found. Please run: npm run docs:generate',
                    service: 'drone-service',
                    instructions: [
                        '1. Run: npm run docs:generate',
                        '2. Or check TypeDoc configuration in typedoc.json'
                    ],
                    alternativeEndpoint: '/docs - Service information page',
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('❌ Failed to serve TypeDoc:', error);
            res.status(500).json({
                status: 500,
                message: 'Failed to load TypeDoc documentation',
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'drone-service'
            });
        }
    });

    /**
     * 文檔健康檢查
     */
    router.get('/health', (req, res) => {
        res.json({
            status: 200,
            message: 'Drone Service documentation is available',
            service: 'drone-service',
            endpoints: {
                serviceInfo: '/docs',
                technicalDocs: '/typedoc'
            },
            timestamp: new Date().toISOString()
        });
    });

    return router;
}

// 預設匯出
export default createDocsRoutes();