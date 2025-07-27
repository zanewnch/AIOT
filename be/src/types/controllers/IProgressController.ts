/**
 * @fileoverview 進度追蹤控制器介面
 * 
 * 定義進度追蹤控制器的標準介面，用於處理進度查詢和即時進度串流的 HTTP 端點。
 * 此介面確保控制器層的實作具有一致性和可測試性。
 * 
 * 主要功能：
 * - 進度查詢 API 端點的標準方法定義
 * - Server-Sent Events (SSE) 即時進度串流
 * - HTTP 請求和回應處理
 * - 錯誤處理和狀態碼管理
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 進度追蹤控制器介面
 * 
 * 定義進度追蹤控制器的標準方法，包含 REST API 和
 * Server-Sent Events (SSE) 功能的處理。
 */
export interface IProgressController {
    /**
     * 取得指定任務的進度資訊
     * 
     * @param req Express request 物件，包含 taskId 參數
     * @param res Express response 物件
     * @param next Express next 函數，用於錯誤處理
     * @returns 無回傳值的 Promise
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
     * @example 成功回應格式
     * ```json
     * {
     *   "success": true,
     *   "message": "Progress retrieved successfully",
     *   "data": {
     *     "taskId": "12345678-1234-1234-1234-123456789012",
     *     "percentage": 75,
     *     "message": "Processing data...",
     *     "status": "running",
     *     "startTime": "2024-01-01T00:00:00.000Z",
     *     "current": 750,
     *     "total": 1000
     *   }
     * }
     * ```
     */
    getProgress(req: Request, res: Response, next: NextFunction): Promise<void>;

    /**
     * 取得指定任務的即時進度串流
     * 使用 Server-Sent Events (SSE) 提供即時更新
     * 
     * @param req Express request 物件，包含 taskId 參數
     * @param res Express response 物件，用於 SSE 連線
     * @param next Express next 函數，用於錯誤處理
     * @returns 無回傳值的 Promise
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
     * 
     * event: error
     * data: {"type":"error","timestamp":1234567890,"data":{"taskId":"...","error":"..."}}
     * ```
     * 
     * @remarks
     * 此方法建立一個持續的 SSE 連線，客戶端將收到即時的進度更新。
     * 連線會在以下情況下關閉：
     * - 任務完成
     * - 任務失敗
     * - 客戶端主動斷線
     * - 連線超時或發生錯誤
     */
    getProgressStream(req: Request, res: Response, next: NextFunction): Promise<void>;
}