#!/usr/bin/env node

/**
 * @fileoverview Drone 服務 HTTP 伺服器啟動程式
 *
 * 此檔案負責啟動 Drone 服務的 HTTP 伺服器，用於與 API Gateway 通訊
 * 包括：
 * - 載入環境變數配置
 * - 創建 HTTP 伺服器實例
 * - 設定優雅關閉機制
 * - 處理伺服器啟動過程中的錯誤
 *
 * @version 2.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'dotenv/config';
import { App } from './app.js';
import http from 'http';

/**
 * HTTP 伺服器啟動邏輯
 */
async function main() {
  try {
    console.log('🚀 Starting Drone Service HTTP server...');
    
    // 建立應用程式實例
    const app = new App();
    
    // 初始化應用程式
    await app.initialize();
    
    // 建立 HTTP 伺服器
    const port = process.env.HTTP_PORT || 3052;
    const httpServer = http.createServer(app.app);
    
    // 啟動伺服器
    httpServer.listen(port, () => {
      console.log(`✅ Drone Service HTTP server is running on port ${port}`);
      console.log(`📚 Docs available at: http://localhost:${port}/api/docs`);
      console.log(`🏥 Health check at: http://localhost:${port}/health`);
    });

    // 優雅關閉處理
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down HTTP server gracefully...`);
      
      httpServer.close(async () => {
        try {
          await app.shutdown();
          console.log('✅ HTTP server graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    // 註冊關閉事件處理器
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Failed to start Drone Service HTTP server:', error);
    process.exit(1);
  }
}

// 啟動伺服器
main().catch((error) => {
  console.error('❌ Unhandled error in main:', error);
  process.exit(1);
});