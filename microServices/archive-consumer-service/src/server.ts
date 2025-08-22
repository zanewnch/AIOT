#!/usr/bin/env node

/**
 * @fileoverview Archive Consumer Service HTTP 伺服器啟動程式
 * 
 * 【設計意圖 (Intention)】
 * 啟動 Archive Consumer Service 的 HTTP 伺服器，用於監控和健康檢查
 * 包括：
 * - 載入環境變數配置
 * - 創建 HTTP 伺服器實例
 * - 設定優雅關閉機制
 * - 處理伺服器啟動過程中的錯誤
 * 
 * 【架構選擇考量】
 * 雖然此服務主要透過 RabbitMQ 與 Scheduler Service 通訊，但仍提供 HTTP 端點的原因：
 * 1. 容器健康檢查：Docker/Kubernetes 需要 HTTP 健康檢查來判斷容器狀態
 * 2. 運維監控：提供服務狀態和指標給監控系統 (如 Prometheus)
 * 3. 故障排查：運維人員可以透過 HTTP 端點快速檢查服務狀態
 * 4. 標準化：統一的健康檢查接口便於基礎設施管理
 * 
 * 【通訊架構圖】
 * ┌─────────────────┐    RabbitMQ    ┌──────────────────────┐
 * │ Scheduler       │ ──────────────▶ │ Archive Consumer     │
 * │ Service         │                 │ - RabbitMQ Consumer  │ (主要業務邏輯)
 * └─────────────────┘                 │ - HTTP Health Check  │ (運維監控)
 *                                     └──────────────────────┘
 *                                              ▲
 *                                     HTTP     │
 *                                   ┌─────────────────┐
 *                                   │ Docker/K8s      │
 *                                   │ Monitoring      │
 *                                   └─────────────────┘
 * 
 * @version 2.0.0
 * @author AIOT Team
 * @since 2025-08-21
 */

import 'dotenv/config';
import http from 'http';
import { container } from './container/container';
import { TYPES } from './container/types';
import { App } from './app';
import { config } from './configs/environment';

/**
 * HTTP 伺服器啟動邏輯
 */
const main = async (): Promise<void> => {
  try {
    console.log('🚀 Starting Archive Consumer Service HTTP server...');
    
    // 建立應用程式實例 (使用 IoC 容器)
    const app = container.get<App>(TYPES.App);
    
    // 初始化應用程式
    await app.initialize();
    
    // 建立 HTTP 伺服器
    const port = config.service.port;
    const httpServer = http.createServer(app.app);
    
    // 啟動伺服器
    httpServer.listen(port, () => {
      console.log(`✅ Archive Consumer Service HTTP server is running on port ${port}`);
      console.log(`🌡️ Health check at: http://localhost:${port}/health`);
      console.log(`📊 Status info at: http://localhost:${port}/status`);
      console.log(`📈 Metrics at: http://localhost:${port}/metrics`);
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
      
      // 強制關閉逾時
      setTimeout(() => {
        console.error('❌ Forced shutdown due to timeout');
        process.exit(1);
      }, 30000); // 30秒逾時
    };

    // 註冊關閉事件處理器
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // 處理未捕獲的異常
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      console.error('❌ Unhandled Rejection:', reason);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Failed to start Archive Consumer Service HTTP server:', error);
    process.exit(1);
  }
};

// 啟動伺服器
main().catch((error) => {
  console.error('❌ Unhandled error in main:', error);
  process.exit(1);
});