/**
 * @fileoverview 依賴注入容器配置
 * 
 * 配置 InversifyJS 容器，管理所有服務的依賴關係
 * 採用單例模式確保整個應用程式使用同一個容器實例
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';

// 服務導入
import { LoggerService } from '../services/LoggerService';
import { DatabaseService } from '../services/DatabaseService';
import { RabbitMQService } from '../services/RabbitMQService';
import { MonitoringService } from '../services/MonitoringService';
import { NotificationService } from '../services/NotificationService';
import { ArchiveScheduler } from '../schedulers/ArchiveScheduler';
import { ArchiveTaskRepository } from '../repositories/ArchiveTaskRepository';

// 應用程式導入
import { App } from '../app';
import { SchedulerHttpServer } from '../server';

// 控制器導入
import { HealthController } from '../controllers/HealthController';
import { MetricsController } from '../controllers/MetricsController';
import { ScheduleController } from '../controllers/ScheduleController';
import { AlertsController } from '../controllers/AlertsController';
import { NotificationController } from '../controllers/NotificationController';

// 配置導入
import { getEnvironmentConfig } from '../configs/notificationConfig';

/**
 * IoC 容器工具類別
 * 提供容器初始化和服務取得的靜態方法
 */
export class ContainerUtils {
  // 單例容器實例
  private static container: Container | null = null;

  /**
   * 獲取容器實例
   * 如果容器尚未初始化，會自動初始化
   */
  static getContainer(): Container {
    if (!this.container) {
      this.container = this.createContainer();
    }
    return this.container;
  }

  /**
   * 從容器獲取服務實例
   */
  static get<T>(serviceIdentifier: symbol): T {
    return this.getContainer().get<T>(serviceIdentifier);
  }

  /**
   * 創建並配置容器
   */
  private static createContainer(): Container {
    const container = new Container({
      defaultScope: 'Singleton',  // 預設使用單例模式
      autoBindInjectable: true    // 自動綁定標記為 @injectable 的類別
    });

    // 配置環境變數和設定
    this.bindConfigurations(container);
    
    // 綁定基礎設施服務
    this.bindInfrastructureServices(container);
    
    // 綁定應用程式服務
    this.bindApplicationServices(container);
    
    // 綁定控制器
    this.bindControllers(container);

    return container;
  }

  /**
   * 綁定配置物件
   */
  private static bindConfigurations(container: Container): void {
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

    // 通知配置
    const notificationConfig = getEnvironmentConfig();

    container.bind(TYPES.DatabaseConfig).toConstantValue(databaseConfig);
    container.bind(TYPES.RabbitMQConfig).toConstantValue(rabbitmqConfig);
    container.bind(TYPES.RedisConfig).toConstantValue(redisConfig);
    container.bind(TYPES.NotificationConfig).toConstantValue(notificationConfig);
  }

  /**
   * 綁定基礎設施服務
   */
  private static bindInfrastructureServices(container: Container): void {
    // 日誌服務 - 特殊處理，需要先創建實例
    const loggerService = new LoggerService({
      serviceName: 'scheduler-service',
      level: process.env.LOG_LEVEL || 'info',
      environment: process.env.NODE_ENV || 'development'
    });
    
    container.bind(TYPES.LoggerService).toConstantValue(loggerService);
    container.bind(TYPES.Logger).toConstantValue(loggerService.getLogger());

    // 其他基礎設施服務
    container.bind(TYPES.DatabaseService).to(DatabaseService).inSingletonScope();
    container.bind(TYPES.RabbitMQService).to(RabbitMQService).inSingletonScope();
    container.bind(TYPES.NotificationService).to(NotificationService).inSingletonScope();
    container.bind(TYPES.MonitoringService).to(MonitoringService).inSingletonScope();

    // 資料庫連線介面綁定
    container.bind(TYPES.DatabaseConnection).toDynamicValue((context) => {
      return context.container.get(TYPES.DatabaseService);
    }).inSingletonScope();
  }

  /**
   * 綁定應用程式服務
   */
  private static bindApplicationServices(container: Container): void {
    // 儲存庫
    container.bind(TYPES.ArchiveTaskRepository).to(ArchiveTaskRepository).inSingletonScope();
    
    // 排程器
    container.bind(TYPES.ArchiveScheduler).to(ArchiveScheduler).inSingletonScope();
    
    // 應用程式和伺服器
    container.bind(TYPES.App).to(App).inSingletonScope();
    container.bind(TYPES.SchedulerHttpServer).to(SchedulerHttpServer).inSingletonScope();
  }

  /**
   * 綁定控制器
   */
  private static bindControllers(container: Container): void {
    container.bind(TYPES.HealthController).to(HealthController).inSingletonScope();
    container.bind(TYPES.MetricsController).to(MetricsController).inSingletonScope();
    container.bind(TYPES.ScheduleController).to(ScheduleController).inSingletonScope();
    container.bind(TYPES.AlertsController).to(AlertsController).inSingletonScope();
    container.bind(TYPES.NotificationController).to(NotificationController).inSingletonScope();
  }

  /**
   * 重置容器（主要用於測試）
   */
  static reset(): void {
    this.container = null;
  }
}

/**
 * 導出配置好的容器實例
 * 供應用程式的其他部分使用
 */
export const container = ContainerUtils.getContainer();