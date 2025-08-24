/**
 * @fileoverview 通用分頁 Hook
 * 
 * 提供分頁狀態管理和操作方法
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  PaginationParams, 
  PaginationOptions, 
  PaginationState, 
  PaginationActions, 
  UsePaginationReturn 
} from '../types/pagination';

/**
 * 分頁 Hook
 * 
 * @param options 分頁配置選項
 * @returns 分頁狀態和操作方法
 */
export const usePagination = (options: PaginationOptions = {}): UsePaginationReturn => {
  const {
    enabled = true,
    defaultPageSize = 10,
    defaultSortBy = 'id',
    defaultSortOrder = 'DESC'
  } = options;

  // 分頁狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(defaultSortBy || null);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(defaultSortOrder);

  // 計算衍生狀態
  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);
  const canPreviousPage = useMemo(() => currentPage > 1, [currentPage]);
  const canNextPage = useMemo(() => currentPage < totalPages, [currentPage, totalPages]);

  // 分頁操作方法
  const actions: PaginationActions = {
    goToPage: useCallback((page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages || 1));
      setCurrentPage(validPage);
    }, [totalPages]),

    nextPage: useCallback(() => {
      if (canNextPage) {
        setCurrentPage(prev => prev + 1);
      }
    }, [canNextPage]),

    previousPage: useCallback(() => {
      if (canPreviousPage) {
        setCurrentPage(prev => prev - 1);
      }
    }, [canPreviousPage]),

    firstPage: useCallback(() => {
      setCurrentPage(1);
    }, []),

    lastPage: useCallback(() => {
      setCurrentPage(totalPages || 1);
    }, [totalPages]),

    setPageSize: useCallback((size: number) => {
      const validSize = Math.max(1, size);
      setPageSizeState(validSize);
      setCurrentPage(1); // 重置到第一頁
    }, []),

    setSort: useCallback((field: string, order: 'ASC' | 'DESC') => {
      setSortBy(field);
      setSortOrder(order);
      setCurrentPage(1); // 重置到第一頁
    }, []),

    reset: useCallback(() => {
      setCurrentPage(1);
      setPageSizeState(defaultPageSize);
      setSortBy(defaultSortBy || null);
      setSortOrder(defaultSortOrder);
      setTotal(0);
    }, [defaultPageSize, defaultSortBy, defaultSortOrder])
  };

  // 分頁狀態
  const pagination: PaginationState = {
    currentPage,
    pageSize,
    total,
    totalPages,
    sortBy,
    sortOrder,
    canPreviousPage,
    canNextPage
  };

  // API 請求參數
  const params: PaginationParams = {
    page: currentPage,
    pageSize,
    ...(sortBy && { sortBy }),
    sortOrder
  };

  // 更新總數的方法（會被查詢 Hook 調用）
  const updateTotal = useCallback((newTotal: number) => {
    setTotal(newTotal);
    
    // 如果當前頁超出範圍，自動跳轉到最後一頁
    const newTotalPages = Math.ceil(newTotal / pageSize);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
  }, [currentPage, pageSize]);

  return {
    pagination,
    actions,
    params,
    updateTotal
  } as UsePaginationReturn & { updateTotal: (newTotal: number) => void };
};