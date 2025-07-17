import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { SwaggerController } from '../controller/SwaggerController.js';
import { specs } from '../configs/swaggerConfig.js';
import { ErrorHandleMiddleware } from '../middleware/errorHandleMiddleware.js';

/**
 * Swagger API 文檔相關路由配置
 * 
 * 提供 OpenAPI 規格文件和交互式 Swagger UI 介面的路由設定。
 * 支援 JSON 格式的規格文件下載和完整的 API 文檔瀏覽功能。
 * 
 * @module Routes
 */

const router = Router();
const swaggerController = new SwaggerController();

/**
 * GET /api/swagger.json
 * -------------------------------------------------
 * 獲取 OpenAPI 規格文件（JSON 格式）
 * 
 * 返回完整的 OpenAPI 3.0 規格文件，供前端 Swagger UI、
 * Postman 或其他 API 工具使用。
 * 
 * @example
 * ```bash
 * GET /api/swagger.json
 * Accept: application/json
 * ```
 * 
 * @example 回應格式
 * ```json
 * {
 *   "openapi": "3.0.0",
 *   "info": {
 *     "title": "AIOT API",
 *     "version": "1.0.0",
 *     "description": "AIOT 系統 API 文檔"
 *   },
 *   "paths": {
 *     "/api/auth/login": { ... },
 *     "/api/rtk/data": { ... }
 *   },
 *   "components": { ... }
 * }
 * ```
 */
router.get('/api/swagger.json', 
  swaggerController.getSwaggerSpec
);

/**
 * GET /api/docs
 * -------------------------------------------------
 * Swagger UI 交互式文檔介面
 * 
 * 提供完整的 Swagger UI 介面，允許用戶瀏覽 API 文檔、
 * 測試 API 端點、查看請求/回應範例等。
 * 
 * 功能特色：
 * - 交互式 API 測試
 * - 請求/回應範例
 * - 參數說明和驗證
 * - 認證配置支援
 * 
 * @example
 * ```bash
 * # 瀏覽器訪問
 * http://localhost:3000/api/docs
 * ```
 * 
 * 使用方式：
 * 1. 在瀏覽器中打開 /api/docs
 * 2. 瀏覽可用的 API 端點
 * 3. 點擊 "Try it out" 測試 API
 * 4. 輸入參數並執行請求
 * 5. 查看回應結果
 */

// Swagger UI 靜態檔案服務
router.use('/api/docs', swaggerUi.serve);

// Swagger UI 介面設定
router.get('/api/docs', swaggerUi.setup(specs, {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true
  },
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AIOT API Documentation'
}));

export { router as swaggerRoutes };