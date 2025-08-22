/**
 * @fileoverview 通知系統類型定義
 * 
 * 定義通知系統的核心介面、類型和配置
 * 支援多種通知渠道：Email、Webhook、SMS 等
 */

/**
 * 通知嚴重程度等級
 * 用於決定通知的優先級和發送策略
 */
export type NotificationSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * 通知渠道類型
 * 支援的通知發送方式
 */
export type NotificationChannel = 'email' | 'webhook' | 'sms' | 'slack';

/**
 * 通知狀態
 * 追蹤通知的發送狀態
 */
export type NotificationStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'retry';

/**
 * 基礎通知訊息介面
 * 所有通知的核心資料結構
 */
export interface NotificationMessage {
  /** 通知唯一識別碼 */
  id: string;
  
  /** 通知標題 */
  title: string;
  
  /** 通知內容 */
  content: string;
  
  /** 嚴重程度 */
  severity: NotificationSeverity;
  
  /** 通知渠道 */
  channel: NotificationChannel;
  
  /** 收件人資訊 */
  recipients: string[];
  
  /** 通知狀態 */
  status: NotificationStatus;
  
  /** 建立時間 */
  createdAt: Date;
  
  /** 最後更新時間 */
  updatedAt: Date;
  
  /** 重試次數 */
  retryCount: number;
  
  /** 最大重試次數 */
  maxRetries: number;
  
  /** 附加資料 */
  metadata?: Record<string, any>;
  
  /** 相關的警報 ID */
  alertId?: string;
  
  /** 發送錯誤訊息 */
  error?: string;
}

/**
 * Email 通知配置
 */
export interface EmailNotificationConfig {
  /** SMTP 伺服器主機 */
  host: string;
  
  /** SMTP 端口 */
  port: number;
  
  /** 是否使用 TLS */
  secure: boolean;
  
  /** 認證資訊 */
  auth: {
    user: string;
    pass: string;
  };
  
  /** 發件人資訊 */
  from: {
    name: string;
    email: string;
  };
  
  /** 預設收件人 */
  defaultRecipients: string[];
  
  /** 是否啟用 */
  enabled: boolean;
}

/**
 * Webhook 通知配置
 */
export interface WebhookNotificationConfig {
  /** Webhook URL */
  url: string;
  
  /** HTTP 方法 */
  method: 'POST' | 'PUT';
  
  /** 請求標頭 */
  headers: Record<string, string>;
  
  /** 超時時間（毫秒） */
  timeout: number;
  
  /** 是否驗證 SSL 憑證 */
  verifySSL: boolean;
  
  /** 重試配置 */
  retry: {
    attempts: number;
    delay: number;
  };
  
  /** 是否啟用 */
  enabled: boolean;
}

/**
 * 通知模板介面
 * 用於格式化不同類型的通知內容
 */
export interface NotificationTemplate {
  /** 模板 ID */
  id: string;
  
  /** 模板名稱 */
  name: string;
  
  /** 適用的通知渠道 */
  channel: NotificationChannel;
  
  /** 適用的嚴重程度 */
  severity: NotificationSeverity;
  
  /** 標題模板 */
  titleTemplate: string;
  
  /** 內容模板 */
  contentTemplate: string;
  
  /** 模板變數 */
  variables: string[];
}

/**
 * 通知規則介面
 * 定義何時發送通知以及發送給誰
 */
export interface NotificationRule {
  /** 規則 ID */
  id: string;
  
  /** 規則名稱 */
  name: string;
  
  /** 是否啟用 */
  enabled: boolean;
  
  /** 觸發條件 */
  conditions: {
    /** 警報類型 */
    alertTypes: string[];
    
    /** 嚴重程度 */
    severities: NotificationSeverity[];
    
    /** 時間範圍限制 */
    timeWindow?: {
      start: string; // HH:mm 格式
      end: string;   // HH:mm 格式
    };
  };
  
  /** 通知配置 */
  notifications: {
    /** 通知渠道 */
    channel: NotificationChannel;
    
    /** 收件人 */
    recipients: string[];
    
    /** 模板 ID */
    templateId: string;
    
    /** 延遲發送（秒） */
    delay?: number;
  }[];
  
  /** 冷卻期（秒） */
  cooldownPeriod: number;
}

/**
 * 通知提供者介面
 * 所有通知渠道的統一介面
 */
export interface NotificationProvider {
  /** 提供者名稱 */
  name: string;
  
  /** 支援的通知渠道 */
  channel: NotificationChannel;
  
  /** 是否已初始化 */
  isInitialized: boolean;
  
  /**
   * 初始化提供者
   */
  initialize(): Promise<void>;
  
  /**
   * 發送通知
   * @param message 通知訊息
   * @returns 發送結果
   */
  send(message: NotificationMessage): Promise<NotificationSendResult>;
  
  /**
   * 驗證配置
   * @returns 驗證結果
   */
  validateConfig(): Promise<boolean>;
  
  /**
   * 清理資源
   */
  cleanup(): Promise<void>;
}

/**
 * 通知發送結果
 */
export interface NotificationSendResult {
  /** 是否成功 */
  success: boolean;
  
  /** 訊息 ID */
  messageId?: string;
  
  /** 錯誤訊息 */
  error?: string;
  
  /** 發送時間 */
  sentAt: Date;
  
  /** 回應資料 */
  response?: any;
}

/**
 * 通知服務配置
 */
export interface NotificationServiceConfig {
  /** Email 配置 */
  email: EmailNotificationConfig;
  
  /** Webhook 配置 */
  webhook: WebhookNotificationConfig;
  
  /** 預設設定 */
  defaults: {
    maxRetries: number;
    retryDelay: number;
    timeout: number;
  };
  
  /** 通知規則 */
  rules: NotificationRule[];
  
  /** 通知模板 */
  templates: NotificationTemplate[];
}

/**
 * 通知統計資料
 */
export interface NotificationStats {
  /** 總通知數 */
  total: number;
  
  /** 成功發送數 */
  sent: number;
  
  /** 失敗數 */
  failed: number;
  
  /** 待發送數 */
  pending: number;
  
  /** 按渠道分組的統計 */
  byChannel: Record<NotificationChannel, {
    sent: number;
    failed: number;
    pending: number;
  }>;
  
  /** 按嚴重程度分組的統計 */
  bySeverity: Record<NotificationSeverity, {
    sent: number;
    failed: number;
    pending: number;
  }>;
  
  /** 統計時間範圍 */
  timeRange: {
    start: Date;
    end: Date;
  };
}