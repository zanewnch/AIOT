/**
 * @fileoverview 安全性中間件
 * 
 * 【設計意圖】
 * 提供基礎的安全性防護，包括 CORS、安全標頭、內容安全策略等
 * 
 * 【安全措施】
 * - Helmet: 設置安全 HTTP 標頭
 * - CORS: 跨域資源共享控制
 * - 內容安全策略: 防止 XSS 攻擊
 */

import cors from 'cors';
import helmet from 'helmet';
import { Express } from 'express';

export function setupSecurityMiddleware(app: Express): void {
  
  /**
   * 安全性標頭中間件
   * 
   * 【功能】
   * - 設置各種安全 HTTP 標頭
   * - 防止常見的網路攻擊
   * - 內容安全策略配置
   */
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  /**
   * CORS 中間件
   * 
   * 【配置說明】
   * - 允許的來源：從環境變數讀取或使用預設值
   * - 允許憑證：支援 cookies 和認證標頭
   * - 允許的 HTTP 方法：GET, POST, PUT, DELETE, OPTIONS
   * - 允許的標頭：Content-Type, Authorization, X-Requested-With
   */
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
}