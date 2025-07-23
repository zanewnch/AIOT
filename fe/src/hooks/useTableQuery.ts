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
import { apiClient } from '../utils/RequestUtils';
import { createLogger, logRequest, logError } from '../configs/loggerConfig';
import type { 
  RTKData, 
  Role, 
  Permission, 
  User, 
  TableType, 
  UpdateResponse, 
  TableError,
  RTKDataUpdateRequest,
  PermissionUpdateRequest,
  RoleUpdateRequest,
  UserUpdateRequest
} from '../types/table';

// 創建服務專用的日誌記錄器
const logger = createLogger('TableQuery');

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
 * API 函數：獲取角色列表
 */
const getRolesAPI = async (): Promise<Role[]> => {
  try {
    logger.debug('Fetching roles from API');
    logRequest('/api/rbac/roles', 'GET', 'Fetching roles');
    
    const response = await apiClient.get<Role[]>('/api/rbac/roles');
    
    logger.info(`Successfully fetched ${response.length} roles`);
    return response;
  } catch (error: any) {
    console.error('Failed to fetch roles:', error);
    logError(error, 'getRolesAPI', { endpoint: '/api/rbac/roles' });
    
    throw {
      message: error.response?.data?.message || 'Failed to fetch roles',
      status: error.response?.status,
      details: error.response?.data,
    } as TableError;
  }
};

/**
 * API 函數：獲取權限列表
 */
const getPermissionsAPI = async (): Promise<Permission[]> => {
  try {
    logger.debug('Fetching permissions from API');
    logRequest('/api/rbac/permissions', 'GET', 'Fetching permissions');
    
    const response = await apiClient.get<Permission[]>('/api/rbac/permissions');
    
    logger.info(`Successfully fetched ${response.length} permissions`);
    return response;
  } catch (error: any) {
    console.error('Failed to fetch permissions:', error);
    logError(error, 'getPermissionsAPI', { endpoint: '/api/rbac/permissions' });
    
    throw {
      message: error.response?.data?.message || 'Failed to fetch permissions',
      status: error.response?.status,
      details: error.response?.data,
    } as TableError;
  }
};

/**
 * API 函數：獲取使用者列表
 */
