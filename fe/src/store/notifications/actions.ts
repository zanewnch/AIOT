import { AppDispatch } from '../index';
import { addNotification as addNotificationAction, removeNotification } from '../notificationSlice';

// 添加通知的函數 - 包含自動移除邏輯
export const addNotification = (type: 'success' | 'error', message: string) => {
  return (dispatch: AppDispatch) => {
    // 添加通知並獲取完整的 action
    const action = dispatch(addNotificationAction({ type, message }));
    
    // 從 action 的 payload 中獲取通知 ID
    // 注意：我們需要修改 slice 來包含 ID
    const notificationId = `notification-${Date.now()}-${Math.random()}`;
    
    // 5秒後自動移除
    setTimeout(() => {
      dispatch(removeNotification(notificationId));
    }, 5000);
    
    return action;
  };
};

// 重新導出其他 actions
export { removeNotification, clearAllNotifications } from '../notificationSlice';