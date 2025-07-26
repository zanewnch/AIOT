/**
 * @fileoverview React Query hooks 用於活動追蹤數據管理
 * 
 * 使用 React Query 處理所有與服務器相關的數據獲取、緩存和同步。
 * 提供強大的數據獲取、錯誤處理和背景更新功能。
 * 
 * @author AIOT Development Team
 * @version 2.0.0
 */

/* 
useQuery 和 useMutation 是 React Query 中兩個核心 hook，它們的差別主要在於用途和行為：
useQuery - 用於數據獲取（讀取）
特點：

自動執行查詢
具有緩存機制
會自動重新獲取數據
適合 GET 請求


useMutation - 用於數據變更（寫入）
特點：

手動觸發執行
不會緩存結果
不會自動重新執行
適合 POST、PUT、DELETE 請求
*/

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActivityStore } from '../stores/activityStore';
import type { UserActivity, ActivityStats } from '../types/activity';
import { apiClient } from '../utils/RequestUtils';
import { RequestResult } from '../utils/RequestResult';

/**
 * React Query 查詢鍵常量
 * 用於識別和管理不同的查詢緩存
 */
export const QUERY_KEYS = {
  USER_ACTIVITY: ['userActivity'] as const,
  ACTIVITY_STATS: ['activityStats'] as const,
} as const;


/**
 * API 函數：獲取用戶活動資料
 */
const fetchUserActivity = async (): Promise<UserActivity> => {
  const response = await apiClient.get('/api/user/activity');
  const result = RequestResult.fromResponse<UserActivity>(response);
  
  if (result.isError()) {
    throw new Error(result.message);
  }
  
  return result.unwrap();
};

/**
 * API 函數：獲取活動統計資料
 */
const fetchActivityStats = async (): Promise<ActivityStats> => {
  const response = await apiClient.get('/api/user/activity/stats');
  const result = RequestResult.fromResponse<ActivityStats>(response);
  
  if (result.isError()) {
    throw new Error(result.message);
  }
  
  return result.unwrap();
};

/**
 * API 函數：記錄頁面訪問
 */
const recordPageVisitAPI = async (page: string, duration?: number): Promise<void> => {
  try {
    const response = await apiClient.post('/api/user/activity/page-visit', { page, duration });
    const result = RequestResult.fromResponse(response);
    
    if (result.isError()) {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Failed to record page visit:', error);
    throw error;
  }
};

/**
 * API 函數：更新會話信息
 */
const updateSessionInfoAPI = async (sessionDuration?: number, deviceInfo?: string): Promise<void> => {
  try {
    const response = await apiClient.post('/api/user/activity/session', { sessionDuration, deviceInfo });
    const result = RequestResult.fromResponse(response);
    
    if (result.isError()) {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Failed to update session info:', error);
    throw error;
  }
};

/**
 * 獲取用戶活動數據的 Hook
 * 
 * 使用 React Query 管理用戶活動數據的獲取和緩存。
 * 自動處理載入狀態、錯誤處理和數據更新。
 * 
 * @returns {object} 包含數據、載入狀態和錯誤信息的對象
 */
export const useUserActivity = () => {
  const setActivity = useActivityStore((state) => state.setActivity);
  const setError = useActivityStore((state) => state.setError);

  return useQuery({
    queryKey: QUERY_KEYS.USER_ACTIVITY,
    queryFn: async (): Promise<UserActivity> => {
      try {
        const data = await fetchUserActivity();
        setActivity(data);
        setError(null);
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '獲取用戶活動失敗';
        setError(errorMessage);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5分鐘內不會重新獲取
    gcTime: 10 * 60 * 1000, // 10分鐘後清除緩存
    retry: 3, // 失敗時重試3次
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 指數退避
  });
};

/**
 * 獲取活動統計數據的 Hook
 * 
 * 使用 React Query 管理活動統計數據的獲取和緩存。
 * 提供自動刷新和背景更新功能。
 * 
 * @returns {object} 包含統計數據、載入狀態和錯誤信息的對象
 */
export const useActivityStats = () => {
  const setStats = useActivityStore((state) => state.setStats);
  const setError = useActivityStore((state) => state.setError);

  return useQuery({
    queryKey: QUERY_KEYS.ACTIVITY_STATS,
    queryFn: async (): Promise<ActivityStats> => {
      try {
        const data = await fetchActivityStats();
        setStats(data);
        setError(null);
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '獲取統計數據失敗';
        setError(errorMessage);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2分鐘內不會重新獲取
    gcTime: 10 * 60 * 1000, // 10分鐘後清除緩存
    retry: 2, // 失敗時重試2次
    refetchInterval: 5 * 60 * 1000, // 每5分鐘自動刷新
    refetchIntervalInBackground: true, // 背景也會刷新
  });
};

/**
 * 記錄頁面訪問的 Mutation Hook
 * 
 * 使用 React Query mutation 處理頁面訪問記錄，
 * 提供樂觀更新和錯誤回滾功能。
 * 
 * @returns {object} Mutation 對象，包含 mutate 方法和狀態
 */
export const useRecordPageVisit = () => {
  const queryClient = useQueryClient();
  const updateLocalPageVisit = useActivityStore((state) => state.updateLocalPageVisit);
  const setError = useActivityStore((state) => state.setError);

  return useMutation({
    mutationFn: async ({ page, duration }: { page: string; duration?: number }) => {
      return await recordPageVisitAPI(page, duration);
    },
    onMutate: async ({ page }) => {
      // 樂觀更新：立即更新本地狀態
      updateLocalPageVisit(page);
    },
    onSuccess: () => {
      // 成功後使相關查詢無效，觸發重新獲取
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_ACTIVITY });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ACTIVITY_STATS });
      setError(null);
    },
    onError: (error) => {
      // 錯誤處理
      const errorMessage = error instanceof Error ? error.message : '記錄頁面訪問失敗';
      setError(errorMessage);
      
      // 可以在這裡添加回滾邏輯，但由於我們使用樂觀更新，
      // 下次查詢刷新時會自動修正數據
      console.error('頁面訪問記錄失敗:', errorMessage);
    },
    retry: 2, // 失敗時重試2次
  });
};

/**
 * 更新會話信息的 Mutation Hook
 * 
 * 使用 React Query mutation 處理會話信息更新。
 * 
 * @returns {object} Mutation 對象，包含 mutate 方法和狀態
 */
export const useUpdateSessionInfo = () => {
  const queryClient = useQueryClient();
  const setError = useActivityStore((state) => state.setError);

  return useMutation({
    mutationFn: async ({ 
      sessionDuration, 
      deviceInfo 
    }: { 
      sessionDuration?: number; 
      deviceInfo?: string; 
    }) => {
      return await updateSessionInfoAPI(sessionDuration, deviceInfo);
    },
    onSuccess: () => {
      // 成功後使用戶活動查詢無效
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_ACTIVITY });
      setError(null);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : '更新會話信息失敗';
      setError(errorMessage);
      console.error('會話信息更新失敗:', errorMessage);
    },
    retry: 1, // 失敗時重試1次
  });
};

