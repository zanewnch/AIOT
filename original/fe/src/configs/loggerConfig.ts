/**
 * @fileoverview 前端 Logger 配置
 * 
 * 提供前端應用程式的日誌記錄功能，支援多種輸出格式和日誌級別。
 * 適配瀏覽器環境，包含控制台輸出、本地存儲和遠程日誌發送功能。
 * 
 * 環境配置策略：
 * - 開發環境 (NODE_ENV !== 'production'): 詳細日誌到控制台，級別 debug
 * - 生產環境 (NODE_ENV === 'production'): 精簡日誌，可選遠程發送，級別 warn
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import log from 'loglevel';

/**
 * 日誌級別類型
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent';

/**
 * 日誌配置介面
 */
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableLocalStorage: boolean;
  enableRemoteLogging: boolean;
  remoteEndpoint?: string;
  maxLocalStorageSize: number;
}

/**
 * 擴展的日誌介面
 */
interface ExtendedLogger {
  trace: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  setLevel: (level: LogLevel) => void;
}

/**
 * 日誌項目結構
 */
interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  message: string;
  data?: any;
  url?: string;
  userAgent?: string;
  userId?: string | number;
}

/**
 * 環境檢測
 */
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

/**
 * 預設配置
 */
const defaultConfig: LoggerConfig = {
  level: isProduction ? 'warn' : 'debug',
  enableConsole: true,
  enableLocalStorage: isDevelopment, // 只在開發環境啟用本地存儲
  enableRemoteLogging: isProduction, // 只在生產環境啟用遠程日誌
  remoteEndpoint: '/api/logs', // 遠程日誌端點
  maxLocalStorageSize: 1000 // 最大本地存儲條目數
};

/**
 * 格式化時間戳
 */
const formatTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * 獲取當前頁面資訊
 */
const getCurrentPageInfo = () => {
  return {
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: formatTimestamp()
  };
};

/**
 * 本地存儲管理
 */
class LocalStorageManager {
  private readonly STORAGE_KEY = 'aiot-frontend-logs';
  private readonly maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  /**
   * 添加日誌到本地存儲
   */
  addLog(entry: LogEntry): void {
    try {
      const logs = this.getLogs();
      logs.push(entry);

      // 保持最大數量限制
      if (logs.length > this.maxSize) {
        logs.splice(0, logs.length - this.maxSize);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to save log to localStorage:', error);
    }
  }

  /**
   * 獲取本地存儲的日誌
   */
  getLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to read logs from localStorage:', error);
      return [];
    }
  }

  /**
   * 清除本地日誌
   */
  clearLogs(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear logs from localStorage:', error);
    }
  }

  /**
   * 獲取日誌統計
   */
  getLogStats(): { total: number; byLevel: Record<string, number> } {
    const logs = this.getLogs();
    const byLevel: Record<string, number> = {};
    
    logs.forEach(log => {
      byLevel[log.level] = (byLevel[log.level] || 0) + 1;
    });

    return { total: logs.length, byLevel };
  }
}

/**
 * 遠程日誌發送器
 */
class RemoteLogger {
  private readonly endpoint: string;
  private queue: LogEntry[] = [];
  private sending = false;

  constructor(endpoint: string = '/api/logs') {
    this.endpoint = endpoint;
    
    // 定期發送日誌
    setInterval(() => this.flushLogs(), 30000); // 每30秒發送一次
    
    // 頁面卸載時發送剩餘日誌
    window.addEventListener('beforeunload', () => this.flushLogs());
  }

  /**
   * 添加日誌到發送佇列
   */
  addLog(entry: LogEntry): void {
    this.queue.push(entry);
    
    // 如果是錯誤級別，立即發送
    if (entry.level === 'error') {
      this.flushLogs();
    }
  }

  /**
   * 發送所有待發送的日誌
   */
  private async flushLogs(): Promise<void> {
    if (this.sending || this.queue.length === 0) {
      return;
    }

    this.sending = true;
    const logsToSend = [...this.queue];
    this.queue = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToSend }),
      });
    } catch (error) {
      // 發送失敗，重新加入佇列
      this.queue.unshift(...logsToSend);
      console.warn('Failed to send logs to remote endpoint:', error);
    } finally {
      this.sending = false;
    }
  }
}

