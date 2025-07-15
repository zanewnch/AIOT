import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { loadUserToRoleData } from '../../../store/tableSlice';
import styles from '../../../styles/TableViewer.module.scss';

export const UserToRoleTableView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    userToRoleData, 
    loading, 
    error 
  } = useSelector((state: RootState) => state.table);

  useEffect(() => {
    dispatch(loadUserToRoleData());
  }, [dispatch]);

  if (loading.userToRole) {
    return <div className={styles.loading}>Loading user to role data...</div>;
  }

  if (error.userToRole) {
    return <div className={styles.error}>Error: {error.userToRole}</div>;
  }

  if (userToRoleData.length === 0) {
    return <div className={styles.noData}>No user to role data available</div>;
  }

  // 動態獲取表格欄位
  const columns = Object.keys(userToRoleData[0]);

  return (
    <div>
      {/* 表格 */}
      <table className={styles.table} style={{ '--row-count': userToRoleData.length } as React.CSSProperties}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {userToRoleData.map((item, index) => (
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