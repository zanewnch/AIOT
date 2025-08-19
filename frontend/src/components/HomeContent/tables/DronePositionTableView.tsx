/**
 * @fileoverview 無人機位置數據表格檢視組件
 * 
 * 此檔案提供了一個專門用於顯示和編輯無人機位置數據的表格組件。
 * 組件整合了 React Query 數據管理，支援數據載入、排序、編輯和更新功能。
 * 包含完整的 TypeScript 類型定義和錯誤處理機制。
 * 
 * @author AIOT Development Team
 * @version 2.0.0 (migrated to React Query + Zustand)
 * @since 2024-01-01
 */

import React from 'react';
import { DronePositionQuery } from '../../../hooks/useDronePositionQuery';
import { useTableUIStore } from '../../../stores/tableStore';
import { DronePosition } from '../../../types/dronePosition';
import LoadingSpinner from '../../common/LoadingSpinner';
import { createLogger } from '../../../configs/loggerConfig';
import styles from '../../../styles/TableViewer.module.scss';

const logger = createLogger('DronePositionTableView');

/**
 * 無人機位置數據表格檢視組件
 * 
 * 提供完整的無人機位置數據管理功能，包括：
 * - 實時數據載入和顯示
 * - 可排序的表格欄位
 * - 行內編輯功能
 * - 數據驗證和錯誤處理
 * - 地理座標格式化顯示
 * 
 * @returns {JSX.Element} 無人機位置表格檢視的 JSX 元素
 */
