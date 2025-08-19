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
import { ReqResult } from '../utils/ReqResult';
import { DateRangeQuery } from '../types/droneCommand';
import type {
  DroneStatusArchive,
  CreateStatusArchiveRequest,
  UpdateStatusArchiveRequest,
  StatusTransitionQuery,
  StatusChangeStatistics,
} from '../types/droneStatusArchive';
import type { TableError } from '../types/table';
import { createLogger } from '../configs/loggerConfig';

const logger = createLogger('useDroneStatusArchiveQuery');

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
   * 
   * 獲取系統中所有無人機狀態變更的歷史歸檔記錄
   * 包含狀態轉換、變更原因、時間戳等詳細信息
   * 
   * @returns React Query 結果物件，包含所有狀態歷史歸檔數據
   * 
   * @example
   * ```typescript
   * const statusArchiveQuery = new DroneStatusArchiveQuery();
   * const { data: archives, isLoading } = statusArchiveQuery.useAll();
   * 
   * return (
   *   <StatusArchiveTable 
   *     data={archives} 
   *     loading={isLoading}
   *   />
   * );
   * ```
   * 
   * @throws {TableError} 當 API 請求失敗時拋出錯誤
   */
  useAll() {
    return useQuery({
      queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_ARCHIVES,
      queryFn: async (): Promise<DroneStatusArchive[]> => {
        try {
          const response = await apiClient.get('/drone/statuses/archive');
          const result = ReqResult.fromResponse<DroneStatusArchive[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to fetch all status archives', { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch all status archives',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
  }

  /**
   * 獲取最新狀態歷史歸檔
   * 
   * 獲取最近的無人機狀態變更記錄，支援自動刷新
   * 用於系統監控和即時狀態追蹤
   * 
   * @returns React Query 結果物件，包含最新狀態歷史歸檔數據
   * 
   * @example
   * ```typescript
   * const statusArchiveQuery = new DroneStatusArchiveQuery();
   * const { data: latestArchives } = statusArchiveQuery.useLatest();
   * 
   * return (
   *   <LatestStatusPanel archives={latestArchives} />
   * );
   * ```
   * 
   * @throws {TableError} 當 API 請求失敗時拋出錯誤
   */
  useLatest() {
    return useQuery({
      queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.LATEST_STATUS_ARCHIVES,
      queryFn: async (): Promise<DroneStatusArchive[]> => {
        try {
          const response = await apiClient.get('/drone/statuses/archive');
          const result = ReqResult.fromResponse<DroneStatusArchive[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to fetch latest status archives', { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch latest status archives',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
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
   * 
   * 獲取無人機狀態變更的統計數據，包括變更次數、狀態分佈等
   * 支援定時刷新，用於系統狀態分析和報告
   * 
   * @returns React Query 結果物件，包含狀態變更統計數據
   * 
   * @example
   * ```typescript
   * const statusArchiveQuery = new DroneStatusArchiveQuery();
   * const { data: stats } = statusArchiveQuery.useStatistics();
   * 
   * return (
   *   <StatusStatisticsChart 
   *     totalChanges={stats.totalChanges}
   *     statusDistribution={stats.statusDistribution}
   *     mostActiveHour={stats.mostActiveHour}
   *   />
   * );
   * ```
   * 
   * @throws {TableError} 當統計數據獲取失敗時拋出錯誤
   */
  useStatistics() {
    return useQuery({
      queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_CHANGE_STATISTICS,
      queryFn: async (): Promise<StatusChangeStatistics> => {
        try {
          const response = await apiClient.get('/drone/statuses/archive/statistics');
          const result = ReqResult.fromResponse<StatusChangeStatistics>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to fetch status change statistics', { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch status change statistics',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
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
   * 
   * 使用唯一識別碼獲取特定狀態變更記錄的詳細信息
   * 支援條件性啟用查詢，用於優化效能
   * 
   * @param id - 狀態歸檔的唯一識別碼
   * @param enabled - 是否啟用查詢，默認為 true
   * @returns React Query 結果物件，包含特定狀態歸檔數據
   * 
   * @example
   * ```typescript
   * const statusArchiveQuery = new DroneStatusArchiveQuery();
   * const selectedId = 'archive-123';
   * const { data: archive } = statusArchiveQuery.useById(
   *   selectedId,
   *   !!selectedId
   * );
   * 
   * if (!archive) return null;
   * return <StatusArchiveDetail archive={archive} />;
   * ```
   * 
   * @throws {TableError} 當歸檔不存在或查詢失敗時拋出錯誤
   */
  useById(id: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_STATUS_ARCHIVE_QUERY_KEYS.STATUS_ARCHIVE_BY_ID(id),
      queryFn: async (): Promise<DroneStatusArchive> => {
        try {
          const response = await apiClient.get(`/drone/statuses/archive/${id}`);
          const result = ReqResult.fromResponse<DroneStatusArchive>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch status archive with ID: ${id}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch status archive with ID: ${id}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
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
        try {
          const response = await apiClient.get(`/drone/statuses/archive/drone/${droneId}`);
          const result = ReqResult.fromResponse<DroneStatusArchive[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch status archives for drone ID: ${droneId}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch status archives for drone ID: ${droneId}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
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
        try {
          const response = await apiClient.get(`/drone/statuses/archive/drone/${status}`);
          const result = ReqResult.fromResponse<DroneStatusArchive[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch status archives with status: ${status}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch status archives with status: ${status}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
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
        try {
          const response = await apiClient.get(`/drone/statuses/archive/drone/${userId}`);
          const result = ReqResult.fromResponse<DroneStatusArchive[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch status archives for user ID: ${userId}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch status archives for user ID: ${userId}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
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
        try {
          const response = await apiClient.get(`/drone/statuses/archive/drone/${reason}`);
          const result = ReqResult.fromResponse<DroneStatusArchive[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch status archives with reason: ${reason}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch status archives with reason: ${reason}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
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
        try {
          const response = await apiClient.get('/drone/statuses/archive/time-range', { params: dateRange! });
          const result = ReqResult.fromResponse<DroneStatusArchive[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to fetch status archives by date range', { error, dateRange });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch status archives by date range',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
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
        try {
          const response = await apiClient.get(`/drone/statuses/archive/drone/${droneId}`);
          const result = ReqResult.fromResponse<DroneStatusArchive | null>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch latest status archive for drone ID: ${droneId}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch latest status archive for drone ID: ${droneId}`,
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
        try {
          const response = await apiClient.get('/drone/statuses/archive', { params: query! });
          const result = ReqResult.fromResponse<DroneStatusArchive[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to fetch status archives by transition', { error, query });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch status archives by transition',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && !!query,
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
    });
  }
    
  /**
   * 創建狀態歷史歸檔
   * 
   * 創建新的無人機狀態變更記錄，記錄狀態轉換詳細信息
   * 成功創建後會自動刷新相關查詢緩存
   * 
   * @returns React Query mutation 物件，用於創建狀態歸檔
   * 
   * @example
   * ```typescript
   * const statusArchiveQuery = new DroneStatusArchiveQuery();
   * const createArchiveMutation = statusArchiveQuery.useCreate();
   * 
   * const handleStatusChange = async () => {
   *   try {
   *     const newArchive = await createArchiveMutation.mutateAsync({
   *       droneId: 'DRONE_001',
   *       fromStatus: 'idle',
   *       toStatus: 'flying',
   *       reason: '開始巡邏任務',
   *       changedBy: 'admin',
   *       metadata: { mission_id: 'PATROL_001' }
   *     });
   *     console.log('狀態變更記錄已創建:', newArchive);
   *   } catch (error) {
   *     console.error('創建失敗:', error);
   *   }
   * };
   * ```
   * 
   * @throws {TableError} 當創建請求失敗時拋出錯誤
   */
  useCreate() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (data: CreateStatusArchiveRequest): Promise<DroneStatusArchive> => {
        try {
          const response = await apiClient.post('/drone/statuses/archive', data);
          const result = ReqResult.fromResponse<DroneStatusArchive>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to create status archive', { error, data });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to create status archive',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
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
        try {
          const response = await apiClient.put(`/drone/statuses/archive/${id}`, data);
          const result = ReqResult.fromResponse<DroneStatusArchive>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to update status archive with ID: ${id}`, { error, data });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to update status archive with ID: ${id}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
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
        try {
          const response = await apiClient.delete(`/drone/statuses/archive/${id}`);
          const result = ReqResult.fromResponse(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
        } catch (error: any) {
          logger.error(`Failed to delete status archive with ID: ${id}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to delete status archive with ID: ${id}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
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

/**
 * 全局實例和便利 hooks
 */
export const droneStatusArchiveQuery = new DroneStatusArchiveQuery();
export const useDroneStatusArchiveQuery = () => droneStatusArchiveQuery;
export const useAllStatusArchives = () => droneStatusArchiveQuery.useAll();
export const useLatestStatusArchives = () => droneStatusArchiveQuery.useLatest();
export const useStatusArchiveById = (id: string) => droneStatusArchiveQuery.useById(id);
export const useCreateStatusArchive = () => droneStatusArchiveQuery.useCreate();
export const useUpdateStatusArchive = () => droneStatusArchiveQuery.useUpdate();
export const useDeleteStatusArchive = () => droneStatusArchiveQuery.useDelete();