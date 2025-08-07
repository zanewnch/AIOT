/**
 * @fileoverview 通知管理 - 使用 Zustand
 * 
 * 純 Zustand 實現，簡潔直接：
 * - 無需 actions/reducers 那些複雜結構
 * - 直接在 store 中定義方法
 * - 支援自動移除和動畫效果
 * 
 * @author AIOT Development Team
 * @version 3.0.0 (簡化 Zustand 實現)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * 通知項目的類型定義
 */
export interface Notification {
  id: string;
  type: 'success' | 'error';
  message: string;
  timestamp: number;
  isRemoving?: boolean;
}

/**
 * 通知 Store
 */
interface NotificationStore {
  // State
  notifications: Notification[];
  
  // Basic methods
  addNotification: (type: 'success' | 'error', message: string, id?: string) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  startRemove: (id: string) => void;
  addWithAutoRemove: (type: 'success' | 'error', message: string) => string;
  
  // Convenience methods
  addSuccess: (message: string, autoRemove?: boolean) => string;
  addError: (message: string, autoRemove?: boolean) => string;
  
  // Computed getters
  getByType: (type: 'success' | 'error') => Notification[];
  getLatest: () => Notification | null;
  count: () => number;
  hasAny: () => boolean;
}

/**
 * Zustand 通知 Store
 */
export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set, get) => ({
      // State
      notifications: [],

      // Methods
      addNotification: (type, message, id) => {
        const notificationId = id || `notification-${Date.now()}-${Math.random()}`;
        const newNotification: Notification = {
          id: notificationId,
          type,
          message,
          timestamp: Date.now(),
        };
        
        set((state) => ({
          notifications: [...state.notifications, newNotification]
        }), false, 'addNotification');
        
        return notificationId;
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }), false, 'removeNotification');
      },

      clearAll: () => {
        set({ notifications: [] }, false, 'clearAll');
      },

      startRemove: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, isRemoving: true } : n
          )
        }), false, 'startRemove');
      },

      addWithAutoRemove: (type, message) => {
        const id = get().addNotification(type, message);
        
        // 自動移除
        setTimeout(() => {
          get().startRemove(id);
          setTimeout(() => {
            get().removeNotification(id);
          }, 300); // 等待動畫
        }, 3000); // 3秒後開始移除
        
        return id;
      },

      // Convenience methods
      addSuccess: (message, autoRemove = true) => {
        return autoRemove ? get().addWithAutoRemove('success', message) : get().addNotification('success', message);
      },

      addError: (message, autoRemove = true) => {
        return autoRemove ? get().addWithAutoRemove('error', message) : get().addNotification('error', message);
      },

      // Computed getters
      getByType: (type) => {
        return get().notifications.filter(n => n.type === type);
      },

      getLatest: () => {
        const notifications = get().notifications;
        return notifications.length > 0 ? notifications[notifications.length - 1] : null;
      },

      count: () => get().notifications.length,
      
      hasAny: () => get().notifications.length > 0,
    }),
    { name: 'notification-store' }
  )
);

