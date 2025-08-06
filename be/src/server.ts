#!/usr/bin/env node

/**
 * @fileoverview AIOT 系統伺服器啟動程式
 * 
 * 此檔案負責啟動整個 AIOT 系統的 HTTP 伺服器，包括：
 * - 載入環境變數配置
 * - 創建 HTTP 伺服器實例
 * - 設定優雅關閉機制
 * - 處理伺服器啟動過程中的錯誤
 * - 管理應用程式的生命週期
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'dotenv/config'; // 載入環境變數配置檔案（.env）
import http from 'http'; // Node.js 內建的 HTTP 模組，用於創建 HTTP 伺服器
import debug from 'debug'; // 除錯工具，用於輸出除錯訊息
import { App } from './app.js'; // 導入應用程式主體類別
import { getServerConfig } from './configs/serverConfig.js'; // 導入伺服器配置獲取函式

/**
 * 建立除錯日誌記錄器，用於輸出伺服器相關的除錯訊息
 * 使用 'aiot:server' 作為命名空間
 * @type {debug.Debugger}
 */
const debugLogger = debug('aiot:server');

/**
 * HTTP 伺服器類別
 * 
 * 此類別負責管理整個 AIOT 系統的 HTTP 伺服器生命週期，包括：
 * - 伺服器的啟動和關閉
 * - 端口監聽和錯誤處理
 * - 優雅關閉機制的實現
 * - 將應用程式邏輯委託給 App 類別處理
 * 
 * @class Server
 * @example
 * ```typescript
 * const server = new Server();
 * await server.start();
 * ```
 * 
 * @since 1.0.0
 */
class Server {
  /**
   * HTTP 伺服器實例
   * @private
   * @type {http.Server}
   */
  private server: http.Server;
  
  /**
   * 伺服器監聽的端口號
   * 可以是數字（端口號）、字串（管道路徑）或 false（無效配置）
   * @private
   * @type {number | string | false}
   */
  private port: number | string | false;
  
  /**
   * 應用程式實例
   * @private
   * @type {App}
   */
  private app: App;

  /**
   * 建構函式 - 初始化伺服器實例
   * 
   * 執行以下初始化步驟：
   * 1. 建立應用程式實例
   * 2. 載入伺服器配置
   * 3. 建立 HTTP 伺服器
   * 4. 設定優雅關閉處理器
   * 
   * @constructor
   * @throws {Error} 當配置載入失敗時拋出錯誤
   */
  constructor() {
    this.app = new App(); // 建立應用程式實例
    const config = getServerConfig(); // 載入伺服器配置
    this.port = config.port; // 設定監聽端口
    this.server = http.createServer(this.app.app); // 建立 HTTP 伺服器並綁定 Express 應用程式
    
    this.setupShutdownHandlers(); // 設定優雅關閉處理器
  }

  /**
   * 設定優雅關閉處理器
   * 
   * 監聽系統終止信號，並在收到信號時執行優雅關閉程序。
   * 支援的信號包括：
   * - SIGTERM：終止信號（通常由系統或容器發送）
   * - SIGINT：中斷信號（通常由 Ctrl+C 觸發）
   * 
   * @private
   * @method setupShutdownHandlers
   * @returns {void}
   */
  private setupShutdownHandlers(): void {
    // 監聽 SIGTERM 信號（正常終止）
    process.on('SIGTERM', async () => {
      console.log('🔄 SIGTERM received, shutting down gracefully...'); // 輸出接收到終止信號的訊息
      await this.gracefulShutdown(); // 執行優雅關閉程序
    });

    // 監聽 SIGINT 信號（中斷信號，如 Ctrl+C）
    process.on('SIGINT', async () => {
      console.log('🔄 SIGINT received, shutting down gracefully...'); // 輸出接收到中斷信號的訊息
      await this.gracefulShutdown(); // 執行優雅關閉程序
    });
  }

  /**
   * 啟動伺服器
   * 
   * 執行完整的伺服器啟動程序，包括：
   * 1. 初始化應用程式（資料庫連線、中間件設定等）
   * 2. 驗證端口配置並啟動 HTTP 伺服器
   * 3. 設定伺服器事件監聽器
   * 4. 處理啟動過程中的錯誤
   * 
   * @public
   * @async
   * @method start
   * @returns {Promise<void>} 伺服器啟動完成的 Promise
   * @throws {Error} 當伺服器啟動失敗時拋出錯誤
   * 
   * @example
   * ```typescript
   * const server = new Server();
   * await server.start();
   * ```
   */
  async start(): Promise<void> {
    try {
      // 初始化應用程式（包含資料庫連線、中間件設定、路由配置等）
      await this.app.initialize();

      // 驗證端口配置並啟動 HTTP 伺服器
      if (typeof this.port === 'number') {
        this.server.listen(this.port); // 開始監聽指定端口
      } else {
        console.error('❌ Invalid port configuration:', this.port); // 輸出無效端口配置錯誤
        process.exit(1); // 以錯誤狀態碼結束程序
      }

      // 設定伺服器事件監聽器
      this.server.on('error', (error) => this.onError(error)); // 監聽伺服器錯誤事件
      this.server.on('listening', async () => {
        this.onListening(); // 處理伺服器監聽事件
        
        // 初始化 WebSocket 服務（必須在 HTTP 伺服器啟動後）
        try {
          await this.app.initializeWebSocket(this.server);
          console.log('🚀 WebSocket services ready');
        } catch (wsError) {
          console.error('❌ WebSocket initialization failed:', wsError);
          // WebSocket 初始化失敗不應該終止整個應用程式
        }
      });

    } catch (err) {
      console.error('❌ Server startup failed', err); // 輸出伺服器啟動失敗錯誤
      process.exit(1); // 以錯誤狀態碼結束程序
    }
  }

