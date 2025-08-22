/**
 * @fileoverview Webhook 通知提供者
 * 
 * 功能描述：
 * - 實現 Webhook HTTP 通知的發送功能
 * - 支援自定義 HTTP 方法和標頭
 * - 提供重試機制和超時控制
 * - 支援 JSON 格式的負載資料
 * - 驗證 SSL 憑證和安全性設定
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Logger } from 'winston';

import {
  NotificationProvider,
  NotificationMessage,
  NotificationSendResult,
  WebhookNotificationConfig
} from '../types/NotificationTypes';

/**
 * WebhookNotificationProvider - Webhook 通知提供者
 * 
 * 實現功能：
 * - HTTP 請求發送管理
 * - JSON 格式負載構建
 * - 重試機制和錯誤處理
 * - 回應狀態驗證
 */
export class WebhookNotificationProvider implements NotificationProvider {
  public readonly name = 'WebhookNotificationProvider';
  public readonly channel = 'webhook' as const;
  public isInitialized = false;

  private httpClient: AxiosInstance | null = null;
  private config: WebhookNotificationConfig;

  constructor(
    private logger: Logger,
    config: WebhookNotificationConfig
  ) {
    this.config = config;
  }

  /**
   * 初始化 Webhook 提供者
   * 建立 HTTP 客戶端並驗證配置
   */
  async initialize(): Promise<void> {
    try {
      if (!this.config.enabled) {
        this.logger.info('Webhook 通知提供者已停用');
        return;
      }

      // 創建 axios 實例
      this.httpClient = axios.create({
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AIOT-Scheduler-Notification/1.0',
          ...this.config.headers
        },
        // SSL 驗證設定
        httpsAgent: this.config.verifySSL ? undefined : {
          rejectUnauthorized: false
        }
      });

      // 添加請求攔截器
      this.httpClient.interceptors.request.use(
        (config) => {
          this.logger.debug('發送 Webhook 請求', {
            method: config.method?.toUpperCase(),
            url: config.url,
            headers: this.sanitizeHeaders(config.headers)
          });
          return config;
        },
        (error) => {
          this.logger.error('Webhook 請求攔截器錯誤', error);
          return Promise.reject(error);
        }
      );

      // 添加回應攔截器
      this.httpClient.interceptors.response.use(
        (response) => {
          this.logger.debug('收到 Webhook 回應', {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url
          });
          return response;
        },
        (error) => {
          this.logger.warn('Webhook 回應錯誤', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            message: error.message
          });
          return Promise.reject(error);
        }
      );

