/**
 * @fileoverview 表格導航邏輯 Hook
 * 
 * 統一管理表格切換、滾動和狀態計算邏輯
 *
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { useCallback } from 'react';
import { TableType, useTableUIStore } from '../../../stores';
import { getAllTableConfigs } from "../../../configs";
import { createLogger } from '../../../configs/loggerConfig';

interface UseTableNavigationProps {
  scrollToTab: (tableType: TableType) => void;
}

interface UseTableNavigationReturn {
  activeTable: TableType;
  handleTableChange: (tableType: TableType) => void;
  handleScrollLeft: () => void;
  handleScrollRight: () => void;
  isFirstTable: boolean;
  isLastTable: boolean;
  currentTableIndex: number;
}

const logger = createLogger("TableNavigation");
const viewItems = getAllTableConfigs();

/**
 * 表格導航邏輯 Hook
 * 
 * 提供完整的表格切換、滾動導航邏輯
 */
export const useTableNavigation = ({ 
  scrollToTab 
}: UseTableNavigationProps): UseTableNavigationReturn => {
  const { activeTable, setActiveTable } = useTableUIStore();

  /**
   * 處理表格切換操作
   */
  const handleTableChange = useCallback((tableType: TableType) => {
    logger.info(`Table switched to: ${tableType}`, {
      previousTable: activeTable,
      newTable: tableType,
    });
    setActiveTable(tableType);
    scrollToTab(tableType);
  }, [activeTable, setActiveTable, scrollToTab]);

  /**
   * 切換到前一個表格
   */
  const handleScrollLeft = useCallback(() => {
    const currentIndex = viewItems.findIndex(
      (item) => item.viewName === activeTable
    );
    if (currentIndex > 0) {
      const previousTable = viewItems[currentIndex - 1];
      handleTableChange(previousTable.viewName as TableType);
    }
  }, [activeTable, handleTableChange]);

  /**
   * 切換到下一個表格
   */
  const handleScrollRight = useCallback(() => {
    const currentIndex = viewItems.findIndex(
      (item) => item.viewName === activeTable
    );
    if (currentIndex < viewItems.length - 1) {
      const nextTable = viewItems[currentIndex + 1];
      handleTableChange(nextTable.viewName as TableType);
    }
  }, [activeTable, handleTableChange]);

  // 計算當前位置狀態
  const currentTableIndex = viewItems.findIndex(
    (item) => item.viewName === activeTable
  );
  const isFirstTable = currentTableIndex === 0;
  const isLastTable = currentTableIndex === viewItems.length - 1;

  return {
    activeTable,
    handleTableChange,
    handleScrollLeft,
    handleScrollRight,
    isFirstTable,
    isLastTable,
    currentTableIndex,
  };
};