/**
 * @fileoverview React Query hooks 用於無人機狀態數據管理
 * 
 * 使用 React Query 處理所有與無人機狀態相關的數據獲取、緩存和同步。
 * 提供強大的數據獲取、錯誤處理和背景更新功能。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';
import {
  DroneStatus,
  CreateDroneStatusRequest,
  UpdateDroneStatusRequest,
  UpdateDroneStatusOnlyRequest,
  DroneStatusStatistics,
} from '../types/droneStatus';

/**
 * React Query 查詢鍵常量
 */
export const DRONE_STATUS_QUERY_KEYS = {
  DRONE_STATUSES: ['droneStatuses'] as const,
  DRONE_STATUS_BY_ID: (id: string) => ['droneStatus', id] as const,
  DRONE_STATUS_BY_SERIAL: (serial: string) => ['droneStatus', 'serial', serial] as const,
  DRONES_BY_STATUS: (status: string) => ['droneStatuses', 'status', status] as const,
  DRONES_BY_OWNER: (ownerId: string) => ['droneStatuses', 'owner', ownerId] as const,
  DRONES_BY_MANUFACTURER: (manufacturer: string) => ['droneStatuses', 'manufacturer', manufacturer] as const,
  DRONE_STATUS_STATISTICS: ['droneStatuses', 'statistics'] as const,
} as const;



/**
 * 獲取所有無人機狀態的 Hook
 */
export const useDroneStatuses = () => {
  return useQuery({
    queryKey: DRONE_STATUS_QUERY_KEYS.DRONE_STATUSES,
    queryFn: async (): Promise<DroneStatus[]> => {
      const response = await apiClient.get('/api/drone-status/data');
      const result = RequestResult.fromResponse<DroneStatus[]>(response);
      
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
 * 根據 ID 獲取無人機狀態的 Hook
 */
export const useDroneStatusById = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_BY_ID(id),
    queryFn: async (): Promise<DroneStatus> => {
      const response = await apiClient.get(`/api/drone-status/data/${id}`);
      const result = RequestResult.fromResponse<DroneStatus>(response);
      
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
 * 根據序號獲取無人機狀態的 Hook
 */
export const useDroneStatusBySerial = (serial: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_BY_SERIAL(serial),
    queryFn: async (): Promise<DroneStatus> => {
      const response = await apiClient.get(`/api/drone-status/data/serial/${serial}`);
      const result = RequestResult.fromResponse<DroneStatus>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    enabled: enabled && !!serial,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 3,
  });
};

/**
 * 根據狀態獲取無人機列表的 Hook
 */
export const useDronesByStatus = (status: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: DRONE_STATUS_QUERY_KEYS.DRONES_BY_STATUS(status),
    queryFn: async (): Promise<DroneStatus[]> => {
      const response = await apiClient.get(`/api/drone-status/data/status/${status}`);
      const result = RequestResult.fromResponse<DroneStatus[]>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    enabled: enabled && !!status,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 3,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
  });
};

/**
 * 根據擁有者獲取無人機列表的 Hook
 */
export const useDronesByOwner = (ownerId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: DRONE_STATUS_QUERY_KEYS.DRONES_BY_OWNER(ownerId),
    queryFn: async (): Promise<DroneStatus[]> => {
      const response = await apiClient.get(`/api/drone-status/data/owner/${ownerId}`);
      const result = RequestResult.fromResponse<DroneStatus[]>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    enabled: enabled && !!ownerId,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
  });
};

/**
 * 根據製造商獲取無人機列表的 Hook
 */
export const useDronesByManufacturer = (manufacturer: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: DRONE_STATUS_QUERY_KEYS.DRONES_BY_MANUFACTURER(manufacturer),
    queryFn: async (): Promise<DroneStatus[]> => {
      const response = await apiClient.get(`/api/drone-status/data/manufacturer/${manufacturer}`);
      const result = RequestResult.fromResponse<DroneStatus[]>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    enabled: enabled && !!manufacturer,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
  });
};

/**
 * 獲取無人機狀態統計的 Hook
 */
export const useDroneStatusStatistics = () => {
  return useQuery({
    queryKey: DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_STATISTICS,
    queryFn: async (): Promise<DroneStatusStatistics> => {
      const response = await apiClient.get('/api/drone-status/statistics');
      const result = RequestResult.fromResponse<DroneStatusStatistics>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    refetchInterval: 2 * 60 * 1000,
    refetchIntervalInBackground: true,
  });
};

/**
 * 創建無人機狀態的 Mutation Hook
 */
export const useCreateDroneStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDroneStatusRequest): Promise<DroneStatus> => {
      const response = await apiClient.post('/api/drone-status/data', data);
      const result = RequestResult.fromResponse<DroneStatus>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: DRONE_STATUS_QUERY_KEYS.DRONE_STATUSES });
      queryClient.invalidateQueries({ queryKey: DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_STATISTICS });
      queryClient.invalidateQueries({ 
        queryKey: DRONE_STATUS_QUERY_KEYS.DRONES_BY_OWNER(data.ownerId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: DRONE_STATUS_QUERY_KEYS.DRONES_BY_MANUFACTURER(data.manufacturer) 
      });
    },
    retry: 2,
  });
};

/**
 * 更新無人機狀態的 Mutation Hook
 */
export const useUpdateDroneStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDroneStatusRequest }): Promise<DroneStatus> => {
      const response = await apiClient.put(`/api/drone-status/data/${id}`, data);
      const result = RequestResult.fromResponse<DroneStatus>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_BY_ID(variables.id),
        data
      );
      
      queryClient.invalidateQueries({ queryKey: DRONE_STATUS_QUERY_KEYS.DRONE_STATUSES });
      queryClient.invalidateQueries({ queryKey: DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_STATISTICS });
      queryClient.invalidateQueries({ 
        queryKey: DRONE_STATUS_QUERY_KEYS.DRONES_BY_OWNER(data.ownerId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: DRONE_STATUS_QUERY_KEYS.DRONES_BY_STATUS(data.status) 
      });
    },
    retry: 2,
  });
};

/**
 * 只更新無人機狀態的 Mutation Hook
 */
export const useUpdateDroneStatusOnly = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDroneStatusOnlyRequest }): Promise<DroneStatus> => {
      const response = await apiClient.patch(`/api/drone-status/data/${id}/status`, data);
      const result = RequestResult.fromResponse<DroneStatus>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_BY_ID(variables.id),
        data
      );
      
      queryClient.invalidateQueries({ queryKey: DRONE_STATUS_QUERY_KEYS.DRONE_STATUSES });
      queryClient.invalidateQueries({ queryKey: DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_STATISTICS });
      queryClient.invalidateQueries({ 
        queryKey: DRONE_STATUS_QUERY_KEYS.DRONES_BY_STATUS(data.status) 
      });
    },
    retry: 2,
  });
};

/**
 * 刪除無人機狀態的 Mutation Hook
 */
export const useDeleteDroneStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await apiClient.delete(`/api/drone-status/data/${id}`);
      const result = RequestResult.fromResponse(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_BY_ID(id) });
      queryClient.invalidateQueries({ queryKey: DRONE_STATUS_QUERY_KEYS.DRONE_STATUSES });
      queryClient.invalidateQueries({ queryKey: DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_STATISTICS });
    },
    retry: 2,
  });
};