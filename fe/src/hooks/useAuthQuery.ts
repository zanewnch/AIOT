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
import { apiClient } from '../utils/RequestUtils';

/**
 * React Query 查詢鍵
 */
export const AUTH_QUERY_KEYS = {
  INITIALIZE: ['auth', 'initialize'] as const,
  USER: ['auth', 'user'] as const,
} as const;


/**
 * API 函數：使用者登入（使用 ApiResult 統一錯誤處理）
 */
const loginAPI = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const result = await apiClient.postWithResult<LoginResponse>('/api/auth/login', credentials);
  
  if (result.isSuccess() && result.data) {
    // 將 JWT token 存儲在 localStorage 中供後續請求使用
    apiClient.setAuthToken(result.data.token);
    return result.data;
  } else {
    // 提供更詳細的錯誤信息
    const message = result.message || '登入失敗';
    const status = result.status || 401;
    
    // 記錄詳細的錯誤信息以便調試
    result.logError('登入錯誤');
    
    throw { message, status } as AuthError;
  }
};


/**
 * API 函數：使用者登出（使用 ApiResult）
 */
const logoutAPI = async (): Promise<void> => {
  const result = await apiClient.postWithResult<void>('/api/auth/logout');
  
  if (result.isError()) {
    // 記錄錯誤但不拋出異常，因為登出時即使後端失敗也要清除本地 token
    result.logError('登出錯誤');
  }
  
  // 無論後端請求是否成功，都清除本地 token
  apiClient.clearAuthToken();
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
  if (!token) {
    console.warn('No auth token found in localStorage');
    return null;
  }

  try {
    // 檢查 token 格式是否正確 (JWT 應該有三個部分)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('Invalid JWT token format');
      localStorage.removeItem('authToken'); // 清除無效的 token
      return null;
    }

    const payload = JSON.parse(atob(tokenParts[1]));
    
    // 檢查 payload 是否包含必要的欄位
    if (!payload.sub) {
      console.error('Invalid JWT payload: missing sub field');
      localStorage.removeItem('authToken'); // 清除無效的 token
      return null;
    }

    return {
      id: payload.sub,
      username: payload.username || `user_${payload.sub}`,
    };
  } catch (error) {
    console.error('Failed to parse token:', error);
    localStorage.removeItem('authToken'); // 清除無效的 token
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
        // 提供更詳細的錯誤訊息
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('登入失敗：未能獲取驗證令牌');
        } else {
          // 清除無效的 token 並重新登入
          localStorage.removeItem('authToken');
          throw new Error('登入失敗：驗證令牌無效或已損壞，請重新登入');
        }
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