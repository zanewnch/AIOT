/**
 * @fileoverview 權限數據相關的 React Query Hooks
 * 
 * 處理權限數據的 API 請求和快取管理：
 * - 權限數據查詢和更新
 * - 快取管理和錯誤處理
 * 
 * @author AIOT Development Team
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';
import { createLogger } from '../configs/loggerConfig';
import type { 
  Permission, 
  UpdateResponse, 
  TableError,
  PermissionUpdateRequest
} from '../types/table';

// 創建服務專用的日誌記錄器
const logger = createLogger('PermissionQuery');

/**
 * PermissionQuery - 權限查詢服務類
 * 
 * 使用 class 封裝所有與權限相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
export class PermissionQuery {
  
  public PERMISSION_QUERY_KEYS: {
    ALL: readonly string[];
    LIST: readonly string[];
  };
  
  constructor() {
    this.PERMISSION_QUERY_KEYS = {
      ALL: ['permission'] as const,
      LIST: ['permission', 'list'] as const,
    } as const;
  }
  
  /**
   * 取得所有權限數據
   */
  useAllPermissionData() {
    return useQuery({
      queryKey: this.PERMISSION_QUERY_KEYS.LIST,
      queryFn: async (): Promise<Permission[]> => {
        try {
          logger.debug('Fetching permissions from API');
          
          const result = await apiClient.getWithResult<Permission[]>('/api/rbac/permissions');
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully fetched ${result.data?.length || 0} permissions`);
          
          // 處理 304 Not Modified 或空資料的情況
          if (result.data === undefined || result.data === null) {
            logger.warn('Received empty response, returning empty array');
            return [];
          }
          
          return result.data || [];
        } catch (error: any) {
          logger.error('Failed to fetch permissions:', error);
          
          const tableError: TableError = {
            message: error.response?.data?.message || 'Failed to fetch permissions',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
    });
  }

  /**
   * 權限數據更新 Mutation
   */
  useUpdatePermissionData() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ id, data }: { id: number; data: PermissionUpdateRequest }) => {
        try {
          logger.debug(`Updating permission with ID: ${id}`, data);
          
          await apiClient.putWithResult(`/api/rbac/permissions/${id}`, data);
          
          logger.info(`Successfully updated permission with ID: ${id}`);
          return { id, data };
        } catch (error: any) {
          logger.error(`Failed to update permission with ID: ${id}:`, error);
          
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Update failed',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: this.PERMISSION_QUERY_KEYS.LIST });
      },
      retry: 1,
    });
  }
}