/**
 * @fileoverview RTK 數據表格檢視組件
 * 
 * 此檔案提供了一個專門用於顯示和編輯 RTK（Real-time Kinematic）數據的表格組件。
 * 組件整合了 Redux 狀態管理，支援數據載入、排序、編輯和更新功能。
 * 包含模態框編輯介面、排序控制器和完整的錯誤處理機制。
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @since 2025-07-18
 */

import React, { useEffect } from 'react'; // 引入 React 庫和 useEffect Hook
import { useDispatch, useSelector } from 'react-redux'; // 引入 Redux Hook
import { RootState, AppDispatch } from '../../../stores'; // 引入 Redux store 類型
import { 
  loadRTKData, // 載入 RTK 數據的 action
  updateRTKData, // 更新 RTK 數據的 action
  setRTKSorting, // 設置排序的 action
  openEditModal, // 打開編輯模態框的 action
  closeEditModal, // 關閉編輯模態框的 action
  updateEditingItem, // 更新正在編輯項目的 action
  SortField, // 排序欄位類型
  SortOrder // 排序順序類型
} from '../../../stores/tableSlice';
import { addNotificationWithAutoRemove } from '../../../stores/notificationSlice'; // 引入通知相關的 action
import { RTKData } from '../../../types/IRTKData'; // 引入 RTK 數據類型定義
import styles from '../../../styles/TableViewer.module.scss'; // 引入表格檢視器的 SCSS 模組樣式

/**
 * RTK 數據表格檢視組件
 * 
 * 專門用於顯示和管理 RTK（Real-time Kinematic）定位數據的表格組件。
 * 提供完整的 CRUD 操作，包括數據載入、排序、編輯和更新功能。
 * 
 * @returns 渲染後的 RTK 表格檢視 JSX 元素
 * 
 * @example
 * ```tsx
 * <RTKTableView />
 * ```
 */
