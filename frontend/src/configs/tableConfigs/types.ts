/**
 * @fileoverview 表格配置類型定義
 * 
 * 統一的表格配置類型定義，用於驅動 GenericTableViewer 組件
 * 包含列定義、數據處理、編輯功能等所有相關類型
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { TableType } from '../../stores/tableStore';
import { PaginationParams, PaginatedResponse } from '../../types/pagination';

/**
 * 列配置接口
 */
export interface ColumnConfig {
  /** 列的鍵名 */
  key: string;
  /** 顯示標題 */
  title: string;
  /** 是否可排序 */
  sortable?: boolean;
  /** 自定義格式化函數 */
  formatter?: (value: any, row: any) => string;
  /** 列寬度 */
  width?: string;
  /** 是否在編輯模式中隱藏 */
  hideInEdit?: boolean;
}

/**
 * 數據查詢結果接口
 */
export interface QueryResult<T = any> {
  /** 數據陣列 */
  data: T[] | undefined;
  /** 加載中狀態 */
  isLoading: boolean;
  /** 錯誤信息 */
  error: any;
  /** 重新獲取函數 */
  refetch: () => void;
  /** 分頁數據 */
  paginationData?: PaginatedResponse<T>;
}

/**
 * 自定義行操作配置
 */
export interface CustomAction<T = any> {
  /** 操作標籤 */
  label: string;
  /** 點擊回調函數 */
  onClick: (row: T) => void;
  /** CSS 樣式類 */
  className?: string;
}

/**
 * 表格配置接口
 */
export interface TableConfig<T = any> {
  /** 表格標識 */
  type: TableType;
  /** 表格顯示名稱 */
  title: string;
  /** 列配置 */
  columns: ColumnConfig[];
  /** 數據獲取函數 */
  useData: (params?: PaginationParams) => QueryResult<T>;
  /** 是否支持編輯功能 */
  hasEdit?: boolean;
  /** 是否支持快速操作（如狀態切換） */
  hasQuickActions?: boolean;
  /** 更新數據的 mutation - 必須始終提供，即使返回 null */
  useUpdateMutation: () => any;
  /** 自定義行操作 */
  customActions?: CustomAction<T>[];
  /** 是否懒加載 */
  isLazy?: boolean;
  /** 數據為空時的提示文字 */
  emptyText?: string;
  /** 是否啟用分頁功能，預設為 true */
  enablePagination?: boolean;
  /** 預設每頁數量 */
  defaultPageSize?: number;
  /** 預設排序欄位 */
  defaultSortBy?: string;
  /** 預設排序方向 */
  defaultSortOrder?: 'ASC' | 'DESC';
}

/**
 * 表格配置映射類型
 */
export type TableConfigMap = Record<TableType, TableConfig>;

/**
 * 表格清單項目
 */
export interface TableListItem {
  viewName: TableType;
  title: string;
}

/**
 * 格式化函數類型
 */
export type FormatterFunction = (value: any, row?: any) => string;

/**
 * 格式化函數映射類型
 */
export type FormatterMap = Record<string, FormatterFunction>;