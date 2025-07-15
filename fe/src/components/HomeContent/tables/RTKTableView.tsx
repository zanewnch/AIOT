import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { 
  loadRTKData, 
  updateRTKData, 
  setRTKSorting, 
  openEditModal, 
  closeEditModal, 
  updateEditingItem,
  SortField,
  SortOrder 
} from '../../../store/tableSlice';
import { addNotificationWithAutoRemove } from '../../../store/notificationSlice';
import { RTKData } from '../../../types/IRTKData';
import styles from '../../../styles/TableViewer.module.scss';

export const RTKTableView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    rtkData, 
    loading, 
    error, 
    sorting, 
    editModal 
  } = useSelector((state: RootState) => state.table);

  useEffect(() => {
    dispatch(loadRTKData());
  }, [dispatch]);

  // 排序數據
  const sortData = (data: RTKData[], field: SortField, order: SortOrder) => {
    return [...data].sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];

      if (field === 'timestamp') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  // 處理排序變更
  const handleSortChange = (field: SortField, order: SortOrder) => {
    dispatch(setRTKSorting({ field, order }));
  };

  // 處理編輯
  const handleEdit = (item: RTKData) => {
    dispatch(openEditModal({ tableType: 'RTK', item }));
  };

  // 處理保存
  const handleSave = async () => {
    if (!editModal.editingItem) return;

    try {
      await dispatch(updateRTKData({
        id: editModal.editingItem.id,
        data: {
          latitude: editModal.editingItem.latitude,
          longitude: editModal.editingItem.longitude,
          altitude: editModal.editingItem.altitude,
          timestamp: editModal.editingItem.timestamp
        }
      })).unwrap();

      dispatch(addNotificationWithAutoRemove({ type: 'success', message: '數據已更新' }));
      dispatch(closeEditModal());
    } catch (error) {
      dispatch(addNotificationWithAutoRemove({ 
        type: 'error', 
        message: error instanceof Error ? error.message : '更新數據時發生錯誤' 
      }));
    }
  };

  if (loading.rtk) {
    return <div className={styles.loading}>Loading RTK data...</div>;
  }

  if (error.rtk) {
    return <div className={styles.error}>Error: {error.rtk}</div>;
  }

  const sortedData = sortData(rtkData, sorting.field, sorting.order);

  const sortFields: { field: SortField; label: string }[] = [
    { field: 'id', label: 'ID' },
    { field: 'longitude', label: '經度 (Longitude)' },
    { field: 'latitude', label: '緯度 (Latitude)' },
    { field: 'altitude', label: '海拔 (Altitude)' },
    { field: 'timestamp', label: '時間戳記 (Timestamp)' }
  ];

  return (
    <div>
      {/* 排序控制器 */}
      <div className={styles.sortControls}>
        {sortFields.map(({ field, label }) => (
          <div key={field} className={styles.sortDropdown}>
            <label>{label}:</label>
            <select
              value={sorting.field === field ? sorting.order : ''}
              onChange={(e) => {
                if (e.target.value) {
                  handleSortChange(field, e.target.value as SortOrder);
                }
              }}
            >
              <option value="">-</option>
              <option value="asc">由小到大</option>
              <option value="desc">由大到小</option>
            </select>
          </div>
        ))}
      </div>

      {/* 表格 */}
      <table className={styles.table} style={{ '--row-count': sortedData.length } as React.CSSProperties}>
        <thead>
          <tr>
            <th>ID</th>
            <th>經度 (Longitude)</th>
            <th>緯度 (Latitude)</th>
            <th>海拔 (Altitude)</th>
            <th>時間戳記 (Timestamp)</th>
            <th>操作 (Actions)</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item: RTKData) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.longitude ? item.longitude.toFixed(4) : 'N/A'}</td>
              <td>{item.latitude ? item.latitude.toFixed(4) : 'N/A'}</td>
              <td>{item.altitude ? `${item.altitude.toFixed(1)}m` : 'N/A'}</td>
              <td>{item.timestamp || 'N/A'}</td>
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
      {editModal.isOpen && editModal.tableType === 'RTK' && editModal.editingItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>編輯 RTK 數據</h3>
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
                <label>經度 (Longitude):</label>
                <input
                  type="number"
                  step="0.0001"
                  value={editModal.editingItem.longitude || ''}
                  onChange={(e) => dispatch(updateEditingItem({
                    ...editModal.editingItem,
                    longitude: parseFloat(e.target.value) || 0
                  }))}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>緯度 (Latitude):</label>
                <input
                  type="number"
                  step="0.0001"
                  value={editModal.editingItem.latitude || ''}
                  onChange={(e) => dispatch(updateEditingItem({
                    ...editModal.editingItem,
                    latitude: parseFloat(e.target.value) || 0
                  }))}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>海拔 (Altitude):</label>
                <input
                  type="number"
                  step="0.1"
                  value={editModal.editingItem.altitude || ''}
                  onChange={(e) => dispatch(updateEditingItem({
                    ...editModal.editingItem,
                    altitude: parseFloat(e.target.value) || 0
                  }))}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>時間戳記 (Timestamp):</label>
                <input
                  type="text"
                  value={editModal.editingItem.timestamp || ''}
                  onChange={(e) => dispatch(updateEditingItem({
                    ...editModal.editingItem,
                    timestamp: e.target.value
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