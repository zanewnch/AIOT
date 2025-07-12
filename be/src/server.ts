#!/usr/bin/env node

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import debug from 'debug';
import http from 'http';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';

import { ErrorHandleMiddleware } from './middleware/errorHandleMiddleware.js';
import { UserModel } from './models/rbac/UserModel.js';
import { JwtPayload } from './middleware/jwtAuthMiddleware.js';
import { Sequelize } from 'sequelize-typescript';
import { RTKDataModel } from './models/RTKDataModel.js';
import { RoleModel } from './models/rbac/RoleModel.js';
import { PermissionModel } from './models/rbac/PermissionModel.js';
import { UserRoleModel } from './models/rbac/UserToRoleModel.js';
import { RolePermissionModel } from './models/rbac/RoleToPermissionModel.js';
import amqp from 'amqplib';
import { InitController, JWTAuthController, RBACController, SwaggerController } from './controller/index.js';

const debugLogger = debug('aiot:server');

class Server {
  private app: express.Application;
  private server: http.Server;
  private port: number | string | false;
  private sequelize!: Sequelize;
  private rabbitConnection: any = null;
  private rabbitChannel: any = null;

  constructor() {
    this.app = express();
    this.port = this.normalizePort(process.env.PORT || '8010');
    this.server = http.createServer(this.app);

    // setup
    this.setupRabbitMQ();
    this.setupSequelize();
    this.setupPassport();
    this.setupMiddleware();
    this.setupErrorHandling();
    this.setupShutdownHandlers();
  }

  /**
   * 設定 Sequelize 資料庫連線
   * 
   * 初始化 Sequelize ORM 來連線 MySQL 資料庫，設定連線參數、登錄資料庫模型。
   * 使用環境變數來設定資料庫連線參數，支援開發模式下的 SQL 日誌輸出。
   * 
   * @private
   * @returns {void}
   */
  private setupSequelize(): void {
    this.sequelize = new Sequelize({
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'main_db',
      username: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || 'admin',
      port: parseInt(process.env.DB_PORT || '3306'),
      dialect: 'mysql',
      models: [UserModel, RoleModel, PermissionModel, UserRoleModel, RolePermissionModel, RTKDataModel],
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    });
  }

  /**
   * 設定 RabbitMQ 訊息佇列連線
   * 
   * 初始化 RabbitMQ 連線，包括建立連線、通道、交換器和佇列等拓朴結構。
   * 設定裝置指令、事件和狀態更新的訊息交換機制，支援系統的異步通訊。
   * 
   * @private
   * @returns {Promise<void>} 無回傳值的 Promise
   * @throws {Error} 當 RabbitMQ 連線失敗或拓朴設定失敗時拋出錯誤
   */
  private async setupRabbitMQ(): Promise<void> {
    const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    
    // RabbitMQ 配置
    const RABBITMQ_CONFIG = {
      exchanges: {
        DEVICE_EVENTS: 'device.events',
        DEVICE_DATA: 'device.data',
      },
      queues: {
        DEVICE_COMMANDS: 'device.commands',
        DEVICE_EVENTS: 'device.events.queue',
        DEVICE_DATA: 'device.data.queue',
      },
      routingKeys: {
        DEVICE_OFFLINE: 'device.offline',
        THRESHOLD_EXCEEDED: 'threshold.exceeded',
        DEVICE_STATUS: 'device.status',
        SENSOR_DATA: 'sensor.data',
      }
    };

    try {
      if (!this.rabbitConnection) {
        this.rabbitConnection = await amqp.connect(url);
        
        // 連接事件處理
        this.rabbitConnection.on('error', (err: any) => {
          console.error('❌ RabbitMQ connection error:', err);
          this.rabbitConnection = null;
          this.rabbitChannel = null;
        });
        
        this.rabbitConnection.on('close', () => {
          console.log('🔌 RabbitMQ connection closed');
          this.rabbitConnection = null;
          this.rabbitChannel = null;
        });
      }
      
      if (!this.rabbitChannel) {
        this.rabbitChannel = await this.rabbitConnection.createChannel();
        await this.setupRabbitMQTopology(this.rabbitChannel, RABBITMQ_CONFIG);
      }
    } catch (error) {
      console.error('❌ Failed to create RabbitMQ channel:', error);
      throw error;
    }
  }

  /**
   * 設定 RabbitMQ 拓朴結構
   * 
   * 建立 RabbitMQ 的交換器、佇列和綁定關係。包括裝置事件、裝置資料的交換器，
   * 以及相對應的佇列和路由綁定。確保訊息能夠正確地在系統各組件間傳遞。
   * 
   * @private
   * @param {any} channel - RabbitMQ 通道物件
   * @param {any} config - RabbitMQ 配置物件，包含交換器、佇列和路由鍵配置
   * @returns {Promise<void>} 無回傳值的 Promise
   * @throws {Error} 當交換器或佇列建立失敗時拋出錯誤
   */
  private async setupRabbitMQTopology(channel: any, config: any): Promise<void> {
    try {
      // 創建交換機
      await channel.assertExchange(config.exchanges.DEVICE_EVENTS, 'topic', { durable: true });
      await channel.assertExchange(config.exchanges.DEVICE_DATA, 'topic', { durable: true });
      
      // 創建佇列
      await channel.assertQueue(config.queues.DEVICE_COMMANDS, { durable: true });
      await channel.assertQueue(config.queues.DEVICE_EVENTS, { durable: true });
      await channel.assertQueue(config.queues.DEVICE_DATA, { durable: true });
      
      // 綁定佇列到交換機
      await channel.bindQueue(
        config.queues.DEVICE_EVENTS,
        config.exchanges.DEVICE_EVENTS,
        '#'
      );
      
      await channel.bindQueue(
        config.queues.DEVICE_DATA,
        config.exchanges.DEVICE_DATA,
        '#'
      );
      
      console.log('✅ RabbitMQ topology setup completed');
    } catch (error) {
      console.error('❌ Failed to setup RabbitMQ topology:', error);
      throw error;
    }
  }

