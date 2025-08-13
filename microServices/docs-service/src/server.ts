/**
 * @fileoverview AIOT 文檔服務 - 統一的微服務文檔中心
 * 
 * ==============================================
 * 🎯 核心設計意圖 (Core Design Intent)
 * ==============================================
 * 
 * 這個文檔服務解決了微服務架構中的核心問題：
 * 1. 📚 **統一文檔入口**：將分散在各個微服務中的 TypeDoc 文檔集中管理
 * 2. 🔗 **跨服務瀏覽**：提供單一網址訪問所有服務的技術文檔
 * 3. 🚀 **開發者體驗**：簡化文檔查閱流程，提高開發效率
 * 4. 📋 **文檔標準化**：確保所有微服務文檔格式和訪問方式一致
 * 
 * ==============================================
 * 🏗️ 架構角色 (Architecture Role)  
 * ==============================================
 * 
 * 在 AIOT 微服務架構中，這個服務扮演以下角色：
 * 
 * ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
 * │   Kong Gateway  │    │  docs-service   │    │   TypeDoc 文檔   │
 * │    (HTTP 層)    │───▶│   (聚合層)      │───▶│    (文件層)     │
 * └─────────────────┘    └─────────────────┘    └─────────────────┘
 *      外部訪問              統一服務              靜態文檔文件
 * 
 * • Kong Gateway: 統一入口和路由 (/docs -> docs-service)
 * • docs-service: 文檔聚合和展示服務 (本文件)
 * • TypeDoc 文檔: 各微服務生成的靜態 HTML 文檔
 * 
 * ==============================================
 * 📂 文檔來源映射 (Document Source Mapping)
 * ==============================================
 * 
 * Docker Volume 掛載機制：
 * 宿主機路徑                    →  容器內路徑           →  HTTP 路徑
 * /microServices/rbac/docs      →  /app/docs/rbac       →  /docs/rbac/
 * /microServices/drone/docs     →  /app/docs/drone      →  /docs/drone/
 * /microServices/general/docs   →  /app/docs/general    →  /docs/general/
 * /fe/docs                      →  /app/docs/frontend   →  /docs/frontend/
 * 
 * ==============================================
 * 🌐 實際功能說明 (Actual Functionality)
 * ==============================================
 * 
 * 這個 Express.js 服務器實際執行的任務：
 * 
 * 1. **靜態文件伺服器**：
 *    - 使用 serve-static 中間件提供 TypeDoc 生成的 HTML 文檔
 *    - 支援 HTML、CSS、JavaScript 文件的正確 MIME 類型
 *    - 開發環境下禁用緩存，確保文檔更新即時生效
 * 
 * 2. **智能路由系統**：
 *    - `/docs/rbac/` → RBAC 服務的 TypeDoc 文檔
 *    - `/docs/drone/` → 無人機控制服務的 TypeDoc 文檔  
 *    - `/docs/general/` → 通用服務的 TypeDoc 文檔
 *    - `/docs/frontend/` → 前端應用的文檔
 * 
 * 3. **用戶友好界面**：
 *    - `/docs` 提供美觀的文檔導航首頁
 *    - 響應式設計，支援桌面和移動設備
 *    - 卡片式佈局，清楚展示各服務文檔入口
 * 
 * 4. **服務監控**：
 *    - `/health` 健康檢查端點 (供 Docker/K8s 使用)
 *    - `/info` 服務詳細資訊和可用端點列表
 *    - `/api/services` RESTful API 獲取服務列表
 * 
 * 5. **開發友好特性**：
 *    - 詳細的請求日誌記錄
 *    - 404 錯誤處理與有用的錯誤訊息
 *    - 優雅的進程關閉處理 (SIGTERM/SIGINT)
 * 
 * ==============================================
 * 🔄 工作流程 (Workflow)
 * ==============================================
 * 
 * 1. 開發者修改微服務代碼
 * 2. 運行 `npm run docs:generate` 生成 TypeDoc 文檔
 * 3. 文檔文件更新到各服務的 `/docs` 目錄
 * 4. Docker volume 即時同步到文檔服務容器
 * 5. 開發者通過 Kong Gateway 訪問統一文檔入口
 * 6. 文檔服務提供即時更新的技術文檔
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-01-13
 * @architecture Microservices + API Gateway + Static Documentation
 * @deployment Docker + Kong Gateway + Volume Mounts
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

// ==============================================
// 🌐 CORS 配置 - 跨域資源共享
// ==============================================
// 
// 設計考量：
// • origin: '*' - 允許任何域名訪問，因為這是內部文檔服務
// • methods: 只允許讀取操作，符合文檔服務的唯讀性質  
// • credentials: false - 文檔不需要認證，簡化訪問流程
// 
// 安全性說明：
// 這個服務只提供靜態文檔，沒有敏感數據，所以採用寬鬆的 CORS 政策
// 在生產環境中，Kong Gateway 會提供額外的安全層級控制
app.use(cors({
  origin: '*',                                    // 允許所有來源 (內部服務)
  methods: ['GET', 'HEAD', 'OPTIONS'],          // 只允許讀取操作
  allowedHeaders: ['Content-Type', 'Authorization'], // 標準 HTTP 頭
  credentials: false                             // 不需要認證 cookies
}));

// ==============================================
// 📝 請求日誌中間件 - 開發和監控支援
// ==============================================
// 
// 功能說明：
// • 記錄每個 HTTP 請求的詳細資訊
// • 協助開發除錯和生產監控
// • 追蹤文檔訪問模式和頻率
// 
// 日誌格式：[ISO時間戳] HTTP方法 請求路徑 - 客戶端IP
// 範例：[2025-01-13T16:51:12.786Z] GET /docs/rbac/ - ::ffff:172.20.0.7
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

// ==============================================
// 📂 靜態文件服務配置 - TypeDoc 文檔託管
// ==============================================
// 
// 路徑解析策略：
// • 生產環境：文檔已複製到容器內的 ../docs 目錄
// • 開發環境：使用 Docker Volume 掛載，指向 ../../ (即 /app/../)
// 
// 這樣設計的原因：
// 1. 開發環境：即時同步，修改文檔立即可見
// 2. 生產環境：靜態打包，提高性能和安全性
const docsPath = NODE_ENV === 'production' 
  ? path.join(__dirname, '../docs')      // 生產：內建文檔
  : path.join(__dirname, '../../');      // 開發：Volume 掛載

// ==============================================
// ⚙️ 靜態文件服務選項 - 性能和緩存策略
// ==============================================
// 
// 緩存策略：
// • 生產環境：1天緩存，減少服務器負載
// • 開發環境：禁用緩存，確保文檔更新即時可見
// 
// MIME 類型處理：
// • 確保瀏覽器正確解析 HTML、CSS、JavaScript 文件
// • 支援 UTF-8 編碼，正確顯示中文文檔內容
const serveOptions = {
  maxAge: NODE_ENV === 'production' ? '1d' : 0,  // 緩存策略
  setHeaders: (res: any, filePath: string) => {
    // ===========================================
    // 📄 MIME 類型設定 - 確保正確文件解析
    // ===========================================
    if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
    
    // ===========================================  
    // 🚫 開發環境緩存禁用 - 即時文檔更新
    // ===========================================
    // 
    // 重要性：開發者修改代碼並重新生成文檔後，
    // 需要立即看到更新，不能被瀏覽器緩存阻擋
    if (NODE_ENV !== 'production') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');        // HTTP/1.0 向後相容
      res.setHeader('Expires', '0');              // 強制過期
    }
  }
};

// ==============================================
// 🗂️ 微服務文檔路由註冊 - 統一訪問入口
// ==============================================
// 
// 每個路由對應一個微服務的 TypeDoc 文檔
// 使用 serve-static 中間件提供高效的靜態文件服務
// 
// 路由設計原則：
// • 清楚的 URL 結構：/docs/{service-name}/
// • 保持與服務名稱一致，便於記憶和維護
// • 支援深層路徑訪問 (如 /docs/rbac/classes/UserService.html)

// 🔐 RBAC 服務文檔 - 權限控制和用戶管理
// 路徑映射：/docs/rbac/* → /app/docs/rbac/*
app.use('/docs/rbac', serveStatic(
  path.join(docsPath, 'rbac/docs'), 
  serveOptions
));

// 🚁 Drone 服務文檔 - 無人機控制和管理
// 路徑映射：/docs/drone/* → /app/docs/drone/*
app.use('/docs/drone', serveStatic(
  path.join(docsPath, 'drone/docs'), 
  serveOptions
));

// 📡 Drone WebSocket 服務文檔 - 無人機即時通訊
// 路徑映射：/docs/drone-websocket/* → /app/docs/drone-websocket/*
app.use('/docs/drone-websocket', serveStatic(
  path.join(docsPath, 'drone-websocket/docs'), 
  serveOptions
));

// ⚙️ General 服務文檔 - 通用服務和用戶偏好
// 路徑映射：/docs/general/* → /app/docs/general/*
app.use('/docs/general', serveStatic(
  path.join(docsPath, 'general/docs'), 
  serveOptions
));

// 🖥️ Frontend 文檔 - 前端應用程式文檔
// 路徑映射：/docs/frontend/* → /app/docs/frontend/*
// 注意：前端文檔路徑與其他服務不同，位於 ../fe/docs
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