const getUsersAPI = async (): Promise<User[]> => {
  try {
    logger.debug('Fetching users from API');
    logRequest('/api/rbac/users', 'GET', 'Fetching users');
    
    const response = await apiClient.get<User[]>('/api/rbac/users');
    
    logger.info(`Successfully fetched ${response.length} users`);
    return response;
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
 * API 函數：獲取 RTK 定位資料
 */
const getRTKDataAPI = async (): Promise<RTKData[]> => {
  try {
    logger.debug('Fetching RTK data from API');
    logRequest('/api/rtk/data', 'GET', 'Fetching RTK data');
    
    const response = await apiClient.get<RTKData[]>('/api/rtk/data');
    
    logger.info(`Successfully fetched ${response.length} RTK data entries`);
    return response;
  } catch (error: any) {
    console.error('Failed to fetch RTK data:', error);
    logError(error, 'getRTKDataAPI', { endpoint: '/api/rtk/data' });
    
    throw {
      message: error.response?.data?.message || 'Failed to fetch RTK data',
      status: error.response?.status,
      details: error.response?.data,
    } as TableError;
  }
};

/**
 * API 函數：獲取角色權限關聯
 */
const getRoleToPermissionAPI = async (roleId: number): Promise<Permission[]> => {
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
};

/**
 * API 函數：獲取使用者角色關聯
 */
const getUserToRoleAPI = async (userId: number): Promise<Role[]> => {
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
 * API 函數：更新 RTK 資料
 */
const updateRTKDataAPI = async (id: number, data: RTKDataUpdateRequest): Promise<UpdateResponse> => {
  try {
    logger.debug(`Updating RTK data with ID: ${id}`, data);
    logRequest(`/api/rtk/data/${id}`, 'PUT', `Updating RTK data with ID: ${id}`);
    
    const response = await apiClient.put(`/api/rtk/data/${id}`, data);
    
    logger.info(`Successfully updated RTK data with ID: ${id}`);
    return response;
  } catch (error: any) {
    console.error(`Failed to update RTK data with ID: ${id}:`, error);
    logError(error, 'updateRTKDataAPI', { id, data, endpoint: `/api/rtk/data/${id}` });
    
    const errorMsg = error.response?.data?.message || error.message || 'Update failed';
    return {
      success: false,
      message: errorMsg
    };
  }
};

/**
 * API 函數：更新權限資料
 */
const updatePermissionAPI = async (id: number, data: PermissionUpdateRequest): Promise<UpdateResponse> => {
  try {
    logger.debug(`Updating permission with ID: ${id}`, data);
    logRequest(`/api/rbac/permissions/${id}`, 'PUT', `Updating permission with ID: ${id}`);
    
    const response = await apiClient.put(`/api/rbac/permissions/${id}`, data);
    
    logger.info(`Successfully updated permission with ID: ${id}`);
    return { success: true, data: response };
  } catch (error: any) {
    logError(error, 'updatePermissionAPI', { id, data, endpoint: `/api/rbac/permissions/${id}` });
    
    const errorMsg = error.response?.data?.message || error.message || 'Update failed';
    return { success: false, message: errorMsg };
  }
};

/**
 * API 函數：更新角色資料
 */
const updateRoleAPI = async (id: number, data: RoleUpdateRequest): Promise<UpdateResponse> => {
  try {
    logger.debug(`Updating role with ID: ${id}`, data);
    logRequest(`/api/rbac/roles/${id}`, 'PUT', `Updating role with ID: ${id}`);
    
    const response = await apiClient.put(`/api/rbac/roles/${id}`, data);
    
    logger.info(`Successfully updated role with ID: ${id}`);
    return { success: true, data: response };
  } catch (error: any) {
    logError(error, 'updateRoleAPI', { id, data, endpoint: `/api/rbac/roles/${id}` });
    
    const errorMsg = error.response?.data?.message || error.message || 'Update failed';
    return { success: false, message: errorMsg };
  }
};

/**
 * API 函數：更新使用者資料
 */
const updateUserAPI = async (id: number, data: UserUpdateRequest): Promise<UpdateResponse> => {
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
 * RTK 數據查詢 Hook
 */
export const useRTKData = () => {
  return useQuery({
    queryKey: TABLE_QUERY_KEYS.RTK,
    queryFn: getRTKDataAPI,
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
    queryFn: getPermissionsAPI,
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
    queryFn: getRolesAPI,
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
    queryFn: getUsersAPI,
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
      const roles = await getRolesAPI();
      if (roles.length > 0) {
        return await getRoleToPermissionAPI(roles[0].id);
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
      const users = await getUsersAPI();
      if (users.length > 0) {
        return await getUserToRoleAPI(users[0].id);
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
    mutationFn: async ({ id, data }: { id: number; data: RTKDataUpdateRequest }) => {
      const response = await updateRTKDataAPI(id, data);
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
    mutationFn: async ({ id, data }: { id: number; data: PermissionUpdateRequest }) => {
      const response = await updatePermissionAPI(id, data);
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
    mutationFn: async ({ id, data }: { id: number; data: RoleUpdateRequest }) => {
      const response = await updateRoleAPI(id, data);
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
    mutationFn: async ({ id, data }: { id: number; data: UserUpdateRequest }) => {
      const response = await updateUserAPI(id, data);
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

  const updateTableData = (tableType: TableType, id: number, data: any) => {
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

/**
 * 導出 API 函數供其他模組使用
 */
export const tableAPI = {
  getRoles: getRolesAPI,
  getPermissions: getPermissionsAPI,
  getUsers: getUsersAPI,
  getRTKData: getRTKDataAPI,
  getRoleToPermission: getRoleToPermissionAPI,
  getUserToRole: getUserToRoleAPI,
  updateRTKData: updateRTKDataAPI,
  updatePermission: updatePermissionAPI,
  updateRole: updateRoleAPI,
  updateUser: updateUserAPI,
};