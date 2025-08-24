/**
 * @fileoverview Email 通知提供者
 * 
 * 功能描述：
 * - 實現 Email 通知的發送功能
 * - 支援 HTML 和純文字格式
 * - 使用 nodemailer 進行 SMTP 發送
 * - 支援多收件人和附件
 * - 提供發送結果驗證
 */

import { injectable } from 'inversify';
import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { Logger } from 'winston';

import {
  NotificationProvider,
  NotificationMessage,
  NotificationSendResult,
  EmailNotificationConfig
} from '../types/NotificationTypes';

/**
 * EmailNotificationProvider - Email 通知提供者
 * 
 * 實現功能：
 * - SMTP 伺服器連線管理
 * - Email 格式化和發送
 * - 錯誤處理和重試機制
 * - 發送狀態追蹤
 */
@injectable()
export class EmailNotificationProvider implements NotificationProvider {
  public readonly name = 'EmailNotificationProvider';
  public readonly channel = 'email' as const;
  public isInitialized = false;

  private transporter: Transporter | null = null;
  private config: EmailNotificationConfig;

  constructor(
    private logger: Logger,
    config: EmailNotificationConfig
  ) {
    this.config = config;
  }

  /**
   * 初始化 Email 提供者
   * 建立 SMTP 連線並驗證配置
   */
  async initialize(): Promise<void> {
    try {
      if (!this.config.enabled) {
        this.logger.info('Email 通知提供者已停用');
        return;
      }

      // 創建 nodemailer 傳輸器
      this.transporter = nodemailer.createTransporter({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure, // true for 465, false for other ports
        auth: {
          user: this.config.auth.user,
          pass: this.config.auth.pass,
        },
        // 連線逾時設定
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      });

      // 驗證 SMTP 連線
      await this.transporter.verify();
      
      this.isInitialized = true;
      this.logger.info(`Email 通知提供者初始化成功`, {
        host: this.config.host,
        port: this.config.port,
        user: this.config.auth.user
      });

    } catch (error) {
      this.isInitialized = false;
      this.logger.error('Email 通知提供者初始化失敗', {
        error: error instanceof Error ? error.message : String(error),
        host: this.config.host,
        port: this.config.port
      });
      throw error;
    }
  }

