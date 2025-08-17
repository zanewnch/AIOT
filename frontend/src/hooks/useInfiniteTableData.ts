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
import { apiClient } from '../utils/RequestUtils';
import { ReqResult } from '../utils/ReqResult';
import { createLogger } from '../configs/loggerConfig';
import type { TableError } from '../types/table';

const logger = createLogger('useInfiniteTableData');

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface InfiniteTableConfig {
  /** API 端點 */
  endpoint: string;
  /** 每頁數據量 */
  pageSize?: number;
  /** 查詢鍵值 */
  queryKey: string[];
  /** 是否啟用 */
  enabled?: boolean;
  /** 過時時間 */
  staleTime?: number;
  /** 垃圾回收時間 */
  gcTime?: number;
  /** 額外的查詢參數 */
  queryParams?: Record<string, any>;
}

/**
 * 無限滾動表格數據 Hook
 * 
 * 提供分頁懶加載功能，適用於大數據量表格
 * 
 * @param config 配置選項
 * @returns 無限查詢結果和控制函數
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

  // 🔄 無限查詢
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

        const response = await apiClient.get(`${endpoint}?${params}`);
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

  // 🎯 扁平化所有頁面的數據
  const allData = useMemo(() => {
    if (!infiniteQuery.data) return [];
    
    return infiniteQuery.data.pages.flatMap(page => page.data);
  }, [infiniteQuery.data]);

  // 📊 分頁統計信息
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

  // 🔄 重置查詢
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
 * 表格虛擬化配置
 * 
 * 用於大數據量表格的虛擬滾動優化
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
 * @param scrollTop 滾動位置
 * @param config 虛擬化配置
 * @param totalItems 總項目數
 * @returns 可見項目的索引範圍
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
    startIndex: Math.max(0, startIndex - bufferSize),
    endIndex,
    visibleCount: endIndex - startIndex + 1
  };
};