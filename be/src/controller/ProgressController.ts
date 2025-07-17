import { Request, Response, NextFunction, Router } from 'express';
import { progressService } from '../service/ProgressService.js';

/**
 * ProgressController
 * 處理所有進度追蹤相關的端點
 * 提供通用的進度查詢和即時進度串流功能
 */
export class ProgressController {
  public router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes = (): void => {
    /**
     * GET /api/progress/:taskId
     * 取得指定任務的當前進度
     */
    this.router.get('/:taskId', this.getProgress);

    /**
     * GET /api/progress/:taskId/stream
     * 取得指定任務的即時進度串流（SSE）
     */
    this.router.get('/:taskId/stream', this.getProgressStream);
  }
  /**
   * 取得指定任務的進度資訊
   * 
   * @param req - Express request物件，包含taskId參數
   * @param res - Express response物件
   * @param next - Express next函數
   * @returns Promise<void>
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
      const { taskId } = req.params;
      
      if (!taskId) {
        res.status(400).json({ error: 'Task ID is required' });
        return;
      }
      
      const progress = progressService.getProgress(taskId);
      
      if (!progress) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      
      res.json(progress);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 取得指定任務的即時進度串流
   * 使用 Server-Sent Events (SSE) 提供即時更新
   * 
   * @param req - Express request物件，包含taskId參數
   * @param res - Express response物件，用於SSE連線
   * @param next - Express next函數
   * @returns Promise<void>
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
  public getProgressStream = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { taskId } = req.params;
      
      if (!taskId) {
        res.status(400).json({ error: 'Task ID is required' });
        return;
      }
      
      // 檢查任務是否存在
      const progress = progressService.getProgress(taskId);
      if (!progress) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      
      // 建立 SSE 連線
      const success = progressService.createSSEConnection(taskId, res);
      if (!success) {
        res.status(500).json({ error: 'Failed to create SSE connection' });
        return;
      }
      
      // 連線已由 ProgressService 管理，這裡不需要額外處理
      
    } catch (err) {
      next(err);
    }
  }
}

export const progressController = new ProgressController();