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
        try {
          const response = await apiClient.post('/auth', loginData);
          const result = RequestResult.fromResponse<ExtendedLoginResponse>(response);
          
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
          const result = RequestResult.fromResponse<LogoutResponse>(response);
          
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