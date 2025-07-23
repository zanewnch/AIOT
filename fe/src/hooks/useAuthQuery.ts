/**
 * @fileoverview 認證相關的 React Query Hooks
 * 
 * 這個檔案包含所有認證相關的 API 請求邏輯，使用 React Query 來處理：
 * - 快取管理
 * - 異步狀態處理
 * - 錯誤處理
 * - 重試邏輯
 * 
 * 與 authStore 分離：
 * - authStore: 負責狀態管理
 * - useAuthQuery: 負責 API 請求
 * 
 * @author AIOT Development Team
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User, LoginRequest, AuthError, LoginResponse } from '../types/auth';

/**
 * React Query 查詢鍵
 */
export const AUTH_QUERY_KEYS = {
  INITIALIZE: ['auth', 'initialize'] as const,
  USER: ['auth', 'user'] as const,
} as const;

/**
 * API 基礎 URL
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8010';

/**
 * API 函數：使用者登入
 */
const loginAPI = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const data: LoginResponse = await response.json();
    
    // 將 JWT token 存儲在 localStorage 中供後續請求使用
    localStorage.setItem('authToken', data.token);
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw { message: error.message, status: 401 } as AuthError;
    }
    throw { message: 'An unexpected error occurred', status: 500 } as AuthError;
  }
};

/**
 * API 函數：使用者登出
 */
const logoutAPI = async (): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('authToken');
  }
};

/**
 * 工具函數：檢查使用者是否已登入
 */
const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('authToken');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    localStorage.removeItem('authToken');
    return false;
  }
};

/**
 * 工具函數：從 token 中獲取使用者資訊
 */
const getCurrentUser = (): User | null => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub,
      username: payload.username || `user_${payload.sub}`,
    };
  } catch (error) {
    console.error('Failed to parse token:', error);
    return null;
  }
};

/**
 * 工具函數：獲取存儲的 token
 */
const getToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * 初始化認證狀態的 Query Hook
 * 
 * 用於應用啟動時檢查用戶的認證狀態
 */
export const useInitializeAuthQuery = () => {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.INITIALIZE,
    queryFn: async () => {
      const isAuth = isAuthenticated();
      const currentUser = getCurrentUser();

      if (isAuth && currentUser) {
        return { isAuthenticated: true, user: currentUser };
      } else {
        return { isAuthenticated: false, user: null };
      }
    },
    staleTime: Infinity, // 認證狀態在會話期間不會過期
    gcTime: Infinity,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

/**
 * 登入 Mutation Hook
 * 
 * 處理用戶登入請求
 */
export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      await loginAPI(credentials);
      const currentUser = getCurrentUser();

      if (currentUser) {
        return { user: currentUser, isAuthenticated: true };
      } else {
        throw new Error('Failed to get user information');
      }
    },
    onSuccess: () => {
      // 使初始化查詢無效，確保狀態同步
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.INITIALIZE });
    },
    onError: (error: AuthError) => {
      console.error('Login error:', error);
    },
  });
};

/**
 * 登出 Mutation Hook
 * 
 * 處理用戶登出請求
 */
export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await logoutAPI();
      return null;
    },
    onSuccess: () => {
      // 清除所有查詢緩存
      queryClient.clear();
    },
    onError: (error: any) => {
      console.error('Logout error:', error);
      // 即使登出失敗，也要清除快取以確保安全性
      queryClient.clear();
    },
  });
};

/**
 * 主要認證 Hook
 * 
 * 使用 React Query 來管理所有認證狀態，包括：
 * - 用戶數據
 * - 載入狀態  
 * - 錯誤狀態
 * - 認證狀態
 */
export const useAuth = () => {
  const queryClient = useQueryClient();
  
  // 認證狀態查詢
  const initializeQuery = useInitializeAuthQuery();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();

  // 從 React Query 狀態中推斷認證資訊
  const authData = initializeQuery.data;
  const user = authData?.user || null;
  const isAuthenticated = authData?.isAuthenticated || false;
  
  // 綜合載入狀態
  const isLoading = initializeQuery.isLoading || loginMutation.isPending || logoutMutation.isPending;
  
  // 綜合錯誤狀態
  const error = initializeQuery.error || loginMutation.error || logoutMutation.error;

  return {
    // 狀態 (由 React Query 管理)
    user,
    isAuthenticated,
    isLoading,
    error: error?.message || null,
    
    // 查詢狀態
    isInitialized: !initializeQuery.isLoading && initializeQuery.data !== undefined,
    
    // 方法
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    
    // 工具方法
    refetchAuth: () => initializeQuery.refetch(),
    invalidateAuth: () => queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.INITIALIZE }),
    clearAuthCache: () => queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.INITIALIZE }),
    
    // 原始的 query/mutation 對象 (用於更高級的操作)
    queries: {
      initialize: initializeQuery,
    },
    mutations: {
      login: loginMutation,
      logout: logoutMutation,
    },
  };
};

/**
 * 導出工具函數供其他模組使用
 */
export const authUtils = {
  isAuthenticated,
  getCurrentUser,
  getToken,
};

/**
 * 舊的 useAuthQuery - 保持向後兼容
 * @deprecated 請直接使用 useAuth
 */
export const useAuthQuery = useAuth;