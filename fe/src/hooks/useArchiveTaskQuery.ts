/**
 * @fileoverview React Query hooks 用於歸檔任務數據管理
 * 
 * 使用 React Query 處理所有與歸檔任務相關的數據獲取、緩存和同步。
 * 提供強大的數據獲取、錯誤處理和背景更新功能。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';
import {
  ArchiveTask,
  ArchiveTaskStatistics,
  ArchiveTaskExecutionResult,
  BatchArchiveResult,
  CreateArchiveTaskRequest,
  ArchiveTaskQueryOptions,
  CancelArchiveTaskRequest,
  CleanupArchiveTasksRequest,
  ApiResponse,
  ArchiveTaskStatus,
  ArchiveJobType
} from '../types/archiveTask';

/**
 * React Query 查詢鍵常量
 */
export const ARCHIVE_TASK_QUERY_KEYS = {
  ARCHIVE_TASKS: ['archiveTasks'] as const,
  ARCHIVE_TASK_BY_ID: (id: number) => ['archiveTasks', id] as const,
  ARCHIVE_TASKS_BY_STATUS: (status: ArchiveTaskStatus) => ['archiveTasks', 'status', status] as const,
  ARCHIVE_TASKS_BY_TYPE: (type: ArchiveJobType) => ['archiveTasks', 'type', type] as const,
  ARCHIVE_TASKS_BY_BATCH: (batchId: string) => ['archiveTasks', 'batch', batchId] as const,
  ARCHIVE_TASK_STATISTICS: ['archiveTasks', 'statistics'] as const,
  ARCHIVE_TASKS_DATA: ['archiveTasks', 'data'] as const,
} as const;

/**
 * 獲取所有歸檔任務的 Hook
 */
