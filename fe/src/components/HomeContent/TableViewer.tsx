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

import React from 'react'; // 引入 React
import { useTableUIStore, TableType } from '../../stores'; // 引入 Zustand stores 和類型
// 表格數據已分散到各自的 hook 中 // 引入表格數據 Hook
import { 
  RTKTableView, // RTK 表格視圖組件
  PermissionTableView, // 權限表格視圖組件
  RoleTableView, // 角色表格視圖組件
  UserTableView, // 用戶表格視圖組件
  RoleToPermissionTableView, // 角色權限關聯表格視圖組件
  UserToRoleTableView // 用戶角色關聯表格視圖組件
} from './tables'; // 引入表格組件
import styles from '../../styles/TableViewer.module.scss'; // 引入表格樣式
import { createLogger, logUserAction } from '../../configs/loggerConfig'; // 引入日誌配置

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

// 創建 TableViewer 專用的 logger 實例
const logger = createLogger('TableViewer');

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
  // 從 Zustand stores 獲取狀態和方法
  const { activeTable, setActiveTable } = useTableUIStore();
  
  // 注意：通知功能現在由 React Query hooks 直接處理，不再需要 TableService 的回調

  /**
   * 處理表格切換操作
   * 
   * 當用戶點擊表格切換標籤時，更新活動表格類型
   * 
   * @param tableType - 要切換到的表格類型
   */
  const handleTableChange = (tableType: TableType) => {
    // 記錄表格切換操作
    logger.info(`Table switched to: ${tableType}`, {
      previousTable: activeTable,
      newTable: tableType,
      tableTitle: tableConfigs[tableType]?.title
    });
    
    // 記錄用戶操作
    logUserAction('table_switch', {
      from: activeTable,
      to: tableType,
      tableTitle: tableConfigs[tableType]?.title
    });
    
    setActiveTable(tableType); // 設置活動表格
  };

  /**
   * 獲取當前表格的數據長度
   * 
   * 使用 React Query hooks 獲取各表格的數據長度
   * 
   * @returns 當前表格的數據記錄數量
   */
  const getCurrentTableDataLength = () => {
    // TODO: 考慮重新實作或移除此功能
    // 數據長度計算已移到各自的表格組件中
    return 0;
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