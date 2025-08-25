/**
 * @fileoverview Auth Service README 路由
 * @description 提供 README 文檔顯示功能
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

/**
 * 渲染 Markdown 內容為完整的 HTML 頁面
 */
const renderReadmeToHtml = (markdownContent: string, serviceName: string): string => {
    const htmlContent = marked(markdownContent);
    
    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${serviceName} README</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; 
            max-width: 900px; 
            margin: 0 auto; 
            padding: 2rem; 
            line-height: 1.6; 
            color: #333; 
            background: #fafafa;
        }
        .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1, h2, h3 { color: #2c3e50; }
        h1 { 
            border-bottom: 3px solid #3498db; 
            padding-bottom: 0.5rem; 
            margin-bottom: 1.5rem;
        }
        h2 { 
            border-bottom: 1px solid #ecf0f1; 
            padding-bottom: 0.3rem; 
            margin-top: 2rem;
        }
        h3 { margin-top: 1.5rem; }
        pre { 
            background: #f8f9fa; 
            padding: 1rem; 
            border-radius: 6px; 
            overflow-x: auto;
            border-left: 4px solid #3498db;
        }
        code { 
            background: #f1f2f6; 
            padding: 0.2rem 0.4rem; 
            border-radius: 3px; 
            font-size: 0.9em;
        }
        pre code {
            background: transparent;
            padding: 0;
        }
        blockquote { 
            border-left: 4px solid #3498db; 
            margin: 1rem 0; 
            padding: 0.5rem 1rem; 
            background: #f8f9fa;
            font-style: italic;
        }
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 1rem 0; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 0.75rem; 
            text-align: left; 
        }
        th { 
            background: #f8f9fa; 
            font-weight: 600;
            color: #2c3e50;
        }
        tr:nth-child(even) {
            background: #f9f9f9;
        }
        .badge { 
            background: #3498db; 
            color: white; 
            padding: 0.2rem 0.5rem; 
            border-radius: 3px; 
            font-size: 0.8rem; 
        }
        .service-badge {
            background: #e74c3c;
            color: white;
            padding: 0.3rem 0.6rem;
            border-radius: 4px;
            font-weight: 600;
            margin-right: 0.5rem;
        }
        .footer {
            text-align: center; 
            color: #7f8c8d; 
            font-size: 0.9rem;
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid #ecf0f1;
        }
        ul, ol { margin-left: 1.5rem; }
        li { margin-bottom: 0.5rem; }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div style="margin-bottom: 2rem;">
            <span class="service-badge">${serviceName}</span>
            <span style="color: #7f8c8d; font-size: 0.9rem;">AIOT Microservice Documentation</span>
        </div>
        ${htmlContent}
        <div class="footer">
            <p>
                <span class="badge">AIOT ${serviceName}</span> | 
                Generated on ${new Date().toLocaleString('zh-TW')} |
                <a href="./readme/raw" target="_blank">View Raw Markdown</a>
            </p>
        </div>
    </div>
</body>
</html>`;
};

/**
 * README HTML 渲染版本
 */
router.get('/readme', (_req, res) => {
    try {
        const readmePath = join(__dirname, '../../README.md');
        const readmeContent = readFileSync(readmePath, 'utf-8');
        const htmlContent = renderReadmeToHtml(readmeContent, 'Auth Service');
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(htmlContent);
    } catch (error) {
        res.status(404).json({
            status: 404,
            success: false,
            message: 'README.md not found',
            service: 'auth-service',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * README 原始 Markdown 版本
 */
router.get('/readme/raw', (_req, res) => {
    try {
        const readmePath = join(__dirname, '../../README.md');
        const readmeContent = readFileSync(readmePath, 'utf-8');
        
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.send(readmeContent);
    } catch (error) {
        res.status(404).json({
            status: 404,
            success: false,
            message: 'README.md not found',
            service: 'auth-service',
            timestamp: new Date().toISOString()
        });
    }
});

export default router;