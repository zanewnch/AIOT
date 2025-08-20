/**
 * @fileoverview 標籤導航組件
 * 
 * 負責表格切換的標籤導航界面
 * TabNavigation = 視窗上方的標籤欄
 *
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React from "react";
import clsx from "clsx";
import { TableType } from "../../../stores";
import { getAllTableConfigs } from "../../../configs/tableConfigs";
import styles from "../../../styles/TableViewer.module.scss";

export interface TabNavigationProps {
  activeTable: TableType;
  onTableChange: (tableType: TableType) => void;
  onScrollLeft: () => void;
  onScrollRight: () => void;
  isFirstTable: boolean;
  isLastTable: boolean;
  tabsScrollRef: React.RefObject<HTMLDivElement>;
}

const viewItems = getAllTableConfigs();

/**
 * 標籤導航組件
 * TabNavigation = 視窗上方的標籤欄
 */
export const TabNavigation: React.FC<TabNavigationProps> = ({ 
  activeTable, 
  onTableChange, 
  onScrollLeft, 
  onScrollRight, 
  isFirstTable, 
  isLastTable,
  tabsScrollRef 
}) => (
  // 🎛️ 導航容器：三段式佈局（左箭頭 + 標籤列表 + 右箭頭）
  <div className={styles.tabsWrapper}>
    {/* ⬅️ 左導航按鈕：切換到前一個表格，第一個表格時禁用 */}
    <button
      className={clsx(styles.scrollArrow, isFirstTable && styles.disabled)}
      onClick={onScrollLeft}
      disabled={isFirstTable}
      aria-label="切換到前一個表格"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path fillRule="evenodd" d="M10.354 14.354a.5.5 0 0 1-.708 0L4.5 9.207 3.646 8.354a.5.5 0 0 1 0-.708L9.646 1.646a.5.5 0 1 1 .708.708L4.707 8l5.647 5.646a.5.5 0 0 1 0 .708z"/>
      </svg>
    </button>

    {/* 📜 標籤滾動容器：水平滾動的標籤列表，支援鍵盤和滑鼠導航 */}
    <div className={styles.tabsContainer} ref={tabsScrollRef}>
      {viewItems.map((viewItem) => (
        // 🏷️ 表格標籤按鈕：點擊切換表格，活動狀態有特殊樣式
        <button
          key={viewItem.viewName}
          data-table={viewItem.viewName}
          className={clsx(
            styles.tab,
            activeTable === viewItem.viewName && styles.active
          )}
          onClick={() => onTableChange(viewItem.viewName as TableType)}
        >
          {viewItem.title}
        </button>
      ))}
    </div>

    {/* ➡️ 右導航按鈕：切換到下一個表格，最後一個表格時禁用 */}
    <button
      className={clsx(styles.scrollArrow, isLastTable && styles.disabled)}
      onClick={onScrollRight}
      disabled={isLastTable}
      aria-label="切換到下一個表格"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path fillRule="evenodd" d="M5.646 1.646a.5.5 0 0 1 .708 0L11.5 6.793l.854.853a.5.5 0 0 1 0 .708L6.354 14.354a.5.5 0 1 1-.708-.708L11.293 8 5.646 2.354a.5.5 0 0 1 0-.708z"/>
      </svg>
    </button>
  </div>
);