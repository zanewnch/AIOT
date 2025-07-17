import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { progressService } from '../service/ProgressService.js';
import { TaskStatus } from '../types/ProgressTypes.js';

/**
 * @fileoverview 背景任務處理工具模組
 *
 * 此模組提供了一套完整的背景任務處理解決方案，包括：
 * - 自動任務 ID 生成
 * - 進度追蹤整合
 * - 錯誤處理
 * - 統一的回應格式
 * - 支援參數傳遞
 * - 裝飾器模式支援
 *
 * @module Utils/BackgroundTask
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 *
 * @example
 * ```typescript
 * // 基本使用
 * import { createBackgroundTaskHandler } from '../utils/backgroundTask.js';
 *
 * const myTaskHandler = createBackgroundTaskHandler(
 *   {
 *     totalWork: 1000,
 *     initialMessage: '正在處理...',
 *     taskName: 'MyTask'
 *   },
 *   async (taskId) => {
 *     // 任務邏輯
 *   }
 * );
 * ```
 */

/**
 * 背景任務配置選項介面
 *
 * 定義背景任務的基本配置參數，用於初始化進度追蹤和回應格式。
 *
 * @interface BackgroundTaskOptions
 * @category Utils
 * @group Background Task
 */
export interface BackgroundTaskOptions {
  /**
   * 任務的總工作量（用於進度計算）
   *
   * 這個值用於計算任務執行的百分比進度，應該反映任務的總體規模。
   * 例如：要處理 1000 筆資料，則設定為 1000。
   *
   * @example
   * ```typescript
   * {
   *   totalWork: 5000, // 處理 5000 筆資料
   * }
   * ```
   */
  totalWork: number;

  /**
   * 任務的初始訊息
   *
   * 在任務開始時顯示給用戶的初始狀態訊息。
   * 應該清楚描述即將執行的操作。
   *
   * @example
   * ```typescript
   * {
   *   initialMessage: '正在初始化資料匯入...'
   * }
   * ```
   */
  initialMessage: string;

  /**
   * 任務的名稱（用於日誌和識別）
   *
   * 用於內部日誌記錄和錯誤追蹤，應該使用簡潔的英文名稱。
   * 建議使用 PascalCase 命名規則。
   *
   * @example
   * ```typescript
   * {
   *   taskName: 'DataImport'
   * }
   * ```
   */
  taskName: string;

  /**
   * 是否在回應中包含進度 URL
   *
   * 當設為 true 時，API 回應會包含 progressUrl 欄位，
   * 客戶端可以使用此 URL 來追蹤任務進度。
   *
   * @default true
   *
   * @example
   * ```typescript
   * {
   *   includeProgressUrl: false // 不包含進度 URL
   * }
   * ```
   */
  includeProgressUrl?: boolean;

  /**
   * 自定義回應數據
   *
   * 允許在 API 回應中包含額外的自定義資料。
   * 這些資料會與標準回應欄位合併。
   *
   * @example
   * ```typescript
   * {
   *   responseData: {
   *     fileName: 'data.csv',
   *     estimatedDuration: '5 minutes'
   *   }
   * }
   * ```
   */
  responseData?: Record<string, any>;
}

/**
 * 背景任務執行函數的類型定義
 *
 * 定義背景任務執行函數的標準介面。此函數接收一個任務 ID，
 * 並負責執行實際的背景任務邏輯。
 *
 * @param taskId - 任務的唯一識別碼，由系統自動生成的 UUID
 * @returns Promise<void> - 任務執行的 Promise，完成時不返回值
 *
 * @example
 * ```typescript
 * const myExecutor: BackgroundTaskExecutor = async (taskId: string) => {
 *   const callback = progressService.createProgressCallback(taskId);
 *
 *   // 執行任務邏輯
 *   for (let i = 0; i < 100; i++) {
 *     callback({
 *       percentage: i,
 *       message: `處理第 ${i} 項...`
 *     });
 *     await processItem(i);
 *   }
 *
 *   progressService.completeTask(taskId, { result: 'success' }, '任務完成');
 * };
 * ```
 *
 * @category Utils
 * @group Background Task
 */
export type BackgroundTaskExecutor = (taskId: string) => Promise<void>;


