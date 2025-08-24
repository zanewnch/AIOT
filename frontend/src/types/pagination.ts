/**
 * @fileoverview 分頁查詢相關類型定義
 * 
 * 定義分頁查詢的通用介面和類型
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

/**
 * 分頁請求參數
 */
export interface PaginationParams {
  /** 頁碼，從 1 開始 */
  page: number;
  /** 每頁數量 */
  pageSize: number;
  /** 排序欄位 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 分頁回應資料
 */
export interface PaginatedResponse<T> {
  /** 資料列表 */
  data: T[];
  /** 總記錄數 */
  total: number;
  /** 當前頁碼 */
  page: number;
  /** 每頁數量 */
  pageSize: number;
  /** 總頁數 */
  totalPages: number;
  /** 是否有下一頁 */
  hasNextPage: boolean;
  /** 是否有上一頁 */
  hasPrevPage: boolean;
}

/**
 * 分頁查詢選項
 */
export interface PaginationOptions {
  /** 是否啟用分頁，預設為 true */
  enabled?: boolean;
  /** 預設每頁數量 */
  defaultPageSize?: number;
  /** 預設排序欄位 */
  defaultSortBy?: string;
  /** 預設排序方向 */
  defaultSortOrder?: 'ASC' | 'DESC';
}

/**
 * 分頁控制狀態
 */
export interface PaginationState {
  /** 當前頁碼 */
  currentPage: number;
  /** 每頁數量 */
  pageSize: number;
  /** 總記錄數 */
  total: number;
  /** 總頁數 */
  totalPages: number;
  /** 排序欄位 */
  sortBy: string | null;
  /** 排序方向 */
  sortOrder: 'ASC' | 'DESC';
  /** 是否可以上一頁 */
  canPreviousPage: boolean;
  /** 是否可以下一頁 */
  canNextPage: boolean;
}

/**
 * 分頁操作方法
 */
export interface PaginationActions {
  /** 跳轉到指定頁面 */
  goToPage: (page: number) => void;
  /** 下一頁 */
  nextPage: () => void;
  /** 上一頁 */
  previousPage: () => void;
  /** 跳轉到第一頁 */
  firstPage: () => void;
  /** 跳轉到最後一頁 */
  lastPage: () => void;
  /** 設定每頁數量 */
  setPageSize: (size: number) => void;
  /** 設定排序 */
  setSort: (field: string, order: 'ASC' | 'DESC') => void;
  /** 重置分頁狀態 */
  reset: () => void;
}

/**
 * 完整的分頁 Hook 返回值
 */
export interface UsePaginationReturn {
  /** 分頁狀態 */
  pagination: PaginationState;
  /** 分頁操作方法 */
  actions: PaginationActions;
  /** 當前分頁參數（用於 API 請求） */
  params: PaginationParams;
}