/**
 * @fileoverview 用戶數據相關的 React Query Hooks
 * 
 * 處理用戶數據的 API 請求和快取管理：
 * - 用戶數據查詢和更新
 * - 用戶角色關聯查詢
 * - 快取管理和錯誤處理
 * 
 * @author AIOT Development Team
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';
import { createLogger, logRequest, logError } from '../configs/loggerConfig';
import type { 
  User, 
  Role,
  UpdateResponse, 
  TableError,
  UserUpdateRequest
} from '../types/table';

// 創建服務專用的日誌記錄器
const logger = createLogger('UserQuery');

/**
 * React Query 查詢鍵
 */
export const USER_QUERY_KEYS = {
  ALL: ['user'] as const,
  LIST: ['user', 'list'] as const,
  ROLES: (userId: number) => ['user', userId, 'roles'] as const,
} as const;

/**
 * API 函數：獲取使用者列表
 */
export const getUsersAPI = async (): Promise<User[]> => {
  try {
    logger.debug('Fetching users from API');
    logRequest('/api/rbac/users', 'GET', 'Fetching users');
    
    const response = await apiClient.get('/api/rbac/users');
    const result = RequestResult.fromResponse<User[]>(response);
    
    if (result.isError()) {
      throw new Error(result.message);
    }
    
    logger.info(`Successfully fetched ${result.data?.length || 0} users`);
    return result.unwrap();
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    logError(error, 'getUsersAPI', { endpoint: '/api/rbac/users' });
    
    throw {
      message: error.response?.data?.message || 'Failed to fetch users',
      status: error.response?.status,
      details: error.response?.data,
    } as TableError;
  }
};

/**
 * API 函數：獲取使用者角色關聯
 */
export const getUserToRoleAPI = async (userId: number): Promise<Role[]> => {
  try {
    logger.debug(`Fetching roles for user ${userId}`);
    logRequest(`/api/rbac/users/${userId}/roles`, 'GET', `Fetching roles for user ${userId}`);
    
    const response = await apiClient.get<Role[]>(`/api/rbac/users/${userId}/roles`);
    
    logger.info(`Successfully fetched ${response.length} roles for user ${userId}`);
    return response;
  } catch (error: any) {
    console.error(`Failed to fetch roles for user ${userId}:`, error);
    logError(error, 'getUserToRoleAPI', { userId, endpoint: `/api/rbac/users/${userId}/roles` });
    
    throw {
      message: error.response?.data?.message || `Failed to fetch roles for user ${userId}`,
      status: error.response?.status,
      details: error.response?.data,
    } as TableError;
  }
};

/**
 * API 函數：更新使用者資料
 */
export const updateUserAPI = async (id: number, data: UserUpdateRequest): Promise<UpdateResponse> => {
  try {
    logger.debug(`Updating user with ID: ${id}`, { username: data.username, email: data.email });
    logRequest(`/api/rbac/users/${id}`, 'PUT', `Updating user with ID: ${id}`);
    
    const response = await apiClient.put(`/api/rbac/users/${id}`, data);
    
    logger.info(`Successfully updated user with ID: ${id}`);
    return { success: true, data: response };
  } catch (error: any) {
    logError(error, 'updateUserAPI', { id, username: data.username, email: data.email, endpoint: `/api/rbac/users/${id}` });
    
    const errorMsg = error.response?.data?.message || error.message || 'Update failed';
    return { success: false, message: errorMsg };
  }
};

/**
 * 用戶數據查詢 Hook
 */
export const useUserData = () => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.LIST,
    queryFn: getUsersAPI,
    staleTime: 5 * 60 * 1000, // 5分鐘
    gcTime: 15 * 60 * 1000, // 15分鐘
    retry: 2,
  });
};

/**
 * 用戶角色關聯查詢 Hook
 */
export const useUserRoles = (userId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.ROLES(userId),
    queryFn: () => getUserToRoleAPI(userId),
    enabled: enabled && userId > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
  });
};

/**
 * 用戶數據更新 Mutation
 */
export const useUpdateUserData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UserUpdateRequest }) => {
      const response = await updateUserAPI(id, data);
      if (!response.success) {
        throw new Error(response.message || 'Update failed');
      }
      return { id, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.LIST });
    },
    retry: 1,
  });
};

/**
 * 用戶相關操作的綜合 Hook
 */
export const useUserQuery = () => {
  const query = useUserData();
  const updateMutation = useUpdateUserData();

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