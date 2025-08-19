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
import { ReqResult } from '../utils/ReqResult';
import { createLogger } from '../configs/loggerConfig';
import type { 
  Role, 
  Permission,
  UpdateResponse, 
  TableError,
  RoleUpdateRequest,
  RoleToPermission
} from '../types/table';

// 創建服務專用的日誌記錄器
const logger = createLogger('RoleQuery');

/**
 * RoleQuery - 角色查詢服務類
 * 
 * 使用 class 封裝所有與角色數據相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
export class RoleQuery {
  public ROLE_QUERY_KEYS: {
    readonly ALL: readonly ['role'];
    readonly LIST: readonly ['role', 'list'];
    readonly PERMISSIONS: (roleId: number) => readonly ['role', number, 'permissions'];
    readonly ROLE_PERMISSIONS: readonly ['role', 'permissions'];
  };

  constructor() {
    this.ROLE_QUERY_KEYS = {
      ALL: ['role'] as const,
      LIST: ['role', 'list'] as const,
      PERMISSIONS: (roleId: number) => ['role', roleId, 'permissions'] as const,
      ROLE_PERMISSIONS: ['role', 'permissions'] as const,
    } as const;
  }

  /**
   * 角色數據查詢 Hook
   */
  useRoleData() {
    return useQuery({
      queryKey: this.ROLE_QUERY_KEYS.LIST,
      queryFn: async (): Promise<Role[]> => {
        try {
          logger.debug('Fetching roles from API');
          
          const result = await apiClient.getWithResult<Role[]>('/rbac/roles');
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully fetched ${result.data?.length || 0} roles`);
          return result.data || [];
        } catch (error: any) {
          logger.error('Failed to fetch roles:', error);
          
          const tableError: TableError = {
            message: error.response?.data?.message || 'Failed to fetch roles',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 10 * 60 * 1000, // 10分鐘
      gcTime: 30 * 60 * 1000, // 30分鐘
      retry: 2,
    });
  }

  /**
   * 角色權限關聯查詢 Hook
   */
  useRolePermissions(roleId: number, enabled: boolean = true) {
    return useQuery({
      queryKey: this.ROLE_QUERY_KEYS.PERMISSIONS(roleId),
      queryFn: async (): Promise<Permission[]> => {
        try {
          logger.debug(`Fetching permissions for role ${roleId}`);
          
          const result = await apiClient.getWithResult<Permission[]>(`/rbac/roles/${roleId}/permissions`);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully fetched ${result.data?.length || 0} permissions for role ${roleId}`);
          return result.data || [];
        } catch (error: any) {
          logger.error(`Failed to fetch permissions for role ${roleId}:`, error);
          
          const tableError: TableError = {
            message: error.response?.data?.message || `Failed to fetch permissions for role ${roleId}`,
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      enabled: enabled && roleId > 0,
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
    });
  }

  /**
   * 角色權限關聯查詢 Hook (所有關聯)
   */
  useAllRolePermissions() {
    return useQuery({
      queryKey: this.ROLE_QUERY_KEYS.ROLE_PERMISSIONS,
      queryFn: async (): Promise<RoleToPermission[]> => {
        try {
          logger.debug('Fetching role permissions from API');
          
          const result = await apiClient.getWithResult<RoleToPermission[]>('/rbac/role-permissions');
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully fetched ${result.data?.length || 0} role permissions`);
          return result.data || [];
        } catch (error: any) {
          logger.error('Failed to fetch role permissions:', error);
          
          const tableError: TableError = {
            message: error.response?.data?.message || 'Failed to fetch role permissions',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 5 * 60 * 1000, // 5分鐘
      gcTime: 15 * 60 * 1000, // 15分鐘
      retry: 2,
    });
  }

  /**
   * 角色數據更新 Mutation
   */
  useUpdateRoleData() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ id, data }: { id: number; data: RoleUpdateRequest }) => {
        try {
          logger.debug(`Updating role with ID: ${id}`, data);
          
          await apiClient.putWithResult(`/rbac/roles/${id}`, data);
          
          logger.info(`Successfully updated role with ID: ${id}`);
          return { id, data };
        } catch (error: any) {
          logger.error(`Failed to update role with ID: ${id}:`, error);
          
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Update failed',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: this.ROLE_QUERY_KEYS.LIST });
        queryClient.invalidateQueries({ queryKey: this.ROLE_QUERY_KEYS.ROLE_PERMISSIONS });
      },
      retry: 1,
    });
  }
}

/**
 * 全局實例和便利 hooks
 */
export const roleQuery = new RoleQuery();
export const useRoleQuery = () => roleQuery;
export const useAllRoles = () => roleQuery.useAll();
export const useRoleById = (id: string) => roleQuery.useById(id);
export const useRolePermissions = () => roleQuery.useRolePermissions();
export const useCreateRole = () => roleQuery.useCreate();
export const useUpdateRole = () => roleQuery.useUpdate();
export const useDeleteRole = () => roleQuery.useDelete();
export const useAssignPermissionsToRole = () => roleQuery.useAssignPermissions();