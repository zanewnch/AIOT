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
import type { TableError } from '../types/table';
import { createLogger } from '../configs/loggerConfig';

const logger = createLogger('useDroneStatusQuery');

/**
 * DroneStatusQuery - 無人機狀態查詢服務類
 * 
 * 使用 class 封裝所有與無人機狀態相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
export class DroneStatusQuery {
  
  public DRONE_STATUS_QUERY_KEYS = {
    DRONE_STATUSES: ['droneStatuses'] as const,
    DRONE_STATUS_BY_ID: (id: string) => ['droneStatus', id] as const,
    DRONE_STATUS_BY_SERIAL: (serial: string) => ['droneStatus', 'serial', serial] as const,
    DRONES_BY_STATUS: (status: string) => ['droneStatuses', 'status', status] as const,
    DRONES_BY_OWNER: (ownerId: string) => ['droneStatuses', 'owner', ownerId] as const,
    DRONES_BY_MANUFACTURER: (manufacturer: string) => ['droneStatuses', 'manufacturer', manufacturer] as const,
    DRONE_STATUS_STATISTICS: ['droneStatuses', 'statistics'] as const,
  } as const;
  
  constructor() {}
  
  /**
   * 獲取所有無人機狀態的 Hook - 優化版本，支持背景即時更新
   */
  useAll() {
    return useQuery({
      queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONE_STATUSES,
      queryFn: async (): Promise<DroneStatus[]> => {
        try {
          const response = await apiClient.get('/api/drone/statuses/data');
          const result = RequestResult.fromResponse<DroneStatus[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to fetch all drone statuses', { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch all drone statuses',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 10 * 1000, // 10秒後認為過期 (優化: 從30秒降至10秒)
      gcTime: 5 * 60 * 1000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 🚀 背景更新優化
      refetchInterval: 5 * 1000, // 每5秒背景更新
      refetchIntervalInBackground: true, // 頁面不在前台時也更新
      refetchOnWindowFocus: true, // 頁面重新獲得焦點時更新
      refetchOnReconnect: true, // 網路重連時更新
      refetchOnMount: 'always', // 組件掛載時總是重新獲取
    });
  }

  /**
   * 根據 ID 獲取無人機狀態的 Hook
   */
  useById(id: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_BY_ID(id),
      queryFn: async (): Promise<DroneStatus> => {
        try {
          const response = await apiClient.get(`/api/drone/statuses/data/${id}`);
          const result = RequestResult.fromResponse<DroneStatus>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch drone status with ID: ${id}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch drone status with ID: ${id}`,
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
   * 根據序號獲取無人機狀態的 Hook
   */
  useBySerial(serial: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_BY_SERIAL(serial),
      queryFn: async (): Promise<DroneStatus> => {
        try {
          const response = await apiClient.get(`/api/drone/statuses/data/serial/${serial}`);
          const result = RequestResult.fromResponse<DroneStatus>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch drone status with serial: ${serial}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch drone status with serial: ${serial}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && !!serial,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 根據狀態獲取無人機列表的 Hook - 優化版本，加強即時性
   */
  useByStatus(status: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONES_BY_STATUS(status),
      queryFn: async (): Promise<DroneStatus[]> => {
        try {
          const response = await apiClient.get(`/api/drone/statuses/data/status/${status}`);
          const result = RequestResult.fromResponse<DroneStatus[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch drone statuses with status: ${status}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch drone statuses with status: ${status}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && !!status,
      staleTime: 5 * 1000, // 5秒過期 (優化: 從30秒降至5秒)
      gcTime: 5 * 60 * 1000,
      retry: 3,
      // 🚀 加強背景更新
      refetchInterval: 3 * 1000, // 每3秒更新 (優化: 從60秒降至3秒)
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: 'always',
    });
  }

  /**
   * 根據擁有者獲取無人機列表的 Hook
   */
  useByOwner(ownerId: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONES_BY_OWNER(ownerId),
      queryFn: async (): Promise<DroneStatus[]> => {
        try {
          const response = await apiClient.get(`/api/drone/statuses/data/owner/${ownerId}`);
          const result = RequestResult.fromResponse<DroneStatus[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch drone statuses for owner ID: ${ownerId}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch drone statuses for owner ID: ${ownerId}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && !!ownerId,
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 根據製造商獲取無人機列表的 Hook
   */
  useByManufacturer(manufacturer: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONES_BY_MANUFACTURER(manufacturer),
      queryFn: async (): Promise<DroneStatus[]> => {
        try {
          const response = await apiClient.get(`/api/drone/statuses/data/manufacturer/${manufacturer}`);
          const result = RequestResult.fromResponse<DroneStatus[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch drone statuses by manufacturer: ${manufacturer}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch drone statuses by manufacturer: ${manufacturer}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && !!manufacturer,
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 獲取無人機狀態統計的 Hook
   */
  useStatistics() {
    return useQuery({
      queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_STATISTICS,
      queryFn: async (): Promise<DroneStatusStatistics> => {
        try {
          const response = await apiClient.get('/api/drone/statuses/statistics');
          const result = RequestResult.fromResponse<DroneStatusStatistics>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to fetch drone status statistics', { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch drone status statistics',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
      refetchInterval: 2 * 60 * 1000,
      refetchIntervalInBackground: true,
    });
  }

  /**
   * 創建無人機狀態的 Mutation Hook
   */
  useCreate() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (data: CreateDroneStatusRequest): Promise<DroneStatus> => {
        try {
          const response = await apiClient.post('/api/drone/statuses/data', data);
          const result = RequestResult.fromResponse<DroneStatus>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to create drone status', { error, data });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to create drone status',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONE_STATUSES });
        queryClient.invalidateQueries({ queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_STATISTICS });
        queryClient.invalidateQueries({ 
          queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONES_BY_OWNER(data.ownerId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONES_BY_MANUFACTURER(data.manufacturer) 
        });
      },
      retry: 2,
    });
  }

  /**
   * 更新無人機狀態的 Mutation Hook
   */
  useUpdate() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: UpdateDroneStatusRequest }): Promise<DroneStatus> => {
        try {
          const response = await apiClient.put(`/api/drone/statuses/data/${id}`, data);
          const result = RequestResult.fromResponse<DroneStatus>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to update drone status with ID: ${id}`, { error, data });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to update drone status with ID: ${id}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data, variables) => {
        queryClient.setQueryData(
          this.DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_BY_ID(variables.id),
          data
        );
        
        queryClient.invalidateQueries({ queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONE_STATUSES });
        queryClient.invalidateQueries({ queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_STATISTICS });
        queryClient.invalidateQueries({ 
          queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONES_BY_OWNER(data.ownerId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONES_BY_STATUS(data.status) 
        });
      },
      retry: 2,
    });
  }

  /**
   * 只更新無人機狀態的 Mutation Hook
   */
  useUpdateStatusOnly() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: UpdateDroneStatusOnlyRequest }): Promise<DroneStatus> => {
        try {
          const response = await apiClient.patch(`/api/drone/statuses/data/${id}/status`, data);
          const result = RequestResult.fromResponse<DroneStatus>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to update drone status only with ID: ${id}`, { error, data });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to update drone status only with ID: ${id}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data, variables) => {
        queryClient.setQueryData(
          this.DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_BY_ID(variables.id),
          data
        );
        
        queryClient.invalidateQueries({ queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONE_STATUSES });
        queryClient.invalidateQueries({ queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_STATISTICS });
        queryClient.invalidateQueries({ 
          queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONES_BY_STATUS(data.status) 
        });
      },
      retry: 2,
    });
  }

  /**
   * 刪除無人機狀態的 Mutation Hook
   */
  useDelete() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (id: string): Promise<void> => {
        try {
          const response = await apiClient.delete(`/api/drone/statuses/data/${id}`);
          const result = RequestResult.fromResponse(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
        } catch (error: any) {
          logger.error(`Failed to delete drone status with ID: ${id}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to delete drone status with ID: ${id}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (_, id) => {
        queryClient.removeQueries({ queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_BY_ID(id) });
        queryClient.invalidateQueries({ queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONE_STATUSES });
        queryClient.invalidateQueries({ queryKey: this.DRONE_STATUS_QUERY_KEYS.DRONE_STATUS_STATISTICS });
      },
      retry: 2,
    });
  }
}