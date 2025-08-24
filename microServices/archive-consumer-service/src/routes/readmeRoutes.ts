/**
 * @fileoverview Archive Consumer Service README 路由
 * @description 提供服務 README 文檔內容的 HTTP 端點
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Logger } from 'winston';

/**
 * 創建 README 路由
 * @param logger Winston 日誌器實例
 * @returns Express Router
 */
export function createReadmeRoutes(logger: Logger): Router {
    const router = Router();

    /**
     * README 內容端點
     * 返回 markdown 格式的服務文檔
     */
    router.get('/readme', (_req: Request, res: Response) => {
        try {
            logger.info('📖 Serving Archive Consumer Service README');
            
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
                service: 'archive-consumer-service',
                timestamp: new Date().toISOString()
            });
        }
    });

    return router;
}