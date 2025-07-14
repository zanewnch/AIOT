import React, { useEffect, useState } from 'react';
import styles from '../../styles/TableViewer.module.scss';
import { RTKData } from 'types/IRTKData';
import { TableService } from '../../services/TableService';
import { useNotification } from '../../context/NotificationContext';


interface TableViewerProps {
  className?: string;
}


type TableType = 'permission' | 'role' | 'roletopermission' | 'user' | 'usertorole' | 'RTK';

const tableConfigs = {
  permission: { title: 'Permission Table' },
  role: { title: 'Role Table' },
  roletopermission: { title: 'Role to Permission Table' },
  user: { title: 'User Table' },
  usertorole: { title: 'User to Role Table' },
  RTK: { title: 'RTK Table' }
};

export const TableViewer: React.FC<TableViewerProps> = ({ className }) => {
  const [activeTable, setActiveTable] = useState<TableType>('RTK');
  const [tableData, setTableData] = useState<any[]>([]);
  const { addNotification } = useNotification();

  // 設定 TableService 的通知回調
  useEffect(() => {
    TableService.setNotificationCallback(addNotification);
  }, [addNotification]);

  useEffect(() => {
    const loadTableData = async () => {
      try {
        console.log(`🔄 TableViewer: Loading data for table: ${activeTable}`);
        let data: any[] = [];
        
        // For relation tables, we need to provide an ID (using first available item)
        if (activeTable === 'roletopermission') {
          console.log('📋 TableViewer: Loading roletopermission data...');
          // Get roles first, then get permissions for the first role
          const roles = await TableService.getRoles();
          if (roles.length > 0) {
            data = await TableService.getRoleToPermission(roles[0].id);
          }
        } else if (activeTable === 'usertorole') {
          console.log('👤 TableViewer: Loading usertorole data...');
          // Get users first, then get roles for the first user
          const users = await TableService.getUsers();
          if (users.length > 0) {
            data = await TableService.getUserToRole(users[0].id);
          }
        } else {
          console.log(`📊 TableViewer: Loading ${activeTable} data using getTableData...`);
          data = await TableService.getTableData(activeTable);
        }
        
        console.log(`✅ TableViewer: Loaded ${data.length} records for ${activeTable}:`, data);
        setTableData(data);
      } catch (error) {
        console.error(`❌ TableViewer: Failed to load ${activeTable} data:`, error);
        setTableData([]);
      }
    };

    loadTableData();
  }, [activeTable]);

  const renderTable = () => {
    const data = tableData;
    console.log(`🎨 TableViewer: Rendering table for ${activeTable} with ${data.length} records`);

    if (activeTable === 'RTK') {
      console.log('🗺️ TableViewer: Rendering RTK table with data:', data);
      return (
        <table className={styles.table} style={{ '--row-count': data.length } as React.CSSProperties}>
          <thead>
            <tr>
              <th>ID</th>
              <th>經度 (Longitude)</th>
              <th>緯度 (Latitude)</th>
              <th>海拔 (Altitude)</th>
              <th>時間戳記 (Timestamp)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item: RTKData) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.longitude.toFixed(4)}</td>
                <td>{item.latitude.toFixed(4)}</td>
                <td>{item.altitude.toFixed(1)}m</td>
                <td>{item.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (data.length === 0) {
      return <div className={styles.noData}>No data available</div>;
    }

    const columns = Object.keys(data[0]);
    return (
      <table className={styles.table} style={{ '--row-count': data.length } as React.CSSProperties}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.id || index}>
              {columns.map((column) => (
                <td key={column}>{item[column]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className={`${styles.tableViewerRoot} ${className || ''}`}>
      <div className={styles.tableContainer}>
        <div className={styles.tabsContainer}>
          {Object.entries(tableConfigs).map(([key, config]) => (
            <button
              key={key}
              className={`${styles.tab} ${activeTable === key ? styles.active : ''}`}
              onClick={() => setActiveTable(key as TableType)}
            >
              {config.title}
            </button>
          ))}
        </div>

        <div className={styles.tableHeader}>
          <h2>{tableConfigs[activeTable].title}</h2>
          <span className={styles.recordCount}>
            {tableData.length} records
          </span>
        </div>

        <div className={styles.tableWrapper}>
          {renderTable()}
        </div>
      </div>
    </div>
  );
}; 