      this.isInitialized = true;
      this.logger.info('Webhook 通知提供者初始化成功', {
        url: this.maskUrl(this.config.url),
        method: this.config.method,
        timeout: this.config.timeout,
        verifySSL: this.config.verifySSL
      });

    } catch (error) {
      this.isInitialized = false;
      this.logger.error('Webhook 通知提供者初始化失敗', {
        error: error instanceof Error ? error.message : String(error),
        url: this.maskUrl(this.config.url)
      });
      throw error;
    }
  }

  /**
   * 發送 Webhook 通知
   * 
   * @param message 通知訊息
   * @returns 發送結果
   */
  async send(message: NotificationMessage): Promise<NotificationSendResult> {
    if (!this.isInitialized || !this.httpClient) {
      return {
        success: false,
        error: 'Webhook 提供者未初始化',
        sentAt: new Date()
      };
    }

    const startTime = Date.now();
    let lastError: any = null;

    // 構建請求負載
    const payload = this.buildWebhookPayload(message);

    // 重試邏輯
    for (let attempt = 1; attempt <= this.config.retry.attempts; attempt++) {
      try {
        this.logger.debug(`Webhook 發送嘗試 ${attempt}/${this.config.retry.attempts}`, {
          notificationId: message.id,
          url: this.maskUrl(this.config.url)
        });

        // 發送 HTTP 請求
        const response = await this.httpClient.request({
          method: this.config.method,
          url: this.config.url,
          data: payload,
          headers: this.config.headers
        });

        // 檢查回應狀態
        if (this.isSuccessResponse(response)) {
          const duration = Date.now() - startTime;

          this.logger.info('Webhook 通知發送成功', {
            notificationId: message.id,
            url: this.maskUrl(this.config.url),
            status: response.status,
            duration: `${duration}ms`,
            attempt: attempt
          });

          return {
            success: true,
            messageId: this.extractMessageId(response),
            sentAt: new Date(),
            response: {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
              data: response.data,
              duration: duration
            }
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt === this.config.retry.attempts;

        this.logger.warn(`Webhook 發送嘗試 ${attempt} 失敗`, {
          notificationId: message.id,
          url: this.maskUrl(this.config.url),
          error: error instanceof Error ? error.message : String(error),
          isLastAttempt
        });

        // 如果不是最後一次嘗試，等待後重試
        if (!isLastAttempt) {
          await this.sleep(this.config.retry.delay * attempt); // 指數退避
        }
      }
    }

    // 所有重試都失敗
    const duration = Date.now() - startTime;
    this.logger.error('Webhook 通知發送失敗', {
      notificationId: message.id,
      url: this.maskUrl(this.config.url),
      attempts: this.config.retry.attempts,
      duration: `${duration}ms`,
      finalError: lastError instanceof Error ? lastError.message : String(lastError)
    });

    return {
      success: false,
      error: lastError instanceof Error ? lastError.message : String(lastError),
      sentAt: new Date()
    };
  }

  /**
   * 驗證配置
   * 檢查 Webhook 設定是否正確
   */
  async validateConfig(): Promise<boolean> {
    try {
      if (!this.config.enabled) {
        return true; // 停用時視為有效
      }

      // 基本配置驗證
      if (!this.config.url) {
        this.logger.error('Webhook 配置無效：缺少 URL');
        return false;
      }

      // URL 格式驗證
      try {
        const url = new URL(this.config.url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          this.logger.error('Webhook 配置無效：不支援的協議', { protocol: url.protocol });
          return false;
        }
      } catch (error) {
        this.logger.error('Webhook 配置無效：URL 格式錯誤', { url: this.config.url });
        return false;
      }

      // HTTP 方法驗證
      if (!['POST', 'PUT'].includes(this.config.method)) {
        this.logger.error('Webhook 配置無效：不支援的 HTTP 方法', { method: this.config.method });
        return false;
      }

      // 超時時間驗證
      if (this.config.timeout <= 0 || this.config.timeout > 300000) { // 最大 5 分鐘
        this.logger.error('Webhook 配置無效：超時時間設定錯誤', { timeout: this.config.timeout });
        return false;
      }

      // 重試配置驗證
      if (this.config.retry.attempts < 1 || this.config.retry.attempts > 10) {
        this.logger.error('Webhook 配置無效：重試次數設定錯誤', { attempts: this.config.retry.attempts });
        return false;
      }

      // 可選：發送測試請求驗證連通性
      if (this.httpClient) {
        try {
          const testPayload = {
            test: true,
            timestamp: new Date().toISOString(),
            message: 'Webhook configuration test'
          };

          await this.httpClient.request({
            method: this.config.method,
            url: this.config.url,
            data: testPayload,
            headers: {
              ...this.config.headers,
              'X-Test-Request': 'true'
            },
            timeout: 5000 // 測試請求使用較短超時
          });

          this.logger.info('Webhook 配置驗證成功', { url: this.maskUrl(this.config.url) });
        } catch (error) {
          this.logger.warn('Webhook 連通性測試失敗，但配置仍然有效', {
            url: this.maskUrl(this.config.url),
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      return true;

    } catch (error) {
      this.logger.error('Webhook 配置驗證失敗', error);
      return false;
    }
  }

  /**
   * 清理資源
   */
  async cleanup(): Promise<void> {
    try {
      if (this.httpClient) {
        // 取消所有待處理的請求
        this.httpClient = null;
      }
      this.isInitialized = false;
      this.logger.info('Webhook 通知提供者已清理');
    } catch (error) {
      this.logger.error('清理 Webhook 通知提供者時發生錯誤', error);
    }
  }

  // ================================
  // 私有方法：Webhook 處理邏輯
  // ================================

  /**
   * 構建 Webhook 負載
   */
  private buildWebhookPayload(message: NotificationMessage): any {
    return {
      // 基本通知資訊
      notification: {
        id: message.id,
        title: message.title,
        content: message.content,
        severity: message.severity,
        channel: message.channel,
        status: message.status,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString()
      },

      // 警報相關資訊
      alert: message.alertId ? {
        id: message.alertId,
        type: message.metadata?.alertType,
        value: message.metadata?.alertValue,
        threshold: message.metadata?.alertThreshold
      } : null,

      // 系統資訊
      system: {
        service: 'scheduler-service',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        hostname: process.env.HOSTNAME || 'unknown'
      },

      // 元資料
      metadata: {
        retryCount: message.retryCount,
        maxRetries: message.maxRetries,
        ...message.metadata
      },

      // Webhook 特定資訊
      webhook: {
        version: '1.0',
        format: 'json',
        charset: 'utf-8'
      }
    };
  }

  /**
   * 檢查回應是否成功
   */
  private isSuccessResponse(response: AxiosResponse): boolean {
    return response.status >= 200 && response.status < 300;
  }

  /**
   * 從回應中提取訊息 ID
   */
  private extractMessageId(response: AxiosResponse): string | undefined {
    // 嘗試從不同地方提取訊息 ID
    if (response.data?.messageId) {
      return response.data.messageId;
    }
    if (response.data?.id) {
      return response.data.id;
    }
    if (response.headers['x-message-id']) {
      return response.headers['x-message-id'];
    }
    return undefined;
  }

  /**
   * 遮蔽敏感 URL 資訊
   */
  private maskUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // 遮蔽查詢參數中的敏感資訊
      if (urlObj.search) {
        urlObj.search = '?[masked]';
      }
      // 遮蔽使用者資訊
      if (urlObj.username || urlObj.password) {
        urlObj.username = '[masked]';
        urlObj.password = '';
      }
      return urlObj.toString();
    } catch {
      return '[invalid-url]';
    }
  }

  /**
   * 清理敏感標頭資訊
   */
  private sanitizeHeaders(headers: any): any {
    if (!headers) return {};

    const sanitized = { ...headers };
    const sensitiveKeys = ['authorization', 'x-api-key', 'x-auth-token', 'cookie'];

    for (const key of sensitiveKeys) {
      if (sanitized[key] || sanitized[key.toLowerCase()]) {
        sanitized[key] = '[masked]';
        sanitized[key.toLowerCase()] = '[masked]';
      }
    }

    return sanitized;
  }

  /**
   * 延遲函數
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}