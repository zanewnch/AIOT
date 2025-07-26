/**
 * @fileoverview 用戶查詢 Hook - 使用 React Query
 * 
 * 用戶數據的異步查詢和變更操作：
 * - 用戶列表查詢
 * - CRUD 操作
 * - 緩存管理
 * 
 * @author AIOT Development Team
 * @version 3.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';

/**
 * 用戶類型定義
 */
export interface User {
  id: number;
  name: string;
  email: string;
}

/**
 * 查詢鍵
 */
export const USER_QUERY_KEYS = {
  USERS: ['users'] as const,
  USER: (id: number) => ['users', id] as const,
} as const;

/**
 * 用戶列表查詢
 */
export const useUsersQuery = () => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.USERS,
    queryFn: async (): Promise<User[]> => {
      const response = await apiClient.get('/api/users');
      const result = RequestResult.fromResponse<User[]>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    staleTime: 5 * 60 * 1000, // 5分鐘
    gcTime: 10 * 60 * 1000, // 10分鐘
  });
};

/**
 * 單個用戶查詢
 */
export const useUserQuery = (id: number) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.USER(id),
    queryFn: async (): Promise<User> => {
      const response = await apiClient.get(`/api/users/${id}`);
      const result = RequestResult.fromResponse<User>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 創建用戶
 */
export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: Omit<User, 'id'>): Promise<User> => {
      const response = await apiClient.post('/api/users', userData);
      const result = RequestResult.fromResponse<User>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.USERS });
    },
  });
};

/**
 * 更新用戶
 */
export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: User): Promise<User> => {
      const response = await apiClient.put(`/api/users/${user.id}`, user);
      const result = RequestResult.fromResponse<User>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.USERS });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.USER(updatedUser.id) });
    },
  });
};

/**
 * 刪除用戶
 */
export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number): Promise<void> => {
      const response = await apiClient.delete(`/api/users/${userId}`);
      const result = RequestResult.fromResponse(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.USERS });
      queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.USER(userId) });
    },
  });
};

/**
 * 綜合用戶管理 Hook
 */
export const useUsers = () => {
  const usersQuery = useUsersQuery();
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const deleteMutation = useDeleteUserMutation();

  return {
    // Data
    users: usersQuery.data || [],
    loading: usersQuery.isLoading,
    error: usersQuery.error,
    
    // Query state
    isRefetching: usersQuery.isRefetching,
    refetch: usersQuery.refetch,
    
    // Mutations
    createUser: createMutation.mutateAsync,
    updateUser: updateMutation.mutateAsync,
    deleteUser: deleteMutation.mutateAsync,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Any mutation is pending
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
};