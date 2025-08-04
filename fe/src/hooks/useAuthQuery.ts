/**
 * @fileoverview React Query hooks 用於認證 API 調用
 * 
 * 使用 React Query 處理認證相關的 API 請求 mutations。
 * 狀態管理已移至 authStore (Zustand)。
 * 
 * @author AIOT Development Team
 * @version 2.0.0
 */

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';
import { LoginRequest, ExtendedLoginResponse, LogoutResponse } from '../types/auth';
import { useAuthActions } from '../stores';

/**
 * AuthQuery - 認證查詢服務類
 * 
 * 使用 class 封裝所有與認證相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
class AuthQuery {
  
  public AUTH_QUERY_KEYS = {
    LOGIN: ['auth', 'login'] as const,
    LOGOUT: ['auth', 'logout'] as const,
  } as const;
  
  constructor() {}
  
  /**
   * 登入 Mutation
   */
  useLogin() {
    const { setAuthData, setError } = useAuthActions();

    return useMutation({
      mutationKey: this.AUTH_QUERY_KEYS.LOGIN,
      mutationFn: async (loginData: LoginRequest): Promise<ExtendedLoginResponse> => {
        const response = await apiClient.post('/api/auth/login', loginData);
        const result = RequestResult.fromResponse<ExtendedLoginResponse>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
      },
      onSuccess: (data) => {
        setAuthData(data);
        setError(null);
      },
      onError: (error: Error) => {
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
        const response = await apiClient.post('/api/auth/logout');
        const result = RequestResult.fromResponse<LogoutResponse>(response);
        
        if (result.isError()) {
          throw new Error(result.message);
        }
        
        return result.unwrap();
      },
      onSuccess: () => {
        clearAuth();
      },
      onError: (error: Error) => {
        clearAuth();
        setError(error.message);
      },
      retry: 1,
    });
  }
}

// 創建 AuthQuery 實例並匯出主要 Hook
const authQuery = new AuthQuery();

/**
 * useAuthQuery - 主要的認證 Hook
 * 
 * 直接匯出使用的 Hook，與現有代碼相容
 */
export const useAuthQuery = () => ({
  login: authQuery.useLogin(),
  logout: authQuery.useLogout(),
});

// 也可以匯出 AuthQuery 類別本身，供進階使用
export { AuthQuery };