/**
 * 創建支援自定義參數的背景任務處理器
 *
 * 進階版的背景任務處理器，支援從 HTTP 請求中提取參數並傳遞給任務執行函數。
 * 這個版本特別適合需要根據用戶輸入動態調整任務參數的場景。
 *
 * ### 核心特色
 * - ✨ **動態配置**: 根據請求參數動態調整任務配置
 * - ✨ **參數提取**: 自動從 body、query、params 中提取參數
 * - ✨ **類型安全**: 支援泛型參數類型定義
 * - ✨ **彈性配置**: 支援静態和動態配置方式
 *
 * ### 參數提取順序
 * 1. `req.body` - 請求主體參數
 * 2. `req.query` - URL 查詢參數
 * 3. `req.params` - 路由參數
 *
 * 後面的參數會覆蓋前面同名的參數。
 *
 * @template T - 參數物件的類型，預設為 any
 * @param options - 背景任務配置選項，可以是静態物件或動態函數
 * @param executor - 實際執行任務的函數，接收 taskId 和請求參數
 * @returns Express 路由處理函數
 *
 * @example
 * ### 基本使用（動態配置）
 * ```typescript
 * public importData = backgroundTaskHandler<{
 *   fileName: string;
 *   recordCount?: number;
 *   options?: ImportOptions;
 * }>(
 *   (params) => ({
 *     totalWork: params.recordCount || 1000,
 *     initialMessage: `正在匯入 ${params.fileName}...`,
 *     taskName: 'DataImport',
 *     responseData: {
 *       fileName: params.fileName,
 *       estimatedRecords: params.recordCount
 *     }
 *   }),
 *   async (taskId, params) => {
 *     await this.executeDataImport(taskId, params.fileName, params.options);
 *   }
 * );
 * ```
 *
 * @example
 * ### 静態配置版本
 * ```typescript
 * public processFile = backgroundTaskHandler<{ filePath: string }>(
 *   {
 *     totalWork: 5000,
 *     initialMessage: '正在處理檔案...',
 *     taskName: 'FileProcessing'
 *   },
 *   async (taskId, params) => {
 *     await this.processFileAtPath(taskId, params.filePath);
 *   }
 * );
 * ```
 *
 * @example
 * ### API 請求範例
 * ```bash
 * # POST 請求
 * curl -X POST /api/import \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "fileName": "customers.csv",
 *     "recordCount": 50000,
 *     "options": { "skipValidation": false }
 *   }'
 * ```
 *
 * @category Utils
 * @group Background Task
 * @since 1.0.0
 * @public
 */
export const backgroundTaskHandler = <T = any>(
  options: BackgroundTaskOptions | ((params: T) => BackgroundTaskOptions),
  executor: (taskId: string, params: T) => Promise<void>
): (req: Request, res: Response, next: NextFunction) => Promise<void> => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 從請求中提取參數（可以是 body、query 或 params）
      const params = {
        ...req.body,
        ...req.query,
        ...req.params
      } as T;

      // 解析選項（如果是函數則調用）
      const resolvedOptions = typeof options === 'function' ? options(params) : options;

      // 生成唯一任務 ID
      const taskId = uuidv4();

      // 建立進度追蹤任務
      progressService.createTask(taskId, resolvedOptions.totalWork, resolvedOptions.initialMessage);

      // 準備回應數據
      const responsePayload = {
        ok: true,
        taskId,
        status: TaskStatus.STARTED,
        message: 'Background task initiated',
        ...(resolvedOptions.includeProgressUrl !== false && { progressUrl: `/api/progress/${taskId}` }),
        ...resolvedOptions.responseData
      };

      // 立即回應，任務在背景執行
      res.json(responsePayload);

      // 在背景執行實際任務
      executor(taskId, params).catch(error => {
        console.error(`Background task [${resolvedOptions.taskName}] failed:`, error);
        progressService.failTask(taskId, error.message || 'Unknown error occurred');
      });

    } catch (err) {
      next(err);
    }
  };
};


/**
 * @namespace BackgroundTask
 * @description
 * 背景任務處理工具模組提供了完整的背景任務解決方案。
 *
 * ### 設計理念
 *
 * 本模組遵循以下設計原則：
 *
 * 1. **關注點分離**: 將業務邏輯與任務管理邏輯分離
 * 2. **統一介面**: 所有背景任務使用相同的處理模式
 * 3. **類型安全**: 完整的 TypeScript 類型支援
 * 4. **錯誤處理**: 自動的錯誤捕獲和記錄
 * 5. **進度追蹤**: 內建的進度追蹤系統整合
 *
 * ### 選擇指南
 *
 * | 使用場景 | 推薦方案 | 特點 |
 * |---------|----------|------|
 * | 簡單任務，無參數 | `createBackgroundTaskHandler` | 輕量、易用 |
 * | 需要動態參數 | `backgroundTaskHandler` | 彈性、強大 |
 *
 * ### 最佳實踐
 *
 * #### 1. 進度報告
 * ```typescript
 * const callback = progressService.createProgressCallback(taskId);
 *
 * for (let i = 0; i < total; i++) {
 *   // 定期更新進度
 *   if (i % 100 === 0) {
 *     callback({
 *       percentage: (i / total) * 100,
 *       message: `處理進度: ${i}/${total}`
 *     });
 *   }
 * }
 * ```
 *
 * #### 2. 錯誤處理
 * ```typescript
 * try {
 *   await doSomething();
 * } catch (error) {
 *   progressService.failTask(taskId, error.message);
 *   throw error; // 重新拋出讓系統記錄
 * }
 * ```
 *
 * #### 3. 任務完成
 * ```typescript
 * progressService.completeTask(taskId, {
 *   processedItems: count,
 *   duration: Date.now() - startTime
 * }, '任務執行完成');
 * ```
 *
 * ### 效能考量
 *
 * - **批次處理**: 對於大量資料，使用批次處理避免記憶體問題
 * - **進度頻率**: 不要過於頻繁地更新進度，建議每處理 100-1000 項目更新一次
 * - **資源管理**: 注意清理資源，避免記憶體洩漏
 *
 * ### 相關模組
 *
 * - {@link ProgressService} - 進度追蹤服務
 * - {@link ProgressTypes} - 進度相關類型定義
 * - {@link ProgressController} - 進度查詢 API
 *
 * @see {@link https://docs.example.com/background-tasks} 完整文檔
 * @version 1.0.0
 * @since 2024-01-01
 */