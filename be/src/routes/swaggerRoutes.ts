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

import { Router } from 'express'; // 引入 Express 路由器模組
import swaggerUi from 'swagger-ui-express'; // 引入 Swagger UI Express 中間件
import { SwaggerController } from '../controllers/SwaggerController.js'; // 引入 Swagger 控制器
import { specs } from '../configs/swaggerConfig.js'; // 引入 Swagger 配置規格
import { ErrorHandleMiddleware } from '../middlewares/errorHandleMiddleware.js'; // 引入錯誤處理中間件

/**
 * 創建 Express 路由器實例
 * 用於定義 Swagger API 文檔相關的路由端點
 */
const router = Router();

/**
 * 創建 Swagger 控制器實例
 * 處理 Swagger API 文檔相關的業務邏輯
 */
const swaggerController = new SwaggerController();

/**
 * 獲取 OpenAPI 規格文件
 * 
 * 此端點提供完整的 OpenAPI 3.0 規格文件，以 JSON 格式返回。
 * 該文件包含所有 API 端點的詳細定義，包括請求/回應格式、
 * 參數說明、認證方式等，供第三方工具（如 Postman、前端 Swagger UI）使用。
 * 
 * @route GET /api/swagger.json
 * @group Swagger - API 文檔相關端點
 * @returns {Object} 200 - OpenAPI 規格文件 (JSON 格式)
 * @returns {Object} 500 - 伺服器錯誤
 * 
 * @example
 * GET /api/swagger.json
 * Accept: application/json
 * 
 * Response:
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
 */
router.get('/api/swagger.json', 
  swaggerController.getSwaggerSpec // 執行 Swagger 規格文件獲取
);

/**
 * Swagger UI 交互式文檔介面
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
 * 
 * @example
 * # 瀏覽器訪問
 * http://localhost:3000/api/docs
 * 
 * 使用方式：
 * 1. 在瀏覽器中打開 /api/docs
 * 2. 瀏覽可用的 API 端點
 * 3. 點擊 "Try it out" 測試 API
 * 4. 輸入參數並執行請求
 * 5. 查看回應結果
 */

/**
 * 配置 Swagger UI 靜態檔案服務
 * 提供 Swagger UI 所需的 CSS、JS 和其他靜態資源檔案
 */
router.use('/api/docs', swaggerUi.serve);

/**
 * 配置 Swagger UI 介面設定
 * 設定 Swagger UI 的外觀、功能和行為選項
 */
router.get('/api/docs', swaggerUi.setup(specs, {
  explorer: true, // 啟用 API 探索功能
  swaggerOptions: {
    docExpansion: 'none', // 預設不展開文檔結構
    filter: true, // 啟用搜尋過濾功能
    showRequestDuration: true // 顯示請求執行時間
  },
  customCss: '.swagger-ui .topbar { display: none }', // 隱藏 Swagger UI 頂部欄
  customSiteTitle: 'AIOT API Documentation' // 自定義網頁標題
}));

/**
 * 匯出 Swagger 路由模組
 * 
 * 將配置好的路由器匯出，供主應用程式使用。
 * 此路由器包含所有 Swagger API 文檔相關的端點。
 */
export { router as swaggerRoutes };