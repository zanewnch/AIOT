/**
 * @fileoverview 歷史歷史資料表格配置
 * 
 * 歷史任務和無人機歷史歷史資料表格的配置定義
 * 包含歷史任務管理和各類歷史歷史資料的查詢顯示功能
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { TableConfig, ColumnConfig } from '../../types';
import { formatters } from '../../formatters';
import { handleClientSidePagination } from '../../utils/paginationHelper';
import { ArchiveTaskQuery } from '../../../../hooks/useArchiveTaskQuery';
import { DronePositionsArchiveQuery } from '../../../../hooks/useDronePositionsArchiveQuery';
import { DroneStatusArchiveQuery } from '../../../../hooks/useDroneStatusArchiveQuery';
import { useGetAllCommandsArchive } from '../../../../hooks/useDroneCommandArchiveQuery';
import droneCommandArchiveQuery from '../../../../hooks/useDroneCommandArchiveQuery';
import { PaginationParams } from '../../../../types/pagination';

/**
 * 歷史任務表格列定義
 * 
 * **設計意圖：**
 * 歷史任務表格需要顯示歷史操作的完整信息，包含：
 * - 任務基本信息：類型、來源表、目標表
 * - 執行統計：總記錄數、已歷史記錄數
 * - 執行狀態：任務狀態追蹤
 * - 時間記錄：開始和完成時間
 */
const archiveTaskColumns: ColumnConfig[] = [
  { key: 'id', title: 'ID', sortable: true, width: '80px' },
  { key: 'job_type', title: '任務類型', sortable: true },
  { key: 'table_name', title: '來源表名', sortable: true },
  { key: 'archive_table_name', title: '歷史表名', sortable: true },
  { key: 'total_records', title: '總記錄數', sortable: true, formatter: formatters.number },
  { key: 'archived_records', title: '已歷史記錄數', sortable: true, formatter: formatters.number },
  { key: 'status', title: '狀態', sortable: true },
  { key: 'started_at', title: '開始時間', sortable: true, formatter: formatters.datetime },
  { key: 'completed_at', title: '完成時間', sortable: true, formatter: formatters.datetime }
];

/**
 * 無人機位置歷史歷史表格列定義
 * 
 * **設計意圖：**
 * 包含原始位置數據的所有欄位，外加歷史特定欄位：
 * - 保留原始 ID 追溯性
 * - 添加歷史時間戳記
 * - 包含環境數據（溫度等）
 */
const dronePositionsArchiveColumns: ColumnConfig[] = [
  { key: 'id', title: 'ID', sortable: true, width: '80px' },
  { key: 'original_id', title: '原始ID', sortable: true },
  { key: 'drone_id', title: '無人機ID', sortable: true },
  { key: 'latitude', title: '緯度', sortable: true, formatter: formatters.coordinate },
  { key: 'longitude', title: '經度', sortable: true, formatter: formatters.coordinate },
  { key: 'altitude', title: '高度', sortable: true, formatter: formatters.altitude },
  { key: 'speed', title: '速度', sortable: true, formatter: formatters.speed },
  { key: 'heading', title: '航向', sortable: true, formatter: formatters.heading },
  { key: 'battery_level', title: '電池電量', sortable: true, formatter: formatters.battery },
  { key: 'signal_strength', title: '信號強度', sortable: true, formatter: formatters.signal },
  { key: 'temperature', title: '環境溫度', sortable: true, formatter: formatters.temperature },
  { key: 'timestamp', title: '記錄時間', sortable: true, formatter: formatters.datetime },
  { key: 'archived_at', title: '歷史時間', sortable: true, formatter: formatters.datetime }
];

/**
 * 無人機狀態歷史歷史表格列定義
 * 
 * **設計意圖：**
 * 包含原始狀態數據的所有欄位，外加歷史時間戳記
 */
const droneStatusArchiveColumns: ColumnConfig[] = [
  { key: 'id', title: 'ID', sortable: true, width: '80px' },
  { key: 'original_id', title: '原始ID', sortable: true },
  { key: 'drone_id', title: '無人機ID', sortable: true },
  { key: 'current_battery_level', title: '電池電量', sortable: true, formatter: formatters.battery },
  { key: 'current_status', title: '狀態', sortable: true },
  { key: 'last_seen', title: '最後連線', sortable: true, formatter: formatters.datetime },
  { key: 'current_altitude', title: '高度', sortable: true, formatter: formatters.altitude },
  { key: 'current_speed', title: '速度', sortable: true, formatter: formatters.speed },
  { key: 'is_connected', title: '連線狀態', sortable: true, formatter: formatters.boolean },
  { key: 'archived_at', title: '歷史時間', sortable: true, formatter: formatters.datetime }
];

/**
 * 無人機指令歷史歷史表格列定義
 * 
 * **設計意圖：**
 * 包含原始指令數據的所有欄位，外加歷史時間戳記
 * 特別注意指令參數的 JSON 格式化顯示
 */
const droneCommandsArchiveColumns: ColumnConfig[] = [
  { key: 'id', title: 'ID', sortable: true, width: '80px' },
  { key: 'original_id', title: '原始ID', sortable: true },
  { key: 'drone_id', title: '無人機ID', sortable: true },
  { key: 'command_type', title: '指令類型', sortable: true, formatter: formatters.commandType },
  { key: 'command_data', title: '指令參數', sortable: false, formatter: formatters.json },
  { key: 'status', title: '狀態', sortable: true, formatter: formatters.commandStatus },
  { key: 'issued_by', title: '發出者', sortable: true },
  { key: 'issued_at', title: '發出時間', sortable: true, formatter: formatters.datetime },
  { key: 'executed_at', title: '執行時間', sortable: true, formatter: formatters.datetime },
  { key: 'completed_at', title: '完成時間', sortable: true, formatter: formatters.datetime },
  { key: 'archived_at', title: '歷史時間', sortable: true, formatter: formatters.datetime }
];

