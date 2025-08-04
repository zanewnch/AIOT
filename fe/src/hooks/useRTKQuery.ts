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
import { createLogger } from '../configs/loggerConfig';
import type { 
  RTKData, 
  UpdateResponse, 
  TableError,
  RTKDataUpdateRequest
} from '../types/table';

// 創建服務專用的日誌記錄器
const logger = createLogger('RTKQuery');

/**
 * RTKQuery - RTK 數據查詢服務類
 * 
 * 使用 class 封裝所有與 RTK 定位資料相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
class RTKQuery {
  public RTK_QUERY_KEYS: {
    readonly ALL: readonly ['rtk'];
    readonly DATA: readonly ['rtk', 'data'];
  };

  constructor() {
    this.RTK_QUERY_KEYS = {
      ALL: ['rtk'] as const,
      DATA: ['rtk', 'data'] as const,
    } as const;
  }

  /**
   * RTK 數據查詢 Hook
   */
  useRTKData() {
    return useQuery({
      queryKey: this.RTK_QUERY_KEYS.DATA,
      queryFn: async (): Promise<RTKData[]> => {
        try {
          logger.debug('Fetching RTK data from API');
          
          const response = await apiClient.get('/api/rtk/data');
          const result = RequestResult.fromResponse<RTKData[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully fetched ${result.data?.length || 0} RTK data entries`);
          return result.unwrap();
        } catch (error: any) {
          console.error('Failed to fetch RTK data:', error);
          
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
  }

  /**
   * RTK 數據更新 Mutation
   */
  useUpdateRTKData() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ id, data }: { id: number; data: RTKDataUpdateRequest }) => {
        try {
          logger.debug(`Updating RTK data with ID: ${id}`, data);
          
          const response = await apiClient.put(`/api/rtk/data/${id}`, data);
          const result = RequestResult.fromResponse<UpdateResponse>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully updated RTK data with ID: ${id}`);
          return { id, data };
        } catch (error: any) {
          console.error(`Failed to update RTK data with ID: ${id}:`, error);
          
          const errorMsg = error.response?.data?.message || error.message || 'Update failed';
          throw new Error(errorMsg);
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: this.RTK_QUERY_KEYS.DATA });
      },
      retry: 1,
    });
  }
}



// 創建 RTKQuery 實例並匯出主要 Hook
const rtkqueryInstance = new RTKQuery();

/**
 * useRTKQuery - 主要的 Hook
 * 
 * 直接匯出使用的 Hook，與現有代碼相容
 */
export const useRTKQuery = () => rtkqueryInstance;

// 也可以匯出 RTKQuery 類別本身，供進階使用  
export { RTKQuery };
