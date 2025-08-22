/**
 * @fileoverview 健康檢查路由
 * 
 * 【設計意圖】
 * 提供容器健康檢查端點，用於 Docker/Kubernetes 判斷服務是否正常運行
 * 
 * 【檢查項目】
 * - 資料庫連線狀態
 * - RabbitMQ 連線狀態  
 * - Archive Consumer 運行狀態
 */

import { Router, Request, Response } from 'express';
import { Logger } from 'winston';
import { ArchiveConsumer } from '../consumers/ArchiveConsumer';
import { DatabaseConnection, RabbitMQService } from '../types/processor.types';
import { config } from '../configs/environment';

export const createHealthRoutes = (
  logger: Logger,
  databaseConnection: DatabaseConnection,
  rabbitMQService: RabbitMQService,
  archiveConsumer: ArchiveConsumer
): Router => {
  const router = Router();

  /**
   * 健康檢查端點
   * 
   * 【用途】Docker/Kubernetes 容器健康檢查
   * 【回應格式】
   * - 200: 服務健康
   * - 503: 服務不健康（任一檢查項目失敗）
   */
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const healthStatus = await getHealthStatus(
        databaseConnection,
        rabbitMQService,
        archiveConsumer,
        logger
      );
      
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
      logger.error('Health check failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      res.status(503).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
}

/**
 * 獲取健康狀態
 */
const getHealthStatus = async (
  databaseConnection: DatabaseConnection,
  rabbitMQService: RabbitMQService,
  archiveConsumer: ArchiveConsumer,
  logger: Logger
): Promise<any> => {
  const checks: Record<string, any> = {};

  try {
    // 檢查資料庫連線
    await databaseConnection.query('SELECT 1 as test');
    checks.database = { status: 'healthy', message: 'Connection successful' };
  } catch (error) {
    checks.database = { 
      status: 'unhealthy', 
      message: error instanceof Error ? error.message : String(error)
    };
  }

  // 檢查 RabbitMQ 連線
  try {
    const isRabbitHealthy = rabbitMQService.isHealthy();
    checks.rabbitmq = { 
      status: isRabbitHealthy ? 'healthy' : 'unhealthy',
      message: isRabbitHealthy ? 'Connection successful' : 'Connection failed'
    };
  } catch (error) {
    checks.rabbitmq = { 
      status: 'unhealthy', 
      message: error instanceof Error ? error.message : String(error)
    };
  }

  // 檢查消費者狀態
  const consumerHealthy = archiveConsumer.isHealthy();
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