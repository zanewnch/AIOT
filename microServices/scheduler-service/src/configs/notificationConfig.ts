/**
 * @fileoverview 通知系統配置
 * 
 * 包含：
 * - Email 和 Webhook 的配置設定
 * - 通知規則和觸發條件
 * - 通知模板定義
 * - 預設配置參數
 */

import {
  NotificationServiceConfig,
  NotificationRule,
  NotificationTemplate,
  EmailNotificationConfig,
  WebhookNotificationConfig
} from '../types/NotificationTypes';

/**
 * Email 通知配置
 * 可透過環境變數覆蓋預設值
 */
export const emailConfig: EmailNotificationConfig = {
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || ''
  },
  from: {
    name: process.env.SMTP_FROM_NAME || 'AIOT 排程服務',
    email: process.env.SMTP_FROM_EMAIL || 'noreply@aiot.local'
  },
  defaultRecipients: process.env.NOTIFICATION_DEFAULT_EMAILS 
    ? process.env.NOTIFICATION_DEFAULT_EMAILS.split(',').map(email => email.trim())
    : ['admin@aiot.local'],
  enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED !== 'false'
};

/**
 * Webhook 通知配置
 */
export const webhookConfig: WebhookNotificationConfig = {
  url: process.env.WEBHOOK_URL || 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'AIOT-Scheduler/1.0'
  },
  timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '30000'),
  verifySSL: process.env.WEBHOOK_VERIFY_SSL !== 'false',
  retry: {
    attempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3'),
    delay: parseInt(process.env.WEBHOOK_RETRY_DELAY || '1000')
  },
  enabled: process.env.WEBHOOK_NOTIFICATIONS_ENABLED === 'true'
};

/**
 * 通知模板定義
 * 針對不同渠道和嚴重程度的模板
 */
export const notificationTemplates: NotificationTemplate[] = [
  // Email 模板
  {
    id: 'email-critical-alert',
    name: 'Email 緊急警報模板',
    channel: 'email',
    severity: 'critical',
    titleTemplate: '🚨 緊急警報: {{alertType}} 超過臨界值',
    contentTemplate: `系統檢測到緊急情況，需要立即處理：

警報類型：{{alertType}}
當前數值：{{value}}
安全閾值：{{threshold}}
發生時間：{{timestamp}}

警報訊息：{{message}}

請立即檢查系統狀態並採取必要的緊急措施。此警報表示系統可能處於不穩定狀態或即將發生故障。

建議處理步驟：
1. 檢查系統資源使用情況
2. 查看相關日誌檔案
3. 必要時重啟相關服務
4. 確認問題解決後標記警報為已解決`,
    variables: ['alertType', 'value', 'threshold', 'timestamp', 'message']
  },
  {
    id: 'email-warning-alert',
    name: 'Email 警告警報模板',
    channel: 'email',
    severity: 'warning',
    titleTemplate: '⚠️ 系統警告: {{alertType}} 接近閾值',
    contentTemplate: `系統監控發現潛在問題，建議關注：

警報類型：{{alertType}}
當前數值：{{value}}
警告閾值：{{threshold}}
發生時間：{{timestamp}}

警報訊息：{{message}}

雖然系統目前仍在正常運作範圍內，但建議採取預防措施以避免問題惡化。

建議處理步驟：
1. 監控相關指標變化趨勢
2. 檢查是否有異常活動
3. 考慮進行系統最佳化
4. 持續觀察直到數值回到正常範圍`,
    variables: ['alertType', 'value', 'threshold', 'timestamp', 'message']
  },
  {
    id: 'email-info-alert',
    name: 'Email 資訊通知模板',
    channel: 'email',
    severity: 'info',
    titleTemplate: 'ℹ️ 系統通知: {{alertType}}',
    contentTemplate: `系統狀態更新通知：

通知類型：{{alertType}}
相關數值：{{value}}
參考閾值：{{threshold}}
發生時間：{{timestamp}}

通知訊息：{{message}}

這是一般性的系統狀態通知，無需立即處理，僅供參考。`,
    variables: ['alertType', 'value', 'threshold', 'timestamp', 'message']
  },

  // Webhook 模板（適用於 Slack 等）
  {
    id: 'webhook-critical-alert',
    name: 'Webhook 緊急警報模板',
    channel: 'webhook',
    severity: 'critical',
    titleTemplate: '🚨 緊急警報: {{alertType}}',
    contentTemplate: `緊急警報 - 需要立即處理

**警報類型:** {{alertType}}
**當前值:** {{value}}
**閾值:** {{threshold}}
**時間:** {{timestamp}}

> {{message}}

請立即檢查系統狀態！`,
    variables: ['alertType', 'value', 'threshold', 'timestamp', 'message']
  },
  {
    id: 'webhook-warning-alert',
    name: 'Webhook 警告模板',
    channel: 'webhook',
    severity: 'warning',
    titleTemplate: '⚠️ 系統警告: {{alertType}}',
    contentTemplate: `系統警告通知

**警報類型:** {{alertType}}
**當前值:** {{value}}
**閾值:** {{threshold}}
**時間:** {{timestamp}}

> {{message}}

建議檢查並監控相關指標。`,
    variables: ['alertType', 'value', 'threshold', 'timestamp', 'message']
  },
  {
    id: 'webhook-resolved-alert',
    name: 'Webhook 警報解決模板',
    channel: 'webhook',
    severity: 'info',
    titleTemplate: '✅ 警報已解決: {{alertType}}',
    contentTemplate: `警報解決通知

**原始警報:** {{alertType}}
**解決時間:** {{timestamp}}

> {{message}}

系統已恢復正常狀態。`,
    variables: ['alertType', 'timestamp', 'message']
  }
];

