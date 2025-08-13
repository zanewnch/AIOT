/**
 * @fileoverview 無人機狀態歷史歸檔表格視圖組件
 * 
 * 此組件提供無人機狀態歷史歸檔的表格視圖功能，包括：
 * - 歸檔狀態數據的顯示和載入
 * - 無人機歷史狀態的動態表格渲染
 * - 錯誤處理和載入狀態管理
 * - 飛行狀態和系統參數的詳細顯示
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

const logger = createLogger('DroneStatusArchiveTableView');

/**
 * 無人機狀態歷史歸檔介面定義
 */
interface DroneStatusArchive {
  id: number;
  original_id: number;
  drone_id: number;
  flight_status: string;
  battery_level: number;
  signal_strength: number;
  altitude: number;
  speed: number;
  heading: number;
  gps_status: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  timestamp: string;
  archived_at: string;
  archive_batch_id: string;
  created_at: string;
}

/**
 * API 函數：獲取無人機狀態歷史歸檔數據
 */
const fetchDroneStatusArchive = async (): Promise<DroneStatusArchive[]> => {
  const response = await apiClient.get('/api/drone/statuses/archive/data');
  const result = RequestResult.fromResponse<DroneStatusArchive[]>(response);
  
  if (result.isError()) {
    throw new Error(result.message);
  }
  
  return result.unwrap();
};

/**
 * 無人機狀態歷史歸檔表格視圖組件
 * 
 * 此組件負責顯示無人機狀態歷史歸檔的表格視圖，提供歸檔狀態數據的查看功能。
 * 包含動態表格渲染、載入狀態管理、錯誤處理等功能。
 */
export const DroneStatusArchiveTableView: React.FC = () => {
  // React Query hooks for data
  const { data: droneStatusArchiveData, isLoading, error, refetch } = useQuery({
    queryKey: ['droneStatusArchive'],
    queryFn: fetchDroneStatusArchive,
    staleTime: 2 * 60 * 1000, // 2分鐘內不會重新獲取（歸檔數據變化較少）
    gcTime: 15 * 60 * 1000, // 15分鐘後清除緩存
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  
  // Zustand stores for UI state
  const { sorting, toggleSortOrder } = useTableUIStore();

  /**
   * 處理排序
   */
  const handleSort = (field: string) => {
    logger.debug('無人機狀態歷史歸檔表格排序', { field, currentOrder: sorting.order, operation: 'sort' });
    toggleSortOrder(field as any);
  };

  /**
   * 排序數據
   */
  const sortedData = React.useMemo(() => {
    if (!droneStatusArchiveData) return [];
    
    const sorted = [...droneStatusArchiveData];
    sorted.sort((a, b) => {
      const aValue = a[sorting.field as keyof DroneStatusArchive];
      const bValue = b[sorting.field as keyof DroneStatusArchive];
      
      if (aValue < bValue) return sorting.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sorting.order === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [droneStatusArchiveData, sorting]);

  // 載入狀態檢查
  if (isLoading) {
    return <LoadingSpinner message="載入無人機狀態歷史歸檔數據中..." />;
  }

  // 錯誤狀態檢查
  if (error) {
    return (
      <div className={styles.error}>
        <span>載入無人機狀態歷史歸檔數據時發生錯誤: {(error as Error).message}</span>
        <button onClick={() => {
          logger.info('重新載入無人機狀態歷史歸檔數據', { operation: 'retry' });
          refetch();
        }} className={styles.retryButton}>
          重試
        </button>
      </div>
    );
  }

  // 空資料檢查
  if (!droneStatusArchiveData || droneStatusArchiveData.length === 0) {
    return (
      <div className={styles.noData}>
        <span>目前沒有無人機狀態歷史歸檔數據</span>
        <button onClick={() => {
          logger.info('刷新無人機狀態歷史歸檔數據', { operation: 'refresh' });
          refetch();
        }} className={styles.refreshButton}>
          重新載入
        </button>
      </div>
    );
  }

  // 動態獲取表格欄位
  const columns = Object.keys(droneStatusArchiveData[0]);

  /**
   * 格式化欄位值以便顯示
   */
  const formatValue = (value: any, column: string): string => {
    if (value === null || value === undefined) return '-';
    
    // 日期格式化
    if (column.includes('_at') || column === 'timestamp') {
      try {
        return new Date(value).toLocaleString('zh-TW');
      } catch {
        return value;
      }
    }
    
    // 飛行狀態中文化
    if (column === 'flight_status') {
      const statusMap: { [key: string]: string } = {
        'grounded': '待機',
        'taking_off': '起飛中',
        'hovering': '懸停',
        'flying': '飛行中',
        'landing': '降落中',
        'emergency': '緊急狀態',
        'maintenance': '維護中'
      };
      return statusMap[value] || value;
    }
    
    // GPS 狀態中文化
    if (column === 'gps_status') {
      const gpsStatusMap: { [key: string]: string } = {
        'no_fix': '無信號',
        '2d_fix': '2D定位',
        '3d_fix': '3D定位',
        'dgps': 'DGPS',
        'rtk': 'RTK'
      };
      return gpsStatusMap[value] || value;
    }
    
    // 電池電量格式化（加上百分比符號）
    if (column === 'battery_level') {
      return typeof value === 'number' ? `${value}%` : value;
    }
    
    // 信號強度格式化（保留整數並加上單位）
    if (column === 'signal_strength') {
      return typeof value === 'number' ? `${Math.round(value)}dBm` : value;
    }
    
    // 高度格式化（保留2位小數並加上單位）
    if (column === 'altitude') {
      return typeof value === 'number' ? `${value.toFixed(2)}m` : value;
    }
    
    // 速度格式化（保留2位小數並加上單位）
    if (column === 'speed') {
      return typeof value === 'number' ? `${value.toFixed(2)}m/s` : value;
    }
    
    // 航向角度格式化（保留1位小數並加上單位）
    if (column === 'heading') {
      return typeof value === 'number' ? `${value.toFixed(1)}°` : value;
    }
    
    // 溫度格式化（保留1位小數並加上單位）
    if (column === 'temperature') {
      return typeof value === 'number' ? `${value.toFixed(1)}°C` : value;
    }
    
    // 濕度格式化（保留1位小數並加上百分比符號）
    if (column === 'humidity') {
      return typeof value === 'number' ? `${value.toFixed(1)}%` : value;
    }
    
    // 風速格式化（保留2位小數並加上單位）
    if (column === 'wind_speed') {
      return typeof value === 'number' ? `${value.toFixed(2)}m/s` : value;
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

  return (
    <div className={styles.tableContainer}>
      {/* 無人機狀態歷史歸檔數據表格 */}
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
          {sortedData.map((item: DroneStatusArchive, index: number) => (
            <tr key={item.id || index} className={styles.tableRow}>
              {columns.map((column) => (
                <td key={column} className={styles.tableCell}>
                  {formatValue(item[column as keyof DroneStatusArchive], column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};