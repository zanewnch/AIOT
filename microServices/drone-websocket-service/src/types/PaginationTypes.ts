/**
 * @fileoverview 分頁相關類型定義
 * 
 * 統一定義所有分頁查詢相關的類型和介面
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

/**
 * 分頁查詢請求參數
 */
export interface PaginationRequest {
    /** 頁碼，從 1 開始 */
    page?: number;
    
    /** 每頁數量，預設 10，最大 100 */
    pageSize?: number;
    
    /** 排序字段 */
    sortBy?: string;
    
    /** 排序方向：asc 升序，desc 降序 */
    sortOrder?: 'asc' | 'desc';
}

/**
 * 分頁查詢回應元數據
 */
export interface PaginationMeta {
    /** 當前頁碼 */
    currentPage: number;
    
    /** 每頁數量 */
    pageSize: number;
    
    /** 總記錄數 */
    totalCount: number;
    
    /** 總頁數 */
    totalPages: number;
    
    /** 是否有下一頁 */
    hasNext: boolean;
    
    /** 是否有上一頁 */
    hasPrevious: boolean;
}

/**
 * 分頁查詢結果
 * 
 * @template T 資料項目類型
 */
export interface PaginatedResult<T> {
    /** 資料陣列 */
    data: T[];
    
    /** 當前頁碼 */
    currentPage: number;
    
    /** 每頁數量 */
    pageSize: number;
    
    /** 總記錄數 */
    totalCount: number;
}

/**
 * 分頁查詢回應格式
 * 
 * @template T 資料項目類型
 */
export interface PaginatedResponse<T> {
    /** 資料陣列 */
    data: T[];
    
    /** 分頁元數據 */
    pagination: PaginationMeta;
    
    /** 統計資訊 */
    statistics?: {
        totalCount: number;
        [key: string]: any;
    };
}

/**
 * 排序配置
 */
export interface SortConfig {
    /** 排序字段 */
    field: string;
    
    /** 排序方向 */
    direction: 'ASC' | 'DESC';
}

/**
 * 查詢過濾條件
 */
export interface FilterCondition {
    /** 欄位名稱 */
    field: string;
    
    /** 操作符 */
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'not_in';
    
    /** 過濾值 */
    value: any;
}

/**
 * 查詢建構器選項
 */
export interface QueryOptions {
    /** 分頁配置 */
    pagination?: PaginationRequest;
    
    /** 排序配置 */
    sort?: SortConfig[];
    
    /** 過濾條件 */
    filters?: FilterCondition[];
    
    /** 包含關聯資料 */
    include?: string[];
}

/**
 * 搜索條件
 */
export interface SearchCriteria {
    /** 搜索關鍵字 */
    keyword?: string;
    
    /** 搜索欄位 */
    searchFields?: string[];
    
    /** 過濾條件 */
    filters?: Record<string, any>;
    
    /** 日期範圍 */
    dateRange?: {
        startDate?: Date;
        endDate?: Date;
        field?: string;
    };
}

/**
 * 批量查詢請求
 */
export interface BatchQueryRequest {
    /** ID 陣列 */
    ids: string[];
    
    /** 包含關聯資料 */
    include?: string[];
    
    /** 排序配置 */
    sort?: SortConfig[];
}

/**
 * 統計查詢結果
 */
export interface StatisticsResult {
    /** 總數量 */
    totalCount: number;
    
    /** 活躍數量 */
    activeCount?: number;
    
    /** 非活躍數量 */
    inactiveCount?: number;
    
    /** 自定義統計 */
    [key: string]: any;
}