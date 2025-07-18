/**
 * @fileoverview 活動追蹤 Redux slice - 處理用戶活動追蹤相關的狀態管理
 * 
 * 這個文件包含了用戶活動追蹤系統的完整狀態管理邏輯，包括：
 * - 用戶活動數據的獲取和管理
 * - 活動統計信息的計算和存儲
 * - 頁面訪問追蹤和會話管理
 * - 自動追蹤功能的控制
 * - 本地狀態與服務器同步
 * 
 * @author AIOT Development Team
 * @since 2024
 */

// 引入 Redux Toolkit 的核心功能
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// 引入活動追蹤服務
import { activityService } from '../services/activityService';

/**
 * 用戶活動數據的類型定義
 * 
 * @interface UserActivity
 * @property {string} userId - 用戶 ID
 * @property {Date} lastLoginAt - 最後登入時間
 * @property {number} loginCount - 登入次數
 * @property {Date} lastActiveAt - 最後活動時間
 * @property {string} mostVisitedPage - 最常訪問的頁面
 * @property {Record<string, number>} pageVisitCounts - 頁面訪問次數記錄
 * @property {number} sessionDuration - 會話持續時間（毫秒）
 * @property {string} deviceInfo - 設備信息
 * @property {string} ipAddress - IP 地址
 */
export interface UserActivity {
  userId: string;                           // 用戶的唯一標識符
  lastLoginAt: Date;                        // 最後登入時間
  loginCount: number;                       // 總登入次數
  lastActiveAt: Date;                       // 最後活動時間
  mostVisitedPage: string;                  // 最常訪問的頁面路徑
  pageVisitCounts: Record<string, number>;  // 頁面訪問次數的鍵值對
  sessionDuration: number;                  // 當前會話持續時間
  deviceInfo: string;                       // 設備信息字符串
  ipAddress: string;                        // 用戶的 IP 地址
}

/**
 * 活動統計數據的類型定義
 * 
 * @interface ActivityStats
 * @property {number} loginCount - 登入次數
 * @property {number} totalPageVisits - 總頁面訪問次數
 * @property {number} uniquePagesVisited - 唯一頁面訪問數
 * @property {number} averageSessionDuration - 平均會話持續時間
 * @property {string} mostVisitedPage - 最常訪問的頁面
 * @property {Array<{page: string, count: number}>} topPages - 熱門頁面排行
 * @property {Date} lastLoginAt - 最後登入時間
 * @property {Date} lastActiveAt - 最後活動時間
 */
export interface ActivityStats {
  loginCount: number;                       // 總登入次數
  totalPageVisits: number;                  // 總頁面訪問次數
  uniquePagesVisited: number;               // 唯一頁面訪問數
  averageSessionDuration: number;           // 平均會話持續時間
  mostVisitedPage: string;                  // 最常訪問的頁面
  topPages: Array<{page: string, count: number}>; // 熱門頁面排行榜
  lastLoginAt: Date;                        // 最後登入時間
  lastActiveAt: Date;                       // 最後活動時間
}

/**
 * 活動追蹤狀態的類型定義
 * 
 * @interface ActivityState
 * @property {UserActivity | null} activity - 用戶活動數據，未加載時為 null
 * @property {ActivityStats | null} stats - 活動統計數據，未加載時為 null
 * @property {boolean} loading - 是否正在加載中
 * @property {string | null} error - 錯誤信息，無錯誤時為 null
 * @property {number} sessionStartTime - 會話開始時間戳
 * @property {string} currentPage - 當前頁面路徑
 * @property {number} pageStartTime - 當前頁面開始時間戳
 * @property {boolean} autoTrackingEnabled - 是否啟用自動追蹤
 */
export interface ActivityState {
  activity: UserActivity | null;    // 用戶活動數據
  stats: ActivityStats | null;      // 活動統計數據
  loading: boolean;                  // 加載狀態
  error: string | null;              // 錯誤信息
  sessionStartTime: number;          // 會話開始時間戳
  currentPage: string;               // 當前頁面路徑
  pageStartTime: number;             // 當前頁面開始時間戳
  autoTrackingEnabled: boolean;      // 自動追蹤功能開關
}

/**
 * 異步 Actions (Thunks)
 * 
 * 這些 thunk 函數負責與後端 API 交互，處理活動追蹤的各種異步操作。
 */

/**
 * 異步 thunk - 獲取用戶活動數據
 * 
 * 從後端 API 獲取當前用戶的活動數據，包括登入記錄、頁面訪問記錄等。
 * 
 * @function fetchUserActivity
 * @param {void} _ - 無參數
 * @param {AsyncThunkAPI} thunkAPI - thunk API 對象
 * @returns {Promise<UserActivity>} 返回用戶活動數據
 */
