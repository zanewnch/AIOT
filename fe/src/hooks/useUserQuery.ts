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


// 重新匯出 RBAC 用戶管理相關的 hooks
// Note: These hooks are accessed through the RbacQuery class now

/**
 * UserQuery - 使用者查詢服務類
 * 
 * 使用 class 封裝所有與使用者相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
class UserQuery {
  
  public USER_QUERY_KEYS = {
    USER_PROFILE: ['userProfile'] as const,
    USER_SESSION: ['userSession'] as const,
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
}



// 創建 UserQuery 實例並匯出主要 Hook
const userqueryInstance = new UserQuery();

/**
 * useUserQuery - 主要的 Hook
 * 
 * 直接匯出使用的 Hook，與現有代碼相容
 */
export const useUserQuery = () => userqueryInstance;

// 也可以匯出 UserQuery 類別本身，供進階使用  
export { UserQuery };
