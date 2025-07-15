import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { removeNotification } from '../../store/notificationSlice';
import styles from './NotificationContainer.module.scss';

export const NotificationContainer: React.FC = () => {
  const notifications = useSelector((state: RootState) => state.notifications.notifications);
  const dispatch = useDispatch();

  return (
    <div className={styles.notificationContainer}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${styles.notification} ${styles[notification.type]}`}
          onClick={() => dispatch(removeNotification(notification.id))}
        >
          <div className={styles.message}>
            {notification.message}
          </div>
          <button 
            className={styles.closeButton}
            onClick={(e) => {
              e.stopPropagation();
              dispatch(removeNotification(notification.id));
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};