/**
 * @fileoverview 日誌記錄中間件
 * 
 * 【設計意圖】
 * 記錄所有 HTTP 請求的詳細資訊，用於監控、調試和分析
 * 
 * 【記錄資訊】
 * - HTTP 方法和路徑
 * - 回應狀態碼
 * - 請求處理時間
 * - 用戶代理和 IP 地址
 */

import { Express, Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';

export function setupLoggingMiddleware(app: Express, logger: Logger): void {
  
  /**
   * 請求日誌中間件
   * 
   * 【功能】
   * - 記錄每個 HTTP 請求的詳細資訊
   * - 計算請求處理時間
   * - 結構化日誌格式便於分析
   * - 包含用戶代理和 IP 資訊用於安全監控
   */
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    });

    next();
  });
}