  /**
   * 處理伺服器錯誤事件
   * 
   * 處理伺服器啟動過程中的各種錯誤，特別是與端口監聽相關的錯誤。
   * 對於特定的錯誤類型（如權限不足、端口被佔用）會輸出友善的錯誤訊息並結束程序。
   * 對於其他類型的錯誤則重新拋出供上層處理。
   * 
   * @private
   * @method onError
   * @param {NodeJS.ErrnoException} error - Node.js 系統錯誤物件，包含錯誤代碼和系統調用資訊
   * @throws {Error} 對於非監聽相關的錯誤會重新拋出
   * 
   * @example
   * 常見的錯誤類型：
   * - EACCES：權限不足（通常是嘗試綁定小於 1024 的端口）
   * - EADDRINUSE：端口已被佔用
   */
  private onError(error: NodeJS.ErrnoException): void {
    // 如果不是監聽相關的錯誤，直接重新拋出
    if (error.syscall !== 'listen') {
      throw error;
    }

    // 根據端口類型構建錯誤訊息中的綁定描述
    const bind = typeof this.port === 'string'
      ? 'Pipe ' + this.port  // 管道路徑
      : 'Port ' + this.port; // 端口號

    // 根據錯誤代碼處理不同類型的監聽錯誤
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges'); // 需要管理員權限
        process.exit(1); // 以錯誤狀態碼結束程序
      case 'EADDRINUSE':
        console.error(bind + ' is already in use'); // 端口已被佔用
        process.exit(1); // 以錯誤狀態碼結束程序
      default:
        throw error; // 其他未知錯誤重新拋出
    }
  }

  /**
   * 處理伺服器成功監聽事件
   * 
   * 當伺服器成功開始監聽指定的端口或管道時觸發此回調函式。
   * 功能包括：
   * 1. 獲取伺服器實際監聽的地址資訊
   * 2. 格式化地址資訊為可讀的字串
   * 3. 輸出除錯訊息和使用者友善的啟動訊息
   * 
   * @private
   * @method onListening
   * @returns {void}
   */
  private onListening(): void {
    const addr = this.server.address(); // 獲取伺服器監聽的地址資訊
    
    // 根據地址類型格式化綁定資訊
    const bind = typeof addr === 'string'
      ? 'pipe ' + addr  // 管道路徑格式
      : 'port ' + (addr && typeof addr === 'object' && 'port' in addr ? addr.port : 'unknown'); // 端口號格式
    
    debugLogger('Listening on ' + bind); // 輸出除錯訊息
    console.log('🚀 Server listening on ' + bind); // 輸出使用者友善的啟動成功訊息
  }

  /**
   * 優雅關閉伺服器
   * 
   * 執行有序的伺服器關閉程序，確保所有資源都被正確清理：
   * 1. 首先關閉應用程式層的資源（資料庫連線、Redis、RabbitMQ等）
   * 2. 然後關閉 HTTP 伺服器，停止接受新的連線
   * 3. 等待現有連線完成後結束程序
   * 
   * 此方法確保系統能夠安全地終止，避免資料遺失或資源洩漏。
   * 
   * @private
   * @async
   * @method gracefulShutdown
   * @returns {Promise<void>} 關閉完成的 Promise
   */
  private async gracefulShutdown(): Promise<void> {
    try {
      // 關閉應用程式層資源（資料庫、Redis、RabbitMQ等）
      await this.app.shutdown();

      // 關閉 HTTP 伺服器並等待現有連線完成
      console.log('🖥️ Closing HTTP server...');
      this.server.close(() => {
        console.log('✅ Server shut down successfully'); // 輸出成功關閉訊息
        process.exit(0); // 以正常狀態碼結束程序
      });
    } catch (error) {
      console.error('❌ Error during shutdown:', error); // 輸出關閉過程中的錯誤
      process.exit(1); // 以錯誤狀態碼結束程序
    }
  }
}

// ============================================================================
// 應用程式進入點
// ============================================================================

/**
 * 建立並啟動 AIOT 系統伺服器
 * 
 * 這是整個應用程式的進入點，負責：
 * 1. 建立 Server 實例
 * 2. 啟動伺服器並開始監聽連線
 * 3. 如果啟動失敗，程序將自動結束
 */
const server = new Server(); // 建立伺服器實例
server.start(); // 啟動伺服器