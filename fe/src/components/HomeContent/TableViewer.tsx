/**
 * TableViewer 組件 - 多功能數據表格檢視器
 * 
 * 這是一個複雜的表格組件，支援以下功能：
 * 1. 多表格類型切換 (RTK, permission, role, user 及其關聯表)
 * 2. RTK 數據的排序功能
 * 3. 各種數據類型的編輯功能
 * 4. 模態框編輯介面
 * 5. 通知系統整合
 */
import React, { useEffect, useState } from 'react';
import styles from '../../styles/TableViewer.module.scss';
import { RTKData } from 'types/IRTKData';
import { TableService } from '../../services/TableService';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { addNotification } from '../../store/notifications/actions';

// 組件屬性定義
interface TableViewerProps {
  className?: string;
}

// 支援的表格類型定義
// RTK: GPS 定位數據表
// permission/role/user: 權限管理相關表格
// roletopermission/usertorole: 關聯表格
type TableType = 'permission' | 'role' | 'roletopermission' | 'user' | 'usertorole' | 'RTK';

// 表格配置 - 定義每個表格的顯示標題
const tableConfigs = {
  permission: { title: 'Permission Table' },
  role: { title: 'Role Table' },
  roletopermission: { title: 'Role to Permission Table' },
  user: { title: 'User Table' },
  usertorole: { title: 'User to Role Table' },
  RTK: { title: 'RTK Table' }
};

// 排序相關類型定義 (僅適用於 RTK 表格)
type SortOrder = 'asc' | 'desc';
type SortField = 'id' | 'longitude' | 'latitude' | 'altitude' | 'timestamp';

