/**
 * @fileoverview 分頁相關類型定義
 */

/**
 * 分頁資訊介面
 */
export interface PaginationInfo {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

/**
 * 分頁參數介面
 */
export interface PaginationParams {
    page?: number;
    pageSize?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

/**
 * 分頁回應介面
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationInfo;
}

/**
 * 分頁查詢選項介面
 */
export interface PaginatedQueryOptions<TFilter = any> extends PaginationParams {
    filters?: TFilter;
    search?: string;
}