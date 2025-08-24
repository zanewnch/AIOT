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
import { resUtilsInstance } from '../utils/ResUtils';
import { ReqResult } from '@/utils';
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
   * 獲取無人機狀態分頁列表的 Hook - 安全版本，使用分頁查詢
   */
  getAllDroneStatuses(page: number = 1, pageSize: number = 20, sortBy: string = 'id', sortOrder: 'ASC' | 'DESC' = 'DESC') {
    return useQuery({
      queryKey: [...this.DRONE_STATUS_QUERY_KEYS.DRONE_STATUSES, page, pageSize, sortBy, sortOrder],
      queryFn: async (): Promise<any> => {
        try {
          const response = await resUtilsInstance.get('/drone/statuses', {
            params: { page, pageSize, sortBy, sortOrder }
          });
          const result = ReqResult.fromResponse<any>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to fetch drone statuses with pagination', { error, page, pageSize });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch drone statuses with pagination',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 10 * 1000, // 10秒後認為過期
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
          const response = await resUtilsInstance.get(`/drone/statuses/${id}`);
          const result = ReqResult.fromResponse<DroneStatus>(response);
          
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
          const response = await resUtilsInstance.get(`/drone/statuses/drone/${serial}`);
          const result = ReqResult.fromResponse<DroneStatus>(response);
          
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
          const response = await resUtilsInstance.get(`/drone/statuses/drone/${status}`);
          const result = ReqResult.fromResponse<DroneStatus[]>(response);
          
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
          const response = await resUtilsInstance.get(`/drone/statuses/drone/${ownerId}`);
          const result = ReqResult.fromResponse<DroneStatus[]>(response);
          
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
          const response = await resUtilsInstance.get(`/drone/statuses/drone/${manufacturer}`);
          const result = ReqResult.fromResponse<DroneStatus[]>(response);
          
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
          const response = await resUtilsInstance.get('/drone/statuses/statistics');
          const result = ReqResult.fromResponse<DroneStatusStatistics>(response);
          
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
          const response = await resUtilsInstance.post('/drone/statuses', data);
          const result = ReqResult.fromResponse<DroneStatus>(response);
          
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
          const response = await resUtilsInstance.put(`/drone/statuses/${id}`, data);
          const result = ReqResult.fromResponse<DroneStatus>(response);
          
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
          const response = await resUtilsInstance.patch(`/drone/statuses/${id}`, data);
          const result = ReqResult.fromResponse<DroneStatus>(response);
          
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
          const response = await resUtilsInstance.delete(`/drone/statuses/${id}`);
          const result = ReqResult.fromResponse(response);
          
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

/**
 * 全局 DroneStatusQuery 實例
 * 
 * 提供統一的無人機狀態查詢服務實例
 * 
 * @example
 * ```typescript
 * import { droneStatusQuery } from './useDroneStatusQuery';
 * 
 * const droneStatuses = droneStatusQuery.useDroneStatuses(1, 20);
 * ```
 */
export const droneStatusQuery = new DroneStatusQuery();

/**
 * 主要的便利 hook - 返回查詢類實例
 */
export const useDroneStatusQuery = () => droneStatusQuery;

/**
 * 獲取無人機狀態分頁列表的 Hook
 * 
 * @param {number} page - 頁碼，預設為 1
 * @param {number} pageSize - 每頁數量，預設為 20
 * @param {string} sortBy - 排序欄位，預設為 'id'
 * @param {'ASC' | 'DESC'} sortOrder - 排序方向，預設為 'DESC'
 * @returns {UseQueryResult<any, TableError>} React Query 結果對象
 * 
 * @example
 * ```typescript
 * const { data: droneStatusesPage, isLoading, error } = useDroneStatuses(1, 20);
 * ```
 */
export const useAllDroneStatuses = (page?: number, pageSize?: number, sortBy?: string, sortOrder?: 'ASC' | 'DESC') => {
  return droneStatusQuery.getAllDroneStatuses(page, pageSize, sortBy, sortOrder);
};

/**
 * 根據 ID 獲取無人機狀態的 Hook
 * 
 * @param {string} id - 無人機狀態 ID
 * @param {boolean} enabled - 是否啟用查詢，預設為 true
 * @returns {UseQueryResult<DroneStatus, TableError>} React Query 結果對象
 * 
 * @example
 * ```typescript
 * const { data: droneStatus, isLoading } = useDroneStatusById('drone-001');
 * ```
 */
export const useDroneStatusById = (id: string, enabled?: boolean) => {
  return droneStatusQuery.useById(id, enabled);
};

/**
 * 根據序號獲取無人機狀態的 Hook
 * 
 * @param {string} serial - 無人機序號
 * @param {boolean} enabled - 是否啟用查詢，預設為 true
 * @returns {UseQueryResult<DroneStatus, TableError>} React Query 結果對象
 * 
 * @example
 * ```typescript
 * const { data: droneStatus } = useDroneStatusBySerial('SN001');
 * ```
 */
export const useDroneStatusBySerial = (serial: string, enabled?: boolean) => {
  return droneStatusQuery.useBySerial(serial, enabled);
};

/**
 * 根據狀態獲取無人機列表的 Hook
 * 
 * @param {string} status - 無人機狀態
 * @param {boolean} enabled - 是否啟用查詢，預設為 true
 * @returns {UseQueryResult<DroneStatus[], TableError>} React Query 結果對象
 * 
 * @example
 * ```typescript
 * const { data: activeDrones } = useDroneStatusByStatus('active');
 * ```
 */
export const useDroneStatusByStatus = (status: string, enabled?: boolean) => {
  return droneStatusQuery.useByStatus(status, enabled);
};

/**
 * 根據擁有者獲取無人機列表的 Hook
 * 
 * @param {string} ownerId - 擁有者 ID
 * @param {boolean} enabled - 是否啟用查詢，預設為 true
 * @returns {UseQueryResult<DroneStatus[], TableError>} React Query 結果對象
 * 
 * @example
 * ```typescript
 * const { data: userDrones } = useDroneStatusByOwner('user-123');
 * ```
 */
export const useDroneStatusByOwner = (ownerId: string, enabled?: boolean) => {
  return droneStatusQuery.useByOwner(ownerId, enabled);
};

/**
 * 根據製造商獲取無人機列表的 Hook
 * 
 * @param {string} manufacturer - 製造商名稱
 * @param {boolean} enabled - 是否啟用查詢，預設為 true
 * @returns {UseQueryResult<DroneStatus[], TableError>} React Query 結果對象
 * 
 * @example
 * ```typescript
 * const { data: djiDrones } = useDroneStatusByManufacturer('DJI');
 * ```
 */
export const useDroneStatusByManufacturer = (manufacturer: string, enabled?: boolean) => {
  return droneStatusQuery.useByManufacturer(manufacturer, enabled);
};

/**
 * 獲取無人機狀態統計的 Hook
 * 
 * @returns {UseQueryResult<DroneStatusStatistics, TableError>} React Query 結果對象
 * 
 * @example
 * ```typescript
 * const { data: stats } = useDroneStatusStatistics();
 * console.log('總無人機數:', stats?.totalDrones);
 * ```
 */
export const useDroneStatusStatistics = () => {
  return droneStatusQuery.useStatistics();
};

/**
 * 創建無人機狀態的 Mutation Hook
 * 
 * @returns {UseMutationResult<DroneStatus, TableError, CreateDroneStatusRequest>} React Query Mutation 結果對象
 * 
 * @example
 * ```typescript
 * const createDroneStatusMutation = useCreateDroneStatus();
 * 
 * const handleCreate = async () => {
 *   try {
 *     const newDroneStatus = await createDroneStatusMutation.mutateAsync({
 *       serialNumber: 'SN001',
 *       name: '無人機 001',
 *       model: 'Model X',
 *       manufacturer: 'DJI',
 *       ownerId: 'user-123'
 *     });
 *     console.log('創建成功:', newDroneStatus);
 *   } catch (error) {
 *     console.error('創建失敗:', error);
 *   }
 * };
 * ```
 */
export const useCreateDroneStatus = () => {
  return droneStatusQuery.useCreate();
};

/**
 * 更新無人機狀態的 Mutation Hook
 * 
 * @returns {UseMutationResult<DroneStatus, TableError, {id: string, data: UpdateDroneStatusRequest}>} React Query Mutation 結果對象
 * 
 * @example
 * ```typescript
 * const updateDroneStatusMutation = useUpdateDroneStatus();
 * 
 * const handleUpdate = async (id: string, data: UpdateDroneStatusRequest) => {
 *   try {
 *     const updatedDroneStatus = await updateDroneStatusMutation.mutateAsync({ id, data });
 *     console.log('更新成功:', updatedDroneStatus);
 *   } catch (error) {
 *     console.error('更新失敗:', error);
 *   }
 * };
 * ```
 */
export const useUpdateDroneStatus = () => {
  return droneStatusQuery.useUpdate();
};

/**
 * 只更新無人機狀態的 Mutation Hook
 * 
 * @returns {UseMutationResult<DroneStatus, TableError, {id: string, data: UpdateDroneStatusOnlyRequest}>} React Query Mutation 結果對象
 * 
 * @example
 * ```typescript
 * const updateStatusOnlyMutation = useUpdateDroneStatusOnly();
 * 
 * const handleStatusUpdate = async (id: string, status: string, batteryLevel?: number) => {
 *   try {
 *     const result = await updateStatusOnlyMutation.mutateAsync({ 
 *       id, 
 *       data: { status, batteryLevel }
 *     });
 *     console.log('狀態更新成功:', result);
 *   } catch (error) {
 *     console.error('狀態更新失敗:', error);
 *   }
 * };
 * ```
 */
export const useUpdateDroneStatusOnly = () => {
  return droneStatusQuery.useUpdateStatusOnly();
};

/**
 * 刪除無人機狀態的 Mutation Hook
 * 
 * @returns {UseMutationResult<void, TableError, string>} React Query Mutation 結果對象
 * 
 * @example
 * ```typescript
 * const deleteDroneStatusMutation = useDeleteDroneStatus();
 * 
 * const handleDelete = async (id: string) => {
 *   if (confirm('確定要刪除此無人機狀態嗎？')) {
 *     try {
 *       await deleteDroneStatusMutation.mutateAsync(id);
 *       console.log('刪除成功');
 *     } catch (error) {
 *       console.error('刪除失敗:', error);
 *     }
 *   }
 * };
 * ```
 */
export const useDeleteDroneStatus = () => {
  return droneStatusQuery.useDelete();
};