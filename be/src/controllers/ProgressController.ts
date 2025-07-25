/**
 * @fileoverview 進度追蹤控制器
 * 負責處理進度查詢和即時進度串流的 HTTP 端點
 * 提供 REST API 和 Server-Sent Events (SSE) 功能
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Request, Response, NextFunction } from 'express'; // 匯入 Express 的核心型別定義
import { progressService } from '../services/ProgressService.js'; // 匯入進度服務處理邏輯
import { createLogger, logRequest } from '../configs/loggerConfig.js'; // 匯入日誌記錄器
import { ControllerResult } from '../utils/ControllerResult.js'; // 匯入控制器結果類別

// 創建控制器專用的日誌記錄器
const logger = createLogger('ProgressController');

/**
 * 進度追蹤控制器
 * 
 * @class ProgressController
 * @description 處理所有進度追蹤相關的端點
 * 提供通用的進度查詢和即時進度串流功能
 * 
 * @example
 * ```typescript
 * // 使用方式（在路由中）
 * router.get('/progress/:taskId', progressController.getProgress);
 * router.get('/progress/:taskId/stream', progressController.getProgressStream);
 * ```
 */
export class ProgressController {
  /**
   * 建構函式
   * 
   * @constructor
   * @description 初始化進度追蹤控制器
   * 控制器現在只負責業務邏輯，路由設定已移至 progressRoutes.ts
   */
  constructor() {
    // Controller 現在只負責業務邏輯，路由已移至 progressRoutes.ts
    // 此控制器專注於處理進度相關的 HTTP 請求和回應
  }

  /**
   * 取得指定任務的進度資訊
   * 
   * @method getProgress
   * @param {Request} req - Express request物件，包含taskId參數
   * @param {Response} res - Express response物件
   * @param {NextFunction} next - Express next函數，用於錯誤處理
   * @returns {Promise<void>} 無回傳值的 Promise
   * 
   * @throws {400} 當 taskId 參數缺失時
   * @throws {404} 當任務不存在時
   * @throws {500} 當伺服器發生錯誤時
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
  public getProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 從 URL 參數中解構取得任務 ID
      const { taskId } = req.params;
      
      logger.debug(`Retrieving progress information for task: ${taskId}`);
      logRequest(req, `Progress query for task: ${taskId}`, 'debug');
      
      // 驗證任務 ID 是否存在
      if (!taskId) {
        logger.warn('Progress request missing required task ID parameter');
        // 回傳 400 錯誤，表示請求參數不完整
        const response = ControllerResult.badRequest('Task ID is required');
        res.status(response.status).json(response.toJSON());
        return;
      }
      
      // 呼叫進度服務來取得任務進度資訊
      const progress = progressService.getProgress(taskId);
      
      // 檢查任務是否存在
      if (!progress) {
        logger.warn(`Progress request for non-existent task: ${taskId}`);
        // 回傳 404 錯誤，表示任務不存在
        const response = ControllerResult.notFound('Task not found');
        res.status(response.status).json(response.toJSON());
        return;
      }
      
      logger.debug(`Successfully retrieved progress for task: ${taskId}, Status: ${progress.status}, Percentage: ${progress.percentage}%`);
      // 回傳進度資訊給客戶端
      const response = ControllerResult.success('Progress retrieved successfully', progress);
      res.status(response.status).json(response.toJSON());
    } catch (err) {
      logger.error('Error retrieving task progress:', err);
      // 將例外處理委派給 Express 錯誤處理中間件
      next(err);
    }
  }

  /**
   * 取得指定任務的即時進度串流
   * 使用 Server-Sent Events (SSE) 提供即時更新
   * 
   * @method getProgressStream
   * @param {Request} req - Express request物件，包含taskId參數
   * @param {Response} res - Express response物件，用於SSE連線
   * @param {NextFunction} next - Express next函數，用於錯誤處理
   * @returns {Promise<void>} 無回傳值的 Promise
   * 
   * @throws {400} 當 taskId 參數缺失時
   * @throws {404} 當任務不存在時
   * @throws {500} 當 SSE 連線建立失敗時
   * 
   * @example
   * ```bash
   * GET /api/progress/12345678-1234-1234-1234-123456789012/stream
   * Accept: text/event-stream
   * ```
   * 
   * @example SSE 事件格式
   * ```
   * event: progress
   * data: {"type":"progress","timestamp":1234567890,"data":{"taskId":"...","percentage":25,...}}
   * 
   * event: completed
   * data: {"type":"completed","timestamp":1234567890,"data":{"taskId":"...","percentage":100,...}}
   * ```
   */
  public getProgressStream = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 從 URL 參數中解構取得任務 ID
      const { taskId } = req.params;
      
      logger.info(`Initializing SSE progress stream for task: ${taskId}, Client IP: ${req.ip}`);
      logRequest(req, `SSE progress stream request for task: ${taskId}`, 'info');
      
      // 驗證任務 ID 是否存在
      if (!taskId) {
        logger.warn('SSE progress stream request missing required task ID parameter');
        // 回傳 400 錯誤，表示請求參數不完整
        const response = ControllerResult.badRequest('Task ID is required');
        res.status(response.status).json(response.toJSON());
        return;
      }
      
      // 檢查任務是否存在於進度服務中
      const progress = progressService.getProgress(taskId);
      if (!progress) {
        logger.warn(`SSE progress stream request for non-existent task: ${taskId}`);
        // 回傳 404 錯誤，表示任務不存在
        const response = ControllerResult.notFound('Task not found');
        res.status(response.status).json(response.toJSON());
        return;
      }
      
      // 建立 Server-Sent Events 連線
      const success = progressService.createSSEConnection(taskId, res);
      if (!success) {
        logger.error(`Failed to establish SSE connection for task: ${taskId}`);
        // 回傳 500 錯誤，表示 SSE 連線建立失敗
        const response = ControllerResult.internalError('Failed to create SSE connection');
        res.status(response.status).json(response.toJSON());
        return;
      }
      
      logger.info(`SSE progress stream established successfully for task: ${taskId}`);
      // 連線已由 ProgressService 管理，這裡不需要額外處理
      // SSE 連線會持續開放，直到客戶端斷線或任務完成
      
    } catch (err) {
      logger.error('Error establishing SSE progress stream:', err);
      // 將例外處理委派給 Express 錯誤處理中間件
      next(err);
    }
  }
}

/**
 * 進度追蹤控制器實例
 * 
 * @constant {ProgressController} progressController
 * @description 匯出進度追蹤控制器的單例實例
 * 供路由模組使用，避免重複實例化
 */
export const progressController = new ProgressController();