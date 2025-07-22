/**
 * @fileoverview 表格數據相關的 React Query Hooks
 * 
 * 處理所有表格數據的 API 請求和快取管理：
 * - RTK 數據查詢和更新
 * - 權限、角色、用戶數據管理
 * - 關聯數據處理
 * 
 * @author AIOT Development Team
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableService } from '../services/TableService';
import { RTKData } from '../types/IRTKData';

/**
 * 表格類型定義
 */
export type TableType = 'permission' | 'role' | 'roletopermission' | 'user' | 'usertorole' | 'RTK';

/**
 * React Query 查詢鍵
 */
export const TABLE_QUERY_KEYS = {
  RTK: ['table', 'RTK'] as const,
  PERMISSION: ['table', 'permission'] as const,
  ROLE: ['table', 'role'] as const,
  USER: ['table', 'user'] as const,
  ROLE_TO_PERMISSION: ['table', 'roleToPermission'] as const,
  USER_TO_ROLE: ['table', 'userToRole'] as const,
} as const;

/**
 * RTK 數據查詢 Hook
 */
export const useRTKData = () => {
  return useQuery({
    queryKey: TABLE_QUERY_KEYS.RTK,
    queryFn: async (): Promise<RTKData[]> => {
      return await TableService.getTableData('RTK');
    },
    staleTime: 2 * 60 * 1000, // 2分鐘
    gcTime: 5 * 60 * 1000, // 5分鐘
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * 權限數據查詢 Hook
 */
export const usePermissionData = () => {
  return useQuery({
    queryKey: TABLE_QUERY_KEYS.PERMISSION,
    queryFn: async () => {
      return await TableService.getTableData('permission');
    },
    staleTime: 10 * 60 * 1000, // 10分鐘
    gcTime: 30 * 60 * 1000, // 30分鐘
    retry: 2,
  });
};

/**
 * 角色數據查詢 Hook
 */
export const useRoleData = () => {
  return useQuery({
    queryKey: TABLE_QUERY_KEYS.ROLE,
    queryFn: async () => {
      return await TableService.getTableData('role');
    },
    staleTime: 10 * 60 * 1000, // 10分鐘
    gcTime: 30 * 60 * 1000, // 30分鐘
    retry: 2,
  });
};

/**
 * 用戶數據查詢 Hook
 */
export const useUserData = () => {
  return useQuery({
    queryKey: TABLE_QUERY_KEYS.USER,
    queryFn: async () => {
      return await TableService.getTableData('user');
    },
    staleTime: 5 * 60 * 1000, // 5分鐘
    gcTime: 15 * 60 * 1000, // 15分鐘
    retry: 2,
  });
};

/**
 * 角色到權限關聯數據查詢 Hook
 */
export const useRoleToPermissionData = () => {
  return useQuery({
    queryKey: TABLE_QUERY_KEYS.ROLE_TO_PERMISSION,
    queryFn: async () => {
      const roles = await TableService.getRoles();
      if (roles.length > 0) {
        return await TableService.getRoleToPermission(roles[0].id);
      }
      return [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
};

/**
 * 用戶到角色關聯數據查詢 Hook
 */
export const useUserToRoleData = () => {
  return useQuery({
    queryKey: TABLE_QUERY_KEYS.USER_TO_ROLE,
    queryFn: async () => {
      const users = await TableService.getUsers();
      if (users.length > 0) {
        return await TableService.getUserToRole(users[0].id);
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
  });
};

/**
 * RTK 數據更新 Mutation
 */
export const useUpdateRTKData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RTKData> }) => {
      const response = await TableService.updateRTKData(id, data);
      if (!response.success) {
        throw new Error(response.message || 'Update failed');
      }
      return { id, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TABLE_QUERY_KEYS.RTK });
    },
    retry: 1,
  });
};

/**
 * 權限數據更新 Mutation
 */
export const useUpdatePermissionData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await TableService.updatePermission(id, data);
      if (!response.success) {
        throw new Error(response.message || 'Update failed');
      }
      return { id, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TABLE_QUERY_KEYS.PERMISSION });
    },
    retry: 1,
  });
};

/**
 * 角色數據更新 Mutation
 */
export const useUpdateRoleData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await TableService.updateRole(id, data);
      if (!response.success) {
        throw new Error(response.message || 'Update failed');
      }
      return { id, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TABLE_QUERY_KEYS.ROLE });
    },
    retry: 1,
  });
};

/**
 * 用戶數據更新 Mutation
 */
export const useUpdateUserData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await TableService.updateUser(id, data);
      if (!response.success) {
        throw new Error(response.message || 'Update failed');
      }
      return { id, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TABLE_QUERY_KEYS.USER });
    },
    retry: 1,
  });
};

/**
 * 綜合表格數據管理 Hook
 */
export const useTableData = () => {
  const queryClient = useQueryClient();
  
  // 查詢 hooks
  const rtkQuery = useRTKData();
  const permissionQuery = usePermissionData();
  const roleQuery = useRoleData();
  const userQuery = useUserData();
  const roleToPermissionQuery = useRoleToPermissionData();
  const userToRoleQuery = useUserToRoleData();
  
  // 更新 hooks
  const updateRTK = useUpdateRTKData();
  const updatePermission = useUpdatePermissionData();
  const updateRole = useUpdateRoleData();
  const updateUser = useUpdateUserData();
  
  // 綜合狀態
  const isLoading = rtkQuery.isLoading || permissionQuery.isLoading || 
                   roleQuery.isLoading || userQuery.isLoading ||
                   roleToPermissionQuery.isLoading || userToRoleQuery.isLoading ||
                   updateRTK.isPending || updatePermission.isPending ||
                   updateRole.isPending || updateUser.isPending;

  const hasError = rtkQuery.isError || permissionQuery.isError ||
                  roleQuery.isError || userQuery.isError ||
                  roleToPermissionQuery.isError || userToRoleQuery.isError;

  // 便利方法
  const refetchTable = (tableType: TableType) => {
    switch (tableType) {
      case 'RTK':
        return rtkQuery.refetch();
      case 'permission':
        return permissionQuery.refetch();
      case 'role':
        return roleQuery.refetch();
      case 'user':
        return userQuery.refetch();
      case 'roletopermission':
        return roleToPermissionQuery.refetch();
      case 'usertorole':
        return userToRoleQuery.refetch();
    }
  };

  const updateTableData = (tableType: TableType, id: string, data: any) => {
    switch (tableType) {
      case 'RTK':
        return updateRTK.mutateAsync({ id, data });
      case 'permission':
        return updatePermission.mutateAsync({ id, data });
      case 'role':
        return updateRole.mutateAsync({ id, data });
      case 'user':
        return updateUser.mutateAsync({ id, data });
      default:
        return Promise.resolve();
    }
  };

  return {
    // 數據
    rtkData: rtkQuery.data || [],
    permissionData: permissionQuery.data || [],
    roleData: roleQuery.data || [],
    userData: userQuery.data || [],
    roleToPermissionData: roleToPermissionQuery.data || [],
    userToRoleData: userToRoleQuery.data || [],
    
    // 狀態
    isLoading,
    hasError,
    
    // 方法
    refetchTable,
    updateTableData,
    
    // 原始查詢對象
    queries: {
      rtk: rtkQuery,
      permission: permissionQuery,
      role: roleQuery,
      user: userQuery,
      roleToPermission: roleToPermissionQuery,
      userToRole: userToRoleQuery,
    },
    mutations: {
      updateRTK,
      updatePermission,
      updateRole,
      updateUser,
    },
  };
};