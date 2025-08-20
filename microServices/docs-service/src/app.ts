/**
 * @fileoverview AIOT 文檔服務 - 應用程式配置
 * 
 * 職責分離：
 * - app.ts: 負責 Express 應用程式的配置和設定
 * - server.ts: 負責 HTTP 服務器的啟動和生命週期管理
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { AppRoutes } from './routes/index.js';
import type { ErrorResponse } from './types/index.js';

// ESM 路徑解析
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = (): express.Application => {
  const app = express();

  // ==============================================
  // 🎨 模板引擎配置 - EJS
  // ==============================================
  app.set('view engine', 'ejs');
  
  // 根據環境設定 views 路徑
  // 在開發環境中，使用熱重載時需要指向源碼目錄
  const viewsPath = path.join(__dirname, 'views');
  
  console.log(`🎨 Views 路徑: ${viewsPath}`);
  app.set('views', viewsPath);

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
  // 在生產環境中，API Gateway 會提供額外的安全層級控制
  app.use(cors(config.cors));

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
  app.use((req, _res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url} - ${req.ip}`);
    next();
  });

  // ==============================================
  // 🛣️ 路由註冊 - 模組化路由管理
  // ==============================================
  AppRoutes.register(app);

  // ==============================================
  // 🚫 404 錯誤處理 - 友好的錯誤響應
  // ==============================================
  app.use('*', (req, res) => {
    const errorResponse: ErrorResponse = {
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
    };
    
    res.status(404).json(errorResponse);
  });

  // ==============================================
  // ⚠️ 全局錯誤處理中間件
  // ==============================================
  app.use((error: any, _req: any, res: any, _next: any) => {
    console.error('文檔服務錯誤:', error);
    
    const errorResponse: ErrorResponse = {
      status: 500,
      message: '內部伺服器錯誤',
      error: config.server.environment === 'development' ? error.message : '發生錯誤',
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(errorResponse);
  });

  return app;
};