/**
 * @fileoverview 用戶角色關聯表格視圖組件
 * 
 * 此組件提供用戶與角色關聯關係的表格視圖功能，包括：
 * - 用戶角色關聯數據的顯示和載入
 * - 關聯關係的動態表格渲染
 * - 錯誤處理和載入狀態管理
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React from 'react';
import { UserQuery } from '../../../hooks/useUserQuery';
import { useTableUIStore } from '../../../stores/tableStore';
import LoadingSpinner from '../../common/LoadingSpinner';
import { createLogger } from '../../../configs/loggerConfig';
import styles from '../../../styles/TableViewer.module.scss';

const logger = createLogger('UserToRoleTableView');

/**
 * 用戶角色關聯表格視圖組件
 * 
 * 此組件負責顯示用戶與角色關聯關係的表格視圖，提供關聯數據的查看功能。
 * 包含動態表格渲染、載入狀態管理、錯誤處理等功能。
 */
export const UserToRoleTableView: React.FC = () => {
  // React Query hooks for data
  const userQuery = new UserQuery();
  const { data: userToRoleData, isLoading, error, refetch } = userQuery.useUserRoles();
  
  // Zustand stores for UI state
  const { sorting, toggleSortOrder } = useTableUIStore();

  /**
   * 處理排序
   */
  const handleSort = (field: string) => {
    logger.debug('用戶角色關聯表格排序', { field, currentOrder: sorting.order, operation: 'sort' });
    toggleSortOrder(field as any);
  };

  /**
   * 排序數據
   */
  const sortedData = React.useMemo(() => {
    if (!userToRoleData) return [];
    
    const sorted = [...userToRoleData];
    sorted.sort((a, b) => {
      const field = sorting.field as keyof typeof a;
      const aValue = a[field];
      const bValue = b[field];
      
      if (aValue < bValue) return sorting.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sorting.order === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [userToRoleData, sorting]);

  // 載入狀態檢查
  if (isLoading) {
    return <LoadingSpinner message="載入用戶角色關聯數據中..." />;
  }

  // 錯誤狀態檢查
  if (error) {
    return (
      <div className={styles.error}>
        <span>載入用戶角色關聯數據時發生錯誤: {(error as Error).message}</span>
        <button onClick={() => {
          logger.info('重新載入用戶角色關聯數據', { operation: 'retry' });
          refetch();
        }} className={styles.retryButton}>
          重試
        </button>
      </div>
    );
  }

  // 空資料檢查
  if (!userToRoleData || userToRoleData.length === 0) {
    return (
      <div className={styles.noData}>
        <span>目前沒有用戶角色關聯數據</span>
        <button onClick={() => {
          logger.info('刷新用戶角色關聯數據', { operation: 'refresh' });
          refetch();
        }} className={styles.refreshButton}>
          重新載入
        </button>
      </div>
    );
  }

  // 動態獲取表格欄位
  const columns = Object.keys(userToRoleData[0]);

  return (
    <div className={styles.tableContainer}>
      {/* 用戶角色關聯數據表格 */}
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
                  {item[column]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};