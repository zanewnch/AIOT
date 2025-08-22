/**
 * @fileoverview Scheduler Service 健康檢查控制器
 * @description 負責處理健康檢查 HTTP 請求，監控排程器服務及其依賴服務的運行狀態
 * @version 1.0.0
 * @author AIOT Development Team
 * 
 * 功能說明：
 * - 檢查 Scheduler Service 本身的運行狀態
 * - 監控資料庫連線 (MySQL drone_db)
 * - 檢查 RabbitMQ 消息隊列連接狀態
 * - 監控 Redis 快取服務連接
 * - 檢查 Consul 服務發現連接
 * - 回報系統資源使用情況 (CPU、記憶體)
 * - 提供詳細的服務可用性資訊
 * 
 * HTTP 端點：
 * - GET /health - 獲取完整的健康檢查報告
 * - 回應格式：JSON
 * - 狀態碼：200 (健康)、503 (不健康或部分服務異常)
 * 
 * 使用場景：
 * - Docker/Kubernetes 健康檢查探針
 * - 負載均衡器健康探測
 * - 監控系統 (Prometheus/Grafana) 資料收集
 * - 系統管理和故障排除
 */

import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';

import { TYPES } from '../container/types';
import { MonitoringService } from '../services/MonitoringService';

/**
 * Scheduler Service 健康檢查控制器類別
 * 
 * 使用依賴注入模式管理服務依賴，透過 MonitoringService 獲取各項服務的健康狀態。
 * 所有方法使用箭頭函數確保 this 上下文正確綁定，支援作為回調函數使用。
 * 
 * 依賴服務：
 * - Logger: 記錄健康檢查操作和錯誤
 * - MonitoringService: 提供系統健康監控功能
 * 
 * @class HealthController
 * @injectable 標記為可注入的服務類別
 */
@injectable()
export class HealthController {
  constructor(
    @inject(TYPES.Logger) private readonly logger: any,
    @inject(TYPES.MonitoringService) private readonly monitoringService: MonitoringService
  ) {}

  /**
   * 處理健康檢查請求的主要方法
   * 
   * @description 執行完整的系統健康檢查，包括：
   * 1. 檢查 Scheduler Service 本身狀態
   * 2. 驗證資料庫連接 (MySQL drone_db)
   * 3. 測試 RabbitMQ 消息隊列連通性
   * 4. 檢查 Redis 快取服務狀態
   * 5. 驗證 Consul 服務發現連接
   * 6. 監控系統資源使用情況
   * 
   * @route GET /health
   * @method GET
   * @param {Request} req - Express 請求物件
   * @param {Response} res - Express 回應物件
   * @returns {Promise<void>} 無回傳值，直接回應 HTTP 結果
   * 
   * @example
   * 成功回應 (200):
   * ```json
   * {
   *   "status": "healthy",
   *   "uptime": 12345,
   *   "services": {
   *     "database": { "status": "healthy", "latency": 5 },
   *     "rabbitmq": { "status": "healthy", "queues": 3 },
   *     "redis": { "status": "healthy", "memory": "2MB" },
   *     "consul": { "status": "healthy", "services": 8 }
   *   },
   *   "resources": {
   *     "cpu": { "usage": "15%", "load": [0.8, 0.9, 1.2] },
   *     "memory": { "used": "128MB", "total": "512MB", "usage": "25%" }
   *   },
   *   "timestamp": "2025-08-21T10:30:00.000Z"
   * }
   * ```
   * 
   * @example
   * 失敗回應 (503):
   * ```json
   * {
   *   "status": "unhealthy",
   *   "message": "Database connection failed",
   *   "services": {
   *     "database": { "status": "unhealthy", "error": "Connection timeout" }
   *   },
   *   "timestamp": "2025-08-21T10:30:00.000Z"
   * }
   * ```
   * 
   * @throws {503} 當任何關鍵服務不可用時
   * @throws {503} 當健康檢查過程發生異常時
   * 
   * @security 此端點通常不需要認證，用於系統監控
   * @performance 通常在 100-500ms 內完成檢查
   */
  getHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      // 記錄健康檢查請求，包含客戶端資訊用於監控和調試
      this.logger.debug('🔍 收到健康檢查請求', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });

      // 呼叫監控服務執行完整的系統健康檢查
      // MonitoringService 會依序檢查所有依賴服務並回傳綜合狀態
      const healthStatus = await this.monitoringService.getHealthStatus();
      
      if (healthStatus) {
        // 根據整體健康狀態決定 HTTP 狀態碼
        // healthy: 200 OK, degraded: 206 Partial Content, unhealthy: 503 Service Unavailable
        const statusCode = healthStatus.status === 'healthy' ? 200 : 
                          healthStatus.status === 'degraded' ? 206 : 503;
        
        // 記錄健康檢查結果，包含重要指標用於監控
        this.logger.info('✅ 健康檢查完成', {
          status: healthStatus.status,
          statusCode,
          components: Object.keys(healthStatus.components || {}).length,
          uptime: healthStatus.uptime,
          timestamp: new Date().toISOString()
        });

        // 回傳完整的健康狀態報告，加上當前時間戳
        res.status(statusCode).json({
          ...healthStatus,
          timestamp: new Date().toISOString()
        });
      } else {
        // 監控服務本身異常，無法提供健康狀態資訊
        this.logger.warn('⚠️ 監控服務異常，無法獲取健康狀態');
        
        res.status(503).json({
          status: 'unhealthy',
          message: 'Monitoring service unavailable - cannot determine health status',
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      // 健康檢查過程中發生未預期的錯誤
      // 記錄詳細錯誤資訊用於故障排除
      this.logger.error('❌ 健康檢查過程發生嚴重錯誤', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });

      // 回傳服務不可用狀態，在生產環境中隱藏詳細錯誤訊息
      res.status(503).json({
        status: 'unhealthy',
        message: 'Health check failed due to internal error',
        error: process.env.NODE_ENV === 'production' 
          ? 'Service temporarily unavailable' 
          : (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toISOString()
      });
    }
  };
}