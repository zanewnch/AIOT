/**
 * @fileoverview Zustand 活動追蹤狀態管理
 * 
 * 使用 Zustand 提供輕量級的狀態管理，替代複雜的 Redux 設置。
 * 包含活動追蹤的所有本地狀態管理功能。
 * 
 * @author AIOT Development Team
 * @version 2.0.0
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * 用戶活動數據的類型定義
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
 * 會話信息的類型定義
 */
export interface SessionInfo {
  currentPage: string;
  sessionDuration: number;
  currentPageDuration: number;
  sessionStartTime: number;
  pageStartTime: number;
}

/**
 * Zustand store 狀態接口
 */
interface ActivityStore {
  // 狀態
  activity: UserActivity | null;
  stats: ActivityStats | null;
  sessionInfo: SessionInfo;
  autoTrackingEnabled: boolean;
  error: string | null;
  
  // Actions
  setActivity: (activity: UserActivity | null) => void;
  setStats: (stats: ActivityStats | null) => void;
  setCurrentPage: (page: string) => void;
  toggleAutoTracking: () => void;
  updateLocalPageVisit: (page: string) => void;
  updateSessionDuration: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetState: () => void;
}

/**
 * 初始會話信息
 */
const initialSessionInfo: SessionInfo = {
  currentPage: '/',
  sessionDuration: 0,
  currentPageDuration: 0,
  sessionStartTime: Date.now(),
  pageStartTime: Date.now(),
};

/**
 * Zustand 活動追蹤 store
 * 
 * 提供輕量級的狀態管理，包含所有活動追蹤相關的狀態和操作方法。
 * 使用 devtools 中間件在開發環境中提供 Redux DevTools 支持。
 */
export const useActivityStore = create<ActivityStore>()(
  devtools(
    (set, get) => ({
      // 初始狀態
      activity: null,
      stats: null,
      sessionInfo: initialSessionInfo,
      autoTrackingEnabled: true,
      error: null,

      // 設置活動數據
      setActivity: (activity) => set({ activity }, false, 'setActivity'),

      // 設置統計數據
      setStats: (stats) => set({ stats }, false, 'setStats'),

      // 設置當前頁面並更新會話信息
      setCurrentPage: (page) => {
        const now = Date.now();
        const currentSessionInfo = get().sessionInfo;
        
        set({
          sessionInfo: {
            ...currentSessionInfo,
            currentPage: page,
            pageStartTime: now,
            sessionDuration: now - currentSessionInfo.sessionStartTime,
          }
        }, false, 'setCurrentPage');
      },

      // 切換自動追蹤狀態
      toggleAutoTracking: () => set(
        (state) => ({ autoTrackingEnabled: !state.autoTrackingEnabled }),
        false,
        'toggleAutoTracking'
      ),

      // 更新本地頁面訪問計數
      updateLocalPageVisit: (page) => set((state) => {
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

      // 更新會話持續時間
      updateSessionDuration: () => set((state) => {
        const now = Date.now();
        const currentSessionInfo = state.sessionInfo;
        
        return {
          sessionInfo: {
            ...currentSessionInfo,
            sessionDuration: now - currentSessionInfo.sessionStartTime,
            currentPageDuration: now - currentSessionInfo.pageStartTime,
          }
        };
      }, false, 'updateSessionDuration'),

      // 設置錯誤信息
      setError: (error) => set({ error }, false, 'setError'),

      // 清除錯誤信息
      clearError: () => set({ error: null }, false, 'clearError'),

      // 重置所有狀態
      resetState: () => set({
        activity: null,
        stats: null,
        sessionInfo: {
          currentPage: '/',
          sessionDuration: 0,
          currentPageDuration: 0,
          sessionStartTime: Date.now(),
          pageStartTime: Date.now(),
        },
        error: null,
      }, false, 'resetState'),
    }),
    {
      name: 'activity-store', // DevTools 中顯示的名稱
    }
  )
);