/**
 * @fileoverview React Query hooks 用於使用者數據管理
 * 
 * 使用 React Query 處理所有與使用者相關的數據獲取、緩存和同步。
 * 這個檔案主要作為使用者相關功能的聚合器，整合偏好設定和活動追蹤功能。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { useQuery } from '@tanstack/react-query';
import { UserProfile, UserSession } from '../types/user';

// 重新匯出相關的 hooks 供統一使用
export { 
  useUserActivity, 
  useActivityStats, 
  useRecordPageVisit, 
  useUpdateSessionInfo, 
  useActivityTracking,
  QUERY_KEYS as ACTIVITY_QUERY_KEYS
} from './useActivityQuery';

// 重新匯出 RBAC 用戶管理相關的 hooks
export { 
  useRbacUsers as useUserData,
  useUpdateUser as useUpdateUserData,
  useCreateUser,
  useDeleteUser,
  useRbacUserById as useUserById,
} from './useRbacQuery';

/**
 * React Query 查詢鍵常量
 */
export const USER_QUERY_KEYS = {
  USER_PROFILE: ['userProfile'] as const,
  USER_SESSION: ['userSession'] as const,
} as const;


/**
 * 獲取當前使用者資料的 Hook
 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.USER_PROFILE,
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
};

/**
 * 獲取當前使用者會話的 Hook
 */
export const useCurrentUserSession = () => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.USER_SESSION,
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
};

/**
 * 檢查使用者是否有特定權限的 Hook
 */
export const useHasPermission = (permission: string) => {
  const { data: user } = useCurrentUser();
  
  return {
    hasPermission: user?.permissions?.includes(permission) || false,
    isLoading: !user,
    user,
  };
};

/**
 * 檢查使用者是否有特定角色的 Hook
 */
export const useHasRole = (role: string) => {
  const { data: user } = useCurrentUser();
  
  return {
    hasRole: user?.roles?.includes(role) || false,
    isLoading: !user,
    user,
  };
};

/**
 * 綜合使用者資訊 Hook
 */
export const useUserInfo = () => {
  const userQuery = useCurrentUser();
  const sessionQuery = useCurrentUserSession();
  
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
};