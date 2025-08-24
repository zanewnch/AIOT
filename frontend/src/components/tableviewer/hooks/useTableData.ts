/**
 * @fileoverview 表格數據管理 Hook（支援分頁）
 * 
 * 整合分頁查詢、排序和表格數據管理功能
 *
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { useMemo, useEffect } from 'react';
import { useTableUIStore } from '../../../stores';
import { TableConfig } from "../../../configs";
import { usePagination } from '../../../hooks/usePagination';
import { PaginationParams } from '../../../types/pagination';
import { createLogger } from '../../../configs/loggerConfig';

interface UseTableDataProps {
  config: TableConfig;
  /** 是否啟用分頁，預設從配置讀取 */
  enablePagination?: boolean;
  /** 預設每頁數量 */
  defaultPageSize?: number;
  /** 預設排序欄位 */
  defaultSortBy?: string;
  /** 預設排序方向 */
  defaultSortOrder?: 'ASC' | 'DESC';
}

interface UseTableDataReturn {
  data: any[] | undefined;
  isLoading: boolean;
  error: any;
  refetch: () => void;
  sortedData: any[];
  handleSort: (field: string) => void;
  updateMutation: any;
  sorting: any;
  // 分頁相關新增
  pagination: any;
  paginationActions: any;
  paginationEnabled: boolean;
}

/**
 * 表格數據管理 Hook（支援分頁）
 * 
 * 整合分頁查詢、排序和表格數據管理功能
 */
export const useTableData = ({ 
  config, 
  enablePagination,
  defaultPageSize,
  defaultSortBy,
  defaultSortOrder 
}: UseTableDataProps): UseTableDataReturn => {
  const logger = createLogger(`TableData-${config.type}`);
  
  // 確定是否啟用分頁
  const paginationEnabled = enablePagination ?? config.enablePagination ?? true;
  
  // 分頁 Hook
  const { 
    pagination, 
    actions: paginationActions, 
    params: paginationParams,
    updateTotal
  } = usePagination({
    enabled: paginationEnabled,
    defaultPageSize: defaultPageSize ?? config.defaultPageSize ?? 10,
    defaultSortBy: defaultSortBy ?? config.defaultSortBy ?? 'id',
    defaultSortOrder: defaultSortOrder ?? config.defaultSortOrder ?? 'DESC'
  });

  // 準備查詢參數
  const queryParams: PaginationParams | undefined = paginationEnabled ? paginationParams : undefined;
  
  // 使用配置中的數據查詢 Hook
  const { data, isLoading, error, refetch, paginationData } = config.useData(queryParams);
  
  // 更新總數（如果有分頁數據）
  useEffect(() => {
    if (paginationEnabled && paginationData && updateTotal) {
      updateTotal(paginationData.total);
    }
  }, [paginationData?.total, paginationEnabled, updateTotal]);

  // 更新 mutation
  const updateMutation = config.useUpdateMutation();

  // UI 狀態管理（兼容舊系統）
  const { sorting: uiSorting, toggleSortOrder } = useTableUIStore();

  // 處理排序（如果沒有分頁，使用 UI 狀態；如果有分頁，使用分頁狀態）
  const sortedData = useMemo(() => {
    if (paginationEnabled) {
      // 如果啟用分頁，數據已在後端排序
      return paginationData?.data || data || [];
    }

    // 前端排序邏輯（兼容舊系統）
    if (!data) return [];
    
    const sorted = [...data];
    sorted.sort((a, b) => {
      const aValue = a[uiSorting.field];
      const bValue = b[uiSorting.field];
      
      if (aValue < bValue) return uiSorting.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return uiSorting.order === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [data, uiSorting, paginationData, paginationEnabled]);

  // 排序處理函數
  const handleSort = (field: string) => {
    if (paginationEnabled) {
      // 分頁模式：使用分頁狀態管理排序
      const newOrder = pagination.sortBy === field && pagination.sortOrder === 'ASC' ? 'DESC' : 'ASC';
      paginationActions.setSort(field, newOrder);
      
      logger.debug('分頁表格排序變更', { 
        tableType: config.type,
        field, 
        order: newOrder 
      });
    } else {
      // 前端排序模式：使用 UI 狀態
      logger.debug('前端表格排序', { 
        tableType: config.type,
        field, 
        currentOrder: uiSorting.order, 
        operation: 'sort' 
      });
      toggleSortOrder(field as any);
    }
  };

  // 當前排序狀態（統一格式）
  const sorting = paginationEnabled 
    ? { 
        field: pagination.sortBy, 
        order: pagination.sortOrder?.toLowerCase() as 'asc' | 'desc' 
      }
    : uiSorting;

  logger.debug('表格數據狀態', {
    tableType: config.type,
    paginationEnabled,
    dataLength: data?.length,
    isLoading,
    currentPage: pagination?.currentPage,
    totalPages: pagination?.totalPages
  });

  return {
    // 原始數據
    data: paginationEnabled ? (paginationData?.data || data) : data,
    isLoading,
    error,
    refetch,
    
    // 排序
    sortedData,
    sorting,
    handleSort,
    
    // 更新
    updateMutation,
    
    // 分頁（新增）
    pagination: pagination || null,
    paginationActions: paginationActions || null,
    paginationEnabled
  };
};