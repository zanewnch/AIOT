/**
 * @fileoverview 編輯模態框邏輯 Hook
 * 
 * 專門處理編輯模態框的顯示邏輯
 *
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { useMemo } from 'react';
import { TableConfig } from "../../../configs";

interface UseEditModalProps {
  config: TableConfig;
  editModal: any;
}

interface UseEditModalReturn {
  shouldShowModal: boolean;
  editableColumns: any[];
}

/**
 * 編輯模態框邏輯 Hook
 */
export const useEditModal = ({ config, editModal }: UseEditModalProps): UseEditModalReturn => {
  
  // 計算是否應該顯示模態框
  const shouldShowModal = useMemo(() => {
    return !!(
      config.hasEdit && 
      editModal.isOpen && 
      editModal.tableType === config.type
    );
  }, [config.hasEdit, config.type, editModal.isOpen, editModal.tableType]);

  // 計算可編輯的欄位
  const editableColumns = useMemo(() => {
    return config.columns.filter(col => !col.hideInEdit);
  }, [config.columns]);

  return {
    shouldShowModal,
    editableColumns,
  };
};