/**
 * 綜合活動追蹤 Hook
 * 
 * 組合多個查詢和狀態，提供統一的活動追蹤接口。
 * 包含所有必要的數據獲取、狀態管理和操作方法。
 * 
 * @returns {object} 綜合的活動追蹤狀態和方法
 */
export const useActivityTracking = () => {
  const queryClient = useQueryClient();
  
  // Zustand store 狀態和方法
  const {
    activity,
    stats,
    autoTrackingEnabled,
    error,
    setCurrentPage,
    toggleAutoTracking,
    updateLocalPageVisit,
    updateSessionDuration,
    clearError,
    resetState,
  } = useActivityStore();

  // React Query hooks
  const userActivityQuery = useUserActivity();
  const activityStatsQuery = useActivityStats();
  const recordPageVisitMutation = useRecordPageVisit();
  const updateSessionMutation = useUpdateSessionInfo();

  // 綜合載入狀態
  const loading = userActivityQuery.isLoading || activityStatsQuery.isLoading;
  const isError = userActivityQuery.isError || activityStatsQuery.isError;

  /**
   * 同步所有數據
   */
  const syncData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_ACTIVITY }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ACTIVITY_STATS }),
    ]);
  };

  /**
   * 記錄頁面訪問（帶自動追蹤檢查）
   */
  const trackPageVisit = (page: string, duration?: number) => {
    if (autoTrackingEnabled) {
      recordPageVisitMutation.mutate({ page, duration });
    }
    setCurrentPage(page);
    updateSessionDuration();
  };

  /**
   * 手動記錄頁面訪問（忽略自動追蹤設置）
   */
  const recordPageVisit = (page: string, duration?: number) => {
    recordPageVisitMutation.mutate({ page, duration });
  };

  /**
   * 更新會話信息
   */
  const updateSession = (sessionDuration?: number, deviceInfo?: string) => {
    updateSessionMutation.mutate({ sessionDuration, deviceInfo });
  };

  return {
    // 數據
    activity: activity || userActivityQuery.data,
    stats: stats || activityStatsQuery.data,
    autoTrackingEnabled,
    error,
    
    // 狀態
    loading,
    isError,
    
    // 方法
    setCurrentPage,
    toggleAutoTracking,
    trackPageVisit,
    recordPageVisit,
    updateSession,
    updateLocalPageVisit,
    updateSessionDuration,
    syncData,
    clearError,
    resetState,
    
    // 原始查詢對象（用於更高級的操作）
    queries: {
      userActivity: userActivityQuery,
      activityStats: activityStatsQuery,
    },
    mutations: {
      recordPageVisit: recordPageVisitMutation,
      updateSession: updateSessionMutation,
    },
  };
};