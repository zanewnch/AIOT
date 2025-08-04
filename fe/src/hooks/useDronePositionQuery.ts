/**
 * @fileoverview React Query hooks 用於無人機位置數據管理
 * 
 * 使用 React Query 處理所有與無人機位置相關的數據獲取、緩存和同步。
 * 提供強大的數據獲取、錯誤處理和背景更新功能。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';
import {
  DronePosition,
  CreateDronePositionRequest,
  UpdateDronePositionRequest,
} from '../types/dronePosition';

/**
 * DronePositionQuery - 無人機位置查詢服務類
 * 
 * 使用 class 封裝所有與無人機位置相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
export class DronePositionQuery {
  
  public DRONE_POSITION_QUERY_KEYS = {
    DRONE_POSITIONS: ['dronePositions'] as const,
    DRONE_POSITION_BY_ID: (id: string) => ['dronePosition', id] as const,
    DRONE_POSITIONS_BY_DRONE_ID: (droneId: string) => ['dronePositions', 'drone', droneId] as const,
    LATEST_DRONE_POSITIONS: ['dronePositions', 'latest'] as const,
  } as const;
  
  constructor() {}
  
  /**
   * 獲取所有無人機位置數據的 Hook
   */
  useAll() {
    return useQuery({
      queryKey: this.DRONE_POSITION_QUERY_KEYS.DRONE_POSITIONS,
      queryFn: async (): Promise<DronePosition[]> => {
        const response = await apiClient.get('/api/drone-position/data');
        const result = RequestResult.fromResponse<DronePosition[]>(response);
        
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
   * 獲取最新無人機位置數據的 Hook
   */
  useLatest() {
    return useQuery({
      queryKey: this.DRONE_POSITION_QUERY_KEYS.LATEST_DRONE_POSITIONS,
      queryFn: async (): Promise<DronePosition[]> => {
        const response = await apiClient.get('/api/drone-position/data/latest');
        const result = RequestResult.fromResponse<DronePosition[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
      },
      staleTime: 10 * 1000,
      gcTime: 2 * 60 * 1000,
      retry: 3,
      refetchInterval: 30 * 1000,
      refetchIntervalInBackground: true,
    });
  }
    
  /**
   * 根據 ID 獲取無人機位置數據的 Hook
   */
  useById(id: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_POSITION_QUERY_KEYS.DRONE_POSITION_BY_ID(id),
      queryFn: async (): Promise<DronePosition> => {
        const response = await apiClient.get(`/api/drone-position/data/${id}`);
        const result = RequestResult.fromResponse<DronePosition>(response);
        
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
   * 根據無人機 ID 獲取位置數據的 Hook
   */
  useByDroneId(droneId: string, enabled: boolean = true) {
    return useQuery({
      queryKey: this.DRONE_POSITION_QUERY_KEYS.DRONE_POSITIONS_BY_DRONE_ID(droneId),
      queryFn: async (): Promise<DronePosition[]> => {
        const response = await apiClient.get(`/api/drone-position/data/drone/${droneId}`);
        const result = RequestResult.fromResponse<DronePosition[]>(response);
        
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
   * 創建無人機位置數據的 Mutation Hook
   */
  useCreate() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async (data: CreateDronePositionRequest): Promise<DronePosition> => {
        const response = await apiClient.post('/api/drone-position/data', data);
        const result = RequestResult.fromResponse<DronePosition>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
      },
      onSuccess: (data) => {
        // 使相關查詢無效，觸發重新獲取
        queryClient.invalidateQueries({ queryKey: this.DRONE_POSITION_QUERY_KEYS.DRONE_POSITIONS });
        queryClient.invalidateQueries({ queryKey: this.DRONE_POSITION_QUERY_KEYS.LATEST_DRONE_POSITIONS });
        queryClient.invalidateQueries({ 
          queryKey: this.DRONE_POSITION_QUERY_KEYS.DRONE_POSITIONS_BY_DRONE_ID(data.droneId) 
        });
      },
      retry: 2,
    });
  }

  /**
   * 更新無人機位置數據的 Mutation Hook
   */
  useUpdate() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: UpdateDronePositionRequest }): Promise<DronePosition> => {
        const response = await apiClient.put(`/api/drone-position/data/${id}`, data);
        const result = RequestResult.fromResponse<DronePosition>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
      },
      onSuccess: (data, variables) => {
        // 更新快取中的特定項目
        queryClient.setQueryData(
          this.DRONE_POSITION_QUERY_KEYS.DRONE_POSITION_BY_ID(variables.id),
          data
        );
        
        // 使相關查詢無效
        queryClient.invalidateQueries({ queryKey: this.DRONE_POSITION_QUERY_KEYS.DRONE_POSITIONS });
        queryClient.invalidateQueries({ queryKey: this.DRONE_POSITION_QUERY_KEYS.LATEST_DRONE_POSITIONS });
        queryClient.invalidateQueries({ 
          queryKey: this.DRONE_POSITION_QUERY_KEYS.DRONE_POSITIONS_BY_DRONE_ID(data.droneId) 
        });
      },
      retry: 2,
    });
  }

  /**
   * 刪除無人機位置數據的 Mutation Hook
   */
  useDelete() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async (id: string): Promise<void> => {
        const response = await apiClient.delete(`/api/drone-position/data/${id}`);
        const result = RequestResult.fromResponse(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
      },
      onSuccess: (_, id) => {
        // 移除快取中的特定項目
        queryClient.removeQueries({ queryKey: this.DRONE_POSITION_QUERY_KEYS.DRONE_POSITION_BY_ID(id) });
        
        // 使相關查詢無效
        queryClient.invalidateQueries({ queryKey: this.DRONE_POSITION_QUERY_KEYS.DRONE_POSITIONS });
        queryClient.invalidateQueries({ queryKey: this.DRONE_POSITION_QUERY_KEYS.LATEST_DRONE_POSITIONS });
      },
      retry: 2,
    });
  }
}


