/**
 * @fileoverview 無人機指令歷史歸檔表格視圖組件
 * 
 * 此組件提供無人機指令歷史歸檔的表格視圖功能，包括：
 * - 歸檔指令數據的顯示和載入
 * - 歷史指令狀態的動態表格渲染
 * - 錯誤處理和載入狀態管理
 * - 指令執行分析和批次歸檔追蹤
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React from 'react';
import { useTableUIStore } from '../../../stores/tableStore';
import LoadingSpinner from '../../common/LoadingSpinner';
import { createLogger } from '../../../configs/loggerConfig';
import { useGetAllCommandsArchive, type DroneCommandArchive } from '../../../hooks/useDroneCommandArchiveQuery';
import styles from '../../../styles/TableViewer.module.scss';

const logger = createLogger('DroneCommandsArchiveTableView');

// 使用導入的 DroneCommandArchive 類型，移除本地重複定義

// 移除自定義 fetch 函數，使用現有的 React Query hook

/**
 * 無人機指令歷史歸檔表格視圖組件
 * 
 * 此組件負責顯示無人機指令歷史歸檔的表格視圖，提供歸檔指令數據的查看功能。
 * 包含動態表格渲染、載入狀態管理、錯誤處理等功能。
 */
export const DroneCommandsArchiveTableView: React.FC = () => {
  // 使用現有的 React Query hook
  const { data: droneCommandsArchiveData, isLoading, error, refetch } = useGetAllCommandsArchive({
    limit: 100, // 分頁參數：限制數量
    sortBy: 'issued_at', // 排序欄位  
    sortOrder: 'DESC' // 排序方向
  });
  
  // Zustand stores for UI state
  const { sorting, toggleSortOrder } = useTableUIStore();

  /**
   * 處理排序
   */
  const handleSort = (field: string) => {
    logger.debug('無人機指令歷史歸檔表格排序', { field, currentOrder: sorting.order, operation: 'sort' });
    toggleSortOrder(field as any);
  };

  /**
   * 排序數據
   */
  const sortedData = React.useMemo(() => {
    if (!droneCommandsArchiveData) return [];
    
    const sorted = [...droneCommandsArchiveData];
    sorted.sort((a, b) => {
      const aValue = a[sorting.field as keyof DroneCommandArchive];
      const bValue = b[sorting.field as keyof DroneCommandArchive];
      
      if (aValue < bValue) return sorting.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sorting.order === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [droneCommandsArchiveData, sorting]);

  // 載入狀態檢查
  if (isLoading) {
    return <LoadingSpinner message="載入無人機指令歷史歸檔數據中..." />;
  }

  // 錯誤狀態檢查
  if (error) {
    return (
      <div className={styles.error}>
        <span>載入無人機指令歷史歸檔數據時發生錯誤: {(error as Error).message}</span>
        <button onClick={() => {
          logger.info('重新載入無人機指令歷史歸檔數據', { operation: 'retry' });
          refetch();
        }} className={styles.retryButton}>
          重試
        </button>
      </div>
    );
  }

  // 空資料檢查
  if (!droneCommandsArchiveData || droneCommandsArchiveData.length === 0) {
    return (
      <div className={styles.noData}>
        <span>目前沒有無人機指令歷史歸檔數據</span>
        <button onClick={() => {
          logger.info('刷新無人機指令歷史歸檔數據', { operation: 'refresh' });
          refetch();
        }} className={styles.refreshButton}>
          重新載入
        </button>
      </div>
    );
  }

  // 動態獲取表格欄位
  const columns = Object.keys(droneCommandsArchiveData[0]);

  /**
   * 格式化欄位值以便顯示
   */
  const formatValue = (value: any, column: string): string => {
    if (value === null || value === undefined) return '-';
    
    // 日期格式化
    if (column.includes('_at') || column.includes('At')) {
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
    if (column === 'command_type') {
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
      {/* 無人機指令歷史歸檔數據表格 */}
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
          {sortedData.map((item: DroneCommandArchive, index: number) => (
            <tr key={item.id || index} className={styles.tableRow}>
              {columns.map((column) => (
                <td key={column} className={styles.tableCell}>
                  {formatValue(item[column as keyof DroneCommandArchive], column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};