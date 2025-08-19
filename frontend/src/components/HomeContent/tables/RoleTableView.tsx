/**
 * @fileoverview 角色表格視圖組件
 * 
 * 此組件提供角色管理的表格視圖功能，包括：
 * - 角色數據的顯示和載入
 * - 角色編輯模態框
 * - 角色數據的更新操作
 * - 錯誤處理和通知提示
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React from 'react';
import { RoleQuery } from '../../../hooks/useRoleQuery';
import { useTableUIStore } from '../../../stores/tableStore';
import LoadingSpinner from '../../common/LoadingSpinner';
import { createLogger } from '../../../configs/loggerConfig';
import styles from '../../../styles/TableViewer.module.scss';

const logger = createLogger('RoleTableView');

/**
 * 角色表格視圖組件
 * 
 * 此組件負責顯示角色數據的表格視圖，提供角色的查看和編輯功能。
 * 包含動態表格渲染、載入狀態管理、錯誤處理等功能。
 */
export const RoleTableView: React.FC = () => {
  // React Query hooks for data
  const roleQuery = new RoleQuery();
  const { data: roleData, isLoading, error, refetch } = roleQuery.useRoleData();
  const updateRoleMutation = roleQuery.useUpdateRoleData();
  
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
   * 處理角色編輯操作
   */
  const handleEdit = (item: any) => {
    logger.info('開始編輯角色', { roleId: item?.id, roleName: item?.name, operation: 'edit' });
    openEditModal('role', item);
  };

  /**
   * 處理角色保存操作
   */
  const handleSave = async () => {
    if (!editModal.editingItem) return;

    const roleId = editModal.editingItem.id;
    const roleName = editModal.editingItem.name;
    
    logger.info('開始保存角色', { roleId, roleName, operation: 'save' });

    try {
      await updateRoleMutation.mutateAsync({
        id: editModal.editingItem.id,
        data: editModal.editingItem
      });
      
      logger.info('角色保存成功', { roleId, roleName, operation: 'save_success' });
      closeEditModal();
      refetch();
    } catch (error) {
      logger.error('角色保存失敗', { roleId, roleName, error: (error as Error).message, operation: 'save_error' });
    }
  };

  /**
   * 處理輸入值變更
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
   */
  const handleSort = (field: string) => {
    logger.debug('角色表格排序', { field, currentOrder: sorting.order, operation: 'sort' });
    toggleSortOrder(field as any);
  };

  /**
   * 排序數據
   */
  const sortedData = React.useMemo(() => {
    if (!roleData) return [];
    
    const sorted = [...roleData];
    sorted.sort((a, b) => {
      const field = sorting.field as keyof typeof a;
      const aValue = a[field];
      const bValue = b[field];
      
      if (aValue < bValue) return sorting.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sorting.order === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [roleData, sorting]);

  // 載入狀態檢查
  if (isLoading) {
    return <LoadingSpinner message="載入角色數據中..." />;
  }

  // 錯誤狀態檢查
  if (error) {
    return (
      <div className={styles.error}>
        <span>載入角色數據時發生錯誤: {(error as Error).message}</span>
        <button onClick={() => {
          logger.info('重新載入角色數據', { operation: 'retry' });
          refetch();
        }} className={styles.retryButton}>
          重試
        </button>
      </div>
    );
  }

  // 空資料檢查
  if (!roleData || roleData.length === 0) {
    return (
      <div className={styles.noData}>
        <span>目前沒有角色數據</span>
        <button onClick={() => {
          logger.info('刷新角色數據', { operation: 'refresh' });
          refetch();
        }} className={styles.refreshButton}>
          重新載入
        </button>
      </div>
    );
  }

  // 動態獲取表格欄位
  const columns = Object.keys(roleData[0]);

  return (
    <div className={styles.tableContainer}>
      {/* 角色數據表格 */}
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
      {editModal.isOpen && editModal.tableType === 'role' && editModal.editingItem && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>編輯角色</h3>
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
                disabled={updateRoleMutation.isPending}
              >
                {updateRoleMutation.isPending ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};