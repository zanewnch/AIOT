/**
 * @fileoverview 分頁邏輯助手函數
 * 
 * 統一的分頁處理邏輯，消除各個表格配置中的重複代碼
 * 提供客戶端分頁和服務端分頁兩種模式的統一介面
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { PaginationParams, PaginatedResponse } from '../../../types/pagination';
import { QueryResult } from '../types';

/**
 * 客戶端分頁配置
 * 
 * **設計意圖：**
 * 某些 API 不支援服務端分頁，需要在前端進行分頁處理。
 * 此介面統一了客戶端分頁的處理邏輯，避免在每個表格配置中重複實現。
 */
export interface ClientSidePaginationConfig<T = any> {
  /** 原始查詢結果 */
  queryResult: {
    data: T[] | undefined;
    isLoading: boolean;
    error: any;
    refetch: () => void;
  };
  /** 分頁參數 */
  params?: PaginationParams;
}

/**
 * 服務端分頁配置
 * 
 * **設計意圖：**
 * 對於支援服務端分頁的 API，提供統一的數據格式轉換。
 * 確保所有表格都使用相同的分頁數據結構。
 */
export interface ServerSidePaginationConfig<T = any> {
  /** 服務端查詢結果（已分頁） */
  queryResult: {
    data: PaginatedResponse<T> | undefined;
    isLoading: boolean;
    error: any;
    refetch: () => void;
  };
}

/**
 * 處理客戶端分頁
 * 
 * 適用於不支援服務端分頁的 API，在前端進行分頁計算
 * 
 * **使用場景：**
 * - 舊版 API 不支援分頁參數
 * - 數據量較小，適合全量載入後前端分頁
 * - 需要複雜的客戶端過濾或排序
 * 
 * @param config 客戶端分頁配置
 * @returns 統一的查詢結果格式
 */
export function handleClientSidePagination<T = any>(
  config: ClientSidePaginationConfig<T>
): QueryResult<T> {
  const { queryResult, params } = config;
  const dataArray = queryResult.data || [];

  if (params) {
    // 計算分頁數據
    const paginatedData: PaginatedResponse<T> = {
      data: dataArray,
      total: dataArray.length,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(dataArray.length / params.pageSize),
      hasNextPage: params.page < Math.ceil(dataArray.length / params.pageSize),
      hasPrevPage: params.page > 1
    };

    return {
      data: paginatedData.data,
      isLoading: queryResult.isLoading,
      error: queryResult.error,
      refetch: queryResult.refetch,
      paginationData: paginatedData
    };
  } else {
    // 非分頁模式
    return {
      data: dataArray,
      isLoading: queryResult.isLoading,
      error: queryResult.error,
      refetch: queryResult.refetch
    };
  }
}

/**
 * 處理服務端分頁
 * 
 * 適用於支援服務端分頁的 API，直接轉換數據格式
 * 
 * **使用場景：**
 * - 新版 API 原生支援分頁
 * - 大數據量需要服務端分頁
 * - 需要服務端排序和過濾
 * 
 * @param config 服務端分頁配置
 * @returns 統一的查詢結果格式
 */
export function handleServerSidePagination<T = any>(
  config: ServerSidePaginationConfig<T>
): QueryResult<T> {
  const { queryResult } = config;

  return {
    data: queryResult.data ? queryResult.data.data : undefined,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    refetch: queryResult.refetch,
    paginationData: queryResult.data
  };
}

/**
 * 自動檢測分頁模式並處理
 * 
 * 根據查詢結果的數據格式自動判斷是客戶端分頁還是服務端分頁
 * 
 * **判斷邏輯：**
 * - 如果 queryResult.data 包含 `data`, `total`, `page` 等分頁欄位，視為服務端分頁
 * - 否則視為客戶端分頁（數據陣列）
 * 
 * @param queryResult 原始查詢結果
 * @param params 分頁參數
 * @returns 統一的查詢結果格式
 */
export function handlePagination<T = any>(
  queryResult: any,
  params?: PaginationParams
): QueryResult<T> {
  // 檢查是否為服務端分頁格式
  const isServerSidePaginated = queryResult.data && 
    typeof queryResult.data === 'object' &&
    'data' in queryResult.data &&
    'total' in queryResult.data &&
    'page' in queryResult.data;

  if (isServerSidePaginated) {
    // 服務端分頁
    return handleServerSidePagination({ queryResult });
  } else {
    // 客戶端分頁
    return handleClientSidePagination({ queryResult, params });
  }
}

/**
 * 預設分頁參數
 * 
 * 提供統一的預設分頁配置，確保所有表格使用相同的預設值
 */
export const DEFAULT_PAGINATION_PARAMS: Required<PaginationParams> = {
  page: 1,
  pageSize: 10,
  sortBy: 'id',
  sortOrder: 'DESC'
};

/**
 * 創建分頁參數
 * 
 * 合併預設參數和自訂參數，確保參數完整性
 * 
 * @param customParams 自訂分頁參數
 * @returns 完整的分頁參數
 */
export function createPaginationParams(
  customParams: Partial<PaginationParams> = {}
): Required<PaginationParams> {
  return {
    ...DEFAULT_PAGINATION_PARAMS,
    ...customParams
  };
}