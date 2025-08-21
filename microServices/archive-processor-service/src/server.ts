/**
 * @fileoverview Archive Processor Service 服務入口點
 * 
 * 【設計意圖 (Intention)】
 * 啟動歸檔處理服務，初始化所有必要的組件和服務
 * 提供 HTTP 健康檢查端點用於監控和負載均衡
 * 
 * 【實作架構 (Implementation Architecture)】
 * - 使用 Express.js 提供 HTTP API
 * - 整合 RabbitMQ Consumer 處理歸檔任務
 * - 實作優雅關閉機制
 * - 提供完整的健康檢查和狀態監控
 */

import 'reflect-metadata';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Logger } from 'winston';

import { container } from './container/container';
import { TYPES } from './container/types';
import { config } from './configs/environment';
import { ArchiveConsumer } from './consumers/ArchiveConsumer';
import { DatabaseConnection, RabbitMQService } from './types/processor.types';

/**
 * Archive Processor Service 應用程式類別
 * 
 * 【核心職責】
 * - 管理服務生命週期
 * - 初始化所有依賴服務
 * - 提供 HTTP API 端點
 * - 處理優雅關閉
 */
export class ArchiveProcessorService {
  private readonly app: Express;
  private readonly logger: Logger;
  private readonly archiveConsumer: ArchiveConsumer;
  private readonly databaseConnection: DatabaseConnection;
  private readonly rabbitMQService: RabbitMQService;
  private server: any = null;
  private isShuttingDown = false;

