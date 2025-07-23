/**
 * @fileoverview SSE (Server-Sent Events) 相關的類型定義
 * 
 * 包含 Server-Sent Events 功能相關的所有類型定義，
 * 從原本的 SSEService 中提取出來，供各個模組共用。
 * 
 * @author AIOT Development Team
 * @version 2.0.0
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