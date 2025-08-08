/**
 * @fileoverview 增強版無人機狀態表格視圖組件
 * 
 * 此組件提供無人機狀態的增強表格視圖功能，包括：
 * - 🔄 無限滾動分頁加載
 * - 📊 虛擬化渲染（大數據優化）
 * - 🚀 樂觀更新支持
 * - 📱 響應式設計
 * - 🔍 實時搜索過濾
 * 
 * @author AIOT 開發團隊
 * @since 2025-08-07
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useInfiniteTableData } from '../../../hooks/useInfiniteTableData';
import { useTableUIStore } from '../../../stores/tableStore';
import LoadingSpinner from '../../common/LoadingSpinner';
import { createLogger } from '../../../configs/loggerConfig';
import styles from '../../../styles/TableViewer.module.scss';

const logger = createLogger('EnhancedDroneStatusTableView');

/**
 * 無人機狀態介面定義
 */
interface DroneStatus {
  id: number;
  drone_id?: string;
  flight_status: string;
  battery_level: number;
  signal_strength: number;
  altitude: number;
  speed: number;
  heading: number;
  gps_status: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  timestamp: string;
  last_ping: string;
  is_connected: boolean;
  firmware_version: string;
  createdAt: string;
  updatedAt: string;
}

interface EnhancedDroneStatusTableViewProps {
  /** 是否啟用無限滾動 */
  enableInfiniteScroll?: boolean;
  /** 是否啟用虛擬化 */
  enableVirtualization?: boolean;
  /** 每頁數據量 */
  pageSize?: number;
  /** 表格容器高度 */
  containerHeight?: number;
}

/**
 * 增強版無人機狀態表格視圖組件
 */
