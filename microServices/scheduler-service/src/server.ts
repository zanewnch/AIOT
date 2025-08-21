#!/usr/bin/env node

/**
 * @fileoverview Scheduler Service 主伺服器啟動程式
 * 
 * 此檔案負責啟動排程服務，包括：
 * - 載入環境變數配置
 * - 初始化依賴注入容器
 * - 創建 HTTP 伺服器實例
 * - 初始化 WebSocket 服務
 * - 設定優雅關閉機制
 * - 啟動定時任務排程器
 */

import 'reflect-metadata';
import 'dotenv/config';
import { Container } from 'inversify';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import http from 'http';

import { LoggerService } from './services/LoggerService';
import { DatabaseService } from './services/DatabaseService';
import { RabbitMQService } from './services/RabbitMQService';
import { MonitoringService } from './services/MonitoringService';
import { ArchiveScheduler } from './schedulers/ArchiveScheduler';
import { ArchiveTaskRepository } from './repositories/ArchiveTaskRepository';

class SchedulerServer {
  private app: Express;
  private server: http.Server | null = null;
  private container: Container;
  private logger: any;

  constructor() {
    this.app = express();
    this.container = new Container();
    this.setupDependencies();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * 設定依賴注入
   */
  private setupDependencies(): void {
    // 日誌服務
    const loggerService = new LoggerService({
      serviceName: 'scheduler-service',
      level: process.env.LOG_LEVEL || 'info',
      environment: process.env.NODE_ENV || 'development'
    });
    this.logger = loggerService.getLogger();
    this.container.bind('Logger').toConstantValue(this.logger);

    // 資料庫配置
    const databaseConfig = {
      host: process.env.DB_HOST || 'aiot-drone-mysql',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || 'admin',
      database: process.env.DB_NAME || 'drone_db',
      dialect: 'mysql' as const
    };

    // RabbitMQ 配置
    const rabbitmqConfig = {
      url: process.env.RABBITMQ_URL || 'amqp://admin:admin@aiot-rabbitmq:5672/',
      prefetch: parseInt(process.env.RABBITMQ_PREFETCH || '10'),
      reconnectDelay: parseInt(process.env.RABBITMQ_RECONNECT_DELAY || '5000'),
      maxReconnectAttempts: parseInt(process.env.RABBITMQ_MAX_RECONNECT_ATTEMPTS || '10')
    };

    // Redis 配置
    const redisConfig = {
      url: process.env.REDIS_URL || 'redis://aiot-redis:6379/0'
    };

    this.container.bind('DatabaseConfig').toConstantValue(databaseConfig);
    this.container.bind('RabbitMQConfig').toConstantValue(rabbitmqConfig);
    this.container.bind('RedisConfig').toConstantValue(redisConfig);

    // 服務綁定
    this.container.bind<DatabaseService>('DatabaseService').to(DatabaseService).inSingletonScope();
    this.container.bind<RabbitMQService>('RabbitMQService').to(RabbitMQService).inSingletonScope();
    this.container.bind<MonitoringService>('MonitoringService').to(MonitoringService).inSingletonScope();
    this.container.bind<ArchiveTaskRepository>('ArchiveTaskRepository').to(ArchiveTaskRepository).inSingletonScope();
    this.container.bind<ArchiveScheduler>('ArchiveScheduler').to(ArchiveScheduler).inSingletonScope();

    // 資料庫連線介面綁定
    this.container.bind('DatabaseConnection').toDynamicValue((context: any) => {
      return context.container.get('DatabaseService');
    }).inSingletonScope();
  }

  /**
   * 設定中間件
   */
  private setupMiddleware(): void {
    // 安全性中間件
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"]
        }
      }
    }));

    // CORS 設定
    this.app.use(cors({
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // 壓縮
    this.app.use(compression());

    // JSON 解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 請求日誌
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.logger.http(`${req.method} ${req.path}`, {
          method: req.method,
          url: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });
      next();
    });
  }

  /**
   * 設定路由
   */
  private setupRoutes(): void {
    // 健康檢查端點
    this.app.get('/health', async (_req: Request, res: Response) => {
      try {
        const monitoringService = this.container.get<MonitoringService>('MonitoringService');
        const health = await monitoringService.getHealthStatus();
        
        if (health) {
          res.status(health.status === 'healthy' ? 200 : 503).json(health);
        } else {
          res.status(503).json({
            status: 'unhealthy',
            message: 'Health status not available'
          });
        }
      } catch (error) {
        this.logger.error('Health check failed', error);
        res.status(503).json({
          status: 'unhealthy',
          message: 'Health check error'
        });
      }
    });

    // 系統指標端點
    this.app.get('/metrics', async (_req: Request, res: Response) => {
      try {
        const monitoringService = this.container.get<MonitoringService>('MonitoringService');
        const [systemMetrics, taskMetrics] = await Promise.all([
          monitoringService.getSystemMetrics(),
          monitoringService.getTaskMetrics()
        ]);

        res.json({
          system: systemMetrics,
          tasks: taskMetrics,
          timestamp: new Date()
        });
      } catch (error) {
        this.logger.error('Failed to get metrics', error);
        res.status(500).json({ error: 'Failed to retrieve metrics' });
      }
    });

    // 排程狀態端點
    this.app.get('/schedule/status', async (_req: Request, res: Response) => {
      try {
        const scheduler = this.container.get<ArchiveScheduler>('ArchiveScheduler');
        const status = scheduler.getStatus();
        res.json(status);
      } catch (error) {
        this.logger.error('Failed to get schedule status', error);
        res.status(500).json({ error: 'Failed to retrieve schedule status' });
      }
    });

    // 手動觸發歸檔端點
    this.app.post('/schedule/trigger', async (req: Request, res: Response) => {
      try {
        const { jobType } = req.body;
        const scheduler = this.container.get<ArchiveScheduler>('ArchiveScheduler');
        
        await scheduler.triggerArchive(jobType);
        
        res.json({
          message: 'Archive task triggered successfully',
          jobType: jobType || 'all'
        });
      } catch (error) {
        this.logger.error('Failed to trigger archive', error);
        res.status(500).json({ error: 'Failed to trigger archive' });
      }
    });

    // 警報端點
    this.app.get('/alerts', async (_req: Request, res: Response) => {
      try {
        const monitoringService = this.container.get<MonitoringService>('MonitoringService');
        const alerts = monitoringService.getActiveAlerts();
        res.json({ alerts });
      } catch (error) {
        this.logger.error('Failed to get alerts', error);
        res.status(500).json({ error: 'Failed to retrieve alerts' });
      }
    });

    // 根路由
    this.app.get('/', (_req: Request, res: Response) => {
      res.json({
        service: 'AIOT Scheduler Service',
        version: process.env.npm_package_version || '1.0.0',
        status: 'running',
        endpoints: {
          health: '/health',
          metrics: '/metrics',
          scheduleStatus: '/schedule/status',
          triggerArchive: 'POST /schedule/trigger',
          alerts: '/alerts'
        }
      });
    });
  }

  /**
   * 設定錯誤處理
   */
  private setupErrorHandling(): void {
    // 404 處理
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
      });
    });

    // 全局錯誤處理
    this.app.use((error: any, req: Request, res: Response, _next: NextFunction) => {
      this.logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
      });

      res.status(error.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 
          'Something went wrong' : 
          error.message
      });
    });

    // 未捕獲的異常處理
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception', error);
      this.gracefulShutdown(1);
    });

    // 未處理的 Promise 拒絕
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection', {
        reason,
        promise
      });
      this.gracefulShutdown(1);
    });

    // 系統信號處理
    process.on('SIGTERM', () => {
      this.logger.info('SIGTERM received, shutting down gracefully');
      this.gracefulShutdown(0);
    });

    process.on('SIGINT', () => {
      this.logger.info('SIGINT received, shutting down gracefully');
      this.gracefulShutdown(0);
    });
  }

  /**
   * 啟動伺服器
   */
  async start(): Promise<void> {
    try {
      const port = process.env.PORT || 3001;

      // 初始化服務
      await this.initializeServices();

      // 啟動 HTTP 伺服器
      this.server = http.createServer(this.app);
      
      this.server.listen(port, () => {
        this.logger.info(`Scheduler service started successfully`, {
          port,
          nodeEnv: process.env.NODE_ENV,
          pid: process.pid
        });
      });

      this.server.on('error', (error: any) => {
        if (error.syscall !== 'listen') {
          throw error;
        }

        switch (error.code) {
          case 'EACCES':
            this.logger.error(`Port ${port} requires elevated privileges`);
            process.exit(1);
          case 'EADDRINUSE':
            this.logger.error(`Port ${port} is already in use`);
            process.exit(1);
          default:
            throw error;
        }
      });

    } catch (error) {
      this.logger.error('Failed to start server', error);
      throw error;
    }
  }

  /**
   * 初始化服務
   */
  private async initializeServices(): Promise<void> {
    try {
      this.logger.info('Initializing services...');

      // 初始化資料庫
      const databaseService = this.container.get<DatabaseService>('DatabaseService');
      await databaseService.initialize();

      // 初始化 RabbitMQ
      const rabbitmqService = this.container.get<RabbitMQService>('RabbitMQService');
      await rabbitmqService.initialize();

      // 初始化監控服務
      const monitoringService = this.container.get<MonitoringService>('MonitoringService');
      await monitoringService.start();

      // 啟動排程器
      const scheduler = this.container.get<ArchiveScheduler>('ArchiveScheduler');
      await scheduler.start();

      this.logger.info('All services initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize services', error);
      throw error;
    }
  }

  /**
   * 優雅關閉
   */
  private async gracefulShutdown(exitCode: number = 0): Promise<void> {
    this.logger.info('Starting graceful shutdown...');

    try {
      // 停止接收新請求
      if (this.server) {
        this.server.close(() => {
          this.logger.info('HTTP server closed');
        });
      }

      // 停止排程器
      try {
        const scheduler = this.container.get<ArchiveScheduler>('ArchiveScheduler');
        await scheduler.stop();
        this.logger.info('Scheduler stopped');
      } catch (error) {
        this.logger.error('Error stopping scheduler', error);
      }

      // 停止監控服務
      try {
        const monitoringService = this.container.get<MonitoringService>('MonitoringService');
        await monitoringService.stop();
        this.logger.info('Monitoring service stopped');
      } catch (error) {
        this.logger.error('Error stopping monitoring service', error);
      }

      // 關閉 RabbitMQ 連線
      try {
        const rabbitmqService = this.container.get<RabbitMQService>('RabbitMQService');
        await rabbitmqService.close();
        this.logger.info('RabbitMQ connection closed');
      } catch (error) {
        this.logger.error('Error closing RabbitMQ connection', error);
      }

      // 關閉資料庫連線
      try {
        const databaseService = this.container.get<DatabaseService>('DatabaseService');
        await databaseService.close();
        this.logger.info('Database connection closed');
      } catch (error) {
        this.logger.error('Error closing database connection', error);
      }

      this.logger.info('Graceful shutdown completed');
      process.exit(exitCode);

    } catch (error) {
      this.logger.error('Error during graceful shutdown', error);
      process.exit(1);
    }
  }
}

// 啟動伺服器
const server = new SchedulerServer();
server.start().catch((error) => {
  console.error('Failed to start scheduler service:', error);
  process.exit(1);
});