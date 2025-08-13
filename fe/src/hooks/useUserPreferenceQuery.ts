/**
 * @fileoverview React Query hooks 用於使用者偏好設定數據管理
 * 
 * 使用 React Query 處理所有與使用者偏好設定相關的數據獲取、緩存和同步。
 * 提供強大的數據獲取、錯誤處理和背景更新功能。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';
import {
  UserPreferences,
  CreateUserPreferencesRequest,
  UpdateUserPreferencesRequest,
} from '../types/userPreference';
import type { TableError } from '../types/table';
import { createLogger } from '../configs/loggerConfig';

const logger = createLogger('useUserPreferenceQuery');

/**
 * UserPreferenceQuery - 使用者偏好設定查詢服務類
 * 
 * 使用 class 封裝所有與使用者偏好設定相關的 React Query 操作
 * 每個方法返回對應的 React Query hook
 */
export class UserPreferenceQuery {
  public USER_PREFERENCE_QUERY_KEYS: {
    readonly USER_PREFERENCES: readonly ['userPreferences'];
  };

  constructor() {
    this.USER_PREFERENCE_QUERY_KEYS = {
      USER_PREFERENCES: ['userPreferences'] as const,
    } as const;
  }

  /**
   * 獲取使用者偏好設定的 Hook
   */
  useUserPreferences() {
    return useQuery({
      queryKey: this.USER_PREFERENCE_QUERY_KEYS.USER_PREFERENCES,
      queryFn: async (): Promise<UserPreferences> => {
        try {
          const response = await apiClient.get('/api/general/user-preferences');
          const result = RequestResult.fromResponse<UserPreferences>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('Failed to fetch user preferences', { error });
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || 'Failed to fetch user preferences',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      staleTime: 5 * 60 * 1000, // 5分鐘內不會重新獲取
      gcTime: 30 * 60 * 1000, // 30分鐘後清除緩存
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
  }

  /**
   * 創建使用者偏好設定的 Mutation Hook
   */
  useCreateUserPreferences() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (data: CreateUserPreferencesRequest): Promise<UserPreferences> => {
        try {
          const response = await apiClient.post('/api/general/user-preferences', data);
          const result = RequestResult.fromResponse<UserPreferences>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('創建使用者偏好設定失敗:', error);
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || '創建使用者偏好設定失敗',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onSuccess: (data) => {
        // 更新查詢緩存
        queryClient.setQueryData(this.USER_PREFERENCE_QUERY_KEYS.USER_PREFERENCES, data);
      },
      onError: (error: TableError) => {
        logger.error('創建使用者偏好設定失敗:', error);
      },
      retry: 2,
    });
  }

  /**
   * 更新使用者偏好設定的 Mutation Hook
   */
  useUpdateUserPreferences() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (data: UpdateUserPreferencesRequest): Promise<UserPreferences> => {
        try {
          const response = await apiClient.put('/api/general/user-preferences', data);
          const result = RequestResult.fromResponse<UserPreferences>(response);
          
          if (result.isError()) {
            throw new Error(result.message);
          }
          
          return result.unwrap();
        } catch (error: any) {
          logger.error('更新使用者偏好設定失敗:', error);
          const tableError: TableError = {
            message: error.response?.data?.message || error.message || '更新使用者偏好設定失敗',
            status: error.response?.status,
            details: error.response?.data,
          };
          throw tableError;
        }
      },
      onMutate: async (newPreferences) => {
        // 取消任何正在進行的查詢
        await queryClient.cancelQueries({ queryKey: this.USER_PREFERENCE_QUERY_KEYS.USER_PREFERENCES });

        // 保存當前資料作為回滾使用
        const previousPreferences = queryClient.getQueryData(this.USER_PREFERENCE_QUERY_KEYS.USER_PREFERENCES);

        // 樂觀更新
        queryClient.setQueryData(
          this.USER_PREFERENCE_QUERY_KEYS.USER_PREFERENCES,
          (old: UserPreferences | undefined) => {
            if (!old) return undefined;
            return { ...old, ...newPreferences, updatedAt: new Date().toISOString() };
          }
        );

        return { previousPreferences };
      },
      onSuccess: (data) => {
        // 使用伺服器返回的最新資料更新緩存
        queryClient.setQueryData(this.USER_PREFERENCE_QUERY_KEYS.USER_PREFERENCES, data);
      },
      onError: (error, newPreferences, context) => {
        logger.error('更新使用者偏好設定失敗:', error);
        
        // 回滾到之前的狀態
        if (context?.previousPreferences) {
          queryClient.setQueryData(
            this.USER_PREFERENCE_QUERY_KEYS.USER_PREFERENCES,
            context.previousPreferences
          );
        }
      },
      onSettled: () => {
        // 無論成功或失敗，都重新獲取資料以確保一致性
        queryClient.invalidateQueries({ queryKey: this.USER_PREFERENCE_QUERY_KEYS.USER_PREFERENCES });
      },
      retry: 2,
    });
  }

  /**
   * 快速更新特定偏好設定的 Hook
   */
  useUpdatePreference() {
    const updateMutation = this.useUpdateUserPreferences();
    
    const updateTheme = (theme: UserPreferences['theme']) => {
      return updateMutation.mutate({ theme });
    };

    const updateLanguage = (language: string) => {
      return updateMutation.mutate({ language });
    };

    const updateNotifications = (notifications: Partial<UserPreferences['notifications']>) => {
      return updateMutation.mutate({ notifications });
    };

    const updatePrivacy = (privacy: Partial<UserPreferences['privacy']>) => {
      return updateMutation.mutate({ privacy });
    };

    const updateDashboard = (dashboard: Partial<UserPreferences['dashboard']>) => {
      return updateMutation.mutate({ dashboard });
    };

    const updateAccessibility = (accessibility: Partial<UserPreferences['accessibility']>) => {
      return updateMutation.mutate({ accessibility });
    };

    return {
      updateTheme,
      updateLanguage,
      updateNotifications,
      updatePrivacy,
      updateDashboard,
      updateAccessibility,
      isLoading: updateMutation.isPending,
      error: updateMutation.error,
    };
  }

  /**
   * 綜合使用者偏好設定管理 Hook
   */
  usePreferencesManager() {
    const preferencesQuery = this.useUserPreferences();
    const createMutation = this.useCreateUserPreferences();
    const updateMutation = this.useUpdateUserPreferences();
    const quickUpdate = this.useUpdatePreference();

    // 檢查是否需要創建初始偏好設定
    const needsInitialization = !preferencesQuery.data && !preferencesQuery.isLoading && preferencesQuery.isError;

    const initializePreferences = (initialData?: CreateUserPreferencesRequest) => {
      return createMutation.mutate(initialData || {});
    };

    return {
      preferences: preferencesQuery.data,
      isLoading: preferencesQuery.isLoading,
      error: preferencesQuery.error,
      needsInitialization,
      
      // 操作方法
      initializePreferences,
      updatePreferences: updateMutation.mutate,
      quickUpdate,
      
      // 狀態
      isUpdating: updateMutation.isPending,
      isCreating: createMutation.isPending,
      
      // 重新獲取
      refetch: preferencesQuery.refetch,
    };
  }
}