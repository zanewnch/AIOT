import React, { useEffect, useState } from 'react';
import styles from '../styles/TableViewer.module.scss';
import { RTKData } from 'types/IRTKData';
import { TableService } from '../services/TableService';


interface TableViewerProps {
  className?: string;
}

const dummyRTKData: RTKData[] = [
  { id: 1, longitude: 121.5654, latitude: 25.0330, altitude: 45.2, timestamp: '2024-01-15 10:30:15' },
  { id: 2, longitude: 121.5204, latitude: 25.0478, altitude: 38.7, timestamp: '2024-01-15 10:31:22' },
  { id: 3, longitude: 121.5436, latitude: 25.0176, altitude: 52.1, timestamp: '2024-01-15 10:32:45' },
  { id: 4, longitude: 121.5581, latitude: 25.0408, altitude: 41.8, timestamp: '2024-01-15 10:33:18' },
  { id: 5, longitude: 121.5123, latitude: 25.0267, altitude: 36.4, timestamp: '2024-01-15 10:34:56' },
  { id: 6, longitude: 121.5789, latitude: 25.0512, altitude: 48.9, timestamp: '2024-01-15 10:35:33' },
  { id: 7, longitude: 121.5345, latitude: 25.0389, altitude: 44.6, timestamp: '2024-01-15 10:36:41' },
  { id: 8, longitude: 121.5667, latitude: 25.0445, altitude: 39.3, timestamp: '2024-01-15 10:37:28' },
];

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

  useEffect(() => {
    const loadTableData = async () => {
      try {
        let data: any[] = [];
        
        // For relation tables, we need to provide an ID (using first available item)
        if (activeTable === 'roletopermission') {
          // Get roles first, then get permissions for the first role
          const roles = await TableService.getRoles();
          if (roles.length > 0) {
            data = await TableService.getRoleToPermission(roles[0].id);
          }
        } else if (activeTable === 'usertorole') {
          // Get users first, then get roles for the first user
          const users = await TableService.getUsers();
          if (users.length > 0) {
            data = await TableService.getUserToRole(users[0].id);
          }
        } else {
          data = await TableService.getTableData(activeTable);
        }
        
        setTableData(data);
      } catch (error) {
        console.error(`Failed to load ${activeTable} data:`, error);
        setTableData([]);
      }
    };

    loadTableData();
  }, [activeTable]);

  const renderTable = () => {
    const data = tableData.length > 0 ? tableData : (activeTable === 'RTK' ? dummyRTKData : []);

    if (activeTable === 'RTK') {
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
            {tableData.length > 0 ? tableData.length : (activeTable === 'RTK' ? dummyRTKData.length : 0)} records
          </span>
        </div>

        <div className={styles.tableWrapper}>
          {renderTable()}
        </div>
      </div>
    </div>
  );
}; 