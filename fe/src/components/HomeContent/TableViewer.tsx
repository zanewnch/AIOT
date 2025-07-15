import React, { useEffect, useState } from 'react';
import styles from '../../styles/TableViewer.module.scss';
import { RTKData } from 'types/IRTKData';
import { Role, Permission, User } from '../../services/TableService';
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

type SortOrder = 'asc' | 'desc';
type SortField = 'id' | 'longitude' | 'latitude' | 'altitude' | 'timestamp';

export const TableViewer: React.FC<TableViewerProps> = ({ className }) => {
  const [activeTable, setActiveTable] = useState<TableType>('RTK');
  const [tableData, setTableData] = useState<any[]>([]);
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalTableType, setModalTableType] = useState<TableType>('RTK');
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

  const sortData = (data: any[], field: SortField, order: SortOrder) => {
    return [...data].sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];
      
      if (field === 'timestamp') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  const renderTable = () => {
    const data = activeTable === 'RTK' ? sortData(tableData, sortField, sortOrder) : tableData;
    console.log(`🎨 TableViewer: Rendering table for ${activeTable} with ${data.length} records`);

    if (activeTable === 'RTK') {
      console.log('🗺️ TableViewer: Rendering RTK table with data:', data);
      
      const sortFields: { field: SortField; label: string }[] = [
        { field: 'id', label: 'ID' },
        { field: 'longitude', label: '經度 (Longitude)' },
        { field: 'latitude', label: '緯度 (Latitude)' },
        { field: 'altitude', label: '海拔 (Altitude)' },
        { field: 'timestamp', label: '時間戳記 (Timestamp)' }
      ];
      
      return (
        <div>
          <div className={styles.sortControls}>
            {sortFields.map(({ field, label }) => (
              <div key={field} className={styles.sortDropdown}>
                <label>{label}:</label>
                <select 
                  value={sortField === field ? sortOrder : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSortField(field);
                      setSortOrder(e.target.value as SortOrder);
                    }
                  }}
                >
                  <option value="">-</option>
                  <option value="asc">由小到大</option>
                  <option value="desc">由大到小</option>
                </select>
              </div>
            ))}
          </div>
          <table className={styles.table} style={{ '--row-count': data.length } as React.CSSProperties}>
            <thead>
              <tr>
                <th>ID</th>
                <th>經度 (Longitude)</th>
                <th>緯度 (Latitude)</th>
                <th>海拔 (Altitude)</th>
                <th>時間戳記 (Timestamp)</th>
                <th>操作 (Actions)</th>
              </tr>
            </thead>
          <tbody>
            {data.map((item: RTKData) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.longitude ? item.longitude.toFixed(4) : 'N/A'}</td>
                <td>{item.latitude ? item.latitude.toFixed(4) : 'N/A'}</td>
                <td>{item.altitude ? `${item.altitude.toFixed(1)}m` : 'N/A'}</td>
                <td>{item.timestamp || 'N/A'}</td>
                <td>
                  <button 
                    className={styles.editButton}
                    onClick={() => {
                      setEditingItem(item);
                      setShowEditModal(true);
                    }}
                  >
                    編輯
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* RTK Edit Modal */}
        {showEditModal && editingItem && modalTableType === 'RTK' && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>編輯 RTK 數據</h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowEditModal(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>ID:</label>
                  <input 
                    type="text" 
                    value={editingItem.id || ''} 
                    disabled 
                    className={styles.disabledInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>經度 (Longitude):</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    value={editingItem.longitude || ''} 
                    onChange={(e) => setEditingItem({
                      ...editingItem, 
                      longitude: parseFloat(e.target.value) || 0
                    })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>緯度 (Latitude):</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    value={editingItem.latitude || ''} 
                    onChange={(e) => setEditingItem({
                      ...editingItem, 
                      latitude: parseFloat(e.target.value) || 0
                    })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>海拔 (Altitude):</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={editingItem.altitude || ''} 
                    onChange={(e) => setEditingItem({
                      ...editingItem, 
                      altitude: parseFloat(e.target.value) || 0
                    })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>時間戳記 (Timestamp):</label>
                  <input 
                    type="text" 
                    value={editingItem.timestamp || ''} 
                    onChange={(e) => setEditingItem({
                      ...editingItem, 
                      timestamp: e.target.value
                    })}
                    className={styles.input}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button 
                  className={styles.cancelButton}
                  onClick={() => setShowEditModal(false)}
                >
                  取消
                </button>
                <button 
                  className={styles.saveButton}
                  onClick={async () => {
                    try {
                      if (!editingItem) return;
                      
                      console.log('保存數據:', editingItem);
                      
                      // 調用 API 更新數據
                      const response = await TableService.updateRTKData(editingItem.id, {
                        latitude: editingItem.latitude,
                        longitude: editingItem.longitude,
                        altitude: editingItem.altitude,
                        timestamp: editingItem.timestamp
                      });
                      
                      if (response.success) {
                        // 更新本地數據
                        setTableData(prevData => 
                          prevData.map(item => 
                            item.id === editingItem.id ? editingItem : item
                          )
                        );
                        
                        addNotification('success', '數據已更新');
                        setShowEditModal(false);
                      } else {
                        addNotification('error', response.message || '更新失敗');
                      }
                    } catch (error) {
                      console.error('更新數據失敗:', error);
                      addNotification('error', '更新數據時發生錯誤');
                    }
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Permission Edit Modal */}
        {showEditModal && editingItem && modalTableType === 'permission' && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>編輯權限</h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowEditModal(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>ID:</label>
                  <input 
                    type="text" 
                    value={editingItem.id || ''} 
                    disabled 
                    className={styles.disabledInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>名稱 (Name):</label>
                  <input 
                    type="text" 
                    value={editingItem.name || ''} 
                    onChange={(e) => setEditingItem({
                      ...editingItem, 
                      name: e.target.value
                    })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>描述 (Description):</label>
                  <textarea 
                    value={editingItem.description || ''} 
                    onChange={(e) => setEditingItem({
                      ...editingItem, 
                      description: e.target.value
                    })}
                    className={styles.input}
                    rows={3}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button 
                  className={styles.cancelButton}
                  onClick={() => setShowEditModal(false)}
                >
                  取消
                </button>
                <button 
                  className={styles.saveButton}
                  onClick={async () => {
                    try {
                      if (!editingItem) return;
                      
                      const response = await TableService.updatePermission(editingItem.id, {
                        name: editingItem.name,
                        description: editingItem.description
                      });
                      
                      if (response.success) {
                        setTableData(prevData => 
                          prevData.map(item => 
                            item.id === editingItem.id ? editingItem : item
                          )
                        );
                        addNotification('success', '權限已更新');
                        setShowEditModal(false);
                      } else {
                        addNotification('error', response.message || '更新失敗');
                      }
                    } catch (error) {
                      console.error('更新權限失敗:', error);
                      addNotification('error', '更新權限時發生錯誤');
                    }
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Role Edit Modal */}
        {showEditModal && editingItem && modalTableType === 'role' && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>編輯角色</h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowEditModal(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>ID:</label>
                  <input 
                    type="text" 
                    value={editingItem.id || ''} 
                    disabled 
                    className={styles.disabledInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>名稱 (Name):</label>
                  <input 
                    type="text" 
                    value={editingItem.name || ''} 
                    onChange={(e) => setEditingItem({
                      ...editingItem, 
                      name: e.target.value
                    })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>顯示名稱 (Display Name):</label>
                  <input 
                    type="text" 
                    value={editingItem.displayName || ''} 
                    onChange={(e) => setEditingItem({
                      ...editingItem, 
                      displayName: e.target.value
                    })}
                    className={styles.input}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button 
                  className={styles.cancelButton}
                  onClick={() => setShowEditModal(false)}
                >
                  取消
                </button>
                <button 
                  className={styles.saveButton}
                  onClick={async () => {
                    try {
                      if (!editingItem) return;
                      
                      const response = await TableService.updateRole(editingItem.id, {
                        name: editingItem.name,
                        displayName: editingItem.displayName
                      });
                      
                      if (response.success) {
                        setTableData(prevData => 
                          prevData.map(item => 
                            item.id === editingItem.id ? editingItem : item
                          )
                        );
                        addNotification('success', '角色已更新');
                        setShowEditModal(false);
                      } else {
                        addNotification('error', response.message || '更新失敗');
                      }
                    } catch (error) {
                      console.error('更新角色失敗:', error);
                      addNotification('error', '更新角色時發生錯誤');
                    }
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Edit Modal */}
        {showEditModal && editingItem && modalTableType === 'user' && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>編輯用戶</h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowEditModal(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>ID:</label>
                  <input 
                    type="text" 
                    value={editingItem.id || ''} 
                    disabled 
                    className={styles.disabledInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>用戶名 (Username):</label>
                  <input 
                    type="text" 
                    value={editingItem.username || ''} 
                    onChange={(e) => setEditingItem({
                      ...editingItem, 
                      username: e.target.value
                    })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>電子郵件 (Email):</label>
                  <input 
                    type="email" 
                    value={editingItem.email || ''} 
                    onChange={(e) => setEditingItem({
                      ...editingItem, 
                      email: e.target.value
                    })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>密碼哈希 (Password Hash):</label>
                  <input 
                    type="text" 
                    value={editingItem.passwordHash || ''} 
                    disabled
                    className={styles.disabledInput}
                  />
                  <small>密碼哈希不可直接編輯</small>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button 
                  className={styles.cancelButton}
                  onClick={() => setShowEditModal(false)}
                >
                  取消
                </button>
                <button 
                  className={styles.saveButton}
                  onClick={async () => {
                    try {
                      if (!editingItem) return;
                      
                      const response = await TableService.updateUser(editingItem.id, {
                        username: editingItem.username,
                        email: editingItem.email
                      });
                      
                      if (response.success) {
                        setTableData(prevData => 
                          prevData.map(item => 
                            item.id === editingItem.id ? editingItem : item
                          )
                        );
                        addNotification('success', '用戶已更新');
                        setShowEditModal(false);
                      } else {
                        addNotification('error', response.message || '更新失敗');
                      }
                    } catch (error) {
                      console.error('更新用戶失敗:', error);
                      addNotification('error', '更新用戶時發生錯誤');
                    }
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      );
    }

    if (data.length === 0) {
      return <div className={styles.noData}>No data available</div>;
    }

    const columns = Object.keys(data[0]);
    const isRelationTable = activeTable === 'roletopermission' || activeTable === 'usertorole';
    
    return (
      <table className={styles.table} style={{ '--row-count': data.length } as React.CSSProperties}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
            {!isRelationTable && <th>操作 (Actions)</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.id || index}>
              {columns.map((column) => (
                <td key={column}>
                  {typeof item[column] === 'object' && item[column] !== null 
                    ? JSON.stringify(item[column]) 
                    : String(item[column] || '')
                  }
                </td>
              ))}
              {!isRelationTable && (
                <td>
                  <button 
                    className={styles.editButton}
                    onClick={() => {
                      setEditingItem(item);
                      setModalTableType(activeTable);
                      setShowEditModal(true);
                    }}
                  >
                    編輯
                  </button>
                </td>
              )}
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