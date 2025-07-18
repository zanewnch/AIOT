/**
 * @fileoverview 認證管理 Redux slice - 處理用戶認證相關的狀態管理
 * 
 * 這個文件包含了用戶認證系統的完整狀態管理邏輯，包括：
 * - 用戶登入和登出功能
 * - 認證狀態的初始化和維護
 * - 用戶信息的存儲和管理
 * - 認證錯誤的處理
 * 
 * @author AIOT Development Team
 * @since 2024
 */

// 引入 Redux Toolkit 的核心功能
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// 引入認證服務和相關類型定義
import { authService, User, LoginRequest, AuthError } from '../services/AuthService';

/**
 * 認證狀態的類型定義
 * 
 * @interface AuthState
 * @property {User | null} user - 當前登入的用戶信息，未登入時為 null
 * @property {boolean} isAuthenticated - 認證狀態標誌
 * @property {boolean} isLoading - 加載狀態標誌，表示正在進行認證相關的異步操作
 * @property {string | null} error - 錯誤信息，無錯誤時為 null
 */
interface AuthState {
  user: User | null;          // 當前登入的用戶信息
  isAuthenticated: boolean;   // 是否已認證
  isLoading: boolean;         // 是否正在加載中
  error: string | null;       // 錯誤信息
}

/**
 * 認證狀態的初始值
 * 
 * @constant {AuthState} initialState - 認證狀態的初始設定
 */
const initialState: AuthState = {
  user: null,                // 初始無用戶登入
  isAuthenticated: false,    // 初始未認證
  isLoading: false,          // 初始非加載狀態
  error: null,               // 初始無錯誤
};

/**
 * 異步 thunk - 初始化認證狀態
 * 
 * 這個函數會在應用啟動時執行，檢查是否存在有效的登入狀態，
 * 並相應地設置認證狀態。通常用於頁面刷新後恢復用戶的登入狀態。
 * 
 * @function initializeAuth
 * @param {void} _ - 無參數
 * @param {AsyncThunkAPI} thunkAPI - thunk API 對象，包含 rejectWithValue 等方法
 * @returns {Promise<{isAuthenticated: boolean, user: User | null}>} 返回認證狀態和用戶信息
 */
export const initializeAuth = createAsyncThunk(
  'auth/initialize',  // action 類型名稱
  async (_, { rejectWithValue }) => {
    try {
      // 檢查認證服務中是否存在有效的認證狀態
      const isAuth = authService.isAuthenticated();
      // 獲取當前用戶信息
      const currentUser = authService.getCurrentUser();

      // 如果已認證且有用戶信息，返回認證成功的狀態
      if (isAuth && currentUser) {
        return {
          isAuthenticated: true,
          user: currentUser,
        };
      } else {
        // 否則返回未認證狀態
        return {
          isAuthenticated: false,
          user: null,
        };
      }
    } catch (error) {
      // 記錄初始化錯誤
      console.error('Auth initialization error:', error);
      // 使用 rejectWithValue 返回錯誤信息
      return rejectWithValue('Authentication initialization failed');
    }
  }
);

/**
 * 異步 thunk - 用戶登入
 * 
 * 這個函數處理用戶登入流程，包括發送登入請求、
 * 驗證憑據、獲取用戶信息並設置認證狀態。
 * 
 * @function login
 * @param {LoginRequest} credentials - 登入憑據（通常包含用戶名和密碼）
 * @param {AsyncThunkAPI} thunkAPI - thunk API 對象
 * @returns {Promise<{user: User, isAuthenticated: boolean}>} 返回用戶信息和認證狀態
 */
