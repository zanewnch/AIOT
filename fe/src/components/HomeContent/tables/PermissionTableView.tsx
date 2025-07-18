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

import React, { useEffect } from 'react'; // 引入 React 和 useEffect 鉤子
import { useDispatch, useSelector } from 'react-redux'; // 引入 Redux 狀態管理鉤子
import { RootState, AppDispatch } from '../../../store'; // 引入 Redux 根狀態和 Dispatch 類型
import { 
  loadPermissionData, // 載入權限資料的 action
  updatePermissionData, // 更新權限資料的 action
  openEditModal, // 開啟編輯模態框的 action
  closeEditModal, // 關閉編輯模態框的 action
  updateEditingItem // 更新編輯中項目的 action
} from '../../../store/tableSlice'; // 引入表格相關的 Redux slice
import { addNotificationWithAutoRemove } from '../../../store/notificationSlice'; // 引入通知相關的 Redux slice
import styles from '../../../styles/TableViewer.module.scss'; // 引入表格樣式

/**
 * 權限表格視圖組件
 * 
 * 此組件負責顯示權限數據的表格視圖，提供權限的查看和編輯功能。
 * 包含動態表格渲染、編輯模態框、數據更新等功能。
 * 
 * @returns {JSX.Element} 權限表格視圖的 JSX 元素
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
  // 初始化 Redux dispatch 鉤子，用於分派 actions
  const dispatch = useDispatch<AppDispatch>();
  
  // 使用 useSelector 從 Redux store 中獲取表格相關的狀態數據
  const { 
    permissionData, // 權限資料陣列
    loading, // 載入狀態物件
    error, // 錯誤狀態物件
    editModal // 編輯模態框狀態物件
  } = useSelector((state: RootState) => state.table);

  /**
   * 組件生命週期 - 載入權限資料
   * 
   * 當組件首次掛載時，自動載入權限資料
   */
  useEffect(() => {
    dispatch(loadPermissionData()); // 分派載入權限資料的 action
  }, [dispatch]); // 依賴項為 dispatch，確保穩定性

  /**
   * 處理編輯操作
   * 
   * 開啟編輯模態框，並設置當前編輯的項目
   * 
   * @param {any} item - 要編輯的權限項目
   */
  const handleEdit = (item: any) => {
    dispatch(openEditModal({ tableType: 'permission', item })); // 分派開啟編輯模態框的 action
  };

  /**
   * 處理保存操作
   * 
   * 驗證編輯資料並更新權限資料，處理成功/失敗的通知
   * 
   * @returns {Promise<void>} 非同步操作的 Promise
   */
  const handleSave = async () => {
    // 檢查是否有編輯中的項目
    if (!editModal.editingItem) return;

    try {
      // 分派更新權限資料的 action，並等待操作完成
      await dispatch(updatePermissionData({
        id: editModal.editingItem.id, // 權限 ID
        data: {
          name: editModal.editingItem.name, // 更新後的權限名稱
          description: editModal.editingItem.description // 更新後的權限描述
        }
      })).unwrap(); // 解包 Promise 以處理錯誤

      // 顯示成功通知
      dispatch(addNotificationWithAutoRemove({ type: 'success', message: '權限已更新' }));
      // 關閉編輯模態框
      dispatch(closeEditModal());
    } catch (error) {
      // 處理錯誤情況，顯示錯誤通知
      dispatch(addNotificationWithAutoRemove({ 
        type: 'error', 
        message: error instanceof Error ? error.message : '更新權限時發生錯誤' 
      }));
    }
  };

  // 載入狀態檢查 - 如果權限資料正在載入中，顯示載入提示
  if (loading.permission) {
    return <div className={styles.loading}>Loading permission data...</div>;
  }

  // 錯誤狀態檢查 - 如果載入權限資料時發生錯誤，顯示錯誤訊息
  if (error.permission) {
    return <div className={styles.error}>Error: {error.permission}</div>;
  }

  // 空資料檢查 - 如果沒有權限資料，顯示無資料提示
  if (permissionData.length === 0) {
    return <div className={styles.noData}>No permission data available</div>;
  }

  // 動態獲取表格欄位 - 從第一筆資料中取得所有欄位名稱
  const columns = Object.keys(permissionData[0]);

  // 渲染權限表格視圖的主要內容
  return (
    <div>
      {/* 權限資料表格 */}
      <table 
        className={styles.table} 
        style={{ '--row-count': permissionData.length } as React.CSSProperties} // 設置 CSS 自定義屬性，用於樣式計算
      >
        <thead>
          <tr>
            {/* 動態渲染表格標題列 */}
            {columns.map((column) => (
              <th key={column}>{column}</th> // 每個欄位的標題
            ))}
            <th>操作 (Actions)</th> {/* 操作欄位的標題 */}
          </tr>
        </thead>
        <tbody>
          {/* 動態渲染權限資料行 */}
          {permissionData.map((item, index) => (
            <tr key={item.id || index}> {/* 使用 ID 或索引作為唯一鍵值 */}
              {/* 動態渲染每個欄位的資料 */}
              {columns.map((column) => (
                <td key={column}>
                  {/* 處理不同類型的資料顯示 */}
                  {typeof item[column] === 'object' && item[column] !== null
                    ? JSON.stringify(item[column]) // 物件類型轉換為 JSON 字串
                    : String(item[column] || '') // 其他類型轉換為字串，空值顯示為空字串
                  }
                </td>
              ))}
              <td>
                {/* 編輯按鈕 */}
                <button
                  className={styles.editButton}
                  onClick={() => handleEdit(item)} // 點擊時觸發編輯操作
                >
                  編輯
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 權限編輯模態框 - 條件式渲染 */}
      {editModal.isOpen && editModal.tableType === 'permission' && editModal.editingItem && (
        <div className={styles.modalOverlay}> {/* 模態框遮罩層 */}
          <div className={styles.modal}> {/* 模態框主體 */}
            {/* 模態框標題列 */}
            <div className={styles.modalHeader}>
              <h3>編輯權限</h3> {/* 模態框標題 */}
              <button
                className={styles.closeButton}
                onClick={() => dispatch(closeEditModal())} // 點擊關閉按鈕時關閉模態框
              >
                ×
              </button>
            </div>
            {/* 模態框內容區域 */}
            <div className={styles.modalBody}>
              {/* 權限 ID 欄位 - 唯讀 */}
              <div className={styles.formGroup}>
                <label>ID:</label>
                <input
                  type="text"
                  value={editModal.editingItem.id || ''} // 顯示權限 ID
                  disabled // 禁用編輯，因為 ID 不應被修改
                  className={styles.disabledInput}
                />
              </div>
              {/* 權限名稱欄位 - 可編輯 */}
              <div className={styles.formGroup}>
                <label>名稱 (Name):</label>
                <input
                  type="text"
                  value={editModal.editingItem.name || ''} // 顯示當前權限名稱
                  onChange={(e) => dispatch(updateEditingItem({
                    ...editModal.editingItem, // 保留其他欄位的值
                    name: e.target.value // 更新權限名稱
                  }))}
                  className={styles.input}
                />
              </div>
              {/* 權限描述欄位 - 可編輯 */}
              <div className={styles.formGroup}>
                <label>描述 (Description):</label>
                <textarea
                  value={editModal.editingItem.description || ''} // 顯示當前權限描述
                  onChange={(e) => dispatch(updateEditingItem({
                    ...editModal.editingItem, // 保留其他欄位的值
                    description: e.target.value // 更新權限描述
                  }))}
                  className={styles.input}
                  rows={3} // 設置文本區域的行數
                />
              </div>
            </div>
            {/* 模態框底部按鈕區域 */}
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => dispatch(closeEditModal())} // 點擊取消按鈕時關閉模態框
              >
                取消
              </button>
              <button
                className={styles.saveButton}
                onClick={handleSave} // 點擊保存按鈕時執行保存操作
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