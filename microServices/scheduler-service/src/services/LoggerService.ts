/**
 * @fileoverview 日誌服務類別
 * 
 * 提供統一的日誌記錄功能，支援不同級別和格式的日誌輸出
 */

import winston from 'winston';
import path from 'path';

export interface LoggerConfig {
  level?: string;
  serviceName?: string;
  environment?: string;
  logDir?: string;
  enableConsole?: boolean;
  enableFile?: boolean;
  maxFiles?: number;
  maxSize?: string;
}

export class LoggerService {
  private logger: winston.Logger;

  constructor(config: LoggerConfig = {}) {
    const {
      level = 'info',
      serviceName = 'scheduler-service',
      environment = process.env.NODE_ENV || 'development',
      logDir = './logs',
      enableConsole = true,
      enableFile = true,
      maxFiles = 14,
      maxSize = '20m'
    } = config;

    // 定義日誌格式
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        const logEntry: any = {
          timestamp,
          level: level.toUpperCase(),
          service: service || serviceName,
          message,
          environment
        };

        // 添加額外的元數據
        if (Object.keys(meta).length > 0) {
          logEntry.meta = meta;
        }

        return JSON.stringify(logEntry);
      })
    );

    // 創建傳輸器陣列
    const transports: winston.transport[] = [];

    // 控制台輸出
    if (enableConsole) {
      transports.push(
        new winston.transports.Console({
          level,
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({
              format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
              let logMessage = `[${timestamp}] ${level}: [${service || serviceName}] ${message}`;
              
              // 如果有額外的元數據，格式化顯示
              if (Object.keys(meta).length > 0) {
                const metaString = JSON.stringify(meta, null, 2);
                logMessage += `\n${metaString}`;
              }
              
              return logMessage;
            })
          )
        })
      );
    }

    // 文件輸出
    if (enableFile) {
      // 一般日誌文件
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, `${serviceName}.log`),
          level,
          format: logFormat,
          maxsize: maxSize,
          maxFiles,
          tailable: true
        })
      );

      // 錯誤日誌文件
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, `${serviceName}-error.log`),
          level: 'error',
          format: logFormat,
          maxsize: maxSize,
          maxFiles,
          tailable: true
        })
      );

      // 僅在生產環境啟用 HTTP 請求日誌
      if (environment === 'production') {
        transports.push(
          new winston.transports.File({
            filename: path.join(logDir, `${serviceName}-access.log`),
            level: 'http',
            format: logFormat,
            maxsize: maxSize,
            maxFiles,
            tailable: true
          })
        );
      }
    }

    // 創建 winston logger 實例
    this.logger = winston.createLogger({
      level,
      format: logFormat,
      defaultMeta: {
        service: serviceName,
        environment
      },
      transports,
      // 異常處理
      exceptionHandlers: enableFile ? [
        new winston.transports.File({
          filename: path.join(logDir, `${serviceName}-exceptions.log`),
          format: logFormat,
          maxsize: maxSize,
          maxFiles
        })
      ] : [],
      // 未捕獲的拒絕處理
      rejectionHandlers: enableFile ? [
        new winston.transports.File({
          filename: path.join(logDir, `${serviceName}-rejections.log`),
          format: logFormat,
          maxsize: maxSize,
          maxFiles
        })
      ] : [],
      exitOnError: false
    });
  }

  /**
   * 取得 winston logger 實例
   */
  getLogger(): winston.Logger {
    return this.logger;
  }

  /**
   * 創建子記錄器
   */
  child(defaultMeta: object): winston.Logger {
    return this.logger.child(defaultMeta);
  }

  /**
   * Debug 等級日誌
   */
  debug(message: string, meta?: object): void {
    this.logger.debug(message, meta);
  }

  /**
   * Info 等級日誌
   */
  info(message: string, meta?: object): void {
    this.logger.info(message, meta);
  }

  /**
   * Warn 等級日誌
   */
  warn(message: string, meta?: object): void {
    this.logger.warn(message, meta);
  }

  /**
   * Error 等級日誌
   */
  error(message: string, meta?: object | Error): void {
    if (meta instanceof Error) {
      this.logger.error(message, {
        error: {
          message: meta.message,
          stack: meta.stack,
          name: meta.name
        }
      });
    } else {
      this.logger.error(message, meta);
    }
  }

  /**
   * HTTP 請求日誌
   */
  http(message: string, meta?: object): void {
    this.logger.http(message, meta);
  }

  /**
   * 記錄任務開始
   */
  taskStart(taskId: string, taskType: string, meta?: object): void {
    this.info('Task started', {
      taskId,
      taskType,
      status: 'started',
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  /**
   * 記錄任務完成
   */
  taskComplete(taskId: string, taskType: string, duration: number, meta?: object): void {
    this.info('Task completed', {
      taskId,
      taskType,
      status: 'completed',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  /**
   * 記錄任務失敗
   */
  taskFailed(taskId: string, taskType: string, error: Error, duration: number, meta?: object): void {
    this.error('Task failed', {
      taskId,
      taskType,
      status: 'failed',
      duration: `${duration}ms`,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  /**
   * 記錄任務進度
   */
  taskProgress(taskId: string, taskType: string, progress: number, total: number, meta?: object): void {
    this.info('Task progress', {
      taskId,
      taskType,
      status: 'progress',
      progress,
      total,
      percentage: total > 0 ? Math.round((progress / total) * 100) : 0,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  /**
   * 記錄資料庫操作
   */
  database(operation: string, tableName: string, affectedRows: number, duration: number, meta?: object): void {
    this.debug('Database operation', {
      operation,
      tableName,
      affectedRows,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  /**
   * 記錄 RabbitMQ 操作
   */
  rabbitmq(operation: 'publish' | 'consume' | 'ack' | 'nack', queue: string, messageId?: string, meta?: object): void {
    this.debug('RabbitMQ operation', {
      operation,
      queue,
      messageId,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  /**
   * 記錄系統性能
   */
  performance(metric: string, value: number, unit: string, meta?: object): void {
    this.info('Performance metric', {
      metric,
      value,
      unit,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  /**
   * 記錄安全事件
   */
  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', meta?: object): void {
    this.warn('Security event', {
      event,
      severity,
      category: 'security',
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  /**
   * 記錄業務事件
   */
  business(event: string, entity: string, entityId: string | number, meta?: object): void {
    this.info('Business event', {
      event,
      entity,
      entityId,
      category: 'business',
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  /**
   * 記錄健康檢查
   */
  health(component: string, status: 'healthy' | 'unhealthy' | 'degraded', meta?: object): void {
    const level = status === 'healthy' ? 'info' : 'warn';
    this.logger.log(level, 'Health check', {
      component,
      status,
      category: 'health',
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  /**
   * 記錄配置變更
   */
  config(action: 'loaded' | 'updated' | 'validated', configName: string, meta?: object): void {
    this.info('Configuration event', {
      action,
      configName,
      category: 'configuration',
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  /**
   * 添加結構化查詢
   */
  query(queryType: 'archive' | 'cleanup' | 'stats', query: string, duration: number, meta?: object): void {
    this.debug('Database query', {
      queryType,
      query: query.length > 200 ? query.substring(0, 200) + '...' : query,
      duration: `${duration}ms`,
      category: 'database',
      timestamp: new Date().toISOString(),
      ...meta
    });
  }
}