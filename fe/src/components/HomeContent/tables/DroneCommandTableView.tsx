/**
 * @fileoverview 無人機指令表格視圖組件
 * 
 * 此組件提供無人機指令的表格視圖功能，包括：
 * - 無人機指令數據的顯示和載入
 * - 指令狀態的動態表格渲染
 * - 錯誤處理和載入狀態管理
 * - 指令執行進度和時間的顯示
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React from 'react';
import { DroneCommandQuery } from '../../../hooks/useDroneCommandQuery';
import { useTableUIStore } from '../../../stores/tableStore';
import LoadingSpinner from '../../common/LoadingSpinner';
import { createLogger } from '../../../configs/loggerConfig';
import styles from '../../../styles/TableViewer.module.scss';

const logger = createLogger('DroneCommandTableView');

/**
 * 無人機指令表格視圖組件
 * 
 * 此組件負責顯示無人機指令的表格視圖，提供指令數據的查看功能。
 * 包含動態表格渲染、載入狀態管理、錯誤處理等功能。
 */
export const DroneCommandTableView: React.FC = () => {
  // React Query hooks for data
  const droneCommandQuery = new DroneCommandQuery();
  const { data: droneCommandData, isLoading, error, refetch } = droneCommandQuery.useAllDroneCommands();
  
  // Zustand stores for UI state
  const { sorting, toggleSortOrder } = useTableUIStore();

  /**
   * 處理排序
   */
  const handleSort = (field: string) => {
    logger.debug('無人機指令表格排序', { field, currentOrder: sorting.order, operation: 'sort' });
    toggleSortOrder(field as any);
  };

  /**
   * 排序數據
   */
  const sortedData = React.useMemo(() => {
    if (!droneCommandData) return [];
    
    const sorted = [...droneCommandData];
    sorted.sort((a, b) => {
      const aValue = a[sorting.field as keyof typeof a];
      const bValue = b[sorting.field as keyof typeof b];
      
      if (aValue < bValue) return sorting.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sorting.order === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [droneCommandData, sorting]);

  // 載入狀態檢查
  if (isLoading) {
    return <LoadingSpinner message="載入無人機指令數據中..." />;
  }

  // 錯誤狀態檢查
  if (error) {
    return (
      <div className={styles.error}>
        <span>載入無人機指令數據時發生錯誤: {(error as Error).message}</span>
        <button onClick={() => {
          logger.info('重新載入無人機指令數據', { operation: 'retry' });
          refetch();
        }} className={styles.retryButton}>
          重試
        </button>
      </div>
    );
  }

  // 空資料檢查
  if (!droneCommandData || droneCommandData.length === 0) {
    return (
      <div className={styles.noData}>
        <span>目前沒有無人機指令數據</span>
        <button onClick={() => {
          logger.info('刷新無人機指令數據', { operation: 'refresh' });
          refetch();
        }} className={styles.refreshButton}>
          重新載入
        </button>
      </div>
    );
  }

  // 動態獲取表格欄位
  const columns = Object.keys(droneCommandData[0]);

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
    
    // JSON 物件格式化
    if (typeof value === 'object' && value !== null) {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    
    // 數字格式化
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    // 布林值格式化
    if (typeof value === 'boolean') {
      return value ? '是' : '否';
    }
    
    // 狀態值中文化
    if (column === 'status') {
      const statusMap: { [key: string]: string } = {
        'pending': '待執行',
        'executing': '執行中',
        'completed': '已完成',
        'failed': '執行失敗',
        'cancelled': '已取消'
      };
      return statusMap[value] || value;
    }
    
    // 指令類型中文化
    if (column === 'commandType') {
      const typeMap: { [key: string]: string } = {
        'takeoff': '起飛',
        'land': '降落',
        'move': '移動',
        'hover': '懸停',
        'return': '返航'
      };
      return typeMap[value] || value;
    }
    
    return String(value);
  };

  return (
    <div className={styles.tableContainer}>
      {/* 無人機指令數據表格 */}
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