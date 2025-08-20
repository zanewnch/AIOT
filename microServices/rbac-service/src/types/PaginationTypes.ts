/**
 * @fileoverview 分頁查詢類型定義
 * 
 * 定義分頁查詢的通用介面和類型
 * 
 * @author AIOT Development Team
 * @since 1.0.0
 */

/**
 * 分頁參數介面
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
 * 分頁結果介面
 */
export interface PaginatedResult<T> {
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
  /** 預設頁碼 */
  defaultPage?: number;
  /** 預設每頁數量 */
  defaultPageSize?: number;
  /** 最大每頁數量限制 */
  maxPageSize?: number;
  /** 預設排序欄位 */
  defaultSortBy?: string;
  /** 預設排序方向 */
  defaultSortOrder?: 'ASC' | 'DESC';
  /** 允許的排序欄位 */
  allowedSortFields?: string[];
}

/**
 * 分頁工具類
 */
export class PaginationUtils {
  /**
   * 驗證分頁參數
   */
  static validatePaginationParams(
    params: Partial<PaginationParams>, 
    options: PaginationOptions = {}
  ): PaginationParams {
    const {
      defaultPage = 1,
      defaultPageSize = 10,
      maxPageSize = 100,
      defaultSortBy = 'id',
      defaultSortOrder = 'DESC',
      allowedSortFields = []
    } = options;

    const page = Math.max(1, params.page || defaultPage);
    const pageSize = Math.min(Math.max(1, params.pageSize || defaultPageSize), maxPageSize);
    
    // 驗證排序欄位
    let sortBy = params.sortBy || defaultSortBy;
    if (allowedSortFields.length > 0 && !allowedSortFields.includes(sortBy)) {
      sortBy = defaultSortBy;
    }

    const sortOrder = ['ASC', 'DESC'].includes(params.sortOrder || '') 
      ? (params.sortOrder as 'ASC' | 'DESC')
      : defaultSortOrder;

    return {
      page,
      pageSize,
      sortBy,
      sortOrder
    };
  }

  /**
   * 計算分頁偏移量
   */
  static calculateOffset(page: number, pageSize: number): number {
    return (page - 1) * pageSize;
  }

  /**
   * 創建分頁結果
   */
  static createPaginatedResult<T>(
    data: T[],
    total: number,
    page: number,
    pageSize: number
  ): PaginatedResult<T> {
    const totalPages = Math.ceil(total / pageSize);
    
    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }
}