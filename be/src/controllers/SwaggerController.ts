/**
 * @fileoverview Swagger API 文檔控制器
 * 負責處理 API 文檔相關的 HTTP 端點
 * 提供 OpenAPI 規格文件的存取功能，支援 Swagger UI 和其他文檔工具
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Request, Response, NextFunction } from 'express'; // 匯入 Express 的核心型別定義
import { specs } from '../configs/swaggerConfig.js'; // 匯入 Swagger 配置和規格定義
import { createLogger, logRequest } from '../configs/loggerConfig.js'; // 匯入日誌記錄器

// 創建控制器專用的日誌記錄器
const logger = createLogger('SwaggerController');

/**
 * Swagger API 文檔控制器
 * 
 * @class SwaggerController
 * @description 提供 API 文檔的存取功能，包括 JSON 格式的 OpenAPI 規格和交互式 UI 介面
 * 支援前端整合和獨立的文檔瀏覽功能
 * 
 * @example
 * ```typescript
 * // 使用方式（在路由中）
 * const swaggerController = new SwaggerController();
 * router.get('/swagger.json', swaggerController.getSwaggerSpec);
 * ```
 */
export class SwaggerController {
  /**
   * 初始化控制器實例
   * 
   * @constructor
   * @description 初始化 Swagger 文檔控制器
   * 控制器現在只負責業務邏輯，路由設定已移至 swaggerRoutes.ts
   */
  constructor() {
    // Controller 現在只負責業務邏輯，路由已移至 swaggerRoutes.ts
    // 此控制器專注於處理 API 文檔相關的 HTTP 請求和回應
  }


  /**
   * 獲取 OpenAPI 規格文件
   * 
   * @method getSwaggerSpec
   * @param {Request} _req - Express 請求物件（未使用）
   * @param {Response} res - Express 回應物件
   * @param {NextFunction} next - Express next 函數，用於錯誤處理
   * @returns {void} 無回傳值
   * 
   * @throws {500} 當規格文件讀取發生錯誤時
   * 
   * @description 返回 JSON 格式的 OpenAPI 3.0 規格，供前端 Swagger UI 或其他工具使用
   * 設定適當的 Content-Type 標頭以確保正確的 MIME 類型
   * 
   * @example
   * ```bash
   * GET /api/swagger.json
   * ```
   * 
   * @example 回應格式
   * ```json
   * {
   *   "openapi": "3.0.0",
   *   "info": {
   *     "title": "AIOT API",
   *     "version": "1.0.0"
   *   },
   *   "paths": {
   *     "/api/auth/login": { ... },
   *     "/api/rtk/data": { ... }
   *   }
   * }
   * ```
   */
  public getSwaggerSpec = (req: Request, res: Response, next: NextFunction): void => {
    try {
      logger.info('Serving OpenAPI specification document');
      logRequest(req, 'Swagger specification request', 'info');
      
      // 設定回應標頭為 JSON 格式
      res.setHeader('Content-Type', 'application/json');
      
      logger.debug('OpenAPI specification document prepared and sent successfully');
      // 回傳 OpenAPI 規格文件給客戶端
      res.send(specs);
    } catch (error) {
      logger.error('Error serving OpenAPI specification:', error);
      // 將例外處理委派給 Express 錯誤處理中間件
      next(error);
    }
  };
}