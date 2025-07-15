import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { loadRoleToPermissionData } from '../../../store/tableSlice';
import styles from '../../../styles/TableViewer.module.scss';

export const RoleToPermissionTableView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    roleToPermissionData, 
    loading, 
    error 
  } = useSelector((state: RootState) => state.table);

  useEffect(() => {
    dispatch(loadRoleToPermissionData());
  }, [dispatch]);

  if (loading.roleToPermission) {
    return <div className={styles.loading}>Loading role to permission data...</div>;
  }

  if (error.roleToPermission) {
    return <div className={styles.error}>Error: {error.roleToPermission}</div>;
  }

  if (roleToPermissionData.length === 0) {
    return <div className={styles.noData}>No role to permission data available</div>;
  }

  // 動態獲取表格欄位
  const columns = Object.keys(roleToPermissionData[0]);

  return (
    <div>
      {/* 表格 */}
      <table className={styles.table} style={{ '--row-count': roleToPermissionData.length } as React.CSSProperties}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roleToPermissionData.map((item, index) => (
            <tr key={item.id || index}>
              {columns.map((column) => (
                <td key={column}>
                  {typeof item[column] === 'object' && item[column] !== null
                    ? JSON.stringify(item[column])
                    : String(item[column] || '')
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