export const useArchiveTasks = (options?: ArchiveTaskQueryOptions) => {
  return useQuery({
    queryKey: options 
      ? [...ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS, options] 
      : ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS,
    queryFn: async (): Promise<ArchiveTask[]> => {
      const params = new URLSearchParams();
      
      if (options?.status) params.append('status', options.status);
      if (options?.jobType) params.append('jobType', options.jobType);
      if (options?.batchId) params.append('batchId', options.batchId);
      if (options?.createdBy) params.append('createdBy', options.createdBy);
      if (options?.sortBy) params.append('sortBy', options.sortBy);
      if (options?.sortOrder) params.append('sortOrder', options.sortOrder.toUpperCase());
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.dateRangeStart) {
        const startDate = typeof options.dateRangeStart === 'string' 
          ? options.dateRangeStart 
          : options.dateRangeStart.toISOString();
        params.append('dateRangeStart', startDate);
      }
      if (options?.dateRangeEnd) {
        const endDate = typeof options.dateRangeEnd === 'string' 
          ? options.dateRangeEnd 
          : options.dateRangeEnd.toISOString();
        params.append('dateRangeEnd', endDate);
      }
      
      const queryString = params.toString();
      const url = queryString ? `/api/archive-tasks?${queryString}` : '/api/archive-tasks';
      
      const response = await apiClient.get(url);
      const result = RequestResult.fromResponse<ApiResponse<ArchiveTask[]>>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      const apiResponse = result.unwrap();
      if (!apiResponse.success) {
        throw new Error(apiResponse.message);
      }
      
      return apiResponse.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * 獲取歸檔任務資料的 Hook（用於表格顯示）
 */
export const useArchiveTasksData = () => {
  return useQuery({
    queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_DATA,
    queryFn: async (): Promise<ArchiveTask[]> => {
      const response = await apiClient.get('/api/archive-tasks/data');
      const result = RequestResult.fromResponse<ArchiveTask[]>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * 根據 ID 獲取歸檔任務的 Hook
 */
export const useArchiveTaskById = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_BY_ID(id),
    queryFn: async (): Promise<ArchiveTask> => {
      const response = await apiClient.get(`/api/archive-tasks/${id}`);
      const result = RequestResult.fromResponse<ApiResponse<ArchiveTask>>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      const apiResponse = result.unwrap();
      if (!apiResponse.success) {
        throw new Error(apiResponse.message);
      }
      
      return apiResponse.data;
    },
    enabled: enabled && !!id && id > 0,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
};

/**
 * 根據狀態獲取歸檔任務的 Hook
 */
export const useArchiveTasksByStatus = (status: ArchiveTaskStatus, enabled: boolean = true) => {
  return useQuery({
    queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_STATUS(status),
    queryFn: async (): Promise<ArchiveTask[]> => {
      const response = await apiClient.get(`/api/archive-tasks?status=${status}`);
      const result = RequestResult.fromResponse<ApiResponse<ArchiveTask[]>>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      const apiResponse = result.unwrap();
      if (!apiResponse.success) {
        throw new Error(apiResponse.message);
      }
      
      return apiResponse.data;
    },
    enabled: enabled && !!status,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
};

/**
 * 根據類型獲取歸檔任務的 Hook
 */
export const useArchiveTasksByType = (type: ArchiveJobType, enabled: boolean = true) => {
  return useQuery({
    queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_TYPE(type),
    queryFn: async (): Promise<ArchiveTask[]> => {
      const response = await apiClient.get(`/api/archive-tasks?jobType=${type}`);
      const result = RequestResult.fromResponse<ApiResponse<ArchiveTask[]>>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      const apiResponse = result.unwrap();
      if (!apiResponse.success) {
        throw new Error(apiResponse.message);
      }
      
      return apiResponse.data;
    },
    enabled: enabled && !!type,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
};

/**
 * 根據批次 ID 獲取歸檔任務的 Hook
 */
export const useArchiveTasksByBatch = (batchId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_BATCH(batchId),
    queryFn: async (): Promise<ArchiveTask[]> => {
      const response = await apiClient.get(`/api/archive-tasks?batchId=${encodeURIComponent(batchId)}`);
      const result = RequestResult.fromResponse<ApiResponse<ArchiveTask[]>>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      const apiResponse = result.unwrap();
      if (!apiResponse.success) {
        throw new Error(apiResponse.message);
      }
      
      return apiResponse.data;
    },
    enabled: enabled && !!batchId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
};

/**
 * 獲取歸檔任務統計資訊的 Hook
 */
export const useArchiveTaskStatistics = () => {
  return useQuery({
    queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_STATISTICS,
    queryFn: async (): Promise<ArchiveTaskStatistics> => {
      const response = await apiClient.get('/api/archive-tasks/statistics');
      const result = RequestResult.fromResponse<ApiResponse<ArchiveTaskStatistics>>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      const apiResponse = result.unwrap();
      if (!apiResponse.success) {
        throw new Error(apiResponse.message);
      }
      
      return apiResponse.data;
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    refetchInterval: 5 * 60 * 1000, // 每5分鐘自動更新統計資訊
    refetchIntervalInBackground: true,
  });
};

/**
 * 創建歸檔任務的 Mutation Hook
 */
export const useCreateArchiveTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateArchiveTaskRequest): Promise<ArchiveTask> => {
      const response = await apiClient.post('/api/archive-tasks', data);
      const result = RequestResult.fromResponse<ApiResponse<ArchiveTask>>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      const apiResponse = result.unwrap();
      if (!apiResponse.success) {
        throw new Error(apiResponse.message);
      }
      
      return apiResponse.data;
    },
    onSuccess: (data) => {
      // 無效化所有相關查詢
      queryClient.invalidateQueries({ queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS });
      queryClient.invalidateQueries({ queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_DATA });
      queryClient.invalidateQueries({ queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_STATISTICS });
      queryClient.invalidateQueries({ 
        queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_STATUS(data.status) 
      });
      queryClient.invalidateQueries({ 
        queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_TYPE(data.job_type) 
      });
      queryClient.invalidateQueries({ 
        queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_BATCH(data.batch_id) 
      });
    },
    retry: 2,
  });
};

/**
 * 批次創建歸檔任務的 Mutation Hook
 */
export const useCreateBatchArchiveTasks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateArchiveTaskRequest[]): Promise<BatchArchiveResult> => {
      const response = await apiClient.post('/api/archive-tasks/batch', data);
      const result = RequestResult.fromResponse<ApiResponse<BatchArchiveResult>>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      const apiResponse = result.unwrap();
      if (!apiResponse.success) {
        throw new Error(apiResponse.message);
      }
      
      return apiResponse.data;
    },
    onSuccess: (data) => {
      // 無效化所有相關查詢
      queryClient.invalidateQueries({ queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS });
      queryClient.invalidateQueries({ queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_DATA });
      queryClient.invalidateQueries({ queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_STATISTICS });
      
      // 無效化每個創建的任務相關的查詢
      data.tasks.forEach(task => {
        queryClient.invalidateQueries({ 
          queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_STATUS(task.status) 
        });
        queryClient.invalidateQueries({ 
          queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_TYPE(task.job_type) 
        });
        queryClient.invalidateQueries({ 
          queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_BATCH(task.batch_id) 
        });
      });
    },
    retry: 2,
  });
};

/**
 * 執行歸檔任務的 Mutation Hook
 */
export const useExecuteArchiveTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: number): Promise<ArchiveTaskExecutionResult> => {
      const response = await apiClient.post(`/api/archive-tasks/${taskId}/execute`);
      const result = RequestResult.fromResponse<ApiResponse<ArchiveTaskExecutionResult>>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      const apiResponse = result.unwrap();
      if (!apiResponse.success) {
        throw new Error(apiResponse.message);
      }
      
      return apiResponse.data;
    },
    onSuccess: (data) => {
      // 無效化相關查詢
      queryClient.invalidateQueries({ queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS });
      queryClient.invalidateQueries({ queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_DATA });
      queryClient.invalidateQueries({ queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_STATISTICS });
      queryClient.invalidateQueries({ 
        queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_BY_ID(data.taskId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_STATUS(data.status) 
      });
    },
    retry: 1, // 執行任務只重試一次
  });
};

