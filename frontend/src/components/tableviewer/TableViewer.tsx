/**
 * @fileoverview 表格視圖容器組件 (重構版本)
 * 
 * 📋 **此組件的職責範圍：**
 * - 🏷️ **標籤頁管理**：管理多個表格之間的切換標籤
 * - 🎛️ **導航控制**：提供左右箭頭導航和鍵盤快捷鍵支援
 * - 📊 **統一介面**：為所有表格提供統一的標題欄和記錄計數
 * - ⚙️ **配置管理**：從 tableConfigs.ts 載入所有表格配置
 * - 🔄 **懶載入控制**：管理 Suspense 和懶載入表格的載入狀態
 * - 🏗️ **容器佈局**：提供表格的外層佈局和樣式容器
 *
 * 🔗 **與 GenericTableViewer 的分工：**
 * - TableViewer = 多表格管理器 (1對多關係)
 * - GenericTableViewer = 單表格渲染器 (被 TableViewer 呼叫)
 *
 * 📁 **架構層級：**
 * ```
 * TableViewer (容器層)
 * ├── 標籤導航
 * ├── 標題顯示  
 * └── GenericTableViewer (內容層)
 *     ├── 實際表格渲染
 *     ├── 資料載入處理
 *     ├── 編輯功能
 *     └── 排序功能
 * ```
 *
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React, { useRef } from "react";
import clsx from "clsx";
import styles from "../../styles/TableViewer.module.scss";
import { useKeyboardNavigation, useTabScrolling, useTableNavigation } from "./hooks";
import { TabNavigation, TableHeader, TableContent } from "./components";



/**
 * 重構後的表格視圖容器組件
 * TableViewer = 整個視窗
 */
export const TableViewer: React.FC<{className:string}> = ({ className }) => {
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // 🎯 使用自定義 Hook 分離邏輯
  const { scrollToTab } = useTabScrolling(tabsScrollRef);
  
  // 🎯 使用表格導航 Hook 統一管理導航邏輯
  const {
    activeTable,
    handleTableChange,
    handleScrollLeft,
    handleScrollRight,
    isFirstTable,
    isLastTable,
  } = useTableNavigation({ scrollToTab });

  // 🎯 使用自定義 Hook 處理鍵盤導航
  useKeyboardNavigation({
    onScrollLeft: handleScrollLeft,
    onScrollRight: handleScrollRight,
  });

  return (
    // 🏗️ 根容器：提供組件的最外層邊界和自定義樣式支援
    <div className={clsx(styles.tableViewerRoot, className)}>
      {/* 📦 主容器：定義整體佈局結構和內部間距 */}
      <div className={styles.tableContainer}>
        {/* 🏷️ 標籤導航區：管理多表格切換的導航界面 */}
        <TabNavigation
          activeTable={activeTable}
          onTableChange={handleTableChange}
          onScrollLeft={handleScrollLeft}
          onScrollRight={handleScrollRight}
          isFirstTable={isFirstTable}
          isLastTable={isLastTable}
          tabsScrollRef={tabsScrollRef}
        />

        {/* 📊 表格標題區：顯示當前表格名稱和記錄統計 */}
        <TableHeader activeTable={activeTable} />

        {/* 📋 表格內容區：實際表格數據的渲染容器，支援滾動和懶載入 */}
        <div className={styles.tableWrapper}>
          <TableContent activeTable={activeTable} />
        </div>
      </div>
    </div>
  );
};