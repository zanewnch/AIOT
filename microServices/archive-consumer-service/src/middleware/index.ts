/**
 * @fileoverview 中間件總匯出
 * 
 * 【設計意圖】
 * 統一管理所有中間件模組，提供單一入口點和正確的載入順序
 * 
 * 【中間件載入順序】
 * 1. Security: 安全性中間件（最先載入）
 * 2. Parsing: 請求解析中間件
 * 3. Logging: 日誌記錄中間件
 * 4. Error: 錯誤處理中間件（最後載入）
 */

import { Express } from 'express';
import { Logger } from 'winston';

import { setupSecurityMiddleware } from './securityMiddleware';
import { setupParsingMiddleware } from './parsingMiddleware';
import { setupLoggingMiddleware } from './loggingMiddleware';
import { setupErrorMiddleware } from './errorMiddleware';

/**
 * 設置所有中間件
 * 
 * 【載入順序重要性】
 * - 安全性中間件必須最先載入，保護所有後續請求
 * - 解析中間件在路由之前載入，確保請求體可用
 * - 日誌中間件記錄所有請求活動
 * - 錯誤處理中間件最後載入，捕獲所有未處理的錯誤
 * 
 * @param app Express 應用實例
 * @param logger Winston 日誌實例
 */
export function setupMiddleware(app: Express, logger: Logger): void {
  // 1. 安全性中間件（最高優先級）
  setupSecurityMiddleware(app);
  
  // 2. 請求解析中間件
  setupParsingMiddleware(app);
  
  // 3. 日誌記錄中間件
  setupLoggingMiddleware(app, logger);
  
  // 注意：錯誤處理中間件需要在路由之後載入
  // 所以不在這裡載入，而是在 server.ts 中路由載入後再載入
}

/**
 * 設置錯誤處理中間件
 * 
 * 【使用說明】
 * 此函數應該在所有路由載入之後調用
 * 確保能捕獲路由處理過程中的所有錯誤
 * 
 * @param app Express 應用實例
 * @param logger Winston 日誌實例
 */
export function setupErrorHandling(app: Express, logger: Logger): void {
  setupErrorMiddleware(app, logger);
}