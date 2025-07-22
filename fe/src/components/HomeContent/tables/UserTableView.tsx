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

import React, { useEffect } from 'react'; // 引入 React 和 useEffect 鉤子
import { useDispatch, useSelector } from 'react-redux'; // 引入 Redux 狀態管理鉤子
import { RootState, AppDispatch } from '../../../stores'; // 引入 Redux 根狀態和 Dispatch 類型
import { 
  loadUserData, // 載入用戶資料的 action
  updateUserData, // 更新用戶資料的 action
  openEditModal, // 開啟編輯模態框的 action
  closeEditModal, // 關閉編輯模態框的 action
  updateEditingItem // 更新編輯中項目的 action
} from '../../../stores/tableSlice'; // 引入表格相關的 Redux slice
import { addNotificationWithAutoRemove } from '../../../stores/notificationSlice'; // 引入通知相關的 Redux slice
import styles from '../../../styles/TableViewer.module.scss'; // 引入表格樣式

/**
 * 用戶表格視圖組件
 * 
 * 此組件負責顯示用戶數據的表格視圖，提供用戶的查看和編輯功能。
 * 包含動態表格渲染、編輯模態框、數據更新等功能。
 * 
 * @returns {JSX.Element} 用戶表格視圖的 JSX 元素
 * 
 * @example
 * ```tsx
 * import { UserTableView } from './UserTableView';
 * 
 * function App() {
 *   return <UserTableView />;
 * }
 * ```
 */
export const UserTableView: React.FC = () => {
  // 初始化 Redux dispatch 鉤子，用於分派 actions
  const dispatch = useDispatch<AppDispatch>();
  
  // 使用 useSelector 從 Redux store 中獲取表格相關的狀態數據
  const { 
    userData, // 用戶資料陣列
    loading, // 載入狀態物件
    error, // 錯誤狀態物件
    editModal // 編輯模態框狀態物件
  } = useSelector((state: RootState) => state.table);

  /**
   * 組件生命週期 - 載入用戶資料
   * 
   * 當組件首次掛載時，自動載入用戶資料
   */
  useEffect(() => {
    dispatch(loadUserData()); // 分派載入用戶資料的 action
  }, [dispatch]); // 依賴項為 dispatch，確保穩定性

  /**
   * 處理編輯操作
   * 
   * 開啟編輯模態框，並設置當前編輯的項目
   * 
   * @param {any} item - 要編輯的用戶項目
   */
  const handleEdit = (item: any) => {
    dispatch(openEditModal({ tableType: 'user', item })); // 分派開啟編輯模態框的 action
  };

  /**
   * 處理保存操作
   * 
   * 驗證編輯資料並更新用戶資料，處理成功/失敗的通知
   * 
   * @returns {Promise<void>} 非同步操作的 Promise
   */
  const handleSave = async () => {
    // 檢查是否有編輯中的項目
    if (!editModal.editingItem) return;

    try {
      // 分派更新用戶資料的 action，並等待操作完成
      await dispatch(updateUserData({
        id: editModal.editingItem.id, // 用戶 ID
        data: {
          username: editModal.editingItem.username, // 更新後的用戶名
          email: editModal.editingItem.email // 更新後的電子郵件
        }
      })).unwrap(); // 解包 Promise 以處理錯誤

      // 顯示成功通知
      dispatch(addNotificationWithAutoRemove({ type: 'success', message: '用戶已更新' }));
      // 關閉編輯模態框
      dispatch(closeEditModal());
    } catch (error) {
      // 處理錯誤情況，顯示錯誤通知
      dispatch(addNotificationWithAutoRemove({ 
        type: 'error', 
        message: error instanceof Error ? error.message : '更新用戶時發生錯誤' 
      }));
    }
  };

  // 載入狀態檢查 - 如果用戶資料正在載入中，顯示載入提示
  if (loading.user) {
    return <div className={styles.loading}>Loading user data...</div>;
  }

  // 錯誤狀態檢查 - 如果載入用戶資料時發生錯誤，顯示錯誤訊息
  if (error.user) {
    return <div className={styles.error}>Error: {error.user}</div>;
  }

  // 空資料檢查 - 如果沒有用戶資料，顯示無資料提示
  if (userData.length === 0) {
    return <div className={styles.noData}>No user data available</div>;
  }

  // 動態獲取表格欄位 - 從第一筆資料中取得所有欄位名稱
  const columns = Object.keys(userData[0]);

  // 渲染用戶表格視圖的主要內容
  return (
    <div>
      {/* 用戶資料表格 */}
      <table 
        className={styles.table} 
        style={{ '--row-count': userData.length } as React.CSSProperties} // 設置 CSS 自定義屬性，用於樣式計算
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
          {/* 動態渲染用戶資料行 */}
          {userData.map((item, index) => (
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

      {/* 用戶編輯模態框 - 條件式渲染 */}
      {editModal.isOpen && editModal.tableType === 'user' && editModal.editingItem && (
        <div className={styles.modalOverlay}> {/* 模態框遮罩層 */}
          <div className={styles.modal}> {/* 模態框主體 */}
            {/* 模態框標題列 */}
            <div className={styles.modalHeader}>
              <h3>編輯用戶</h3> {/* 模態框標題 */}
              <button
                className={styles.closeButton}
                onClick={() => dispatch(closeEditModal())} // 點擊關閉按鈕時關閉模態框
              >
                ×
              </button>
            </div>
            {/* 模態框內容區域 */}
            <div className={styles.modalBody}>
              {/* 用戶 ID 欄位 - 唯讀 */}
              <div className={styles.formGroup}>
                <label>ID:</label>
                <input
                  type="text"
                  value={editModal.editingItem.id || ''} // 顯示用戶 ID
                  disabled // 禁用編輯，因為 ID 不應被修改
                  className={styles.disabledInput}
                />
              </div>
              {/* 用戶名欄位 - 可編輯 */}
              <div className={styles.formGroup}>
                <label>用戶名 (Username):</label>
                <input
                  type="text"
                  value={editModal.editingItem.username || ''} // 顯示當前用戶名
                  onChange={(e) => dispatch(updateEditingItem({
                    ...editModal.editingItem, // 保留其他欄位的值
                    username: e.target.value // 更新用戶名
                  }))}
                  className={styles.input}
                />
              </div>
              {/* 電子郵件欄位 - 可編輯 */}
              <div className={styles.formGroup}>
                <label>電子郵件 (Email):</label>
                <input
                  type="email"
                  value={editModal.editingItem.email || ''} // 顯示當前電子郵件
                  onChange={(e) => dispatch(updateEditingItem({
                    ...editModal.editingItem, // 保留其他欄位的值
                    email: e.target.value // 更新電子郵件
                  }))}
                  className={styles.input}
                />
              </div>
              {/* 密碼哈希欄位 - 唯讀 */}
              <div className={styles.formGroup}>
                <label>密碼哈希 (Password Hash):</label>
                <input
                  type="text"
                  value={editModal.editingItem.passwordHash || ''} // 顯示密碼哈希
                  disabled // 禁用編輯，因為密碼哈希不應直接修改
                  className={styles.disabledInput}
                />
                <small>密碼哈希不可直接編輯</small> {/* 說明文字 */}
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