  /**
   * 關閉 RabbitMQ 連線
   * 
   * 安全地關閉 RabbitMQ 通道和連線，釋放資源。在系統關閉或重新連線時呼叫，
   * 確保沒有資源洩漏。即使關閉過程中發生錯誤也會正常處理。
   * 
   * @private
   * @returns {Promise<void>} 無回傳值的 Promise
   */
  private async closeRabbitConnection(): Promise<void> {
    try {
      if (this.rabbitChannel) {
        await this.rabbitChannel.close();
        this.rabbitChannel = null;
      }
      if (this.rabbitConnection) {
        await this.rabbitConnection.close();
        this.rabbitConnection = null;
      }
    } catch (error) {
      console.error('❌ Error closing RabbitMQ connection:', error);
    }
  }

  /**
   * 設定 Passport JWT 認證策略
   * 
   * 初始化 Passport.js 的 JWT 認證策略，設定 JWT 的提取方式和秘鑰。
   * 用於驗證來自用戶端的 JWT 令牌，確保 API 的安全性。
   * 
   * @private
   * @returns {void}
   */
  private setupPassport(): void {
    const jwtOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET as string,
    };

    passport.use(new JwtStrategy(jwtOptions, async (payload: JwtPayload, done: VerifiedCallback) => {
      try {
        const user = await UserModel.findByPk(payload.sub);
        if (user) return done(null, user);
        return done(null, false);
      } catch (err) {
        return done(err, false);
      }
    }));

    this.app.use(passport.initialize());
  }

  /**
   * 設定 Express 中間件
   * 
   * 配置 Express 應用程式的中間件，包括視圖引擎、日誌記錄、JSON 解析、
   * Cookie 處理、靜態檔案服務等。同時設定 TypeDoc 文檔的服務路徑。
   * 
   * @private
   * @returns {void}
   */
  private setupMiddleware(): void {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // view engine setup for SSR
    this.app.set('views', path.join(__dirname, '../views'));
    this.app.set('view engine', 'jade');
    this.app.set('port', this.port);

    // middleware
    this.app.use(logger('dev'));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(cookieParser());
    this.app.use(express.static(path.join(__dirname, '../public')));
    
    // 提供 TypeDoc 文檔
    this.app.use('/docs', express.static(path.join(__dirname, '../docs')));
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
    const rbacController = new RBACController();
    const swaggerController = new SwaggerController();

    // 設置路由
    this.app.use('/api/', initController.router);
    this.app.use('/api/', jwtAuthController.router);
    this.app.use('/api/', rbacController.router);
    this.app.use('/api/', swaggerController.router);

    console.log('✅ All controllers initialized and routes configured');
  }

  /**
   * 設定錯誤處理中間件
   * 
   * 配置應用程式的錯誤處理中間件，包括 404 找不到資源和一般錯誤處理。
   * 確保應用程式能夠優雅地處理各種錯誤情況並回傳適當的錯誤訊息。
   * 
   * @private
   * @returns {void}
   */
  private setupErrorHandling(): void {
    this.app.use(ErrorHandleMiddleware.notFound);
    this.app.use(ErrorHandleMiddleware.handle);
  }

  /**
   * 設定關閉信號處理器
   * 
   * 設定系統信號處理器，監聽 SIGTERM 和 SIGINT 信號來實現優雅的應用程式關閉。
   * 當接收到關閉信號時，會執行清理作業並安全地關閉應用程式。
   * 
   * @private
   * @returns {void}
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
      this.app.locals.rabbitMQChannel = this.rabbitChannel;

      await this.setupRoutes();

      this.server.listen(this.port);
      this.server.on('error', (error) => this.onError(error));
      this.server.on('listening', () => this.onListening());
    } catch (err) {
      console.error('❌ Server initialization failed', err);
      process.exit(1);
    }
  }

  /**
   * 正規化連接埠號
   * 
   * 將字串型別的連接埠值轉換為適當的類型。如果是數字則轉換為整數，
   * 如果是有效的管道名稱則保持字串，如果無效則回傳 false。
   * 
   * @private
   * @param {string} val - 要正規化的連接埠值
   * @returns {number | string | false} 正規化後的連接埠值
   * 
   * @example
   * ```typescript
   * const port = this.normalizePort('3000'); // 回傳 3000 (整數)
   * const pipe = this.normalizePort('/tmp/socket'); // 回傳 '/tmp/socket' (字串)
   * const invalid = this.normalizePort('-1'); // 回傳 false
   * ```
   */
  private normalizePort(val: string): number | string | false {
    const portNum = parseInt(val, 10);

    if (isNaN(portNum)) {
      return val;
    }

    if (portNum >= 0) {
      return portNum;
    }

    return false;
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
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
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
      await this.closeRabbitConnection();

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