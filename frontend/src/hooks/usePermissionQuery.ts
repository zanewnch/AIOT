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
import { ReqResult } from '../utils/ReqResult';
import { createLogger } from '../configs/loggerConfig';
import type { 
  Permission, 
  UpdateResponse, 
  TableError,
  PermissionUpdateRequest
} from '../types/table';
import type { PaginationParams, PaginatedResponse } from '../types/pagination';

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
   * 取得所有權限數據（支援分頁）
   */
  useAllPermissionData(paginationParams?: PaginationParams) {
    const queryKey = paginationParams 
      ? [...this.PERMISSION_QUERY_KEYS.LIST, 'paginated', paginationParams]
      : this.PERMISSION_QUERY_KEYS.LIST;

    return useQuery({
      queryKey,
      queryFn: async (): Promise<Permission[] | PaginatedResponse<Permission>> => {
        try {
          logger.debug('Fetching permissions from API', { paginationParams });
          
          // 構建查詢參數
          const queryParams = new URLSearchParams();
          if (paginationParams) {
            queryParams.append('page', paginationParams.page.toString());
            queryParams.append('pageSize', paginationParams.pageSize.toString());
            if (paginationParams.sortBy) {
              queryParams.append('sortBy', paginationParams.sortBy);
            }
            if (paginationParams.sortOrder) {
              queryParams.append('sortOrder', paginationParams.sortOrder);
            }
          }

          const url = `/rbac/permissions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
          const result = await apiClient.getWithResult<Permission[] | PaginatedResponse<Permission>>(url);
          
          if (!result.isSuccess()) {
            throw new Error(result.message);
          }
          
          if (paginationParams) {
            // 分頁模式：返回分頁數據
            const paginatedData = result.data as PaginatedResponse<Permission>;
            logger.info(`Successfully fetched paginated permissions`, {
              page: paginatedData.page,
              pageSize: paginatedData.pageSize,
              total: paginatedData.total,
              dataLength: paginatedData.data.length
            });
            return paginatedData;
          } else {
            // 非分頁模式：返回權限列表
            const permissions = result.data as Permission[];
            logger.info(`Successfully fetched ${permissions?.length || 0} permissions`);
            
            // 處理 304 Not Modified 或空資料的情況
            if (permissions === undefined || permissions === null) {
              logger.warn('Received empty response, returning empty array');
              return [];
            }
            
            return permissions || [];
          }
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
          
          await apiClient.putWithResult(`/rbac/permissions/${id}`, data);
          
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

/**
 * 全局實例和便利 hooks
 */
export const permissionQuery = new PermissionQuery();
export const usePermissionQuery = () => permissionQuery;
export const useAllPermissions = () => permissionQuery.useAll();
export const usePermissionById = (id: string) => permissionQuery.useById(id);
export const useCreatePermission = () => permissionQuery.useCreate();
export const useUpdatePermission = () => permissionQuery.useUpdate();
export const useDeletePermission = () => permissionQuery.useDelete();