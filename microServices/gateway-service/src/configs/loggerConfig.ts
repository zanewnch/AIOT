/**
 * @fileoverview Winston 日誌配置 - Gateway 服務
 * @description 提供 Gateway Service 的日誌記錄功能，支援多種輸出格式和日誌級別
 * @author AIOT Development Team
 * @version 1.0.0
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

// 獲取當前檔案的目錄路徑
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 日誌輸出目錄
const logDir = path.join(__dirname, '../../../logs/gateway');

/**
 * 自訂日誌格式
 * @description 包含時間戳、級別、服務名稱和訊息
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }: any) => {
    let logMessage = `${timestamp} [${service || 'GATEWAY'}] ${level.toUpperCase()}: ${message}`;
    
    // 如果有額外的 metadata，將其附加到日誌中（處理循環引用）
    if (Object.keys(meta).length > 0) {
      try {
        logMessage += ` ${JSON.stringify(meta)}`;
      } catch (error) {
        logMessage += ` [Metadata contains circular reference]`;
      }
    }
    
    return logMessage;
  })
);

/**
 * 控制台輸出格式（含顏色）
 * @description 開發環境專用的彩色控制台輸出格式
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }: any) => {
    let logMessage = `${timestamp} [${service || 'GATEWAY'}] ${level}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      try {
        logMessage += ` ${JSON.stringify(meta, null, 2)}`;
      } catch (error) {
        logMessage += ` [Metadata contains circular reference]`;
      }
    }
    
    return logMessage;
  })
);

/**
 * 檔案輪轉傳輸配置 - 一般日誌
 */
const fileRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'gateway-app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: customFormat,
  level: 'info'
});

/**
 * 檔案輪轉傳輸配置 - 錯誤日誌
 */
const errorFileRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'gateway-error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: customFormat,
  level: 'error'
});

/**
 * 根據環境決定傳輸方式
 * @description 開發環境輸出到控制台，生產環境僅輸出到檔案
 * @returns Winston 傳輸配置陣列
 */
const getTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [
    fileRotateTransport,
    errorFileRotateTransport
  ];

  // 只在開發環境輸出到控制台
  if (process.env.NODE_ENV !== 'production') {
    transports.unshift(
      new winston.transports.Console({
        format: consoleFormat,
        level: 'debug'
      })
    );
  }

  return transports;
};

/**
 * 根據環境決定異常處理器
 * @description 配置未捕獲異常的處理方式
 * @returns Winston 異常處理器陣列
 */
const getExceptionHandlers = (): winston.transport[] => {
  const handlers: winston.transport[] = [
    new winston.transports.File({ 
      filename: path.join(logDir, 'gateway-exceptions.log'),
      format: customFormat 
    })
  ];

  // 開發環境也輸出到控制台
  if (process.env.NODE_ENV !== 'production') {
    handlers.push(
      new winston.transports.Console({
        format: consoleFormat
      })
    );
  }

  return handlers;
};

/**
 * 根據環境決定拒絕處理器
 * @description 配置未處理 Promise 拒絕的處理方式
 * @returns Winston 拒絕處理器陣列
 */
const getRejectionHandlers = (): winston.transport[] => {
  const handlers: winston.transport[] = [
    new winston.transports.File({ 
      filename: path.join(logDir, 'gateway-rejections.log'),
      format: customFormat 
    })
  ];

  // 開發環境也輸出到控制台
  if (process.env.NODE_ENV !== 'production') {
    handlers.push(
      new winston.transports.Console({
        format: consoleFormat
      })
    );
  }

  return handlers;
};

/**
 * 建立 Winston Logger 實例
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: customFormat,
  defaultMeta: { service: 'AIOT-GATEWAY' },
  transports: getTransports(),
  exceptionHandlers: getExceptionHandlers(),
  rejectionHandlers: getRejectionHandlers()
});

// 記錄啟動時的環境資訊
const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

logger.info('🚀 Gateway Winston Logger initialized', {
  environment: isProduction ? 'production' : 'development',
  logLevel,
  consoleOutput: !isProduction,
  fileOutput: true,
  logDirectory: logDir
});

/**
 * 創建子記錄器的工廠函數
 * @param service - 服務名稱
 * @returns 具有特定服務標籤的子記錄器
 */
export function createLogger(service: string): winston.Logger {
  return logger.child({ service: `GATEWAY-${service}` });
}

/**
 * 記錄代理請求的輔助函數
 * @param req - Express 請求物件
 * @param target - 目標微服務
 * @param message - 日誌訊息
 * @param level - 日誌級別
 */
export function logProxyRequest(req: any, target: string, message: string, level: string = 'info'): void {
  const meta = {
    method: req.method,
    url: req.url,
    target,
    ip: req.ip,
    userAgent: req.get ? req.get('user-agent') : req.headers?.['user-agent'],
    userId: req.user?.id
  };
  
  logger.log(level, message, meta);
}

/**
 * 記錄微服務健康檢查的輔助函數
 * @param serviceName - 微服務名稱
 * @param healthy - 健康狀態
 * @param responseTime - 回應時間（毫秒）
 * @param details - 額外詳情
 */
export function logServiceHealth(
  serviceName: string,
  healthy: boolean,
  responseTime?: number,
  details?: any
): void {
  const level = healthy ? 'info' : 'error';
  const message = `Service health check: ${serviceName} - ${healthy ? 'HEALTHY' : 'UNHEALTHY'}`;
  
  logger.log(level, message, {
    serviceName,
    healthy,
    responseTime,
    ...details
  });
}

/**
 * 記錄路由事件的輔助函數
 * @param route - 路由路徑
 * @param target - 目標服務
 * @param statusCode - HTTP 狀態碼
 * @param responseTime - 回應時間
 */
export function logRouteEvent(
  route: string,
  target: string,
  statusCode: number,
  responseTime: number
): void {
  const level = statusCode >= 400 ? 'warn' : 'info';
  const message = `Route ${route} → ${target} [${statusCode}] (${responseTime}ms)`;
  
  logger.log(level, message, {
    route,
    target,
    statusCode,
    responseTime
  });
}

/**
 * 匯出預設 logger 實例
 */
export const loggerConfig = logger;
export default logger;