/**
 * 取消歸檔任務的 Mutation Hook
 */
export const useCancelArchiveTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, reason }: { taskId: number; reason: string }): Promise<ArchiveTask> => {
      const response = await apiClient.post(`/api/archive-tasks/${taskId}/cancel`, { reason });
      const result = RequestResult.fromResponse<ApiResponse<ArchiveTask>>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      const apiResponse = result.unwrap();
      if (!apiResponse.success) {
        throw new Error(apiResponse.message);
      }
      
      return apiResponse.data;
    },
    onSuccess: (data) => {
      // 無效化相關查詢
      queryClient.invalidateQueries({ queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS });
      queryClient.invalidateQueries({ queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_DATA });
      queryClient.invalidateQueries({ queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_STATISTICS });
      queryClient.invalidateQueries({ 
        queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_BY_ID(data.id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_STATUS(data.status) 
      });
    },
    retry: 2,
  });
};

/**
 * 重試歸檔任務的 Mutation Hook
 */
export const useRetryArchiveTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: number): Promise<ArchiveTaskExecutionResult> => {
      const response = await apiClient.post(`/api/archive-tasks/${taskId}/retry`);
      const result = RequestResult.fromResponse<ApiResponse<ArchiveTaskExecutionResult>>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      const apiResponse = result.unwrap();
      if (!apiResponse.success) {
        throw new Error(apiResponse.message);
      }
      
      return apiResponse.data;
    },
    onSuccess: (data) => {
      // 無效化相關查詢
      queryClient.invalidateQueries({ queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS });
      queryClient.invalidateQueries({ queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_DATA });
      queryClient.invalidateQueries({ queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_STATISTICS });
      queryClient.invalidateQueries({ 
        queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_BY_ID(data.taskId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_STATUS(data.status) 
      });
    },
    retry: 1, // 重試任務只重試一次
  });
};

/**
 * 清理舊歸檔任務的 Mutation Hook
 */
export const useCleanupArchiveTasks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ daysOld, status }: CleanupArchiveTasksRequest): Promise<{ cleanedCount: number }> => {
      const params = new URLSearchParams();
      params.append('daysOld', daysOld.toString());
      if (status) {
        params.append('status', status);
      }
      
      const response = await apiClient.delete(`/api/archive-tasks/cleanup?${params.toString()}`);
      const result = RequestResult.fromResponse<ApiResponse<{ cleanedCount: number }>>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      const apiResponse = result.unwrap();
      if (!apiResponse.success) {
        throw new Error(apiResponse.message);
      }
      
      return apiResponse.data;
    },
    onSuccess: () => {
      // 清理後無效化所有查詢
      queryClient.invalidateQueries({ queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS });
      queryClient.invalidateQueries({ queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_DATA });
      queryClient.invalidateQueries({ queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_STATISTICS });
    },
    retry: 2,
  });
};

/**
 * 獲取執行中任務的 Hook（自動更新）
 */
export const useRunningArchiveTasks = () => {
  return useQuery({
    queryKey: ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_STATUS(ArchiveTaskStatus.RUNNING),
    queryFn: async (): Promise<ArchiveTask[]> => {
      const response = await apiClient.get(`/api/archive-tasks?status=${ArchiveTaskStatus.RUNNING}`);
      const result = RequestResult.fromResponse<ApiResponse<ArchiveTask[]>>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      const apiResponse = result.unwrap();
      if (!apiResponse.success) {
        throw new Error(apiResponse.message);
      }
      
      return apiResponse.data;
    },
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    refetchInterval: 30 * 1000, // 每30秒更新執行中的任務
    refetchIntervalInBackground: true,
  });
};

/**
 * 獲取最近任務的 Hook
 */
export const useRecentArchiveTasks = (limit = 10) => {
  return useQuery({
    queryKey: [...ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS, 'recent', limit],
    queryFn: async (): Promise<ArchiveTask[]> => {
      const response = await apiClient.get(`/api/archive-tasks?sortBy=createdAt&sortOrder=DESC&limit=${limit}`);
      const result = RequestResult.fromResponse<ApiResponse<ArchiveTask[]>>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      const apiResponse = result.unwrap();
      if (!apiResponse.success) {
        throw new Error(apiResponse.message);
      }
      
      return apiResponse.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
};