  /**
   * 發送 Email 通知
   * 
   * @param message 通知訊息
   * @returns 發送結果
   */
  async send(message: NotificationMessage): Promise<NotificationSendResult> {
    if (!this.isInitialized || !this.transporter) {
      return {
        success: false,
        error: 'Email 提供者未初始化',
        sentAt: new Date()
      };
    }

    try {
      // 準備收件人列表
      const recipients = message.recipients.length > 0 
        ? message.recipients 
        : this.config.defaultRecipients;

      if (recipients.length === 0) {
        return {
          success: false,
          error: '沒有有效的收件人',
          sentAt: new Date()
        };
      }

      // 構建 Email 內容
      const mailOptions: SendMailOptions = {
        from: {
          name: this.config.from.name,
          address: this.config.from.email
        },
        to: recipients,
        subject: this.formatSubject(message),
        text: this.formatPlainTextContent(message),
        html: this.formatHtmlContent(message),
        // 設定優先級（根據嚴重程度）
        priority: this.getPriority(message.severity),
        // 添加自定義標頭
        headers: {
          'X-Notification-Id': message.id,
          'X-Alert-Id': message.alertId || '',
          'X-Severity': message.severity,
          'X-Channel': message.channel
        }
      };

      // 發送 Email
      const info = await this.transporter.sendMail(mailOptions);

      // 記錄發送成功
      this.logger.info('Email 通知發送成功', {
        notificationId: message.id,
        messageId: info.messageId,
        recipients: recipients,
        subject: mailOptions.subject
      });

      return {
        success: true,
        messageId: info.messageId,
        sentAt: new Date(),
        response: {
          messageId: info.messageId,
          response: info.response,
          accepted: info.accepted,
          rejected: info.rejected
        }
      };

    } catch (error) {
      this.logger.error('Email 通知發送失敗', {
        notificationId: message.id,
        error: error instanceof Error ? error.message : String(error),
        recipients: message.recipients
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        sentAt: new Date()
      };
    }
  }

  /**
   * 驗證配置
   * 檢查 SMTP 設定是否正確
   */
  async validateConfig(): Promise<boolean> {
    try {
      if (!this.config.enabled) {
        return true; // 停用時視為有效
      }

      // 基本配置驗證
      if (!this.config.host || !this.config.port) {
        this.logger.error('Email 配置無效：缺少主機或端口');
        return false;
      }

      if (!this.config.auth.user || !this.config.auth.pass) {
        this.logger.error('Email 配置無效：缺少認證資訊');
        return false;
      }

      if (!this.config.from.email) {
        this.logger.error('Email 配置無效：缺少發件人資訊');
        return false;
      }

      // SMTP 連線驗證
      if (this.transporter) {
        await this.transporter.verify();
      }

      return true;
    } catch (error) {
      this.logger.error('Email 配置驗證失敗', error);
      return false;
    }
  }

  /**
   * 清理資源
   * 關閉 SMTP 連線
   */
  async cleanup(): Promise<void> {
    try {
      if (this.transporter) {
        this.transporter.close();
        this.transporter = null;
      }
      this.isInitialized = false;
      this.logger.info('Email 通知提供者已清理');
    } catch (error) {
      this.logger.error('清理 Email 通知提供者時發生錯誤', error);
    }
  }

  // ================================
  // 私有方法：Email 格式化和處理
  // ================================

  /**
   * 格式化 Email 主旨
   */
  private formatSubject(message: NotificationMessage): string {
    const severityPrefix = this.getSeverityPrefix(message.severity);
    return `${severityPrefix} ${message.title}`;
  }

  /**
   * 格式化純文字內容
   */
  private formatPlainTextContent(message: NotificationMessage): string {
    const lines = [
      `通知 ID: ${message.id}`,
      `嚴重程度: ${message.severity.toUpperCase()}`,
      `時間: ${message.createdAt.toLocaleString('zh-TW')}`,
      '',
      '詳細內容:',
      message.content,
      ''
    ];

    // 添加警報相關資訊
    if (message.alertId && message.metadata) {
      lines.push('警報資訊:');
      lines.push(`- 警報 ID: ${message.alertId}`);
      if (message.metadata.alertType) {
        lines.push(`- 類型: ${message.metadata.alertType}`);
      }
      if (message.metadata.alertValue !== undefined) {
        lines.push(`- 當前值: ${message.metadata.alertValue}`);
      }
      if (message.metadata.alertThreshold !== undefined) {
        lines.push(`- 閾值: ${message.metadata.alertThreshold}`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('此訊息由 AIOT 排程服務自動發送');
    lines.push(`發送時間: ${new Date().toLocaleString('zh-TW')}`);

    return lines.join('\n');
  }

  /**
   * 格式化 HTML 內容
   */
  private formatHtmlContent(message: NotificationMessage): string {
    const severityColor = this.getSeverityColor(message.severity);
    const severityIcon = this.getSeverityIcon(message.severity);

    let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.formatSubject(message)}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background-color: ${severityColor}; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .severity-badge { display: inline-block; background-color: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; margin-top: 8px; }
        .content { padding: 30px; }
        .message { font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px; }
        .details { background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .details h3 { margin: 0 0 15px 0; color: #495057; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .detail-item { display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e9ecef; }
        .detail-item:last-child { margin-bottom: 0; border-bottom: none; }
        .detail-label { font-weight: 500; color: #6c757d; }
        .detail-value { color: #495057; }
        .footer { background-color: #f8f9fa; padding: 15px 30px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; text-align: center; }
        .icon { font-size: 24px; margin-right: 8px; vertical-align: middle; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><span class="icon">${severityIcon}</span>${message.title}</h1>
            <div class="severity-badge">${message.severity.toUpperCase()}</div>
        </div>
        <div class="content">
            <div class="message">${this.escapeHtml(message.content)}</div>
            
            <div class="details">
                <h3>通知詳情</h3>
                <div class="detail-item">
                    <span class="detail-label">通知 ID</span>
                    <span class="detail-value">${message.id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">建立時間</span>
                    <span class="detail-value">${message.createdAt.toLocaleString('zh-TW')}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">通知渠道</span>
                    <span class="detail-value">${message.channel.toUpperCase()}</span>
                </div>
            </div>`;

    // 添加警報詳情
    if (message.alertId && message.metadata) {
      html += `
            <div class="details">
                <h3>警報資訊</h3>
                <div class="detail-item">
                    <span class="detail-label">警報 ID</span>
                    <span class="detail-value">${message.alertId}</span>
                </div>`;

      if (message.metadata.alertType) {
        html += `
                <div class="detail-item">
                    <span class="detail-label">警報類型</span>
                    <span class="detail-value">${message.metadata.alertType}</span>
                </div>`;
      }

      if (message.metadata.alertValue !== undefined) {
        html += `
                <div class="detail-item">
                    <span class="detail-label">當前值</span>
                    <span class="detail-value">${message.metadata.alertValue}</span>
                </div>`;
      }

      if (message.metadata.alertThreshold !== undefined) {
        html += `
                <div class="detail-item">
                    <span class="detail-label">閾值</span>
                    <span class="detail-value">${message.metadata.alertThreshold}</span>
                </div>`;
      }

      html += `
            </div>`;
    }

    html += `
        </div>
        <div class="footer">
            此訊息由 AIOT 排程服務自動發送 | 發送時間: ${new Date().toLocaleString('zh-TW')}
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * 根據嚴重程度獲取前綴
   */
  private getSeverityPrefix(severity: string): string {
    switch (severity) {
      case 'critical':
        return '[🚨 緊急]';
      case 'error':
        return '[❌ 錯誤]';
      case 'warning':
        return '[⚠️  警告]';
      case 'info':
        return '[ℹ️  資訊]';
      default:
        return '[📢 通知]';
    }
  }

  /**
   * 根據嚴重程度獲取顏色
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return '#dc2626'; // 紅色
      case 'error':
        return '#ea580c'; // 橙紅色
      case 'warning':
        return '#d97706'; // 橙色
      case 'info':
        return '#2563eb'; // 藍色
      default:
        return '#6b7280'; // 灰色
    }
  }

  /**
   * 根據嚴重程度獲取圖示
   */
  private getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  }

  /**
   * 根據嚴重程度獲取郵件優先級
   */
  private getPriority(severity: string): 'high' | 'normal' | 'low' {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'high';
      case 'warning':
        return 'normal';
      default:
        return 'low';
    }
  }

  /**
   * HTML 跳脫
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}