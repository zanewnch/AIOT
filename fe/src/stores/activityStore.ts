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
import type { UserActivity, ActivityStats, SessionInfo } from '../types/activity';

// 類型定義現在從 ../types/activity 導入

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

// 注意：React Query hooks have been removed
// 這個檔案只負責純粹的 Zustand 狀態管理