/**
 * 歷史任務表格配置
 * 
 * **功能特性：**
 * - 懒加載模式，避免在不需要時載入大量歷史資料
 * - 支援分頁，預設每頁 10 筆資料
 * - 按開始時間倒序排列，最新任務在前
 * - 支援編輯功能，可修改任務狀態
 */
export const archiveTaskTableConfig: TableConfig = {
  type: 'ArchiveTask',
  title: 'Archive Task Table',
  hasEdit: true,
  isLazy: true,
  enablePagination: true,
  defaultPageSize: 10,
  defaultSortBy: 'started_at',
  defaultSortOrder: 'DESC',
  columns: archiveTaskColumns,
  
  useData: (params?: PaginationParams) => {
    const archiveTaskQuery = new ArchiveTaskQuery();
    // 轉換 PaginationParams 為 ArchiveTaskQueryOptions 兼容格式
    const queryOptions = params ? {
      limit: params.pageSize,
      page: params.page,
      sortBy: params.sortBy as any,
      sortOrder: params.sortOrder?.toLowerCase() as 'asc' | 'desc' | undefined
    } : {};
    const queryResult = archiveTaskQuery.useArchiveTasks(queryOptions);
    
    // 使用客戶端分頁處理
    return handleClientSidePagination({ queryResult, params });
  },
  
  useUpdateMutation: () => {
    const archiveTaskQuery = new ArchiveTaskQuery();
    return archiveTaskQuery.useUpdate();
  }
};

/**
 * 無人機位置歷史歷史表格配置
 * 
 * **功能特性：**
 * - 懒加載模式，避免載入大量歷史位置資料
 * - 支援分頁，預設每頁 50 筆資料（歷史資料量大）
 * - 按歷史時間倒序排列
 * - 支援編輯功能，可修正歷史資料
 */
export const dronePositionsArchiveTableConfig: TableConfig = {
  type: 'DronePositionsArchive',
  title: 'Drone Positions Archive Table',
  hasEdit: true,
  isLazy: true,
  enablePagination: true,
  defaultPageSize: 50,
  defaultSortBy: 'archived_at',
  defaultSortOrder: 'DESC',
  columns: dronePositionsArchiveColumns,
  
  useData: (params?: PaginationParams) => {
    const dronePositionsArchiveQuery = new DronePositionsArchiveQuery();
    const queryResult = dronePositionsArchiveQuery.useAll();
    
    // 使用客戶端分頁處理
    return handleClientSidePagination({ queryResult, params });
  },
  
  useUpdateMutation: () => {
    const dronePositionsArchiveQuery = new DronePositionsArchiveQuery();
    return dronePositionsArchiveQuery.useUpdate();
  }
};

/**
 * 無人機狀態歷史歷史表格配置
 * 
 * **功能特性：**
 * - 懒加載模式
 * - 支援分頁，預設每頁 50 筆資料
 * - 按歷史時間倒序排列
 * - 支援編輯功能
 */
export const droneStatusArchiveTableConfig: TableConfig = {
  type: 'DroneStatusArchive',
  title: 'Drone Status Archive Table',
  hasEdit: true,
  isLazy: true,
  enablePagination: true,
  defaultPageSize: 50,
  defaultSortBy: 'archived_at',
  defaultSortOrder: 'DESC',
  columns: droneStatusArchiveColumns,
  
  useData: (params?: PaginationParams) => {
    const droneStatusArchiveQuery = new DroneStatusArchiveQuery();
    const queryResult = droneStatusArchiveQuery.useAll();
    
    // 使用客戶端分頁處理
    return handleClientSidePagination({ queryResult, params });
  },
  
  useUpdateMutation: () => {
    const droneStatusArchiveQuery = new DroneStatusArchiveQuery();
    return droneStatusArchiveQuery.useUpdate();
  }
};

/**
 * 無人機指令歷史歷史表格配置
 * 
 * **功能特性：**
 * - 懒加載模式
 * - 支援分頁，預設每頁 50 筆資料
 * - 按歷史時間倒序排列
 * - 使用特殊的歷史指令 hook
 */
export const droneCommandsArchiveTableConfig: TableConfig = {
  type: 'DroneCommandsArchive',
  title: 'Drone Commands Archive Table',
  hasEdit: true,
  isLazy: true,
  enablePagination: true,
  defaultPageSize: 50,
  defaultSortBy: 'archived_at',
  defaultSortOrder: 'DESC',
  columns: droneCommandsArchiveColumns,
  
  useData: (params?: PaginationParams) => {
    // 使用特殊的歷史指令 hook
    const archiveParams = params ? {
      limit: params.pageSize,
      sortBy: params.sortBy || 'issued_at',
      sortOrder: (params.sortOrder || 'DESC') as 'ASC' | 'DESC',
      page: params.page
    } : {
      limit: 100,
      sortBy: 'issued_at',
      sortOrder: 'DESC' as 'DESC'
    };
    
    const queryResult = useGetAllCommandsArchive(archiveParams);
    
    // 使用客戶端分頁處理
    return handleClientSidePagination({ queryResult, params });
  },
  
  useUpdateMutation: () => {
    return droneCommandArchiveQuery.useUpdate();
  }
};