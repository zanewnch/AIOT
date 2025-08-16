/**
 * @fileoverview 使用者偏好設定表格視圖組件
 * 
 * 此組件提供使用者偏好設定的表格視圖功能，包括：
 * - 使用者偏好設定數據的顯示和載入
 * - 偏好設定的動態表格渲染
 * - 錯誤處理和載入狀態管理
 * - 個人化設定的詳細顯示
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React from 'react';
import { UserPreferenceQuery } from '../../../hooks/useUserPreferenceQuery';
import { useTableUIStore } from '../../../stores/tableStore';
import LoadingSpinner from '../../common/LoadingSpinner';
import { createLogger } from '../../../configs/loggerConfig';
import styles from '../../../styles/TableViewer.module.scss';

const logger = createLogger('UserPreferenceTableView');

/**
 * 使用者偏好設定表格視圖組件
 * 
 * 此組件負責顯示使用者偏好設定的表格視圖，提供偏好設定數據的查看功能。
 * 包含動態表格渲染、載入狀態管理、錯誤處理等功能。
 */
export const UserPreferenceTableView: React.FC = () => {
  // React Query hooks for data
  const userPreferenceQuery = new UserPreferenceQuery();
  const { data: userPreferencesData, isLoading, error, refetch } = userPreferenceQuery.useUserPreferences();
  
  // Zustand stores for UI state
  const { sorting, toggleSortOrder } = useTableUIStore();

  /**
   * 處理排序
   */
  const handleSort = (field: string) => {
    logger.debug('使用者偏好設定表格排序', { field, currentOrder: sorting.order, operation: 'sort' });
    toggleSortOrder(field as any);
  };

  /**
   * 將偏好設定物件轉換為可顯示的陣列格式
   */
  const convertToArrayFormat = React.useMemo(() => {
    if (!userPreferencesData) return [];
    
    // 將巢狀物件展平為可顯示的格式
    const flattenObject = (obj: any, prefix = ''): any => {
      const result: any = {};
      
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          const newKey = prefix ? `${prefix}.${key}` : key;
          
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // 遞迴處理巢狀物件
            Object.assign(result, flattenObject(value, newKey));
          } else {
            result[newKey] = value;
          }
        }
      }
      
      return result;
    };
    
    const flattened = flattenObject(userPreferencesData);
    return [flattened]; // 包裝成陣列格式以符合表格顯示需求
  }, [userPreferencesData]);

  /**
   * 排序數據
   */
  const sortedData = React.useMemo(() => {
    if (!convertToArrayFormat || convertToArrayFormat.length === 0) return [];
    
    const sorted = [...convertToArrayFormat];
    // 由於只有一筆記錄，排序主要是為了保持一致性
    return sorted;
  }, [convertToArrayFormat, sorting]);

  // 載入狀態檢查
  if (isLoading) {
    return <LoadingSpinner message="載入使用者偏好設定數據中..." />;
  }

  // 錯誤狀態檢查
  if (error) {
    return (
      <div className={styles.error}>
        <span>載入使用者偏好設定數據時發生錯誤: {(error as Error).message}</span>
        <button onClick={() => {
          logger.info('重新載入使用者偏好設定數據', { operation: 'retry' });
          refetch();
        }} className={styles.retryButton}>
          重試
        </button>
      </div>
    );
  }

  // 空資料檢查
  if (!userPreferencesData || Object.keys(userPreferencesData).length === 0) {
    return (
      <div className={styles.noData}>
        <span>目前沒有使用者偏好設定數據</span>
        <button onClick={() => {
          logger.info('刷新使用者偏好設定數據', { operation: 'refresh' });
          refetch();
        }} className={styles.refreshButton}>
          重新載入
        </button>
      </div>
    );
  }

  // 動態獲取表格欄位
  const columns = sortedData.length > 0 ? Object.keys(sortedData[0]) : [];

  /**
   * 格式化欄位值以便顯示
   */
  const formatValue = (value: any, column: string): string => {
    if (value === null || value === undefined) return '-';
    
    // 日期格式化
    if (column.includes('At') || column.includes('_at')) {
      try {
        return new Date(value).toLocaleString('zh-TW');
      } catch {
        return value;
      }
    }
    
    // 主題設定中文化
    if (column === 'theme') {
      const themeMap: { [key: string]: string } = {
        'light': '淺色主題',
        'dark': '深色主題',
        'auto': '自動調整'
      };
      return themeMap[value] || value;
    }
    
    // 時間格式中文化
    if (column === 'timeFormat') {
      const timeFormatMap: { [key: string]: string } = {
        '12h': '12小時制',
        '24h': '24小時制'
      };
      return timeFormatMap[value] || value;
    }
    
    // 語言設定中文化
    if (column === 'language') {
      const languageMap: { [key: string]: string } = {
        'zh-TW': '繁體中文',
        'zh-CN': '簡體中文',
        'en-US': '英文 (美國)',
        'ja-JP': '日文',
        'ko-KR': '韓文'
      };
      return languageMap[value] || value;
    }
    
    // 隱私設定中文化
    if (column.includes('privacy.profileVisibility')) {
      const visibilityMap: { [key: string]: string } = {
        'public': '公開',
        'private': '私人',
        'friends': '朋友可見'
      };
      return visibilityMap[value] || value;
    }
    
    // 布林值格式化
    if (typeof value === 'boolean') {
      return value ? '啟用' : '停用';
    }
    
    // 陣列格式化
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    // 數字格式化（特別處理時間相關）
    if (typeof value === 'number') {
      if (column.includes('timeout') || column.includes('Timeout')) {
        return `${value} 分鐘`;
      }
      if (column.includes('interval') || column.includes('Interval')) {
        return `${value} 秒`;
      }
      return value.toLocaleString();
    }
    
    return String(value);
  };

  /**
   * 格式化欄位名稱以便顯示
   */
  const formatColumnName = (column: string): string => {
    const columnNameMap: { [key: string]: string } = {
      'id': 'ID',
      'userId': '使用者ID',
      'theme': '主題',
      'language': '語言',
      'timezone': '時區',
      'dateFormat': '日期格式',
      'timeFormat': '時間格式',
      'currency': '貨幣',
      'autoSave': '自動儲存',
      'autoLogout': '自動登出',
      'autoLogoutTimeout': '自動登出時間',
      'notifications.email': '電子郵件通知',
      'notifications.push': '推播通知',
      'notifications.desktop': '桌面通知',
      'notifications.sound': '聲音通知',
      'privacy.profileVisibility': '個人資料可見性',
      'privacy.activityTracking': '活動追蹤',
      'privacy.dataCollection': '資料收集',
      'dashboard.defaultLayout': '預設版面配置',
      'dashboard.widgets': '小工具',
      'dashboard.refreshInterval': '更新間隔',
      'accessibility.highContrast': '高對比度',
      'accessibility.largeText': '大字體',
      'accessibility.screenReader': '螢幕閱讀器',
      'advanced.debugMode': '除錯模式',
      'advanced.experimentalFeatures': '實驗性功能',
      'advanced.apiRequestTimeout': 'API 請求超時',
      'createdAt': '建立時間',
      'updatedAt': '更新時間'
    };
    
    return columnNameMap[column] || column;
  };

  return (
    <div className={styles.tableContainer}>
      {/* 使用者偏好設定數據表格 */}
      <table 
        className={styles.table} 
        style={{ '--row-count': sortedData.length } as React.CSSProperties}
      >
        <thead>
          <tr>
            {columns.map((column) => (
              <th 
                key={column} 
                className={`${styles.sortable} ${sorting.field === column ? styles.sorted : ''}`}
                onClick={() => handleSort(column)}
              >
                <div className={styles.headerContent}>
                  <span>{formatColumnName(column)}</span>
                  {sorting.field === column && (
                    <span className={styles.sortIcon}>
                      {sorting.order === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item: any, index: number) => (
            <tr key={item.id || index} className={styles.tableRow}>
              {columns.map((column) => (
                <td key={column} className={styles.tableCell}>
                  {formatValue(item[column], column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};