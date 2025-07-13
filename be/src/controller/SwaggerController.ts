import { Request, Response, Router, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
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
  public router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * 設置路由配置
   * 
   * 初始化所有Swagger相關的路由，包括JSON端點和UI介面。
   * 
   * @private
   * @returns {void}
   */
  private setupRoutes(): void {
    // API 端點返回 JSON spec
    this.router.get('/swagger.json', this.getSwaggerSpec);
    
    // 備用的 Swagger UI 路由
    this.router.use('/docs', swaggerUi.serve);
    this.router.get('/docs', swaggerUi.setup(specs));
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
  private getSwaggerSpec = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.send(specs);
    } catch (error) {
      next(error);
    }
  };
}