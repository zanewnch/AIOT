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
import { RequestResult } from '../utils/RequestResult';
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
        const response = await apiClient.get('/api/drone-positions-archive/data');
        const result = RequestResult.fromResponse<DronePositionArchive[]>(response);
        
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
   * 獲取最新位置歷史歸檔
   */
  useLatest() {
    return useQuery({
      queryKey: this.DRONE_POSITIONS_ARCHIVE_QUERY_KEYS.LATEST_POSITION_ARCHIVES,
      queryFn: async (): Promise<DronePositionArchive[]> => {
        const response = await apiClient.get('/api/drone-positions-archive/data/latest');
        const result = RequestResult.fromResponse<DronePositionArchive[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
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
        const response = await apiClient.get(`/api/drone-positions-archive/data/${id}`);
        const result = RequestResult.fromResponse<DronePositionArchive>(response);
        
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
   * 根據無人機 ID 獲取位置歷史歸檔
   */
  useByDroneId(droneId: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_POSITIONS_ARCHIVE_QUERY_KEYS.POSITION_ARCHIVES_BY_DRONE_ID(droneId),
      queryFn: async (): Promise<DronePositionArchive[]> => {
        const response = await apiClient.get(`/api/drone-positions-archive/data/drone/${droneId}`);
        const result = RequestResult.fromResponse<DronePositionArchive[]>(response);
        
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
   * 創建位置歷史歸檔
   */
  useCreate() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (data: CreatePositionArchiveRequest): Promise<DronePositionArchive> => {
        const response = await apiClient.post('/api/drone-positions-archive/data', data);
        const result = RequestResult.fromResponse<DronePositionArchive>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
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
        const response = await apiClient.delete(`/api/drone-positions-archive/data/${id}`);
        const result = RequestResult.fromResponse(response);
        
        if (result.isError()) {
          throw new Error(result.message);
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


