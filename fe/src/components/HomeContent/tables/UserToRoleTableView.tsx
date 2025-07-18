/**
 * @fileoverview 用戶角色關聯表格視圖組件
 * 
 * 此組件提供用戶與角色關聯關係的表格視圖功能，包括：
 * - 用戶角色關聯數據的顯示和載入
 * - 關聯關係的動態表格渲染
 * - 錯誤處理和載入狀態管理
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React, { useEffect } from 'react'; // 引入 React 和 useEffect 鉤子
import { useDispatch, useSelector } from 'react-redux'; // 引入 Redux 狀態管理鉤子
import { RootState, AppDispatch } from '../../../store'; // 引入 Redux 根狀態和 Dispatch 類型
import { loadUserToRoleData } from '../../../store/tableSlice'; // 引入載入用戶角色關聯資料的 action
import styles from '../../../styles/TableViewer.module.scss'; // 引入表格樣式

/**
 * 用戶角色關聯表格視圖組件
 * 
 * 此組件負責顯示用戶與角色關聯關係的表格視圖，提供關聯數據的查看功能。
 * 包含動態表格渲染、載入狀態管理、錯誤處理等功能。
 * 
 * @returns {JSX.Element} 用戶角色關聯表格視圖的 JSX 元素
 * 
 * @example
 * ```tsx
 * import { UserToRoleTableView } from './UserToRoleTableView';
 * 
 * function App() {
 *   return <UserToRoleTableView />;
 * }
 * ```
 */
export const UserToRoleTableView: React.FC = () => {
  // 初始化 Redux dispatch 鉤子，用於分派 actions
  const dispatch = useDispatch<AppDispatch>();
  
  // 使用 useSelector 從 Redux store 中獲取表格相關的狀態數據
  const { 
    userToRoleData, // 用戶角色關聯資料陣列
    loading, // 載入狀態物件
    error // 錯誤狀態物件
  } = useSelector((state: RootState) => state.table);

  /**
   * 組件生命週期 - 載入用戶角色關聯資料
   * 
   * 當組件首次掛載時，自動載入用戶角色關聯資料
   */
  useEffect(() => {
    dispatch(loadUserToRoleData()); // 分派載入用戶角色關聯資料的 action
  }, [dispatch]); // 依賴項為 dispatch，確保穩定性

  // 載入狀態檢查 - 如果用戶角色關聯資料正在載入中，顯示載入提示
  if (loading.userToRole) {
    return <div className={styles.loading}>Loading user to role data...</div>;
  }

  // 錯誤狀態檢查 - 如果載入用戶角色關聯資料時發生錯誤，顯示錯誤訊息
  if (error.userToRole) {
    return <div className={styles.error}>Error: {error.userToRole}</div>;
  }

  // 空資料檢查 - 如果沒有用戶角色關聯資料，顯示無資料提示
  if (userToRoleData.length === 0) {
    return <div className={styles.noData}>No user to role data available</div>;
  }

  // 動態獲取表格欄位 - 從第一筆資料中取得所有欄位名稱
  const columns = Object.keys(userToRoleData[0]);

  // 渲染用戶角色關聯表格視圖的主要內容
  return (
    <div>
      {/* 用戶角色關聯資料表格 */}
      <table 
        className={styles.table} 
        style={{ '--row-count': userToRoleData.length } as React.CSSProperties} // 設置 CSS 自定義屬性，用於樣式計算
      >
        <thead>
          <tr>
            {/* 動態渲染表格標題列 */}
            {columns.map((column) => (
              <th key={column}>{column}</th> // 每個欄位的標題
            ))}
          </tr>
        </thead>
        <tbody>
          {/* 動態渲染用戶角色關聯資料行 */}
          {userToRoleData.map((item, index) => (
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};