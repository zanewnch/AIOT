/**
 * @fileoverview 表格編輯模態框組件
 * 
 * 專用於表格編輯的模態框組件
 *
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React from "react";
import { TableConfig } from "../../../configs"";
import styles from "../../../styles/TableViewer.module.scss";

interface EditModalProps {
  config: TableConfig;
  editModal: any;
  handleCancel: () => void;
  handleSave: () => void;
  handleInputChange: (field: string, value: any) => void;
  updateMutation: any;
}

export const EditModal: React.FC<EditModalProps> = ({
  config,
  editModal,
  handleCancel,
  handleSave,
  handleInputChange,
  updateMutation,
}) => {
  if (!config.hasEdit || !editModal.isOpen || editModal.tableType !== config.type) {
    return null;
  }

  const editableColumns = config.columns.filter(col => !col.hideInEdit);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        {/* 標題欄 */}
        <div className={styles.modalHeader}>
          <h3>編輯 {config.title}</h3>
          <button onClick={handleCancel} className={styles.closeButton}>
            ×
          </button>
        </div>

        {/* 表單內容 */}
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

        {/* 操作按鈕 */}
        <div className={styles.modalFooter}>
          <button onClick={handleCancel} className={styles.cancelButton}>
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