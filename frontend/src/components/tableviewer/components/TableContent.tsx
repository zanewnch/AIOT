/**
 * @fileoverview 表格內容組件
 * 
 * 負責渲染實際的表格內容，支援懶載入
 * TableContent = 實際的表格內容
 *
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React, { Suspense } from "react";
import { TableType } from "../../../stores";
import { getTableConfig } from "../../../configs"";
import { GenericTableContent } from "./GenericTableContent";
import LoadingSpinner from "../../common/LoadingSpinner";
import styles from "../../../styles/TableViewer.module.scss";

export interface TableContentProps {
  activeTable: TableType;
}

/**
 * 表格內容渲染器
 * TableContent = 實際的表格內容
 */
export const TableContent: React.FC<TableContentProps> = ({ activeTable }) => {
  const config = getTableConfig(activeTable);
  
  if (!config) {
    return <div className={styles.noData}>No table configuration found</div>;
  }

  // 🔄 懶載入渲染：大型表格使用Suspense延遲加載
  if (config.isLazy) {
    return (
      <Suspense 
        fallback={
          // 💫 載入狀態容器：顯示載入動畫和文字提示
          <div className={styles.tableLoadingContainer}>
            <LoadingSpinner />
            <p className={styles.loadingText}>載入表格中...</p>
          </div>
        }
      >
        {/* 🎯 實際表格組件：傳入配置進行渲染 */}
        <GenericTableContent config={config} />
      </Suspense>
    );
  }

  // ⚡ 一般渲染：小型表格直接渲染，無需懶載入
  return <GenericTableContent config={config} />;
};