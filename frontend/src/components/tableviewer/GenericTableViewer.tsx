/**
 * @fileoverview 通用表格視圖組件 (底層渲染器)
 * 
 * 📋 **此組件的職責範圍：**
 * - 🎨 **表格渲染**：根據配置動態渲染 HTML 表格結構
 * - 📡 **資料管理**：處理 API 資料載入、錯誤狀態、重試機制
 * - 🔧 **CRUD 操作**：編輯模態框、保存、更新、樂觀更新
 * - 📈 **排序功能**：欄位排序、升降序切換
 * - 🎯 **格式化**：資料格式化、自定義欄位格式化函數
 * - ⚡ **互動功能**：編輯按鈕、自定義操作按鈕
 * - 🔄 **狀態管理**：與 Zustand store 整合處理編輯狀態
 *
 * 🔗 **與 TableViewer 的分工：**
 * - TableViewer 負責「選擇哪個表格」
 * - GenericTableViewer 負責「如何渲染表格」
 *
 * 📊 **渲染流程：**
 * ```
 * 1. 接收 TableConfig 配置物件
 * 2. 使用配置中的 useData() Hook 載入資料
 * 3. 處理載入、錯誤、空資料狀態
 * 4. 動態渲染表格標頭和資料列
 * 5. 提供編輯和自定義操作功能
 * ```
 *
 * 💡 **設計模式：**
 * - 配置驅動開發 (Configuration-Driven Development)
 * - 單一責任原則 (只負責單個表格的渲染)
 * - 依賴注入 (通過 props 接收配置)
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import { PaginationControls } from '../common/PaginationControls';
import { TableConfig } from '../../configs/tableConfigs';
import { useTableData, useTableEdit, useEditModal } from './hooks';
import { EditModal } from './components';
import { createLogger } from '../../configs/loggerConfig';
import styles from '../../styles/TableViewer.module.scss';



/**
 * 通用表格視圖組件
 * 
 * 此組件根據配置動態渲染表格，提供統一的數據處理邏輯
 */
export const GenericTableViewer: React.FC<{config: TableConfig, className?: string}> = ({ config, className }) => {
  const logger = createLogger(`GenericTableViewer-${config.type}`);
  
  // 🎯 使用數據管理 Hook（支援分頁）
  const {
    data,
    isLoading,
    error,
    refetch,
    sortedData,
    handleSort,
    updateMutation,
    sorting,
    pagination,
    paginationActions,
    paginationEnabled,
  } = useTableData({ config });

  // 🎯 使用編輯邏輯 Hook
  const {
    editModal,
    handleEdit,
    handleSave,
    handleCancel,
    handleQuickToggle,
    handleInputChange,
    updateEditingItem,
  } = useTableEdit({ config, updateMutation, refetch });

  // 🎯 使用編輯模態框邏輯 Hook
  const { shouldShowModal, editableColumns } = useEditModal({ config, editModal });



  /**
   * 格式化欄位值以便顯示
   */
  const formatValue = (value: any, column: any): string => {
    if (value === null || value === undefined) return '-';
    
    // 使用配置中的自定義格式化函數
    if (column.formatter) {
      return column.formatter(value);
    }
    
    // 預設格式化
    if (typeof value === 'boolean') {
      return value ? '是' : '否';
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    return String(value);
  };


  // 載入狀態檢查
  if (isLoading) {
    return <LoadingSpinner message={`載入${config.title}數據中...`} />;
  }

  // 錯誤狀態檢查
  if (error) {
    return (
      <div className={styles.error}>
        <span>載入{config.title}數據時發生錯誤: {(error as Error).message}</span>
        <button onClick={() => {
          logger.info('重新載入數據', { tableType: config.type, operation: 'retry' });
          refetch();
        }} className={styles.retryButton}>
          重試
        </button>
      </div>
    );
  }

  // 空資料檢查
  if (!data || data.length === 0) {
    return (
      <div className={styles.noData}>
        <span>{config.emptyText || `目前沒有${config.title}數據`}</span>
        <button onClick={() => {
          logger.info('刷新數據', { tableType: config.type, operation: 'refresh' });
          refetch();
        }} className={styles.refreshButton}>
          重新載入
        </button>
      </div>
    );
  }

  return (
  <div className={`${styles.tableContainer} ${className || ''} table-center-outer`}>
      {/* 表格 */}
      <table 
        className={`${styles.table} table-center`} 
        style={{ '--row-count': sortedData.length } as React.CSSProperties}
      >
        <thead>
          <tr>
            {config.columns.map((column) => (
              <th 
                key={column.key}
                className={`${column.sortable ? styles.sortable : ''} ${sorting.field === column.key ? styles.sorted : ''} table-center-th`}
                onClick={column.sortable ? () => handleSort(column.key) : undefined}
                style={{ width: column.width }}
              >
                <div className={styles.headerContent}>
                  <span>{column.title}</span>
                  {column.sortable && sorting.field === column.key && (
                    <span className={styles.sortIcon}>
                      {sorting.order === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
            {(config.hasEdit || config.customActions) && (
              <th className={`${styles.actionsHeader} table-center-th`}>操作</th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item: any, index: number) => (
            <tr key={item.id || index} className={styles.tableRow}>
              {config.columns.map((column) => (
                <td key={column.key} className={`${styles.tableCell} table-center-td`}>
                  {formatValue(item[column.key], column)}
                </td>
              ))}
              {(config.hasEdit || config.customActions) && (
                <td className={`table-center-td ${styles.actionsCell}`}>
                  <div className={styles.actionButtons}>
                    {config.hasEdit && (
                      <button
                        onClick={() => handleEdit(item)}
                        className={styles.editButton}
                        title="編輯"
                      >
                        ✏️
                      </button>
                    )}
                    {config.customActions?.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={() => action.onClick(item)}
                        className={`${styles.actionButton} ${action.className || ''}`}
                        title={action.label}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* 分頁控制 */}
      {paginationEnabled && pagination && paginationActions && (
        <div className={styles.paginationContainer}>
          <PaginationControls
            pagination={pagination}
            actions={paginationActions}
            className={styles.paginationControls}
          />
        </div>
      )}

      {/* 編輯模態框 */}
      {shouldShowModal && (
        <EditModal
          config={config}
          editModal={editModal}
          handleCancel={handleCancel}
          handleSave={handleSave}
          handleInputChange={handleInputChange}
          updateMutation={updateMutation}
        />
      )}
    </div>
  );
};