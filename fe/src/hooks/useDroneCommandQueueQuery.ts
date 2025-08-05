/**
 * @fileoverview React Query hooks 用於無人機指令佇列數據管理
 * 
 * 使用 React Query 處理所有與無人機指令佇列相關的數據獲取、緩存和同步。
 * 提供強大的數據獲取、錯誤處理和背景更新功能。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';
import { createLogger } from '../configs/loggerConfig';
import type { DroneCommand } from '../types/droneCommand';
import type { TableError } from '../types/table';

// 創建 logger
const logger = createLogger('useDroneCommandQueueQuery');

/**
 * 條件類型介面
 */
export interface CommandCondition {
  type: 'battery' | 'altitude' | 'time' | 'position';
  operator: '>=' | '<=' | '==' | '!=' | '>' | '<';
  value: number | string;
  unit?: string;
}

/**
 * 無人機指令佇列資料介面
 */
export interface DroneCommandQueue {
  id: number;
  name: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  current_index: number;
  auto_execute: boolean;
  execution_conditions: CommandCondition[] | null;
  loop_count: number | null;
  max_loops: number | null;
  created_by: number;
  started_at: Date | string | null;
  completed_at: Date | string | null;
  error_message: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  commands?: DroneCommand[];
}

/**
 * 創建佇列請求介面
 */
export interface CreateQueueRequest {
  name: string;
  auto_execute?: boolean;
  execution_conditions?: CommandCondition[] | null;
  max_loops?: number | null;
  commands?: Array<{
    drone_id: number;
    command_type: 'takeoff' | 'land' | 'move' | 'hover' | 'return';
    command_data?: any;
  }>;
}

/**
 * 佇列統計介面
 */
export interface QueueStatistics {
  totalQueues: number;
  pendingQueues: number;
  runningQueues: number;
  pausedQueues: number;
  completedQueues: number;
  failedQueues: number;
}

