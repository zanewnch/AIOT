/**
 * TableViewer 組件 - 重構為容器組件
 * 
 * 這是一個容器組件，負責：
 * 1. 管理活動表格的切換
 * 2. 協調各個子表格組件
 * 3. 統一的表格標題和記錄數量顯示
 * 4. 通知系統整合
 */
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { setActiveTable, TableType } from '../../store/tableSlice';
import { addNotificationWithAutoRemove } from '../../store/notificationSlice';
import { TableService } from '../../services/TableService';
import { 
  RTKTableView, 
  PermissionTableView, 
  RoleTableView, 
  UserTableView, 
  RoleToPermissionTableView, 
  UserToRoleTableView 
} from './tables';
import styles from '../../styles/TableViewer.module.scss';

// 組件屬性定義
interface TableViewerProps {
  className?: string;
}

// 表格配置 - 定義每個表格的顯示標題
const tableConfigs = {
  permission: { title: 'Permission Table' },
  role: { title: 'Role Table' },
  roletopermission: { title: 'Role to Permission Table' },
  user: { title: 'User Table' },
  usertorole: { title: 'User to Role Table' },
  RTK: { title: 'RTK Table' }
};

export const TableViewer: React.FC<TableViewerProps> = ({ className }) => {
  // Redux hooks
  const dispatch = useDispatch<AppDispatch>();
  const { activeTable, rtkData, permissionData, roleData, userData, roleToPermissionData, userToRoleData } = useSelector((state: RootState) => state.table);

  // 初始化 TableService 的通知回調函數
  useEffect(() => {
    TableService.setNotificationCallback((type, message) => 
      dispatch(addNotificationWithAutoRemove({ type, message }))
    );
  }, [dispatch]);

  // 處理表格切換
  const handleTableChange = (tableType: TableType) => {
    dispatch(setActiveTable(tableType));
  };

  // 獲取當前表格的數據長度
  const getCurrentTableDataLength = () => {
    switch (activeTable) {
      case 'RTK':
        return rtkData.length;
      case 'permission':
        return permissionData.length;
      case 'role':
        return roleData.length;
      case 'user':
        return userData.length;
      case 'roletopermission':
        return roleToPermissionData.length;
      case 'usertorole':
        return userToRoleData.length;
      default:
        return 0;
    }
  };

  // 渲染對應的表格組件
  const renderCurrentTable = () => {
    switch (activeTable) {
      case 'RTK':
        return <RTKTableView />;
      case 'permission':
        return <PermissionTableView />;
      case 'role':
        return <RoleTableView />;
      case 'user':
        return <UserTableView />;
      case 'roletopermission':
        return <RoleToPermissionTableView />;
      case 'usertorole':
        return <UserToRoleTableView />;
      default:
        return <div className={styles.noData}>No table selected</div>;
    }
  };

  // === 主要渲染區域 ===
  return (
    <div className={`${styles.tableViewerRoot} ${className || ''}`}>
      <div className={styles.tableContainer}>
        {/* 表格切換標籤區域 */}
        <div className={styles.tabsContainer}>
          {Object.entries(tableConfigs).map(([key, config]) => (
            <button
              key={key}
              className={`${styles.tab} ${activeTable === key ? styles.active : ''}`}
              onClick={() => handleTableChange(key as TableType)}
            >
              {config.title}
            </button>
          ))}
        </div>

        {/* 表格標題和記錄數量顯示 */}
        <div className={styles.tableHeader}>
          <h2>{tableConfigs[activeTable].title}</h2>
          <span className={styles.recordCount}>
            {getCurrentTableDataLength()} records
          </span>
        </div>

        {/* 表格內容區域 */}
        <div className={styles.tableWrapper}>
          {renderCurrentTable()}
        </div>
      </div>
    </div>
  );
}; 