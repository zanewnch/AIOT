/**
 * @fileoverview 無限滾動表格數據 Hook
 * 
 * 提供分頁懶加載功能，支持大數據表格的性能優化
 * 使用 React Query 的 useInfiniteQuery 實現
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-07
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { resUtilsInstance } from '../utils/ResUtils';
import { ReqResult } from '@/utils';
import { createLogger } from '../configs/loggerConfig';
import type { TableError } from '../types/table';

const logger = createLogger('useInfiniteTableData');

/**
 * 分頁響應介面
 * 
 * @interface PaginatedResponse
 * @template T - 數據項目的類型
 * @description 定義分頁 API 回傳的數據結構
 */
interface PaginatedResponse<T> {
  /** 當前頁的數據陣列 */
  data: T[];
  /** 分頁相關信息 */
  pagination: {
    /** 當前頁碼 */
    page: number;
    /** 每頁數據量 */
    limit: number;
    /** 總數據量 */
    total: number;
    /** 總頁數 */
    totalPages: number;
    /** 是否還有更多數據 */
    hasMore: boolean;
  };
}

/**
 * 無限表格配置介面
 * 
 * @interface InfiniteTableConfig
 * @description 定義無限滾動表格的配置參數
 */
interface InfiniteTableConfig {
  /** API 端點 */
  endpoint: string;
  /** 每頁數據量，預設 50 */
  pageSize?: number;
  /** React Query 查詢鍵值 */
  queryKey: string[];
  /** 是否啟用查詢，預設 true */
  enabled?: boolean;
  /** 數據過時時間（毫秒），預設 30秒 */
  staleTime?: number;
  /** 垃圾回收時間（毫秒），預設 5分鐘 */
  gcTime?: number;
  /** 額外的查詢參數 */
  queryParams?: Record<string, any>;
}

/**
 * 無限滾動表格數據 Hook
 * 
 * @description 提供分頁懶加載功能，適用於大數據量表格的性能優化，支持自動加載和虛擬化
 * @template T - 表格數據項目的類型
 * @param config - 無限表格配置選項
 * @returns 包含數據、狀態、控制函數的物件
 * 
 * @example
 * ```typescript
 * const {
 *   data,
 *   hasNextPage,
 *   fetchNextPage,
 *   isLoading,
 *   paginationInfo
 * } = useInfiniteTableData<User>({
 *   endpoint: '/users',
 *   queryKey: ['users'],
 *   pageSize: 20,
 *   queryParams: { role: 'admin' }
 * });
 * 
 * // 加載下一頁
 * if (hasNextPage) {
 *   fetchNextPage();
 * }
 * ```
 */