/**
 * DroneCommandQueueQuery - 無人機指令佇列查詢服務類
 * 
 * 使用 class 封裝所有與無人機指令佇列相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
export class DroneCommandQueueQuery {
  
  public DRONE_COMMAND_QUEUE_QUERY_KEYS: {
    DRONE_COMMAND_QUEUES: readonly string[];
    DRONE_COMMAND_QUEUE_BY_ID: (id: string) => readonly (string | string)[];
    DRONE_COMMAND_QUEUE_STATISTICS: readonly string[];
  };
  
  constructor() {
    this.DRONE_COMMAND_QUEUE_QUERY_KEYS = {
      DRONE_COMMAND_QUEUES: ['droneCommandQueues'] as const,
      DRONE_COMMAND_QUEUE_BY_ID: (id: string) => ['droneCommandQueue', id] as const,
      DRONE_COMMAND_QUEUE_STATISTICS: ['droneCommandQueues', 'statistics'] as const,
    };
  }

  /**
   * 獲取所有指令佇列
   */
  useGetAllQueues(options: { page?: number; limit?: number; status?: string; created_by?: number } = {}) {
    return useQuery({
      queryKey: [...this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUES, options],
      queryFn: async (): Promise<DroneCommandQueue[]> => {
        try {
          logger.debug('Fetching all command queues', { options });
          
          const params = new URLSearchParams();
          if (options.page) params.append('page', options.page.toString());
          if (options.limit) params.append('limit', options.limit.toString());
          if (options.status) params.append('status', options.status);
          if (options.created_by) params.append('created_by', options.created_by.toString());
          
          const url = `/api/drone-command-queues/data?${params.toString()}`;
          const result = await apiClient.getWithResult<DroneCommandQueue[]>(url);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully fetched ${result.data?.length || 0} command queues`);
          return result.data || [];
        } catch (error: any) {
          logger.error('Failed to fetch command queues', { error, options });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch command queues',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    });
  }

  /**
   * 根據 ID 獲取指令佇列
   */
  useGetQueueById(queueId: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUE_BY_ID(queueId),
      queryFn: async (): Promise<DroneCommandQueue> => {
        try {
          logger.debug('Fetching command queue by ID', { queueId });
          
          const url = `/api/drone-command-queues/data/${queueId}`;
          const result = await apiClient.getWithResult<DroneCommandQueue>(url);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully fetched command queue ${queueId}`);
          return result.data!;
        } catch (error: any) {
          logger.error('Failed to fetch command queue by ID', { error, queueId });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch command queue ${queueId}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && !!queueId,
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    });
  }

  /**
   * 獲取佇列統計
   */
  useGetQueueStatistics() {
    return useQuery({
      queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUE_STATISTICS,
      queryFn: async (): Promise<QueueStatistics> => {
        try {
          logger.debug('Fetching queue statistics');
          
          const url = '/api/drone-command-queues/statistics';
          const result = await apiClient.getWithResult<QueueStatistics>(url);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info('Successfully fetched queue statistics');
          return result.data!;
        } catch (error: any) {
          logger.error('Failed to fetch queue statistics', { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch queue statistics',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 60 * 1000, // 1 minute
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchInterval: 30 * 1000, // 自動刷新每30秒
    });
  }

  /**
   * 創建指令佇列 - Mutation
   */
  useCreateQueue() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async (queueData: CreateQueueRequest): Promise<DroneCommandQueue> => {
        try {
          logger.debug('Creating command queue', { queueData });
          
          const result = await apiClient.postWithResult<DroneCommandQueue>('/api/drone-command-queues/data', queueData);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info('Successfully created command queue');
          return result.data!;
        } catch (error: any) {
          logger.error('Failed to create command queue', { error, queueData });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to create command queue',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: () => {
        // 刷新相關查詢
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUES });
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUE_STATISTICS });
      }
    });
  }

  /**
   * 更新指令佇列 - Mutation
   */
  useUpdateQueue() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async ({ queueId, queueData }: { queueId: string; queueData: Partial<DroneCommandQueue> }): Promise<DroneCommandQueue> => {
        try {
          logger.debug('Updating command queue', { queueId, queueData });
          
          const result = await apiClient.putWithResult<DroneCommandQueue>(`/api/drone-command-queues/data/${queueId}`, queueData);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully updated command queue ${queueId}`);
          return result.data!;
        } catch (error: any) {
          logger.error('Failed to update command queue', { error, queueId, queueData });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to update command queue',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        // 刷新相關查詢
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUES });
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUE_BY_ID(data.id.toString()) });
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUE_STATISTICS });
      }
    });
  }

  /**
   * 刪除指令佇列 - Mutation
   */
  useDeleteQueue() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async (queueId: string): Promise<void> => {
        try {
          logger.debug('Deleting command queue', { queueId });
          
          const result = await apiClient.deleteWithResult(`/api/drone-command-queues/data/${queueId}`);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully deleted command queue ${queueId}`);
        } catch (error: any) {
          logger.error('Failed to delete command queue', { error, queueId });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to delete command queue',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: () => {
        // 刷新相關查詢
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUES });
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUE_STATISTICS });
      }
    });
  }

  /**
   * 開始執行佇列 - Mutation
   */
  useStartQueue() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async (queueId: string): Promise<DroneCommandQueue> => {
        try {
          logger.debug('Starting command queue', { queueId });
          
          const result = await apiClient.postWithResult<DroneCommandQueue>(`/api/drone-command-queues/${queueId}/start`);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully started command queue ${queueId}`);
          return result.data!;
        } catch (error: any) {
          logger.error('Failed to start command queue', { error, queueId });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to start command queue',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        // 刷新相關查詢
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUES });
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUE_BY_ID(data.id.toString()) });
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUE_STATISTICS });
      }
    });
  }

  /**
   * 暫停佇列執行 - Mutation
   */
  usePauseQueue() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async (queueId: string): Promise<DroneCommandQueue> => {
        try {
          logger.debug('Pausing command queue', { queueId });
          
          const result = await apiClient.postWithResult<DroneCommandQueue>(`/api/drone-command-queues/${queueId}/pause`);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully paused command queue ${queueId}`);
          return result.data!;
        } catch (error: any) {
          logger.error('Failed to pause command queue', { error, queueId });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to pause command queue',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        // 刷新相關查詢
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUES });
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUE_BY_ID(data.id.toString()) });
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUE_STATISTICS });
      }
    });
  }

  /**
   * 重置佇列 - Mutation
   */
  useResetQueue() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async (queueId: string): Promise<DroneCommandQueue> => {
        try {
          logger.debug('Resetting command queue', { queueId });
          
          const result = await apiClient.postWithResult<DroneCommandQueue>(`/api/drone-command-queues/${queueId}/reset`);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully reset command queue ${queueId}`);
          return result.data!;
        } catch (error: any) {
          logger.error('Failed to reset command queue', { error, queueId });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to reset command queue',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        // 刷新相關查詢
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUES });
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUE_BY_ID(data.id.toString()) });
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUE_STATISTICS });
      }
    });
  }

  /**
   * 向佇列添加指令 - Mutation
   */
  useAddCommandToQueue() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async ({ queueId, command }: { queueId: string; command: { drone_id: number; command_type: string; command_data?: any } }): Promise<DroneCommand> => {
        try {
          logger.debug('Adding command to queue', { queueId, command });
          
          const result = await apiClient.postWithResult<DroneCommand>(`/api/drone-command-queues/${queueId}/commands`, command);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully added command to queue ${queueId}`);
          return result.data!;
        } catch (error: any) {
          logger.error('Failed to add command to queue', { error, queueId, command });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to add command to queue',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data, variables) => {
        // 刷新相關查詢
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUES });
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUEUE_QUERY_KEYS.DRONE_COMMAND_QUEUE_BY_ID(variables.queueId) });
      }
    });
  }
}

// 創建單例實例
const droneCommandQueueQuery = new DroneCommandQueueQuery();

// 導出 hooks
export const useDroneCommandQueueQuery = () => droneCommandQueueQuery;

// 導出常用的便捷 hooks
export const useGetAllQueues = (options?: { page?: number; limit?: number; status?: string; created_by?: number }) => 
  droneCommandQueueQuery.useGetAllQueues(options);

export const useGetQueueById = (queueId: string, enabled?: boolean) => 
  droneCommandQueueQuery.useGetQueueById(queueId, enabled);

export const useGetQueueStatistics = () => 
  droneCommandQueueQuery.useGetQueueStatistics();

export const useCreateQueue = () => 
  droneCommandQueueQuery.useCreateQueue();

export const useUpdateQueue = () => 
  droneCommandQueueQuery.useUpdateQueue();

export const useDeleteQueue = () => 
  droneCommandQueueQuery.useDeleteQueue();

export const useStartQueue = () => 
  droneCommandQueueQuery.useStartQueue();

export const usePauseQueue = () => 
  droneCommandQueueQuery.usePauseQueue();

export const useResetQueue = () => 
  droneCommandQueueQuery.useResetQueue();

export const useAddCommandToQueue = () => 
  droneCommandQueueQuery.useAddCommandToQueue();

export default droneCommandQueueQuery;