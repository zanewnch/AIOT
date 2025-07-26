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
import { ErrorHandleMiddleware } from '../middlewares/errorHandleMiddleware.js';

/**
 * Swagger 路由類別
 * 
 * 負責配置和管理所有 Swagger API 文檔相關的路由端點
 */
class SwaggerRoutes {
  private router: Router;
  private swaggerController: SwaggerController;

  constructor() {
    this.router = Router();
    this.swaggerController = new SwaggerController();
    this.initializeRoutes();
  }

  /**
   * 初始化所有 Swagger 路由
   */
  private initializeRoutes(): void {
    this.setupSwaggerSpecRoute();
    this.setupSwaggerUIRoutes();
  }

  /**
   * 設定 Swagger 規格文件路由
   * 
   * 此端點提供完整的 OpenAPI 3.0 規格文件，以 JSON 格式返回。
   * 該文件包含所有 API 端點的詳細定義，包括請求/回應格式、
   * 參數說明、認證方式等，供第三方工具（如 Postman、前端 Swagger UI）使用。
   * 
   * @route GET /api/swagger.json
   * @group Swagger - API 文檔相關端點
   * @returns {Object} 200 - OpenAPI 規格文件 (JSON 格式)
   * @returns {Object} 500 - 伺服器錯誤
   */
  private setupSwaggerSpecRoute(): void {
    this.router.get('/api/swagger.json', 
      this.swaggerController.getSwaggerSpec
    );
  }

  /**
   * 設定 Swagger UI 路由
   * 
   * 此端點提供完整的 Swagger UI 介面，允許用戶瀏覽 API 文檔、
   * 測試 API 端點、查看請求/回應範例等。提供直觀的網頁介面
   * 供開發人員和使用者互動式地探索 API。
   * 
   * 功能特色：
   * - 交互式 API 測試
   * - 請求/回應範例展示
   * - 參數說明和驗證
   * - 認證配置支援
   * - 即時請求執行
   * 
   * @route GET /api/docs
   * @group Swagger - API 文檔相關端點
   * @returns {text/html} 200 - Swagger UI 網頁介面
   */
  private setupSwaggerUIRoutes(): void {
    this.router.use('/api/docs', swaggerUi.serve);
    
    this.router.get('/api/docs', swaggerUi.setup(specs, {
      explorer: true,
      swaggerOptions: {
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true
      },
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'AIOT API Documentation'
    }));
  }

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