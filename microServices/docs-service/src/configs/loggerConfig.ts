/**
 * @fileoverview Winston 日誌配置 - Docs Service
 * 
 * 提供 Docs Service 的日誌記錄功能，支援多種輸出格式和日誌級別。
 * 包含檔案輪轉、彩色輸出和錯誤追蹤等功能。
 * 
 * 環境配置策略：
 * - 開發環境 (NODE_ENV !== 'production'): 輸出到控制台 + 日誌檔案，級別 debug
 * - 生產環境 (NODE_ENV === 'production'): 僅輸出到日誌檔案，級別 info
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-13
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

// 獲取當前檔案的目錄路徑
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 日誌輸出目錄
const logDir = path.join(__dirname, '../../../logs/docs');

/**
 * 自訂日誌格式
 * 包含時間戳、級別、服務名稱和訊息
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }: any) => {
    let logMessage = `${timestamp} [${service || 'DOCS'}] ${level.toUpperCase()}: ${message}`;
    
    // 如果有額外的 metadata，將其附加到日誌中
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

/**
 * 控制台輸出格式（含顏色）
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }: any) => {
    let logMessage = `${timestamp} [${service || 'DOCS'}] ${level}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

/**
 * 檔案輪轉傳輸配置 - 一般日誌
 */
const fileRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'docs-app-%DATE%.log'),
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
  filename: path.join(logDir, 'docs-error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: customFormat,
  level: 'error'
});

/**
 * 根據環境決定傳輸方式
 */
const getTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [
    // 檔案輸出 - 所有環境都需要
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
 */
const getExceptionHandlers = (): winston.transport[] => {
  const handlers: winston.transport[] = [
    new winston.transports.File({ 
      filename: path.join(logDir, 'docs-exceptions.log'),
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
 */
const getRejectionHandlers = (): winston.transport[] => {
  const handlers: winston.transport[] = [
    new winston.transports.File({ 
      filename: path.join(logDir, 'docs-rejections.log'),
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
  defaultMeta: { service: 'AIOT-DOCS' },
  transports: getTransports(),
  // 處理未捕獲的異常
  exceptionHandlers: getExceptionHandlers(),
  // 處理未捕獲的 Promise 拒絕
  rejectionHandlers: getRejectionHandlers()
});

// 記錄啟動時的環境資訊
const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

logger.info('🚀 DOCS Winston Logger initialized', {
  environment: isProduction ? 'production' : 'development',
  logLevel,
  consoleOutput: !isProduction,
  fileOutput: true,
  logDirectory: logDir
});

/**
 * 創建子記錄器的工廠函數
 * 
 * @param service - 服務名稱
 * @returns 具有特定服務標籤的子記錄器
 */
export function createLogger(service: string): winston.Logger {
  return logger.child({ service: `DOCS-${service}` });
}

/**
 * 記錄 HTTP 請求的輔助函數
 * 
 * @param req - Express 請求物件
 * @param message - 日誌訊息
 * @param level - 日誌級別
 */
export function logRequest(req: any, message: string, level: string = 'info'): void {
  const meta = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get ? req.get('user-agent') : req.headers?.['user-agent'],
    userId: req.user?.id
  };
  
  logger.log(level, message, meta);
}

/**
 * 記錄文檔存取的輔助函數
 * 
 * @param docType - 文檔類型
 * @param docPath - 文檔路徑
 * @param userAgent - 用戶代理
 */
export function logDocumentAccess(
  docType: string,
  docPath: string,
  userAgent?: string
): void {
  logger.info('Documentation access', {
    documentType: docType,
    documentPath: docPath,
    userAgent,
    timestamp: new Date().toISOString()
  });
}

/**
 * 記錄服務發現的輔助函數
 * 
 * @param service - 服務名稱
 * @param action - 操作類型
 * @param details - 額外詳情
 */
export function logServiceDiscovery(
  service: string,
  action: 'discover' | 'list' | 'health_check',
  details?: any
): void {
  const level = action === 'health_check' ? 'debug' : 'info';
  const message = `Service discovery: ${action} for ${service}`;
  
  logger.log(level, message, {
    service,
    action,
    ...details
  });
}

/**
 * 匯出預設 logger 實例
 */
export default logger;