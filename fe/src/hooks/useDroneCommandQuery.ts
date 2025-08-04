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
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';
import {
  DroneCommand,
  DateRangeQuery,
  CommandStatistics,
  CommandTypeStatistics,
  DroneCommandSummary,
} from '../types/droneCommand';

/**
 * DroneCommandQuery - 無人機指令查詢服務類
 * 
 * 使用 class 封裝所有與無人機指令相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
class DroneCommandQuery {
  
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
        const response = await apiClient.get('/api/drone-commands/data');
        const result = RequestResult.fromResponse<DroneCommand[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
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
        const response = await apiClient.get(`/api/drone-commands/data/${id}`);
        const result = RequestResult.fromResponse<DroneCommand>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
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
        const response = await apiClient.get(`/api/drone-commands/data/drone/${droneId}`);
        const result = RequestResult.fromResponse<DroneCommand[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
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
        const response = await apiClient.get(`/api/drone-commands/data/status/${status}`);
        const result = RequestResult.fromResponse<DroneCommand[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
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
        const response = await apiClient.get(`/api/drone-commands/data/type/${type}`);
        const result = RequestResult.fromResponse<DroneCommand[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
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
        const response = await apiClient.get(`/api/drone-commands/data/issued-by/${userId}`);
        const result = RequestResult.fromResponse<DroneCommand[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
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
        const response = await apiClient.get('/api/drone-commands/data/date-range', { params: dateRange! });
        const result = RequestResult.fromResponse<DroneCommand[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
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
        const response = await apiClient.get(`/api/drone-commands/data/drone/${droneId}/pending`);
        const result = RequestResult.fromResponse<DroneCommand[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
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
        const response = await apiClient.get(`/api/drone-commands/data/drone/${droneId}/executing`);
        const result = RequestResult.fromResponse<DroneCommand | null>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
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
        const response = await apiClient.get('/api/drone-commands/data/latest');
        const result = RequestResult.fromResponse<DroneCommand[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
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
        const response = await apiClient.get('/api/drone-commands/data/failed');
        const result = RequestResult.fromResponse<DroneCommand[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
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
        const response = await apiClient.get('/api/drone-commands/statistics');
        const result = RequestResult.fromResponse<CommandStatistics>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
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
        const response = await apiClient.get('/api/drone-commands/statistics/types');
        const result = RequestResult.fromResponse<CommandTypeStatistics>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
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
        const response = await apiClient.get(`/api/drone-commands/summary/${droneId}`);
        const result = RequestResult.fromResponse<DroneCommandSummary>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
      },
      enabled: enabled && !!droneId,
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    });
  }
}



// 創建 DroneCommandQuery 實例並匯出主要 Hook
const dronecommandqueryInstance = new DroneCommandQuery();

/**
 * useDroneCommandQuery - 主要的 Hook
 * 
 * 直接匯出使用的 Hook，與現有代碼相容
 */
export const useDroneCommandQuery = () => dronecommandqueryInstance;

// 也可以匯出 DroneCommandQuery 類別本身，供進階使用  
export { DroneCommandQuery };
