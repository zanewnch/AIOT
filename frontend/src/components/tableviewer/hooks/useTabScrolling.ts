/**
 * @fileoverview 標籤滾動 Hook
 * 
 * 處理標籤容器的滾動行為
 * - 自動滾動到指定標籤
 * - 計算滾動位置
 * - 平滑滾動動畫
 *
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { useCallback } from 'react';
import { TableType } from '../../../stores';

/**
 * 標籤滾動 Hook
 */
export const useTabScrolling = (tabsScrollRef: React.RefObject<HTMLDivElement>) => {
  
  /**
   * 滾動到指定標籤位置
   */
  const scrollToTab = useCallback((targetTableType: TableType) => {
    if (!tabsScrollRef.current) return;

    const targetButton = tabsScrollRef.current.querySelector(
      `[data-table="${targetTableType}"]`
    ) as HTMLButtonElement;

    if (!targetButton) return;

    const container = tabsScrollRef.current;
    const containerRect = container.getBoundingClientRect();
    const buttonRect = targetButton.getBoundingClientRect();
    
    // 計算需要滾動的距離，將目標按鈕置中
    const scrollLeft = container.scrollLeft;
    const targetScrollLeft = scrollLeft + 
      (buttonRect.left - containerRect.left) - 
      (containerRect.width / 2) + 
      (buttonRect.width / 2);
    
    // 平滑滾動到目標位置
    container.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth'
    });
  }, [tabsScrollRef]);

  return { scrollToTab };
};