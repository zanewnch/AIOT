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
import { InitController, JWTAuthController, RBACController } from './controller/index.js';

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
    this.port = this.normalizePort(process.env.PORT || '8000');
    this.server = http.createServer(this.app);

    // setup
    this.setupRabbitMQ();
    this.setupSequelize();
    this.setupPassport();
    this.setupMiddleware();
    this.setupErrorHandling();
    this.setupShutdownHandlers();
  }

  private setupSequelize(): void {
    this.sequelize = new Sequelize({
      host: process.env.DB_HOST || 'aiot-mysqldb',
      database: process.env.DB_NAME || 'main_db',
      username: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || 'admin',
      port: parseInt(process.env.DB_PORT || '3306'),
      dialect: 'mysql',
      models: [UserModel, RoleModel, PermissionModel, UserRoleModel, RolePermissionModel, RTKDataModel],
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    });
  }

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
  }

  private async setupRoutes(): Promise<void> {
    // 初始化控制器
    const initController = new InitController();
    const jwtAuthController = new JWTAuthController();
    const rbacController = new RBACController();

    // 設置路由
    this.app.use('/api/init', initController.router);
    this.app.use('/api/auth', jwtAuthController.router);
    this.app.use('/api/rbac', rbacController.router);
    

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

  private onListening(): void {
    const addr = this.server.address();
    const bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + (addr && typeof addr === 'object' && 'port' in addr ? addr.port : 'unknown');
    debugLogger('Listening on ' + bind);
    console.log('🚀 Server listening on ' + bind);
  }

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