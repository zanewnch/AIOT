/**
 * @fileoverview 歸檔任務表格視圖組件
 * 
 * 此組件提供歸檔任務的表格視圖功能，包括：
 * - 歸檔任務數據的顯示和載入
 * - 任務狀態的動態表格渲染
 * - 錯誤處理和載入狀態管理
 * - 任務進度和執行時間的顯示
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React from 'react';
import { useTableUIStore } from '../../../stores/tableStore';
import LoadingSpinner from '../../common/LoadingSpinner';
import { createLogger } from '../../../configs/loggerConfig';
import styles from '../../../styles/TableViewer.module.scss';
import { ArchiveTaskQuery } from '../../../hooks/useArchiveTaskQuery';
import { ArchiveTask } from '../../../types/archiveTask';

const logger = createLogger('ArchiveTaskTableView');

/**
 * 歸檔任務表格視圖組件
 * 
 * 此組件負責顯示歸檔任務的表格視圖，提供任務數據的查看功能。
 * 包含動態表格渲染、載入狀態管理、錯誤處理等功能。
 */
export const ArchiveTaskTableView: React.FC = () => {
  // React Query hooks for data
  const archiveTaskQuery = new ArchiveTaskQuery();
  const { data: archiveTaskData, isLoading, error, refetch } = archiveTaskQuery.useArchiveTasksData();
  
  // Zustand stores for UI state
  const { sorting, toggleSortOrder } = useTableUIStore();

  /**
   * 處理排序
   */
  const handleSort = (field: string) => {
    logger.debug('歸檔任務表格排序', { field, currentOrder: sorting.order, operation: 'sort' });
    toggleSortOrder(field as any);
  };

  /**
   * 排序數據
   */
  const sortedData = React.useMemo(() => {
    if (!archiveTaskData) return [];
    
    const sorted = [...archiveTaskData];
    sorted.sort((a, b) => {
      const aValue = a[sorting.field as keyof ArchiveTask];
      const bValue = b[sorting.field as keyof ArchiveTask];
      
      // 處理 null/undefined 值
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sorting.order === 'asc' ? 1 : -1;
      if (bValue == null) return sorting.order === 'asc' ? -1 : 1;
      
      if (aValue < bValue) return sorting.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sorting.order === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [archiveTaskData, sorting]);

  // 載入狀態檢查
  if (isLoading) {
    return <LoadingSpinner message="載入歸檔任務數據中..." />;
  }

  // 錯誤狀態檢查
  if (error) {
    return (
      <div className={styles.error}>
        <span>載入歸檔任務數據時發生錯誤: {(error as Error).message}</span>
        <button onClick={() => {
          logger.info('重新載入歸檔任務數據', { operation: 'retry' });
          refetch();
        }} className={styles.retryButton}>
          重試
        </button>
      </div>
    );
  }

  // 空資料檢查
  if (!archiveTaskData || archiveTaskData.length === 0) {
    return (
      <div className={styles.noData}>
        <span>目前沒有歸檔任務數據</span>
        <button onClick={() => {
          logger.info('刷新歸檔任務數據', { operation: 'refresh' });
          refetch();
        }} className={styles.refreshButton}>
          重新載入
        </button>
      </div>
    );
  }

  // 動態獲取表格欄位
  const columns = Object.keys(archiveTaskData[0]);

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
      {/* 歸檔任務數據表格 */}
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
          {sortedData.map((item: ArchiveTask, index: number) => (
            <tr key={item.id || index} className={styles.tableRow}>
              {columns.map((column) => (
                <td key={column} className={styles.tableCell}>
                  {formatValue(item[column as keyof ArchiveTask], column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};