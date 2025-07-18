import { Router } from 'express';
import { ProgressController } from '../controller/ProgressController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { ErrorHandleMiddleware } from '../middleware/errorHandleMiddleware.js';

/**
 * 進度追蹤相關路由配置
 * 
 * 處理進度查詢和即時進度串流功能的路由設定。
 * 支援 RESTful API 和 Server-Sent Events (SSE) 即時更新。
 * 
 * @module Routes
 */

const router = Router();
const progressController = new ProgressController();
const authMiddleware = new AuthMiddleware();

/**
 * GET /api/progress/:taskId
 * 取得指定任務的當前進度
 * 
 * 中間件：
 * - jwtAuth.authenticate: JWT 驗證（需要登入才能查看進度）
 * 
 * @example
 * ```bash
 * GET /api/progress/12345678-1234-1234-1234-123456789012
 * ```
 * 
 * @example 回應格式
 * ```json
 * {
 *   "taskId": "12345678-1234-1234-1234-123456789012",
 *   "percentage": 75,
 *   "message": "Processing data...",
 *   "status": "processing",
 *   "startTime": "2024-01-01T00:00:00.000Z",
 *   "currentStep": 3,
 *   "totalSteps": 4
 * }
 * ```
 */
router.get('/:taskId', 
  authMiddleware.authenticate,
  progressController.getProgress
);

/**
 * GET /api/progress/:taskId/stream
 * 取得指定任務的即時進度串流（SSE）
 * 
 * 中間件：
 * - jwtAuth.authenticate: JWT 驗證（需要登入才能查看進度串流）
 * 
 * 使用 Server-Sent Events (SSE) 提供即時進度更新。
 * 客戶端可以監聽 'progress' 和 'completed' 事件。
 * 
 * @example
 * ```bash
 * GET /api/progress/12345678-1234-1234-1234-123456789012/stream
 * Accept: text/event-stream
 * ```
 * 
 * SSE 事件格式:
 * ```
 * event: progress
 * data: {"type":"progress","timestamp":1234567890,"data":{"taskId":"...","percentage":25,...}}
 * 
 * event: completed
 * data: {"type":"completed","timestamp":1234567890,"data":{"taskId":"...","percentage":100,...}}
 * ```
 */
router.get('/:taskId/stream', 
  authMiddleware.authenticate,
  progressController.getProgressStream
);

export { router as progressRoutes };