/**
 * @fileoverview Archive Consumer Service 應用程式主體配置檔案
 * 
 * 【設計意圖 (Intention)】
 * 定義 Archive Consumer Service 的核心應用程式類別，負責管理整個應用程式的生命週期
 * 
 * 【架構選擇考量 (Architecture Considerations)】
 * 雖然此服務主要通過 RabbitMQ 與 Scheduler Service 通訊，但仍提供 HTTP 端點的原因：
 * 
 * 1. 容器健康檢查：Docker/Kubernetes 需要 HTTP 健康檢查來判斷容器狀態
 * 2. 運維監控：提供服務狀態和指標給監控系統 (如 Prometheus)
 * 3. 故障排查：運維人員可以通過 HTTP 端點快速檢查服務狀態
 * 4. 標準化：統一的健康檢查接口便於基礎設施管理
 * 
 * 【通訊架構圖】
 * ┌─────────────────┐    RabbitMQ    ┌──────────────────────┐
 * │ Scheduler       │ ──────────────▶ │ Archive Consumer     │
 * │ Service         │                 │ - RabbitMQ Consumer  │ (主要業務邏輯)
 * └─────────────────┘                 │ - HTTP Health Check  │ (運維監控)
 *                                     └──────────────────────┘
 *                                              ▲
 *                                     HTTP     │
 *                                   ┌─────────────────┐
 *                                   │ Docker/K8s      │
 *                                   │ Monitoring      │
 *                                   └─────────────────┘
 * 
 * 【重構架構 (Refactored Architecture)】
 * - 分離 App 類別和 Server 啟動邏輯
 * - 使用模組化的路由和中間件結構
 * - 路由分離：健康檢查、狀態監控、指標收集
 * - 中間件分離：安全性、解析、日誌、錯誤處理
 * - 單一職責：每個模組專注特定功能
 * - 易於測試和維護
 */

import 'reflect-metadata';
import express, { Express } from 'express';
import { injectable, inject } from 'inversify';
import { Logger } from 'winston';

import { TYPES } from './container/types';
import { ArchiveConsumer } from './consumers/ArchiveConsumer';
import { DatabaseConnection, RabbitMQService } from './types/processor.types';

// 導入模組化的路由和中間件
import { createRoutes } from './routes';
import { setupMiddleware, setupErrorHandling } from './middleware';

/**
 * Archive Consumer Service 應用程式類別
 * 
 * 【重構後的架構】
 * - App 類別專注於應用程式生命週期管理
 * - 使用 InversifyJS 依賴注入提升可測試性
 * - 路由邏輯分離到 routes/ 目錄
 * - 中間件邏輯分離到 middleware/ 目錄
 * - 更好的模組化和可測試性
 */
@injectable()
export class App {
  public readonly app: Express;
  private isShuttingDown = false;

  constructor(
    @inject(TYPES.Logger) private readonly logger: Logger,
    @inject(TYPES.ArchiveConsumer) private readonly archiveConsumer: ArchiveConsumer,
    @inject(TYPES.DatabaseConnection) private readonly databaseConnection: DatabaseConnection,
    @inject(TYPES.RabbitMQService) private readonly rabbitMQService: RabbitMQService
  ) {
    // 初始化 Express 應用
    this.app = express();
    this.setupApplication();
  }

  /**
   * 設置應用程式
   * 
   * 【模組化架構】
   * 1. 載入中間件（安全性、解析、日誌）
   * 2. 載入路由（健康檢查、狀態、指標）
   * 3. 載入錯誤處理（必須在路由之後）
   */
  private setupApplication = (): void => {
    // 1. 載入基礎中間件
    setupMiddleware(this.app, this.logger);

    // 2. 載入所有路由
    this.app.use('/', createRoutes(
      this.logger,
      this.databaseConnection,
      this.rabbitMQService,
      this.archiveConsumer
    ));

    // 3. 載入錯誤處理中間件（必須在路由之後）
    setupErrorHandling(this.app, this.logger);
  };

  /**
   * 初始化應用程式
   * 
   * 【初始化順序說明】
   * 1. 先啟動 Archive Consumer (核心業務邏輯)
   * 
   * 【設計考量】
   * - Archive Consumer 是核心功能，優先啟動確保能接收 RabbitMQ 任務
   * - 如果 Consumer 啟動失敗，整個服務應該失敗
   */
  initialize = async (): Promise<void> => {
    try {
      this.logger.info('Initializing Archive Processor Service...');

      // 啟動 Archive Consumer (核心功能)
      await this.archiveConsumer.start();

      this.logger.info('Archive Processor Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Archive Processor Service', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  };

  /**
   * 優雅關閉應用程式
   * 
   * 【關閉順序】
   * 1. 停止 Archive Consumer
   * 2. 關閉資料庫連線
   */
  shutdown = async (): Promise<void> => {
    if (this.isShuttingDown) {
      this.logger.warn('Force shutdown initiated');
      return;
    }

    this.isShuttingDown = true;
    this.logger.info('Starting graceful shutdown...');

    try {
      // 1. 停止 Archive Consumer
      await this.archiveConsumer.stop();

      // 2. 關閉資料庫連線（如果有 close 方法）
      if (this.databaseConnection && typeof (this.databaseConnection as any).close === 'function') {
        await (this.databaseConnection as any).close();
      }

      this.logger.info('Graceful shutdown completed');
    } catch (error) {
      this.logger.error('Error during graceful shutdown', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  };
}