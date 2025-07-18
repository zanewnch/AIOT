/**
 * @fileoverview SSE (Server-Sent Events) 服務模組
 * 
 * 提供 Server-Sent Events 連接管理和即時進度更新功能。
 * 支援任務進度追蹤、事件監聽和自動重連機制。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * 進度資訊介面
 * 
 * @interface ProgressInfo
 * @description 定義任務進度的詳細資訊結構
 */
export interface ProgressInfo {
  /** 任務 ID */
  taskId: string;
  /** 任務狀態 */
  status: 'started' | 'running' | 'completed' | 'failed' | 'cancelled';
  /** 當前階段 */
  stage: string;
  /** 完成百分比 */
  percentage: number;
  /** 當前進度 */
  current: number;
  /** 總數 */
  total: number;
  /** 進度訊息 */
  message: string;
  /** 開始時間 */
  startTime: string;
  /** 最後更新時間 */
  lastUpdated: string;
  /** 預估完成時間 (可選) */
  estimatedCompletion?: string;
  /** 錯誤訊息 (可選) */
  error?: string;
  /** 結果資料 (可選) */
  result?: any;
}

/**
 * 進度事件介面
 * 
 * @interface ProgressEvent
 * @description 定義 SSE 事件的資料結構
 */
export interface ProgressEvent {
  /** 事件類型 */
  type: 'progress' | 'completed' | 'error';
  /** 時間戳記 */
  timestamp: number;
  /** 進度資訊 */
  data: ProgressInfo;
}

/**
 * 進度回調函數類型
 * 
 * @typedef {Function} ProgressCallback
 * @param {ProgressEvent} event - 進度事件
 */
export type ProgressCallback = (event: ProgressEvent) => void;

/**
 * SSE 服務類別
 * 
 * @class SSEService
 * @description 提供 Server-Sent Events 連接管理和即時進度更新功能
 * @example
 * ```typescript
 * const sseService = new SSEService();
 * sseService.connectToTask('task-123', (event) => {
 *   console.log('進度更新:', event.data.percentage);
 * });
 * ```
 */
export class SSEService {
  /** EventSource 連接實例 */
  private eventSource: EventSource | null = null;
  /** 任務 ID 與回調函數的映射 */
  private callbacks: Map<string, ProgressCallback> = new Map();

  /**
   * 連接到指定任務的 SSE 端點
   * 
   * @method connectToTask
   * @param {string} taskId - 任務 ID
   * @param {ProgressCallback} callback - 進度回調函數
   * @description 建立與指定任務的 SSE 連接，監聽進度更新事件
   * @example
   * ```typescript
   * sseService.connectToTask('task-123', (event) => {
   *   if (event.type === 'progress') {
   *     console.log(`進度: ${event.data.percentage}%`);
   *   } else if (event.type === 'completed') {
   *     console.log('任務完成');
   *   }
   * });
   * ```
   */
  connectToTask(taskId: string, callback: ProgressCallback): void {
    // 關閉現有連接，避免重複連接
    this.disconnect();

    // 建立新的 SSE 連接
    const url = `http://localhost:8010/api/progress/${taskId}/stream`;
    this.eventSource = new EventSource(url);

    // 儲存回調函數以供後續使用
    this.callbacks.set(taskId, callback);

    // 監聽進度事件
    this.eventSource.addEventListener('progress', (event) => {
      try {
        // 解析進度事件資料
        const progressEvent: ProgressEvent = JSON.parse(event.data);
        callback(progressEvent); // 呼叫回調函數
      } catch (error) {
        // 記錄解析錯誤
        console.error('Failed to parse progress event:', error);
      }
    });

    // 監聽完成事件
    this.eventSource.addEventListener('completed', (event) => {
      try {
        // 解析完成事件資料
        const progressEvent: ProgressEvent = JSON.parse(event.data);
        callback(progressEvent); // 呼叫回調函數
        // 任務完成後自動斷開連接
        this.disconnect();
      } catch (error) {
        // 記錄解析錯誤
        console.error('Failed to parse completed event:', error);
      }
    });

    // 監聽錯誤事件
    this.eventSource.addEventListener('error', (event) => {
      console.error('SSE error:', event);
      
      // 嘗試解析錯誤訊息
      try {
        if (event.data) {
          const errorEvent: ProgressEvent = JSON.parse(event.data);
          callback(errorEvent); // 呼叫回調函數
        }
      } catch (parseError) {
        // 如果無法解析錯誤訊息，創建一個通用錯誤事件
        const errorEvent: ProgressEvent = {
          type: 'error',
          timestamp: Date.now(),
          data: {
            taskId,
            status: 'failed',
            stage: 'unknown',
            percentage: 0,
            current: 0,
            total: 0,
            message: 'SSE connection error',
            startTime: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            error: 'Connection failed'
          }
        };
        callback(errorEvent); // 呼叫回調函數
      }
      
      // 連接錯誤時自動斷開
      this.disconnect();
    });

    // 監聽連接打開事件
    this.eventSource.onopen = () => {
      console.log(`SSE connection opened for task ${taskId}`);
    };

    // 監聽連接錯誤事件
    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };
  }

  /**
   * 斷開 SSE 連接
   * 
   * @method disconnect
   * @description 關閉當前的 SSE 連接並清除所有回調函數
   * @example
   * ```typescript
   * sseService.disconnect();
   * ```
   */
  disconnect(): void {
    if (this.eventSource) {
      // 關閉 EventSource 連接
      this.eventSource.close();
      this.eventSource = null; // 清除引用
    }
    // 清除所有回調函數映射
    this.callbacks.clear();
  }

  /**
   * 檢查是否已連接
   * 
   * @method isConnected
   * @returns {boolean} 是否已連接
   * @description 檢查當前 SSE 連接狀態是否為打開狀態
   * @example
   * ```typescript
   * if (sseService.isConnected()) {
   *   console.log('SSE 連接已打開');
   * }
   * ```
   */
  isConnected(): boolean {
    // 檢查 EventSource 實例存在且連接狀態為 OPEN
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }

  /**
   * 獲取連接狀態
   * 
   * @method getConnectionState
   * @returns {number} 連接狀態碼
   * @description 獲取當前 SSE 連接的狀態碼
   * @example
   * ```typescript
   * const state = sseService.getConnectionState();
   * if (state === EventSource.OPEN) {
   *   console.log('連接已打開');
   * } else if (state === EventSource.CLOSED) {
   *   console.log('連接已關閉');
   * }
   * ```
   */
  getConnectionState(): number {
    // 如果 EventSource 存在則回傳其狀態，否則回傳 CLOSED
    return this.eventSource ? this.eventSource.readyState : EventSource.CLOSED;
  }
}

/**
 * SSE 服務實例
 * 
 * @constant {SSEService} sseService
 * @description 預設的 SSE 服務實例，採用單例模式
 * @example
 * ```typescript
 * import { sseService } from './SSEService';
 * 
 * // 使用預設實例連接任務
 * sseService.connectToTask('task-123', (event) => {
 *   console.log('進度更新:', event.data.percentage);
 * });
 * ```
 */
export const sseService = new SSEService();