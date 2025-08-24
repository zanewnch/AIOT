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
import { ContainerUtils } from './container/container';
import { TYPES } from './container/types';
import { App } from './app';
import { injectable, inject } from 'inversify';
import http from 'http';

/**
 * HTTP 伺服器管理類別 (使用 InversifyJS 依賴注入)
 * 負責啟動和管理 Scheduler Service 的 HTTP 伺服器
 */
@injectable()
export class SchedulerHttpServer {
  // HTTP 伺服器實例
  private httpServer?: http.Server;

  constructor(
    // 注入應用程式實例
    @inject(TYPES.App) private readonly app: App,
    // 注入日誌服務
    @inject(TYPES.Logger) private readonly logger: any
  ) {}

  /**
   * 啟動 HTTP 伺服器
   * 初始化應用程式並啟動 HTTP 服務
   */
  start = async (): Promise<void> => {
    try {
      console.log('🚀 Starting Scheduler Service HTTP server...');
      this.logger.info('正在啟動 Scheduler Service HTTP 伺服器...');
      
      // 初始化應用程式和所有服務
      await this.app.initialize();
      
      // 建立 HTTP 伺服器實例
      const port = process.env.PORT || 3001;
      this.httpServer = http.createServer(this.app.app);
      
      // 啟動伺服器並等待啟動完成
      await new Promise<void>((resolve, reject) => {
        this.httpServer!.listen(port, () => {
          console.log(`✅ Scheduler Service HTTP server is running on port ${port}`);
          console.log(`🏥 Health check at: http://localhost:${port}/health`);
          console.log(`📊 Metrics at: http://localhost:${port}/metrics`);
          console.log(`⏰ Schedule status at: http://localhost:${port}/schedule/status`);
          
          this.logger.info('HTTP 伺服器啟動成功', {
            port,
            nodeEnv: process.env.NODE_ENV || 'development',
            pid: process.pid
          });
          
          resolve();
        });

        // 處理伺服器啟動錯誤
        this.httpServer!.on('error', (error: any) => {
          if (error.syscall !== 'listen') {
            reject(error);
            return;
          }

          switch (error.code) {
            case 'EACCES':
              const eaccesMsg = `Port ${port} requires elevated privileges`;
              console.error(`❌ ${eaccesMsg}`);
              this.logger.error(eaccesMsg);
              process.exit(1);
              
            case 'EADDRINUSE':
              const eaddrMsg = `Port ${port} is already in use`;
              console.error(`❌ ${eaddrMsg}`);
              this.logger.error(eaddrMsg);
              process.exit(1);
              
            default:
              reject(error);
          }
        });
      });

      // 註冊關閉事件處理器
      process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
      
    } catch (error) {
      console.error('❌ Failed to start Scheduler Service HTTP server:', error);
      this.logger.error('HTTP 伺服器啟動失敗', error);
      process.exit(1);
    }
  };

  /**
   * 優雅關閉處理
   * 確保所有連線和服務都正確關閉
   */
  private gracefulShutdown = async (signal: string): Promise<void> => {
    console.log(`\n🛑 Received ${signal}, shutting down HTTP server gracefully...`);
    this.logger.info(`收到 ${signal} 信號，開始優雅關閉 HTTP 伺服器...`);
    
    if (this.httpServer) {
      this.httpServer.close(async () => {
        try {
          // 關閉應用程式和所有服務
          await this.app.shutdown();
          
          console.log('✅ HTTP server graceful shutdown completed');
          this.logger.info('HTTP 伺服器優雅關閉完成');
          
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          this.logger.error('關閉過程中發生錯誤', error);
          
          process.exit(1);
        }
      });

      // 設定強制關閉超時（30秒）
      setTimeout(() => {
        console.error('❌ Forced shutdown due to timeout');
        this.logger.error('由於超時而強制關閉');
        process.exit(1);
      }, 30000);
      
    } else {
      process.exit(0);
    }
  };
}

/**
 * 主程式啟動邏輯
 * 使用 IoC 容器管理依賴
 */
const main = async (): Promise<void> => {
  try {
    // 使用 IoC 容器獲取伺服器實例
    const server = ContainerUtils.get<SchedulerHttpServer>(TYPES.SchedulerHttpServer);
    await server.start();
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