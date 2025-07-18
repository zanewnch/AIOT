/**
 * @fileoverview 提供進度追蹤功能的自定義 React Hook
 * 
 * 此 Hook 封裝了與 Server-Sent Events (SSE) 服務的互動，
 * 用於追蹤任務執行的進度狀態，支援即時更新和錯誤處理。
 * 
 * 主要功能：
 * - 管理進度追蹤狀態
 * - 連接和斷開 SSE 服務
 * - 處理進度事件和錯誤
 * - 自動清理資源
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

// 從 React 核心庫導入狀態管理和副作用相關的 Hooks
import { useState, useEffect, useCallback } from 'react';
// 導入 SSE 服務和相關的類型定義
import { sseService, ProgressEvent, ProgressInfo } from '../services/SSEService';

/**
 * 進度追蹤狀態介面
 * 定義了進度追蹤過程中的完整狀態結構
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
 * 提供完整的進度追蹤功能，包括開始追蹤、停止追蹤和狀態管理。
 * 使用 SSE 服務來接收即時的進度更新。
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
 */
export const useProgressTracking = () => {
  // 使用 useState 管理進度追蹤的完整狀態
  const [progressState, setProgressState] = useState<ProgressState>({
    isTracking: false,    // 初始狀態：未追蹤
    progress: null,       // 初始狀態：無進度資訊
    error: null          // 初始狀態：無錯誤
  });

  /**
   * 開始追蹤指定任務的進度
   * 
   * 此方法會連接到 SSE 服務，並設置事件處理器來接收進度更新。
   * 使用 useCallback 來避免不必要的重新渲染。
   * 
   * @param {string} taskId - 要追蹤的任務 ID
   */
  const startTracking = useCallback((taskId: string) => {
    // 記錄開始追蹤的日誌
    console.log(`Starting progress tracking for task: ${taskId}`);
    
    // 重置狀態並設置為追蹤中
    setProgressState({
      isTracking: true,   // 設置為追蹤中
      progress: null,     // 清除之前的進度資訊
      error: null        // 清除之前的錯誤
    });

    /**
     * 處理從 SSE 服務接收到的進度事件
     * 
     * @param {ProgressEvent} event - 進度事件物件
     */
    const handleProgressEvent = (event: ProgressEvent) => {
      // 記錄接收到的進度事件
      console.log('Progress event received:', event);
      
      // 檢查是否為錯誤事件
      if (event.type === 'error') {
        // 更新狀態：設置錯誤訊息並停止追蹤
        setProgressState(prev => ({
          ...prev,                                                    // 保留其他狀態
          isTracking: false,                                         // 停止追蹤
          error: event.data.error || 'Unknown error occurred'       // 設置錯誤訊息
        }));
      } else {
        // 處理正常的進度事件
        setProgressState(prev => ({
          ...prev,                                    // 保留其他狀態
          progress: event.data,                      // 更新進度資訊
          isTracking: event.type !== 'completed'     // 如果是完成事件則停止追蹤
        }));
      }
    };

    // 連接到 SSE 服務並註冊事件處理器
    sseService.connectToTask(taskId, handleProgressEvent);
  }, []); // 空依賴數組，確保函數引用穩定

  /**
   * 停止進度追蹤
   * 
   * 此方法會斷開 SSE 連接並重置狀態。
   * 使用 useCallback 來避免不必要的重新渲染。
   */
  const stopTracking = useCallback(() => {
    // 記錄停止追蹤的日誌
    console.log('Stopping progress tracking');
    
    // 斷開 SSE 連接
    sseService.disconnect();
    
    // 重置所有狀態
    setProgressState({
      isTracking: false,  // 停止追蹤
      progress: null,     // 清除進度資訊
      error: null        // 清除錯誤訊息
    });
  }, []); // 空依賴數組，確保函數引用穩定

  /**
   * 組件清理效果 Hook
   * 
   * 當組件卸載時，自動斷開 SSE 連接以避免記憶體洩漏。
   * 這是 React Hook 的最佳實踐，確保資源得到正確釋放。
   */
  useEffect(() => {
    // 返回清理函數，在組件卸載時執行
    return () => {
      // 斷開 SSE 連接
      sseService.disconnect();
    };
  }, []); // 空依賴數組，只在組件掛載和卸載時執行

  // 返回進度狀態和操作方法
  return {
    ...progressState,    // 展開進度狀態（isTracking, progress, error）
    startTracking,       // 開始追蹤方法
    stopTracking        // 停止追蹤方法
  };
};