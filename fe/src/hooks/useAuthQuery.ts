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
import { authService, User, LoginRequest, AuthError } from '../services/AuthService';

/**
 * React Query 查詢鍵
 */
export const AUTH_QUERY_KEYS = {
  INITIALIZE: ['auth', 'initialize'] as const,
  USER: ['auth', 'user'] as const,
} as const;

/**
 * 初始化認證狀態的 Query Hook
 * 
 * 用於應用啟動時檢查用戶的認證狀態
 */
export const useInitializeAuthQuery = () => {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.INITIALIZE,
    queryFn: async () => {
      const isAuth = authService.isAuthenticated();
      const currentUser = authService.getCurrentUser();

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
      await authService.login(credentials);
      const currentUser = authService.getCurrentUser();

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
      await authService.logout();
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
 * 舊的 useAuthQuery - 保持向後兼容
 * @deprecated 請直接使用 useAuth
 */
export const useAuthQuery = useAuth;