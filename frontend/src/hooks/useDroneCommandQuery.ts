/**
 * @fileoverview React Query hooks 用於無人機指令數據管理
 * 
 * 使用 React Query 處理所有與無人機指令相關的數據獲取、緩存和同步。
 * 提供強大的數據獲取、錯誤處理和背景更新功能。
 * 
 * @author AIOT Development Team
 * @version 2.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resUtilsInstance } from '../utils/ResUtils';
import { ReqResult } from '@/utils';
import {
  DroneCommand,
  DateRangeQuery,
  CommandStatistics,
  CommandTypeStatistics,
  DroneCommandSummary,
} from '../types/droneCommand';
import type { TableError } from '../types/table';
import { createLogger } from '../configs/loggerConfig';

const logger = createLogger('useDroneCommandQuery');

/**
 * DroneCommandQuery - 無人機指令查詢服務類
 * 
 * 使用 class 封裝所有與無人機指令相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
export class DroneCommandQuery {
  
  public DRONE_COMMAND_QUERY_KEYS: {
    DRONE_COMMANDS: readonly string[];
    DRONE_COMMAND_BY_ID: (id: string) => readonly (string | string)[];
    DRONE_COMMANDS_BY_DRONE_ID: (droneId: string) => readonly (string | string)[];
    DRONE_COMMANDS_BY_STATUS: (status: string) => readonly (string | string)[];
    DRONE_COMMANDS_BY_TYPE: (type: string) => readonly (string | string)[];
    DRONE_COMMANDS_BY_USER: (userId: string) => readonly (string | string)[];
    PENDING_COMMANDS: (droneId: string) => readonly (string | string)[];
    EXECUTING_COMMAND: (droneId: string) => readonly (string | string)[];
    LATEST_COMMANDS: readonly string[];
    FAILED_COMMANDS: readonly string[];
    COMMAND_STATISTICS: readonly string[];
    COMMAND_TYPE_STATISTICS: readonly string[];
    DRONE_COMMAND_SUMMARY: (droneId: string) => readonly (string | string)[];
  };
  
  constructor() {
    this.DRONE_COMMAND_QUERY_KEYS = {
      DRONE_COMMANDS: ['droneCommands'] as const,
      DRONE_COMMAND_BY_ID: (id: string) => ['droneCommand', id] as const,
      DRONE_COMMANDS_BY_DRONE_ID: (droneId: string) => ['droneCommands', 'drone', droneId] as const,
      DRONE_COMMANDS_BY_STATUS: (status: string) => ['droneCommands', 'status', status] as const,
      DRONE_COMMANDS_BY_TYPE: (type: string) => ['droneCommands', 'type', type] as const,
      DRONE_COMMANDS_BY_USER: (userId: string) => ['droneCommands', 'user', userId] as const,
      PENDING_COMMANDS: (droneId: string) => ['droneCommands', 'pending', droneId] as const,
      EXECUTING_COMMAND: (droneId: string) => ['droneCommands', 'executing', droneId] as const,
      LATEST_COMMANDS: ['droneCommands', 'latest'] as const,
      FAILED_COMMANDS: ['droneCommands', 'failed'] as const,
      COMMAND_STATISTICS: ['droneCommands', 'statistics'] as const,
      COMMAND_TYPE_STATISTICS: ['droneCommands', 'statistics', 'types'] as const,
      DRONE_COMMAND_SUMMARY: (droneId: string) => ['droneCommands', 'summary', droneId] as const,
    } as const;
  }
  
  /**
   * 獲取所有無人機指令
   */
  useAllDroneCommands() {
    return useQuery({
      queryKey: this.DRONE_COMMAND_QUERY_KEYS.DRONE_COMMANDS,
      queryFn: async (): Promise<DroneCommand[]> => {
        try {
          const response = await resUtilsInstance.get('/drone/commands');
          const result = ReqResult.fromResponse<DroneCommand[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to fetch all drone commands', { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch all drone commands',
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
   * 根據 ID 獲取無人機指令
   */
  useDroneCommandById(id: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_COMMAND_QUERY_KEYS.DRONE_COMMAND_BY_ID(id),
      queryFn: async (): Promise<DroneCommand> => {
        try {
          const response = await resUtilsInstance.get(`/drone/commands/${id}`);
          const result = ReqResult.fromResponse<DroneCommand>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch drone command with ID: ${id}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch drone command with ID: ${id}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && !!id,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 根據無人機 ID 獲取指令
   */
  useDroneCommandsByDroneId(droneId: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_COMMAND_QUERY_KEYS.DRONE_COMMANDS_BY_DRONE_ID(droneId),
      queryFn: async (): Promise<DroneCommand[]> => {
        try {
          const response = await resUtilsInstance.get(`/drone/commands/drone/${droneId}`);
          const result = ReqResult.fromResponse<DroneCommand[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch drone commands for drone ID: ${droneId}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch drone commands for drone ID: ${droneId}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && !!droneId,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 根據狀態獲取指令
   */
  useDroneCommandsByStatus(status: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_COMMAND_QUERY_KEYS.DRONE_COMMANDS_BY_STATUS(status),
      queryFn: async (): Promise<DroneCommand[]> => {
        try {
          const response = await resUtilsInstance.get(`/drone/commands/status/${status}`);
          const result = ReqResult.fromResponse<DroneCommand[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch drone commands with status: ${status}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch drone commands with status: ${status}`,
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
   * 根據類型獲取指令
   */
  useDroneCommandsByType(type: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_COMMAND_QUERY_KEYS.DRONE_COMMANDS_BY_TYPE(type),
      queryFn: async (): Promise<DroneCommand[]> => {
        try {
          const response = await resUtilsInstance.get(`/drone/commands/type/${type}`);
          const result = ReqResult.fromResponse<DroneCommand[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch drone commands with type: ${type}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch drone commands with type: ${type}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && !!type,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 根據用戶 ID 獲取指令
   */
  useDroneCommandsByUserId(userId: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_COMMAND_QUERY_KEYS.DRONE_COMMANDS_BY_USER(userId),
      queryFn: async (): Promise<DroneCommand[]> => {
        try {
          const response = await resUtilsInstance.get(`/drone/commands/issued-by/${userId}`);
          const result = ReqResult.fromResponse<DroneCommand[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch drone commands for user ID: ${userId}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch drone commands for user ID: ${userId}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && !!userId,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 根據日期範圍獲取指令
   */
  useDroneCommandsByDateRange(dateRange: DateRangeQuery | null, enabled: boolean = true) {
    return useQuery({
      queryKey: ['droneCommands', 'dateRange', dateRange],
      queryFn: async (): Promise<DroneCommand[]> => {
        try {
          const response = await resUtilsInstance.get('/drone/commands/date-range', { params: dateRange! });
          const result = ReqResult.fromResponse<DroneCommand[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to fetch drone commands by date range', { error, dateRange });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch drone commands by date range',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && !!dateRange,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 獲取無人機待執行指令
   */
  usePendingCommandsByDroneId(droneId: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_COMMAND_QUERY_KEYS.PENDING_COMMANDS(droneId),
      queryFn: async (): Promise<DroneCommand[]> => {
        try {
          const response = await resUtilsInstance.get(`/drone/commands/drone/${droneId}/pending`);
          const result = ReqResult.fromResponse<DroneCommand[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch pending drone commands for drone ID: ${droneId}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch pending drone commands for drone ID: ${droneId}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && !!droneId,
      staleTime: 15 * 1000,
      gcTime: 2 * 60 * 1000,
      retry: 3,
      refetchInterval: 30 * 1000,
      refetchIntervalInBackground: true,
    });
  }

  /**
   * 獲取無人機正在執行指令
   */
  useExecutingCommandByDroneId(droneId: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_COMMAND_QUERY_KEYS.EXECUTING_COMMAND(droneId),
      queryFn: async (): Promise<DroneCommand | null> => {
        try {
          const response = await resUtilsInstance.get(`/drone/commands/drone/${droneId}/executing`);
          const result = ReqResult.fromResponse<DroneCommand | null>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch executing drone command for drone ID: ${droneId}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch executing drone command for drone ID: ${droneId}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && !!droneId,
      staleTime: 10 * 1000,
      gcTime: 2 * 60 * 1000,
      retry: 3,
      refetchInterval: 15 * 1000,
      refetchIntervalInBackground: true,
    });
  }

  /**
   * 獲取最新指令
   */
  useLatestDroneCommands() {
    return useQuery({
      queryKey: this.DRONE_COMMAND_QUERY_KEYS.LATEST_COMMANDS,
      queryFn: async (): Promise<DroneCommand[]> => {
        try {
          const response = await resUtilsInstance.get('/drone/commands/latest');
          const result = ReqResult.fromResponse<DroneCommand[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to fetch latest drone commands', { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch latest drone commands',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 15 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
      refetchInterval: 30 * 1000,
      refetchIntervalInBackground: true,
    });
  }

  /**
   * 獲取失敗指令
   */
  useFailedDroneCommands() {
    return useQuery({
      queryKey: this.DRONE_COMMAND_QUERY_KEYS.FAILED_COMMANDS,
      queryFn: async (): Promise<DroneCommand[]> => {
        try {
          const response = await resUtilsInstance.get('/drone/commands/failed');
          const result = ReqResult.fromResponse<DroneCommand[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to fetch failed drone commands', { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch failed drone commands',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 獲取指令統計
   */
  useDroneCommandStatistics() {
    return useQuery({
      queryKey: this.DRONE_COMMAND_QUERY_KEYS.COMMAND_STATISTICS,
      queryFn: async (): Promise<CommandStatistics> => {
        try {
          const response = await resUtilsInstance.get('/drone/commands/statistics');
          const result = ReqResult.fromResponse<CommandStatistics>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to fetch drone command statistics', { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch drone command statistics',
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
    });
  }

  /**
   * 獲取指令類型統計
   */
  useDroneCommandTypeStatistics() {
    return useQuery({
      queryKey: this.DRONE_COMMAND_QUERY_KEYS.COMMAND_TYPE_STATISTICS,
      queryFn: async (): Promise<CommandTypeStatistics> => {
        try {
          const response = await resUtilsInstance.get('/drone/commands/statistics/types');
          const result = ReqResult.fromResponse<CommandTypeStatistics>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to fetch drone command type statistics', { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch drone command type statistics',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 獲取無人機指令摘要
   */
  useDroneCommandSummary(droneId: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_COMMAND_QUERY_KEYS.DRONE_COMMAND_SUMMARY(droneId),
      queryFn: async (): Promise<DroneCommandSummary> => {
        try {
          const response = await resUtilsInstance.get(`/drone/commands/summary/${droneId}`);
          const result = ReqResult.fromResponse<DroneCommandSummary>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch drone command summary for drone ID: ${droneId}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch drone command summary for drone ID: ${droneId}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && !!droneId,
      staleTime: 60 * 1000,
      gcTime: 10 * 1000,
      retry: 3,
    });
  }

  /**
   * 創建單個指令 - Mutation
   */
  useCreateCommand() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async (commandData: Partial<DroneCommand>): Promise<DroneCommand> => {
        try {
          const response = await resUtilsInstance.post('/drone/commands', commandData);
          const result = ReqResult.fromResponse<DroneCommand>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to create drone command', { error, commandData });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to create drone command',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: () => {
        // 刷新相關查詢
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUERY_KEYS.DRONE_COMMANDS });
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUERY_KEYS.LATEST_COMMANDS });
      }
    });
  }

  /**
   * 批次創建指令 - Mutation
   */
  useCreateBatchCommands() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async (commands: Partial<DroneCommand>[]): Promise<DroneCommand[]> => {
        try {
          const response = await resUtilsInstance.post('/drone/commands/batch', { commands });
          const result = ReqResult.fromResponse<DroneCommand[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to create batch drone commands', { error, commands });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to create batch drone commands',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: () => {
        // 刷新相關查詢
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUERY_KEYS.DRONE_COMMANDS });
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUERY_KEYS.LATEST_COMMANDS });
      }
    });
  }

  /**
   * 執行指令 - Mutation
   */
  useExecuteCommand() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async (commandId: string): Promise<DroneCommand> => {
        try {
          const response = await resUtilsInstance.put(`/drone/commands/${commandId}/execute`);
          const result = ReqResult.fromResponse<DroneCommand>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to execute drone command with ID: ${commandId}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to execute drone command with ID: ${commandId}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: () => {
        // 刷新相關查詢
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUERY_KEYS.DRONE_COMMANDS });
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUERY_KEYS.LATEST_COMMANDS });
      }
    });
  }

  /**
   * 取消指令 - Mutation
   */
  useCancelCommand() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async (commandId: string): Promise<DroneCommand> => {
        try {
          const response = await resUtilsInstance.put(`/drone/commands/${commandId}/cancel`);
          const result = ReqResult.fromResponse<DroneCommand>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to cancel drone command with ID: ${commandId}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to cancel drone command with ID: ${commandId}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: () => {
        // 刷新相關查詢
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUERY_KEYS.DRONE_COMMANDS });
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUERY_KEYS.LATEST_COMMANDS });
      }
    });
  }

  /**
   * 更新指令 - Mutation
   */
  useUpdate() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async ({ id, data }: { id: number; data: Partial<DroneCommand> }): Promise<DroneCommand> => {
        try {
          logger.debug(`Updating drone command with ID: ${id}`, data);
          
          const response = await resUtilsInstance.put(`/drone/commands/${id}`, data);
          const result = ReqResult.fromResponse<DroneCommand>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully updated drone command with ID: ${id}`);
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to update drone command with ID: ${id}:`, error);
          
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Update failed',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUERY_KEYS.DRONE_COMMANDS });
        queryClient.invalidateQueries({ queryKey: this.DRONE_COMMAND_QUERY_KEYS.LATEST_COMMANDS });
      },
      retry: 1,
    });
  }
}

// 創建單例實例
const droneCommandQuery = new DroneCommandQuery();

// 導出 hooks
export const useDroneCommandQuery = () => droneCommandQuery;

// 導出常用的便捷 hooks
export const useAllDroneCommands = () => 
  droneCommandQuery.useAllDroneCommands();

export const useDroneCommandById = (id: string, enabled?: boolean) => 
  droneCommandQuery.useDroneCommandById(id, enabled);

export const useDroneCommandsByDroneId = (droneId: string, enabled?: boolean) => 
  droneCommandQuery.useDroneCommandsByDroneId(droneId, enabled);

export const usePendingCommandsByDroneId = (droneId: string, enabled?: boolean) => 
  droneCommandQuery.usePendingCommandsByDroneId(droneId, enabled);  

export const useExecutingCommandByDroneId = (droneId: string, enabled?: boolean) => 
  droneCommandQuery.useExecutingCommandByDroneId(droneId, enabled);

export const useLatestDroneCommands = () => 
  droneCommandQuery.useLatestDroneCommands();

export const useFailedDroneCommands = () => 
  droneCommandQuery.useFailedDroneCommands();

export const useDroneCommandStatistics = () => 
  droneCommandQuery.useDroneCommandStatistics();

export const useDroneCommandsByStatus = (status: string, enabled?: boolean) =>
  droneCommandQuery.useDroneCommandsByStatus(status, enabled);

export const useDroneCommandsByType = (type: string, enabled?: boolean) =>
  droneCommandQuery.useDroneCommandsByType(type, enabled);

// Mutation hooks
export const useCreateCommand = () => 
  droneCommandQuery.useCreateCommand();

export const useCreateBatchCommands = () => 
  droneCommandQuery.useCreateBatchCommands();

export const useExecuteCommand = () => 
  droneCommandQuery.useExecuteCommand();

export const useCancelCommand = () => 
  droneCommandQuery.useCancelCommand();

export const useUpdateDroneCommand = () => 
  droneCommandQuery.useUpdate();

export default droneCommandQuery;