#!/usr/bin/env node

import 'dotenv/config';
import express from 'express';
import debug from 'debug';
import http from 'http';

import { ErrorHandleMiddleware } from './middleware/errorHandleMiddleware.js';
import { createSequelizeInstance } from './config/database.js';
import { RabbitMQManager } from './config/rabbitmq.js';
import { setupPassportJWT } from './config/auth.js';
import { getServerConfig, setupExpressMiddleware } from './config/server.js';
import { InitController, JWTAuthController, RTKController, SwaggerController } from './controller/index.js';
import { UserController, RoleController, PermissionController, UserToRoleController, RoleToPermissionController } from './controller/rbac/index.js';

const debugLogger = debug('aiot:server');

class Server {
  private app: express.Application;
  private server: http.Server;
  private port: number | string | false;
  private sequelize: any;
  private rabbitMQManager: RabbitMQManager;

  constructor() {
    this.app = express();
    const config = getServerConfig();
    this.port = config.port;
    this.server = http.createServer(this.app);
    this.rabbitMQManager = new RabbitMQManager();

    // setup
    this.setupSequelize();
    this.setupPassport();
    this.setupMiddleware();
    this.setupShutdownHandlers();
  }

  private setupSequelize(): void {
    this.sequelize = createSequelizeInstance();
  }

  private async setupRabbitMQ(): Promise<void> {
    await this.rabbitMQManager.connect();
  }

  private setupPassport(): void {
    setupPassportJWT();
  }

  private setupMiddleware(): void {
    setupExpressMiddleware(this.app);
  }

  /**
   * 設定應用程式路由
   * 
   * 初始化所有控制器並設定對應的 API 路由。包括初始化、JWT 認證、
   * RBAC 權限管理和 Swagger 文檔等控制器的路由設定。
   * 
   * @private
   * @returns {Promise<void>} 無回傳值的 Promise
   */
  private async setupRoutes(): Promise<void> {
    // 初始化控制器
    const initController = new InitController();
    const jwtAuthController = new JWTAuthController();
    const rtkController = new RTKController();
    const swaggerController = new SwaggerController();
    
    // 初始化 RBAC 子控制器
    const userController = new UserController();
    const roleController = new RoleController();
    const permissionController = new PermissionController();
    const userToRoleController = new UserToRoleController();
    const roleToPermissionController = new RoleToPermissionController();

    // 設置路由
    this.app.use('/', initController.router);
    this.app.use('/', jwtAuthController.router);
    this.app.use('/', rtkController.router);
    this.app.use('/', swaggerController.router);
    
    // 設置 RBAC 路由
    this.app.use('/api/rbac/users', userController.router);
    this.app.use('/api/rbac/roles', roleController.router);
    this.app.use('/api/rbac/permissions', permissionController.router);
    this.app.use('/api/rbac/users', userToRoleController.router);
    this.app.use('/api/rbac/roles', roleToPermissionController.router);

    console.log('✅ All controllers initialized and routes configured');
  }

  private setupErrorHandling(): void {
    this.app.use(ErrorHandleMiddleware.notFound);
    this.app.use(ErrorHandleMiddleware.handle);
  }

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
  main function to start the server
  - sync database
  - create rabbitmq channel
  - setup controllers
  - start server
  - handle errors
  - handle shutdown
  */
  async main(): Promise<void> {
    try {
      await this.sequelize.sync();
      console.log('✅ Database synced');

      await this.setupRabbitMQ();
      console.log('✅ RabbitMQ ready');
      this.app.locals.rabbitMQChannel = this.rabbitMQManager.getChannel();

      await this.setupRoutes();
      this.setupErrorHandling();

      if (typeof this.port === 'number') {
        this.server.listen(this.port);
      } else {
        console.error('❌ Invalid port configuration:', this.port);
        process.exit(1);
      }
      this.server.on('error', (error) => this.onError(error));
      this.server.on('listening', () => this.onListening());
    } catch (err) {
      console.error('❌ Server initialization failed', err);
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
   * @returns {void}
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
   * 當伺服器成功開始監聽指定的連接埠或管道時觸發。在控制台輸出
   * 伺服器啟動成功的訊息，包含所監聽的連接埠或管道資訊。
   * 
   * @private
   * @returns {void}
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
   * 優雅的應用程式關閉
   * 
   * 實現優雅的應用程式關閉流程，包括關閉資料庫連線、RabbitMQ 連線和 HTTP 伺服器。
   * 確保所有資源在系統關閉前都被正确地釋放，防止數據遺失或資源洩漏。
   * 
   * @private
   * @returns {Promise<void>} 無回傳值的 Promise
   */
  private async gracefulShutdown(): Promise<void> {
    try {
      console.log('🔌 Closing RabbitMQ connection...');
      await this.rabbitMQManager.close();

      console.log('🗃️ Closing database connection...');
      await this.sequelize.close();

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
server.main();