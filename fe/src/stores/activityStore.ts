/**
 * @fileoverview 活動追蹤狀態管理 - 使用 Zustand + React Query
 * 
 * 原本使用 Redux Toolkit，現在改為現代化的 Zustand + React Query 方案：
 * - Zustand 處理本地狀態管理（替代 Redux）
 * - React Query 處理服務器狀態和數據同步
 * - 保持與原始 Redux slice 相同的接口和功能
 * - 提供更簡潔的 API 和更好的開發體驗
 * 
 * @author AIOT Development Team
 * @version 2.0.0 (從 Redux 遷移到 Zustand + React Query)
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityService } from '../services/activityService';

/**
 * 用戶活動數據的類型定義
 * (保持與原始 Redux slice 相同)
 */
export interface UserActivity {
  userId: string;
  lastLoginAt: Date;
  loginCount: number;
  lastActiveAt: Date;
  mostVisitedPage: string;
  pageVisitCounts: Record<string, number>;
  sessionDuration: number;
  deviceInfo: string;
  ipAddress: string;
}

/**
 * 活動統計數據的類型定義
 * (保持與原始 Redux slice 相同)
 */
export interface ActivityStats {
  loginCount: number;
  totalPageVisits: number;
  uniquePagesVisited: number;
  averageSessionDuration: number;
  mostVisitedPage: string;
  topPages: Array<{page: string, count: number}>;
  lastLoginAt: Date;
  lastActiveAt: Date;
}

/**
 * 活動追蹤狀態接口
 * (與原始 Redux ActivityState 保持兼容)
 */
export interface ActivityState {
  // 數據狀態
  activity: UserActivity | null;
  stats: ActivityStats | null;
  
  // UI 狀態
  loading: boolean;
  error: string | null;
  
  // 會話狀態
  sessionStartTime: number;
  currentPage: string;
  pageStartTime: number;
  autoTrackingEnabled: boolean;
}

/**
 * Zustand Store Actions 接口
 */
interface ActivityActions {
  // 數據設置
  setActivity: (activity: UserActivity | null) => void;
  setStats: (stats: ActivityStats | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 會話管理 (保持與 Redux actions 相同的命名)
  setCurrentPage: (page: string) => void;
  toggleAutoTracking: (enabled?: boolean) => void;
  clearError: () => void;
  resetState: () => void;
  updateLocalPageVisit: (page: string) => void;
  
  // 輔助方法
  updateSessionDuration: () => void;
}

/**
 * 完整的 Store 類型
 */
type ActivityStore = ActivityState & ActivityActions;

/**
 * Zustand 活動追蹤 Store
 * 
 * 使用 Zustand 替代 Redux，提供相同的狀態管理功能但更簡潔。
 * 包含 devtools 和 subscribeWithSelector 中間件支持。
 */
export const useActivityStore = create<ActivityStore>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
        // 初始狀態 (與 Redux initialState 保持一致)
        activity: null,
        stats: null,
        loading: false,
        error: null,
        sessionStartTime: Date.now(),
        currentPage: '/',
        pageStartTime: Date.now(),
        autoTrackingEnabled: true,

        // Actions (保持與 Redux actions 相同的接口)
        setActivity: (activity) => 
          set({ activity }, false, 'setActivity'),

        setStats: (stats) => 
          set({ stats }, false, 'setStats'),

        setLoading: (loading) => 
          set({ loading }, false, 'setLoading'),

        setError: (error) => 
          set({ error }, false, 'setError'),

        setCurrentPage: (page) => {
          const now = Date.now();
          set({ 
            currentPage: page, 
            pageStartTime: now 
          }, false, 'setCurrentPage');
        },

        toggleAutoTracking: (enabled) => 
          set((state) => ({ 
            autoTrackingEnabled: enabled !== undefined ? enabled : !state.autoTrackingEnabled 
          }), false, 'toggleAutoTracking'),

        clearError: () => 
          set({ error: null }, false, 'clearError'),

        resetState: () => 
          set({
            activity: null,
            stats: null,
            error: null,
            sessionStartTime: Date.now(),
            currentPage: '/',
            pageStartTime: Date.now(),
          }, false, 'resetState'),

