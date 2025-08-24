/**
 * @fileoverview 通知服務 - 統一的通知管理和發送服務
 * 
 * 功能描述：
 * - 管理多種通知渠道（Email、Webhook、SMS 等）
 * - 提供統一的通知發送介面
 * - 處理通知模板和規則
 * - 支援重試機制和錯誤處理
 * - 收集通知統計資料
 * 
 * 設計模式：
 * - 策略模式：不同的通知提供者
 * - 工廠模式：通知訊息創建
 * - 觀察者模式：通知事件處理
 */

import { injectable, inject } from 'inversify';
import { Logger } from 'winston';
import { createClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { TYPES } from '../container/types';

import {
  NotificationMessage,
  NotificationProvider,
  NotificationSendResult,
  NotificationServiceConfig,
  NotificationChannel,
  NotificationSeverity,
  NotificationStats,
  NotificationRule,
  NotificationTemplate,
  NotificationStatus
} from '../types/NotificationTypes';
import { PerformanceAlert } from '../types/monitoring.types';

/**
 * NotificationService - 通知服務主類別
 * 
 * 職責：
 * 1. 管理多個通知提供者（Email、Webhook 等）
 * 2. 根據規則和模板創建並發送通知
 * 3. 處理重試邏輯和錯誤處理
 * 4. 維護通知佇列和狀態
 * 5. 提供通知統計和監控
 */
@injectable()
export class NotificationService {
  private redis: RedisClientType;
  private providers: Map<NotificationChannel, NotificationProvider> = new Map();
  private config: NotificationServiceConfig;
  private notificationQueue: NotificationMessage[] = [];
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  
  // Redis 鍵值常數
  private readonly REDIS_KEYS = {
    NOTIFICATIONS: 'scheduler:notifications',
    NOTIFICATION_STATS: 'scheduler:notification:stats',
    NOTIFICATION_QUEUE: 'scheduler:notification:queue',
    NOTIFICATION_HISTORY: 'scheduler:notification:history'
  };

  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.RedisConfig) private redisConfig: any,
    @inject(TYPES.NotificationConfig) private notificationConfig: NotificationServiceConfig
  ) {
    this.config = this.notificationConfig;
    this.initializeRedis();
  }

  /**
   * 初始化 Redis 連線
   * 用於儲存通知佇列、狀態和統計資料
   */
  private initializeRedis = async (): Promise<void> => {
    try {
      this.redis = createClient({
        url: this.redisConfig.url,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true
        }
      });

      this.redis.on('error', (error) => {
        this.logger.error('通知服務 Redis 連線錯誤', error);
      });

      this.redis.on('connect', () => {
        this.logger.info('通知服務 Redis 連線成功');
      });

      await this.redis.connect();
    } catch (error) {
      this.logger.error('初始化通知服務 Redis 失敗', error);
    }
  };

  /**
   * 註冊通知提供者
   * 支援動態添加不同類型的通知渠道
   * 
   * @param provider 通知提供者實例
   */
  registerProvider = async (provider: NotificationProvider): Promise<void> => {
    try {
      await provider.initialize();
      const isValid = await provider.validateConfig();
      
      if (!isValid) {
        throw new Error(`通知提供者 ${provider.name} 配置無效`);
      }

      this.providers.set(provider.channel, provider);
      this.logger.info(`通知提供者已註冊: ${provider.name} (${provider.channel})`);
    } catch (error) {
      this.logger.error(`註冊通知提供者失敗: ${provider.name}`, error);
      throw error;
    }
  };

  /**
   * 移除通知提供者
   * 
   * @param channel 通知渠道
   */
  unregisterProvider = async (channel: NotificationChannel): Promise<void> => {
    const provider = this.providers.get(channel);
    if (provider) {
      await provider.cleanup();
      this.providers.delete(channel);
      this.logger.info(`通知提供者已移除: ${channel}`);
    }
  };

  /**
   * 啟動通知服務
   * 開始處理通知佇列
   */
  start = async (): Promise<void> => {
    try {
      // 從 Redis 恢復通知佇列
      await this.loadNotificationQueue();
      
      // 開始處理通知佇列（每 5 秒檢查一次）
      this.processingInterval = setInterval(() => {
        this.processNotificationQueue();
      }, 5000);

      this.logger.info('通知服務已啟動');
    } catch (error) {
      this.logger.error('啟動通知服務失敗', error);
      throw error;
    }
  };

  /**
   * 停止通知服務
   */
  stop = async (): Promise<void> => {
    try {
      // 停止佇列處理
      if (this.processingInterval) {
        clearInterval(this.processingInterval);
        this.processingInterval = null;
      }

      // 等待當前處理完成
      while (this.isProcessing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 保存通知佇列到 Redis
      await this.saveNotificationQueue();

      // 清理所有提供者
      for (const [channel, provider] of this.providers) {
        await provider.cleanup();
      }
      this.providers.clear();

      // 關閉 Redis 連線
      if (this.redis) {
        await this.redis.quit();
      }

      this.logger.info('通知服務已停止');
    } catch (error) {
      this.logger.error('停止通知服務時發生錯誤', error);
    }
  };

  /**
   * 根據警報創建並發送通知
   * 這是與 MonitoringService 整合的主要介面
   * 
   * @param alert 性能警報
   */
  sendAlertNotification = async (alert: PerformanceAlert): Promise<void> => {
    try {
      // 根據警報類型和嚴重程度查找適用的規則
      const applicableRules = this.findApplicableRules(alert);
      
      if (applicableRules.length === 0) {
        this.logger.debug(`警報 ${alert.id} 沒有匹配的通知規則`, {
          alertType: alert.type,
          severity: alert.severity
        });
        return;
      }

      // 為每個適用的規則創建通知
      for (const rule of applicableRules) {
        // 檢查冷卻期
        if (await this.isInCooldownPeriod(rule.id, alert.type)) {
          this.logger.debug(`規則 ${rule.name} 處於冷卻期，跳過通知`);
          continue;
        }

        // 為規則中的每個通知配置創建通知訊息
        for (const notificationConfig of rule.notifications) {
          const template = this.findTemplate(
            notificationConfig.templateId,
            notificationConfig.channel,
            this.mapAlertSeverityToNotification(alert.severity)
          );

          if (!template) {
            this.logger.warn(`找不到模板 ${notificationConfig.templateId}`);
            continue;
          }

          const notification = await this.createNotificationFromAlert(
            alert,
            notificationConfig.channel,
            notificationConfig.recipients,
            template,
            notificationConfig.delay
          );

          await this.queueNotification(notification);
        }

        // 記錄冷卻期
        await this.setCooldownPeriod(rule.id, alert.type, rule.cooldownPeriod);
      }
    } catch (error) {
      this.logger.error('發送警報通知失敗', { alertId: alert.id, error });
    }
  };

  /**
   * 手動發送通知
   * 
   * @param notification 通知訊息
   */
  sendNotification = async (notification: NotificationMessage): Promise<NotificationSendResult> => {
    const provider = this.providers.get(notification.channel);
    
    if (!provider) {
      const error = `不支援的通知渠道: ${notification.channel}`;
      this.logger.error(error, { notificationId: notification.id });
      return {
        success: false,
        error,
        sentAt: new Date()
      };
    }

    try {
      // 更新通知狀態為發送中
      notification.status = 'sending';
      notification.updatedAt = new Date();
      await this.updateNotificationInRedis(notification);

      // 發送通知
      const result = await provider.send(notification);

      // 更新通知狀態
      notification.status = result.success ? 'sent' : 'failed';
      notification.updatedAt = new Date();
      
      if (!result.success) {
        notification.error = result.error;
        notification.retryCount++;
      }

      await this.updateNotificationInRedis(notification);

      // 記錄統計
      await this.updateNotificationStats(notification, result.success);

      this.logger.info('通知發送完成', {
        notificationId: notification.id,
        channel: notification.channel,
        success: result.success,
        error: result.error
      });

      return result;
    } catch (error) {
      // 發送失敗，更新狀態並準備重試
      notification.status = 'failed';
      notification.error = error instanceof Error ? error.message : String(error);
      notification.retryCount++;
      notification.updatedAt = new Date();
      
      await this.updateNotificationInRedis(notification);

      this.logger.error('通知發送失敗', {
        notificationId: notification.id,
        channel: notification.channel,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        sentAt: new Date()
      };
    }
  };

  /**
   * 將通知加入佇列
   * 
   * @param notification 通知訊息
   */
  queueNotification = async (notification: NotificationMessage): Promise<void> => {
    try {
      this.notificationQueue.push(notification);
      await this.saveNotificationToRedis(notification);
      
      this.logger.debug('通知已加入佇列', {
        notificationId: notification.id,
        channel: notification.channel,
        queueSize: this.notificationQueue.length
      });
    } catch (error) {
      this.logger.error('加入通知佇列失敗', { notificationId: notification.id, error });
    }
  };

  /**
   * 獲取通知統計
   * 
   * @param startDate 開始日期
   * @param endDate 結束日期
   */
  getNotificationStats = async (startDate?: Date, endDate?: Date): Promise<NotificationStats> => {
    try {
      const stats = await this.redis.get(this.REDIS_KEYS.NOTIFICATION_STATS);
      const defaultStats: NotificationStats = {
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0,
        byChannel: {} as any,
        bySeverity: {} as any,
        timeRange: {
          start: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: endDate || new Date()
        }
      };

      return stats ? { ...defaultStats, ...JSON.parse(stats) } : defaultStats;
    } catch (error) {
      this.logger.error('獲取通知統計失敗', error);
      throw error;
    }
  };

  /**
   * 獲取待處理的通知列表
   */
  getPendingNotifications = (): NotificationMessage[] => {
    return this.notificationQueue.filter(n => n.status === 'pending');
  };

  /**
   * 獲取通知歷史記錄
   * 
   * @param limit 返回記錄數量限制
   */
  getNotificationHistory = async (limit: number = 100): Promise<NotificationMessage[]> => {
    try {
      const history = await this.redis.lrange(this.REDIS_KEYS.NOTIFICATION_HISTORY, 0, limit - 1);
      return history.map(item => JSON.parse(item));
    } catch (error) {
      this.logger.error('獲取通知歷史失敗', error);
      return [];
    }
  };

  // ================================
  // 私有方法：業務邏輯實現
  // ================================

  /**
   * 處理通知佇列
   * 定期執行，處理待發送的通知
   */
  private processNotificationQueue = async (): Promise<void> => {
    if (this.isProcessing || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // 處理待發送的通知
      const pendingNotifications = this.notificationQueue.filter(n => 
        n.status === 'pending' || (n.status === 'failed' && n.retryCount < n.maxRetries)
      );

      for (const notification of pendingNotifications) {
        try {
          await this.sendNotification(notification);
          
          // 移除已成功發送或超過重試次數的通知
          if (notification.status === 'sent' || notification.retryCount >= notification.maxRetries) {
            this.removeFromQueue(notification.id);
            await this.archiveNotification(notification);
          }
        } catch (error) {
          this.logger.error('處理佇列中的通知失敗', {
            notificationId: notification.id,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    } catch (error) {
      this.logger.error('處理通知佇列時發生錯誤', error);
    } finally {
      this.isProcessing = false;
    }
  };

  /**
   * 從警報創建通知訊息
   */
  private createNotificationFromAlert = async (
    alert: PerformanceAlert,
    channel: NotificationChannel,
    recipients: string[],
    template: NotificationTemplate,
    delay?: number
  ): Promise<NotificationMessage> => {
    const notification: NotificationMessage = {
      id: uuidv4(),
      title: this.renderTemplate(template.titleTemplate, alert),
      content: this.renderTemplate(template.contentTemplate, alert),
      severity: this.mapAlertSeverityToNotification(alert.severity),
      channel,
      recipients,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: this.config.defaults.maxRetries,
      alertId: alert.id,
      metadata: {
        alertType: alert.type,
        alertValue: alert.value,
        alertThreshold: alert.threshold,
        delay: delay || 0
      }
    };

    return notification;
  };

  /**
   * 查找適用的通知規則
   */
  private findApplicableRules = (alert: PerformanceAlert): NotificationRule[] => {
    return this.config.rules.filter(rule => {
      if (!rule.enabled) return false;
      
      // 檢查警報類型
      if (rule.conditions.alertTypes.length > 0 && 
          !rule.conditions.alertTypes.includes(alert.type)) {
        return false;
      }
      
      // 檢查嚴重程度
      const notificationSeverity = this.mapAlertSeverityToNotification(alert.severity);
      if (rule.conditions.severities.length > 0 && 
          !rule.conditions.severities.includes(notificationSeverity)) {
        return false;
      }
      
      // 檢查時間窗口
      if (rule.conditions.timeWindow) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        if (currentTime < rule.conditions.timeWindow.start || 
            currentTime > rule.conditions.timeWindow.end) {
          return false;
        }
      }
      
      return true;
    });
  };

  /**
   * 查找通知模板
   */
  private findTemplate = (
    templateId: string,
    channel: NotificationChannel,
    severity: NotificationSeverity
  ): NotificationTemplate | null => {
    return this.config.templates.find(template => 
      template.id === templateId ||
      (template.channel === channel && template.severity === severity)
    ) || null;
  };

  /**
   * 渲染模板
   */
  private renderTemplate = (template: string, alert: PerformanceAlert): string => {
    return template
      .replace(/\{\{alertId\}\}/g, alert.id)
      .replace(/\{\{alertType\}\}/g, alert.type)
      .replace(/\{\{severity\}\}/g, alert.severity)
      .replace(/\{\{message\}\}/g, alert.message)
      .replace(/\{\{value\}\}/g, alert.value.toString())
      .replace(/\{\{threshold\}\}/g, alert.threshold.toString())
      .replace(/\{\{timestamp\}\}/g, alert.timestamp.toISOString());
  };

  /**
   * 映射警報嚴重程度到通知嚴重程度
   */
  private mapAlertSeverityToNotification = (alertSeverity: 'warning' | 'critical'): NotificationSeverity => {
    switch (alertSeverity) {
      case 'warning':
        return 'warning';
      case 'critical':
        return 'critical';
      default:
        return 'info';
    }
  };

  /**
   * 檢查是否在冷卻期
   */
  private isInCooldownPeriod = async (ruleId: string, alertType: string): Promise<boolean> => {
    try {
      const key = `${this.REDIS_KEYS.NOTIFICATIONS}:cooldown:${ruleId}:${alertType}`;
      const cooldownData = await this.redis.get(key);
      return cooldownData !== null;
    } catch (error) {
      this.logger.error('檢查冷卻期失敗', error);
      return false;
    }
  };

  /**
   * 設置冷卻期
   */
  private setCooldownPeriod = async (ruleId: string, alertType: string, cooldownSeconds: number): Promise<void> => {
    try {
      const key = `${this.REDIS_KEYS.NOTIFICATIONS}:cooldown:${ruleId}:${alertType}`;
      await this.redis.setEx(key, cooldownSeconds, '1');
    } catch (error) {
      this.logger.error('設置冷卻期失敗', error);
    }
  };

  // Redis 操作方法
  private saveNotificationToRedis = async (notification: NotificationMessage): Promise<void> => {
    try {
      const key = `${this.REDIS_KEYS.NOTIFICATIONS}:${notification.id}`;
      await this.redis.setEx(key, 24 * 60 * 60, JSON.stringify(notification)); // 24小時過期
    } catch (error) {
      this.logger.error('保存通知到 Redis 失敗', error);
    }
  };

  private updateNotificationInRedis = async (notification: NotificationMessage): Promise<void> => {
    await this.saveNotificationToRedis(notification);
  };

  private loadNotificationQueue = async (): Promise<void> => {
    try {
      const queueData = await this.redis.get(this.REDIS_KEYS.NOTIFICATION_QUEUE);
      if (queueData) {
        this.notificationQueue = JSON.parse(queueData);
      }
    } catch (error) {
      this.logger.error('從 Redis 載入通知佇列失敗', error);
    }
  };

  private saveNotificationQueue = async (): Promise<void> => {
    try {
      await this.redis.setEx(
        this.REDIS_KEYS.NOTIFICATION_QUEUE,
        24 * 60 * 60,
        JSON.stringify(this.notificationQueue)
      );
    } catch (error) {
      this.logger.error('保存通知佇列到 Redis 失敗', error);
    }
  };

  private removeFromQueue = (notificationId: string): void => {
    this.notificationQueue = this.notificationQueue.filter(n => n.id !== notificationId);
  };

  private archiveNotification = async (notification: NotificationMessage): Promise<void> => {
    try {
      await this.redis.lpush(this.REDIS_KEYS.NOTIFICATION_HISTORY, JSON.stringify(notification));
      await this.redis.ltrim(this.REDIS_KEYS.NOTIFICATION_HISTORY, 0, 999); // 保留最近 1000 條記錄
    } catch (error) {
      this.logger.error('歸檔通知失敗', error);
    }
  };

  private updateNotificationStats = async (notification: NotificationMessage, success: boolean): Promise<void> => {
    try {
      const stats = await this.getNotificationStats();
      
      stats.total++;
      if (success) {
        stats.sent++;
      } else {
        stats.failed++;
      }
      
      await this.redis.setEx(this.REDIS_KEYS.NOTIFICATION_STATS, 24 * 60 * 60, JSON.stringify(stats));
    } catch (error) {
      this.logger.error('更新通知統計失敗', error);
    }
  };
}