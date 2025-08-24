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
import { resUtilsInstance } from '../utils/ResUtils';
import { ReqResult } from '@/utils';
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
import type { TableError } from '../types/table';
import { createLogger } from '../configs/loggerConfig';

const logger = createLogger('useArchiveTaskQuery');

/**
 * ArchiveTaskQueryService - 歸檔任務查詢服務類
 * 
 * 使用 class 封裝所有與歸檔任務相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
export class ArchiveTaskQuery {
  
  public ARCHIVE_TASK_QUERY_KEYS : {
    ARCHIVE_TASKS: readonly string[];
    ARCHIVE_TASK_BY_ID: (id: number) => readonly (string | number)[];
    ARCHIVE_TASKS_BY_STATUS: (status: ArchiveTaskStatus) => readonly (string | ArchiveTaskStatus)[];
    ARCHIVE_TASKS_BY_TYPE: (type: ArchiveJobType) => readonly (string | ArchiveJobType)[];
    ARCHIVE_TASKS_BY_BATCH: (batchId: string) => readonly string[];
    ARCHIVE_TASK_STATISTICS: readonly string[];
    ARCHIVE_TASKS_DATA: readonly string[];
  };
  
  constructor() {
  this.ARCHIVE_TASK_QUERY_KEYS = {
    ARCHIVE_TASKS: ['archiveTasks'] as const,
    ARCHIVE_TASK_BY_ID: (id: number) => ['archiveTasks', id] as const,
    ARCHIVE_TASKS_BY_STATUS: (status: ArchiveTaskStatus) => ['archiveTasks', 'status', status] as const,
    ARCHIVE_TASKS_BY_TYPE: (type: ArchiveJobType) => ['archiveTasks', 'type', type] as const,
    ARCHIVE_TASKS_BY_BATCH: (batchId: string) => ['archiveTasks', 'batch', batchId] as const,
    ARCHIVE_TASK_STATISTICS: ['archiveTasks', 'statistics'] as const,
    ARCHIVE_TASKS_DATA: ['archiveTasks', 'data'] as const,
  } as const;
  }
  
  
  /**
   * 獲取所有歸檔任務
   * 
   * 使用 React Query 從後端 API 獲取歸檔任務列表，支援各種查詢選項
   * 包括狀態篩選、類型篩選、日期範圍等高級查詢功能
   * 
   * @param options - 查詢選項，包含篩選、排序、分頁等參數
   * @param options.status - 任務狀態篩選 (pending, running, completed, failed)
   * @param options.jobType - 任務類型篩選
   * @param options.batchId - 批次ID篩選
   * @param options.createdBy - 創建者篩選
   * @param options.sortBy - 排序欄位
   * @param options.sortOrder - 排序方向 (ASC|DESC)
   * @param options.limit - 分頁限制
   * @param options.offset - 分頁偏移
   * @param options.dateRangeStart - 日期範圍開始
   * @param options.dateRangeEnd - 日期範圍結束
   * @returns React Query 結果物件，包含歸檔任務數據和載入狀態
   * 
   * @example
   * ```typescript
   * const archiveQuery = new ArchiveTaskQuery();
   * const { data: tasks, isLoading, error } = archiveQuery.useArchiveTasks({
   *   status: ArchiveTaskStatus.RUNNING,
   *   sortBy: 'createdAt',
   *   sortOrder: 'DESC',
   *   limit: 20
   * });
   * 
   * if (isLoading) return <div>載入中...</div>;
   * if (error) return <div>錯誤: {error.message}</div>;
   * return <ArchiveTaskTable tasks={tasks} />;
   * ```
   * 
   * @throws {TableError} 當 API 請求失敗時拋出錯誤
   */
  useArchiveTasks(options?: ArchiveTaskQueryOptions) {
    return useQuery({
      queryKey: options 
        ? [...this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS, options] 
        : this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS,
      queryFn: async (): Promise<ArchiveTask[]> => {
        try {
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
          const url = queryString ? `/drone/archive-tasks?${queryString}` : '/drone/archive-tasks';
          
          const apiResponse = await resUtilsInstance.get<{status: number; message: string; data: ArchiveTask[]}>(url);
          
          if (apiResponse.status !== 200) {
            throw new Error(apiResponse.message || 'Failed to fetch archive tasks');
          }
          
          return apiResponse.data;
        } catch (error: any) {
          logger.error('Failed to fetch archive tasks', { error, options });
          
          // 如果是 API 端點不存在 (404) 或未實現 (501)，返回空數組而不是拋出錯誤
          if (error.response?.status === 404 || error.response?.status === 501) {
            logger.warn('Archive tasks API endpoint not implemented, returning empty array');
            return [];
          }
          
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch archive tasks',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
  }

  /**
   * 獲取歸檔任務資料（用於表格顯示）
   * 
   * 專門為表格組件優化的歸檔任務數據獲取方法
   * 返回精簡的數據格式，適合表格快速渲染
   * 
   * @returns React Query 結果物件，包含表格用歸檔任務數據
   * 
   * @example
   * ```typescript
   * const archiveQuery = new ArchiveTaskQuery();
   * const { data: tableData, isLoading } = archiveQuery.useArchiveTasksData();
   * 
   * return (
   *   <DataTable
   *     data={tableData}
   *     loading={isLoading}
   *     columns={archiveTaskColumns}
   *   />
   * );
   * ```
   * 
   * @throws {TableError} 當數據獲取失敗時拋出錯誤
   */
  useArchiveTasksData() {
    return useQuery({
      queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_DATA,
      queryFn: async (): Promise<ArchiveTask[]> => {
        try {
          const responseData = await resUtilsInstance.get<{status: number; message: string; data: ArchiveTask[]}>('/drone/archive-tasks/data');
          
          if (responseData.status !== 200) {
            throw new Error(responseData.message || 'Failed to fetch archive tasks data');
          }
          
          return responseData.data;
        } catch (error: any) {
          logger.error('Failed to fetch archive tasks data', { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch archive tasks data',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
  }

  /**
   * 根據 ID 獲取歸檔任務
   * 
   * 使用唯一 ID 獲取特定歸檔任務的詳細資訊
   * 支援條件性啟用查詢，用於優化效能
   * 
   * @param id - 歸檔任務的唯一識別碼
   * @param enabled - 是否啟用查詢，默認為 true
   * @returns React Query 結果物件，包含特定歸檔任務數據
   * 
   * @example
   * ```typescript
   * const archiveQuery = new ArchiveTaskQuery();
   * const selectedTaskId = 123;
   * const { data: task, isLoading } = archiveQuery.useArchiveTaskById(
   *   selectedTaskId,
   *   !!selectedTaskId
   * );
   * 
   * if (!task) return null;
   * return <ArchiveTaskDetail task={task} />;
   * ```
   * 
   * @throws {TableError} 當任務不存在或查詢失敗時拋出錯誤
   */
  useArchiveTaskById(id: number, enabled: boolean = true) {
    return useQuery({
      queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_BY_ID(id),
      queryFn: async (): Promise<ArchiveTask> => {
        try {
          const responseData = await resUtilsInstance.get<{status: number; message: string; data: ArchiveTask}>(`/drone/archive-tasks/${id}`);
          
          if (responseData.status !== 200) {
            throw new Error(responseData.message || 'Failed to fetch archive task');
          }
          
          return responseData.data;
        } catch (error: any) {
          logger.error(`Failed to fetch archive task with ID: ${id}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch archive task with ID: ${id}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && !!id && id > 0,
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 根據狀態獲取歸檔任務
   */
  useArchiveTasksByStatus(status: ArchiveTaskStatus, enabled: boolean = true) {
    return useQuery({
      queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_STATUS(status),
      queryFn: async (): Promise<ArchiveTask[]> => {
        try {
          const responseData = await resUtilsInstance.get<{status: number; message: string; data: ArchiveTask[]}>(`/drone/archive-tasks?status=${status}`);
          
          if (responseData.status !== 200) {
            throw new Error(responseData.message || 'Failed to fetch archive tasks by status');
          }
          
          return responseData.data;
        } catch (error: any) {
          logger.error(`Failed to fetch archive tasks with status: ${status}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch archive tasks with status: ${status}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && !!status,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 根據類型獲取歸檔任務
   */
  useArchiveTasksByType(type: ArchiveJobType, enabled: boolean = true) {
    return useQuery({
      queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_TYPE(type),
      queryFn: async (): Promise<ArchiveTask[]> => {
        try {
          const responseData = await resUtilsInstance.get<{status: number; message: string; data: ArchiveTask[]}>(`/drone/archive-tasks?jobType=${type}`);
          
          if (responseData.status !== 200) {
            throw new Error(responseData.message || 'Failed to fetch archive tasks by type');
          }
          
          return responseData.data;
        } catch (error: any) {
          logger.error(`Failed to fetch archive tasks with type: ${type}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch archive tasks with type: ${type}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && !!type,
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 根據批次 ID 獲取歸檔任務
   */
  useArchiveTasksByBatch(batchId: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_BATCH(batchId),
      queryFn: async (): Promise<ArchiveTask[]> => {
        try {
          const responseData = await resUtilsInstance.get<{status: number; message: string; data: ArchiveTask[]}>(`/drone/archive-tasks?batchId=${encodeURIComponent(batchId)}`);
          
          if (responseData.status !== 200) {
            throw new Error(responseData.message || 'Failed to fetch archive tasks by batch');
          }
          
          return responseData.data;
        } catch (error: any) {
          logger.error(`Failed to fetch archive tasks with batch ID: ${batchId}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch archive tasks with batch ID: ${batchId}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && !!batchId,
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 獲取歸檔任務統計資訊
   */
  useArchiveTaskStatistics() {
    return useQuery({
      queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_STATISTICS,
      queryFn: async (): Promise<ArchiveTaskStatistics> => {
        try {
          const response = await resUtilsInstance.get<{status: number; message: string; data: ArchiveTaskStatistics}>('/drone/archive-tasks/statistics');
          
          if (response.status !== 200) {
            throw new Error(response.message || 'Failed to fetch archive task statistics');
          }
          
          return response.data;
        } catch (error: any) {
          logger.error('Failed to fetch archive task statistics', { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch archive task statistics',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
      refetchInterval: 5 * 60 * 1000,
      refetchIntervalInBackground: true,
    });
  }

  /**
   * 創建歸檔任務
   * 
   * 創建新的歸檔任務，支援各種任務類型和配置選項
   * 成功創建後會自動刷新相關查詢緩存
   * 
   * @returns React Query mutation 物件，用於創建歸檔任務
   * 
   * @example
   * ```typescript
   * const archiveQuery = new ArchiveTaskQuery();
   * const createTaskMutation = archiveQuery.useCreateArchiveTask();
   * 
   * const handleCreateTask = async () => {
   *   try {
   *     const newTask = await createTaskMutation.mutateAsync({
   *       name: '數據歸檔任務',
   *       job_type: ArchiveJobType.DATA_ARCHIVE,
   *       config: { retention_days: 30 },
   *       created_by: 'admin'
   *     });
   *     console.log('任務創建成功:', newTask);
   *   } catch (error) {
   *     console.error('創建失敗:', error);
   *   }
   * };
   * ```
   * 
   * @throws {TableError} 當創建請求失敗時拋出錯誤
   */
  useCreateArchiveTask() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (data: CreateArchiveTaskRequest): Promise<ArchiveTask> => {
        try {
          const response = await resUtilsInstance.post<{status: number; message: string; data: ArchiveTask}>('/drone/archive-tasks', data);
          
          if (response.status !== 200) {
            throw new Error(response.message || 'Failed to create archive task');
          }
          
          return response.data;
        } catch (error: any) {
          logger.error('Failed to create archive task', { error, data });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to create archive task',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS });
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_DATA });
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_STATISTICS });
        queryClient.invalidateQueries({ 
          queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_STATUS(data.status) 
        });
        queryClient.invalidateQueries({ 
          queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_TYPE(data.job_type) 
        });
        queryClient.invalidateQueries({ 
          queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_BATCH(data.batch_id) 
        });
      },
      retry: 2,
    });
  }

  /**
   * 批次創建歸檔任務
   */
  useCreateBatchArchiveTasks() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (data: CreateArchiveTaskRequest[]): Promise<BatchArchiveResult> => {
        try {
          const response = await resUtilsInstance.post<{status: number; message: string; data: BatchArchiveResult}>('/drone/archive-tasks/batch', data);
          
          if (response.status !== 200) {
            throw new Error(response.message || 'Failed to create batch archive tasks');
          }
          
          return response.data;
        } catch (error: any) {
          logger.error('Failed to create batch archive tasks', { error, data });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to create batch archive tasks',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS });
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_DATA });
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_STATISTICS });
        
        data.tasks.forEach(task => {
          queryClient.invalidateQueries({ 
            queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_STATUS(task.status) 
          });
          queryClient.invalidateQueries({ 
            queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_TYPE(task.job_type) 
          });
          queryClient.invalidateQueries({ 
            queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_BATCH(task.batch_id) 
          });
        });
      },
      retry: 2,
    });
  }

  /**
   * 執行歸檔任務
   * 
   * 觸發特定歸檔任務的執行，將任務狀態從待執行變更為執行中
   * 執行後會自動更新任務狀態並刷新相關查詢緩存
   * 
   * @returns React Query mutation 物件，用於執行歸檔任務
   * 
   * @example
   * ```typescript
   * const archiveQuery = new ArchiveTaskQuery();
   * const executeTaskMutation = archiveQuery.useExecuteArchiveTask();
   * 
   * const handleExecuteTask = async (taskId: number) => {
   *   try {
   *     const result = await executeTaskMutation.mutateAsync(taskId);
   *     console.log('任務執行結果:', result);
   *     // 結果包含 taskId, status, executionDetails 等資訊
   *   } catch (error) {
   *     console.error('執行失敗:', error);
   *   }
   * };
   * 
   * return (
   *   <Button 
   *     onClick={() => handleExecuteTask(123)}
   *     loading={executeTaskMutation.isPending}
   *   >
   *     執行任務
   *   </Button>
   * );
   * ```
   * 
   * @throws {TableError} 當執行請求失敗時拋出錯誤
   */
  useExecuteArchiveTask() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (taskId: number): Promise<ArchiveTaskExecutionResult> => {
        try {
          const response = await resUtilsInstance.post<{status: number; message: string; data: ArchiveTaskExecutionResult}>(`/drone/archive-tasks/${taskId}/execute`);
          
          if (response.status !== 200) {
            throw new Error(response.message || 'Failed to execute archive task');
          }
          
          return response.data;
        } catch (error: any) {
          logger.error(`Failed to execute archive task with ID: ${taskId}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to execute archive task with ID: ${taskId}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS });
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_DATA });
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_STATISTICS });
        queryClient.invalidateQueries({ 
          queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_BY_ID(data.taskId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_STATUS(data.status) 
        });
      },
      retry: 1,
    });
  }

  /**
   * 取消歸檔任務
   */
  useCancelArchiveTask() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ taskId, reason }: { taskId: number; reason: string }): Promise<ArchiveTask> => {
        try {
          const response = await resUtilsInstance.post<{status: number; message: string; data: ArchiveTask}>(`/drone/archive-tasks/${taskId}/cancel`, { reason });
          
          if (response.status !== 200) {
            throw new Error(response.message || 'Failed to cancel archive task');
          }
          
          return response.data;
        } catch (error: any) {
          logger.error(`Failed to cancel archive task with ID: ${taskId}`, { error, reason });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to cancel archive task with ID: ${taskId}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS });
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_DATA });
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_STATISTICS });
        queryClient.invalidateQueries({ 
          queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_BY_ID(data.id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_STATUS(data.status) 
        });
      },
      retry: 2,
    });
  }

  /**
   * 重試歸檔任務
   */
  useRetryArchiveTask() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (taskId: number): Promise<ArchiveTaskExecutionResult> => {
        try {
          const response = await resUtilsInstance.post<{status: number; message: string; data: ArchiveTaskExecutionResult}>(`/drone/archive-tasks/${taskId}/retry`);
          
          if (response.status !== 200) {
            throw new Error(response.message || 'Failed to retry archive task');
          }
          
          return response.data;
        } catch (error: any) {
          logger.error(`Failed to retry archive task with ID: ${taskId}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to retry archive task with ID: ${taskId}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS });
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_DATA });
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_STATISTICS });
        queryClient.invalidateQueries({ 
          queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_BY_ID(data.taskId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_STATUS(data.status) 
        });
      },
      retry: 1,
    });
  }

  /**
   * 清理舊歸檔任務
   */
  useCleanupArchiveTasks() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ daysOld, status }: CleanupArchiveTasksRequest): Promise<{ cleanedCount: number }> => {
        try {
          const params = new URLSearchParams();
          params.append('daysOld', daysOld.toString());
          if (status) {
            params.append('status', status);
          }
          
          const response = await resUtilsInstance.delete<{status: number; message: string; data: { cleanedCount: number }}>(`/drone/archive-tasks/cleanup?${params.toString()}`);
          
          if (response.status !== 200) {
            throw new Error(response.message || 'Failed to cleanup archive tasks');
          }
          
          return response.data;
        } catch (error: any) {
          logger.error('Failed to cleanup archive tasks', { error, daysOld, status });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to cleanup archive tasks',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS });
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_DATA });
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_STATISTICS });
      },
      retry: 2,
    });
  }

  /**
   * 獲取執行中任務（自動更新）
   */
  useRunningArchiveTasks() {
    return useQuery({
      queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_BY_STATUS(ArchiveTaskStatus.RUNNING),
      queryFn: async (): Promise<ArchiveTask[]> => {
        try {
          const responseData = await resUtilsInstance.get<{status: number; message: string; data: ArchiveTask[]}>(`/drone/archive-tasks?status=${ArchiveTaskStatus.RUNNING}`);
          
          if (responseData.status !== 200) {
            throw new Error(responseData.message || 'Failed to fetch running archive tasks');
          }
          
          return responseData.data;
        } catch (error: any) {
          logger.error('Failed to fetch running archive tasks', { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch running archive tasks',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 10 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
      refetchInterval: 30 * 1000,
      refetchIntervalInBackground: true,
    });
  }

  /**
   * 獲取最近任務
   */
  useRecentArchiveTasks(limit = 10) {
    return useQuery({
      queryKey: [...this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS, 'recent', limit],
      queryFn: async (): Promise<ArchiveTask[]> => {
        try {
          const responseData = await resUtilsInstance.get<{status: number; message: string; data: ArchiveTask[]}>(`/drone/archive-tasks?sortBy=createdAt&sortOrder=DESC&limit=${limit}`);
          
          if (responseData.status !== 200) {
            throw new Error(responseData.message || 'Failed to fetch recent archive tasks');
          }
          
          return responseData.data;
        } catch (error: any) {
          logger.error('Failed to fetch recent archive tasks', { error, limit });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch recent archive tasks',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 更新歸檔任務 - Mutation
   */
  useUpdate() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async ({ id, data }: { id: number; data: Partial<ArchiveTask> }): Promise<ArchiveTask> => {
        try {
          logger.debug(`Updating archive task with ID: ${id}`, data);
          
          const response = await resUtilsInstance.put<{status: number; message: string; data: ArchiveTask}>(`/drone/archive-tasks/${id}`, data);
          
          if (response.status !== 200) {
            throw new Error(response.message || 'Failed to update archive task');
          }
          
          logger.info(`Successfully updated archive task with ID: ${id}`);
          return response.data;
        } catch (error: any) {
          logger.error(`Failed to update archive task with ID: ${id}:`, error);
          
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Update failed',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS });
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASKS_DATA });
        queryClient.invalidateQueries({ queryKey: this.ARCHIVE_TASK_QUERY_KEYS.ARCHIVE_TASK_BY_ID(data.id) });
      },
      retry: 1,
    });
  }
}