/**
 * @fileoverview API 回應類型定義
 * 
 * 此文件定義了通用的 API 回應類型，包含分頁參數和回應格式。
 * 用於統一各個服務的 API 介面格式。
 * 
 * @module ApiResponseType
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

/**
 * 分頁參數介面
 * 
 * 定義分頁查詢所需的參數，包含頁數、每頁數量等資訊。
 * 
 * @interface PaginationParams
 * @since 1.0.0
 */
export interface PaginationParams {
    /**
     * 頁數（從 1 開始）
     */
    page?: number;
    
    /**
     * 每頁數量
     */
    limit?: number;
    
    /**
     * 偏移量
     */
    offset?: number;
    
    /**
     * 排序欄位
     */
    sortBy?: string;
    
    /**
     * 排序方向
     */
    sortOrder?: 'ASC' | 'DESC';
}

/**
 * 分頁回應介面
 * 
 * 定義分頁查詢的回應格式，包含資料和分頁資訊。
 * 
 * @interface PaginatedResponse
 * @template T 資料類型
 * @since 1.0.0
 */
export interface PaginatedResponse<T> {
    /**
     * 回應資料陣列
     */
    data: T[];
    
    /**
     * 分頁資訊
     */
    pagination: {
        /**
         * 當前頁數
         */
        currentPage: number;
        
        /**
         * 每頁數量
         */
        pageSize: number;
        
        /**
         * 總記錄數
         */
        totalCount: number;
        
        /**
         * 總頁數
         */
        totalPages: number;
        
        /**
         * 是否有下一頁
         */
        hasNext: boolean;
        
        /**
         * 是否有上一頁
         */
        hasPrevious: boolean;
    };
}

/**
 * 基礎 API 回應介面
 * 
 * 定義所有 API 回應的基本格式。
 * 
 * @interface BaseApiResponse
 * @template T 資料類型
 * @since 1.0.0
 */
export interface BaseApiResponse<T = any> {
    /**
     * 狀態碼
     */
    status: number;
    
    /**
     * 回應訊息
     */
    message: string;
    
    /**
     * 回應資料
     */
    data?: T;
    
    /**
     * 錯誤資訊
     */
    error?: any;
    
    /**
     * 時間戳記
     */
    timestamp?: string;
}