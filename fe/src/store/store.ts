import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import activityReducer from './activitySlice';

/**
 * Redux Store 配置
 */
export const store = configureStore({
  reducer: {
    activity: activityReducer,
    // 其他 slices 可以在這裡添加
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略日期對象的序列化檢查
        ignoredActionPaths: ['payload.lastLoginAt', 'payload.lastActiveAt'],
        ignoredStatePaths: ['activity.activity.lastLoginAt', 'activity.activity.lastActiveAt']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 類型化的 hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;