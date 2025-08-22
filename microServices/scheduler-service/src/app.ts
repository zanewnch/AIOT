/**
 * @fileoverview Scheduler Service 應用程式類別
 * 
 * 負責設定 Express 應用程式的所有中間件、路由和錯誤處理
 * 使用 InversifyJS 依賴注入管理控制器和服務
 * 提供健全的應用程式生命週期管理
 */

import 'reflect-metadata';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { injectable, inject } from 'inversify';

import { TYPES } from './container/types';
import { LoggerService } from './services/LoggerService';
import { DatabaseService } from './services/DatabaseService';
import { RabbitMQService } from './services/RabbitMQService';
import { MonitoringService } from './services/MonitoringService';
import { ArchiveScheduler } from './schedulers/ArchiveScheduler';

// 控制器
import { HealthController } from './controllers/HealthController';
import { MetricsController } from './controllers/MetricsController';
import { ScheduleController } from './controllers/ScheduleController';
import { AlertsController } from './controllers/AlertsController';

/**
 * Scheduler Service 應用程式類別
 * 使用依賴注入管理所有組件
 */
@injectable()
export class App {
  // Express 應用程式實例
  public readonly app: Express;
  
  // 應用程式初始化狀態
  private isInitialized = false;

  constructor(
    // 基礎設施服務
    @inject(TYPES.LoggerService) private readonly loggerService: LoggerService,
    @inject(TYPES.DatabaseService) private readonly databaseService: DatabaseService,
    @inject(TYPES.RabbitMQService) private readonly rabbitmqService: RabbitMQService,
    @inject(TYPES.MonitoringService) private readonly monitoringService: MonitoringService,
    @inject(TYPES.ArchiveScheduler) private readonly archiveScheduler: ArchiveScheduler,
    
    // 控制器
    @inject(TYPES.HealthController) private readonly healthController: HealthController,
    @inject(TYPES.MetricsController) private readonly metricsController: MetricsController,
    @inject(TYPES.ScheduleController) private readonly scheduleController: ScheduleController,
    @inject(TYPES.AlertsController) private readonly alertsController: AlertsController
  ) {
    // 初始化 Express 應用程式
    this.app = express();
    
    // 設定中間件、路由和錯誤處理
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * 初始化應用程式
   * 啟動所有相關服務
   */
  initialize = async (): Promise<void> => {
    if (this.isInitialized) {
      return;
    }

    try {
      const logger = this.loggerService.getLogger();
      logger.info('正在初始化 Scheduler Service...');

      // 初始化資料庫
      logger.info('初始化資料庫連線...');
      await this.databaseService.initialize();

      // 初始化 RabbitMQ
      logger.info('初始化 RabbitMQ 服務...');
      await this.rabbitmqService.initialize();

      // 初始化監控服務
      logger.info('初始化監控服務...');
      await this.monitoringService.start();

      // 啟動排程器
      logger.info('啟動歸檔排程器...');
      await this.archiveScheduler.start();

      this.isInitialized = true;
      logger.info('✅ Scheduler Service 初始化完成');

    } catch (error) {
      const logger = this.loggerService.getLogger();
      logger.error('❌ 應用程式初始化失敗', error);
      throw error;
    }
  };

  /**
   * 關閉應用程式
   * 優雅關閉所有服務
   */
  shutdown = async (): Promise<void> => {
    if (!this.isInitialized) {
      return;
    }

    try {
      const logger = this.loggerService.getLogger();
      logger.info('開始關閉 Scheduler Service...');

      // 停止排程器
      try {
        await this.archiveScheduler.stop();
        logger.info('✅ 排程器已停止');
      } catch (error) {
        logger.error('❌ 停止排程器時發生錯誤', error);
      }

      // 停止監控服務
      try {
        await this.monitoringService.stop();
        logger.info('✅ 監控服務已停止');
      } catch (error) {
        logger.error('❌ 停止監控服務時發生錯誤', error);
      }

      // 關閉 RabbitMQ 連線
      try {
        await this.rabbitmqService.close();
        logger.info('✅ RabbitMQ 連線已關閉');
      } catch (error) {
        logger.error('❌ 關閉 RabbitMQ 連線時發生錯誤', error);
      }

      // 關閉資料庫連線
      try {
        await this.databaseService.close();
        logger.info('✅ 資料庫連線已關閉');
      } catch (error) {
        logger.error('❌ 關閉資料庫連線時發生錯誤', error);
      }

      this.isInitialized = false;
      logger.info('✅ Scheduler Service 關閉完成');

    } catch (error) {
      const logger = this.loggerService.getLogger();
      logger.error('❌ 應用程式關閉過程中發生錯誤', error);
    }
  };

  /**
   * 設定中間件
   */
  private setupMiddleware = (): void => {
    const logger = this.loggerService.getLogger();

    // 安全性中間件 - Helmet 保護應用程式免受常見漏洞攻擊
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],                    // 預設只允許同源內容
          styleSrc: ["'self'", "'unsafe-inline'"],   // 允許內嵌樣式
          scriptSrc: ["'self'"]                      // 只允許同源腳本
        }
      }
    }));

    // CORS 設定 - 允許跨域請求
    this.app.use(cors({
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,                              // 允許發送憑證
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // 壓縮中間件 - 減少回應資料大小
    this.app.use(compression());

    // JSON 解析中間件 - 處理 JSON 請求體，限制大小為 10MB
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 請求日誌中間件 - 記錄所有 HTTP 請求
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      // 監聽回應完成事件，記錄請求資訊
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.http(`${req.method} ${req.path}`, {
          method: req.method,               // HTTP 方法
          url: req.path,                    // 請求路徑
          statusCode: res.statusCode,       // 回應狀態碼
          duration: `${duration}ms`,        // 請求處理時間
          userAgent: req.get('User-Agent'), // 使用者代理
          ip: req.ip                        // 客戶端 IP
        });
      });
      
      next();
    });
  };

  /**
   * 設定路由
   */
  private setupRoutes = (): void => {
    // 健康檢查路由
    this.app.get('/health', this.healthController.getHealth);

    // 系統指標路由
    this.app.get('/metrics', this.metricsController.getMetrics);

    // 排程相關路由
    this.app.get('/schedule/status', this.scheduleController.getStatus);
    this.app.post('/schedule/trigger', this.scheduleController.triggerArchive);

    // 警報路由
    this.app.get('/alerts', this.alertsController.getAlerts);

    // 根路由 - 服務資訊
    this.app.get('/', (_req: Request, res: Response) => {
      res.json({
        service: 'AIOT Scheduler Service',
        version: process.env.npm_package_version || '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          metrics: '/metrics',
          scheduleStatus: '/schedule/status',
          triggerArchive: 'POST /schedule/trigger',
          alerts: '/alerts'
        }
      });
    });
  };

  /**
   * 設定錯誤處理
   */
  private setupErrorHandling = (): void => {
    const logger = this.loggerService.getLogger();

    // 404 處理 - 處理不存在的路由
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
      });
    });

    // 全域錯誤處理中間件
    this.app.use((error: any, req: Request, res: Response, _next: NextFunction) => {
      // 記錄詳細錯誤資訊
      logger.error('未處理的錯誤', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query
      });

      // 根據環境決定錯誤回應的詳細程度
      const errorResponse = {
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' 
          ? 'Something went wrong' 
          : error.message,
        timestamp: new Date().toISOString()
      };

      res.status(error.status || 500).json(errorResponse);
    });

    // 未捕獲的異常處理
    process.on('uncaughtException', (error) => {
      logger.error('未捕獲的異常', error);
      // 在生產環境中優雅關閉
      if (process.env.NODE_ENV === 'production') {
        this.shutdown().finally(() => process.exit(1));
      }
    });

    // 未處理的 Promise 拒絕
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未處理的 Promise 拒絕', {
        reason,
        promise
      });
      // 在生產環境中優雅關閉
      if (process.env.NODE_ENV === 'production') {
        this.shutdown().finally(() => process.exit(1));
      }
    });
  };
}