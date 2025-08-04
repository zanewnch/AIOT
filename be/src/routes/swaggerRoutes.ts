/**
 * @fileoverview Swagger API 文檔路由配置
 *
 * 此文件定義了 Swagger API 文檔相關的路由端點，包括：
 * - OpenAPI 規格文件提供 (JSON 格式)
 * - Swagger UI 交互式文檔介面
 * - API 文檔瀏覽和測試功能
 *
 * 這些路由提供完整的 API 文檔服務，支援開發人員和使用者
 * 瀏覽、測試和理解 API 介面。
 *
 * @module Routes/SwaggerRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { SwaggerController } from '../controllers/SwaggerController.js';
import { specs } from '../configs/swaggerConfig.js';
import { ErrorHandleMiddleware } from '../middlewares/ErrorHandleMiddleware.js';

/**
 * Swagger 路由類別
 *
 * 負責配置和管理所有 Swagger API 文檔相關的路由端點
 */
class SwaggerRoutes {
  private router: Router;
  private swaggerController: SwaggerController;

  // 路由端點常數 - 集中管理所有 API 路徑
  private readonly ROUTES = {
    SWAGGER_SPEC: '/api/swagger.json',
    SWAGGER_DOCS: '/api/docs'
  } as const;

  constructor() {
    this.router = Router();
    this.swaggerController = new SwaggerController();
    
    this.setupSwaggerSpecRoute();
    this.setupSwaggerUIRoutes();
  }

  /**
   * 設定 Swagger 規格文件路由
   */
  private setupSwaggerSpecRoute = (): void => {
    // GET /api/swagger.json - 取得 OpenAPI 規格文件
    this.router.get(this.ROUTES.SWAGGER_SPEC,
      (req, res) => this.swaggerController.getSwaggerSpec(req, res)
    );
  };

  /**
   * 設定 Swagger UI 路由
   */
  private setupSwaggerUIRoutes = (): void => {
    // 設定 Swagger UI 中間件
    this.router.use(this.ROUTES.SWAGGER_DOCS, swaggerUi.serve);

    // GET /api/docs - Swagger UI 網頁介面
    this.router.get(this.ROUTES.SWAGGER_DOCS, swaggerUi.setup(specs, {
      explorer: true,
      swaggerOptions: {
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true
      },
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'AIOT API Documentation'
    }));
  };

  /**
   * 取得路由器實例
   *
   * @returns {Router} Express 路由器實例
   */
  public getRouter(): Router {
    return this.router;
  }
}

/**
 * 匯出 Swagger 路由實例
 */
export const swaggerRoutes = new SwaggerRoutes().getRouter();