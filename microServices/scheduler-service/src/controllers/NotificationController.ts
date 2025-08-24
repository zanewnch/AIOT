/**
 * @fileoverview 通知控制器 - Scheduler Service 通知管理模組
 * 
 * 職責說明：
 * - 提供通知系統的管理 API 端點
 * - 處理通知發送、配置和統計查詢請求
 * - 支援通知測試和狀態監控功能
 * - 實現通知歷史記錄和規則管理
 * 
 * API 端點：
 * - POST /notifications/test - 測試通知發送
 * - GET /notifications/stats - 獲取通知統計
 * - GET /notifications/history - 獲取通知歷史
 * - GET /notifications/rules - 獲取通知規則
 * - PUT /notifications/rules/:id - 更新通知規則
 * - POST /notifications/send - 手動發送通知
 * - GET /notifications/providers - 獲取通知提供者狀態
 * 
 * 依賴服務：
 * - NotificationService: 提供通知核心功能
 * - MonitoringService: 整合系統監控
 * - Logger: 記錄操作日誌
 */

import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';

import { TYPES } from '../container/types';
import { NotificationService } from '../services/NotificationService';
import { MonitoringService } from '../services/MonitoringService';
import {
  NotificationMessage,
  NotificationChannel,
  NotificationSeverity,
  NotificationStats
} from '../types/NotificationTypes';

/**
 * 請求參數介面定義
 */
interface TestNotificationRequest {
  channel?: NotificationChannel;
  recipients?: string[];
  title?: string;
  content?: string;
  severity?: NotificationSeverity;
}

interface SendNotificationRequest {
  title: string;
  content: string;
  channel: NotificationChannel;
  recipients: string[];
  severity: NotificationSeverity;
  metadata?: Record<string, any>;
}

interface UpdateRuleRequest {
  enabled?: boolean;
  cooldownPeriod?: number;
  conditions?: any;
  notifications?: any[];
}

/**
 * NotificationController - 通知控制器類別
 * 
 * 架構模式：
 * - 使用 InversifyJS 依賴注入實現鬆耦合設計
 * - 遵循 RESTful API 設計原則
 * - 實現統一的錯誤處理和回應格式
 * 
 * 設計原則：
 * - 單一職責：專注於通知相關的 HTTP 請求處理
 * - 依賴反轉：透過介面注入依賴服務
 * - 錯誤隔離：完整的 try-catch 錯誤處理
 */
@injectable()
export class NotificationController {
  constructor(
    @inject(TYPES.Logger) private readonly logger: any,
    @inject(TYPES.NotificationService) private readonly notificationService: NotificationService,
    @inject(TYPES.MonitoringService) private readonly monitoringService: MonitoringService
  ) {}