export const DronePositionTableView: React.FC = () => {
  // React Query hooks for data management
  const dronePositionQuery = new DronePositionQuery();
  const { data: dronePositionData, isLoading, error, refetch } = dronePositionQuery.useAll();
  const updateDronePositionMutation = dronePositionQuery.useUpdate();

  // Zustand stores for UI state
  const {
    editModal,
    sorting,
    openEditModal,
    closeEditModal,
    updateEditingItem,
    toggleSortOrder
  } = useTableUIStore();

  // Notification store

  /**
   * 處理無人機位置數據編輯操作
   * 
   * @param item - 要編輯的無人機位置數據項目
   */
  const handleEdit = (item: DronePosition) => {
    logger.info('開始編輯無人機位置數據', { id: item.id, latitude: item.latitude, longitude: item.longitude });
    openEditModal('DronePosition', item);
  };

  /**
   * 處理無人機位置數據保存操作
   * 
   * 包含數據驗證和格式檢查
   */
  const handleSave = async () => {
    if (!editModal.editingItem) return;

    // 基本數據驗證
    const item = editModal.editingItem as DronePosition;
    if (!item.id) {
      return;
    }

    logger.info('開始保存無人機位置數據', { id: item.id });

    try {
      // 數據格式化處理
      const formattedData = {
        ...item,
        longitude: parseFloat(item.longitude?.toString() || '0'),
        latitude: parseFloat(item.latitude?.toString() || '0'),
        altitude: parseFloat(item.altitude?.toString() || '0'),
        timestamp: item.timestamp || new Date().toISOString(),
      };

      await updateDronePositionMutation.mutateAsync({
        id: item.id,
        data: formattedData
      });

      logger.info('無人機位置數據更新成功', { id: item.id });
      closeEditModal();
      refetch();
    } catch (error) {
      logger.error('無人機位置數據更新失敗', { id: item.id, error: (error as Error).message });
    }
  };

  /**
   * 處理輸入值變更
   * 
   * @param field - 欄位名稱
   * @param value - 新值
   */
  const handleInputChange = (field: keyof DronePosition, value: any) => {
    if (!editModal.editingItem) return;

    const updatedItem = {
      ...editModal.editingItem,
      [field]: value
    };
    updateEditingItem(updatedItem);
  };

  /**
   * 處理排序功能
   * 
   * @param field - 排序欄位
   */
  const handleSort = (field: string) => {
    logger.debug('無人機位置表格排序', { field, currentOrder: sorting.order });
    toggleSortOrder(field as any);
  };

  /**
   * 格式化地理座標顯示
   * 
   * @param value - 座標值
   * @param decimals - 小數位數
   * @returns 格式化後的座標字串
   */
  const formatCoordinate = (value: number | undefined, decimals: number = 6): string => {
    if (value === undefined || value === null) return 'N/A';
    return Number(value).toFixed(decimals);
  };

  /**
   * 格式化時間戳顯示
   * 
   * @param timestamp - 時間戳
   * @returns 格式化後的時間字串
   */
  const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString('zh-TW');
    } catch {
      return timestamp;
    }
  };

  /**
   * 排序數據
   */
  const sortedData = React.useMemo(() => {
    if (!dronePositionData) return [];

    const sorted = [...dronePositionData];
    sorted.sort((a, b) => {
      const aValue = a[sorting.field as keyof DronePosition];
      const bValue = b[sorting.field as keyof DronePosition];

      // 處理數字類型的排序
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sorting.order === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // 處理字串類型的排序
      const aStr = String(aValue || '');
      const bStr = String(bValue || '');

      if (aStr < bStr) return sorting.order === 'asc' ? -1 : 1;
      if (aStr > bStr) return sorting.order === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [dronePositionData, sorting]);

  // 載入狀態檢查
  if (isLoading) {
    return <LoadingSpinner message="載入無人機位置數據中..." />;
  }

  // 錯誤狀態檢查
  if (error) {
    return (
      <div className={styles.error}>
        <span>載入無人機位置數據時發生錯誤: {(error as Error).message}</span>
        <button onClick={() => refetch()} className={styles.retryButton}>
          重試
        </button>
      </div>
    );
  }

  // 空資料檢查
  if (!dronePositionData || dronePositionData.length === 0) {
    return (
      <div className={styles.noData}>
        <span>目前沒有無人機位置數據</span>
        <button onClick={() => refetch()} className={styles.refreshButton}>
          重新載入
        </button>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      {/* 無人機位置數據表格 */
        <table
          className={styles.table}
          style={{ '--row-count': sortedData.length } as React.CSSProperties}
        >
          <thead>
            <tr>
              <th
                className={`${styles.sortable} ${sorting.field === 'id' ? styles.sorted : ''}`}
                onClick={() => handleSort('id')}
              >
                <div className={styles.headerContent}>
                  <span>ID</span>
                  {sorting.field === 'id' && (
                    <span className={styles.sortIcon}>
                      {sorting.order === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                className={`${styles.sortable} ${sorting.field === 'longitude' ? styles.sorted : ''}`}
                onClick={() => handleSort('longitude')}
              >
                <div className={styles.headerContent}>
                  <span>經度 (Longitude)</span>
                  {sorting.field === 'longitude' && (
                    <span className={styles.sortIcon}>
                      {sorting.order === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                className={`${styles.sortable} ${sorting.field === 'latitude' ? styles.sorted : ''}`}
                onClick={() => handleSort('latitude')}
              >
                <div className={styles.headerContent}>
                  <span>緯度 (Latitude)</span>
                  {sorting.field === 'latitude' && (
                    <span className={styles.sortIcon}>
                      {sorting.order === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                className={`${styles.sortable} ${sorting.field === 'altitude' ? styles.sorted : ''}`}
                onClick={() => handleSort('altitude')}
              >
                <div className={styles.headerContent}>
                  <span>海拔 (Altitude)</span>
                  {sorting.field === 'altitude' && (
                    <span className={styles.sortIcon}>
                      {sorting.order === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                className={`${styles.sortable} ${sorting.field === 'timestamp' ? styles.sorted : ''}`}
                onClick={() => handleSort('timestamp')}
              >
                <div className={styles.headerContent}>
                  <span>時間戳記</span>
                  {sorting.field === 'timestamp' && (
                    <span className={styles.sortIcon}>
                      {sorting.order === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className={styles.actions}>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item: DronePosition, index: number) => (
              <tr key={item.id || index} className={styles.tableRow}>
                <td className={styles.tableCell}>{item.id}</td>
                <td className={styles.tableCell}>{formatCoordinate(item.longitude)}</td>
                <td className={styles.tableCell}>{formatCoordinate(item.latitude)}</td>
                <td className={styles.tableCell}>{formatCoordinate(item.altitude, 2)} m</td>
                <td className={styles.tableCell}>{formatTimestamp(item.timestamp)}</td>
                <td className={styles.tableCell}>
                  <button
                    onClick={() => handleEdit(item)}
                    className={styles.editButton}
                  >
                    編輯
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      }
{editModal.isOpen &&
        editModal.tableType === 'DronePosition' &&
        editModal.editingItem && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3>編輯無人機位置數據</h3>
                <button
                  onClick={closeEditModal}
                  className={styles.closeButton}
                >
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.inputGroup}>
                  <label htmlFor="id">ID:</label>
                  <input
                    id="id"
                    type="text"
                    value={editModal.editingItem.id || ''}
                    onChange={(e) => handleInputChange('id', e.target.value)}
                    className={styles.input}
                    disabled
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="longitude">經度 (Longitude):</label>
                  <input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={editModal.editingItem.longitude || ''}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    className={styles.input}
                    placeholder="例如：121.123456"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="latitude">緯度 (Latitude):</label>
                  <input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={editModal.editingItem.latitude || ''}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    className={styles.input}
                    placeholder="例如：25.123456"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="altitude">海拔 (Altitude, 公尺):</label>
                  <input
                    id="altitude"
                    type="number"
                    step="0.01"
                    value={editModal.editingItem.altitude || ''}
                    onChange={(e) => handleInputChange('altitude', e.target.value)}
                    className={styles.input}
                    placeholder="例如：100.50"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="timestamp">時間戳記:</label>
                  <input
                    id="timestamp"
                    type="datetime-local"
                    value={editModal.editingItem.timestamp ?
                      new Date(editModal.editingItem.timestamp).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleInputChange('timestamp', new Date(e.target.value).toISOString())}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  onClick={closeEditModal}
                  className={styles.cancelButton}
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className={styles.saveButton}
                  disabled={updateDronePositionMutation.isPending}
                >
                  {updateDronePositionMutation.isPending ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};