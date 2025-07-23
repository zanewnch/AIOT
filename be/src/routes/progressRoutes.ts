/**
 * @fileoverview 進度追蹤路由配置
 * 
 * 此文件定義了進度追蹤相關的路由端點，包括：
 * - 任務進度查詢
 * - 即時進度串流 (Server-Sent Events)
 * - 進度狀態監控
 * 
 * 這些路由提供完整的任務進度追蹤功能，支援即時更新和
 * 長時間運行任務的進度監控。所有端點都需要 JWT 認證。
 * 
 * @module Routes/ProgressRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express'; // 引入 Express 路由器模組
import { ProgressController } from '../controllers/ProgressController.js'; // 引入進度控制器
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js'; // 引入認證中間件
import { ErrorHandleMiddleware } from '../middlewares/errorHandleMiddleware.js'; // 引入錯誤處理中間件

/**
 * 創建 Express 路由器實例
 * 用於定義進度追蹤相關的路由端點
 */
const router = Router();

/**
 * 創建進度控制器實例
 * 處理進度追蹤相關的業務邏輯
 */
const progressController = new ProgressController();

/**
 * 創建認證中間件實例
 * 處理 JWT 認證驗證
 */
const authMiddleware = new AuthMiddleware();

/**
 * 取得指定任務的當前進度
 * 
 * 此端點用於查詢指定任務的當前執行進度，包括完成百分比、
 * 狀態訊息、執行步驟等詳細資訊。需要 JWT 認證才能訪問。
 * 
 * @route GET /api/progress/:taskId
 * @param {string} taskId - 任務唯一識別碼 (UUID 格式)
 * @group Progress - 進度追蹤相關端點
 * @security JWT - 需要有效的 JWT 認證令牌
 * @returns {Object} 200 - 任務進度資訊
 * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
 * @returns {Object} 404 - 任務不存在
 * @returns {Object} 500 - 伺服器錯誤
 * 
 * @example
 * GET /api/progress/12345678-1234-1234-1234-123456789012
 * Authorization: Bearer <JWT_TOKEN>
 * 
 * Response:
 * {
 *   "taskId": "12345678-1234-1234-1234-123456789012",
 *   "percentage": 75,
 *   "message": "Processing data...",
 *   "status": "processing",
 *   "startTime": "2024-01-01T00:00:00.000Z",
 *   "currentStep": 3,
 *   "totalSteps": 4
 * }
 */
router.get('/:taskId', 
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  progressController.getProgress // 執行進度查詢
);

/**
 * 取得指定任務的即時進度串流
 * 
 * 此端點使用 Server-Sent Events (SSE) 提供即時進度更新。
 * 客戶端可以持續監聽任務的進度變化，支援 'progress' 和 'completed' 事件。
 * 適用於長時間運行的任務，提供即時的進度反饋。
 * 
 * @route GET /api/progress/:taskId/stream
 * @param {string} taskId - 任務唯一識別碼 (UUID 格式)
 * @group Progress - 進度追蹤相關端點
 * @security JWT - 需要有效的 JWT 認證令牌
 * @returns {text/event-stream} 200 - SSE 即時進度串流
 * @returns {Object} 401 - 未授權 (無效的 JWT 令牌)
 * @returns {Object} 404 - 任務不存在
 * @returns {Object} 500 - 伺服器錯誤
 * 
 * @example
 * GET /api/progress/12345678-1234-1234-1234-123456789012/stream
 * Accept: text/event-stream
 * Authorization: Bearer <JWT_TOKEN>
 * 
 * SSE 事件格式:
 * event: progress
 * data: {"type":"progress","timestamp":1234567890,"data":{"taskId":"...","percentage":25,...}}
 * 
 * event: completed
 * data: {"type":"completed","timestamp":1234567890,"data":{"taskId":"...","percentage":100,...}}
 */
router.get('/:taskId/stream', 
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  progressController.getProgressStream // 執行即時進度串流
);

/**
 * 匯出進度追蹤路由模組
 * 
 * 將配置好的路由器匯出，供主應用程式使用。
 * 此路由器包含所有進度追蹤相關的端點。
 */
export { router as progressRoutes };