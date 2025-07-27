/**
 * @fileoverview 進度追蹤服務介面
 * 
 * 定義進度追蹤服務的標準介面，用於管理長時間執行任務的進度追蹤。
 * 此介面確保服務層的實作具有一致性和可測試性。
 * 
 * 主要功能：
 * - 任務建立和進度管理的標準方法定義
 * - SSE (Server-Sent Events) 即時推送支援
 * - 進度計算和預估完成時間功能
 * - 多任務並發管理
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
 */

import { Response } from 'express';
import { ProgressInfo, ProgressCallback, StageWeights } from '../ProgressTypes.js';

/**
 * 進度追蹤服務介面
 * 
 * 定義進度追蹤服務的標準方法，包含任務建立、進度更新、
 * SSE 連線管理和狀態查詢功能。
 */
export interface IProgressService {
    /**
     * 建立新任務並開始追蹤
     * 
     * @param taskId 任務唯一識別碼
     * @param total 總工作量
     * @param message 初始訊息（預設：'任務已啟動'）
     * @returns 初始化的進度資訊
     * 
     * @example
     * ```typescript
     * const progressService = new ProgressService();
     * const task = progressService.createTask('task-123', 1000, '開始處理資料');
     * console.log(`任務 ${task.taskId} 已建立，進度: ${task.percentage}%`);
     * ```
     */
    createTask(taskId: string, total: number, message?: string): ProgressInfo;

    /**
     * 更新任務進度
     * 
     * @param taskId 任務識別碼
     * @param updates 進度更新資料
     * 
     * @example
     * ```typescript
     * progressService.updateProgress('task-123', {
     *   current: 500,
     *   message: '處理中...',
     *   stage: TaskStage.PROCESSING
     * });
     * ```
     */
    updateProgress(
        taskId: string,
        updates: Partial<Pick<ProgressInfo, 'current' | 'stage' | 'message' | 'status'>>
    ): void;

    /**
     * 標記任務完成
     * 
     * @param taskId 任務識別碼
     * @param result 任務結果（可選）
     * @param message 完成訊息（預設：'任務已完成'）
     * 
     * @example
     * ```typescript
     * progressService.completeTask('task-123', { processedItems: 1000 }, '處理完成');
     * ```
     */
    completeTask(taskId: string, result?: any, message?: string): void;

    /**
     * 標記任務失敗
     * 
     * @param taskId 任務識別碼
     * @param error 錯誤訊息
     * 
     * @example
     * ```typescript
     * progressService.failTask('task-123', '處理過程中發生錯誤');
     * ```
     */
    failTask(taskId: string, error: string): void;

    /**
     * 取得任務進度資訊
     * 
     * @param taskId 任務識別碼
     * @returns 進度資訊或 undefined（如果任務不存在）
     * 
     * @example
     * ```typescript
     * const progress = progressService.getProgress('task-123');
     * if (progress) {
     *   console.log(`任務進度: ${progress.percentage}%`);
     * }
     * ```
     */
    getProgress(taskId: string): ProgressInfo | undefined;

    /**
     * 建立 SSE 連線
     * 
     * @param taskId 任務識別碼
     * @param response Express Response 物件
     * @returns 是否成功建立連線
     * 
     * @example
     * ```typescript
     * // 在控制器中使用
     * const success = progressService.createSSEConnection(taskId, res);
     * if (!success) {
     *   res.status(404).json({ error: 'Task not found' });
     * }
     * ```
     */
    createSSEConnection(taskId: string, response: Response): boolean;

    /**
     * 建立進度回調函數
     * 
     * @param taskId 任務識別碼
     * @returns 進度回調函數，用於外部服務更新進度
     * 
     * @example
     * ```typescript
     * const callback = progressService.createProgressCallback('task-123');
     * 
     * // 在其他服務中使用
     * await someService.processData(callback);
     * ```
     */
    createProgressCallback(taskId: string): ProgressCallback;
}