export const useInfiniteTableData = <T = any>(config: InfiniteTableConfig) => {
  const {
    endpoint,
    pageSize = 50,
    queryKey,
    enabled = true,
    staleTime = 30 * 1000,
    gcTime = 5 * 60 * 1000,
    queryParams = {}
  } = config;

  /**
   * 無限查詢設定
   * 
   * @description 使用 React Query 的 useInfiniteQuery 來處理分頁數據的懶加載
   */
  const infiniteQuery = useInfiniteQuery({
    queryKey: [...queryKey, 'infinite', queryParams],
    
    queryFn: async ({ pageParam = 1 }) => {
      try {
        logger.info('Fetching paginated data', { 
          endpoint, 
          page: pageParam, 
          pageSize,
          queryParams 
        });

        // 構建查詢參數
        const params = new URLSearchParams({
          page: pageParam.toString(),
          limit: pageSize.toString(),
          ...Object.entries(queryParams).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null) {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        });

        const response = await resUtilsInstance.get(`${endpoint}?${params}`);
        const result = ReqResult.fromResponse<PaginatedResponse<T>>(response);

        if (result.isError()) {
          throw new Error(result.message);
        }

        const data = result.unwrap();
        
        logger.info('Paginated data fetched successfully', {
          page: pageParam,
          dataCount: data.data.length,
          hasMore: data.pagination.hasMore
        });

        return data;
      } catch (error: any) {
        logger.error('Failed to fetch paginated data', { 
          error, 
          endpoint, 
          page: pageParam 
        });
        
        const tableError: TableError = {
          message: error.response?.data?.message || error.message || 'Failed to fetch data',
          status: error.response?.status,
          details: error.response?.data,
        };
        throw tableError;
      }
    },

    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination.hasMore ? pagination.page + 1 : undefined;
    },

    getPreviousPageParam: (firstPage) => {
      const { pagination } = firstPage;
      return pagination.page > 1 ? pagination.page - 1 : undefined;
    },

    enabled,
    staleTime,
    gcTime,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * 扁平化所有頁面的數據
   * 
   * @description 將所有已加載的頁面數據合併成單一陣列
   */
  const allData = useMemo(() => {
    if (!infiniteQuery.data) return [];
    
    return infiniteQuery.data.pages.flatMap(page => page.data);
  }, [infiniteQuery.data]);

  /**
   * 分頁統計信息
   * 
   * @description 計算和結合所有頁面的統計資訊
   */
  const paginationInfo = useMemo(() => {
    const firstPage = infiniteQuery.data?.pages[0];
    const lastPage = infiniteQuery.data?.pages[infiniteQuery.data.pages.length - 1];
    
    if (!firstPage) return null;

    return {
      totalItems: firstPage.pagination.total,
      totalPages: firstPage.pagination.totalPages,
      loadedPages: infiniteQuery.data?.pages.length || 0,
      loadedItems: allData.length,
      hasNextPage: infiniteQuery.hasNextPage,
      hasPreviousPage: infiniteQuery.hasPreviousPage,
      currentPage: lastPage?.pagination.page || 1,
    };
  }, [infiniteQuery.data, allData.length, infiniteQuery.hasNextPage, infiniteQuery.hasPreviousPage]);

  /**
   * 重置查詢
   * 
   * @description 清除所有已加載的數據並重新開始查詢
   */
  const resetQuery = () => {
    infiniteQuery.remove();
    infiniteQuery.refetch();
  };

  return {
    // 數據
    data: allData,
    pages: infiniteQuery.data?.pages || [],
    paginationInfo,
    
    // 狀態
    isLoading: infiniteQuery.isLoading,
    isFetching: infiniteQuery.isFetching,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    isFetchingPreviousPage: infiniteQuery.isFetchingPreviousPage,
    hasNextPage: infiniteQuery.hasNextPage,
    hasPreviousPage: infiniteQuery.hasPreviousPage,
    error: infiniteQuery.error as TableError | null,
    isError: infiniteQuery.isError,
    
    // 控制函數
    fetchNextPage: infiniteQuery.fetchNextPage,
    fetchPreviousPage: infiniteQuery.fetchPreviousPage,
    refetch: infiniteQuery.refetch,
    resetQuery,
    
    // 原始查詢對象
    infiniteQuery,
  };
};

/**
 * 表格虛擬化配置介面
 * 
 * @interface VirtualTableConfig
 * @description 用於大數據量表格的虛擬滾動優化配置
 */
export interface VirtualTableConfig {
  /** 每行高度 */
  rowHeight: number;
  /** 容器高度 */
  containerHeight: number;
  /** 緩衝區大小 */
  bufferSize?: number;
}

/**
 * 計算虛擬滾動的可見項目
 * 
 * @description 基於滾動位置和配置參數，計算當前可見的表格項目範圍
 * @param scrollTop - 當前滾動位置（像素）
 * @param config - 虛擬化配置參數
 * @param totalItems - 總項目數量
 * @returns 包含起始索引、結束索引和可見數量的物件
 * 
 * @example
 * ```typescript
 * const visibleRange = calculateVisibleItems(
 *   window.scrollY,
 *   { rowHeight: 50, containerHeight: 600, bufferSize: 5 },
 *   1000
 * );
 * 
 * console.log('可見範圍:', visibleRange.startIndex, '-', visibleRange.endIndex);
 * ```
 */
export const calculateVisibleItems = (
  scrollTop: number, 
  config: VirtualTableConfig, 
  totalItems: number
) => {
  const { rowHeight, containerHeight, bufferSize = 5 } = config;
  
  const startIndex = Math.floor(scrollTop / rowHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / rowHeight) + bufferSize,
    totalItems - 1
  );

  return {
    /** 實際渲染的起始索引（包含緩衝區） */
    startIndex: Math.max(0, startIndex - bufferSize),
    /** 實際渲染的結束索引 */
    endIndex,
    /** 可見項目數量 */
    visibleCount: endIndex - startIndex + 1
  };
};