export const fetchUserActivity = createAsyncThunk(
  'activity/fetchUserActivity',  // action 類型名稱
  async (_, { rejectWithValue }) => {
    try {
      // 調用活動追蹤服務獲取用戶活動數據
      return await activityService.getUserActivity();
    } catch (error) {
      // 錯誤處理，返回格式化的錯誤信息
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch activity');
    }
  }
);

/**
 * 異步 thunk - 獲取活動統計數據
 * 
 * 從後端 API 獲取用戶活動的統計信息，如總訪問次數、熱門頁面等。
 * 
 * @function fetchActivityStats
 * @param {void} _ - 無參數
 * @param {AsyncThunkAPI} thunkAPI - thunk API 對象
 * @returns {Promise<ActivityStats>} 返回活動統計數據
 */
export const fetchActivityStats = createAsyncThunk(
  'activity/fetchActivityStats',  // action 類型名稱
  async (_, { rejectWithValue }) => {
    try {
      // 調用活動追蹤服務獲取統計數據
      return await activityService.getActivityStats();
    } catch (error) {
      // 錯誤處理，返回格式化的錯誤信息
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch stats');
    }
  }
);

/**
 * 異步 thunk - 記錄頁面訪問
 * 
 * 向後端 API 發送頁面訪問記錄，包括頁面路徑和停留時間。
 * 
 * @function recordPageVisit
 * @param {object} params - 頁面訪問參數
 * @param {string} params.page - 頁面路徑
 * @param {number} [params.duration] - 可選，頁面停留時間
 * @param {AsyncThunkAPI} thunkAPI - thunk API 對象
 * @returns {Promise<{page: string, duration?: number}>} 返回記錄的頁面訪問信息
 */
export const recordPageVisit = createAsyncThunk(
  'activity/recordPageVisit',  // action 類型名稱
  async ({ page, duration }: { page: string; duration?: number }, { rejectWithValue }) => {
    try {
      // 調用活動追蹤服務記錄頁面訪問
      await activityService.recordPageVisit(page, duration);
      // 返回記錄的信息供 reducer 使用
      return { page, duration };
    } catch (error) {
      // 錯誤處理，返回格式化的錯誤信息
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to record page visit');
    }
  }
);

/**
 * 異步 thunk - 更新會話信息
 * 
 * 向後端 API 更新用戶會話信息，如會話持續時間和設備信息。
 * 
 * @function updateSessionInfo
 * @param {object} params - 會話更新參數
 * @param {number} [params.sessionDuration] - 可選，會話持續時間
 * @param {string} [params.deviceInfo] - 可選，設備信息
 * @param {AsyncThunkAPI} thunkAPI - thunk API 對象
 * @returns {Promise<{sessionDuration?: number, deviceInfo?: string}>} 返回更新的會話信息
 */
export const updateSessionInfo = createAsyncThunk(
  'activity/updateSessionInfo',  // action 類型名稱
  async ({ sessionDuration, deviceInfo }: { sessionDuration?: number; deviceInfo?: string }, { rejectWithValue }) => {
    try {
      // 調用活動追蹤服務更新會話信息
      await activityService.updateSessionInfo(sessionDuration, deviceInfo);
      // 返回更新的信息供 reducer 使用
      return { sessionDuration, deviceInfo };
    } catch (error) {
      // 錯誤處理，返回格式化的錯誤信息
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update session');
    }
  }
);

/**
 * 活動追蹤的 Redux slice
 * 
 * 這個 slice 包含了活動追蹤系統的所有狀態管理邏輯，
 * 包括同步和異步操作的處理。
 * 
 * @constant {Slice} activitySlice - 活動追蹤的 Redux slice
 */
