import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { 
  loadRoleData, 
  updateRoleData, 
  openEditModal, 
  closeEditModal, 
  updateEditingItem 
} from '../../../store/tableSlice';
import { addNotificationWithAutoRemove } from '../../../store/notificationSlice';
import styles from '../../../styles/TableViewer.module.scss';

export const RoleTableView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    roleData, 
    loading, 
    error, 
    editModal 
  } = useSelector((state: RootState) => state.table);

  useEffect(() => {
    dispatch(loadRoleData());
  }, [dispatch]);

  // 處理編輯
  const handleEdit = (item: any) => {
    dispatch(openEditModal({ tableType: 'role', item }));
  };

  // 處理保存
  const handleSave = async () => {
    if (!editModal.editingItem) return;

    try {
      await dispatch(updateRoleData({
        id: editModal.editingItem.id,
        data: {
          name: editModal.editingItem.name,
          displayName: editModal.editingItem.displayName
        }
      })).unwrap();

      dispatch(addNotificationWithAutoRemove({ type: 'success', message: '角色已更新' }));
      dispatch(closeEditModal());
    } catch (error) {
      dispatch(addNotificationWithAutoRemove({ 
        type: 'error', 
        message: error instanceof Error ? error.message : '更新角色時發生錯誤' 
      }));
    }
  };

  if (loading.role) {
    return <div className={styles.loading}>Loading role data...</div>;
  }

  if (error.role) {
    return <div className={styles.error}>Error: {error.role}</div>;
  }

  if (roleData.length === 0) {
    return <div className={styles.noData}>No role data available</div>;
  }

  // 動態獲取表格欄位
  const columns = Object.keys(roleData[0]);

  return (
    <div>
      {/* 表格 */}
      <table className={styles.table} style={{ '--row-count': roleData.length } as React.CSSProperties}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
            <th>操作 (Actions)</th>
          </tr>
        </thead>
        <tbody>
          {roleData.map((item, index) => (
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
      {editModal.isOpen && editModal.tableType === 'role' && editModal.editingItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>編輯角色</h3>
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
                <label>名稱 (Name):</label>
                <input
                  type="text"
                  value={editModal.editingItem.name || ''}
                  onChange={(e) => dispatch(updateEditingItem({
                    ...editModal.editingItem,
                    name: e.target.value
                  }))}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>顯示名稱 (Display Name):</label>
                <input
                  type="text"
                  value={editModal.editingItem.displayName || ''}
                  onChange={(e) => dispatch(updateEditingItem({
                    ...editModal.editingItem,
                    displayName: e.target.value
                  }))}
                  className={styles.input}
                />
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