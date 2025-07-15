import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

// 通知項目介面
export interface Notification {
  id: string;
  type: 'success' | 'error';
  message: string;
  timestamp: number;
}

// 通知狀態介面
interface NotificationState {
  notifications: Notification[];
}

// 初始狀態
const initialState: NotificationState = {
  notifications: [],
};

// 創建帶有自動移除邏輯的 async thunk
export const addNotificationWithAutoRemove = createAsyncThunk(
  'notifications/addNotificationWithAutoRemove',
  async ({ type, message }: { type: 'success' | 'error'; message: string }, { dispatch }) => {
    // 生成唯一 ID
    const notificationId = `notification-${Date.now()}-${Math.random()}`;
    
    // 添加通知
    dispatch(addNotification({ type, message, id: notificationId }));
    
    // 5秒後自動移除
    setTimeout(() => {
      dispatch(removeNotification(notificationId));
    }, 5000);
    
    return notificationId;
  }
);

// 創建通知 slice
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // 添加通知 (內部使用，支持自定義 ID)
    addNotification: (state, action: PayloadAction<{ type: 'success' | 'error'; message: string; id?: string }>) => {
      const { type, message, id } = action.payload;
      const newNotification: Notification = {
        id: id || `notification-${Date.now()}-${Math.random()}`,
        type,
        message,
        timestamp: Date.now(),
      };
      state.notifications.push(newNotification);
    },
    
    // 移除通知
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    
    // 清除所有通知
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
  },
});

// 導出 actions
export const { addNotification, removeNotification, clearAllNotifications } = notificationSlice.actions;

// addNotificationWithAutoRemove 已經在上面使用 export 導出了

// 為了向後兼容，創建一個簡化的 API
export const addNotificationAuto = addNotificationWithAutoRemove;

// 導出 reducer
export default notificationSlice.reducer;

// Selectors
export const selectNotifications = (state: { notifications: NotificationState }) => 
  state.notifications.notifications;