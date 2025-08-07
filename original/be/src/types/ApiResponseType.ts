/**
 * @fileoverview API 回應類型定義模組
 * 
 * 定義統一的 API 回應格式，確保所有 API 端點都使用一致的回應結構。
 * 提供泛型支援以適應不同的資料類型需求，遵循 RESTful API 設計原則。
 * 
 * 此類型設計確保：
 * - 統一的錯誤處理格式
 * - 清晰的成功/失敗狀態標識
 * - 靈活的資料結構支援
 * - 適當的錯誤訊息反饋
 * 
 * @module Types/ApiResponse
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024
 */

/**
 * 分頁參數類型定義
 * 
 * @interface PaginationParams
 */
export interface PaginationParams {
    /** 頁碼，從 1 開始 */
    page: number;
    /** 每頁資料筆數 */
    limit: number;
    /** 排序欄位（可選） */
    sortBy?: string;
    /** 排序方向（可選） */
    sortOrder?: 'ASC' | 'DESC';
}

/**
 * 分頁資料回應類型定義
 * 
 * @template T - 回應資料的類型
 * @interface PaginatedResponse
 */
export interface PaginatedResponse<T> {
    /** 資料陣列 */
    data: T[];
    /** 分頁資訊 */
    pagination: {
        /** 當前頁碼 */
        currentPage: number;
        /** 每頁資料筆數 */
        limit: number;
        /** 總資料筆數 */
        totalItems: number;
        /** 總頁數 */
        totalPages: number;
        /** 是否有下一頁 */
        hasNext: boolean;
        /** 是否有上一頁 */
        hasPrev: boolean;
    };
}

/**
 * 統一的 API 回應類型定義
 * 
 * 此泛型類型定義了所有 API 端點的統一回應格式，確保前後端間的資料交換一致性。
 * 支援泛型以適應不同的資料結構需求，同時提供清晰的錯誤處理機制。
 * 
 * @template T - 回應資料的類型，預設為 any 以提供最大靈活性
 * 
 * @example
 * ```typescript
 * // 使用者資料回應
 * const userResponse: ApiResponseType<UserType> = {
 *   success: true,
 *   data: { id: '1', name: 'John', email: 'john@example.com' },
 *   message: '使用者資料獲取成功'
 * };
 * 
 * // 錯誤回應
 * const errorResponse: ApiResponseType = {
 *   success: false,
 *   error: '使用者不存在',
 *   message: '查詢失敗'
 * };
 * ```
 * 
 * @since 1.0.0
 */
export type ApiResponseType<T = any> = {
    /** 操作是否成功的布林值標識 */
    success: boolean;
    /** 回應的資料內容，成功時包含實際資料 */
    data?: T;
    /** 回應的訊息，通常包含操作結果的描述 */
    message?: string;
    /** 錯誤訊息，失敗時包含錯誤詳情 */
    error?: string;
}