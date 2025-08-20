/**
 * @fileoverview 通用表格視圖組件
 * 
 * 此組件提供統一的表格視圖功能，包括：
 * - 配置驅動的表格渲染
 * - 統一的數據載入和錯誤處理
 * - 排序功能
 * - 編輯模態框
 * - 樂觀更新支援
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React, { useMemo } from 'react';
import { useTableUIStore } from '../../stores/tableStore';
import LoadingSpinner from '../common/LoadingSpinner';
import { createLogger } from '../../configs/loggerConfig';
import { TableConfig } from '../../configs/tableConfigs';
import styles from '../../styles/TableViewer.module.scss';

/**
 * 通用表格視圖組件的屬性介面
 */
interface GenericTableViewerProps {
  /** 表格配置 */
  config: TableConfig;
  /** 可選的自定義 CSS 類名 */
  className?: string;
}

/**
 * 通用表格視圖組件
 * 
 * 此組件根據配置動態渲染表格，提供統一的數據處理邏輯
 */
export const GenericTableViewer: React.FC<GenericTableViewerProps> = ({ config, className }) => {
  // 創建組件專用的日誌記錄器
  const logger = createLogger(`GenericTableViewer-${config.type}`);

  // 使用配置中的數據獲取 hook
  const { data, isLoading, error, refetch } = config.useData();
  
  // 獲取更新 mutation（現在所有表格都支持編輯）
  const updateMutation = config.useUpdateMutation();
  
  // Zustand stores for UI state
  const {
    editModal,
    sorting,
    openEditModal,
    closeEditModal,
    updateEditingItem,
    toggleSortOrder
  } = useTableUIStore();

  /**
   * 處理排序
   */
  const handleSort = (field: string) => {
    logger.debug('表格排序', { 
      tableType: config.type,
      field, 
      currentOrder: sorting.order, 
      operation: 'sort' 
    });
    toggleSortOrder(field as any);
  };

  /**
   * 排序數據
   */
  const sortedData = useMemo(() => {
    if (!data) return [];
    
    const sorted = [...data];
    sorted.sort((a, b) => {
      const aValue = a[sorting.field];
      const bValue = b[sorting.field];
      
      if (aValue < bValue) return sorting.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sorting.order === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [data, sorting]);

  /**
   * 處理編輯操作
   */
  const handleEdit = (item: any) => {
    if (!config.hasEdit) return;
    
    logger.info('開始編輯項目', { 
      tableType: config.type,
      itemId: item?.id, 
      operation: 'edit' 
    });
    openEditModal(config.type, item);
  };

  /**
   * 處理保存操作
   */
  const handleSave = async () => {
    if (!editModal.editingItem || !updateMutation) {
      logger.warn('無法保存：缺少編輯項目或更新功能', { 
        tableType: config.type,
        hasEditingItem: !!editModal.editingItem,
        hasUpdateMutation: !!updateMutation
      });
      return;
    }

    const itemId = editModal.editingItem.id;
    logger.info('開始保存項目', { 
      tableType: config.type,
      itemId, 
      operation: 'save' 
    });

    try {
      await updateMutation.mutateAsync({
        id: itemId,
        data: editModal.editingItem
      });

      logger.info('項目更新成功', { 
        tableType: config.type,
        itemId, 
        operation: 'save_success' 
      });
      closeEditModal();
      refetch();
    } catch (error) {
      logger.error('項目更新失敗', {
        tableType: config.type,
        itemId,
        error: (error as Error).message,
        operation: 'save_error'
      });
    }
  };

  /**
   * 處理輸入值變更
   */
  const handleInputChange = (field: string, value: any) => {
    if (!editModal.editingItem) return;

    const updatedItem = {
      ...editModal.editingItem,
      [field]: value
    };
    
    updateEditingItem(updatedItem);
    logger.debug('編輯項目欄位更新', { 
      tableType: config.type,
      field, 
      value, 
      operation: 'field_update' 
    });
  };

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

  /**
   * 渲染編輯模態框
   */
  const renderEditModal = () => {
    if (!config.hasEdit || !editModal.isOpen || editModal.tableType !== config.type) {
      return null;
    }

    const editableColumns = config.columns.filter(col => !col.hideInEdit);

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h3>編輯 {config.title}</h3>
            <button onClick={closeEditModal} className={styles.closeButton}>
              ×
            </button>
          </div>
          <div className={styles.modalBody}>
            {editableColumns.map((column) => (
              <div key={column.key} className={styles.formGroup}>
                <label htmlFor={column.key}>{column.title}:</label>
                <input
                  id={column.key}
                  type="text"
                  value={editModal.editingItem?.[column.key] || ''}
                  onChange={(e) => handleInputChange(column.key, e.target.value)}
                  className={styles.input}
                />
              </div>
            ))}
          </div>
          <div className={styles.modalFooter}>
            <button onClick={closeEditModal} className={styles.cancelButton}>
              取消
            </button>
            <button 
              onClick={handleSave} 
              className={styles.saveButton}
              disabled={updateMutation?.isLoading}
            >
              {updateMutation?.isLoading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    );
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
    <div className={`${styles.tableContainer} ${className || ''}`}>
      {/* 表格 */}
      <table 
        className={styles.table} 
        style={{ '--row-count': sortedData.length } as React.CSSProperties}
      >
        <thead>
          <tr>
            {config.columns.map((column) => (
              <th 
                key={column.key}
                className={`${column.sortable ? styles.sortable : ''} ${sorting.field === column.key ? styles.sorted : ''}`}
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
              <th className={styles.actionsHeader}>操作</th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item: any, index: number) => (
            <tr key={item.id || index} className={styles.tableRow}>
              {config.columns.map((column) => (
                <td key={column.key} className={styles.tableCell}>
                  {formatValue(item[column.key], column)}
                </td>
              ))}
              {(config.hasEdit || config.customActions) && (
                <td className={styles.actionsCell}>
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

      {/* 編輯模態框 */}
      {renderEditModal()}
    </div>
  );
};