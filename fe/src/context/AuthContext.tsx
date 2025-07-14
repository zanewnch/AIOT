import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, LoginRequest, AuthError } from '../services/AuthService';

/**
 * 認證上下文的狀態介面
 */
interface AuthContextState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

/**
 * 認證上下文
 */
const AuthContext = createContext<AuthContextState | undefined>(undefined);

/**
 * 認證提供者組件的 props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 認證提供者組件
 * 
 * 提供認證狀態管理和認證相關的操作函數給子組件使用。
 * 包含登入、登出、錯誤處理和載入狀態管理。
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 初始化認證狀態
   * 檢查是否有有效的 token 和使用者資訊
   */
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const isAuth = authService.isAuthenticated();
        const currentUser = authService.getCurrentUser();

        if (isAuth && currentUser) {
          setIsAuthenticated(true);
          setUser(currentUser);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * 登入函數
   * 
   * @param credentials - 使用者登入憑證
   */
  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.login(credentials);
      const currentUser = authService.getCurrentUser();

      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        throw new Error('Failed to get user information');
      }
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message || 'Login failed');
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 登出函數
   */
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setIsLoading(false);
    }
  };

  /**
   * 清除錯誤訊息
   */
  const clearError = () => {
    setError(null);
  };

  const contextValue: AuthContextState = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 使用認證上下文的 Hook
 * 
 * @returns AuthContextState - 認證狀態和操作函數
 * @throws Error - 如果在 AuthProvider 外部使用會拋出錯誤
 */
export const useAuth = (): AuthContextState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};