const activitySlice = createSlice({
  name: 'activity',    // slice 的名稱，會作為 action type 的前綴
  /**
   * 初始狀態設定
   * 
   * 設定活動追蹤 slice 的初始狀態值，包括所有必要的屬性。
   */
  initialState: {
    activity: null,                     // 初始無用戶活動數據
    stats: null,                        // 初始無統計數據
    loading: false,                     // 初始非加載狀態
    error: null,                        // 初始無錯誤
    sessionStartTime: Date.now(),       // 設定會話開始時間為當前時間
    currentPage: '/',                   // 初始頁面設為首頁
    pageStartTime: Date.now(),          // 設定頁面開始時間為當前時間
    autoTrackingEnabled: true,          // 默認啟用自動追蹤
  } as ActivityState,                   // 使用 ActivityState 類型
  reducers: {
    /**
     * 同步 action - 設置當前頁面
     * 
     * 更新當前頁面路徑並重置頁面開始時間，用於追蹤頁面導航。
     * 
     * @function setCurrentPage
     * @param {Draft<ActivityState>} state - 當前狀態（由 Immer 包裝）
     * @param {PayloadAction<string>} action - 包含頁面路徑的 action
     */
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload;  // 設置新的當前頁面
      state.pageStartTime = Date.now();    // 重置頁面開始時間
    },
    
    /**
     * 同步 action - 啟用/禁用自動追蹤
     * 
     * 控制是否啟用自動追蹤功能，用於用戶隱私控制。
     * 
     * @function toggleAutoTracking
     * @param {Draft<ActivityState>} state - 當前狀態（由 Immer 包裝）
     * @param {PayloadAction<boolean>} action - 包含啟用狀態的 action
     */
    toggleAutoTracking: (state, action: PayloadAction<boolean>) => {
      state.autoTrackingEnabled = action.payload;  // 設置自動追蹤開關狀態
    },
    
    /**
     * 同步 action - 清除錯誤信息
     * 
     * 清除當前的錯誤狀態，通常在錯誤處理後調用。
     * 
     * @function clearError
     * @param {Draft<ActivityState>} state - 當前狀態（由 Immer 包裝）
     */
    clearError: (state) => {
      state.error = null;  // 清除錯誤信息
    },
    
    /**
     * 同步 action - 重置狀態
     * 
     * 重置活動追蹤的狀態，通常在用戶登出或重新初始化時使用。
     * 
     * @function resetState
     * @param {Draft<ActivityState>} state - 當前狀態（由 Immer 包裝）
     */
    resetState: (state) => {
      state.activity = null;                 // 清除活動數據
      state.stats = null;                    // 清除統計數據
      state.error = null;                    // 清除錯誤信息
      state.sessionStartTime = Date.now();   // 重置會話開始時間
      state.pageStartTime = Date.now();      // 重置頁面開始時間
    },
    
    /**
     * 同步 action - 更新本地頁面訪問計數
     * 
     * 在本地狀態中更新頁面訪問計數，用於即時反饋，
     * 無需等待服務器響應。
     * 
     * @function updateLocalPageVisit
     * @param {Draft<ActivityState>} state - 當前狀態（由 Immer 包裝）
     * @param {PayloadAction<string>} action - 包含頁面路徑的 action
     */
    updateLocalPageVisit: (state, action: PayloadAction<string>) => {
      if (state.activity) {
        const page = action.payload;  // 獲取頁面路徑
        const currentCounts = state.activity.pageVisitCounts;  // 獲取當前計數
        
        // 增加該頁面的訪問計數
        currentCounts[page] = (currentCounts[page] || 0) + 1;
        
        // 重新計算最常訪問頁面
        const mostVisitedPage = Object.keys(currentCounts).reduce((a, b) => 
          currentCounts[a] > currentCounts[b] ? a : b
        );
        
        // 更新狀態
        state.activity.pageVisitCounts = currentCounts;     // 更新頁面計數
        state.activity.mostVisitedPage = mostVisitedPage;   // 更新最常訪問頁面
        state.activity.lastActiveAt = new Date();           // 更新最後活動時間
      }
    }
  },
  /**
   * 處理異步 thunk 的額外 reducers
   * 
   * extraReducers 用於處理 createAsyncThunk 生成的 actions，
   * 包括 pending、fulfilled 和 rejected 三個狀態。
   * 
   * @param {ActionReducerMapBuilder<ActivityState>} builder - reducer 構建器
   */
  extraReducers: (builder) => {
    // 處理獲取用戶活動數據的各個狀態
    builder
      /**
       * 處理 fetchUserActivity 的 pending 狀態
       * 當用戶活動數據獲取開始時觸發
       */
      .addCase(fetchUserActivity.pending, (state) => {
        state.loading = true;    // 設置加載狀態為 true
        state.error = null;      // 清除之前的錯誤信息
      })
      /**
       * 處理 fetchUserActivity 的 fulfilled 狀態
       * 當用戶活動數據獲取成功完成時觸發
       */
      .addCase(fetchUserActivity.fulfilled, (state, action) => {
        state.loading = false;   // 設置加載狀態為 false
        state.activity = action.payload;  // 設置獲取的活動數據
      })
      /**
       * 處理 fetchUserActivity 的 rejected 狀態
       * 當用戶活動數據獲取失敗時觸發
       */
      .addCase(fetchUserActivity.rejected, (state, action) => {
        state.loading = false;   // 設置加載狀態為 false
        state.error = action.payload as string;  // 設置錯誤信息
      });

    // 處理獲取活動統計數據的各個狀態
    builder
      /**
       * 處理 fetchActivityStats 的 pending 狀態
       * 當活動統計數據獲取開始時觸發
       */
      .addCase(fetchActivityStats.pending, (state) => {
        state.loading = true;    // 設置加載狀態為 true
        state.error = null;      // 清除之前的錯誤信息
      })
      /**
       * 處理 fetchActivityStats 的 fulfilled 狀態
       * 當活動統計數據獲取成功完成時觸發
       */
      .addCase(fetchActivityStats.fulfilled, (state, action) => {
        state.loading = false;   // 設置加載狀態為 false
        state.stats = action.payload;  // 設置獲取的統計數據
      })
      /**
       * 處理 fetchActivityStats 的 rejected 狀態
       * 當活動統計數據獲取失敗時觸發
       */
      .addCase(fetchActivityStats.rejected, (state, action) => {
        state.loading = false;   // 設置加載狀態為 false
        state.error = action.payload as string;  // 設置錯誤信息
      });

    // 處理記錄頁面訪問的各個狀態
    builder
      /**
       * 處理 recordPageVisit 的 pending 狀態
       * 當頁面訪問記錄開始時觸發
       */
      .addCase(recordPageVisit.pending, (state) => {
        state.loading = true;    // 設置加載狀態為 true
      })
      /**
       * 處理 recordPageVisit 的 fulfilled 狀態
       * 當頁面訪問記錄成功完成時觸發
       */
      .addCase(recordPageVisit.fulfilled, (state, action) => {
        state.loading = false;   // 設置加載狀態為 false
        // 更新本地狀態以反映頁面訪問
        if (action.payload.page) {
          // 調用本地的 updateLocalPageVisit reducer
          activitySlice.caseReducers.updateLocalPageVisit(state, {
            type: 'activity/updateLocalPageVisit',
            payload: action.payload.page
          });
        }
      })
      /**
       * 處理 recordPageVisit 的 rejected 狀態
       * 當頁面訪問記錄失敗時觸發
       */
      .addCase(recordPageVisit.rejected, (state, action) => {
        state.loading = false;   // 設置加載狀態為 false
        state.error = action.payload as string;  // 設置錯誤信息
      });

    // 處理更新會話信息的各個狀態
    builder
      /**
       * 處理 updateSessionInfo 的 pending 狀態
       * 當會話信息更新開始時觸發
       */
      .addCase(updateSessionInfo.pending, (state) => {
        state.loading = true;    // 設置加載狀態為 true
      })
      /**
       * 處理 updateSessionInfo 的 fulfilled 狀態
       * 當會話信息更新成功完成時觸發
       */
      .addCase(updateSessionInfo.fulfilled, (state, action) => {
        state.loading = false;   // 設置加載狀態為 false
        if (state.activity) {
          // 更新會話持續時間（如果提供）
          if (action.payload.sessionDuration) {
            state.activity.sessionDuration = action.payload.sessionDuration;
          }
          // 更新設備信息（如果提供）
          if (action.payload.deviceInfo) {
            state.activity.deviceInfo = action.payload.deviceInfo;
          }
          // 更新最後活動時間
          state.activity.lastActiveAt = new Date();
        }
      })
      /**
       * 處理 updateSessionInfo 的 rejected 狀態
       * 當會話信息更新失敗時觸發
       */
      .addCase(updateSessionInfo.rejected, (state, action) => {
        state.loading = false;   // 設置加載狀態為 false
        state.error = action.payload as string;  // 設置錯誤信息
      });
  }
});

/**
 * 導出同步 actions
 * 
 * 這些 action creators 由 createSlice 自動生成，
 * 可以直接在組件中使用來觸發狀態更新。
 */
export const { 
  setCurrentPage,        // 設置當前頁面
  toggleAutoTracking,    // 切換自動追蹤
  clearError,            // 清除錯誤
  resetState,            // 重置狀態
  updateLocalPageVisit   // 更新本地頁面訪問計數
} = activitySlice.actions;

/**
 * 導出 reducer
 * 
 * 這個 reducer 會被包含在 store 的配置中，
 * 用於處理所有與活動追蹤相關的狀態更新。
 */
export default activitySlice.reducer;