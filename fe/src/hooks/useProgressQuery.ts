/**
 * @fileoverview React Query hooks 用於進度追蹤數據管理
 * 
 * 使用 React Query 處理所有與進度追蹤相關的數據獲取、緩存和同步。
 * 提供強大的數據獲取、錯誤處理和背景更新功能，支援即時進度更新。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';
import { TaskProgress, ProgressStreamEvent } from '../types/taskProgress';

/**
 * React Query 查詢鍵常量
 */
export const PROGRESS_QUERY_KEYS = {
  PROGRESS: (taskId: string) => ['progress', taskId] as const,
  PROGRESS_STREAM: (taskId: string) => ['progressStream', taskId] as const,
} as const;



/**
 * 獲取任務進度的 Hook
 */
export const useTaskProgress = (taskId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: PROGRESS_QUERY_KEYS.PROGRESS(taskId),
    queryFn: async (): Promise<TaskProgress> => {
      const response = await apiClient.get(`/api/progress/${taskId}`);
      const result = RequestResult.fromResponse<TaskProgress>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    enabled: enabled && !!taskId,
    staleTime: 5 * 1000, // 5秒內不會重新獲取
    gcTime: 2 * 60 * 1000, // 2分鐘後清除緩存
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchInterval: (data) => {
      // 根據任務狀態決定刷新間隔
      if (!data) return false;
      
      switch (data.status) {
        case 'pending':
        case 'running':
          return 2 * 1000; // 進行中的任務每2秒刷新
        case 'completed':
        case 'failed':
        case 'cancelled':
          return false; // 已完成的任務不需要刷新
        default:
          return 5 * 1000; // 其他情況每5秒刷新
      }
    },
    refetchIntervalInBackground: true,
  });
};

/**
 * 使用 Server-Sent Events 的進度串流 Hook
 */
export const useProgressStream = (taskId: string, enabled: boolean = true) => {
  const [progress, setProgress] = useState<TaskProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled || !taskId) {
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('未找到認證令牌');
      return;
    }

    // 創建 EventSource 連接
    const eventSource = new EventSource(
      `/api/progress/${taskId}/stream?token=${encodeURIComponent(token)}`
    );
    
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const progressEvent: ProgressStreamEvent = JSON.parse(event.data);
        
        if (progressEvent.taskId === taskId) {
          setProgress((prev) => ({
            ...prev,
            ...progressEvent.data,
          } as TaskProgress));
        }
      } catch (err) {
        console.error('解析進度事件失敗:', err);
        setError('解析進度資料失敗');
      }
    };

    eventSource.onerror = (event) => {
      console.error('進度串流連接錯誤:', event);
      setIsConnected(false);
      setError('進度串流連接失敗');
    };

    // 清理函數
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [taskId, enabled]);

  // 手動關閉連接
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // 重新連接
  const reconnect = useCallback(() => {
    disconnect();
    
    // 稍微延遲後重新連接
    setTimeout(() => {
      if (enabled && taskId) {
        // 觸發 useEffect 重新執行
        setError(null);
      }
    }, 1000);
  }, [taskId, enabled, disconnect]);

  return {
    progress,
    isConnected,
    error,
    disconnect,
    reconnect,
  };
};

/**
 * 組合進度追蹤 Hook
 * 結合輪詢和串流，提供最佳的進度追蹤體驗
 */
export const useTaskProgressWithStream = (
  taskId: string, 
  enabled: boolean = true,
  preferStream: boolean = true
) => {
  // 基本的輪詢查詢
  const pollingQuery = useTaskProgress(taskId, enabled && !preferStream);
  
  // 串流連接
  const streamData = useProgressStream(taskId, enabled && preferStream);
  
  // 決定使用哪種資料來源
  const progress = preferStream && streamData.isConnected 
    ? streamData.progress 
    : pollingQuery.data;

  const isLoading = preferStream 
    ? !streamData.isConnected && !streamData.progress
    : pollingQuery.isLoading;

  const error = preferStream 
    ? streamData.error 
    : pollingQuery.error?.message;

  // 回退到輪詢的方法
  const fallbackToPolling = useCallback(() => {
    if (preferStream) {
      streamData.disconnect();
      pollingQuery.refetch();
    }
  }, [preferStream, streamData, pollingQuery]);

  return {
    progress,
    isLoading,
    error,
    isStreamConnected: streamData.isConnected,
    fallbackToPolling,
    reconnectStream: streamData.reconnect,
    refetch: pollingQuery.refetch,
  };
};

