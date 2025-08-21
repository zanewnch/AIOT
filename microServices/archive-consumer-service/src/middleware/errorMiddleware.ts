/**
 * @fileoverview 錯誤處理中間件
 * 
 * 【設計意圖】
 * 統一處理應用程式中的未捕獲錯誤，提供一致的錯誤回應格式
 * 
 * 【功能】
 * - 捕獲所有未處理的錯誤
 * - 記錄錯誤詳細資訊
 * - 根據環境返回適當的錯誤資訊
 * - 防止錯誤洩露敏感資訊
 */

import { Express, Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { config } from '../configs/environment';

export function setupErrorMiddleware(app: Express, logger: Logger): void {
  
  /**
   * 全域錯誤處理中間件
   * 
   * 【錯誤處理策略】
   * - 記錄完整的錯誤資訊用於調試
   * - 開發環境：返回詳細錯誤訊息
   * - 生產環境：返回通用錯誤訊息，避免洩露系統資訊
   * - 避免重複發送回應標頭
   */
  app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled HTTP error', {
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url
    });

    // 如果回應標頭已經發送，委託給預設的 Express 錯誤處理器
    if (res.headersSent) {
      return next(error);
    }

    // 根據環境決定錯誤訊息的詳細程度
    const errorMessage = config.service.nodeEnv === 'development' 
      ? error.message 
      : 'Something went wrong';

    res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  });
}