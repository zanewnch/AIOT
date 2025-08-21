/**
 * @fileoverview 無人機位置表格配置
 * 
 * 無人機位置數據表格的配置定義
 * 包含 GPS 座標、高度、速度、電池等實時位置信息顯示
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { TableConfig, ColumnConfig } from '../../types';
import { formatters } from '../../formatters';
import { handleClientSidePagination } from '../../utils/paginationHelper';
import { DronePositionQuery } from '../../../../hooks/useDronePositionQuery';
import { PaginationParams } from '../../../../types/pagination';

/**
 * 無人機位置表格列定義
 * 
 * **設計意圖：**
 * 位置表格需要顯示無人機的實時位置信息，包含：
 * - GPS 座標（緯度、經度）：使用高精度 6 位小數格式化
 * - 飛行參數（高度、速度、航向）：使用相應單位格式化
 * - 系統狀態（電池、信號）：使用百分比和 dBm 格式化
 * - 時間戳記：使用繁體中文本地化時間格式
 */
const dronePositionColumns: ColumnConfig[] = [
  { key: 'id', title: 'ID', sortable: true, width: '80px' },
  { key: 'drone_id', title: '無人機ID', sortable: true },
  { key: 'latitude', title: '緯度', sortable: true, formatter: formatters.coordinate },
  { key: 'longitude', title: '經度', sortable: true, formatter: formatters.coordinate },
  { key: 'altitude', title: '高度', sortable: true, formatter: formatters.altitude },
  { key: 'speed', title: '速度', sortable: true, formatter: formatters.speed },
  { key: 'heading', title: '航向', sortable: true, formatter: formatters.heading },
  { key: 'battery_level', title: '電池電量', sortable: true, formatter: formatters.battery },
  { key: 'signal_strength', title: '信號強度', sortable: true, formatter: formatters.signal },
  { key: 'timestamp', title: '時間戳記', sortable: true, formatter: formatters.datetime }
];

/**
 * 無人機位置表格配置
 * 
 * **功能特性：**
 * - 支援客戶端分頁，預設每頁 20 筆資料（位置數據較多）
 * - 按時間戳倒序排列，最新位置記錄在前
 * - 支援編輯功能，可修正位置數據
 * - 實時數據更新，適合監控無人機飛行狀態
 */
export const dronePositionTableConfig: TableConfig = {
  type: 'DronePosition',
  title: 'Drone Position Table',
  hasEdit: true,
  enablePagination: true,
  defaultPageSize: 20,
  defaultSortBy: 'timestamp',
  defaultSortOrder: 'DESC',
  columns: dronePositionColumns,
  
  useData: (params?: PaginationParams) => {
    const dronePositionQuery = new DronePositionQuery();
    const queryResult = dronePositionQuery.useAll();
    
    // 使用客戶端分頁處理
    return handleClientSidePagination({ queryResult, params });
  },
  
  useUpdateMutation: () => {
    const dronePositionQuery = new DronePositionQuery();
    return dronePositionQuery.useUpdate();
  }
};