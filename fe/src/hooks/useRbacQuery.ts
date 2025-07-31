/**
 * @fileoverview React Query hooks 用於 RBAC (Role-Based Access Control) 數據管理
 * 
 * 使用 React Query 處理所有與 RBAC 相關的數據獲取、緩存和同步。
 * 提供強大的數據獲取、錯誤處理和背景更新功能。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';
import {
  RbacUser,
  RbacRole,
  RbacPermission,
  UserRole,
  RolePermission,
  CreateUserRequest,
  UpdateUserRequest,
  CreateRoleRequest,
  UpdateRoleRequest,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  CreateUserRoleRequest,
  UpdateUserRoleRequest,
  CreateRolePermissionRequest,
  UpdateRolePermissionRequest,
} from '../types/rbac';

/**
 * React Query 查詢鍵常量
 */
export const RBAC_QUERY_KEYS = {
  USERS: ['rbacUsers'] as const,
  USER_BY_ID: (userId: string) => ['rbacUser', userId] as const,
  ROLES: ['rbacRoles'] as const,
  ROLE_BY_ID: (roleId: string) => ['rbacRole', roleId] as const,
  PERMISSIONS: ['rbacPermissions'] as const,
  PERMISSION_BY_ID: (permissionId: string) => ['rbacPermission', permissionId] as const,
  USER_ROLES: ['rbacUserRoles'] as const,
  USER_ROLE_BY_ID: (userRoleId: string) => ['rbacUserRole', userRoleId] as const,
  ROLE_PERMISSIONS: ['rbacRolePermissions'] as const,
  ROLE_PERMISSION_BY_ID: (rolePermissionId: string) => ['rbacRolePermission', rolePermissionId] as const,
} as const;



/**
 * 獲取所有使用者的 Hook
 */
export const useRbacUsers = () => {
  return useQuery({
    queryKey: RBAC_QUERY_KEYS.USERS,
    queryFn: async (): Promise<RbacUser[]> => {
      const response = await apiClient.get('/api/rbac/users');
      const result = RequestResult.fromResponse<RbacUser[]>(response);
      
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
};

/**
 * 根據 ID 獲取使用者的 Hook
 */
export const useRbacUserById = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: RBAC_QUERY_KEYS.USER_BY_ID(userId),
    queryFn: async (): Promise<RbacUser> => {
      const response = await apiClient.get(`/api/rbac/users/${userId}`);
      const result = RequestResult.fromResponse<RbacUser>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    enabled: enabled && !!userId,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
  });
};

/**
 * 獲取所有角色的 Hook
 */
export const useRbacRoles = () => {
  return useQuery({
    queryKey: RBAC_QUERY_KEYS.ROLES,
    queryFn: async (): Promise<RbacRole[]> => {
      const response = await apiClient.get('/api/rbac/roles');
      const result = RequestResult.fromResponse<RbacRole[]>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 3,
  });
};

/**
 * 根據 ID 獲取角色的 Hook
 */
export const useRbacRoleById = (roleId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: RBAC_QUERY_KEYS.ROLE_BY_ID(roleId),
    queryFn: async (): Promise<RbacRole> => {
      const response = await apiClient.get(`/api/rbac/roles/${roleId}`);
      const result = RequestResult.fromResponse<RbacRole>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    enabled: enabled && !!roleId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 3,
  });
};

/**
 * 獲取所有權限的 Hook
 */
export const useRbacPermissions = () => {
  return useQuery({
    queryKey: RBAC_QUERY_KEYS.PERMISSIONS,
    queryFn: async (): Promise<RbacPermission[]> => {
      const response = await apiClient.get('/api/rbac/permissions');
      const result = RequestResult.fromResponse<RbacPermission[]>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 3,
  });
};

/**
 * 根據 ID 獲取權限的 Hook
 */
export const useRbacPermissionById = (permissionId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: RBAC_QUERY_KEYS.PERMISSION_BY_ID(permissionId),
    queryFn: async (): Promise<RbacPermission> => {
      const response = await apiClient.get(`/api/rbac/permissions/${permissionId}`);
      const result = RequestResult.fromResponse<RbacPermission>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    enabled: enabled && !!permissionId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 3,
  });
};

/**
 * 獲取所有使用者角色關聯的 Hook
 */
export const useUserRoles = () => {
  return useQuery({
    queryKey: RBAC_QUERY_KEYS.USER_ROLES,
    queryFn: async (): Promise<UserRole[]> => {
      const response = await apiClient.get('/api/rbac/user-roles');
      const result = RequestResult.fromResponse<UserRole[]>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
  });
};

/**
 * 獲取所有角色權限關聯的 Hook
 */
export const useRolePermissions = () => {
  return useQuery({
    queryKey: RBAC_QUERY_KEYS.ROLE_PERMISSIONS,
    queryFn: async (): Promise<RolePermission[]> => {
      const response = await apiClient.get('/api/rbac/role-permissions');
      const result = RequestResult.fromResponse<RolePermission[]>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 3,
  });
};

/**
 * 創建使用者的 Mutation Hook
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserRequest): Promise<RbacUser> => {
      const response = await apiClient.post('/api/rbac/users', data);
      const result = RequestResult.fromResponse<RbacUser>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RBAC_QUERY_KEYS.USERS });
    },
    retry: 2,
  });
};

/**
 * 更新使用者的 Mutation Hook
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateUserRequest }): Promise<RbacUser> => {
      const response = await apiClient.put(`/api/rbac/users/${userId}`, data);
      const result = RequestResult.fromResponse<RbacUser>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(RBAC_QUERY_KEYS.USER_BY_ID(variables.userId), data);
      queryClient.invalidateQueries({ queryKey: RBAC_QUERY_KEYS.USERS });
    },
    retry: 2,
  });
};

/**
 * 刪除使用者的 Mutation Hook
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string): Promise<void> => {
      const response = await apiClient.delete(`/api/rbac/users/${userId}`);
      const result = RequestResult.fromResponse(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
    },
    onSuccess: (_, userId) => {
      queryClient.removeQueries({ queryKey: RBAC_QUERY_KEYS.USER_BY_ID(userId) });
      queryClient.invalidateQueries({ queryKey: RBAC_QUERY_KEYS.USERS });
      queryClient.invalidateQueries({ queryKey: RBAC_QUERY_KEYS.USER_ROLES });
    },
    retry: 2,
  });
};