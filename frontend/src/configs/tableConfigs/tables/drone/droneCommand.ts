/**
 * @fileoverview 無人機指令表格配置
 * 
 * 無人機指令數據表格的配置定義
 * 包含指令類型、執行狀態、時間記錄等指令管理信息顯示
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { TableConfig, ColumnConfig } from '../../types';
import { formatters } from '../../formatters';
import { handleClientSidePagination } from '../../utils/paginationHelper';
import { DroneCommandQuery } from '../../../../hooks/useDroneCommandQuery';
import { PaginationParams } from '../../../../types/pagination';

/**
 * 無人機指令表格列定義
 * 
 * **設計意圖：**
 * 指令表格需要顯示無人機指令的完整生命週期，包含：
 * - 指令基本信息：類型和參數
 * - 執行狀態：使用中文化狀態顯示
 * - 時間追蹤：發出、執行、完成時間的完整記錄
 * - 責任追蹤：記錄指令發出者
 * - JSON 格式化：指令參數使用可讀格式顯示
 */
const droneCommandColumns: ColumnConfig[] = [
  { key: 'id', title: 'ID', sortable: true, width: '80px' },
  { key: 'drone_id', title: '無人機ID', sortable: true },
  { key: 'command_type', title: '指令類型', sortable: true, formatter: formatters.commandType },
  { key: 'command_data', title: '指令參數', sortable: false, formatter: formatters.json },
  { key: 'status', title: '狀態', sortable: true, formatter: formatters.commandStatus },
  { key: 'issued_by', title: '發出者', sortable: true },
  { key: 'issued_at', title: '發出時間', sortable: true, formatter: formatters.datetime },
  { key: 'executed_at', title: '執行時間', sortable: true, formatter: formatters.datetime },
  { key: 'completed_at', title: '完成時間', sortable: true, formatter: formatters.datetime }
];

/**
 * 無人機指令表格配置
 * 
 * **功能特性：**
 * - 支援客戶端分頁，預設每頁 20 筆資料
 * - 按發出時間倒序排列，最新指令在前
 * - 支援編輯功能，可修改指令狀態或參數
 * - 適合監控指令執行狀態和除錯指令問題
 * - JSON 參數格式化顯示，便於理解複雜指令內容
 */
export const droneCommandTableConfig: TableConfig = {
  type: 'DroneCommand',
  title: 'Drone Command Table',
  hasEdit: true,
  enablePagination: true,
  defaultPageSize: 20,
  defaultSortBy: 'issued_at',
  defaultSortOrder: 'DESC',
  columns: droneCommandColumns,
  
  useData: (params?: PaginationParams) => {
    const droneCommandQuery = new DroneCommandQuery();
    const queryResult = droneCommandQuery.useAllDroneCommands();
    
    // 使用客戶端分頁處理
    return handleClientSidePagination({ queryResult, params });
  },
  
  useUpdateMutation: () => {
    const droneCommandQuery = new DroneCommandQuery();
    return droneCommandQuery.useUpdate();
  }
};