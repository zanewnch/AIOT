/**
 * @fileoverview 活動追蹤專用 Redux Store 配置
 * 
 * 這個文件是活動追蹤模組的專用 Redux store 配置，包含：
 * - 活動追蹤 slice 的配置
 * - 自定義的類型化 hooks
 * - 序列化檢查的特殊配置（用於處理 Date 對象）
 * - 開發工具的條件性啟用
 * 
 * 注意：這個 store 與主 store (index.ts) 是分開的，
 * 專門用於活動追蹤功能模組。
 * 
 * @author AIOT Development Team
 * @since 2024
 */

// 引入 Redux Toolkit 的 store 配置函數
import { configureStore } from '@reduxjs/toolkit';
// 引入 React Redux 的 hooks 和類型
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
// 引入活動追蹤 slice 的 reducer
import activityReducer from './activitySlice';

/**
 * 活動追蹤專用 Redux Store 配置
 * 
 * 這個 store 專門用於活動追蹤功能，包含了特殊的序列化檢查配置
 * 來處理 Date 對象，並在開發環境中啟用 Redux DevTools。
 * 
 * @constant {EnhancedStore} store - 活動追蹤專用的 Redux store 實例
 */
export const store = configureStore({
  /**
   * 根 reducer 的配置
   * 
   * 目前只包含 activity reducer，但可以根據需要添加更多 slices。
   */
  reducer: {
    activity: activityReducer,    // 活動追蹤狀態管理
    // 其他 slices 可以在這裡添加
  },
  
  /**
   * 中間件配置
   * 
   * 使用 Redux Toolkit 的默認中間件，並自定義序列化檢查設置
   * 來處理活動追蹤中的 Date 對象。
   * 
   * @param {GetDefaultMiddleware} getDefaultMiddleware - 獲取默認中間件的函數
   * @returns {Middleware[]} 配置後的中間件陣列
   */
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      /**
       * 序列化檢查配置
       * 
       * 由於活動追蹤中使用了 Date 對象，需要特別配置序列化檢查
       * 來忽略這些不可序列化的數據。
       */
      serializableCheck: {
        // 忽略包含日期對象的 action paths
        ignoredActionPaths: ['payload.lastLoginAt', 'payload.lastActiveAt'],
        // 忽略包含日期對象的 state paths
        ignoredStatePaths: ['activity.activity.lastLoginAt', 'activity.activity.lastActiveAt']
      }
    }),
  
  /**
   * Redux DevTools 配置
   * 
   * 只在開發環境中啟用 Redux DevTools，生產環境中禁用以提高性能。
   */
  devTools: process.env.NODE_ENV !== 'production'
});

/**
 * 根狀態類型定義
 * 
 * 從 store 的 getState 方法推斷出完整的狀態類型。
 * 
 * @typedef {ReturnType<typeof store.getState>} RootState
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * 應用 dispatch 類型定義
 * 
 * 從 store 的 dispatch 屬性推斷出正確的 dispatch 類型。
 * 
 * @typedef {typeof store.dispatch} AppDispatch
 */
export type AppDispatch = typeof store.dispatch;

/**
 * 類型化的 hooks
 * 
 * 這些 hooks 提供了類型安全的方式來使用 Redux store，
 * 避免了在組件中重複定義類型。
 */

/**
 * 類型化的 dispatch hook
 * 
 * 使用這個 hook 而不是直接使用 useDispatch，
 * 可以獲得完整的 TypeScript 類型支持。
 * 
 * @function useAppDispatch
 * @returns {AppDispatch} 類型化的 dispatch 函數
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * 類型化的 selector hook
 * 
 * 使用這個 hook 而不是直接使用 useSelector，
 * 可以獲得完整的 TypeScript 類型支持和自動完成功能。
 * 
 * @constant {TypedUseSelectorHook<RootState>} useAppSelector - 類型化的 selector hook
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;