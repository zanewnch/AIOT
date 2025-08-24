#!/usr/bin/env node

/**
 * @fileoverview Scheduler Service HTTP 伺服器啟動程式
 *
 * 此檔案負責啟動 Scheduler 服務的 HTTP 伺服器
 * 採用現代化架構模式，使用 InversifyJS 依賴注入
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
import 'reflect-metadata';
import { container } from './container/container';
import { TYPES } from './container/types';
import * as http from 'http';

/**
 * 主程式啟動邏輯
 * 使用 IoC 容器管理依賴
 */
const main = async (): Promise<void> => {
  try {
    console.log('🚀 Starting Scheduler Service HTTP server...');
    
    // 從容器取得 App 實例
    const app = container.get(TYPES.App);
    
    // 初始化應用程式
    await app.initialize();
    
    // 建立 HTTP 伺服器
    const port = process.env.PORT || 3001;
    const httpServer = http.createServer(app.app);
    
    // 啟動伺服器
    await new Promise<void>((resolve, reject) => {
      httpServer.listen(port, () => {
        console.log(`✅ Scheduler Service HTTP server is running on port ${port}`);
        console.log(`🏥 Health check at: http://localhost:${port}/health`);
        console.log(`📊 Metrics at: http://localhost:${port}/metrics`);
        console.log(`⏰ Schedule status at: http://localhost:${port}/schedule/status`);
        resolve();
      });

      httpServer.on('error', (error: any) => {
        if (error.syscall !== 'listen') {
          reject(error);
          return;
        }

        switch (error.code) {
          case 'EACCES':
            console.error(`❌ Port ${port} requires elevated privileges`);
            process.exit(1);
            
          case 'EADDRINUSE':
            console.error(`❌ Port ${port} is already in use`);
            process.exit(1);
            
          default:
            reject(error);
        }
      });
    });

    // 優雅關閉處理
    const gracefulShutdown = async (signal: string): Promise<void> => {
      console.log(`\n🛑 Received ${signal}, shutting down server gracefully...`);
      
      httpServer.close(async () => {
        try {
          await app.shutdown();
          console.log('✅ Server graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error('❌ Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Unhandled error in main:', error);
    process.exit(1);
  }
};

// 啟動伺服器
main().catch((error) => {
  console.error('❌ Failed to start scheduler service:', error);
  process.exit(1);
});