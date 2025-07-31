/**
 * @fileoverview 角色數據相關的 React Query Hooks
 * 
 * 處理角色數據的 API 請求和快取管理：
 * - 角色數據查詢和更新
 * - 角色權限關聯查詢
 * - 快取管理和錯誤處理
 * 
 * @author AIOT Development Team
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';
import { createLogger, logRequest, logError } from '../configs/loggerConfig';
import type { 
  Role, 
  Permission,
  UpdateResponse, 
  TableError,
  RoleUpdateRequest
} from '../types/table';

// 創建服務專用的日誌記錄器
const logger = createLogger('RoleQuery');

/**
 * React Query 查詢鍵
 */
export const ROLE_QUERY_KEYS = {
  ALL: ['role'] as const,
  LIST: ['role', 'list'] as const,
  PERMISSIONS: (roleId: number) => ['role', roleId, 'permissions'] as const,
} as const;


/**
 * 角色數據查詢 Hook
 */
export const useRoleData = () => {
  return useQuery({
    queryKey: ROLE_QUERY_KEYS.LIST,
    queryFn: async (): Promise<Role[]> => {
      try {
        logger.debug('Fetching roles from API');
        logRequest('/api/rbac/roles', 'GET', 'Fetching roles');
        
        const response = await apiClient.get('/api/rbac/roles');
        const result = RequestResult.fromResponse<Role[]>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        logger.info(`Successfully fetched ${result.data?.length || 0} roles`);
        return result.unwrap();
      } catch (error: any) {
        console.error('Failed to fetch roles:', error);
        logError(error, 'getRolesAPI', { endpoint: '/api/rbac/roles' });
        
        throw {
          message: error.response?.data?.message || 'Failed to fetch roles',
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
 * 角色權限關聯查詢 Hook
 */
export const useRolePermissions = (roleId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ROLE_QUERY_KEYS.PERMISSIONS(roleId),
    queryFn: async (): Promise<Permission[]> => {
      try {
        logger.debug(`Fetching permissions for role ${roleId}`);
        logRequest(`/api/rbac/roles/${roleId}/permissions`, 'GET', `Fetching permissions for role ${roleId}`);
        
        const response = await apiClient.get<Permission[]>(`/api/rbac/roles/${roleId}/permissions`);
        
        logger.info(`Successfully fetched ${response.length} permissions for role ${roleId}`);
        return response;
      } catch (error: any) {
        console.error(`Failed to fetch permissions for role ${roleId}:`, error);
        logError(error, 'getRoleToPermissionAPI', { roleId, endpoint: `/api/rbac/roles/${roleId}/permissions` });
        
        throw {
          message: error.response?.data?.message || `Failed to fetch permissions for role ${roleId}`,
          status: error.response?.status,
          details: error.response?.data,
        } as TableError;
      }
    },
    enabled: enabled && roleId > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
};

/**
 * 角色數據更新 Mutation
 */
export const useUpdateRoleData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RoleUpdateRequest }) => {
      try {
        logger.debug(`Updating role with ID: ${id}`, data);
        logRequest(`/api/rbac/roles/${id}`, 'PUT', `Updating role with ID: ${id}`);
        
        const response = await apiClient.put(`/api/rbac/roles/${id}`, data);
        
        logger.info(`Successfully updated role with ID: ${id}`);
        return { id, data };
      } catch (error: any) {
        logError(error, 'updateRoleAPI', { id, data, endpoint: `/api/rbac/roles/${id}` });
        
        const errorMsg = error.response?.data?.message || error.message || 'Update failed';
        throw new Error(errorMsg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLE_QUERY_KEYS.LIST });
    },
    retry: 1,
  });
};

/**
 * 角色相關操作的綜合 Hook
 */
export const useRoleQuery = () => {
  const query = useRoleData();
  const updateMutation = useUpdateRoleData();

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