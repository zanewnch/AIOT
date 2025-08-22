/**
 * @fileoverview 路由總匯出
 * 
 * 【設計意圖】
 * 統一管理所有路由模組，提供單一入口點
 * 
 * 【路由分組】
 * - Health: 健康檢查相關
 * - Status: 狀態資訊相關  
 * - Metrics: 監控指標相關
 */

import { Router, Request, Response } from 'express';
import { Logger } from 'winston';
import { ArchiveConsumer } from '../consumers/ArchiveConsumer';
import { DatabaseConnection, RabbitMQService } from '../types/processor.types';

import { createHealthRoutes } from './healthRoutes';
import { createStatusRoutes } from './statusRoutes';
import { createMetricsRoutes } from './metricsRoutes';

export const createRoutes = (
  logger: Logger,
  databaseConnection: DatabaseConnection,
  rabbitMQService: RabbitMQService,
  archiveConsumer: ArchiveConsumer
): Router => {
  const router = Router();

  // 健康檢查路由
  router.use('/', createHealthRoutes(logger, databaseConnection, rabbitMQService, archiveConsumer));
  
  // 狀態資訊路由
  router.use('/', createStatusRoutes(archiveConsumer));
  
  // 監控指標路由
  router.use('/', createMetricsRoutes(archiveConsumer));

  /**
   * 404 處理
   * 
   * 【說明】由於此服務主要通過 RabbitMQ 處理業務邏輯，
   * HTTP 端點僅限於監控用途，因此未定義的路由統一返回 404
   */
  router.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    });
  });

  return router;
};