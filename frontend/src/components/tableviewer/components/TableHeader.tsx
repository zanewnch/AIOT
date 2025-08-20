/**
 * @fileoverview 表格標題組件
 * 
 * 負責顯示表格標題和記錄統計
 * TableHeader = 標題列
 *
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React from "react";
import { TableType } from "../../../stores";
import { getAllTableConfigs } from "../../../configs/tableConfigs";
import styles from "../../../styles/TableViewer.module.scss";

export interface TableHeaderProps {
  activeTable: TableType;
}

const viewItems = getAllTableConfigs();

/**
 * 表格標題組件
 * TableHeader = 標題列
 */
export const TableHeader: React.FC<TableHeaderProps> = ({ activeTable }) => {
  const currentTableTitle = viewItems.find(
    (viewItem) => viewItem.viewName === activeTable
  )?.title;

  return (
    // 📊 標題容器：顯示表格名稱和統計資訊
    <div className={styles.tableHeader}>
      {/* 📋 表格主標題：動態顯示當前活動表格名稱 */}
      <h2>{currentTableTitle}</h2>
      {/* 📈 記錄計數器：顯示當前表格的數據筆數 */}
      <span className={styles.recordCount}>0 records</span>
    </div>
  );
};