export const login = createAsyncThunk(
  'auth/login',  // action 類型名稱
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      // 調用認證服務進行登入
      const response = await authService.login(credentials);
      // 獲取登入後的用戶信息
      const currentUser = authService.getCurrentUser();

      // 如果成功獲取用戶信息，返回成功狀態
      if (currentUser) {
        return {
          user: currentUser,
          isAuthenticated: true,
        };
      } else {
        // 如果無法獲取用戶信息，拋出錯誤
        throw new Error('Failed to get user information');
      }
    } catch (error) {
      // 將錯誤轉換為 AuthError 類型
      const authError = error as AuthError;
      // 返回錯誤信息
      return rejectWithValue(authError.message || 'Login failed');
    }
  }
);

/**
 * 異步 thunk - 用戶登出
 * 
 * 這個函數處理用戶登出流程，包括清除認證狀態、
 * 清除存儲的用戶信息等。
 * 
 * @function logout
 * @param {void} _ - 無參數
 * @param {AsyncThunkAPI} thunkAPI - thunk API 對象
 * @returns {Promise<null>} 返回 null 表示登出成功
 */
export const logout = createAsyncThunk(
  'auth/logout',  // action 類型名稱
  async (_, { rejectWithValue }) => {
    try {
      // 調用認證服務進行登出
      await authService.logout();
      // 返回 null 表示登出成功
      return null;
    } catch (error) {
      // 記錄登出錯誤
      console.error('Logout error:', error);
      // 即使登出失敗，也返回錯誤信息
      return rejectWithValue('Logout failed');
    }
  }
);

/**
 * 認證管理的 Redux slice
 * 
 * 這個 slice 包含了認證系統的所有狀態管理邏輯，
 * 包括同步和異步操作的處理。
 * 
 * @constant {Slice} authSlice - 認證管理的 Redux slice
 */
const authSlice = createSlice({
  name: 'auth',       // slice 的名稱，會作為 action type 的前綴
  initialState,       // 使用上面定義的初始狀態
  reducers: {
    /**
     * 同步 action - 清除錯誤信息
     * 
     * @function clearError
     * @param {Draft<AuthState>} state - 當前狀態（由 Immer 包裝）
     */
    clearError: (state) => {
      // 將錯誤狀態重置為 null
      state.error = null;
    },
    
    /**
     * 同步 action - 清除所有認證狀態
     * 
     * 這個 action 主要用於強制登出或重置認證狀態，
     * 會清除所有用戶相關的信息。
     * 
     * @function clearAuth
     * @param {Draft<AuthState>} state - 當前狀態（由 Immer 包裝）
     */
    clearAuth: (state) => {
      state.user = null;              // 清除用戶信息
      state.isAuthenticated = false;  // 設置為未認證
      state.error = null;             // 清除錯誤信息
      state.isLoading = false;        // 設置為非加載狀態
    },
  },
  
  /**
   * 處理異步 thunk 的額外 reducers
   * 
   * extraReducers 用於處理 createAsyncThunk 生成的 actions，
   * 包括 pending、fulfilled 和 rejected 三個狀態。
   * 
   * @param {ActionReducerMapBuilder<AuthState>} builder - reducer 構建器
   */
  extraReducers: (builder) => {
    // 處理 initializeAuth 異步操作的各個狀態
    builder
      /**
       * 處理 initializeAuth 的 pending 狀態
       * 當認證初始化開始時觸發
       */
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;  // 設置加載狀態為 true
        state.error = null;      // 清除之前的錯誤信息
      })
      /**
       * 處理 initializeAuth 的 fulfilled 狀態
       * 當認證初始化成功完成時觸發
       */
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;                        // 設置加載狀態為 false
        state.user = action.payload.user;               // 設置用戶信息
        state.isAuthenticated = action.payload.isAuthenticated;  // 設置認證狀態
        state.error = null;                            // 清除錯誤信息
      })
      /**
       * 處理 initializeAuth 的 rejected 狀態
       * 當認證初始化失敗時觸發
       */
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;        // 設置加載狀態為 false
        state.user = null;              // 清除用戶信息
        state.isAuthenticated = false;  // 設置為未認證
        state.error = action.payload as string;  // 設置錯誤信息
      });

    // 處理 login 異步操作的各個狀態
    builder
      /**
       * 處理 login 的 pending 狀態
       * 當登入操作開始時觸發
       */
      .addCase(login.pending, (state) => {
        state.isLoading = true;  // 設置加載狀態為 true
        state.error = null;      // 清除之前的錯誤信息
      })
      /**
       * 處理 login 的 fulfilled 狀態
       * 當登入操作成功完成時觸發
       */
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;                        // 設置加載狀態為 false
        state.user = action.payload.user;               // 設置用戶信息
        state.isAuthenticated = action.payload.isAuthenticated;  // 設置認證狀態
        state.error = null;                            // 清除錯誤信息
      })
      /**
       * 處理 login 的 rejected 狀態
       * 當登入操作失敗時觸發
       */
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;        // 設置加載狀態為 false
        state.user = null;              // 清除用戶信息
        state.isAuthenticated = false;  // 設置為未認證
        state.error = action.payload as string;  // 設置錯誤信息
      });

    // 處理 logout 異步操作的各個狀態
    builder
      /**
       * 處理 logout 的 pending 狀態
       * 當登出操作開始時觸發
       */
      .addCase(logout.pending, (state) => {
        state.isLoading = true;  // 設置加載狀態為 true
      })
      /**
       * 處理 logout 的 fulfilled 狀態
       * 當登出操作成功完成時觸發
       */
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;        // 設置加載狀態為 false
        state.user = null;              // 清除用戶信息
        state.isAuthenticated = false;  // 設置為未認證
        state.error = null;             // 清除錯誤信息
      })
      /**
       * 處理 logout 的 rejected 狀態
       * 當登出操作失敗時觸發
       */
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;        // 設置加載狀態為 false
        state.error = action.payload as string;  // 設置錯誤信息
        // 即使登出失敗，也要清除本地狀態以確保安全性
        state.user = null;              // 清除用戶信息
        state.isAuthenticated = false;  // 設置為未認證
      });
  },
});

