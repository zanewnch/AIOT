/**
 * @fileoverview Redux Store 索引文件 - 統一導出 store 配置和類型定義
 * 
 * 這個文件是 Redux store 的主要入口點，負責：
 * - 配置和創建 Redux store
 * - 組合所有的 slice reducers
 * - 設置中間件和序列化檢查
 * - 導出 TypeScript 類型定義
 * 
 * @author AIOT Development Team
 * @since 2024
 */

// 引入 Redux Toolkit 的 store 配置函數
import { configureStore } from '@reduxjs/toolkit';
// 引入各個 slice 的 reducer
import userReducer from './userSlice';            // 用戶管理 reducer
import notificationReducer from './notificationSlice';  // 通知管理 reducer
import authReducer from './authSlice';            // 認證管理 reducer
import themeReducer from './themeSlice';          // 主題管理 reducer
import tableReducer from './tableSlice';          // 表格管理 reducer

/**
 * 配置和創建 Redux store
 * 
 * 這個 store 包含了應用的所有狀態管理邏輯，
 * 使用 Redux Toolkit 的 configureStore 來簡化配置。
 * 
 * @constant {EnhancedStore} store - 應用的 Redux store 實例
 */
export const store = configureStore({
  /**
   * 根 reducer 的配置
   * 
   * 將所有 slice reducers 組合成一個根 reducer，
   * 每個 key 對應一個 slice 的狀態。
   */
  reducer: {
    user: userReducer,              // 用戶管理狀態
    notifications: notificationReducer,  // 通知管理狀態
    auth: authReducer,              // 認證管理狀態
    theme: themeReducer,            // 主題管理狀態
    table: tableReducer,            // 表格管理狀態
  },
  
  /**
   * 中間件配置
   * 
   * 使用 Redux Toolkit 的默認中間件，
   * 並自定義序列化檢查設置。
   * 
   * @param {GetDefaultMiddleware} getDefaultMiddleware - 獲取默認中間件的函數
   * @returns {Middleware[]} 配置後的中間件陣列
   */
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      /**
       * 序列化檢查配置
       * 
       * Redux Toolkit 默認會檢查 action 和 state 是否可序列化，
       * 這裡忽略了與 redux-persist 相關的 actions，
       * 因為它們可能包含不可序列化的數據。
       */
      serializableCheck: {
        // 忽略 redux-persist 的 actions，因為它們可能包含不可序列化的數據
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

/**
 * 根狀態類型定義
 * 
 * 從 store 的 getState 方法推斷出完整的狀態類型，
 * 這個類型包含了所有 slice 狀態的聯合類型。
 * 
 * @typedef {ReturnType<typeof store.getState>} RootState
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * 應用 dispatch 類型定義
 * 
 * 從 store 的 dispatch 屬性推斷出正確的 dispatch 類型，
 * 這個類型包含了所有可能的 action 類型，包括 thunk actions。
 * 
 * @typedef {typeof store.dispatch} AppDispatch
 */
export type AppDispatch = typeof store.dispatch;