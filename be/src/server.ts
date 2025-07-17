#!/usr/bin/env node

import 'dotenv/config';
import http from 'http';
import debug from 'debug';
import { App } from './app.js';
import { getServerConfig } from './configs/serverConfig.js';

const debugLogger = debug('aiot:server');

/**
 * HTTP 伺服器類別
 * 
 * 負責啟動 HTTP 伺服器、監聽端口、處理伺服器事件和優雅關閉。
 * 將應用程式邏輯委託給 App 類別處理。
 * 
 * @class Server
 */
class Server {
  private server: http.Server;
  private port: number | string | false;
  private app: App;

  constructor() {
    this.app = new App();
    const config = getServerConfig();
    this.port = config.port;
    this.server = http.createServer(this.app.app);
    
    this.setupShutdownHandlers();
  }

  /**
   * 設定優雅關閉處理器
   * @private
   */
  private setupShutdownHandlers(): void {
    process.on('SIGTERM', async () => {
      console.log('🔄 SIGTERM received, shutting down gracefully...');
      await this.gracefulShutdown();
    });

    process.on('SIGINT', async () => {
      console.log('🔄 SIGINT received, shutting down gracefully...');
      await this.gracefulShutdown();
    });
  }

  /**
   * 啟動伺服器
   * 
   * 初始化應用程式並啟動 HTTP 伺服器監聽指定端口
   * 
   * @returns Promise<void>
   */
  async start(): Promise<void> {
    try {
      // 初始化應用程式
      await this.app.initialize();

      // 啟動 HTTP 伺服器
      if (typeof this.port === 'number') {
        this.server.listen(this.port);
      } else {
        console.error('❌ Invalid port configuration:', this.port);
        process.exit(1);
      }

      // 設定伺服器事件監聽器
      this.server.on('error', (error) => this.onError(error));
      this.server.on('listening', () => this.onListening());

    } catch (err) {
      console.error('❌ Server startup failed', err);
      process.exit(1);
    }
  }

  /**
   * 處理伺服器錯誤事件
   * 
   * 處理伺服器啟動過程中的錯誤，特別是監聽連接埠相關的錯誤。
   * 對於權限不足和連接埠被佔用的情況會列印錯誤訊息並結束程序。
   * 
   * @private
   * @param {NodeJS.ErrnoException} error - Node.js 錯誤物件
   * @throws {Error} 對於非監聽相關的錯誤會重新拋出
   */
  private onError(error: NodeJS.ErrnoException): void {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof this.port === 'string'
      ? 'Pipe ' + this.port
      : 'Port ' + this.port;

    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
      default:
        throw error;
    }
  }

  /**
   * 處理伺服器成功監聽事件
   * 
   * 當伺服器成功開始監聽指定的連接埠或管道時觸發。
   * 在控制台輸出伺服器啟動成功的訊息。
   * 
   * @private
   */
  private onListening(): void {
    const addr = this.server.address();
    const bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + (addr && typeof addr === 'object' && 'port' in addr ? addr.port : 'unknown');
    debugLogger('Listening on ' + bind);
    console.log('🚀 Server listening on ' + bind);
  }

  /**
   * 優雅關閉伺服器
   * 
   * 先關閉應用程式資源，再關閉 HTTP 伺服器
   * 
   * @private
   */
  private async gracefulShutdown(): Promise<void> {
    try {
      // 關閉應用程式資源
      await this.app.shutdown();

      // 關閉 HTTP 伺服器
      console.log('🖥️ Closing HTTP server...');
      this.server.close(() => {
        console.log('✅ Server shut down successfully');
        process.exit(0);
      });
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// 啟動伺服器
const server = new Server();
server.start();