/**
 * 導出同步 actions
 * 
 * 這些 action creators 由 createSlice 自動生成，
 * 可以直接在組件中使用來觸發狀態更新。
 */
export const { clearError, clearAuth } = authSlice.actions;

/**
 * 導出 reducer
 * 
 * 這個 reducer 會被包含在 store 的配置中，
 * 用於處理所有與認證相關的狀態更新。
 */
export default authSlice.reducer;

/**
 * Selectors - 用於從 Redux store 中選擇特定的狀態數據
 * 
 * 這些選擇器函數提供了一種類型安全的方式來訪問認證狀態，
 * 並可以在組件中與 useSelector hook 一起使用。
 */

/**
 * 選擇整個認證狀態
 * 
 * @function selectAuth
 * @param {object} state - 包含 auth 屬性的根狀態
 * @returns {AuthState} 完整的認證狀態
 */
export const selectAuth = (state: { auth: AuthState }) => state.auth;

/**
 * 選擇當前用戶信息
 * 
 * @function selectUser
 * @param {object} state - 包含 auth 屬性的根狀態
 * @returns {User | null} 當前用戶信息，未登入時為 null
 */
export const selectUser = (state: { auth: AuthState }) => state.auth.user;

/**
 * 選擇認證狀態
 * 
 * @function selectIsAuthenticated
 * @param {object} state - 包含 auth 屬性的根狀態
 * @returns {boolean} 是否已認證
 */
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;

/**
 * 選擇加載狀態
 * 
 * @function selectIsLoading
 * @param {object} state - 包含 auth 屬性的根狀態
 * @returns {boolean} 是否正在加載中
 */
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;

/**
 * 選擇錯誤信息
 * 
 * @function selectAuthError
 * @param {object} state - 包含 auth 屬性的根狀態
 * @returns {string | null} 錯誤信息，無錯誤時為 null
 */
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;