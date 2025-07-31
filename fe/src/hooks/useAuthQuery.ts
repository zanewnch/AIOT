/**
 * @fileoverview React Query hooks 用於認證數據管理
 * 
 * 使用 React Query 處理所有與認證相關的數據獲取、緩存和同步。
 * 提供強大的數據獲取、錯誤處理和背景更新功能。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';
import { LoginRequest, ExtendedLoginResponse, LogoutResponse } from '../types/auth';

/**
 * React Query 查詢鍵常量
 */
export const AUTH_QUERY_KEYS = {
  USER_SESSION: ['userSession'] as const,
  AUTH_STATUS: ['authStatus'] as const,
} as const;



/**
 * 使用者登入的 Mutation Hook
 */
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loginData: LoginRequest): Promise<ExtendedLoginResponse> => {
      const response = await apiClient.post('/api/auth/login', loginData);
      const result = RequestResult.fromResponse<ExtendedLoginResponse>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    onSuccess: (data) => {
      // 不再使用 localStorage - httpOnly cookie 已由後端自動設置
      // localStorage.setItem('authToken', data.token);
      // localStorage.setItem('user', JSON.stringify(data.user));
      
      // 不需要手動設置 Authorization header - cookie 會自動傳送
      // if (apiClient && typeof apiClient.setAuthToken === 'function') {
      //   apiClient.setAuthToken(data.token);
      // }
      
      // 更新 React Query 快取狀態
      queryClient.setQueryData(AUTH_QUERY_KEYS.USER_SESSION, data);
      queryClient.setQueryData(AUTH_QUERY_KEYS.AUTH_STATUS, true);
      
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      console.error('登入失敗:', error);
      
      // 不需要清除 localStorage - 沒有存儲在那裡
      // localStorage.removeItem('authToken');
      // localStorage.removeItem('user');
      
      // 不需要清除 Authorization header - 使用 cookie 驗證
      // if (apiClient && typeof apiClient.clearAuthToken === 'function') {
      //   apiClient.clearAuthToken();
      // }
      
      queryClient.setQueryData(AUTH_QUERY_KEYS.AUTH_STATUS, false);
      queryClient.setQueryData(AUTH_QUERY_KEYS.USER_SESSION, null);
    },
    retry: 1,
  });
};

/**
 * 使用者登出的 Mutation Hook
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<LogoutResponse> => {
      const response = await apiClient.post('/api/auth/logout');
      const result = RequestResult.fromResponse<LogoutResponse>(response);
      
      if (result.isError()) {
        throw new Error(result.message);
      }
      
      return result.unwrap();
    },
    onSuccess: () => {
      // 不需要清除 localStorage - 沒有存儲在那裡
      // localStorage.removeItem('authToken');
      // localStorage.removeItem('user');
      
      // 不需要清除 Authorization header - httpOnly cookie 由後端自動清除
      // delete apiClient.defaults.headers.common['Authorization'];
      
      queryClient.clear();
      queryClient.setQueryData(AUTH_QUERY_KEYS.AUTH_STATUS, false);
      queryClient.setQueryData(AUTH_QUERY_KEYS.USER_SESSION, null);
    },
    onError: (error) => {
      console.error('登出失敗:', error);
      
      // 即使登出請求失敗，也要清理前端狀態
      // 不需要清除 localStorage - 沒有存儲在那裡
      // localStorage.removeItem('authToken');
      // localStorage.removeItem('user');
      
      // 不需要清除 Authorization header - 使用 cookie 驗證
      // delete apiClient.defaults.headers.common['Authorization'];
      
      queryClient.clear();
      queryClient.setQueryData(AUTH_QUERY_KEYS.AUTH_STATUS, false);
      queryClient.setQueryData(AUTH_QUERY_KEYS.USER_SESSION, null);
    },
    retry: 1,
  });
};

/**
 * 檢查認證狀態的 Hook
 * 使用 httpOnly cookie 時，我們依賴 React Query 快取而不是 localStorage
 */
export const useAuthStatus = () => {
  const queryClient = useQueryClient();
  const authStatus = queryClient.getQueryData(AUTH_QUERY_KEYS.AUTH_STATUS);
  const userSession = queryClient.getQueryData(AUTH_QUERY_KEYS.USER_SESSION);
  
  return {
    isAuthenticated: !!authStatus,
    token: userSession?.token || null, // 來自 API 回應，不是 localStorage
    user: userSession?.user || null,
  };
};

/**
 * 初始化認證的 Hook
 * 使用 httpOnly cookie 時，我們需要向後端發送請求來驗證認證狀態
 */
export const useInitializeAuth = () => {
  const queryClient = useQueryClient();
  
  const initializeAuth = async () => {
    try {
      // 嘗試使用 cookie 向後端發送驗證請求
      const response = await apiClient.get('/api/auth/me'); // 假設有這個端點
      const result = RequestResult.fromResponse(response);
      
      if (result.isSuccess()) {
        const userData = result.unwrap();
        queryClient.setQueryData(AUTH_QUERY_KEYS.USER_SESSION, userData);
        queryClient.setQueryData(AUTH_QUERY_KEYS.AUTH_STATUS, true);
        return true;
      }
    } catch (error) {
      // 如果驗證失敗，清除認證狀態
      queryClient.setQueryData(AUTH_QUERY_KEYS.AUTH_STATUS, false);
      queryClient.setQueryData(AUTH_QUERY_KEYS.USER_SESSION, null);
    }
    
    return false;
  };
  
  return { initializeAuth };
};

/**
 * 清除認證的 Hook
 */
export const useClearAuth = () => {
  const queryClient = useQueryClient();
  
  const clearAuth = () => {
    // 不需要清除 localStorage - 沒有存儲在那裡
    // localStorage.removeItem('authToken');
    // localStorage.removeItem('user');
    
    // 不需要清除 Authorization header - 使用 cookie 驗證
    // delete apiClient.defaults.headers.common['Authorization'];
    
    queryClient.clear();
    queryClient.setQueryData(AUTH_QUERY_KEYS.AUTH_STATUS, false);
    queryClient.setQueryData(AUTH_QUERY_KEYS.USER_SESSION, null);
  };
  
  return { clearAuth };
};

/**
 * 獲取認證狀態的綜合 Hook
 * 提供 isAuthenticated、isLoading 和 isInitialized 狀態
 */
export const useAuth = () => {
  const authStatus = useAuthStatus();
  
  return {
    isAuthenticated: authStatus.isAuthenticated,
    isLoading: false,
    isInitialized: true,
  };
};