import { Request, Response, NextFunction } from 'express';
import { specs } from '../configs/swaggerConfig.js';

/**
 * Swagger文檔控制器
 * 
 * 提供API文檔的存取功能，包括JSON格式的OpenAPI規格和交互式UI介面。
 * 支援前端整合和獨立的文檔瀏覽。
 * 
 * @module Controllers
 * @example
 * ```typescript
 * const swaggerController = new SwaggerController();
 * app.use('/api/', swaggerController.router);
 * ```
 */
export class SwaggerController {
  constructor() {
    // Controller 現在只負責業務邏輯，路由已移至 swaggerRoutes.ts
  }


  /**
   * 獲取OpenAPI規格文件
   * 
   * 返回JSON格式的OpenAPI 3.0規格，供前端Swagger UI或其他工具使用。
   * 
   * @param _req - Express請求物件（未使用）
   * @param res - Express回應物件
   * @returns void
   * 
   * @example
   * ```bash
   * GET /api/swagger.json
   * ```
   * 
   * 回應格式:
   * ```json
   * {
   *   "openapi": "3.0.0",
   *   "info": { ... },
   *   "paths": { ... }
   * }
   * ```
   */
  public getSwaggerSpec = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.send(specs);
    } catch (error) {
      next(error);
    }
  };
}