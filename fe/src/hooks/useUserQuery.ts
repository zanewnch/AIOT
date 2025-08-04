/**
 * @fileoverview React Query hooks 用於使用者數據管理
 * 
 * 使用 React Query 處理所有與使用者相關的數據獲取、緩存和同步。
 * 這個檔案主要作為使用者相關功能的聚合器，整合偏好設定和活動追蹤功能。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserProfile, UserSession } from '../types/user';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';
import { createLogger } from '../configs/loggerConfig';
import type { 
  User, 
  UpdateResponse, 
  TableError,
  UserUpdateRequest,
  UserRole
} from '../types/table';

// 創建服務專用的日誌記錄器
const logger = createLogger('UserQuery');


// 重新匯出 RBAC 用戶管理相關的 hooks
// Note: These hooks are accessed through the RbacQuery class now

/**
 * UserQuery - 使用者查詢服務類
 * 
 * 使用 class 封裝所有與使用者相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
export class UserQuery {
  
  public USER_QUERY_KEYS = {
    USER_PROFILE: ['userProfile'] as const,
    USER_SESSION: ['userSession'] as const,
    ALL: ['user'] as const,
    LIST: ['user', 'list'] as const,
    RBAC_USERS: ['user', 'rbac'] as const,
    USER_ROLES: ['user', 'roles'] as const,
  } as const;
  
  constructor() {}
  
  /**
   * 獲取當前使用者資料的 Hook
   */
  useCurrentUser() {
    return useQuery({
      queryKey: this.USER_QUERY_KEYS.USER_PROFILE,
      queryFn: (): UserProfile | null => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            return JSON.parse(userStr);
          } catch (error) {
            console.error('解析使用者資料失敗:', error);
            return null;
          }
        }
        return null;
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: false,
    });
  }

  /**
   * 獲取當前使用者會話的 Hook
   */
  useCurrentUserSession() {
    return useQuery({
      queryKey: this.USER_QUERY_KEYS.USER_SESSION,
      queryFn: (): UserSession | null => {
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            return {
              user,
              token,
              expiresAt: '',
            };
          } catch (error) {
            console.error('解析會話資料失敗:', error);
            return null;
          }
        }
        return null;
      },
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: false,
    });
  }

  /**
   * 檢查使用者是否有特定權限的 Hook
   */
  useHasPermission(permission: string) {
    const { data: user } = this.useCurrentUser();
    
    return {
      hasPermission: user?.permissions?.includes(permission) || false,
      isLoading: !user,
      user,
    };
  }

  /**
   * 檢查使用者是否有特定角色的 Hook
   */
  useHasRole(role: string) {
    const { data: user } = this.useCurrentUser();
    
    return {
      hasRole: user?.roles?.includes(role) || false,
      isLoading: !user,
      user,
    };
  }

  /**
   * 綜合使用者資訊 Hook
   */
  useUserInfo() {
    const userQuery = this.useCurrentUser();
    const sessionQuery = this.useCurrentUserSession();
    
    const isAuthenticated = !!userQuery.data && !!sessionQuery.data;
    const isLoading = userQuery.isLoading || sessionQuery.isLoading;
    
    return {
      user: userQuery.data,
      session: sessionQuery.data,
      isAuthenticated,
      isLoading,
      error: userQuery.error || sessionQuery.error,
      refetch: () => {
        userQuery.refetch();
        sessionQuery.refetch();
      },
    };
  }

  /**
   * RBAC 用戶數據查詢 Hook
   */
  useRbacUsers() {
    return useQuery({
      queryKey: this.USER_QUERY_KEYS.RBAC_USERS,
      queryFn: async (): Promise<User[]> => {
        try {
          logger.debug('Fetching RBAC users from API');
          
          const response = await apiClient.get('/api/rbac/users');
          const result = RequestResult.fromResponse<User[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully fetched ${result.data?.length || 0} RBAC users`);
          return result.unwrap();
        } catch (error: any) {
          console.error('Failed to fetch RBAC users:', error);
          
          throw {
            message: error.response?.data?.message || 'Failed to fetch users',
            status: error.response?.status,
            details: error.response?.data,
          } as TableError;
        }
      },
      staleTime: 5 * 60 * 1000, // 5分鐘
      gcTime: 15 * 60 * 1000, // 15分鐘
      retry: 2,
    });
  }

  /**
   * 用戶角色關聯查詢 Hook
   */
  useUserRoles() {
    return useQuery({
      queryKey: this.USER_QUERY_KEYS.USER_ROLES,
      queryFn: async (): Promise<UserRole[]> => {
        try {
          logger.debug('Fetching user roles from API');
          
          const response = await apiClient.get('/api/rbac/user-roles');
          const result = RequestResult.fromResponse<UserRole[]>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          logger.info(`Successfully fetched ${result.data?.length || 0} user roles`);
          return result.unwrap();
        } catch (error: any) {
          console.error('Failed to fetch user roles:', error);
          
          throw {
            message: error.response?.data?.message || 'Failed to fetch user roles',
            status: error.response?.status,
            details: error.response?.data,
          } as TableError;
        }
      },
      staleTime: 2 * 60 * 1000, // 2分鐘
      gcTime: 10 * 60 * 1000, // 10分鐘
      retry: 2,
    });
  }

  /**
   * RBAC 用戶數據更新 Mutation
   */
  useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ id, data }: { id: number; data: UserUpdateRequest }) => {
        try {
          logger.debug(`Updating user with ID: ${id}`, data);
          
          const response = await apiClient.put(`/api/rbac/users/${id}`, data);
          
          logger.info(`Successfully updated user with ID: ${id}`);
          return { id, data };
        } catch (error: any) {
          
          const errorMsg = error.response?.data?.message || error.message || 'Update failed';
          throw new Error(errorMsg);
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: this.USER_QUERY_KEYS.RBAC_USERS });
        queryClient.invalidateQueries({ queryKey: this.USER_QUERY_KEYS.USER_ROLES });
      },
      retry: 1,
    });
  }
}



