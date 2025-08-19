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
      /**
       * 添加通知到通知列表
       * 
       * @param type - 通知類型，'success' 或 'error'
       * @param message - 通知訊息內容
       * @param id - 可選的自訂通知 ID，若不提供則自動產生
       * @returns 返回通知的唯一 ID
       * 
       * @example
       * ```typescript
       * const id = addNotification('success', '操作成功');
       * const customId = addNotification('error', '操作失敗', 'custom-id');
       * ```
       */
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

      /**
       * 從通知列表中移除指定的通知
       * 
       * @param id - 要移除的通知 ID
       * 
       * @example
       * ```typescript
       * removeNotification('notification-123');
       * ```
       */
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }), false, 'removeNotification');
      },

      /**
       * 清空所有通知
       * 
       * @example
       * ```typescript
       * clearAll(); // 移除所有通知
       * ```
       */
      clearAll: () => {
        set({ notifications: [] }, false, 'clearAll');
      },

      /**
       * 開始移除動畫，將指定通知標記為正在移除狀態
       * 
       * 設置 isRemoving 標記為 true，觸發移除動畫效果
       * 
       * @param id - 要開始移除動畫的通知 ID
       * 
       * @example
       * ```typescript
       * startRemove('notification-123');
       * // 通常配合 setTimeout 使用
       * setTimeout(() => removeNotification(id), 300);
       * ```
       */
      startRemove: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, isRemoving: true } : n
          )
        }), false, 'startRemove');
      },

      /**
       * 添加帶自動移除功能的通知
       * 
       * 通知會在 3 秒後自動開始移除動畫，並在動畫完成後從列表中移除
       * 
       * @param type - 通知類型，'success' 或 'error'
       * @param message - 通知訊息內容
       * @returns 返回通知的唯一 ID
       * 
       * @example
       * ```typescript
       * addWithAutoRemove('success', '自動保存成功');
       * addWithAutoRemove('error', '網路連線失敗');
       * ```
       */
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
      /**
       * 添加成功類型的通知（便利方法）
       * 
       * @param message - 通知訊息內容
       * @param autoRemove - 是否自動移除，預設為 true
       * @returns 返回通知的唯一 ID
       * 
       * @example
       * ```typescript
       * addSuccess('登入成功'); // 自動移除
       * addSuccess('重要訊息', false); // 手動移除
       * ```
       */
      addSuccess: (message, autoRemove = true) => {
        return autoRemove ? get().addWithAutoRemove('success', message) : get().addNotification('success', message);
      },

      /**
       * 添加錯誤類型的通知（便利方法）
       * 
       * @param message - 通知訊息內容
       * @param autoRemove - 是否自動移除，預設為 true
       * @returns 返回通知的唯一 ID
       * 
       * @example
       * ```typescript
       * addError('登入失敗'); // 自動移除
       * addError('嚴重錯誤', false); // 手動移除
       * ```
       */
      addError: (message, autoRemove = true) => {
        return autoRemove ? get().addWithAutoRemove('error', message) : get().addNotification('error', message);
      },

      // Computed getters
      /**
       * 根據類型篩選通知
       * 
       * @param type - 要篩選的通知類型
       * @returns 返回指定類型的所有通知陣列
       * 
       * @example
       * ```typescript
       * const successNotifications = getByType('success');
       * const errorNotifications = getByType('error');
       * ```
       */
      getByType: (type) => {
        return get().notifications.filter(n => n.type === type);
      },

      /**
       * 取得最新的通知
       * 
       * @returns 返回最後加入的通知物件，若無通知則返回 null
       * 
       * @example
       * ```typescript
       * const latest = getLatest();
       * if (latest) {
       *   console.log('最新通知:', latest.message);
       * }
       * ```
       */
      getLatest: () => {
        const notifications = get().notifications;
        return notifications.length > 0 ? notifications[notifications.length - 1] : null;
      },

      /**
       * 取得目前通知總數
       * 
       * @returns 返回通知列表中的通知數量
       * 
       * @example
       * ```typescript
       * const totalCount = count();
       * console.log(`目前有 ${totalCount} 個通知`);
       * ```
       */
      count: () => get().notifications.length,
      
      /**
       * 檢查是否有任何通知
       * 
       * @returns 有通知時返回 true，無通知時返回 false
       * 
       * @example
       * ```typescript
       * if (hasAny()) {
       *   console.log('有待處理的通知');
       * }
       * ```
       */
      hasAny: () => get().notifications.length > 0,
    }),
    { name: 'notification-store' }
  )
);

