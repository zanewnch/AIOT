export interface Notification {
  id: string;
  type: 'success' | 'error';
  message: string;
  timestamp: number;
}

export type NotificationContextType = {
  notifications: Notification[];
  addNotification: (type: 'success' | 'error', message: string) => void;
  removeNotification: (id: string) => void;
};