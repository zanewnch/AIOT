import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { 
  loadPermissionData, 
  updatePermissionData, 
  openEditModal, 
  closeEditModal, 
  updateEditingItem 
} from '../../../store/tableSlice';
import { addNotificationWithAutoRemove } from '../../../store/notificationSlice';
import styles from '../../../styles/TableViewer.module.scss';

export const PermissionTableView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    permissionData, 
    loading, 
    error, 
    editModal 
  } = useSelector((state: RootState) => state.table);

  useEffect(() => {
    dispatch(loadPermissionData());
  }, [dispatch]);

  // 處理編輯
  const handleEdit = (item: any) => {
    dispatch(openEditModal({ tableType: 'permission', item }));
  };

  // 處理保存
  const handleSave = async () => {
    if (!editModal.editingItem) return;

    try {
      await dispatch(updatePermissionData({
        id: editModal.editingItem.id,
        data: {
          name: editModal.editingItem.name,
          description: editModal.editingItem.description
        }
      })).unwrap();

      dispatch(addNotificationWithAutoRemove({ type: 'success', message: '權限已更新' }));
      dispatch(closeEditModal());
    } catch (error) {
      dispatch(addNotificationWithAutoRemove({ 
        type: 'error', 
        message: error instanceof Error ? error.message : '更新權限時發生錯誤' 
      }));
    }
  };

  if (loading.permission) {
    return <div className={styles.loading}>Loading permission data...</div>;
  }

  if (error.permission) {
    return <div className={styles.error}>Error: {error.permission}</div>;
  }

  if (permissionData.length === 0) {
    return <div className={styles.noData}>No permission data available</div>;
  }

  // 動態獲取表格欄位
  const columns = Object.keys(permissionData[0]);

  return (
    <div>
      {/* 表格 */}
      <table className={styles.table} style={{ '--row-count': permissionData.length } as React.CSSProperties}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
            <th>操作 (Actions)</th>
          </tr>
        </thead>
        <tbody>
          {permissionData.map((item, index) => (
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
      {editModal.isOpen && editModal.tableType === 'permission' && editModal.editingItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>編輯權限</h3>
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
                <label>描述 (Description):</label>
                <textarea
                  value={editModal.editingItem.description || ''}
                  onChange={(e) => dispatch(updateEditingItem({
                    ...editModal.editingItem,
                    description: e.target.value
                  }))}
                  className={styles.input}
                  rows={3}
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