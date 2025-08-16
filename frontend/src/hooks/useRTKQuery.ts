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
export class RTKQuery {
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
          
          const result = await apiClient.getWithResult<RTKData[]>('/rtk/data');
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully fetched ${result.data?.length || 0} RTK data entries`);
          return result.data || [];
        } catch (error: any) {
          logger.error('Failed to fetch RTK data:', error);

          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch RTK data',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
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
          
          const result = await apiClient.putWithResult<UpdateResponse>(`/api/rtk/data/${id}`, data);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully updated RTK data with ID: ${id}`);
          return { id, data };
        } catch (error: any) {
          logger.error(`Failed to update RTK data with ID: ${id}:`, error);

          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Update failed',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: this.RTK_QUERY_KEYS.DATA });
      },
      retry: 1,
    });
  }
}



