import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { activityService } from '../services/activityService';

/**
 * Activity 相關的類型定義
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

export interface ActivityState {
  activity: UserActivity | null;
  stats: ActivityStats | null;
  loading: boolean;
  error: string | null;
  sessionStartTime: number;
  currentPage: string;
  pageStartTime: number;
  autoTrackingEnabled: boolean;
}

/**
 * 異步 Actions
 */
export const fetchUserActivity = createAsyncThunk(
  'activity/fetchUserActivity',
  async (_, { rejectWithValue }) => {
    try {
      return await activityService.getUserActivity();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch activity');
    }
  }
);

export const fetchActivityStats = createAsyncThunk(
  'activity/fetchActivityStats',
  async (_, { rejectWithValue }) => {
    try {
      return await activityService.getActivityStats();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch stats');
    }
  }
);

export const recordPageVisit = createAsyncThunk(
  'activity/recordPageVisit',
  async ({ page, duration }: { page: string; duration?: number }, { rejectWithValue }) => {
    try {
      await activityService.recordPageVisit(page, duration);
      return { page, duration };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to record page visit');
    }
  }
);

export const updateSessionInfo = createAsyncThunk(
  'activity/updateSessionInfo',
  async ({ sessionDuration, deviceInfo }: { sessionDuration?: number; deviceInfo?: string }, { rejectWithValue }) => {
    try {
      await activityService.updateSessionInfo(sessionDuration, deviceInfo);
      return { sessionDuration, deviceInfo };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update session');
    }
  }
);

/**
 * Activity Slice
 */
const activitySlice = createSlice({
  name: 'activity',
  initialState: {
    activity: null,
    stats: null,
    loading: false,
    error: null,
    sessionStartTime: Date.now(),
    currentPage: '/',
    pageStartTime: Date.now(),
    autoTrackingEnabled: true,
  } as ActivityState,
  reducers: {
    // 設置當前頁面
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload;
      state.pageStartTime = Date.now();
    },
    
    // 啟用/禁用自動追蹤
    toggleAutoTracking: (state, action: PayloadAction<boolean>) => {
      state.autoTrackingEnabled = action.payload;
    },
    
    // 清除錯誤
    clearError: (state) => {
      state.error = null;
    },
    
    // 重置狀態
    resetState: (state) => {
      state.activity = null;
      state.stats = null;
      state.error = null;
      state.sessionStartTime = Date.now();
      state.pageStartTime = Date.now();
    },
    
    // 更新本地頁面訪問計數
    updateLocalPageVisit: (state, action: PayloadAction<string>) => {
      if (state.activity) {
        const page = action.payload;
        const currentCounts = state.activity.pageVisitCounts;
        currentCounts[page] = (currentCounts[page] || 0) + 1;
        
        // 更新最常訪問頁面
        const mostVisitedPage = Object.keys(currentCounts).reduce((a, b) => 
          currentCounts[a] > currentCounts[b] ? a : b
        );
        
        state.activity.pageVisitCounts = currentCounts;
        state.activity.mostVisitedPage = mostVisitedPage;
        state.activity.lastActiveAt = new Date();
      }
    }
  },
  extraReducers: (builder) => {
    // 獲取用戶活動
    builder
      .addCase(fetchUserActivity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserActivity.fulfilled, (state, action) => {
        state.loading = false;
        state.activity = action.payload;
      })
      .addCase(fetchUserActivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 獲取活動統計
    builder
      .addCase(fetchActivityStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivityStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchActivityStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 記錄頁面訪問
    builder
      .addCase(recordPageVisit.pending, (state) => {
        state.loading = true;
      })
      .addCase(recordPageVisit.fulfilled, (state, action) => {
        state.loading = false;
        // 更新本地狀態
        if (action.payload.page) {
          activitySlice.caseReducers.updateLocalPageVisit(state, {
            type: 'activity/updateLocalPageVisit',
            payload: action.payload.page
          });
        }
      })
      .addCase(recordPageVisit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 更新會話信息
    builder
      .addCase(updateSessionInfo.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateSessionInfo.fulfilled, (state, action) => {
        state.loading = false;
        if (state.activity) {
          if (action.payload.sessionDuration) {
            state.activity.sessionDuration = action.payload.sessionDuration;
          }
          if (action.payload.deviceInfo) {
            state.activity.deviceInfo = action.payload.deviceInfo;
          }
          state.activity.lastActiveAt = new Date();
        }
      })
      .addCase(updateSessionInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { 
  setCurrentPage, 
  toggleAutoTracking, 
  clearError, 
  resetState, 
  updateLocalPageVisit 
} = activitySlice.actions;

export default activitySlice.reducer;