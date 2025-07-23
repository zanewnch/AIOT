/**
 * @fileoverview 提供進度追蹤功能的自定義 React Hook
 * 
 * 此 Hook 現在使用 React Query 架構來管理 SSE 連接和進度狀態，
 * 提供更好的快取、錯誤處理和狀態管理。
 * 
 * 主要功能：
 * - 使用 React Query 管理進度追蹤狀態
 * - 連接和斷開 SSE 服務
 * - 處理進度事件和錯誤
 * - 自動清理資源
 * 
 * @author AIOT Team
 * @since 2.0.0 - 重構為使用 React Query
 */

// 導入新的 SSE Query Hook
import { useSSE } from './useSSEQuery';
// 導入類型定義
import { ProgressInfo } from '../types/sse';

/**
 * 進度追蹤狀態介面
 * 定義了進度追蹤過程中的完整狀態結構
 * @deprecated 請使用 useSSEQuery 中的 ProgressTrackingState
 */
export interface ProgressState {
  /** 是否正在追蹤進度 */
  isTracking: boolean;
  /** 當前進度資訊，null 表示尚未開始或已完成 */
  progress: ProgressInfo | null;
  /** 錯誤訊息，null 表示無錯誤 */
  error: string | null;
}

/**
 * 進度追蹤自定義 Hook
 * 
 * 現在使用 React Query 架構來提供進度追蹤功能。
 * 這個 Hook 是對 useSSE 的簡化包裝，保持向後兼容性。
 * 
 * @returns {Object} 包含進度狀態和操作方法的物件
 * @returns {boolean} isTracking - 是否正在追蹤進度
 * @returns {ProgressInfo | null} progress - 當前進度資訊
 * @returns {string | null} error - 錯誤訊息
 * @returns {Function} startTracking - 開始追蹤指定任務的進度
 * @returns {Function} stopTracking - 停止進度追蹤
 * 
 * @example
 * ```typescript
 * const { isTracking, progress, error, startTracking, stopTracking } = useProgressTracking();
 * 
 * // 開始追蹤任務
 * startTracking('task-123');
 * 
 * // 停止追蹤
 * stopTracking();
 * ```
 * 
 * @deprecated 建議直接使用 useSSE 以獲得更多功能
 */
export const useProgressTracking = () => {
  const sse = useSSE();
  
  return {
    isTracking: sse.isTracking,
    progress: sse.progress,
    error: sse.error,
    startTracking: sse.startTracking,
    stopTracking: sse.stopTracking,
  };
};