export const EnhancedDroneStatusTableView: React.FC<EnhancedDroneStatusTableViewProps> = ({
  enableInfiniteScroll = true,
  enableVirtualization = false,
  pageSize = 50,
  containerHeight = 600,
}) => {
  // 搜索和過濾狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // 表格容器引用
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Zustand stores for UI state
  const { sorting, toggleSortOrder } = useTableUIStore();

  // 🔄 無限滾動數據
  const {
    data: droneStatusData,
    paginationInfo,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error,
    fetchNextPage,
    refetch,
  } = useInfiniteTableData<DroneStatus>({
    endpoint: '/api/drone-status/data',
    pageSize,
    queryKey: ['droneStatuses', 'enhanced'],
    enabled: enableInfiniteScroll,
    queryParams: {
      search: searchTerm || undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined,
      sort: sorting.field,
      order: sorting.order,
    },
  });

  /**
   * 處理排序
   */
  const handleSort = (field: string) => {
    logger.debug('無人機狀態表格排序', { field, currentOrder: sorting.order, operation: 'sort' });
    toggleSortOrder(field as any);
  };

  /**
   * 過濾和搜索數據
   */
  const filteredData = useMemo(() => {
    if (!droneStatusData) return [];
    
    let filtered = [...droneStatusData];
    
    // 搜索過濾
    if (searchTerm) {
      filtered = filtered.filter(drone => 
        drone.drone_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drone.flight_status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drone.firmware_version.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 狀態過濾
    if (filterStatus !== 'all') {
      filtered = filtered.filter(drone => drone.flight_status === filterStatus);
    }
    
    return filtered;
  }, [droneStatusData, searchTerm, filterStatus]);

  /**
   * 虛擬化計算
   */
  const virtualizedData = useMemo(() => {
    const rowHeight = 50; // 每行高度
    const bufferSize = 5;
    
    if (!enableVirtualization) {
      return {
        items: filteredData,
        startIndex: 0,
        endIndex: filteredData.length - 1,
        totalHeight: filteredData.length * rowHeight,
        offsetY: 0,
      };
    }
    
    const startIndex = Math.floor(scrollTop / rowHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / rowHeight) + bufferSize,
      filteredData.length - 1
    );
    
    return {
      items: filteredData.slice(Math.max(0, startIndex - bufferSize), endIndex + 1),
      startIndex: Math.max(0, startIndex - bufferSize),
      endIndex,
      totalHeight: filteredData.length * rowHeight,
      offsetY: Math.max(0, startIndex - bufferSize) * rowHeight,
    };
  }, [filteredData, scrollTop, containerHeight, enableVirtualization]);

  /**
   * 滾動事件處理
   */
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
    
    // 🔄 無限滾動觸發
    if (enableInfiniteScroll && hasNextPage && !isFetchingNextPage) {
      const { scrollTop, scrollHeight, clientHeight } = target;
      const threshold = 200; // 200px 的提前加載閾值
      
      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        logger.info('觸發無限滾動加載', { 
          scrollTop, 
          scrollHeight, 
          clientHeight,
          threshold 
        });
        fetchNextPage();
      }
    }
  }, [enableInfiniteScroll, hasNextPage, isFetchingNextPage, fetchNextPage]);

  /**
   * 獲取狀態顯示樣式
   */
  const getStatusStyle = (status: string) => {
    const statusStyles = {
      'flying': 'bg-green-500 text-white',
      'grounded': 'bg-gray-500 text-white',
      'emergency': 'bg-red-500 text-white',
      'maintenance': 'bg-yellow-500 text-black',
    } as const;
    
    return statusStyles[status as keyof typeof statusStyles] || 'bg-blue-500 text-white';
  };

  /**
   * 渲染表格行
   */
  const renderTableRow = (drone: DroneStatus, index: number) => (
    <tr key={`${drone.id}-${index}`} className={styles.tableRow}>
      <td className={styles.tableCell}>{drone.drone_id || 'N/A'}</td>
      <td className={styles.tableCell}>
        <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(drone.flight_status)}`}>
          {drone.flight_status}
        </span>
      </td>
      <td className={styles.tableCell}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            drone.battery_level > 70 ? 'bg-green-500' : 
            drone.battery_level > 30 ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          {drone.battery_level}%
        </div>
      </td>
      <td className={styles.tableCell}>{drone.signal_strength}%</td>
      <td className={styles.tableCell}>{drone.altitude}m</td>
      <td className={styles.tableCell}>{drone.speed} km/h</td>
      <td className={styles.tableCell}>{drone.heading}°</td>
      <td className={styles.tableCell}>
        <span className={`px-2 py-1 rounded text-xs ${
          drone.is_connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {drone.is_connected ? '已連線' : '離線'}
        </span>
      </td>
      <td className={styles.tableCell}>{drone.firmware_version}</td>
      <td className={styles.tableCell}>
        {new Date(drone.updatedAt).toLocaleString('zh-TW')}
      </td>
    </tr>
  );

  // 載入狀態檢查
  if (isLoading) {
    return <LoadingSpinner message="載入無人機狀態數據中..." />;
  }

  // 錯誤狀態檢查
  if (error) {
    return (
      <div className={styles.error}>
        <span>載入無人機狀態數據時發生錯誤: {error.message}</span>
        <button onClick={() => {
          logger.info('重新載入無人機狀態數據', { operation: 'retry' });
          refetch();
        }} className={styles.retryButton}>
          重試
        </button>
      </div>
    );
  }

  const displayData = virtualizedData.items;

  return (
    <div className={styles.tableContainer}>
      {/* 🔍 搜索和過濾控制區 */}
      <div className={styles.tableControls}>
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索無人機 ID、狀態或固件版本..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">所有狀態</option>
            <option value="flying">飛行中</option>
            <option value="grounded">待機</option>
            <option value="emergency">緊急</option>
            <option value="maintenance">維護</option>
          </select>
        </div>

        {/* 📊 數據統計 */}
        {paginationInfo && (
          <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
            <span>
              顯示 {filteredData.length} / {paginationInfo.totalItems} 筆記錄
              {paginationInfo.loadedPages > 1 && 
                ` (已載入 ${paginationInfo.loadedPages} 頁)`
              }
            </span>
            
            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isFetchingNextPage ? '載入中...' : '載入更多'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 📋 表格內容 */}
      <div 
        ref={tableContainerRef}
        className={styles.tableWrapper}
        style={{ 
          height: enableVirtualization ? `${containerHeight}px` : 'auto',
          overflow: enableVirtualization ? 'auto' : 'visible'
        }}
        onScroll={handleScroll}
      >
        {enableVirtualization && (
          <div style={{ height: `${virtualizedData.totalHeight}px`, position: 'relative' }}>
            <div style={{ transform: `translateY(${virtualizedData.offsetY}px)` }}>
              <table className={styles.table}>
                <thead className={styles.tableHeader}>
                  <tr>
                    <th className={styles.tableHeaderCell} onClick={() => handleSort('drone_id')}>
                      無人機 ID {sorting.field === 'drone_id' && (sorting.order === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className={styles.tableHeaderCell} onClick={() => handleSort('flight_status')}>
                      飛行狀態 {sorting.field === 'flight_status' && (sorting.order === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className={styles.tableHeaderCell} onClick={() => handleSort('battery_level')}>
                      電池電量 {sorting.field === 'battery_level' && (sorting.order === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className={styles.tableHeaderCell} onClick={() => handleSort('signal_strength')}>
                      信號強度 {sorting.field === 'signal_strength' && (sorting.order === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className={styles.tableHeaderCell} onClick={() => handleSort('altitude')}>
                      海拔高度 {sorting.field === 'altitude' && (sorting.order === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className={styles.tableHeaderCell} onClick={() => handleSort('speed')}>
                      飛行速度 {sorting.field === 'speed' && (sorting.order === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className={styles.tableHeaderCell} onClick={() => handleSort('heading')}>
                      飛行方向 {sorting.field === 'heading' && (sorting.order === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className={styles.tableHeaderCell} onClick={() => handleSort('is_connected')}>
                      連線狀態 {sorting.field === 'is_connected' && (sorting.order === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className={styles.tableHeaderCell} onClick={() => handleSort('firmware_version')}>
                      固件版本 {sorting.field === 'firmware_version' && (sorting.order === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className={styles.tableHeaderCell} onClick={() => handleSort('updatedAt')}>
                      最後更新 {sorting.field === 'updatedAt' && (sorting.order === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((drone, index) => renderTableRow(drone, index))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!enableVirtualization && (
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableHeaderCell} onClick={() => handleSort('drone_id')}>
                  無人機 ID {sorting.field === 'drone_id' && (sorting.order === 'asc' ? '↑' : '↓')}
                </th>
                <th className={styles.tableHeaderCell} onClick={() => handleSort('flight_status')}>
                  飛行狀態 {sorting.field === 'flight_status' && (sorting.order === 'asc' ? '↑' : '↓')}
                </th>
                <th className={styles.tableHeaderCell} onClick={() => handleSort('battery_level')}>
                  電池電量 {sorting.field === 'battery_level' && (sorting.order === 'asc' ? '↑' : '↓')}
                </th>
                <th className={styles.tableHeaderCell} onClick={() => handleSort('signal_strength')}>
                  信號強度 {sorting.field === 'signal_strength' && (sorting.order === 'asc' ? '↑' : '↓')}
                </th>
                <th className={styles.tableHeaderCell} onClick={() => handleSort('altitude')}>
                  海拔高度 {sorting.field === 'altitude' && (sorting.order === 'asc' ? '↑' : '↓')}
                </th>
                <th className={styles.tableHeaderCell} onClick={() => handleSort('speed')}>
                  飛行速度 {sorting.field === 'speed' && (sorting.order === 'asc' ? '↑' : '↓')}
                </th>
                <th className={styles.tableHeaderCell} onClick={() => handleSort('heading')}>
                  飛行方向 {sorting.field === 'heading' && (sorting.order === 'asc' ? '↑' : '↓')}
                </th>
                <th className={styles.tableHeaderCell} onClick={() => handleSort('is_connected')}>
                  連線狀態 {sorting.field === 'is_connected' && (sorting.order === 'asc' ? '↑' : '↓')}
                </th>
                <th className={styles.tableHeaderCell} onClick={() => handleSort('firmware_version')}>
                  固件版本 {sorting.field === 'firmware_version' && (sorting.order === 'asc' ? '↑' : '↓')}
                </th>
                <th className={styles.tableHeaderCell} onClick={() => handleSort('updatedAt')}>
                  最後更新 {sorting.field === 'updatedAt' && (sorting.order === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((drone, index) => renderTableRow(drone, index))}
            </tbody>
          </table>
        )}

        {/* 🔄 無限滾動載入指示器 */}
        {isFetchingNextPage && (
          <div className="flex justify-center items-center py-4">
            <LoadingSpinner message="載入更多數據..." />
          </div>
        )}
      </div>

      {/* 📊 無數據提示 */}
      {displayData.length === 0 && !isLoading && (
        <div className={styles.noData}>
          {searchTerm || filterStatus !== 'all' 
            ? '沒有符合篩選條件的數據' 
            : '沒有可用的無人機狀態數據'
          }
        </div>
      )}
    </div>
  );
};