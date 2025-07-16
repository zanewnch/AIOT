import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { removeNotification, startRemoveNotification } from '../../store/notificationSlice';
import styles from './NotificationContainer.module.scss';

export const NotificationContainer: React.FC = () => {
  const notifications = useSelector((state: RootState) => state.notifications.notifications);
  const dispatch = useDispatch();

  const handleRemove = (notificationId: string) => {
    // 先觸發動畫
    dispatch(startRemoveNotification(notificationId));
    // 等待動畫完成後移除
    setTimeout(() => {
      dispatch(removeNotification(notificationId));
    }, 300);
  };

  return (
    <div className={styles.notificationContainer}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${styles.notification} ${styles[notification.type]} ${
            notification.isRemoving ? styles.removing : ''
          }`}
          onClick={() => handleRemove(notification.id)}
        >
          <div className={styles.message}>
            {notification.message}
          </div>
          <button 
            className={styles.closeButton}
            onClick={(e) => {
              e.stopPropagation();
              handleRemove(notification.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};