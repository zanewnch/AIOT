/**
 * @fileoverview Gateway Service README 路由
 * @description 提供服務 README 文檔內容的 HTTP 端點
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { marked } from 'marked';
import { loggerConfig } from '../configs/loggerConfig.js';

const router = Router();

/**
 * README 內容端點 - HTML 渲染版本
 * 返回渲染後的 HTML 格式文檔
 */
router.get('/readme', (_req, res) => {
    try {
        loggerConfig.info('📖 Serving Gateway Service README (HTML)');
        
        const readmePath = join(process.cwd(), 'README.md');
        const readmeContent = readFileSync(readmePath, 'utf-8');
        
        // 渲染 Markdown 為 HTML
        const htmlContent = marked(readmeContent);
        
        const fullHtml = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gateway Service README</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            max-width: 900px; 
            margin: 0 auto; 
            padding: 2rem; 
            line-height: 1.6; 
            color: #333; 
        }
        h1, h2, h3 { color: #2c3e50; }
        h1 { border-bottom: 2px solid #3498db; padding-bottom: 0.5rem; }
        h2 { border-bottom: 1px solid #ecf0f1; padding-bottom: 0.3rem; }
        pre { background: #f8f9fa; padding: 1rem; border-radius: 4px; overflow-x: auto; }
        code { background: #f1f2f6; padding: 0.2rem 0.4rem; border-radius: 3px; }
        blockquote { border-left: 4px solid #3498db; margin: 1rem 0; padding: 0.5rem 1rem; background: #f8f9fa; }
        table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        th, td { border: 1px solid #ddd; padding: 0.75rem; text-align: left; }
        th { background: #f8f9fa; font-weight: 600; }
        .badge { background: #3498db; color: white; padding: 0.2rem 0.5rem; border-radius: 3px; font-size: 0.8rem; }
    </style>
</head>
<body>
    ${htmlContent}
    <hr style="margin-top: 3rem; border: none; border-top: 1px solid #ecf0f1;">
    <p style="text-align: center; color: #7f8c8d; font-size: 0.9rem;">
        <span class="badge">AIOT Gateway Service</span> | 
        Generated on ${new Date().toLocaleString('zh-TW')}
    </p>
</body>
</html>`;
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(fullHtml);
        
        loggerConfig.debug('✅ README HTML content served successfully');
        
    } catch (error) {
        loggerConfig.error('❌ Failed to serve README:', error);
        
        res.status(404).json({
            status: 404,
            success: false,
            message: 'README.md not found',
            service: 'gateway-service',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * README 原始內容端點
 * 返回原始的 Markdown 格式文檔
 */
router.get('/readme/raw', (_req, res) => {
    try {
        loggerConfig.info('📖 Serving Gateway Service README (Raw Markdown)');
        
        const readmePath = join(process.cwd(), 'README.md');
        const readmeContent = readFileSync(readmePath, 'utf-8');
        
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.send(readmeContent);
        
        loggerConfig.debug('✅ README raw content served successfully');
        
    } catch (error) {
        loggerConfig.error('❌ Failed to serve README:', error);
        
        res.status(404).json({
            status: 404,
            success: false,
            message: 'README.md not found',
            service: 'gateway-service',
            timestamp: new Date().toISOString()
        });
    }
});

export default router;