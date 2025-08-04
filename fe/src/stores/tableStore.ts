/**
 * @fileoverview 表格 UI 狀態管理 - 使用 Zustand
 *
 * 純 UI 狀態管理，不包含數據邏輯：
 * - 活動表格切換
 * - 排序狀態
 * - 編輯模態框狀態
 *
 * 數據相關邏輯在 useTableQuery hooks 中處理
 *
 * @author AIOT Development Team
 * @version 3.0.0 (UI 狀態與數據邏輯分離)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * 表格類型定義
 * cspell:ignore roletopermission usertorole
 */
export type TableType = 'permission' | 'role' | 'roletopermission' | 'user' | 'usertorole' | 'RTK' | 'DronePosition' | 'DroneStatus' | 'DroneCommand' | 'DronePositionsArchive' | 'DroneStatusArchive' | 'DroneCommandsArchive' | 'ArchiveTask' | 'UserActivity' | 'UserPreference';

/**
 * 排序相關類型
 */
export type SortOrder = 'asc' | 'desc';
export type SortField = string; // 改為通用字串類型以支援所有表格欄位

/**
 * 表格 UI Store
 */
interface TableUIStore {
  // UI State
  activeTable: TableType;
  sorting: {
    field: SortField;
    order: SortOrder;
  };
  editModal: {
    isOpen: boolean;
    tableType: TableType;
    editingItem: any | null;
  };

  // UI Actions
  setActiveTable: (tableType: TableType) => void;
  setSorting: (field: SortField, order: SortOrder) => void;
  toggleSortOrder: (field: SortField) => void;

  // Modal Actions
  openEditModal: (tableType: TableType, item: any) => void;
  closeEditModal: () => void;
  updateEditingItem: (item: any) => void;

  // Computed
  isEditModalOpen: () => boolean;
  getEditingItem: () => any | null;
  getSortedField: () => SortField;
  getSortOrder: () => SortOrder;
}

/**
 * Zustand 表格 UI Store
 */
export const useTableUIStore = create<TableUIStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      activeTable: 'permission',
      sorting: {
        field: 'id',
        order: 'desc',
      },
      editModal: {
        isOpen: false,
        tableType: 'permission',
        editingItem: null,
      },

      // UI Actions
      setActiveTable: (tableType) => {
        set({ activeTable: tableType }, false, 'setActiveTable');
      },

      setSorting: (field, order) => {
        set({ sorting: { field, order } }, false, 'setSorting');
      },

      toggleSortOrder: (field) => {
        const currentSorting = get().sorting;
        const newOrder = currentSorting.field === field && currentSorting.order === 'asc'
          ? 'desc'
          : 'asc';
        set({ sorting: { field, order: newOrder } }, false, 'toggleSortOrder');
      },

      // Modal Actions
      openEditModal: (tableType, item) => {
        set({
          editModal: {
            isOpen: true,
            tableType,
            editingItem: item,
          }
        }, false, 'openEditModal');
      },

      closeEditModal: () => {
        set({
          editModal: {
            isOpen: false,
            tableType: 'permission',
            editingItem: null,
          }
        }, false, 'closeEditModal');
      },

      updateEditingItem: (item) => {
        set((state) => ({
          editModal: { ...state.editModal, editingItem: item }
        }), false, 'updateEditingItem');
      },

      // Computed getters
      isEditModalOpen: () => get().editModal.isOpen,
      getEditingItem: () => get().editModal.editingItem,
      getSortedField: () => get().sorting.field,
      getSortOrder: () => get().sorting.order,
    }),
    { name: 'table-ui-store' }
  )
);

/**
 * 便利的 Hook
 */
export const useTableUI = () => {
  const store = useTableUIStore();

  return {
    // State
    activeTable: store.activeTable,
    sorting: store.sorting,
    editModal: store.editModal,

    // Computed
    isEditModalOpen: store.isEditModalOpen(),
    editingItem: store.getEditingItem(),

    // Actions
    switchTable: store.setActiveTable,
    setSorting: store.setSorting,
    toggleSort: store.toggleSortOrder,
    openEdit: store.openEditModal,
    closeEdit: store.closeEditModal,
    updateEditing: store.updateEditingItem,
  };
};
