import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

// 創建通知 slice
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // 添加通知
    addNotification: (state, action: PayloadAction<{ type: 'success' | 'error'; message: string }>) => {
      const { type, message } = action.payload;
      const newNotification: Notification = {
        id: `notification-${Date.now()}-${Math.random()}`,
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

// 導出 reducer
export default notificationSlice.reducer;

// Selectors
export const selectNotifications = (state: { notifications: NotificationState }) => 
  state.notifications.notifications;