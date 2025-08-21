/**
 * @fileoverview 表格配置統一導出入口
 * 
 * 統一導出所有表格配置相關的模組和功能
 * 提供簡潔的 API 介面供外部使用
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

// 類型定義
export type {
  TableConfig,
  ColumnConfig,
  QueryResult,
  CustomAction,
  TableConfigMap,
  TableListItem,
  FormatterFunction,
  FormatterMap
} from './types';

// 格式化函數
export { formatters } from './formatters';

// 分頁助手函數
export {
  handleClientSidePagination,
  handleServerSidePagination,
  handlePagination,
  createPaginationParams,
  DEFAULT_PAGINATION_PARAMS
} from './utils/paginationHelper';

// RBAC 表格配置
export {
  permissionTableConfig,
  roleTableConfig,
  userTableConfig,
  roleToPermissionTableConfig,
  userToRoleTableConfig
} from './tables/rbac';

// 無人機表格配置
export {
  dronePositionTableConfig,
  droneStatusTableConfig,
  droneCommandTableConfig
} from './tables/drone';

// 歷史歷史資料表格配置
export {
  archiveTaskTableConfig,
  dronePositionsArchiveTableConfig,
  droneStatusArchiveTableConfig,
  droneCommandsArchiveTableConfig
} from './tables/archive';

// 用戶表格配置
export {
  userPreferenceTableConfig
} from './tables/user';

// 導入必要的類型
import { TableType } from '../../stores/tableStore';

// 表格配置映射
import {
  permissionTableConfig,
  roleTableConfig,
  userTableConfig,
  roleToPermissionTableConfig,
  userToRoleTableConfig
} from './tables/rbac';

import {
  dronePositionTableConfig,
  droneStatusTableConfig,
  droneCommandTableConfig
} from './tables/drone';

import {
  archiveTaskTableConfig,
  dronePositionsArchiveTableConfig,
  droneStatusArchiveTableConfig,
  droneCommandsArchiveTableConfig
} from './tables/archive';

import {
  userPreferenceTableConfig
} from './tables/user';

import { TableConfig, TableListItem } from './types';

/**
 * 表格配置映射對象
 * 
 * **設計意圖：**
 * 統一管理所有表格配置，提供類型安全的配置查詢介面
 * 使用 Record 類型確保所有 TableType 都有對應的配置
 */
const TABLE_CONFIG_MAP: Record<TableType, TableConfig> = {
  // RBAC 相關表格
  permission: permissionTableConfig,
  role: roleTableConfig,
  user: userTableConfig,
  roletopermission: roleToPermissionTableConfig,
  usertorole: userToRoleTableConfig,

  // 無人機相關表格
  DronePosition: dronePositionTableConfig,
  DroneStatus: droneStatusTableConfig,
  DroneCommand: droneCommandTableConfig,

  // 歷史歷史資料相關表格
  ArchiveTask: archiveTaskTableConfig,
  DronePositionsArchive: dronePositionsArchiveTableConfig,
  DroneStatusArchive: droneStatusArchiveTableConfig,
  DroneCommandsArchive: droneCommandsArchiveTableConfig,

  // 用戶相關表格
  UserPreference: userPreferenceTableConfig
};

/**
 * 獲取表格配置
 * 
 * 根據表格類型獲取對應的表格配置
 * 替代原始的 getTableConfig 函數，提供更好的類型安全
 * 
 * @param tableType 表格類型
 * @returns 對應的表格配置，如果不存在則返回 null
 * 
 * @example
 * ```typescript
 * const config = getTableConfig('permission');
 * if (config) {
 *   console.log(config.title); // "Permission Table"
 * }
 * ```
 */
export const getTableConfig = (tableType: TableType): TableConfig | null => {
  return TABLE_CONFIG_MAP[tableType] || null;
};

/**
 * 獲取所有表格配置的列表
 * 
 * 返回所有可用表格類型和對應標題的列表
 * 適用於動態生成表格選擇器或導航功能
 * 
 * @returns 表格類型和標題的陣列
 * 
 * @example
 * ```typescript
 * const tableList = getAllTableConfigs();
 * // [{ viewName: 'permission', title: 'Permission Table' }, ...]
 * ```
 */
export const getAllTableConfigs = (): TableListItem[] => {
  const tableTypes: TableType[] = [
    'permission',
    'role',
    'user',
    'roletopermission',
    'usertorole',
    'DronePosition',
    'DroneStatus',
    'DroneCommand',
    'UserPreference',
    'ArchiveTask',
    'DronePositionsArchive',
    'DroneStatusArchive',
    'DroneCommandsArchive'
  ];

  return tableTypes.map(type => {
    const config = getTableConfig(type);
    return {
      viewName: type,
      title: config?.title || type
    };
  });
};