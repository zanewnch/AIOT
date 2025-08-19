/**
 * @fileoverview React Query hooks 用於無人機位置歷史歸檔數據管理
 * 
 * 使用 React Query 處理所有與無人機位置歷史歸檔相關的數據獲取、緩存和同步。
 * 提供強大的數據獲取、錯誤處理和背景更新功能。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { ReqResult } from '../utils/ReqResult';
import {
  DronePositionArchive,
  CreatePositionArchiveRequest,
  BulkCreatePositionArchivesRequest,
  TimeRangeQuery,
  GeoBoundsQuery,
  TrajectoryQuery,
  TrajectoryStatistics,
  BatteryUsageStatistics,
  PositionDistributionStatistics,
  FlightPatterns,
  AnomalousPositions,
  TrajectorySummaryReport,
} from '../types/dronePositionsArchive';
import type { TableError } from '../types/table';
import { createLogger } from '../configs/loggerConfig';

const logger = createLogger('useDronePositionsArchiveQuery');

/**
 * DronePositionsArchiveQuery - 無人機位置歷史歸檔查詢服務類
 * 
 * 使用 class 封裝所有與無人機位置歷史歸檔相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
export class DronePositionsArchiveQuery {
  public DRONE_POSITIONS_ARCHIVE_QUERY_KEYS: {
    readonly POSITION_ARCHIVES: readonly ['dronePositionsArchive'];
    readonly POSITION_ARCHIVE_BY_ID: (id: string) => readonly ['dronePositionsArchive', string];
    readonly POSITION_ARCHIVES_BY_DRONE_ID: (droneId: string) => readonly ['dronePositionsArchive', 'drone', string];
    readonly LATEST_POSITION_ARCHIVES: readonly ['dronePositionsArchive', 'latest'];
  };

  constructor() {
    this.DRONE_POSITIONS_ARCHIVE_QUERY_KEYS = {
      POSITION_ARCHIVES: ['dronePositionsArchive'] as const,
      POSITION_ARCHIVE_BY_ID: (id: string) => ['dronePositionsArchive', id] as const,
      POSITION_ARCHIVES_BY_DRONE_ID: (droneId: string) => ['dronePositionsArchive', 'drone', droneId] as const,
      LATEST_POSITION_ARCHIVES: ['dronePositionsArchive', 'latest'] as const,
    } as const;
  }

  /**
   * 基本查詢 - 獲取所有位置歷史歸檔
   */
  useAll() {
    return useQuery({
      queryKey: this.DRONE_POSITIONS_ARCHIVE_QUERY_KEYS.POSITION_ARCHIVES,
      queryFn: async (): Promise<DronePositionArchive[]> => {
        try {
          const response = await apiClient.get('/drone/positions/archive');
          const result = ReqResult.fromResponse<DronePositionArchive[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to fetch all position archives', { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch all position archives',
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
   * 獲取最新位置歷史歸檔
   */
  useLatest() {
    return useQuery({
      queryKey: this.DRONE_POSITIONS_ARCHIVE_QUERY_KEYS.LATEST_POSITION_ARCHIVES,
      queryFn: async (): Promise<DronePositionArchive[]> => {
        try {
          const response = await apiClient.get('/drone/positions/archive');
          const result = ReqResult.fromResponse<DronePositionArchive[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to fetch latest position archives', { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch latest position archives',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
      refetchInterval: 5 * 60 * 1000,
      refetchIntervalInBackground: true,
    });
  }
    
  /**
   * 參數化查詢 - 根據 ID 獲取位置歷史歸檔
   */
  useById(id: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_POSITIONS_ARCHIVE_QUERY_KEYS.POSITION_ARCHIVE_BY_ID(id),
      queryFn: async (): Promise<DronePositionArchive> => {
        try {
          const response = await apiClient.get(`/drone/positions/archive/${id}`);
          const result = ReqResult.fromResponse<DronePositionArchive>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch position archive with ID: ${id}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch position archive with ID: ${id}`,
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
   * 根據無人機 ID 獲取位置歷史歸檔
   */
  useByDroneId(droneId: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_POSITIONS_ARCHIVE_QUERY_KEYS.POSITION_ARCHIVES_BY_DRONE_ID(droneId),
      queryFn: async (): Promise<DronePositionArchive[]> => {
        try {
          const response = await apiClient.get(`/drone/positions/archive/drone/${droneId}`);
          const result = ReqResult.fromResponse<DronePositionArchive[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error(`Failed to fetch position archives for drone ID: ${droneId}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to fetch position archives for drone ID: ${droneId}`,
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
   * 創建位置歷史歸檔
   */
  useCreate() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (data: CreatePositionArchiveRequest): Promise<DronePositionArchive> => {
        try {
          const response = await apiClient.post('/drone/positions/archive', data);
          const result = ReqResult.fromResponse<DronePositionArchive>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to create position archive', { error, data });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to create position archive',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: this.DRONE_POSITIONS_ARCHIVE_QUERY_KEYS.POSITION_ARCHIVES });
        queryClient.invalidateQueries({ queryKey: this.DRONE_POSITIONS_ARCHIVE_QUERY_KEYS.LATEST_POSITION_ARCHIVES });
        queryClient.invalidateQueries({ 
          queryKey: this.DRONE_POSITIONS_ARCHIVE_QUERY_KEYS.POSITION_ARCHIVES_BY_DRONE_ID(data.droneId) 
        });
      },
      retry: 2,
    });
  }

  /**
   * 刪除位置歷史歸檔
   */
  useDelete() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (id: string): Promise<void> => {
        try {
          const response = await apiClient.delete(`/drone/positions/archive/${id}`);
          const result = ReqResult.fromResponse(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
        } catch (error: any) {
          logger.error(`Failed to delete position archive with ID: ${id}`, { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || `Failed to delete position archive with ID: ${id}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (_, id) => {
        queryClient.removeQueries({ queryKey: this.DRONE_POSITIONS_ARCHIVE_QUERY_KEYS.POSITION_ARCHIVE_BY_ID(id) });
        queryClient.invalidateQueries({ queryKey: this.DRONE_POSITIONS_ARCHIVE_QUERY_KEYS.POSITION_ARCHIVES });
        queryClient.invalidateQueries({ queryKey: this.DRONE_POSITIONS_ARCHIVE_QUERY_KEYS.LATEST_POSITION_ARCHIVES });
      },
      retry: 2,
    });
  }
}

/**
 * 全局實例和便利 hooks
 */
export const dronePositionsArchiveQuery = new DronePositionsArchiveQuery();
export const useDronePositionsArchiveQuery = () => dronePositionsArchiveQuery;
export const useAllPositionArchives = () => dronePositionsArchiveQuery.useAll();
export const useLatestPositionArchives = () => dronePositionsArchiveQuery.useLatest();
export const usePositionArchiveById = (id: string) => dronePositionsArchiveQuery.useById(id);
export const useCreatePositionArchive = () => dronePositionsArchiveQuery.useCreate();
export const useUpdatePositionArchive = () => dronePositionsArchiveQuery.useUpdate();
export const useDeletePositionArchive = () => dronePositionsArchiveQuery.useDelete();