        updateLocalPageVisit: (page) => 
          set((state) => {
            if (!state.activity) return state;

            const updatedActivity = { ...state.activity };
            const currentCounts = { ...updatedActivity.pageVisitCounts };
            
            // 增加頁面訪問計數
            currentCounts[page] = (currentCounts[page] || 0) + 1;
            
            // 重新計算最常訪問頁面
            const mostVisitedPage = Object.keys(currentCounts).reduce((a, b) => 
              currentCounts[a] > currentCounts[b] ? a : b
            );
            
            updatedActivity.pageVisitCounts = currentCounts;
            updatedActivity.mostVisitedPage = mostVisitedPage;
            updatedActivity.lastActiveAt = new Date();

            return { activity: updatedActivity };
          }, false, 'updateLocalPageVisit'),

        updateSessionDuration: () => {
          // 這個方法主要是為了觸發重新計算，實際計算在 useActivitySlice 中進行
          // 保持與 Redux 版本的兼容性
          const state = get();
          set({
            sessionStartTime: state.sessionStartTime,
            pageStartTime: state.pageStartTime,
          }, false, 'updateSessionDuration');
        },
      })
    ),
    {
      name: 'activity-store', // DevTools 中顯示的名稱
    }
  )
);

/**
 * React Query 查詢鍵
 */
export const ACTIVITY_QUERY_KEYS = {
  USER_ACTIVITY: ['userActivity'] as const,
  ACTIVITY_STATS: ['activityStats'] as const,
} as const;

/**
 * 獲取用戶活動數據的 Hook (替代 fetchUserActivity thunk)
 */
