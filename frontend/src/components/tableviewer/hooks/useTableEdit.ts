/**
 * @fileoverview 表格編輯邏輯 Hook
 * 
 * 統一管理表格編輯、保存、快速操作邏輯
 *
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { useTableUIStore } from '../../../stores';
import { TableConfig } from "../../../configs"';
import { createLogger } from '../../../configs/loggerConfig';

interface UseTableEditProps {
  config: TableConfig;
  updateMutation: any;
  refetch: () => void;
}

interface UseTableEditReturn {
  editModal: any;
  handleEdit: (item: any) => void;
  handleSave: () => Promise<void>;
  handleCancel: () => void;
  handleQuickToggle: (item: any, field: string) => Promise<void>;
  handleInputChange: (field: string, value: any) => void;
  updateEditingItem: (updates: any) => void;
}

/**
 * 表格編輯邏輯 Hook
 * 
 * 提供編輯、保存、快速操作功能
 */
export const useTableEdit = ({ 
  config, 
  updateMutation, 
  refetch 
}: UseTableEditProps): UseTableEditReturn => {
  const logger = createLogger(`TableEdit-${config.type}`);
  
  const {
    editModal,
    openEditModal,
    closeEditModal,
    updateEditingItem,
  } = useTableUIStore();

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
      logger.error('保存失敗', { 
        tableType: config.type,
        itemId, 
        error: error,
        operation: 'save_error' 
      });
    }
  };

  /**
   * 處理取消操作
   */
  const handleCancel = () => {
    logger.info('取消編輯', { 
      tableType: config.type,
      operation: 'cancel' 
    });
    closeEditModal();
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
    
    logger.debug('更新編輯項目字段', { 
      tableType: config.type,
      field, 
      value, 
      operation: 'input_change' 
    });
    
    updateEditingItem(updatedItem);
  };

  /**
   * 處理快速切換操作
   */
  const handleQuickToggle = async (item: any, field: string) => {
    if (!config.hasQuickActions || !updateMutation) return;

    logger.info('快速切換狀態', { 
      tableType: config.type,
      itemId: item.id, 
      field, 
      currentValue: item[field],
      operation: 'quick_toggle' 
    });

    try {
      const updatedItem = {
        ...item,
        [field]: !item[field]
      };

      await updateMutation.mutateAsync({
        id: item.id,
        data: updatedItem
      });

      logger.info('快速切換成功', { 
        tableType: config.type,
        itemId: item.id,
        field,
        newValue: updatedItem[field],
        operation: 'quick_toggle_success' 
      });

      refetch();
    } catch (error) {
      logger.error('快速切換失敗', { 
        tableType: config.type,
        itemId: item.id,
        field,
        error,
        operation: 'quick_toggle_error' 
      });
    }
  };

  return {
    editModal,
    handleEdit,
    handleSave,
    handleCancel,
    handleQuickToggle,
    handleInputChange,
    updateEditingItem,
  };
};