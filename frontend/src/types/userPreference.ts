/**
 * 使用者偏好設定相關接口
 */
export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  autoSave: boolean;
  autoLogout: boolean;
  autoLogoutTimeout: number; // minutes
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    sound: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    activityTracking: boolean;
    dataCollection: boolean;
  };
  dashboard: {
    defaultLayout: string;
    widgets: string[];
    refreshInterval: number; // seconds
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
  };
  advanced: {
    debugMode: boolean;
    experimentalFeatures: boolean;
    apiRequestTimeout: number; // milliseconds
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPreferencesRequest {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  currency?: string;
  autoSave?: boolean;
  autoLogout?: boolean;
  autoLogoutTimeout?: number;
  notifications?: Partial<UserPreferences['notifications']>;
  privacy?: Partial<UserPreferences['privacy']>;
  dashboard?: Partial<UserPreferences['dashboard']>;
  accessibility?: Partial<UserPreferences['accessibility']>;
  advanced?: Partial<UserPreferences['advanced']>;
}

export interface UpdateUserPreferencesRequest extends CreateUserPreferencesRequest {
  // 更新請求與創建請求結構相同，所有欄位都是可選的
}