export const useUserActivityQuery = () => {
  const { setActivity, setLoading, setError } = useActivityStore();

  return useQuery({
    queryKey: ACTIVITY_QUERY_KEYS.USER_ACTIVITY,
    queryFn: async (): Promise<UserActivity> => {
      setLoading(true);
      try {
        const data = await activityService.getUserActivity();
        setActivity(data);
        setError(null);
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch activity';
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 5 * 60 * 1000, // 5分鐘
    gcTime: 10 * 60 * 1000, // 10分鐘
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * 獲取活動統計數據的 Hook (替代 fetchActivityStats thunk)
 */
export const useActivityStatsQuery = () => {
  const { setStats, setLoading, setError } = useActivityStore();

  return useQuery({
    queryKey: ACTIVITY_QUERY_KEYS.ACTIVITY_STATS,
    queryFn: async (): Promise<ActivityStats> => {
      setLoading(true);
      try {
        const data = await activityService.getActivityStats();
        setStats(data);
        setError(null);
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stats';
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 2 * 60 * 1000, // 2分鐘
    gcTime: 10 * 60 * 1000, // 10分鐘
    retry: 2,
    refetchInterval: 5 * 60 * 1000, // 每5分鐘自動刷新
  });
};

/**
 * 記錄頁面訪問的 Mutation Hook (替代 recordPageVisit thunk)
 */
export const useRecordPageVisitMutation = () => {
  const queryClient = useQueryClient();
  const { updateLocalPageVisit, setError } = useActivityStore();

  return useMutation({
    mutationFn: async ({ page, duration }: { page: string; duration?: number }) => {
      return await activityService.recordPageVisit(page, duration);
    },
    onMutate: async ({ page }) => {
      // 樂觀更新：立即更新本地狀態
      updateLocalPageVisit(page);
    },
    onSuccess: () => {
      // 成功後使相關查詢無效，觸發重新獲取
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.USER_ACTIVITY });
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.ACTIVITY_STATS });
      setError(null);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to record page visit';
      setError(errorMessage);
    },
    retry: 2,
  });
};

/**
 * 更新會話信息的 Mutation Hook (替代 updateSessionInfo thunk)
 */
export const useUpdateSessionMutation = () => {
  const queryClient = useQueryClient();
  const { setError } = useActivityStore();

  return useMutation({
    mutationFn: async ({ 
      sessionDuration, 
      deviceInfo 
    }: { 
      sessionDuration?: number; 
      deviceInfo?: string; 
    }) => {
      return await activityService.updateSessionInfo(sessionDuration, deviceInfo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.USER_ACTIVITY });
      setError(null);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update session';
      setError(errorMessage);
    },
    retry: 1,
  });
};

/**
 * 綜合活動追蹤 Hook
 * 
 * 提供與原始 Redux useSelector + useDispatch 相同的接口，
 * 但使用 Zustand + React Query 實現。
 */
export const useActivitySlice = () => {
  const queryClient = useQueryClient();
  
  // Zustand store 狀態和方法
  const store = useActivityStore();
  
  // React Query hooks
  const userActivityQuery = useUserActivityQuery();
  const activityStatsQuery = useActivityStatsQuery();
  const recordPageVisitMutation = useRecordPageVisitMutation();
  const updateSessionMutation = useUpdateSessionMutation();

  // 綜合載入狀態
  const loading = store.loading || userActivityQuery.isLoading || activityStatsQuery.isLoading;
  const isError = userActivityQuery.isError || activityStatsQuery.isError;

  /**
   * 同步所有數據 (替代原始的 syncData action)
   */
  const syncData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.USER_ACTIVITY }),
      queryClient.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEYS.ACTIVITY_STATS }),
    ]);
  };

  /**
   * 記錄頁面訪問 (保持與 Redux thunk 相同的接口)
   */
  const recordPageVisit = (page: string, duration?: number) => {
    recordPageVisitMutation.mutate({ page, duration });
  };

  /**
   * 更新會話信息 (保持與 Redux thunk 相同的接口)
   */
  const updateSessionInfo = (sessionDuration?: number, deviceInfo?: string) => {
    updateSessionMutation.mutate({ sessionDuration, deviceInfo });
  };

  // 計算會話信息 (模擬原始 Redux 中的 sessionInfo)
  const sessionInfo = {
    currentPage: store.currentPage,
    sessionDuration: Date.now() - store.sessionStartTime,
    currentPageDuration: Date.now() - store.pageStartTime,
    sessionStartTime: store.sessionStartTime,
    pageStartTime: store.pageStartTime,
  };

  return {
    // 數據狀態 (與 Redux selector 保持一致)
    activity: store.activity || userActivityQuery.data,
    stats: store.stats || activityStatsQuery.data,
    sessionInfo,
    
    // UI 狀態
    loading,
    error: store.error,
    isError,
    autoTrackingEnabled: store.autoTrackingEnabled,
    
    // Actions (保持與 Redux dispatch 相同的接口)
    setCurrentPage: store.setCurrentPage,
    toggleAutoTracking: store.toggleAutoTracking,
    clearError: store.clearError,
    resetState: store.resetState,
    updateLocalPageVisit: store.updateLocalPageVisit,
    updateSessionDuration: store.updateSessionDuration,
    
    // 異步操作 (替代 Redux thunks)
    recordPageVisit,
    updateSessionInfo,
    syncData,
    
    // 原始查詢對象 (用於更高級的操作)
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

/**
 * 兼容性導出 - 保持與原始 Redux slice 相同的命名
 * 這樣現有的組件可以無縫遷移
 */

// 保持與 Redux 相同的 action 導出格式
export const actions = {
  setCurrentPage: (page: string) => useActivityStore.getState().setCurrentPage(page),
  toggleAutoTracking: (enabled?: boolean) => useActivityStore.getState().toggleAutoTracking(enabled),
  clearError: () => useActivityStore.getState().clearError(),
  resetState: () => useActivityStore.getState().resetState(),
  updateLocalPageVisit: (page: string) => useActivityStore.getState().updateLocalPageVisit(page),
};

// 保持與 Redux 相同的異步 action 導出格式
export const asyncActions = {
  fetchUserActivity: () => {
    // 這個會通過 React Query 自動處理
    return Promise.resolve();
  },
  fetchActivityStats: () => {
    // 這個會通過 React Query 自動處理
    return Promise.resolve();
  },
  recordPageVisit: (page: string, duration?: number) => {
    const { recordPageVisit } = useActivitySlice();
    return recordPageVisit(page, duration);
  },
  updateSessionInfo: (sessionDuration?: number, deviceInfo?: string) => {
    const { updateSessionInfo } = useActivitySlice();
    return updateSessionInfo(sessionDuration, deviceInfo);
  },
};

// 默認導出 (保持與 Redux slice 兼容)
export default {
  actions,
  asyncActions,
  useActivitySlice,
  useActivityStore,
};