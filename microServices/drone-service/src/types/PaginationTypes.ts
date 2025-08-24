/**
 * @fileoverview 分頁相關類型定義和工具類
 * 
 * 提供統一的分頁參數、回應格式和工具方法
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * 分頁參數介面
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 分頁結果介面
 */
export interface PaginatedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 分頁驗證選項
 */
export interface PaginationValidationOptions {
  defaultPage?: number;
  defaultPageSize?: number;
  maxPageSize?: number;
  defaultSortBy?: string;
  defaultSortOrder?: 'ASC' | 'DESC';
  allowedSortFields?: string[];
}

/**
 * 分頁工具類
 */
export class PaginationUtils {
  /**
   * 驗證和標準化分頁參數
   */
  static validatePaginationParams(
    params: Partial<PaginationParams>,
    options: PaginationValidationOptions = {}
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
    const pageSize = Math.min(maxPageSize, Math.max(1, params.pageSize || defaultPageSize));
    
    let sortBy = params.sortBy || defaultSortBy;
    if (allowedSortFields.length > 0 && !allowedSortFields.includes(sortBy)) {
      sortBy = defaultSortBy;
    }

    const sortOrder = params.sortOrder === 'ASC' ? 'ASC' : defaultSortOrder;

    return {
      page,
      pageSize,
      sortBy,
      sortOrder
    };
  }

  /**
   * 計算偏移量
   */
  static calculateOffset(page: number, pageSize: number): number {
    return (page - 1) * pageSize;
  }

  /**
   * 計算總頁數
   */
  static calculateTotalPages(total: number, pageSize: number): number {
    return Math.ceil(total / pageSize);
  }

  /**
   * 創建分頁結果物件
   */
  static createPaginatedResult<T>(
    data: T[],
    total: number,
    page: number,
    pageSize: number
  ): PaginatedResult<T> {
    const totalPages = PaginationUtils.calculateTotalPages(total, pageSize);
    
    return {
      data,
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  /**
   * 驗證頁碼是否有效
   */
  static isValidPage(page: number, total: number, pageSize: number): boolean {
    if (total === 0) return page === 1;
    const totalPages = PaginationUtils.calculateTotalPages(total, pageSize);
    return page >= 1 && page <= totalPages;
  }
}