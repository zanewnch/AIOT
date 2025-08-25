/**
 * @fileoverview 依賴注入容器配置
 * 
 * 【設計意圖 (Intention)】
 * 配置 InversifyJS 依賴注入容器，管理所有服務的生命週期和依賴關係
 * 實現鬆散耦合的架構，提高程式碼的可測試性和可維護性
 * 
 * 【實作架構 (Implementation Architecture)】
 * - 使用 InversifyJS 作為 DI 容器
 * - 分別綁定介面和實作
 * - 配置單例和瞬態服務
 * - 支援配置注入和服務工廠
 */

import { Container } from 'inversify';
import winston, { Logger } from 'winston';
import { TYPES } from './types';
import { config } from '../configs/environment';

// 服務介面
import { 
  DatabaseConnection, 
  RabbitMQService as IRabbitMQService,
  ArchiveTaskRepositorysitory
} from '../types/processor.types';

// 服務實作
import { PostgreSQLDatabaseConnection } from '../configs/database';
import { RabbitMQService } from '../services/RabbitMQService';
import { ArchiveTaskRepositorysitoryImpl } from '../services/ArchiveTaskRepoImpl';
import { ArchiveProcessor } from '../processors/ArchiveProcessor';
import { ArchiveConsumer } from '../consumers/ArchiveConsumer';
import { RouteRegistrar } from '../routes/RouteRegistrar';
import { App } from '../app';

/**
 * 建立並配置 DI 容器
 * 
 * 【綁定策略】
 * - 基礎設施服務：單例模式
 * - 業務邏輯服務：瞬態模式
 * - 配置對象：常數綁定
 */
export const createContainer = (): Container => {
  const container = new Container({
    defaultScope: 'Singleton'
  });

  // === 日誌服務 ===
  container.bind<Logger>(TYPES.Logger).toConstantValue(createLogger());

  // === 資料庫服務 ===
  container.bind<DatabaseConnection>(TYPES.DatabaseConnection)
    .toDynamicValue(() => {
      return new PostgreSQLDatabaseConnection(config.database);
    })
    .inSingletonScope();

  // === RabbitMQ 服務 ===
  container.bind<IRabbitMQService>(TYPES.RabbitMQService)
    .to(RabbitMQService)
    .inSingletonScope();

  // === 儲存庫服務 ===
  container.bind<ArchiveTaskRepository>(TYPES.ArchiveTaskRepository)
    .to(ArchiveTaskRepositorysitoryImpl)
    .inSingletonScope();

  // === 核心處理器 ===
  container.bind<ArchiveProcessor>(TYPES.ArchiveProcessor)
    .to(ArchiveProcessor)
    .inTransientScope(); // 每次注入時創建新實例

  // === 消費者服務 ===
  container.bind<ArchiveConsumer>(TYPES.ArchiveConsumer)
    .to(ArchiveConsumer)
    .inSingletonScope();

  // === 路由服務 ===
  container.bind<RouteRegistrar>(TYPES.RouteRegistrar)
    .toDynamicValue((context) => {
      const logger = context.container.get<Logger>(TYPES.Logger);
      const databaseConnection = context.container.get<DatabaseConnection>(TYPES.DatabaseConnection);
      const rabbitMQService = context.container.get<IRabbitMQService>(TYPES.RabbitMQService);
      const archiveConsumer = context.container.get<ArchiveConsumer>(TYPES.ArchiveConsumer);
      
      return new RouteRegistrar(logger, databaseConnection, rabbitMQService, archiveConsumer);
    })
    .inSingletonScope();

  // === 應用程式服務 ===
  container.bind<App>(TYPES.App)
    .to(App)
    .inSingletonScope();

  return container;
};

/**
 * 建立 Winston Logger 實例
 * 
 * 【日誌配置】
 * - 支援多種輸出格式
 * - 根據環境調整日誌級別
 * - 結構化日誌便於分析
 */
const createLogger = (): Logger => {
  const logFormat = winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );

  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let metaString = '';
      if (Object.keys(meta).length > 0) {
        metaString = ` ${JSON.stringify(meta)}`;
      }
      return `${timestamp} [${level}]: ${message}${metaString}`;
    })
  );

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: config.service.nodeEnv === 'development' ? consoleFormat : logFormat,
      level: config.logging.level
    })
  ];

  // 生產環境添加文件日誌
  if (config.service.nodeEnv === 'production') {
    transports.push(
      new winston.transports.File({
        filename: 'logs/archive-processor-error.log',
        level: 'error',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: 'logs/archive-processor.log',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 10
      })
    );
  }

  return winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    transports,
    exitOnError: false
  });
};

// 全域容器實例
export const container = createContainer();