/**
 * 通知規則定義
 * 定義何時發送何種通知
 */
export const notificationRules: NotificationRule[] = [
  {
    id: 'critical-alerts-immediate',
    name: '緊急警報立即通知',
    enabled: true,
    conditions: {
      alertTypes: ['cpu', 'memory', 'disk', 'task_failure'],
      severities: ['critical'],
      timeWindow: undefined // 24/7 通知
    },
    notifications: [
      {
        channel: 'email',
        recipients: [], // 使用預設收件人
        templateId: 'email-critical-alert',
        delay: 0 // 立即發送
      },
      {
        channel: 'webhook',
        recipients: [], // Webhook 不需要收件人
        templateId: 'webhook-critical-alert',
        delay: 0
      }
    ],
    cooldownPeriod: 300 // 5 分鐘冷卻期
  },
  {
    id: 'warning-alerts-business-hours',
    name: '警告警報工作時間通知',
    enabled: true,
    conditions: {
      alertTypes: ['cpu', 'memory', 'disk', 'task_failure'],
      severities: ['warning'],
      timeWindow: {
        start: '08:00',
        end: '18:00'
      }
    },
    notifications: [
      {
        channel: 'email',
        recipients: [],
        templateId: 'email-warning-alert',
        delay: 300 // 5 分鐘延遲
      },
      {
        channel: 'webhook',
        recipients: [],
        templateId: 'webhook-warning-alert',
        delay: 60 // 1 分鐘延遲
      }
    ],
    cooldownPeriod: 1800 // 30 分鐘冷卻期
  },
  {
    id: 'info-notifications',
    name: '資訊通知',
    enabled: false, // 預設停用資訊通知
    conditions: {
      alertTypes: [],
      severities: ['info']
    },
    notifications: [
      {
        channel: 'webhook',
        recipients: [],
        templateId: 'webhook-resolved-alert',
        delay: 0
      }
    ],
    cooldownPeriod: 3600 // 1 小時冷卻期
  },
  {
    id: 'task-failure-alerts',
    name: '任務失敗專用警報',
    enabled: true,
    conditions: {
      alertTypes: ['task_failure'],
      severities: ['warning', 'critical']
    },
    notifications: [
      {
        channel: 'email',
        recipients: ['devops@aiot.local'], // 專門發送給 DevOps 團隊
        templateId: 'email-warning-alert',
        delay: 0
      }
    ],
    cooldownPeriod: 600 // 10 分鐘冷卻期
  }
];

/**
 * 完整的通知服務配置
 */
export const notificationServiceConfig: NotificationServiceConfig = {
  email: emailConfig,
  webhook: webhookConfig,
  defaults: {
    maxRetries: parseInt(process.env.NOTIFICATION_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.NOTIFICATION_RETRY_DELAY || '5000'),
    timeout: parseInt(process.env.NOTIFICATION_TIMEOUT || '30000')
  },
  rules: notificationRules,
  templates: notificationTemplates
};

/**
 * 開發環境配置覆蓋
 * 在開發環境中使用不同的設定
 */
export const developmentOverrides: Partial<NotificationServiceConfig> = {
  email: {
    ...emailConfig,
    enabled: false, // 開發環境停用 Email
    defaultRecipients: ['dev@localhost']
  },
  webhook: {
    ...webhookConfig,
    enabled: true,
    url: 'https://httpbin.org/post' // 測試用 Webhook
  }
};

/**
 * 生產環境配置驗證
 * 確保生產環境具備必要的配置
 */
export const validateProductionConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // 檢查 Email 配置
  if (emailConfig.enabled) {
    if (!emailConfig.host || emailConfig.host === 'localhost') {
      errors.push('生產環境必須配置有效的 SMTP 主機');
    }
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      errors.push('生產環境必須配置 SMTP 認證資訊');
    }
    if (emailConfig.defaultRecipients.includes('admin@aiot.local')) {
      errors.push('生產環境必須配置真實的收件人郵箱');
    }
  }

  // 檢查 Webhook 配置
  if (webhookConfig.enabled) {
    if (webhookConfig.url.includes('YOUR/SLACK/WEBHOOK')) {
      errors.push('生產環境必須配置真實的 Webhook URL');
    }
  }

  // 至少要啟用一種通知方式
  if (!emailConfig.enabled && !webhookConfig.enabled) {
    errors.push('生產環境至少要啟用一種通知方式');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * 根據環境自動選擇配置
 */
export const getEnvironmentConfig = (): NotificationServiceConfig => {
  const baseConfig = notificationServiceConfig;
  
  if (process.env.NODE_ENV === 'development') {
    return {
      ...baseConfig,
      ...developmentOverrides
    };
  }
  
  if (process.env.NODE_ENV === 'production') {
    const validation = validateProductionConfig();
    if (!validation.valid) {
      console.warn('生產環境通知配置驗證失敗:', validation.errors);
    }
  }
  
  return baseConfig;
};