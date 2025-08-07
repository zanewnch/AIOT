/**
 * @fileoverview 認證狀態管理 Store
 * 
 * 使用 Zustand 管理應用程式的認證狀態，包括：
 * - 使用者認證狀態
 * - 使用者資訊
 * - 認證初始化
 * - 認證清除
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, ExtendedLoginResponse } from '../types/auth';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';

/**
 * 認證狀態接口
 */
interface AuthState {
  // 狀態
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // 動作
  setAuthenticated: (authenticated: boolean) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 複合動作
  setAuthData: (data: ExtendedLoginResponse) => void;
  clearAuth: () => void;
  initializeAuth: () => Promise<boolean>;
}

/**
 * 認證 Store
 * 
 * 使用 Zustand 管理認證相關的狀態
 * 
 * 特點：
 * - 持久化到 sessionStorage (不是 localStorage，因為使用 httpOnly cookie)
 * - 支援 Redux DevTools
 * - 集中管理所有認證狀態
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始狀態
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: null,

        // 基本設置器
        setAuthenticated: (authenticated) => 
          set({ isAuthenticated: authenticated }, false, 'auth/setAuthenticated'),

        setUser: (user) => 
          set({ user }, false, 'auth/setUser'),

        setToken: (token) => 
          set({ token }, false, 'auth/setToken'),

        setLoading: (loading) => 
          set({ isLoading: loading }, false, 'auth/setLoading'),

        setError: (error) => 
          set({ error }, false, 'auth/setError'),

        // 複合動作：設置完整的認證數據
        setAuthData: (data) => 
          set({
            isAuthenticated: true,
            user: {
              id: parseInt(data.user.id),
              username: data.user.username
            },
            token: data.token,
            error: null
          }, false, 'auth/setAuthData'),

        // 清除認證狀態
        clearAuth: () => 
          set({
            isAuthenticated: false,
            user: null,
            token: null,
            error: null
          }, false, 'auth/clearAuth'),

        // 初始化認證 - 檢查 httpOnly cookie 是否有效
        initializeAuth: async () => {
          set({ isLoading: true, error: null }, false, 'auth/initializeAuth/start');
          
          try {
            // 嘗試使用 cookie 向後端發送驗證請求
            const response = await apiClient.get('/api/auth/me');
            const result = RequestResult.fromResponse(response);
            
            if (result.isSuccess()) {
              const userData = result.unwrap();
              
              // 設置認證數據
              set({
                isAuthenticated: true,
                user: userData.user,
                token: userData.token || null,
                isLoading: false,
                error: null
              }, false, 'auth/initializeAuth/success');
              
              return true;
            } else {
              throw new Error(result.message);
            }
          } catch (error) {
            // 如果驗證失敗，清除認證狀態
            set({
              isAuthenticated: false,
              user: null,
              token: null,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Authentication failed'
            }, false, 'auth/initializeAuth/error');
            
            return false;
          }
        }
      }),
      {
        name: 'auth-store',
        // 只持久化基本狀態，不持久化 isLoading 和 error
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          token: state.token
        }),
        // 使用 sessionStorage 而不是 localStorage
        // 因為我們主要依賴 httpOnly cookie
        storage: {
          getItem: (name) => {
            const item = sessionStorage.getItem(name);
            return item ? JSON.parse(item) : null;
          },
          setItem: (name, value) => {
            sessionStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            sessionStorage.removeItem(name);
          }
        }
      }
    ),
    {
      name: 'auth-store'
    }
  )
);

/**
 * 便利的 Hook，提供常用的認證狀態
 */
export const useAuth = () => {
  const { isAuthenticated, user, token, isLoading, error } = useAuthStore();
  
  return {
    isAuthenticated,
    user,
    token,
    isLoading,
    error
  };
};

/**
 * 便利的 Hook，提供認證相關的動作
 */
export const useAuthActions = () => {
  const { 
    setAuthData, 
    clearAuth, 
    initializeAuth, 
    setLoading, 
    setError 
  } = useAuthStore();
  
  return {
    setAuthData,
    clearAuth,
    initializeAuth,
    setLoading,
    setError
  };
};