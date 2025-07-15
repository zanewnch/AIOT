import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { 
  loadUserData, 
  updateUserData, 
  openEditModal, 
  closeEditModal, 
  updateEditingItem 
} from '../../../store/tableSlice';
import { addNotificationWithAutoRemove } from '../../../store/notificationSlice';
import styles from '../../../styles/TableViewer.module.scss';

export const UserTableView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    userData, 
    loading, 
    error, 
    editModal 
  } = useSelector((state: RootState) => state.table);

  useEffect(() => {
    dispatch(loadUserData());
  }, [dispatch]);

  // 處理編輯
  const handleEdit = (item: any) => {
    dispatch(openEditModal({ tableType: 'user', item }));
  };

  // 處理保存
  const handleSave = async () => {
    if (!editModal.editingItem) return;

    try {
      await dispatch(updateUserData({
        id: editModal.editingItem.id,
        data: {
          username: editModal.editingItem.username,
          email: editModal.editingItem.email
        }
      })).unwrap();

      dispatch(addNotificationWithAutoRemove({ type: 'success', message: '用戶已更新' }));
      dispatch(closeEditModal());
    } catch (error) {
      dispatch(addNotificationWithAutoRemove({ 
        type: 'error', 
        message: error instanceof Error ? error.message : '更新用戶時發生錯誤' 
      }));
    }
  };

  if (loading.user) {
    return <div className={styles.loading}>Loading user data...</div>;
  }

  if (error.user) {
    return <div className={styles.error}>Error: {error.user}</div>;
  }

  if (userData.length === 0) {
    return <div className={styles.noData}>No user data available</div>;
  }

  // 動態獲取表格欄位
  const columns = Object.keys(userData[0]);

  return (
    <div>
      {/* 表格 */}
      <table className={styles.table} style={{ '--row-count': userData.length } as React.CSSProperties}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
            <th>操作 (Actions)</th>
          </tr>
        </thead>
        <tbody>
          {userData.map((item, index) => (
            <tr key={item.id || index}>
              {columns.map((column) => (
                <td key={column}>
                  {typeof item[column] === 'object' && item[column] !== null
                    ? JSON.stringify(item[column])
                    : String(item[column] || '')
                  }
                </td>
              ))}
              <td>
                <button
                  className={styles.editButton}
                  onClick={() => handleEdit(item)}
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
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>編輯用戶</h3>
              <button
                className={styles.closeButton}
                onClick={() => dispatch(closeEditModal())}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>ID:</label>
                <input
                  type="text"
                  value={editModal.editingItem.id || ''}
                  disabled
                  className={styles.disabledInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>用戶名 (Username):</label>
                <input
                  type="text"
                  value={editModal.editingItem.username || ''}
                  onChange={(e) => dispatch(updateEditingItem({
                    ...editModal.editingItem,
                    username: e.target.value
                  }))}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>電子郵件 (Email):</label>
                <input
                  type="email"
                  value={editModal.editingItem.email || ''}
                  onChange={(e) => dispatch(updateEditingItem({
                    ...editModal.editingItem,
                    email: e.target.value
                  }))}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>密碼哈希 (Password Hash):</label>
                <input
                  type="text"
                  value={editModal.editingItem.passwordHash || ''}
                  disabled
                  className={styles.disabledInput}
                />
                <small>密碼哈希不可直接編輯</small>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => dispatch(closeEditModal())}
              >
                取消
              </button>
              <button
                className={styles.saveButton}
                onClick={handleSave}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};