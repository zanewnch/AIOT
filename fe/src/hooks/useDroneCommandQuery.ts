/**
 * @fileoverview React Query hooks 用於無人機指令數據管理
 * 
 * 使用 React Query 處理所有與無人機指令相關的數據獲取、緩存和同步。
 * 提供強大的數據獲取、錯誤處理和背景更新功能。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
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
 * React Query 查詢鍵常量
 */
export const DRONE_COMMAND_QUERY_KEYS = {
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


/**
 * 獲取所有無人機指令的 Hook
 */
export const useDroneCommands = () => {
  return useQuery({
    queryKey: DRONE_COMMAND_QUERY_KEYS.DRONE_COMMANDS,
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
};

/**
 * 根據 ID 獲取無人機指令的 Hook
 */
export const useDroneCommandById = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: DRONE_COMMAND_QUERY_KEYS.DRONE_COMMAND_BY_ID(id),
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
};

/**
 * 根據無人機 ID 獲取指令的 Hook
 */
export const useDroneCommandsByDroneId = (droneId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: DRONE_COMMAND_QUERY_KEYS.DRONE_COMMANDS_BY_DRONE_ID(droneId),
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
};

/**
 * 根據狀態獲取指令的 Hook
 */
export const useDroneCommandsByStatus = (status: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: DRONE_COMMAND_QUERY_KEYS.DRONE_COMMANDS_BY_STATUS(status),
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
};

/**
 * 根據類型獲取指令的 Hook
 */
export const useDroneCommandsByType = (type: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: DRONE_COMMAND_QUERY_KEYS.DRONE_COMMANDS_BY_TYPE(type),
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
};

/**
 * 根據用戶 ID 獲取指令的 Hook
 */
export const useDroneCommandsByUserId = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: DRONE_COMMAND_QUERY_KEYS.DRONE_COMMANDS_BY_USER(userId),
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
};

/**
 * 根據日期範圍獲取指令的 Hook
 */
export const useDroneCommandsByDateRange = (dateRange: DateRangeQuery | null, enabled: boolean = true) => {
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
};

/**
 * 獲取無人機待執行指令的 Hook
 */
export const usePendingCommandsByDroneId = (droneId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: DRONE_COMMAND_QUERY_KEYS.PENDING_COMMANDS(droneId),
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
};

/**
 * 獲取無人機正在執行指令的 Hook
 */
export const useExecutingCommandByDroneId = (droneId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: DRONE_COMMAND_QUERY_KEYS.EXECUTING_COMMAND(droneId),
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
};

/**
 * 獲取最新指令的 Hook
 */
export const useLatestDroneCommands = () => {
  return useQuery({
    queryKey: DRONE_COMMAND_QUERY_KEYS.LATEST_COMMANDS,
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
};

/**
 * 獲取失敗指令的 Hook
 */
export const useFailedDroneCommands = () => {
  return useQuery({
    queryKey: DRONE_COMMAND_QUERY_KEYS.FAILED_COMMANDS,
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
};

/**
 * 獲取指令統計的 Hook
 */
export const useCommandStatistics = () => {
  return useQuery({
    queryKey: DRONE_COMMAND_QUERY_KEYS.COMMAND_STATISTICS,
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
};

/**
 * 獲取指令類型統計的 Hook
 */
export const useCommandTypeStatistics = () => {
  return useQuery({
    queryKey: DRONE_COMMAND_QUERY_KEYS.COMMAND_TYPE_STATISTICS,
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
};

/**
 * 獲取無人機指令摘要的 Hook
 */
export const useDroneCommandSummary = (droneId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: DRONE_COMMAND_QUERY_KEYS.DRONE_COMMAND_SUMMARY(droneId),
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
};