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
// API 邏輯已移至 hooks/useAuthQuery.ts

/**
 * 認證狀態接口
 * 
 * 定義認證 store 的完整狀態結構和可用的動作方法
 */
interface AuthState {
  // 狀態
  /** 使用者是否已通過認證 */
  isAuthenticated: boolean;
  /** 目前登入的使用者資訊，未登入時為 null */
  user: User | null;
  /** 認證 token，通常為 JWT */
  token: string | null;
  /** 是否正在進行認證相關操作 */
  isLoading: boolean;
  /** 認證過程中發生的錯誤訊息 */
  error: string | null;
  
  // 動作
  /** 設定認證狀態 */
  setAuthenticated: (authenticated: boolean) => void;
  /** 設定使用者資訊 */
  setUser: (user: User | null) => void;
  /** 設定認證 token */
  setToken: (token: string | null) => void;
  /** 設定載入狀態 */
  setLoading: (loading: boolean) => void;
  /** 設定錯誤訊息 */
  setError: (error: string | null) => void;
  
  // 複合動作
  /** 設定完整的認證資料（登入成功時使用） */
  setAuthData: (data: ExtendedLoginResponse) => void;
  /** 清除所有認證資料（登出時使用） */
  clearAuth: () => void;
  /** 初始化認證成功（應用程式啟動時使用） */
  initializeAuthSuccess: (userData: any) => void;
  /** 初始化認證失敗（應用程式啟動時使用） */
  initializeAuthError: (error: string | null) => void;
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
        /**
         * 設定認證狀態
         * 
         * @param authenticated - 認證狀態，true 表示已認證
         * 
         * @example
         * ```typescript
         * setAuthenticated(true);  // 設定為已認證
         * setAuthenticated(false); // 設定為未認證
         * ```
         */
        setAuthenticated: (authenticated) => 
          set({ isAuthenticated: authenticated }, false, 'auth/setAuthenticated'),

        /**
         * 設定使用者資訊
         * 
         * @param user - 使用者物件，登出時可傳入 null
         * 
         * @example
         * ```typescript
         * setUser({ id: 1, username: 'admin' }); // 設定使用者
         * setUser(null); // 清除使用者資訊
         * ```
         */
        setUser: (user) => 
          set({ user }, false, 'auth/setUser'),

        /**
         * 設定認證 token
         * 
         * @param token - 認證 token 字串，通常為 JWT
         * 
         * @example
         * ```typescript
         * setToken('eyJhbGciOiJIUzI1NiIs...'); // 設定 token
         * setToken(null); // 清除 token
         * ```
         */
        setToken: (token) => 
          set({ token }, false, 'auth/setToken'),

        /**
         * 設定載入狀態
         * 
         * @param loading - 是否正在載入
         * 
         * @example
         * ```typescript
         * setLoading(true);  // 開始載入
         * setLoading(false); // 完成載入
         * ```
         */
        setLoading: (loading) => 
          set({ isLoading: loading }, false, 'auth/setLoading'),

        /**
         * 設定錯誤訊息
         * 
         * @param error - 錯誤訊息字串，無錯誤時傳入 null
         * 
         * @example
         * ```typescript
         * setError('登入失敗'); // 設定錯誤訊息
         * setError(null);     // 清除錯誤訊息
         * ```
         */
        setError: (error) => 
          set({ error }, false, 'auth/setError'),

        // 複合動作：設置完整的認證數據
        /**
         * 設定完整的認證資料
         * 
         * 通常在登入成功後調用，一次性設定所有認證相關資料
         * 
         * @param data - 包含使用者資訊和 token 的登入回應物件
         * 
         * @example
         * ```typescript
         * setAuthData({
         *   user: { id: '1', username: 'admin' },
         *   token: 'jwt-token-here'
         * });
         * ```
         */
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

        /**
         * 清除所有認證資料
         * 
         * 將所有認證相關的狀態重設為初始值，通常在登出時調用
         * 
         * @example
         * ```typescript
         * clearAuth(); // 清除所有認證資料
         * ```
         */
        clearAuth: () => 
          set({
            isAuthenticated: false,
            user: null,
            token: null,
            error: null
          }, false, 'auth/clearAuth'),

        /**
         * 初始化認證成功
         * 
         * 應用程式啟動時，如果發現使用者已經認證，則調用此方法設定認證狀態
         * 
         * @param userData - 使用者資料物件，包含使用者資訊和 token
         * 
         * @example
         * ```typescript
         * initializeAuthSuccess({
         *   user: { id: 1, username: 'admin' },
         *   token: 'existing-token'
         * });
         * ```
         */
        initializeAuthSuccess: (userData) => 
          set({
            isAuthenticated: true,
            user: userData.user,
            token: userData.token || null,
            isLoading: false,
            error: null
          }, false, 'auth/initializeAuth/success'),

        /**
         * 初始化認證失敗
         * 
         * 應用程式啟動時，如果認證檢查失敗，則調用此方法清除認證狀態
         * 
         * @param error - 錯誤訊息，描述認證失敗的原因
         * 
         * @example
         * ```typescript
         * initializeAuthError('Token 已過期');
         * ```
         */
        initializeAuthError: (error) => 
          set({
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false,
            error
          }, false, 'auth/initializeAuth/error')
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
    initializeAuthSuccess,
    initializeAuthError,
    setLoading, 
    setError 
  } = useAuthStore();
  
  return {
    setAuthData,
    clearAuth,
    initializeAuthSuccess,
    initializeAuthError,
    setLoading,
    setError
  };
};