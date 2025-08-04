import type { ProgressInfo } from './sse';

/**
 * 進度追蹤狀態介面
 * @deprecated SSE 功能已移除
 */
export interface ProgressState {
  /** 是否正在追蹤進度 */
  isTracking: boolean;
  /** 當前進度資訊，null 表示尚未開始或已完成 */
  progress: ProgressInfo | null;
  /** 錯誤訊息，null 表示無錯誤 */
  error: string | null;
}

// Re-export ProgressInfo from SSE types for convenience
export type { ProgressInfo };