export const RTKTableView: React.FC = () => {
  // 獲取 Redux dispatch 函數
  const dispatch = useDispatch<AppDispatch>();
  // 從 Redux store 獲取表格相關狀態
  const { 
    rtkData, // RTK 數據陣列
    loading, // 載入狀態
    error, // 錯誤狀態
    sorting, // 排序配置
    editModal // 編輯模態框狀態
  } = useSelector((state: RootState) => state.table);

  // 組件掛載時載入 RTK 數據
  useEffect(() => {
    dispatch(loadRTKData()); // 觸發載入 RTK 數據的 action
  }, [dispatch]);

  /**
   * 排序數據函數
   * 
   * 根據指定的欄位和順序對 RTK 數據進行排序
   * 
   * @param data - 要排序的 RTK 數據陣列
   * @param field - 排序欄位
   * @param order - 排序順序（升序或降序）
   * @returns 排序後的數據陣列
   */
  const sortData = (data: RTKData[], field: SortField, order: SortOrder) => {
    return [...data].sort((a, b) => { // 創建數據副本以避免修改原陣列
      let aVal = a[field]; // 獲取第一個項目的比較值
      let bVal = b[field]; // 獲取第二個項目的比較值

      // 如果是時間戳記欄位，轉換為時間戳進行比較
      if (field === 'timestamp') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      // 根據排序順序返回比較結果
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1; // 升序排序
      } else {
        return aVal < bVal ? 1 : -1; // 降序排序
      }
    });
  };

  /**
   * 處理排序變更
   * 
   * 當使用者更改排序設定時觸發
   * 
   * @param field - 排序欄位
   * @param order - 排序順序
   */
  const handleSortChange = (field: SortField, order: SortOrder) => {
    dispatch(setRTKSorting({ field, order })); // 更新排序配置
  };

  /**
   * 處理編輯操作
   * 
   * 打開編輯模態框並設置要編輯的項目
   * 
   * @param item - 要編輯的 RTK 數據項目
   */
  const handleEdit = (item: RTKData) => {
    dispatch(openEditModal({ tableType: 'RTK', item })); // 打開編輯模態框
  };

  /**
   * 處理保存操作
   * 
   * 將編輯後的數據更新到伺服器，並處理成功/失敗狀態
   */
  const handleSave = async () => {
    if (!editModal.editingItem) return; // 如果沒有正在編輯的項目，直接返回

    try {
      // 觸發更新 RTK 數據的 action
      await dispatch(updateRTKData({
        id: editModal.editingItem.id,
        data: {
          latitude: editModal.editingItem.latitude,
          longitude: editModal.editingItem.longitude,
          altitude: editModal.editingItem.altitude,
          timestamp: editModal.editingItem.timestamp
        }
      })).unwrap(); // 使用 unwrap() 來處理 promise 結果

      // 顯示成功通知
      dispatch(addNotificationWithAutoRemove({ type: 'success', message: '數據已更新' }));
      // 關閉編輯模態框
      dispatch(closeEditModal());
    } catch (error) {
      // 顯示錯誤通知
      dispatch(addNotificationWithAutoRemove({ 
        type: 'error', 
        message: error instanceof Error ? error.message : '更新數據時發生錯誤' 
      }));
    }
  };

  // 如果正在載入數據，顯示載入中的狀態
  if (loading.rtk) {
    return <div className={styles.loading}>Loading RTK data...</div>;
  }

  // 如果有錯誤，顯示錯誤訊息
  if (error.rtk) {
    return <div className={styles.error}>Error: {error.rtk}</div>;
  }

  // 根據當前排序設定對數據進行排序
  const sortedData = sortData(rtkData, sorting.field, sorting.order);

  // 定義可排序的欄位及其顯示標籤
  const sortFields: { field: SortField; label: string }[] = [
    { field: 'id', label: 'ID' },
    { field: 'longitude', label: '經度 (Longitude)' },
    { field: 'latitude', label: '緯度 (Latitude)' },
    { field: 'altitude', label: '海拔 (Altitude)' },
    { field: 'timestamp', label: '時間戳記 (Timestamp)' }
  ];

  return (
    <div>
      {/* 排序控制器 - 提供各欄位的排序選項 */}
      <div className={styles.sortControls}>
        {sortFields.map(({ field, label }) => (
          <div key={field} className={styles.sortDropdown}>
            <label>{label}:</label>
            <select
              value={sorting.field === field ? sorting.order : ''} // 顯示當前排序狀態
              onChange={(e) => {
                if (e.target.value) {
                  handleSortChange(field, e.target.value as SortOrder); // 處理排序變更
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

      {/* RTK 數據表格 - 顯示經過排序的 RTK 數據 */}
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
              {/* 經度，保留四位小數 */}
              <td>{item.longitude ? item.longitude.toFixed(4) : 'N/A'}</td>
              {/* 緯度，保留四位小數 */}
              <td>{item.latitude ? item.latitude.toFixed(4) : 'N/A'}</td>
              {/* 海拔，保留一位小數並加上單位 */}
              <td>{item.altitude ? `${item.altitude.toFixed(1)}m` : 'N/A'}</td>
              {/* 時間戳記 */}
              <td>{item.timestamp || 'N/A'}</td>
              <td>
                {/* 編輯按鈕 */}
                <button
                  className={styles.editButton}
                  onClick={() => handleEdit(item)} // 點擊時打開編輯模態框
                >
                  編輯
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 編輯模態框 - 當編輯模態框打開且類型為 RTK 時顯示 */}
      {editModal.isOpen && editModal.tableType === 'RTK' && editModal.editingItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            {/* 模態框標題欄 */}
            <div className={styles.modalHeader}>
              <h3>編輯 RTK 數據</h3>
              <button
                className={styles.closeButton}
                onClick={() => dispatch(closeEditModal())} // 關閉模態框
              >
                ×
              </button>
            </div>
            {/* 模態框主體內容 */}
            <div className={styles.modalBody}>
              {/* ID 欄位 - 禁用編輯 */}
              <div className={styles.formGroup}>
                <label>ID:</label>
                <input
                  type="text"
                  value={editModal.editingItem.id || ''}
                  disabled // ID 不可編輯
                  className={styles.disabledInput}
                />
              </div>
              {/* 經度欄位 */}
              <div className={styles.formGroup}>
                <label>經度 (Longitude):</label>
                <input
                  type="number"
                  step="0.0001" // 精確到小數點後四位
                  value={editModal.editingItem.longitude || ''}
                  onChange={(e) => dispatch(updateEditingItem({
                    ...editModal.editingItem,
                    longitude: parseFloat(e.target.value) || 0
                  }))}
                  className={styles.input}
                />
              </div>
              {/* 緯度欄位 */}
              <div className={styles.formGroup}>
                <label>緯度 (Latitude):</label>
                <input
                  type="number"
                  step="0.0001" // 精確到小數點後四位
                  value={editModal.editingItem.latitude || ''}
                  onChange={(e) => dispatch(updateEditingItem({
                    ...editModal.editingItem,
                    latitude: parseFloat(e.target.value) || 0
                  }))}
                  className={styles.input}
                />
              </div>
              {/* 海拔欄位 */}
              <div className={styles.formGroup}>
                <label>海拔 (Altitude):</label>
                <input
                  type="number"
                  step="0.1" // 精確到小數點後一位
                  value={editModal.editingItem.altitude || ''}
                  onChange={(e) => dispatch(updateEditingItem({
                    ...editModal.editingItem,
                    altitude: parseFloat(e.target.value) || 0
                  }))}
                  className={styles.input}
                />
              </div>
              {/* 時間戳記欄位 */}
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
            {/* 模態框底部按鈕 */}
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => dispatch(closeEditModal())} // 取消並關閉模態框
              >
                取消
              </button>
              <button
                className={styles.saveButton}
                onClick={handleSave} // 保存更改
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