/**
 * @fileoverview 分頁控制組件
 * 
 * 提供分頁導航和每頁數量選擇功能
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React from 'react';
import { PaginationState, PaginationActions } from '../../types/pagination';

/**
 * 分頁控制組件的屬性介面
 */
interface PaginationControlsProps {
  /** 分頁狀態 */
  pagination: PaginationState;
  /** 分頁操作方法 */
  actions: PaginationActions;
  /** 每頁數量選項 */
  pageSizeOptions?: number[];
  /** 是否顯示每頁數量選擇器 */
  showPageSizeSelector?: boolean;
  /** 是否顯示頁碼信息 */
  showPageInfo?: boolean;
  /** 自定義樣式類 */
  className?: string;
}

/**
 * 分頁控制組件
 * 
 * 提供完整的分頁導航功能，包括：
 * - 上一頁/下一頁按鈕
 * - 頁碼跳轉
 * - 每頁數量選擇
 * - 分頁信息顯示
 */
export const PaginationControls: React.FC<PaginationControlsProps> = ({
  pagination,
  actions,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSizeSelector = true,
  showPageInfo = true,
  className = ''
}) => {
  const {
    currentPage,
    pageSize,
    total,
    totalPages,
    canPreviousPage,
    canNextPage
  } = pagination;

  const {
    previousPage,
    nextPage,
    firstPage,
    lastPage,
    goToPage,
    setPageSize
  } = actions;

  // 生成頁碼按鈕
  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // 最多顯示5個頁碼
    
    if (totalPages <= maxVisible) {
      // 如果總頁數不超過最大顯示數，顯示所有頁碼
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 複雜的頁碼邏輯
      if (currentPage <= 3) {
        // 當前頁在前面
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        // 當前頁在後面
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // 當前頁在中間
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages.map((page, index) => {
      if (typeof page === 'string') {
        return (
          <span key={index} className="px-3 py-2 text-gray-500">
            {page}
          </span>
        );
      }

      return (
        <button
          key={page}
          onClick={() => goToPage(page)}
          className={`
            px-3 py-2 mx-1 rounded-md text-sm font-medium transition-colors
            ${page === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }
          `}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className={`flex items-center justify-between space-x-4 ${className}`}>
      {/* 分頁信息 */}
      {showPageInfo && (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          顯示第 <span className="font-medium">{Math.min((currentPage - 1) * pageSize + 1, total)}</span> 到{' '}
          <span className="font-medium">{Math.min(currentPage * pageSize, total)}</span> 項，
          共 <span className="font-medium">{total}</span> 項
        </div>
      )}

      {/* 分頁控制 */}
      <div className="flex items-center space-x-2">
        {/* 每頁數量選擇器 */}
        {showPageSizeSelector && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">每頁：</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="
                px-2 py-1 text-sm border rounded-md
                bg-white dark:bg-gray-800
                border-gray-300 dark:border-gray-600
                text-gray-700 dark:text-gray-300
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
              "
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 導航按鈕 */}
        <div className="flex items-center space-x-1">
          {/* 第一頁 */}
          <button
            onClick={firstPage}
            disabled={!canPreviousPage}
            className="
              px-2 py-1 text-sm rounded-md transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              bg-gray-200 text-gray-700 hover:bg-gray-300
              dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600
              disabled:hover:bg-gray-200 dark:disabled:hover:bg-gray-700
            "
            title="第一頁"
          >
            ⟨⟨
          </button>

          {/* 上一頁 */}
          <button
            onClick={previousPage}
            disabled={!canPreviousPage}
            className="
              px-2 py-1 text-sm rounded-md transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              bg-gray-200 text-gray-700 hover:bg-gray-300
              dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600
              disabled:hover:bg-gray-200 dark:disabled:hover:bg-gray-700
            "
            title="上一頁"
          >
            ⟨
          </button>

          {/* 頁碼 */}
          {totalPages > 0 && renderPageNumbers()}

          {/* 下一頁 */}
          <button
            onClick={nextPage}
            disabled={!canNextPage}
            className="
              px-2 py-1 text-sm rounded-md transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              bg-gray-200 text-gray-700 hover:bg-gray-300
              dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600
              disabled:hover:bg-gray-200 dark:disabled:hover:bg-gray-700
            "
            title="下一頁"
          >
            ⟩
          </button>

          {/* 最後一頁 */}
          <button
            onClick={lastPage}
            disabled={!canNextPage}
            className="
              px-2 py-1 text-sm rounded-md transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              bg-gray-200 text-gray-700 hover:bg-gray-300
              dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600
              disabled:hover:bg-gray-200 dark:disabled:hover:bg-gray-700
            "
            title="最後一頁"
          >
            ⟩⟩
          </button>
        </div>
      </div>
    </div>
  );
};