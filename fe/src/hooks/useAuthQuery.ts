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
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      queryClient.setQueryData(AUTH_QUERY_KEYS.USER_SESSION, data);
      queryClient.setQueryData(AUTH_QUERY_KEYS.AUTH_STATUS, true);
      
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      console.error('登入失敗:', error);
      
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      delete apiClient.defaults.headers.common['Authorization'];
      
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
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      delete apiClient.defaults.headers.common['Authorization'];
      
      queryClient.clear();
      queryClient.setQueryData(AUTH_QUERY_KEYS.AUTH_STATUS, false);
      queryClient.setQueryData(AUTH_QUERY_KEYS.USER_SESSION, null);
    },
    onError: (error) => {
      console.error('登出失敗:', error);
      
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      delete apiClient.defaults.headers.common['Authorization'];
      
      queryClient.clear();
      queryClient.setQueryData(AUTH_QUERY_KEYS.AUTH_STATUS, false);
      queryClient.setQueryData(AUTH_QUERY_KEYS.USER_SESSION, null);
    },
    retry: 1,
  });
};

/**
 * 檢查認證狀態的 Hook
 */
export const useAuthStatus = () => {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  
  return {
    isAuthenticated: !!token && !!user,
    token,
    user: user ? JSON.parse(user) : null,
  };
};

/**
 * 初始化認證的 Hook
 */
export const useInitializeAuth = () => {
  const queryClient = useQueryClient();
  
  const initializeAuth = () => {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      const user = JSON.parse(userStr);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      queryClient.setQueryData(AUTH_QUERY_KEYS.USER_SESSION, { token, user });
      queryClient.setQueryData(AUTH_QUERY_KEYS.AUTH_STATUS, true);
      return true;
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
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    delete apiClient.defaults.headers.common['Authorization'];
    
    queryClient.clear();
    queryClient.setQueryData(AUTH_QUERY_KEYS.AUTH_STATUS, false);
    queryClient.setQueryData(AUTH_QUERY_KEYS.USER_SESSION, null);
  };
  
  return { clearAuth };
};

/**
 * 獲取認證狀態的綜合 Hook
 * 提供 isAuthenticated 和 isLoading 狀態
 */
export const useAuth = () => {
  const { data: isAuthenticated, isLoading } = useAuthStatus();
  
  return {
    isAuthenticated: Boolean(isAuthenticated),
    isLoading,
  };
};