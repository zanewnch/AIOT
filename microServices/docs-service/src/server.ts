/**
 * @fileoverview AIOT 文檔服務 - 統一管理所有微服務的 TypeDoc 文檔
 * 
 * 提供靜態文件服務，支援多個微服務的文檔瀏覽
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-01-13
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import serveStatic from 'serve-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.SERVICE_PORT || 3005;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS 配置
app.use(cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// 日誌中間件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} - ${req.ip}`);
  next();
});

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'docs-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

// 服務資訊端點
app.get('/info', (req, res) => {
  res.json({
    service: 'AIOT Documentation Service',
    version: '1.0.0',
    description: 'Unified documentation service for all AIOT microservices',
    availableServices: {
      rbac: '/docs/rbac/',
      drone: '/docs/drone/',
      droneWebsocket: '/docs/drone-websocket/',
      general: '/docs/general/',
      frontend: '/docs/frontend/'
    },
    endpoints: {
      health: '/health',
      info: '/info',
      docs: '/docs/',
      'service-list': '/api/services'
    },
    timestamp: new Date().toISOString()
  });
});

// API 端點 - 獲取可用服務列表
app.get('/api/services', (req, res) => {
  res.json({
    services: [
      {
        name: 'RBAC Service',
        path: '/docs/rbac/',
        description: '權限控制和用戶管理服務文檔',
        type: 'backend'
      },
      {
        name: 'Drone Service',
        path: '/docs/drone/',
        description: '無人機控制和管理服務文檔',
        type: 'backend'
      },
      {
        name: 'Drone WebSocket Service',
        path: '/docs/drone-websocket/',
        description: '無人機即時通訊服務文檔',
        type: 'backend'
      },
      {
        name: 'General Service',
        path: '/docs/general/',
        description: '通用服務和用戶偏好設定文檔',
        type: 'backend'
      },
      {
        name: 'Frontend Application',
        path: '/docs/frontend/',
        description: '前端應用程式文檔',
        type: 'frontend'
      }
    ],
    total: 5,
    timestamp: new Date().toISOString()
  });
});

// 設置靜態文件服務路徑
const docsPath = NODE_ENV === 'production' 
  ? path.join(__dirname, '../docs')
  : path.join(__dirname, '../../');

// 靜態文件服務 - 各微服務文檔
const serveOptions = {
  maxAge: NODE_ENV === 'production' ? '1d' : 0,
  setHeaders: (res: any, filePath: string) => {
    // 設置正確的 MIME 類型
    if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
    // 禁用緩存以確保文檔更新及時生效
    if (NODE_ENV !== 'production') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
};

// RBAC 服務文檔
app.use('/docs/rbac', serveStatic(
  path.join(docsPath, 'rbac/docs'), 
  serveOptions
));

// Drone 服務文檔
app.use('/docs/drone', serveStatic(
  path.join(docsPath, 'drone/docs'), 
  serveOptions
));

// Drone WebSocket 服務文檔
app.use('/docs/drone-websocket', serveStatic(
  path.join(docsPath, 'drone-websocket/docs'), 
  serveOptions
));

// General 服務文檔
app.use('/docs/general', serveStatic(
  path.join(docsPath, 'general/docs'), 
  serveOptions
));

// Frontend 文檔
app.use('/docs/frontend', serveStatic(
  path.join(docsPath, '../fe/docs'), 
  serveOptions
));

// 文檔首頁
app.get('/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AIOT 系統文檔</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
                padding: 40px 20px;
            }
            
            .header h1 {
                font-size: 2.5em;
                margin-bottom: 10px;
                font-weight: 300;
            }
            
            .header p {
                font-size: 1.2em;
                opacity: 0.9;
            }
            
            .services {
                padding: 40px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 30px;
            }
            
            .service-card {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 25px;
                text-decoration: none;
                color: inherit;
                transition: all 0.3s ease;
                border: 2px solid transparent;
            }
            
            .service-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 30px rgba(0,0,0,0.1);
                border-color: #667eea;
            }
            
            .service-card h3 {
                color: #667eea;
                margin-bottom: 15px;
                font-size: 1.4em;
            }
            
            .service-card p {
                color: #666;
                margin-bottom: 15px;
            }
            
            .service-type {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.8em;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .footer {
                background: #f8f9fa;
                text-align: center;
                padding: 20px;
                color: #666;
                border-top: 1px solid #e9ecef;
            }
            
            .status-info {
                margin: 20px 40px;
                padding: 20px;
                background: #e3f2fd;
                border-radius: 8px;
                border-left: 4px solid #2196f3;
            }
            
            @media (max-width: 768px) {
                .services {
                    grid-template-columns: 1fr;
                    padding: 20px;
                }
                
                .header h1 {
                    font-size: 2em;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>AIOT 系統文檔</h1>
                <p>統一的微服務架構技術文檔中心</p>
            </div>
            
            <div class="status-info">
                <strong>服務狀態:</strong> 正常運行 | 
                <strong>最後更新:</strong> ${new Date().toLocaleString('zh-TW')} |
                <strong>版本:</strong> 1.0.0
            </div>
            
            <div class="services">
                <a href="/docs/rbac/" class="service-card">
                    <h3>RBAC Service</h3>
                    <p>權限控制和用戶管理服務的完整 API 文檔，包含角色管理、權限驗證等功能。</p>
                    <span class="service-type">Backend</span>
                </a>
                
                <a href="/docs/drone/" class="service-card">
                    <h3>Drone Service</h3>
                    <p>無人機控制和管理服務文檔，涵蓋飛行控制、狀態監控、指令管理等核心功能。</p>
                    <span class="service-type">Backend</span>
                </a>
                
                <a href="/docs/drone-websocket/" class="service-card">
                    <h3>Drone WebSocket Service</h3>
                    <p>無人機即時通訊服務文檔，提供即時狀態更新、位置追蹤和命令廣播功能。</p>
                    <span class="service-type">Backend</span>
                </a>
                
                <a href="/docs/general/" class="service-card">
                    <h3>General Service</h3>
                    <p>通用服務和用戶偏好設定文檔，包含通用工具類和配置管理功能。</p>
                    <span class="service-type">Backend</span>
                </a>
                
                <a href="/docs/frontend/" class="service-card">
                    <h3>Frontend Application</h3>
                    <p>前端應用程式的組件文檔，包含 React 組件、Hooks 和工具函數說明。</p>
                    <span class="service-type">Frontend</span>
                </a>
            </div>
            
            <div class="footer">
                <p>&copy; 2025 AIOT Team. All rights reserved. | 
                   <a href="/health" style="color: #667eea;">健康檢查</a> | 
                   <a href="/info" style="color: #667eea;">服務資訊</a> | 
                   <a href="/api/services" style="color: #667eea;">API</a>
                </p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// 根路徑重定向到文檔首頁
app.get('/', (req, res) => {
  res.redirect('/docs');
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    status: 404,
    message: '找不到請求的資源',
    error: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      docs: '/docs',
      health: '/health',
      info: '/info',
      services: '/api/services'
    }
  });
});

// 錯誤處理中間件
app.use((error: any, req: any, res: any, next: any) => {
  console.error('文檔服務錯誤:', error);
  
  res.status(500).json({
    status: 500,
    message: '內部伺服器錯誤',
    error: NODE_ENV === 'development' ? error.message : '發生錯誤',
    timestamp: new Date().toISOString()
  });
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`📚 AIOT 文檔服務已啟動`);
  console.log(`🌐 服務地址: http://localhost:${PORT}`);
  console.log(`📖 文檔首頁: http://localhost:${PORT}/docs`);
  console.log(`💊 健康檢查: http://localhost:${PORT}/health`);
  console.log(`ℹ️ 服務資訊: http://localhost:${PORT}/info`);
  console.log(`⚙️ 環境: ${NODE_ENV}`);
  console.log(`==================================================`);
});

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信號，正在優雅關閉文檔服務...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信號，正在優雅關閉文檔服務...');
  process.exit(0);
});

export default app;