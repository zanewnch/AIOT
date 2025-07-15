import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService, User, LoginRequest, AuthError } from '../services/AuthService';

// 認證狀態介面
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 初始狀態
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// 異步 thunks

// 初始化認證狀態
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const isAuth = authService.isAuthenticated();
      const currentUser = authService.getCurrentUser();

      if (isAuth && currentUser) {
        return {
          isAuthenticated: true,
          user: currentUser,
        };
      } else {
        return {
          isAuthenticated: false,
          user: null,
        };
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      return rejectWithValue('Authentication initialization failed');
    }
  }
);

// 登入
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      const currentUser = authService.getCurrentUser();

      if (currentUser) {
        return {
          user: currentUser,
          isAuthenticated: true,
        };
      } else {
        throw new Error('Failed to get user information');
      }
    } catch (error) {
      const authError = error as AuthError;
      return rejectWithValue(authError.message || 'Login failed');
    }
  }
);

// 登出
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return null;
    } catch (error) {
      console.error('Logout error:', error);
      return rejectWithValue('Logout failed');
    }
  }
);

// 創建 slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 清除錯誤
    clearError: (state) => {
      state.error = null;
    },
    
    // 清除所有認證狀態（用於強制登出）
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    // 初始化認證
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });

    // 登入
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });

    // 登出
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // 即使登出失敗，也要清除本地狀態
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

// 導出 actions
export const { clearError, clearAuth } = authSlice.actions;

// 導出 reducer
export default authSlice.reducer;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;