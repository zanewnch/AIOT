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
import { createLogger, logRequest, logError } from '../configs/loggerConfig';
import type { 
  Permission, 
  UpdateResponse, 
  TableError,
  PermissionUpdateRequest
} from '../types/table';

// 創建服務專用的日誌記錄器
const logger = createLogger('PermissionQuery');

/**
 * React Query 查詢鍵
 */
export const PERMISSION_QUERY_KEYS = {
  ALL: ['permission'] as const,
  LIST: ['permission', 'list'] as const,
} as const;


/**
 * 權限數據查詢 Hook
 */
export const usePermissionData = () => {
  return useQuery({
    queryKey: PERMISSION_QUERY_KEYS.LIST,
    queryFn: async (): Promise<Permission[]> => {
      try {
        logger.debug('Fetching permissions from API');
        logRequest('/api/rbac/permissions', 'GET', 'Fetching permissions');
        
        const response = await apiClient.get('/api/rbac/permissions');
        const result = RequestResult.fromResponse<Permission[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        logger.info(`Successfully fetched ${result.data?.length || 0} permissions`);
        return result.unwrap();
      } catch (error: any) {
        console.error('Failed to fetch permissions:', error);
        logError(error, 'getPermissionsAPI', { endpoint: '/api/rbac/permissions' });
        
        throw {
          message: error.response?.data?.message || 'Failed to fetch permissions',
          status: error.response?.status,
          details: error.response?.data,
        } as TableError;
      }
    },
    staleTime: 10 * 60 * 1000, // 10分鐘
    gcTime: 30 * 60 * 1000, // 30分鐘
    retry: 2,
  });
};

/**
 * 權限數據更新 Mutation
 */
export const useUpdatePermissionData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PermissionUpdateRequest }) => {
      try {
        logger.debug(`Updating permission with ID: ${id}`, data);
        logRequest(`/api/rbac/permissions/${id}`, 'PUT', `Updating permission with ID: ${id}`);
        
        const response = await apiClient.put(`/api/rbac/permissions/${id}`, data);
        
        logger.info(`Successfully updated permission with ID: ${id}`);
        return { id, data };
      } catch (error: any) {
        logError(error, 'updatePermissionAPI', { id, data, endpoint: `/api/rbac/permissions/${id}` });
        
        const errorMsg = error.response?.data?.message || error.message || 'Update failed';
        throw new Error(errorMsg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMISSION_QUERY_KEYS.LIST });
    },
    retry: 1,
  });
};

/**
 * 權限相關操作的綜合 Hook
 */
export const usePermissionQuery = () => {
  const query = usePermissionData();
  const updateMutation = useUpdatePermissionData();

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