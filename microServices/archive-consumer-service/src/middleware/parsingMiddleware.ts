/**
 * @fileoverview 請求解析中間件
 * 
 * 【設計意圖】
 * 配置請求體解析中間件，支援 JSON 和 URL 編碼格式
 * 設置合理的大小限制防止濫用
 * 
 * 【功能】
 * - JSON 請求體解析
 * - URL 編碼表單解析
 * - 壓縮中間件
 * - 請求大小限制
 */

import express, { Express } from 'express';
import compression from 'compression';

export function setupParsingMiddleware(app: Express): void {
  
  /**
   * 壓縮回應中間件
   * 
   * 【功能】
   * - 自動壓縮回應內容
   * - 減少網路傳輸大小
   * - 提升回應速度
   */
  app.use(compression());

  /**
   * JSON 解析中間件
   * 
   * 【配置】
   * - 限制 JSON 請求體大小為 10MB
   * - 適用於監控數據上傳等場景
   */
  app.use(express.json({ limit: '10mb' }));

  /**
   * URL 編碼解析中間件
   * 
   * 【配置】
   * - 支援表單數據解析
   * - 啟用擴展模式解析複雜對象
   * - 限制請求體大小為 10MB
   */
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
}