  constructor() {
    // 從 DI 容器獲取服務
    this.logger = container.get<Logger>(TYPES.Logger);
    this.archiveConsumer = container.get<ArchiveConsumer>(TYPES.ArchiveConsumer);
    this.databaseConnection = container.get<DatabaseConnection>(TYPES.DatabaseConnection);
    this.rabbitMQService = container.get<RabbitMQService>(TYPES.RabbitMQService);

    // 初始化 Express 應用
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * 設置中間件
   */
  private setupMiddleware(): void {
    // 安全性中間件
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS 配置
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // 壓縮回應
    this.app.use(compression());

    // JSON 解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 請求日誌中間件
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.logger.info('HTTP Request', {
          method: req.method,
          url: req.url,
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
   * 設置路由
   */
  private setupRoutes(): void {
    // 健康檢查端點
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        const healthStatus = await this.getHealthStatus();
        
        const httpStatus = healthStatus.status === 'healthy' ? 200 : 503;
        
        res.status(httpStatus).json({
          status: healthStatus.status,
          timestamp: new Date().toISOString(),
          service: config.service.name,
          version: process.env.npm_package_version || '1.0.0',
          uptime: process.uptime(),
          checks: healthStatus.checks
        });
      } catch (error) {
        this.logger.error('Health check failed', { error: error.message });
        res.status(503).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // 狀態資訊端點
    this.app.get('/status', (req: Request, res: Response) => {
      const consumerStatus = this.archiveConsumer.getStatus();
      
      res.json({
        service: config.service.name,
        status: 'running',
        timestamp: new Date().toISOString(),
        consumer: consumerStatus,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        environment: config.service.nodeEnv,
        pid: process.pid
      });
    });

    // 指標端點 (用於監控系統)
    this.app.get('/metrics', (req: Request, res: Response) => {
      const memUsage = process.memoryUsage();
      const consumerStatus = this.archiveConsumer.getStatus();

      // Prometheus 格式指標
      const metrics = [
        `# HELP archive_processor_uptime_seconds Total uptime in seconds`,
        `# TYPE archive_processor_uptime_seconds counter`,
        `archive_processor_uptime_seconds ${process.uptime()}`,
        '',
        `# HELP archive_processor_memory_usage_bytes Memory usage in bytes`,
        `# TYPE archive_processor_memory_usage_bytes gauge`,
        `archive_processor_memory_usage_bytes{type="rss"} ${memUsage.rss}`,
        `archive_processor_memory_usage_bytes{type="heapUsed"} ${memUsage.heapUsed}`,
        `archive_processor_memory_usage_bytes{type="heapTotal"} ${memUsage.heapTotal}`,
        `archive_processor_memory_usage_bytes{type="external"} ${memUsage.external}`,
        '',
        `# HELP archive_processor_consumer_status Consumer status (1=running, 0=stopped)`,
        `# TYPE archive_processor_consumer_status gauge`,
        `archive_processor_consumer_status ${consumerStatus.isRunning ? 1 : 0}`,
        '',
        `# HELP archive_processor_processing_tasks Current number of processing tasks`,
        `# TYPE archive_processor_processing_tasks gauge`,
        `archive_processor_processing_tasks ${consumerStatus.processingCount}`,
        ''
      ].join('\n');

      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    });

    // 404 處理
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * 設置錯誤處理
   */
  private setupErrorHandling(): void {
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      this.logger.error('Unhandled HTTP error', {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url
      });

      if (res.headersSent) {
        return next(error);
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: config.service.nodeEnv === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * 獲取健康狀態
   */
  private async getHealthStatus(): Promise<any> {
    const checks: Record<string, any> = {};

    try {
      // 檢查資料庫連線
      await this.databaseConnection.query('SELECT 1 as test');
      checks.database = { status: 'healthy', message: 'Connection successful' };
    } catch (error) {
      checks.database = { status: 'unhealthy', message: error.message };
    }

    // 檢查 RabbitMQ 連線
    try {
      const isRabbitHealthy = this.rabbitMQService.isHealthy();
      checks.rabbitmq = { 
        status: isRabbitHealthy ? 'healthy' : 'unhealthy',
        message: isRabbitHealthy ? 'Connection successful' : 'Connection failed'
      };
    } catch (error) {
      checks.rabbitmq = { status: 'unhealthy', message: error.message };
    }

    // 檢查消費者狀態
    const consumerHealthy = this.archiveConsumer.isHealthy();
    checks.consumer = { 
      status: consumerHealthy ? 'healthy' : 'unhealthy',
      message: consumerHealthy ? 'Consumer running' : 'Consumer not running'
    };

    // 整體健康狀態
    const allHealthy = Object.values(checks).every((check: any) => check.status === 'healthy');
    
    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks
    };
  }

  /**
   * 啟動服務
   */
  async start(): Promise<void> {
    try {
      this.logger.info('Starting Archive Processor Service...', {
        service: config.service.name,
        port: config.service.port,
        environment: config.service.nodeEnv
      });

      // 啟動 Archive Consumer
      await this.archiveConsumer.start();

      // 啟動 HTTP 服務器
      this.server = this.app.listen(config.service.port, () => {
        this.logger.info('Archive Processor Service started successfully', {
          port: config.service.port,
          environment: config.service.nodeEnv,
          pid: process.pid
        });
      });

      // 設置優雅關閉
      this.setupGracefulShutdown();

    } catch (error) {
      this.logger.error('Failed to start Archive Processor Service', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * 設置優雅關閉
   */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        this.logger.warn('Force shutdown initiated');
        process.exit(1);
      }

      this.isShuttingDown = true;
      this.logger.info(`Received ${signal}, starting graceful shutdown...`);

      try {
        // 停止接受新的 HTTP 請求
        if (this.server) {
          this.server.close();
        }

        // 停止 Archive Consumer
        await this.archiveConsumer.stop();

        // 關閉資料庫連線
        if (this.databaseConnection && typeof this.databaseConnection.close === 'function') {
          await this.databaseConnection.close();
        }

        this.logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        this.logger.error('Error during graceful shutdown', {
          error: error.message
        });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 處理未捕獲的異常
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection', {
        reason: reason,
        promise: promise
      });
      process.exit(1);
    });
  }
}

// 啟動服務
if (require.main === module) {
  const service = new ArchiveProcessorService();
  service.start().catch((error) => {
    console.error('Failed to start service:', error);
    process.exit(1);
  });
}