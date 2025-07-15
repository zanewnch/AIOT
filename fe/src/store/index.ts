import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import notificationReducer from './notificationSlice';
import authReducer from './authSlice';
import themeReducer from './themeSlice';
import tableReducer from './tableSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    notifications: notificationReducer,
    auth: authReducer,
    theme: themeReducer,
    table: tableReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;