export const TableViewer: React.FC<TableViewerProps> = ({ className }) => {
  // === 狀態管理區域 ===
  // 當前選中的表格類型，預設為 RTK 表格
  const [activeTable, setActiveTable] = useState<TableType>('RTK');

  // 當前表格的數據陣列
  const [tableData, setTableData] = useState<any[]>([]);

  // RTK 表格排序相關狀態
  const [sortField, setSortField] = useState<SortField>('timestamp'); // 排序欄位
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');      // 排序順序

  // 編輯模態框相關狀態
  const [showEditModal, setShowEditModal] = useState(false);          // 是否顯示編輯模態框
  const [editingItem, setEditingItem] = useState<any>(null);          // 正在編輯的項目
  const [modalTableType, setModalTableType] = useState<TableType>('RTK'); // 模態框對應的表格類型

  // Redux dispatch hook - 用於觸發 Redux actions
  const dispatch = useDispatch<AppDispatch>();

  // === Effect Hooks 區域 ===

  // 初始化 TableService 的通知回調函數
  /* 
  這段代碼的意思是：
  - 當 addNotification 函數改變時，重新設定
  TableService 的通知回調
  - 如果 addNotification 
  沒有改變，就不重新執行
  - 避免不必要的重複設定，提升性能

  ⚠️ 為什麼需要依賴陣列？

  沒有依賴陣列的話，每次組件重新渲染都會重新
  設定回調，造成性能浪費： */
  useEffect(() => {
    TableService.setNotificationCallback((type, message) => 
      dispatch(addNotification(type, message))
    );
  }, [dispatch]);

  // 當選中的表格類型改變時，重新載入對應的數據
  useEffect(() => {
    const loadTableData = async () => {
      try {
        console.log(`🔄 TableViewer: Loading data for table: ${activeTable}`);
        let data: any[] = [];

        // 關聯表格需要特殊處理 - 需要提供父項目的 ID
        if (activeTable === 'roletopermission') {
          console.log('📋 TableViewer: Loading roletopermission data...');
          // 先獲取角色列表，然後取得第一個角色的權限
          const roles = await TableService.getRoles();
          if (roles.length > 0) {
            data = await TableService.getRoleToPermission(roles[0].id);
          }
        } else if (activeTable === 'usertorole') {
          console.log('👤 TableViewer: Loading usertorole data...');
          // 先獲取用戶列表，然後取得第一個用戶的角色
          const users = await TableService.getUsers();
          if (users.length > 0) {
            data = await TableService.getUserToRole(users[0].id);
          }
        } else {
          // 一般表格直接使用 getTableData 方法
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

  // === 工具函數區域 ===

  /**
   * RTK 數據排序函數
   * @param data - 要排序的數據陣列
   * @param field - 排序欄位
   * @param order - 排序順序 (asc: 升序, desc: 降序)
   * @returns 排序後的數據陣列
   */
  const sortData = (data: any[], field: SortField, order: SortOrder) => {
    return [...data].sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];

      // 時間戳需要特殊處理，轉換為時間戳數值進行比較
      if (field === 'timestamp') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      // 根據排序順序進行比較
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  // === 表格渲染區域 ===

  /**
   * 主要的表格渲染函數
   * 根據不同的表格類型渲染不同的表格內容
   * RTK 表格有特殊的排序功能和詳細的編輯介面
   * 其他表格使用通用的動態渲染逻輯
   */
  const renderTable = () => {
    // 如果是 RTK 表格則應用排序，其他表格使用原始數據
    const data = activeTable === 'RTK' ? sortData(tableData, sortField, sortOrder) : tableData;
    console.log(`🎨 TableViewer: Rendering table for ${activeTable} with ${data.length} records`);

    // === RTK 表格特殊渲染 ===
    if (activeTable === 'RTK') {
      console.log('🗺️ TableViewer: Rendering RTK table with data:', data);

      // RTK 表格可排序的欄位定義
      const sortFields: { field: SortField; label: string }[] = [
        { field: 'id', label: 'ID' },
        { field: 'longitude', label: '經度 (Longitude)' },
        { field: 'latitude', label: '緯度 (Latitude)' },
        { field: 'altitude', label: '海拔 (Altitude)' },
        { field: 'timestamp', label: '時間戳記 (Timestamp)' }
      ];

      return (
        <div>
          {/* RTK 表格排序控制器 */}
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

          {/* RTK 表格主體 */}
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

          {/* === 編輯模態框區域 === */}

          {/* RTK 數據編輯模態框 - 編輯經緯度、海拔、時間戳 */}
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

                          dispatch(addNotification('success', '數據已更新'));
                          setShowEditModal(false);
                        } else {
                          dispatch(addNotification('error', response.message || '更新失敗'));
                        }
                      } catch (error) {
                        console.error('更新數據失敗:', error);
                        dispatch(addNotification('error', '更新數據時發生錯誤'));
                      }
                    }}
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 權限編輯模態框 - 編輯權限名稱和描述 */}
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
                          dispatch(addNotification('success', '權限已更新'));
                          setShowEditModal(false);
                        } else {
                          dispatch(addNotification('error', response.message || '更新失敗'));
                        }
                      } catch (error) {
                        console.error('更新權限失敗:', error);
                        dispatch(addNotification('error', '更新權限時發生錯誤'));
                      }
                    }}
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 角色編輯模態框 - 編輯角色名稱和顯示名稱 */}
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
                          dispatch(addNotification('success', '角色已更新'));
                          setShowEditModal(false);
                        } else {
                          dispatch(addNotification('error', response.message || '更新失敗'));
                        }
                      } catch (error) {
                        console.error('更新角色失敗:', error);
                        dispatch(addNotification('error', '更新角色時發生錯誤'));
                      }
                    }}
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 用戶編輯模態框 - 編輯用戶名和電子郵件 */}
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
                          dispatch(addNotification('success', '用戶已更新'));
                          setShowEditModal(false);
                        } else {
                          dispatch(addNotification('error', response.message || '更新失敗'));
                        }
                      } catch (error) {
                        console.error('更新用戶失敗:', error);
                        dispatch(addNotification('error', '更新用戶時發生錯誤'));
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

    // === 通用表格渲染 ===
    // 處理非 RTK 表格的情況

    if (data.length === 0) {
      return <div className={styles.noData}>No data available</div>;
    }

    // 動態獲取表格欄位
    const columns = Object.keys(data[0]);
    // 判斷是否為關聯表格（關聯表格不提供編輯功能）
    const isRelationTable = activeTable === 'roletopermission' || activeTable === 'usertorole';

    return (
      <table className={styles.table} style={{ '--row-count': data.length } as React.CSSProperties}>
        <thead>
          <tr>
            {/* 動態渲染表頭 */}
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
            {/* 非關聯表格顯示操作欄 */}
            {!isRelationTable && <th>操作 (Actions)</th>}
          </tr>
        </thead>
        <tbody>
          {/* 動態渲染表格內容 */}
          {data.map((item, index) => (
            <tr key={item.id || index}>
              {columns.map((column) => (
                <td key={column}>
                  {/* 處理物件類型的值，轉換為 JSON 字串 */}
                  {typeof item[column] === 'object' && item[column] !== null
                    ? JSON.stringify(item[column])
                    : String(item[column] || '')
                  }
                </td>
              ))}
              {/* 非關聯表格提供編輯按鈕 */}
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
              onClick={() => setActiveTable(key as TableType)}
            >
              {config.title}
            </button>
          ))}
        </div>

        {/* 表格標題和記錄數量顯示 */}
        <div className={styles.tableHeader}>
          <h2>{tableConfigs[activeTable].title}</h2>
          <span className={styles.recordCount}>
            {tableData.length} records
          </span>
        </div>

        {/* 表格內容區域 */}
        <div className={styles.tableWrapper}>
          {renderTable()}
        </div>
      </div>
    </div>
  );
}; 