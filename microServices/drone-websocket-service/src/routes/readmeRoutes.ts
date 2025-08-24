/**
 * @fileoverview Drone WebSocket Service README 路由
 * @description 提供服務 README 文檔內容的 HTTP 端點
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../configs/loggerConfig.js';

const logger = createLogger('ReadmeRoutes');
const router = Router();

/**
 * README 內容端點
 * 返回 markdown 格式的服務文檔
 */
router.get('/readme', (_req, res) => {
    try {
        logger.info('📖 Serving Drone WebSocket Service README');
        
        const readmePath = join(__dirname, '../../../README.md');
        const readmeContent = readFileSync(readmePath, 'utf-8');
        
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.send(readmeContent);
        
        logger.debug('✅ README content served successfully');
        
    } catch (error) {
        logger.error('❌ Failed to serve README:', error);
        
        res.status(404).json({
            status: 404,
            success: false,
            message: 'README.md not found',
            service: 'drone-websocket-service',
            timestamp: new Date().toISOString()
        });
    }
});

export default router;