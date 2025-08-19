/**
 * @fileoverview 權限表格視圖組件
 *
 * 此組件提供權限管理的表格視圖功能，包括：
 * - 權限數據的顯示和載入
 * - 權限編輯模態框
 * - 權限數據的更新操作
 * - 錯誤處理和通知提示
 *
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React from 'react';
import { PermissionQuery } from '../../hooks/usePermissionQuery';
import { useTableUIStore } from '../../stores/tableStore';
import LoadingSpinner from '../common/LoadingSpinner';
import { createLogger } from '../../configs/loggerConfig';
import styles from '../../styles/TableViewer.module.scss';

const logger = createLogger('PermissionTableView');

/**
 * 權限表格視圖組件
 *
 * 此組件負責顯示權限數據的表格視圖，提供權限的查看和編輯功能。
 * 包含動態表格渲染、載入狀態管理、錯誤處理等功能。
 *
 * @returns 權限表格視圖的 JSX 元素
 *
 * @example
 * ```tsx
 * import { PermissionTableView } from './PermissionTableView';
 *
 * function App() {
 *   return <PermissionTableView />;
 * }
 * ```
 */
export const PermissionTableView: React.FC = () => {
  // React Query hooks for data
  const permissionQuery = new PermissionQuery();
  const { data: permissionData, isLoading, error, refetch } = permissionQuery.useAllPermissionData();
  const updatePermissionMutation = permissionQuery.useUpdatePermissionData();

  // Zustand stores for UI state
  const {
    editModal,
    sorting,
    openEditModal,
    closeEditModal,
    updateEditingItem,
    toggleSortOrder
  } = useTableUIStore();

  // Notification store

  /**
   * 處理權限編輯操作
   *
   * @param item - 要編輯的權限項目
   */
  const handleEdit = (item: any) => {
    logger.info('開始編輯權限', { permissionId: item?.id, permissionName: item?.name });
    openEditModal('permission', item);
  };

  /**
   * 處理權限保存操作
   */
  const handleSave = async () => {
    if (!editModal.editingItem) return;

    logger.info('開始保存權限', { permissionId: editModal.editingItem.id });

    try {
      await updatePermissionMutation.mutateAsync({
        id: editModal.editingItem.id,
        data: editModal.editingItem
      });

      logger.info('權限更新成功', { permissionId: editModal.editingItem.id });
      closeEditModal();
      refetch();
    } catch (error) {
      logger.error('權限更新失敗', {
        permissionId: editModal.editingItem.id,
        error: (error as Error).message
      });
    }
  };

  /**
   * 處理輸入值變更
   *
   * @param field - 欄位名稱
   * @param value - 新值
   */
  const handleInputChange = (field: string, value: any) => {
    if (!editModal.editingItem) return;

    const updatedItem = {
      ...editModal.editingItem,
      [field]: value
    };
    updateEditingItem(updatedItem);
  };

  /**
   * 處理排序
   *
   * @param field - 排序欄位
   */
  const handleSort = (field: string) => {
    logger.debug('權限表格排序', { field, currentOrder: sorting.order });
    toggleSortOrder(field as any);
  };

  /**
   * 排序數據
   */
  const sortedData = React.useMemo(() => {
    if (!permissionData) return [];

    const sorted = [...permissionData];
    sorted.sort((a, b) => {
      const field = sorting.field as keyof typeof a;
      const aValue = a[field];
      const bValue = b[field];

      if (aValue < bValue) return sorting.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sorting.order === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [permissionData, sorting]);

  // 載入狀態檢查
  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  // 錯誤狀態檢查
  if (error) {
    return (
      <div className={styles.error}>
        <span>載入權限數據時發生錯誤: {(error as Error).message}</span>
        <button onClick={() => refetch()} className={styles.retryButton}>
          重試
        </button>
      </div>
    );
  }

  // 空資料檢查
  if (!permissionData || permissionData.length === 0) {
    return (
      <div className={styles.noData}>
        <span>目前沒有權限數據</span>
        <button onClick={() => refetch()} className={styles.refreshButton}>
          重新載入
        </button>
      </div>
    );
  }

  // 動態獲取表格欄位
  const columns = Object.keys(permissionData[0]);

  return (
    <div className={styles.tableContainer}>
      {/* 權限數據表格 */}
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
            <th className={styles.actions}>操作</th>
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
              <td className={styles.tableCell}>
                <button
                  onClick={() => handleEdit(item)}
                  className={styles.editButton}
                >
                  編輯
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 編輯模態框 */}
      {editModal.isOpen && editModal.tableType === 'permission' && editModal.editingItem && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>編輯權限</h3>
              <button
                onClick={closeEditModal}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              {columns.map((field) => (
                <div key={field} className={styles.inputGroup}>
                  <label htmlFor={field}>{field}:</label>
                  <input
                    id={field}
                    type="text"
                    value={editModal.editingItem[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className={styles.input}
                  />
                </div>
              ))}
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={closeEditModal}
                className={styles.cancelButton}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className={styles.saveButton}
                disabled={updatePermissionMutation.isPending}
              >
                {updatePermissionMutation.isPending ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};