/**
 * Logger 工廠類別
 */
class LoggerFactory {
  private config: LoggerConfig;
  private localStorageManager?: LocalStorageManager;
  private remoteLogger?: RemoteLogger;
  private loggers: Map<string, ExtendedLogger> = new Map();

  constructor(config: LoggerConfig = defaultConfig) {
    this.config = config;
    
    // 初始化本地存儲管理器
    if (config.enableLocalStorage) {
      this.localStorageManager = new LocalStorageManager(config.maxLocalStorageSize);
    }
    
    // 初始化遠程日誌發送器
    if (config.enableRemoteLogging && config.remoteEndpoint) {
      this.remoteLogger = new RemoteLogger(config.remoteEndpoint);
    }

    // 設置全域日誌級別
    log.setLevel(config.level as any);

    this.logInitialization();
  }

  /**
   * 記錄初始化資訊
   */
  private logInitialization(): void {
    const initInfo = {
      environment: isProduction ? 'production' : 'development',
      logLevel: this.config.level,
      consoleOutput: this.config.enableConsole,
      localStorageEnabled: this.config.enableLocalStorage,
      remoteLoggingEnabled: this.config.enableRemoteLogging,
      ...getCurrentPageInfo()
    };

    console.info('🚀 Frontend Logger initialized', initInfo);
  }

  /**
   * 創建帶有服務標籤的日誌器
   */
  createLogger(serviceName: string): ExtendedLogger {
    if (this.loggers.has(serviceName)) {
      return this.loggers.get(serviceName)!;
    }

    const logger = this.createServiceLogger(serviceName);
    this.loggers.set(serviceName, logger);
    return logger;
  }

  /**
   * 創建具體的服務日誌器
   */
  private createServiceLogger(serviceName: string): ExtendedLogger {
    const createLogMethod = (level: string) => {
      return (message: string, ...args: any[]) => {
        const entry: LogEntry = {
          level,
          service: serviceName,
          message,
          data: args.length > 0 ? args : undefined,
          ...getCurrentPageInfo()
        };

        // 控制台輸出
        if (this.config.enableConsole) {
          const originalMethod = (log as any)[level] || log.info;
          originalMethod(`[${serviceName}] ${message}`, ...args);
        }

        // 本地存儲
        if (this.localStorageManager) {
          this.localStorageManager.addLog(entry);
        }

        // 遠程發送
        if (this.remoteLogger) {
          this.remoteLogger.addLog(entry);
        }
      };
    };

    return {
      trace: createLogMethod('trace'),
      debug: createLogMethod('debug'),
      info: createLogMethod('info'),
      warn: createLogMethod('warn'),
      error: createLogMethod('error'),
      setLevel: (level: LogLevel) => log.setLevel(level as any)
    };
  }

  /**
   * 獲取本地日誌
   */
  getLocalLogs(): LogEntry[] {
    return this.localStorageManager?.getLogs() || [];
  }

  /**
   * 清除本地日誌
   */
  clearLocalLogs(): void {
    this.localStorageManager?.clearLogs();
  }

  /**
   * 獲取日誌統計
   */
  getLogStats(): { total: number; byLevel: Record<string, number> } {
    return this.localStorageManager?.getLogStats() || { total: 0, byLevel: {} };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    log.setLevel(this.config.level as any);
  }
}

// 創建全域 Logger 工廠實例
const loggerFactory = new LoggerFactory(defaultConfig);

/**
 * 創建服務專用的日誌記錄器
 */
export const createLogger = (serviceName: string): ExtendedLogger => {
  return loggerFactory.createLogger(serviceName);
};


/**
 * 導出工具函數
 */
export const LoggerUtils = {
  getLocalLogs: () => loggerFactory.getLocalLogs(),
  clearLocalLogs: () => loggerFactory.clearLocalLogs(),
  getLogStats: () => loggerFactory.getLogStats(),
  updateConfig: (config: Partial<LoggerConfig>) => loggerFactory.updateConfig(config)
};

/**
 * 匯出預設 logger 實例
 */
export default createLogger('App');