  /**
   * 測試通知發送
   * POST /notifications/test
   * 
   * 功能描述：
   * 1. 接收測試通知的配置參數
   * 2. 創建測試通知訊息
   * 3. 發送測試通知到指定渠道
   * 4. 返回發送結果和狀態
   * 
   * 請求體範例：
   * {
   *   "channel": "email",
   *   "recipients": ["test@example.com"],
   *   "title": "測試通知",
   *   "content": "這是一個測試通知",
   *   "severity": "info"
   * }
   */
  testNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        channel = 'email',
        recipients = [],
        title = '系統測試通知',
        content = '這是來自 AIOT 排程服務的測試通知，用於驗證通知系統是否正常運作。',
        severity = 'info'
      }: TestNotificationRequest = req.body;

      this.logger.info('收到測試通知請求', {
        channel,
        recipients: recipients.length,
        severity,
        ip: req.ip
      });

      // 創建測試通知訊息
      const testNotification: NotificationMessage = {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        content,
        severity,
        channel,
        recipients,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 1, // 測試通知只重試一次
        metadata: {
          testMode: true,
          requestedBy: req.ip,
          testTime: new Date().toISOString()
        }
      };

      // 發送測試通知
      const result = await this.notificationService.sendNotification(testNotification);

      this.logger.info('測試通知發送完成', {
        notificationId: testNotification.id,
        success: result.success,
        channel,
        messageId: result.messageId
      });

      res.json({
        success: result.success,
        message: result.success ? '測試通知發送成功' : '測試通知發送失敗',
        data: {
          notificationId: testNotification.id,
          channel,
          recipients: recipients.length,
          messageId: result.messageId,
          sentAt: result.sentAt,
          error: result.error
        }
      });

    } catch (error) {
      this.logger.error('測試通知發送失敗', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      res.status(500).json({
        success: false,
        message: '測試通知發送時發生內部錯誤',
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : (error instanceof Error ? error.message : String(error))
      });
    }
  };

  /**
   * 獲取通知統計
   * GET /notifications/stats
   * 
   * 查詢參數：
   * - startDate: 開始日期 (ISO 字串)
   * - endDate: 結束日期 (ISO 字串)
   */
  getNotificationStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      this.logger.debug('收到通知統計查詢請求', {
        startDate,
        endDate,
        ip: req.ip
      });

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await this.notificationService.getNotificationStats(start, end);

      this.logger.info('通知統計查詢完成', {
        total: stats.total,
        sent: stats.sent,
        failed: stats.failed,
        pending: stats.pending
      });

      res.json({
        success: true,
        message: '通知統計查詢成功',
        data: stats
      });

    } catch (error) {
      this.logger.error('獲取通知統計失敗', {
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        success: false,
        message: '獲取通知統計時發生錯誤',
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : (error instanceof Error ? error.message : String(error))
      });
    }
  };

  /**
   * 獲取通知歷史記錄
   * GET /notifications/history
   * 
   * 查詢參數：
   * - limit: 返回記錄數量限制 (預設 50，最大 500)
   * - channel: 過濾特定通知渠道
   * - severity: 過濾特定嚴重程度
   */
  getNotificationHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        limit = '50', 
        channel, 
        severity 
      } = req.query;

      const limitNum = Math.min(parseInt(limit as string) || 50, 500);

      this.logger.debug('收到通知歷史查詢請求', {
        limit: limitNum,
        channel,
        severity,
        ip: req.ip
      });

      let history = await this.notificationService.getNotificationHistory(limitNum);

      // 應用過濾條件
      if (channel) {
        history = history.filter(n => n.channel === channel);
      }
      if (severity) {
        history = history.filter(n => n.severity === severity);
      }

      this.logger.info('通知歷史查詢完成', {
        totalRecords: history.length,
        channel,
        severity
      });

      res.json({
        success: true,
        message: '通知歷史查詢成功',
        data: {
          notifications: history,
          totalCount: history.length,
          filters: {
            channel: channel || null,
            severity: severity || null,
            limit: limitNum
          }
        }
      });

    } catch (error) {
      this.logger.error('獲取通知歷史失敗', {
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        success: false,
        message: '獲取通知歷史時發生錯誤',
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : (error instanceof Error ? error.message : String(error))
      });
    }
  };

  /**
   * 手動發送通知
   * POST /notifications/send
   * 
   * 請求體範例：
   * {
   *   "title": "手動通知標題",
   *   "content": "通知內容",
   *   "channel": "email",
   *   "recipients": ["user@example.com"],
   *   "severity": "warning",
   *   "metadata": { "source": "manual" }
   * }
   */
  sendManualNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        title,
        content,
        channel,
        recipients,
        severity,
        metadata = {}
      }: SendNotificationRequest = req.body;

      // 驗證必要欄位
      if (!title || !content || !channel || !recipients || !severity) {
        res.status(400).json({
          success: false,
          message: '缺少必要欄位',
          requiredFields: ['title', 'content', 'channel', 'recipients', 'severity']
        });
        return;
      }

      this.logger.info('收到手動發送通知請求', {
        title,
        channel,
        recipients: recipients.length,
        severity,
        ip: req.ip
      });

      // 創建通知訊息
      const notification: NotificationMessage = {
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        content,
        severity,
        channel,
        recipients,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
        metadata: {
          ...metadata,
          manualSend: true,
          requestedBy: req.ip,
          requestTime: new Date().toISOString()
        }
      };

      // 發送通知
      const result = await this.notificationService.sendNotification(notification);

      this.logger.info('手動通知發送完成', {
        notificationId: notification.id,
        success: result.success,
        messageId: result.messageId
      });

      res.json({
        success: result.success,
        message: result.success ? '通知發送成功' : '通知發送失敗',
        data: {
          notificationId: notification.id,
          messageId: result.messageId,
          sentAt: result.sentAt,
          error: result.error
        }
      });

    } catch (error) {
      this.logger.error('手動發送通知失敗', {
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        success: false,
        message: '發送通知時發生內部錯誤',
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : (error instanceof Error ? error.message : String(error))
      });
    }
  };

  /**
   * 獲取待處理通知列表
   * GET /notifications/pending
   */
  getPendingNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      this.logger.debug('收到待處理通知查詢請求', { ip: req.ip });

      const pendingNotifications = this.notificationService.getPendingNotifications();

      this.logger.info('待處理通知查詢完成', {
        pendingCount: pendingNotifications.length
      });

      res.json({
        success: true,
        message: '待處理通知查詢成功',
        data: {
          notifications: pendingNotifications,
          count: pendingNotifications.length,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.logger.error('獲取待處理通知失敗', {
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        success: false,
        message: '獲取待處理通知時發生錯誤',
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : (error instanceof Error ? error.message : String(error))
      });
    }
  };

  /**
   * 測試系統監控通知
   * POST /notifications/test-monitoring
   * 
   * 觸發一個模擬警報來測試完整的通知流程
   */
  testMonitoringNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { channel = 'email' } = req.body;

      this.logger.info('收到監控通知測試請求', {
        channel,
        ip: req.ip
      });

      // 使用 MonitoringService 的測試通知功能
      const success = await this.monitoringService.testNotification(channel);

      res.json({
        success,
        message: success ? '監控通知測試成功' : '監控通知測試失敗',
        data: {
          channel,
          testTime: new Date().toISOString()
        }
      });

    } catch (error) {
      this.logger.error('監控通知測試失敗', {
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        success: false,
        message: '監控通知測試時發生錯誤',
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : (error instanceof Error ? error.message : String(error))
      });
    }
  };

  /**
   * 獲取通知系統健康狀態
   * GET /notifications/health
   */
  getNotificationHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      this.logger.debug('收到通知系統健康檢查請求', { ip: req.ip });

      // 檢查通知服務狀態
      const pendingCount = this.notificationService.getPendingNotifications().length;
      const stats = await this.notificationService.getNotificationStats();

      // 計算健康指標
      const totalNotifications = stats.total;
      const successRate = totalNotifications > 0 ? (stats.sent / totalNotifications) * 100 : 100;
      const isHealthy = successRate >= 95 && pendingCount < 100;

      const healthData = {
        status: isHealthy ? 'healthy' : 'degraded',
        metrics: {
          pendingNotifications: pendingCount,
          totalNotifications,
          successRate: Math.round(successRate * 100) / 100,
          sentNotifications: stats.sent,
          failedNotifications: stats.failed
        },
        lastCheck: new Date().toISOString(),
        thresholds: {
          maxPendingNotifications: 100,
          minSuccessRate: 95
        }
      };

      this.logger.info('通知系統健康檢查完成', {
        status: healthData.status,
        successRate: healthData.metrics.successRate,
        pendingCount
      });

      res.json({
        success: true,
        message: '通知系統健康檢查完成',
        data: healthData
      });

    } catch (error) {
      this.logger.error('通知系統健康檢查失敗', {
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        success: false,
        message: '通知系統健康檢查時發生錯誤',
        data: {
          status: 'unhealthy',
          lastCheck: new Date().toISOString()
        }
      });
    }
  };
}