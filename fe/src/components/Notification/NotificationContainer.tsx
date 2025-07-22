/**
 * @fileoverview 通知容器組件
 * 
 * 此組件提供通知系統的容器功能，包括：
 * - 通知消息的顯示和管理
 * - 通知動畫效果處理
 * - 通知移除操作
 * - 不同類型通知的樣式區分
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React from 'react'; // 引入 React 核心庫
import { useSelector, useDispatch } from 'react-redux'; // 引入 Redux 狀態管理鉤子
import { RootState } from '../../stores'; // 引入 Redux 根狀態類型
import { removeNotification, startRemoveNotification } from '../../stores/notificationSlice'; // 引入通知相關的 Redux actions
import styles from './NotificationContainer.module.scss'; // 引入通知容器樣式

/**
 * 通知容器組件
 * 
 * 此組件負責顯示和管理所有的通知消息，包括成功、錯誤、警告等不同類型的通知。
 * 提供通知的顯示、移除動畫以及用戶交互功能。
 * 
 * @returns {JSX.Element} 通知容器的 JSX 元素
 * 
 * @example
 * ```tsx
 * import { NotificationContainer } from './NotificationContainer';
 * 
 * function App() {
 *   return (
 *     <div>
 *       <NotificationContainer />
 *     </div>
 *   );
 * }
 * ```
 */
export const NotificationContainer: React.FC = () => {
  // 從 Redux store 中獲取通知列表
  const notifications = useSelector((state: RootState) => state.notifications.notifications);
  // 初始化 Redux dispatch 鉤子
  const dispatch = useDispatch();

  /**
   * 處理通知移除操作
   * 
   * 執行通知移除的兩階段處理：
   * 1. 先觸發移除動畫
   * 2. 等待動畫完成後從狀態中移除通知
   * 
   * @param {string} notificationId - 要移除的通知 ID
   */
  const handleRemove = (notificationId: string) => {
    // 先觸發移除動畫，更新通知的移除狀態
    dispatch(startRemoveNotification(notificationId));
    // 等待動畫完成後移除通知（300ms 動畫時間）
    setTimeout(() => {
      dispatch(removeNotification(notificationId)); // 從狀態中移除通知
    }, 300);
  };

  // 渲染通知容器的主要內容
  return (
    <div className={styles.notificationContainer}> {/* 通知容器根元素 */}
      {/* 動態渲染所有通知 */}
      {notifications.map((notification) => (
        <div
          key={notification.id} // 使用通知 ID 作為唯一鍵值
          className={`${styles.notification} ${styles[notification.type]} ${
            notification.isRemoving ? styles.removing : '' // 根據移除狀態添加移除動畫樣式
          }`}
          onClick={() => handleRemove(notification.id)} // 點擊通知時觸發移除操作
        >
          {/* 通知消息內容 */}
          <div className={styles.message}>
            {notification.message} {/* 顯示通知消息文本 */}
          </div>
          {/* 關閉按鈕 */}
          <button 
            className={styles.closeButton}
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡，避免觸發通知本身的點擊事件
              handleRemove(notification.id); // 觸發移除操作
            }}
          >
            × {/* 關閉按鈕圖標 */}
          </button>
        </div>
      ))}
    </div>
  );
};