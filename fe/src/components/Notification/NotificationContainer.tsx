import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import styles from './NotificationContainer.module.scss';

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className={styles.notificationContainer}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${styles.notification} ${styles[notification.type]}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className={styles.message}>
            {notification.message}
          </div>
          <button 
            className={styles.closeButton}
            onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};