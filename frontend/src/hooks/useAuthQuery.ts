/**
 * @fileoverview React Query hooks 用於認證 API 調用
 * 
 * 使用 React Query 處理認證相關的 API 請求 mutations。
 * 狀態管理已移至 authStore (Zustand)。
 * 
 * @author AIOT Development Team
 * @version 2.0.0
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { ReqResult } from '../utils/ReqResult';
import { LoginRequest, ExtendedLoginResponse, LogoutResponse } from '../types/auth';
import { useAuthActions } from '../stores';
import type { TableError } from '../types/table';
import { createLogger } from '../configs/loggerConfig';

const logger = createLogger('useAuthQuery');

/**
 * AuthQuery - 認證查詢服務類
 * 
 * 使用 class 封裝所有與認證相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
export class AuthQuery {
  
  public AUTH_QUERY_KEYS = {
    LOGIN: ['auth', 'login'] as const,
    LOGOUT: ['auth', 'logout'] as const,
    INITIALIZE: ['auth', 'initialize'] as const,
  } as const;
  
  constructor() {}
  
  /**
   * 初始化認證 Query - 檢查 httpOnly cookie 是否有效
   * 
   * 注意：此函數使用 httpOnly cookie 進行認證檢查
   * 認證失敗是正常情況（表示用戶未登入或 cookie 過期）
   */
  useInitializeAuth(enabled: boolean = true) {
    const { initializeAuthSuccess, initializeAuthError, setLoading } = useAuthActions();

    return useQuery({
      queryKey: this.AUTH_QUERY_KEYS.INITIALIZE,
      queryFn: async () => {
        try {
          setLoading(true);
          // 嘗試使用 httpOnly cookie 向後端發送驗證請求
          const response = await apiClient.get('/auth');
          const result = ReqResult.fromResponse(response);
          
          if (result.isError()) {
            // 認證失敗是正常的，只記錄資訊不拋錯
            logger.info('Cookie authentication check failed (normal for unauthenticated users)', {
              status: result.status,
              message: result.message
            });
            initializeAuthError(null); // 清除錯誤狀態，因為這不是真正的錯誤
            return null; // 返回 null 表示未認證
          }
          
          const userData = result.unwrap();
          logger.info('Cookie authentication check successful', { username: userData.user?.username });
          initializeAuthSuccess(userData);
          return userData;
        } catch (error: any) {
          // 網路錯誤或其他非認證相關錯誤才記錄為 error
          if (error.response?.status === 401) {
            // 401 是正常的未認證狀態，只記錄資訊
            logger.info('Cookie authentication check: user not authenticated', {
              status: 401,
              message: 'No valid authentication cookie found'
            });
            initializeAuthError(null); // 清除錯誤狀態
            return null;
          } else {
            // 其他錯誤（網路問題、服務器錯誤等）才是真正的錯誤
            logger.error('Initialize auth failed due to network or server error', { 
              error,
              status: error.response?.status,
              message: error.message
            });
            const errorMessage = 'Network error during authentication check';
            initializeAuthError(errorMessage);
            throw error;
          }
        }
      },
      enabled,
      retry: false, // 不重試，因為認證失敗是正常的
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 分鐘
      // 不要將 401 視為錯誤
      throwOnError: false,
    });
  }

  /**
   * 登入 Mutation
   */
  useLogin() {
    const { setAuthData, setError } = useAuthActions();

    return useMutation({
      mutationKey: this.AUTH_QUERY_KEYS.LOGIN,
      mutationFn: async (loginData: LoginRequest): Promise<ExtendedLoginResponse> => {
        try {
          const response = await apiClient.post('/auth', loginData);
          const result = ReqResult.fromResponse<ExtendedLoginResponse>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Login failed', { error, loginData });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Login failed',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        setAuthData(data);
        setError(null);
      },
      onError: (error: TableError) => {
        setError(error.message);
      },
      retry: 1,
    });
  }

  /**
   * 登出 Mutation
   */
  useLogout() {
    const { clearAuth, setError } = useAuthActions();

    return useMutation({
      mutationKey: this.AUTH_QUERY_KEYS.LOGOUT,
      mutationFn: async (): Promise<LogoutResponse> => {
        try {
          const response = await apiClient.delete('/auth');
          const result = ReqResult.fromResponse<LogoutResponse>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Logout failed', { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Logout failed',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: () => {
        clearAuth();
      },
      onError: (error: TableError) => {
        clearAuth();
        setError(error.message);
      },
      retry: 1,
    });
  }
}

/**
 * 全局 AuthQuery 實例
 */
export const authQuery = new AuthQuery();

/**
 * 初始化認證 Hook
 */
export const useInitializeAuth = (enabled?: boolean) => {
  return authQuery.useInitializeAuth(enabled);
};

/**
 * 登入 Hook  
 */
export const useLogin = () => {
  return authQuery.useLogin();
};

/**
 * 登出 Hook
 */
export const useLogout = () => {
  return authQuery.useLogout();
};