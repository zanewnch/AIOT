/**
 * @fileoverview 無人機狀態表格配置
 * 
 * 無人機狀態數據表格的配置定義
 * 包含電池電量、連線狀態、飛行狀態等系統狀態信息顯示
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { TableConfig, ColumnConfig } from '../../types';
import { formatters } from '../../formatters';
import { handleClientSidePagination } from '../../utils/paginationHelper';
import { DroneStatusQuery } from '../../../../hooks/useDroneStatusQuery';
import { PaginationParams } from '../../../../types/pagination';

/**
 * 無人機狀態表格列定義
 * 
 * **設計意圖：**
 * 狀態表格需要顯示無人機的系統狀態信息，包含：
 * - 電池和電源狀態：使用百分比格式化
 * - 連線狀態：使用布林值中文化顯示
 * - 飛行參數：使用相應單位格式化
 * - 環境數據：溫度使用攝氏度格式化
 * - 時間資訊：使用繁體中文本地化時間格式
 */
const droneStatusColumns: ColumnConfig[] = [
  { key: 'id', title: 'ID', sortable: true, width: '80px' },
  { key: 'drone_id', title: '無人機ID', sortable: true },
  { key: 'current_battery_level', title: '電池電量', sortable: true, formatter: formatters.battery },
  { key: 'current_status', title: '狀態', sortable: true },
  { key: 'last_seen', title: '最後連線', sortable: true, formatter: formatters.datetime },
  { key: 'current_altitude', title: '當前高度', sortable: true, formatter: formatters.altitude },
  { key: 'current_speed', title: '當前速度', sortable: true, formatter: formatters.speed },
  { key: 'is_connected', title: '連線狀態', sortable: true, formatter: formatters.boolean },
  { key: 'temperature', title: '溫度', sortable: true, formatter: formatters.temperature }
];

/**
 * 無人機狀態表格配置
 * 
 * **功能特性：**
 * - 支援客戶端分頁，預設每頁 20 筆資料
 * - 按最後連線時間倒序排列，最近活動的無人機在前
 * - 支援編輯功能，可修正狀態數據
 * - 適合監控無人機的健康狀態和連線品質
 */
export const droneStatusTableConfig: TableConfig = {
  type: 'DroneStatus',
  title: 'Drone Status Table',
  hasEdit: true,
  enablePagination: true,
  defaultPageSize: 20,
  defaultSortBy: 'last_seen',
  defaultSortOrder: 'DESC',
  columns: droneStatusColumns,
  
  useData: (params?: PaginationParams) => {
    const droneStatusQuery = new DroneStatusQuery();
    const queryResult = droneStatusQuery.useAll();
    
    // 使用客戶端分頁處理
    return handleClientSidePagination({ queryResult, params });
  },
  
  useUpdateMutation: () => {
    const droneStatusQuery = new DroneStatusQuery();
    return droneStatusQuery.useUpdate();
  }
};