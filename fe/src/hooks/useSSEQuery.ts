/**
 * @fileoverview SSE 相關的 React Query Hooks
 *
 * 這個檔案包含所有 SSE (Server-Sent Events) 相關的邏輯，使用 React Query 來處理：
 * - SSE 連接管理
 * - 進度追蹤狀態
 * - 錯誤處理
 * - 自動重連
 *
 * 與 SSEService 分離：
 * - SSEService: 負責底層 SSE 連接邏輯
 * - useSSEQuery: 負責 React 狀態管理和 Query 快取
 *
 * @author AIOT Development Team
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useCallback, useEffect } from 'react';
import { ProgressEvent, ProgressInfo, SSEConnectionState, ProgressTrackingState } from '../types/sse';

/**
 * SSEQuery - SSE 查詢服務類
 * 
 * 使用 class 封裝所有與 SSE 相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
export class SSEQuery {
  
  public SSE_QUERY_KEYS = {
    PROGRESS: (taskId: string) => ['sse', 'progress', taskId] as const,
    CONNECTION_STATUS: (taskId: string) => ['sse', 'connection', taskId] as const,
  } as const;
  
  constructor() {}
  
  /**
   * SSE 連接管理 Hook
   *
   * 使用 React Query 來管理 SSE 連接狀態
   */
  useConnection(taskId: string | null) {
    const eventSourceRef = useRef<EventSource | null>(null);
    const callbacksRef = useRef<Map<string, (event: ProgressEvent) => void>>(new Map());

    return useQuery({
      queryKey: this.SSE_QUERY_KEYS.CONNECTION_STATUS(taskId || ''),
      queryFn: async (): Promise<SSEConnectionState> => {
        if (!taskId) {
          return {
            isConnected: false,
            taskId: null,
            connectionState: EventSource.CLOSED,
            lastConnectedAt: null,
          };
        }

        const isConnected = eventSourceRef.current !== null &&
                           eventSourceRef.current.readyState === EventSource.OPEN;

        return {
          isConnected,
          taskId,
          connectionState: eventSourceRef.current?.readyState || EventSource.CLOSED,
          lastConnectedAt: isConnected ? Date.now() : null,
        };
      },
      enabled: !!taskId,
      refetchInterval: 5000, // 每5秒檢查一次連接狀態
      staleTime: 1000,
    });
  }

  /**
   * SSE 連接 Mutation Hook
   *
   * 處理 SSE 連接的建立和斷開
   */
  useConnectionMutation() {
    const queryClient = useQueryClient();
    const eventSourceRef = useRef<EventSource | null>(null);
    const callbacksRef = useRef<Map<string, (event: ProgressEvent) => void>>(new Map());

    const connectMutation = useMutation({
      mutationFn: async ({ taskId, callback }: { taskId: string; callback: (event: ProgressEvent) => void }) => {
        // 關閉現有連接
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        // 建立新連接
        const baseURL = (typeof window !== 'undefined' && (window as any).VITE_API_BASE_URL) || 'http://localhost:8000';
        const url = `${baseURL}/api/progress/${taskId}/stream`;
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;
        callbacksRef.current.set(taskId, callback);

        return new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('連接超時'));
          }, 10000);

          eventSource.onopen = () => {
            clearTimeout(timeout);
            console.log(`SSE connection opened for task ${taskId}`);
            resolve();
          };

          eventSource.onerror = (error) => {
            clearTimeout(timeout);
            console.error('SSE connection error:', error);
            reject(error);
          };

          // 監聽各種事件
          ['progress', 'completed', 'error'].forEach(eventType => {
            eventSource.addEventListener(eventType, (event) => {
              try {
                const progressEvent: ProgressEvent = JSON.parse((event as MessageEvent).data);
                callback(progressEvent);

                // 更新 React Query 快取
                queryClient.setQueryData(
                  this.SSE_QUERY_KEYS.PROGRESS(taskId),
                  (prev: ProgressTrackingState | undefined): ProgressTrackingState => ({
                    progress: progressEvent.data,
                    isTracking: progressEvent.type !== 'completed' && progressEvent.type !== 'error',
                    error: progressEvent.type === 'error' ? (progressEvent.data.error || 'Unknown error') : null,
                    lastUpdated: Date.now(),
                  })
                );

              } catch (parseError) {
                console.error(`Failed to parse ${eventType} event:`, parseError);
              }
            });
          });
        });
      },
      onSuccess: (_, { taskId }) => {
        // 更新連接狀態
        queryClient.invalidateQueries({ queryKey: this.SSE_QUERY_KEYS.CONNECTION_STATUS(taskId) });
      },
      onError: (error: any, { taskId }) => {
        console.error('SSE connection failed:', error);
        // 更新錯誤狀態
        queryClient.setQueryData(
          this.SSE_QUERY_KEYS.PROGRESS(taskId),
          (prev: ProgressTrackingState | undefined): ProgressTrackingState => ({
            progress: prev?.progress || null,
            isTracking: false,
            error: error.message || 'Connection failed',
            lastUpdated: Date.now(),
          })
        );
      },
    });

    const disconnectMutation = useMutation({
      mutationFn: async (taskId: string) => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        callbacksRef.current.delete(taskId);

        return { taskId, disconnectedAt: Date.now() };
      },
      onSuccess: (_, taskId) => {
        // 更新連接狀態
        queryClient.invalidateQueries({ queryKey: this.SSE_QUERY_KEYS.CONNECTION_STATUS(taskId) });

        // 更新進度狀態為停止追蹤
        queryClient.setQueryData(
          this.SSE_QUERY_KEYS.PROGRESS(taskId),
          (prev: ProgressTrackingState | undefined): ProgressTrackingState => ({
            progress: prev?.progress || null,
            isTracking: false,
            error: null,
            lastUpdated: Date.now(),
          })
        );
      },
    });

    return {
      connect: connectMutation.mutateAsync,
      disconnect: disconnectMutation.mutateAsync,
      isConnecting: connectMutation.isPending,
      isDisconnecting: disconnectMutation.isPending,
      connectionError: connectMutation.error,
    };
  }

  /**
   * 進度查詢 Hook
   */
  useProgress(taskId: string | null) {
    return useQuery({
      queryKey: this.SSE_QUERY_KEYS.PROGRESS(taskId || ''),
      queryFn: async (): Promise<ProgressTrackingState> => {
        return {
          progress: null,
          isTracking: false,
          error: null,
          lastUpdated: Date.now(),
        };
      },
      enabled: !!taskId,
      staleTime: 1000,
    });
  }

  /**
   * 主要 SSE Hook
   *
   * 使用 React Query 來管理所有 SSE 相關狀態，包括：
   * - 連接管理
   * - 進度追蹤
   * - 錯誤處理
   * - 自動清理
   */
  useSSE(taskId: string | null = null) {
    const queryClient = useQueryClient();
    const eventSourceRef = useRef<EventSource | null>(null);

    // 查詢和變更
    const connectionQuery = this.useConnection(taskId);
    const progressQuery = this.useProgress(taskId);
    const connectionMutation = this.useConnectionMutation();

    // 自動清理效果
    useEffect(() => {
      return () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      };
    }, []);

    // 便利方法
    const startTracking = useCallback(async (newTaskId: string, callback?: (event: ProgressEvent) => void) => {
      const defaultCallback = (event: ProgressEvent) => {
        console.log('Progress event received:', event);
      };

      await connectionMutation.connect({
        taskId: newTaskId,
        callback: callback || defaultCallback,
      });
    }, [connectionMutation]);

    const stopTracking = useCallback(async (targetTaskId?: string) => {
      const activeTaskId = targetTaskId || taskId;
      if (activeTaskId) {
        await connectionMutation.disconnect(activeTaskId);
      }
    }, [connectionMutation, taskId]);

    return {
      // 狀態 (由 React Query 管理)
      connectionState: connectionQuery.data,
      progressState: progressQuery.data,
      isConnected: connectionQuery.data?.isConnected || false,
      isTracking: progressQuery.data?.isTracking || false,
      progress: progressQuery.data?.progress || null,
      error: progressQuery.data?.error || connectionMutation.connectionError?.message || null,

      // 載入狀態
      isLoading: connectionQuery.isLoading || progressQuery.isLoading,
      isConnecting: connectionMutation.isConnecting,
      isDisconnecting: connectionMutation.isDisconnecting,

      // 方法
      startTracking,
      stopTracking,

      // 工具方法
      refetchConnection: () => connectionQuery.refetch(),
      refetchProgress: () => progressQuery.refetch(),
      invalidateSSE: (targetTaskId?: string) => {
        const activeTaskId = targetTaskId || taskId;
        if (activeTaskId) {
          queryClient.invalidateQueries({ queryKey: this.SSE_QUERY_KEYS.CONNECTION_STATUS(activeTaskId) });
          queryClient.invalidateQueries({ queryKey: this.SSE_QUERY_KEYS.PROGRESS(activeTaskId) });
        }
      },
      clearSSECache: (targetTaskId?: string) => {
        const activeTaskId = targetTaskId || taskId;
        if (activeTaskId) {
          queryClient.removeQueries({ queryKey: this.SSE_QUERY_KEYS.CONNECTION_STATUS(activeTaskId) });
          queryClient.removeQueries({ queryKey: this.SSE_QUERY_KEYS.PROGRESS(activeTaskId) });
        }
      },

      // 原始的 query/mutation 對象 (用於更高級的操作)
      queries: {
        connection: connectionQuery,
        progress: progressQuery,
      },
      mutations: {
        connection: connectionMutation,
      },
    };
  }

}



