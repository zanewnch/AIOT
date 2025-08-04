/**
 * @fileoverview React Query hooks 用於無人機狀態歷史歸檔數據管理
 * 
 * 使用 React Query 處理所有與無人機狀態變更歷史相關的數據獲取、緩存和同步。
 * 提供強大的數據獲取、錯誤處理和背景更新功能。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';
import { DateRangeQuery } from '../types/droneCommand';
import type {
  DroneStatusArchive,
  CreateStatusArchiveRequest,
  UpdateStatusArchiveRequest,
  StatusTransitionQuery,
  StatusChangeStatistics,
} from '../types/droneStatusArchive';

/**
 * DroneStatusArchiveQuery - 無人機狀態歷史歸檔查詢服務類
 * 
 * 使用 class 封裝所有與無人機狀態變更歷史相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
export class DroneStatusArchiveQuery {
  public DRONE_STATUS_ARCHIVE_QUERY_KEYS: {
    readonly STATUS_ARCHIVES: readonly ['droneStatusArchive'];
    readonly STATUS_ARCHIVE_BY_ID: (id: string) => readonly ['droneStatusArchive', string];
    readonly STATUS_ARCHIVES_BY_DRONE_ID: (droneId: string) => readonly ['droneStatusArchive', 'drone', string];
    readonly STATUS_ARCHIVES_BY_STATUS: (status: string) => readonly ['droneStatusArchive', 'status', string];
    readonly STATUS_ARCHIVES_BY_USER: (userId: string) => readonly ['droneStatusArchive', 'user', string];
    readonly STATUS_ARCHIVES_BY_REASON: (reason: string) => readonly ['droneStatusArchive', 'reason', string];
    readonly LATEST_STATUS_ARCHIVES: readonly ['droneStatusArchive', 'latest'];
    readonly LATEST_STATUS_ARCHIVE_BY_DRONE: (droneId: string) => readonly ['droneStatusArchive', 'drone', string, 'latest'];
    readonly STATUS_ARCHIVES_BY_TRANSITION: readonly ['droneStatusArchive', 'transition'];
    readonly STATUS_CHANGE_STATISTICS: readonly ['droneStatusArchive', 'statistics'];
  };

  constructor() {
    this.DRONE_STATUS_ARCHIVE_QUERY_KEYS = {
      STATUS_ARCHIVES: ['droneStatusArchive'] as const,
      STATUS_ARCHIVE_BY_ID: (id: string) => ['droneStatusArchive', id] as const,
      STATUS_ARCHIVES_BY_DRONE_ID: (droneId: string) => ['droneStatusArchive', 'drone', droneId] as const,
      STATUS_ARCHIVES_BY_STATUS: (status: string) => ['droneStatusArchive', 'status', status] as const,
      STATUS_ARCHIVES_BY_USER: (userId: string) => ['droneStatusArchive', 'user', userId] as const,
      STATUS_ARCHIVES_BY_REASON: (reason: string) => ['droneStatusArchive', 'reason', reason] as const,
      LATEST_STATUS_ARCHIVES: ['droneStatusArchive', 'latest'] as const,
      LATEST_STATUS_ARCHIVE_BY_DRONE: (droneId: string) => ['droneStatusArchive', 'drone', droneId, 'latest'] as const,
      STATUS_ARCHIVES_BY_TRANSITION: ['droneStatusArchive', 'transition'] as const,
      STATUS_CHANGE_STATISTICS: ['droneStatusArchive', 'statistics'] as const,
    } as const;
  }

  /**
   * 基本查詢 - 獲取所有狀態歷史歸檔
   */
  useAll() {
    return useQuery({
      queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_ARCHIVES,
      queryFn: async (): Promise<DroneStatusArchive[]> => {
        const response = await apiClient.get('/api/drone-status-archive/data');
        const result = RequestResult.fromResponse<DroneStatusArchive[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
      },
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
  }

  /**
   * 獲取最新狀態歷史歸檔
   */
  useLatest() {
    return useQuery({
      queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.LATEST_STATUS_ARCHIVES,
      queryFn: async (): Promise<DroneStatusArchive[]> => {
        const response = await apiClient.get('/api/drone-status-archive/data/latest');
        const result = RequestResult.fromResponse<DroneStatusArchive[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
      },
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
      refetchInterval: 60 * 1000,
      refetchIntervalInBackground: true,
    });
  }

  /**
   * 獲取狀態變更統計
   */
  useStatistics() {
    return useQuery({
      queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_CHANGE_STATISTICS,
      queryFn: async (): Promise<StatusChangeStatistics> => {
        const response = await apiClient.get('/api/drone-status-archive/statistics');
        const result = RequestResult.fromResponse<StatusChangeStatistics>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
      },
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
      refetchInterval: 5 * 60 * 1000,
      refetchIntervalInBackground: true,
    });
  }
    
  /**
   * 參數化查詢 - 根據 ID 獲取狀態歷史歸檔
   */
  useById(id: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_ARCHIVE_BY_ID(id),
      queryFn: async (): Promise<DroneStatusArchive> => {
        const response = await apiClient.get(`/api/drone-status-archive/data/${id}`);
        const result = RequestResult.fromResponse<DroneStatusArchive>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
      },
      enabled: enabled && !!id,
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 根據無人機 ID 獲取狀態歷史歸檔
   */
  useByDroneId(droneId: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_ARCHIVES_BY_DRONE_ID(droneId),
      queryFn: async (): Promise<DroneStatusArchive[]> => {
        const response = await apiClient.get(`/api/drone-status-archive/data/drone/${droneId}`);
        const result = RequestResult.fromResponse<DroneStatusArchive[]>(response);
        
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

  /**
   * 根據狀態獲取歷史歸檔
   */
  useByStatus(status: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_ARCHIVES_BY_STATUS(status),
      queryFn: async (): Promise<DroneStatusArchive[]> => {
        const response = await apiClient.get(`/api/drone-status-archive/data/status/${status}`);
        const result = RequestResult.fromResponse<DroneStatusArchive[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
      },
      enabled: enabled && !!status,
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 根據創建者獲取狀態歷史歸檔
   */
  useByCreatedBy(userId: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_ARCHIVES_BY_USER(userId),
      queryFn: async (): Promise<DroneStatusArchive[]> => {
        const response = await apiClient.get(`/api/drone-status-archive/data/created-by/${userId}`);
        const result = RequestResult.fromResponse<DroneStatusArchive[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
      },
      enabled: enabled && !!userId,
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 根據原因獲取狀態歷史歸檔
   */
  useByReason(reason: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_ARCHIVES_BY_REASON(reason),
      queryFn: async (): Promise<DroneStatusArchive[]> => {
        const response = await apiClient.get(`/api/drone-status-archive/data/reason/${reason}`);
        const result = RequestResult.fromResponse<DroneStatusArchive[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
      },
      enabled: enabled && !!reason,
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 根據日期範圍獲取狀態歷史歸檔
   */
  useByDateRange(dateRange: DateRangeQuery | null, enabled: boolean = true) {
    return useQuery({
      queryKey: ['droneStatusArchive', 'dateRange', dateRange],
      queryFn: async (): Promise<DroneStatusArchive[]> => {
        const response = await apiClient.get('/api/drone-status-archive/data/date-range', { params: dateRange! });
        const result = RequestResult.fromResponse<DroneStatusArchive[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
      },
      enabled: enabled && !!dateRange,
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    });
  }

  /**
   * 獲取特定無人機最新狀態歷史歸檔
   */
  useLatestByDroneId(droneId: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.LATEST_STATUS_ARCHIVE_BY_DRONE(droneId),
      queryFn: async (): Promise<DroneStatusArchive | null> => {
        const response = await apiClient.get(`/api/drone-status-archive/data/drone/${droneId}/latest`);
        const result = RequestResult.fromResponse<DroneStatusArchive | null>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
      },
      enabled: enabled && !!droneId,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
      refetchInterval: 60 * 1000,
      refetchIntervalInBackground: true,
    });
  }

  /**
   * 根據狀態轉換查詢歷史歸檔
   */
  useByTransition(query: StatusTransitionQuery | null, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_ARCHIVES_BY_TRANSITION,
      queryFn: async (): Promise<DroneStatusArchive[]> => {
        const response = await apiClient.get('/api/drone-status-archive/data/transition', { params: query! });
        const result = RequestResult.fromResponse<DroneStatusArchive[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
      },
      enabled: enabled && !!query,
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    });
  }
    
  /**
   * 創建狀態歷史歸檔
   */
  useCreate() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (data: CreateStatusArchiveRequest): Promise<DroneStatusArchive> => {
        const response = await apiClient.post('/api/drone-status-archive/data', data);
        const result = RequestResult.fromResponse<DroneStatusArchive>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_ARCHIVES });
        queryClient.invalidateQueries({ queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.LATEST_STATUS_ARCHIVES });
        queryClient.invalidateQueries({ queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_CHANGE_STATISTICS });
        queryClient.invalidateQueries({ 
          queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_ARCHIVES_BY_DRONE_ID(data.droneId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.LATEST_STATUS_ARCHIVE_BY_DRONE(data.droneId) 
        });
      },
      retry: 2,
    });
  }

  /**
   * 更新狀態歷史歸檔
   */
  useUpdate() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: UpdateStatusArchiveRequest }): Promise<DroneStatusArchive> => {
        const response = await apiClient.put(`/api/drone-status-archive/data/${id}`, data);
        const result = RequestResult.fromResponse<DroneStatusArchive>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
      },
      onSuccess: (data, variables) => {
        queryClient.setQueryData(
          this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_ARCHIVE_BY_ID(variables.id),
          data
        );
        
        queryClient.invalidateQueries({ queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_ARCHIVES });
        queryClient.invalidateQueries({ 
          queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_ARCHIVES_BY_DRONE_ID(data.droneId) 
        });
      },
      retry: 2,
    });
  }

  /**
   * 刪除狀態歷史歸檔
   */
  useDelete() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (id: string): Promise<void> => {
        const response = await apiClient.delete(`/api/drone-status-archive/data/${id}`);
        const result = RequestResult.fromResponse(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
      },
      onSuccess: (_, id) => {
        queryClient.removeQueries({ queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_ARCHIVE_BY_ID(id) });
        queryClient.invalidateQueries({ queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_ARCHIVES });
        queryClient.invalidateQueries({ queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.LATEST_STATUS_ARCHIVES });
        queryClient.invalidateQueries({ queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_CHANGE_STATISTICS });
      },
      retry: 2,
    });
  }
}



