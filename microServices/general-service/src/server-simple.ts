#!/usr/bin/env node

/**
 * @fileoverview General 服務啟動程式（簡化版）
 *
 * 專注於 HTTP API 和動態文檔功能
 *
 * @version 1.0.0
 * @author AIOT Team
 * @since 2025-08-08
 */

import 'dotenv/config';
import { App } from './app.js';
import http from 'http';

/**
 * 主要啟動邏輯
 */
async function main() {
  try {
    console.log('🚀 Starting general Service...');
    
    // 建立應用程式實例
    const app = new App();
    
    // 初始化應用程式
    await app.initialize();
    
    // 建立 HTTP 伺服器
    const port = process.env.SERVICE_PORT || 3003;
    const httpServer = http.createServer(app.app);
    
    // 啟動伺服器
    httpServer.listen(port, () => {
      console.log(`✅ general Service is running on port ${port}`);
      console.log(`📚 Docs available at: http://localhost:${port}/api/docs`);
      console.log(`🏥 Health check at: http://localhost:${port}/api/health`);
    });

    // 優雅關閉處理
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      
      httpServer.close(async () => {
        try {
          await app.shutdown();
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    // 註冊信號處理器
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start general Service:', error);
    process.exit(1);
  }
}

// 啟動服務
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});