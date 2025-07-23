/**
 * @fileoverview 用戶表格視圖組件
 * 
 * 此組件提供用戶管理的表格視圖功能，包括：
 * - 用戶數據的顯示和載入
 * - 用戶編輯模態框
 * - 用戶數據的更新操作
 * - 錯誤處理和通知提示
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React from 'react';
import { useUserData, useUpdateUserData } from '../../../hooks/useTableQuery';
import { useTableUIStore } from '../../../stores/tableStore';
import { useNotificationStore } from '../../../stores/notificationStore';
import LoadingSpinner from '../../common/LoadingSpinner';
import styles from '../../../styles/TableViewer.module.scss';

/**
 * 用戶表格視圖組件
 * 
 * 此組件負責顯示用戶數據的表格視圖，提供用戶的查看和編輯功能。
 * 包含動態表格渲染、載入狀態管理、錯誤處理等功能。
 */
export const UserTableView: React.FC = () => {
  // React Query hooks for data
  const { data: userData, isLoading, error, refetch } = useUserData();
  const updateUserMutation = useUpdateUserData();
  
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
  const { addSuccess, addError } = useNotificationStore();

  /**
   * 處理用戶編輯操作
   */
  const handleEdit = (item: any) => {
    openEditModal('user', item);
  };

  /**
   * 處理用戶保存操作
   */
  const handleSave = async () => {
    if (!editModal.editingItem) return;

    try {
      await updateUserMutation.mutateAsync({
        id: editModal.editingItem.id,
        data: editModal.editingItem
      });
      
      addSuccess('用戶更新成功');
      closeEditModal();
      refetch();
    } catch (error) {
      addError('用戶更新失敗: ' + (error as Error).message);
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
    toggleSortOrder(field as any);
  };

  /**
   * 排序數據
   */
  const sortedData = React.useMemo(() => {
    if (!userData) return [];
    
    const sorted = [...userData];
    sorted.sort((a, b) => {
      const aValue = a[sorting.field];
      const bValue = b[sorting.field];
      
      if (aValue < bValue) return sorting.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sorting.order === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [userData, sorting]);

  // 載入狀態檢查
  if (isLoading) {
    return <LoadingSpinner message="載入用戶數據中..." />;
  }

  // 錯誤狀態檢查
  if (error) {
    return (
      <div className={styles.error}>
        <span>載入用戶數據時發生錯誤: {(error as Error).message}</span>
        <button onClick={() => refetch()} className={styles.retryButton}>
          重試
        </button>
      </div>
    );
  }

  // 空資料檢查
  if (!userData || userData.length === 0) {
    return (
      <div className={styles.noData}>
        <span>目前沒有用戶數據</span>
        <button onClick={() => refetch()} className={styles.refreshButton}>
          重新載入
        </button>
      </div>
    );
  }

  // 動態獲取表格欄位
  const columns = Object.keys(userData[0]);

  return (
    <div className={styles.tableContainer}>
      {/* 用戶數據表格 */}
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
                  {/* 隱藏密碼欄位 */}
                  {column.toLowerCase().includes('password') ? '••••••••' : item[column]}
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
      {editModal.isOpen && editModal.tableType === 'user' && editModal.editingItem && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>編輯用戶</h3>
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
                    type={field.toLowerCase().includes('password') ? 'password' : 'text'}
                    value={editModal.editingItem[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className={styles.input}
                    placeholder={field.toLowerCase().includes('password') ? '請輸入新密碼（留空保持不變）' : ''}
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
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};