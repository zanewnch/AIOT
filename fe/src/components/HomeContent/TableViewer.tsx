/**
 * @fileoverview 表格視圖容器組件
 * 
 * 此組件提供表格視圖的容器功能，包括：
 * - 表格切換標籤管理
 * - 各個子表格組件的協調
 * - 統一的表格標題和記錄數量顯示
 * - 通知系統整合
 * - 表格數據長度計算
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React, { useEffect } from 'react'; // 引入 React 和 useEffect 鉤子
import { useDispatch, useSelector } from 'react-redux'; // 引入 Redux 狀態管理鉤子
import { RootState, AppDispatch } from '../../store'; // 引入 Redux 根狀態和 Dispatch 類型
import { setActiveTable, TableType } from '../../store/tableSlice'; // 引入表格相關的 Redux slice
import { addNotificationWithAutoRemove } from '../../store/notificationSlice'; // 引入通知相關的 Redux slice
import { TableService } from '../../services/TableService'; // 引入表格服務
import { 
  RTKTableView, // RTK 表格視圖組件
  PermissionTableView, // 權限表格視圖組件
  RoleTableView, // 角色表格視圖組件
  UserTableView, // 用戶表格視圖組件
  RoleToPermissionTableView, // 角色權限關聯表格視圖組件
  UserToRoleTableView // 用戶角色關聯表格視圖組件
} from './tables'; // 引入表格組件
import styles from '../../styles/TableViewer.module.scss'; // 引入表格樣式

/**
 * 表格視圖組件的屬性介面
 * 
 * @interface TableViewerProps
 */
interface TableViewerProps {
  /** 可選的自定義 CSS 類名 */
  className?: string;
}

/**
 * 表格配置物件
 * 
 * 定義每個表格的顯示標題，用於標籤和標題顯示
 */
const tableConfigs = {
  permission: { title: 'Permission Table' }, // 權限表格配置
  role: { title: 'Role Table' }, // 角色表格配置
  roletopermission: { title: 'Role to Permission Table' }, // 角色權限關聯表格配置
  user: { title: 'User Table' }, // 用戶表格配置
  usertorole: { title: 'User to Role Table' }, // 用戶角色關聯表格配置
  RTK: { title: 'RTK Table' } // RTK 表格配置
};

/**
 * 表格視圖容器組件
 * 
 * 此組件負責管理表格視圖的整體結構，包括表格切換標籤、
 * 標題顯示、記錄數量統計以及各個子表格組件的渲染。
 * 
 * @param {TableViewerProps} props - 組件屬性
 * @returns {JSX.Element} 表格視圖容器的 JSX 元素
 * 
 * @example
 * ```tsx
 * import { TableViewer } from './TableViewer';
 * 
 * function App() {
 *   return <TableViewer className="custom-table-viewer" />;
 * }
 * ```
 */
export const TableViewer: React.FC<TableViewerProps> = ({ className }) => {
  // 初始化 Redux hooks
  const dispatch = useDispatch<AppDispatch>(); // Redux dispatch 鉤子
  
  // 從 Redux store 中獲取表格相關的狀態數據
  const { 
    activeTable, // 當前活動的表格類型
    rtkData, // RTK 表格數據
    permissionData, // 權限表格數據
    roleData, // 角色表格數據
    userData, // 用戶表格數據
    roleToPermissionData, // 角色權限關聯表格數據
    userToRoleData // 用戶角色關聯表格數據
  } = useSelector((state: RootState) => state.table);

  /**
   * 初始化 TableService 的通知回調函數
   * 
   * 當組件掛載時，設置表格服務的通知回調函數，
   * 以便在表格操作時顯示通知消息
   */
  useEffect(() => {
    TableService.setNotificationCallback((type, message) => 
      dispatch(addNotificationWithAutoRemove({ type, message }))
    );
  }, [dispatch]); // 依賴項為 dispatch，確保穩定性

  /**
   * 處理表格切換操作
   * 
   * 當用戶點擊表格切換標籤時，更新活動表格類型
   * 
   * @param {TableType} tableType - 要切換到的表格類型
   */
  const handleTableChange = (tableType: TableType) => {
    dispatch(setActiveTable(tableType)); // 分派設置活動表格的 action
  };

  /**
   * 獲取當前表格的數據長度
   * 
   * 根據當前活動的表格類型，返回對應表格的數據記錄數量
   * 
   * @returns {number} 當前表格的數據記錄數量
   */
  const getCurrentTableDataLength = () => {
    switch (activeTable) {
      case 'RTK':
        return rtkData.length; // RTK 表格數據長度
      case 'permission':
        return permissionData.length; // 權限表格數據長度
      case 'role':
        return roleData.length; // 角色表格數據長度
      case 'user':
        return userData.length; // 用戶表格數據長度
      case 'roletopermission':
        return roleToPermissionData.length; // 角色權限關聯表格數據長度
      case 'usertorole':
        return userToRoleData.length; // 用戶角色關聯表格數據長度
      default:
        return 0; // 默認返回 0
    }
  };

  /**
   * 渲染對應的表格組件
   * 
   * 根據當前活動的表格類型，渲染對應的表格視圖組件
   * 
   * @returns {JSX.Element} 對應的表格組件 JSX 元素
   */
  const renderCurrentTable = () => {
    switch (activeTable) {
      case 'RTK':
        return <RTKTableView />; // 渲染 RTK 表格視圖
      case 'permission':
        return <PermissionTableView />; // 渲染權限表格視圖
      case 'role':
        return <RoleTableView />; // 渲染角色表格視圖
      case 'user':
        return <UserTableView />; // 渲染用戶表格視圖
      case 'roletopermission':
        return <RoleToPermissionTableView />; // 渲染角色權限關聯表格視圖
      case 'usertorole':
        return <UserToRoleTableView />; // 渲染用戶角色關聯表格視圖
      default:
        return <div className={styles.noData}>No table selected</div>; // 無選中表格時的提示
    }
  };

  // 渲染表格視圖容器的主要內容
  return (
    <div className={`${styles.tableViewerRoot} ${className || ''}`}> {/* 根容器，應用自定義類名 */}
      <div className={styles.tableContainer}> {/* 表格容器 */}
        {/* 表格切換標籤區域 */}
        <div className={styles.tabsContainer}>
          {/* 動態渲染表格切換標籤 */}
          {Object.entries(tableConfigs).map(([key, config]) => (
            <button
              key={key}
              className={`${styles.tab} ${activeTable === key ? styles.active : ''}`} // 根據活動狀態設置樣式
              onClick={() => handleTableChange(key as TableType)} // 點擊時切換表格
            >
              {config.title} {/* 顯示表格標題 */}
            </button>
          ))}
        </div>

        {/* 表格標題和記錄數量顯示區域 */}
        <div className={styles.tableHeader}>
          <h2>{tableConfigs[activeTable].title}</h2> {/* 顯示當前表格標題 */}
          <span className={styles.recordCount}>
            {getCurrentTableDataLength()} records {/* 顯示當前表格記錄數量 */}
          </span>
        </div>

        {/* 表格內容區域 */}
        <div className={styles.tableWrapper}>
          {renderCurrentTable()} {/* 渲染當前選中的表格組件 */}
        </div>
      </div>
    </div>
  );
}; 