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
import { UserQuery } from '../../../hooks/useUserQuery';
import { useOptimisticUser, useQuickUserActions } from '../../../hooks/useOptimisticUser';
import { useTableUIStore } from '../../../stores/tableStore';
import { useNotificationStore } from '../../../stores/notificationStore';
import LoadingSpinner from '../../common/LoadingSpinner';
import { createLogger } from '../../../configs/loggerConfig';
import styles from '../../../styles/TableViewer.module.scss';

const logger = createLogger('UserTableView');

/**
 * 用戶表格視圖組件
 * 
 * 此組件負責顯示用戶數據的表格視圖，提供用戶的查看和編輯功能。
 * 包含動態表格渲染、載入狀態管理、錯誤處理等功能。
 */
export const UserTableView: React.FC = () => {
  // React Query hooks for data
  const userQuery = new UserQuery();
  const { data: userData, isLoading, error, refetch } = userQuery.useRbacUsers();
  
  // 🚀 樂觀更新 hooks
  const { updateUser, isUserUpdating, getUserOptimisticData } = useOptimisticUser();
  const { toggleUserStatus, updateProfile, isUpdating } = useQuickUserActions();
  
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
    logger.info('開始編輯用戶', { userId: item?.id, username: item?.username || item?.name, operation: 'edit' });
    openEditModal('user', item);
  };

  /**
   * 處理用戶保存操作 - 🚀 使用樂觀更新
   */
  const handleSave = async () => {
    if (!editModal.editingItem) return;

    const userId = editModal.editingItem.id;
    const username = editModal.editingItem.username || editModal.editingItem.name;
    
    logger.info('開始保存用戶（樂觀更新）', { userId, username, operation: 'optimistic_save' });

    try {
      // 🚀 使用樂觀更新，立即關閉模態框並顯示更新
      closeEditModal();
      
      // 執行樂觀更新
      await updateProfile(userId, editModal.editingItem);
      
      logger.info('用戶樂觀更新成功', { userId, username, operation: 'optimistic_save_success' });
    } catch (error) {
      // 錯誤處理已在 useOptimisticUser hook 中處理
      logger.error('用戶樂觀更新失敗', { userId, username, error: (error as Error).message, operation: 'optimistic_save_error' });
      // 重新打開模態框讓用戶再次嘗試
      openEditModal('user', editModal.editingItem);
    }
  };

  /**
   * 🚀 處理用戶狀態快速切換（樂觀更新）
   */
  const handleStatusToggle = async (user: any) => {
    const userId = user.id;
    const currentStatus = user.is_active || user.active || false;
    
    logger.info('切換用戶狀態（樂觀更新）', { 
      userId, 
      currentStatus, 
      newStatus: !currentStatus,
      operation: 'optimistic_status_toggle' 
    });

    try {
      await toggleUserStatus(userId, currentStatus);
    } catch (error) {
      logger.error('用戶狀態切換失敗', { userId, error: (error as Error).message });
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
    logger.debug('用戶表格排序', { field, currentOrder: sorting.order, operation: 'sort' });
    toggleSortOrder(field as any);
  };

  /**
   * 排序數據 - 🚀 包含樂觀更新數據
   */
  const sortedData = React.useMemo(() => {
    if (!userData) return [];
    
    // 合併樂觀更新的數據
    const dataWithOptimisticUpdates = userData.map(user => {
      const optimisticData = getUserOptimisticData(user.id);
      const isUpdating = isUserUpdating(user.id);
      
      return {
        ...user,
        ...optimisticData,
        _isUpdating: isUpdating, // 添加更新狀態標記
        _optimisticData: optimisticData, // 添加樂觀數據標記
      };
    });
    
    const sorted = [...dataWithOptimisticUpdates];
    sorted.sort((a, b) => {
      const field = sorting.field as keyof typeof a;
      const aValue = a[field];
      const bValue = b[field];
      
      if (aValue < bValue) return sorting.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sorting.order === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [userData, sorting, getUserOptimisticData, isUserUpdating]);

  // 載入狀態檢查
  if (isLoading) {
    return <LoadingSpinner message="載入用戶數據中..." />;
  }

  // 錯誤狀態檢查
  if (error) {
    return (
      <div className={styles.error}>
        <span>載入用戶數據時發生錯誤: {(error as Error).message}</span>
        <button onClick={() => {
          logger.info('重新載入用戶數據', { operation: 'retry' });
          refetch();
        }} className={styles.retryButton}>
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
        <button onClick={() => {
          logger.info('刷新用戶數據', { operation: 'refresh' });
          refetch();
        }} className={styles.refreshButton}>
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
            <tr 
              key={item.id || index} 
              className={`${styles.tableRow} ${
                item._isUpdating ? styles.updating : ''
              } ${
                item._optimisticData ? styles.optimistic : ''
              }`}
            >
              {columns.map((column) => (
                <td key={column} className={styles.tableCell}>
                  {/* 特殊處理不同類型的欄位 */}
                  {column.toLowerCase().includes('password') ? (
                    '••••••••'
                  ) : column === 'is_active' || column === 'active' ? (
                    <div className="flex items-center gap-2">
                      {/* 🚀 狀態快速切換按鈕 */}
                      <button
                        onClick={() => handleStatusToggle(item)}
                        disabled={item._isUpdating}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                          item[column]
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } ${
                          item._isUpdating 
                            ? 'opacity-60 cursor-not-allowed animate-pulse' 
                            : 'hover:scale-105 cursor-pointer'
                        }`}
                        title={`點擊切換到 ${item[column] ? '停用' : '啟用'} 狀態`}
                      >
                        {item._isUpdating ? (
                          <>
                            <div className="inline-block w-3 h-3 mr-1 border border-current border-t-transparent rounded-full animate-spin"></div>
                            更新中
                          </>
                        ) : item[column] ? (
                          '✅ 啟用'
                        ) : (
                          '❌ 停用'
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className={`${item._optimisticData && item._optimisticData[column] ? 'bg-blue-50 px-2 py-1 rounded' : ''}`}>
                      {item[column]}
                      {/* 樂觀更新指示器 */}
                      {item._optimisticData && item._optimisticData[column] && (
                        <span className="ml-2 text-xs text-blue-600" title="樂觀更新中">
                          ⚡
                        </span>
                      )}
                    </div>
                  )}
                </td>
              ))}
              <td className={styles.tableCell}>
                <div className="flex gap-2">
                  {/* 編輯按鈕 */}
                  <button 
                    onClick={() => handleEdit(item)}
                    disabled={item._isUpdating}
                    className={`${styles.editButton} ${
                      item._isUpdating 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-blue-600 hover:scale-105'
                    } transition-all duration-200`}
                  >
                    {item._isUpdating ? '更新中...' : '編輯'}
                  </button>

                  {/* 🚀 快速操作按鈕組 */}
                  {!item._isUpdating && (
                    <>
                      {/* 快速啟用/停用按鈕 */}
                      <button
                        onClick={() => handleStatusToggle(item)}
                        className={`px-2 py-1 text-xs rounded font-medium transition-all duration-200 ${
                          item.is_active || item.active
                            ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        } hover:scale-105`}
                        title={`快速${item.is_active || item.active ? '停用' : '啟用'}用戶`}
                      >
                        {item.is_active || item.active ? '停用' : '啟用'}
                      </button>
                    </>
                  )}
                </div>
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
                className={`${styles.saveButton} ${
                  isUserUpdating(editModal.editingItem?.id) 
                    ? 'opacity-75 transform scale-95' 
                    : 'hover:scale-105'
                } transition-all duration-200`}
                disabled={isUserUpdating(editModal.editingItem?.id)}
              >
                {isUserUpdating(editModal.editingItem?.id) ? (
                  <>
                    <div className="inline-block w-4 h-4 mr-2 border border-current border-t-transparent rounded-full animate-spin"></div>
                    🚀 樂觀更新中...
                  </>
                ) : (
                  '💾 立即保存'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};