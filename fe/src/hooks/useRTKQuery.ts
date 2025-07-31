/**
 * @fileoverview RTK 數據相關的 React Query Hooks
 * 
 * 處理 RTK 定位資料的 API 請求和快取管理：
 * - RTK 數據查詢和更新
 * - 快取管理和錯誤處理
 * 
 * @author AIOT Development Team
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';
import { createLogger, logRequest, logError } from '../configs/loggerConfig';
import type { 
  RTKData, 
  UpdateResponse, 
  TableError,
  RTKDataUpdateRequest
} from '../types/table';

// 創建服務專用的日誌記錄器
const logger = createLogger('RTKQuery');

/**
 * React Query 查詢鍵
 */
export const RTK_QUERY_KEYS = {
  ALL: ['rtk'] as const,
  DATA: ['rtk', 'data'] as const,
} as const;


/**
 * RTK 數據查詢 Hook
 */
export const useRTKData = () => {
  return useQuery({
    queryKey: RTK_QUERY_KEYS.DATA,
    queryFn: async (): Promise<RTKData[]> => {
      try {
        logger.debug('Fetching RTK data from API');
        logRequest('/api/rtk/data', 'GET', 'Fetching RTK data');
        
        const response = await apiClient.get('/api/rtk/data');
        const result = RequestResult.fromResponse<RTKData[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        logger.info(`Successfully fetched ${result.data?.length || 0} RTK data entries`);
        return result.unwrap();
      } catch (error: any) {
        console.error('Failed to fetch RTK data:', error);
        logError(error, 'getRTKDataAPI', { endpoint: '/api/rtk/data' });
        
        throw {
          message: error.response?.data?.message || 'Failed to fetch RTK data',
          status: error.response?.status,
          details: error.response?.data,
        } as TableError;
      }
    },
    staleTime: 2 * 60 * 1000, // 2分鐘
    gcTime: 5 * 60 * 1000, // 5分鐘
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * RTK 數據更新 Mutation
 */
export const useUpdateRTKData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RTKDataUpdateRequest }) => {
      try {
        logger.debug(`Updating RTK data with ID: ${id}`, data);
        logRequest(`/api/rtk/data/${id}`, 'PUT', `Updating RTK data with ID: ${id}`);
        
        const response = await apiClient.put(`/api/rtk/data/${id}`, data);
        const result = RequestResult.fromResponse<UpdateResponse>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        logger.info(`Successfully updated RTK data with ID: ${id}`);
        return { id, data };
      } catch (error: any) {
        console.error(`Failed to update RTK data with ID: ${id}:`, error);
        logError(error, 'updateRTKDataAPI', { id, data, endpoint: `/api/rtk/data/${id}` });
        
        const errorMsg = error.response?.data?.message || error.message || 'Update failed';
        throw new Error(errorMsg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RTK_QUERY_KEYS.DATA });
    },
    retry: 1,
  });
};

/**
 * RTK 相關操作的綜合 Hook
 */
export const useRTKQuery = () => {
  const query = useRTKData();
  const updateMutation = useUpdateRTKData();

  return {
    // 數據
    data: query.data || [],
    
    // 狀態
    isLoading: query.isLoading || updateMutation.isPending,
    isError: query.isError,
    error: query.error,
    
    // 方法
    refetch: query.refetch,
    update: updateMutation.mutateAsync,
    
    // 原始查詢對象
    query,
    mutation: updateMutation,
  };
};