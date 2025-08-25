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
import 'reflect-metadata';
import { ContainerUtils } from './container/container.js';
import { TYPES } from './container/types.js';
import { App } from './app.js';
import { injectable, inject } from 'inversify';
import http from 'http';

/**
 * HTTP 伺服器管理類 (使用 InversifyJS 依賴注入)
 */
@injectable()
export class DroneHttpServer {
  private httpServer?: http.Server;

  constructor(
    @inject(TYPES.App) private app: App
  ) {}

  /**
   * 啟動 HTTP 伺服器
   */
  async start(): Promise<void> {
    try {
      console.log('🚀 Starting Drone Service HTTP server...');
      
      // 初始化應用程式
      await this.app.initialize();
      
      // 建立 HTTP 伺服器
      const port = process.env.HTTP_PORT || 3052;
      this.httpServer = http.createServer(this.app.app);
      
      // 啟動伺服器
      await new Promise<void>((resolve) => {
        this.httpServer!.listen(port, () => {
          console.log(`✅ Drone Service HTTP server is running on port ${port}`);
          console.log(`📚 Docs available at: http://localhost:${port}/api/docs`);
          console.log(`🏥 Health check at: http://localhost:${port}/health`);
          resolve();
        });
      });

      // 註冊關閉事件處理器
      process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
      
    } catch (error) {
      console.error('❌ Failed to start Drone Service HTTP server:', error);
      process.exit(1);
    }
  }

  /**
   * 優雅關閉處理
   */
  private async gracefulShutdown(signal: string): Promise<void> {
    console.log(`\n🛑 Received ${signal}, shutting down HTTP server gracefully...`);
    
    if (this.httpServer) {
      this.httpServer.close(async () => {
        try {
          await this.app.shutdown();
          console.log('✅ HTTP server graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    } else {
      process.exit(0);
    }
  }
}

/**
 * 主程式啟動邏輯
 */
async function main(): Promise<void> {
  try {
    // 直接創建伺服器實例，使用容器獲取 App 依賴
    const app = ContainerUtils.get<App>(TYPES.App);
    const server = new DroneHttpServer(app);
    await server.start();
  } catch (error) {
    console.error('❌ Unhandled error in main:', error);
    process.exit(1);
  }
}

// 啟動伺服器
main().catch((error) => {
  console.error('❌ Unhandled error in main:', error);
  process.exit(1);
});