/**
 * @fileoverview 使用者活動表格視圖組件
 * 
 * 此組件提供使用者活動的表格視圖功能，包括：
 * - 使用者活動數據的顯示和載入
 * - 活動記錄的動態表格渲染
 * - 錯誤處理和載入狀態管理
 * - 活動類型和時間的詳細顯示
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTableUIStore } from '../../../stores/tableStore';
import LoadingSpinner from '../../common/LoadingSpinner';
import { createLogger } from '../../../configs/loggerConfig';
import { apiClient } from '../../../utils/RequestUtils';
import { RequestResult } from '../../../utils/RequestResult';
import styles from '../../../styles/TableViewer.module.scss';

const logger = createLogger('UserActivityTableView');

/**
 * 使用者活動介面定義
 */
interface UserActivity {
  id: number;
  user_id: number;
  activity_type: string;
  activity_description: string;
  ip_address: string;
  user_agent: string;
  session_id: string;
  device_info: object | null;
  location_info: object | null;
  additional_data: object | null;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * API 函數：獲取使用者活動數據
 */
const fetchUserActivity = async (): Promise<UserActivity[]> => {
  const response = await apiClient.get('/api/user-activity/data');
  const result = RequestResult.fromResponse<UserActivity[]>(response);
  
  if (result.isError()) {
    throw new Error(result.message);
  }
  
  return result.unwrap();
};

/**
 * 使用者活動表格視圖組件
 * 
 * 此組件負責顯示使用者活動的表格視圖，提供活動記錄數據的查看功能。
 * 包含動態表格渲染、載入狀態管理、錯誤處理等功能。
 */
export const UserActivityTableView: React.FC = () => {
  // React Query hooks for data
  const { data: userActivityData, isLoading, error, refetch } = useQuery({
    queryKey: ['userActivity'],
    queryFn: fetchUserActivity,
    staleTime: 30 * 1000, // 30秒內不會重新獲取
    gcTime: 5 * 60 * 1000, // 5分鐘後清除緩存
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  
  // Zustand stores for UI state
  const { sorting, toggleSortOrder } = useTableUIStore();

  /**
   * 處理排序
   */
  const handleSort = (field: string) => {
    logger.debug('使用者活動表格排序', { field, currentOrder: sorting.order, operation: 'sort' });
    toggleSortOrder(field as any);
  };

  /**
   * 排序數據
   */
  const sortedData = React.useMemo(() => {
    if (!userActivityData) return [];
    
    const sorted = [...userActivityData];
    sorted.sort((a, b) => {
      const aValue = a[sorting.field as keyof UserActivity];
      const bValue = b[sorting.field as keyof UserActivity];
      
      if (aValue < bValue) return sorting.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sorting.order === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [userActivityData, sorting]);

  // 載入狀態檢查
  if (isLoading) {
    return <LoadingSpinner message="載入使用者活動數據中..." />;
  }

  // 錯誤狀態檢查
  if (error) {
    return (
      <div className={styles.error}>
        <span>載入使用者活動數據時發生錯誤: {(error as Error).message}</span>
        <button onClick={() => {
          logger.info('重新載入使用者活動數據', { operation: 'retry' });
          refetch();
        }} className={styles.retryButton}>
          重試
        </button>
      </div>
    );
  }

  // 空資料檢查
  if (!userActivityData || userActivityData.length === 0) {
    return (
      <div className={styles.noData}>
        <span>目前沒有使用者活動數據</span>
        <button onClick={() => {
          logger.info('刷新使用者活動數據', { operation: 'refresh' });
          refetch();
        }} className={styles.refreshButton}>
          重新載入
        </button>
      </div>
    );
  }

  // 動態獲取表格欄位
  const columns = Object.keys(userActivityData[0]);

  /**
   * 格式化欄位值以便顯示
   */
  const formatValue = (value: any, column: string): string => {
    if (value === null || value === undefined) return '-';
    
    // 日期格式化
    if (column.includes('At') || column === 'timestamp') {
      try {
        return new Date(value).toLocaleString('zh-TW');
      } catch {
        return value;
      }
    }
    
    // 活動類型中文化
    if (column === 'activity_type') {
      const activityTypeMap: { [key: string]: string } = {
        'login': '登入',
        'logout': '登出',
        'view_page': '頁面瀏覽',
        'api_call': 'API 呼叫',
        'file_upload': '檔案上傳',
        'file_download': '檔案下載',
        'data_export': '資料匯出',
        'settings_change': '設定變更',
        'password_change': '密碼變更',
        'profile_update': '個人資料更新',
        'drone_command': '無人機指令',
        'system_admin': '系統管理',
        'error': '錯誤操作'
      };
      return activityTypeMap[value] || value;
    }
    
    // JSON 物件格式化（簡化顯示）
    if (typeof value === 'object' && value !== null) {
      try {
        // 對於複雜物件，只顯示關鍵資訊
        if (column === 'device_info' && value.browser) {
          return `${value.browser} (${value.os || 'Unknown OS'})`;
        }
        if (column === 'location_info' && value.country) {
          return `${value.country} ${value.city || ''}`.trim();
        }
        if (column === 'additional_data') {
          const keys = Object.keys(value);
          return keys.length > 0 ? `包含 ${keys.length} 項資料` : '無額外資料';
        }
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    
    // IP 地址格式化（隱私保護）
    if (column === 'ip_address') {
      const parts = value.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.*.${parts[3]}`;
      }
      return value;
    }
    
    // User Agent 簡化顯示
    if (column === 'user_agent') {
      // 只顯示前50個字符
      return value.length > 50 ? `${value.substring(0, 50)}...` : value;
    }
    
    // Session ID 簡化顯示
    if (column === 'session_id') {
      return value.length > 12 ? `${value.substring(0, 8)}...${value.substring(-4)}` : value;
    }
    
    // 數字格式化
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    // 布林值格式化
    if (typeof value === 'boolean') {
      return value ? '是' : '否';
    }
    
    return String(value);
  };

  /**
   * 獲取行的特殊樣式類別（基於活動類型）
   */
  const getRowClassName = (item: UserActivity): string => {
    let className = styles.tableRow;
    
    // 根據活動類型添加樣式
    if (item.activity_type === 'error') {
      className += ` ${styles.errorActivity}`;
    } else if (item.activity_type === 'login') {
      className += ` ${styles.loginActivity}`;
    } else if (item.activity_type === 'drone_command') {
      className += ` ${styles.droneActivity}`;
    }
    
    return className;
  };

  return (
    <div className={styles.tableContainer}>
      {/* 使用者活動數據表格 */}
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
                  <span>{column}</span>
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
          {sortedData.map((item: UserActivity, index: number) => (
            <tr key={item.id || index} className={getRowClassName(item)}>
              {columns.map((column) => (
                <td key={column} className={styles.tableCell}>
                  {formatValue(item[column as keyof UserActivity], column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};