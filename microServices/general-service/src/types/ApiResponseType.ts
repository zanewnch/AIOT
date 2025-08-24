/**
 * @fileoverview API 回應類型定義
 * 
 * 定義統一的 API 回應格式和類型
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2025-08-08
 */

/**
 * 基本 API 回應格式
 */
export interface BaseApiResponse {
  status: number;
  message: string;
  timestamp?: string;
}

/**
 * 成功回應格式
 */
export interface SuccessApiResponse<T = any> extends BaseApiResponse {
  data: T;
}

/**
 * 錯誤回應格式
 */
export interface ErrorApiResponse extends BaseApiResponse {
  error: string;
}

/**
 * 通用 API 回應類型
 */
export type ApiResponse<T = any> = SuccessApiResponse<T> | ErrorApiResponse;

/**
 * 分頁回應資料
 */
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 分頁回應格式
 */
export type PaginatedApiResponse<T> = SuccessApiResponse<PaginatedData<T>>;

/**
 * 分頁參數
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * 分頁回應 - 向後相容
 */
export type PaginatedResponse<T> = PaginatedApiResponse<T>;