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
export type TableType = 'permission' | 'role' | 'roletopermission' | 'user' | 'usertorole' | 'RTK' | 'DronePosition' | 'DroneStatus' | 'DroneCommand' | 'DronePositionsArchive' | 'DroneStatusArchive' | 'DroneCommandsArchive' | 'ArchiveTask' | 'UserPreference';

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
      /**
       * 設定目前活躍的表格類型
       * 
       * @param tableType - 要切換到的表格類型
       * 
       * @example
       * ```typescript
       * setActiveTable('user');       // 切換到使用者表格
       * setActiveTable('permission'); // 切換到權限表格
       * ```
       */
      setActiveTable: (tableType) => {
        set({ activeTable: tableType }, false, 'setActiveTable');
      },

      /**
       * 直接設定排序狀態
       * 
       * @param field - 要排序的欄位名稱
       * @param order - 排序順序，'asc' 或 'desc'
       * 
       * @example
       * ```typescript
       * setSorting('createdAt', 'desc'); // 設定按創建時間降序
       * setSorting('name', 'asc');       // 設定按名稱升序
       * ```
       */
      setSorting: (field, order) => {
        set({ sorting: { field, order } }, false, 'setSorting');
      },

      /**
       * 切換排序順序
       * 
       * 根據當前排序狀態切換字段的排序順序：
       * - 如果當前字段為升序（asc），則切換為降序（desc）
       * - 如果當前字段為降序或者是不同字段，則設置為升序（asc）
       * 
       * @param field - 要排序的字段名
       * 
       * @example
       * ```typescript
       * // 首次點擊某字段 -> 升序
       * toggleSortOrder('createdAt');
       * 
       * // 再次點擊同一字段 -> 降序
       * toggleSortOrder('createdAt');
       * 
       * // 點擊不同字段 -> 該字段升序
       * toggleSortOrder('updatedAt');
       * ```
       */
      toggleSortOrder: (field) => {
        const currentSorting = get().sorting;
        const newOrder = currentSorting.field === field && currentSorting.order === 'asc'
          ? 'desc'
          : 'asc';
        set({ sorting: { field, order: newOrder } }, false, 'toggleSortOrder');
      },

      // Modal Actions
      /**
       * 開啟編輯模態框
       * 
       * @param tableType - 表格類型，用於決定模態框的內容
       * @param item - 要編輯的項目資料
       * 
       * @example
       * ```typescript
       * openEditModal('user', { id: 1, username: 'admin' });
       * openEditModal('role', { id: 1, name: 'admin' });
       * ```
       */
      openEditModal: (tableType, item) => {
        set({
          editModal: {
            isOpen: true,
            tableType,
            editingItem: item,
          }
        }, false, 'openEditModal');
      },

      /**
       * 關閉編輯模態框
       * 
       * 重設模態框狀態為預設值
       * 
       * @example
       * ```typescript
       * closeEditModal(); // 關閉模態框並清空編輯資料
       * ```
       */
      closeEditModal: () => {
        set({
          editModal: {
            isOpen: false,
            tableType: 'permission',
            editingItem: null,
          }
        }, false, 'closeEditModal');
      },

      /**
       * 更新正在編輯的項目資料
       * 
       * @param item - 新的項目資料
       * 
       * @example
       * ```typescript
       * updateEditingItem({ id: 1, username: 'new-username' });
       * ```
       */
      updateEditingItem: (item) => {
        set((state) => ({
          editModal: { ...state.editModal, editingItem: item }
        }), false, 'updateEditingItem');
      },

      // Computed getters
      /**
       * 檢查編輯模態框是否開啟
       * 
       * @returns 模態框開啟時返回 true，否則返回 false
       * 
       * @example
       * ```typescript
       * if (isEditModalOpen()) {
       *   console.log('模態框目前開啟中');
       * }
       * ```
       */
      isEditModalOpen: () => get().editModal.isOpen,
      /**
       * 取得目前正在編輯的項目
       * 
       * @returns 返回正在編輯的項目資料，無編輯項目時返回 null
       * 
       * @example
       * ```typescript
       * const editingItem = getEditingItem();
       * if (editingItem) {
       *   console.log('正在編輯:', editingItem);
       * }
       * ```
       */
      getEditingItem: () => get().editModal.editingItem,
      /**
       * 取得目前排序的欄位
       * 
       * @returns 返回目前排序使用的欄位名稱
       * 
       * @example
       * ```typescript
       * const sortField = getSortedField();
       * console.log(`目前按 ${sortField} 排序`);
       * ```
       */
      getSortedField: () => get().sorting.field,
      /**
       * 取得目前排序順序
       * 
       * @returns 返回目前的排序順序，'asc' 或 'desc'
       * 
       * @example
       * ```typescript
       * const order = getSortOrder();
       * console.log(`目前排序順序: ${order}`);
       * ```
       */
      getSortOrder: () => get().sorting.order,
    }),
    { name: 'table-ui-store' }
  )
);

/**
 * 便利的 Hook，提供表格 UI 狀態和操作方法
 * 
 * 將 tableStore 的所有功能重新組織為更便於使用的格式
 * 
 * @returns 返回包含狀態和操作方法的物件
 * 
 * @example
 * ```typescript
 * const { activeTable, sorting, editModal, setActiveTable, toggleSort } = useTableUI();
 * 
 * // 使用狀態
 * console.log('目前表格:', activeTable);
 * 
 * // 使用操作方法
 * setActiveTable('user');
 * toggleSort('createdAt');
 * ```
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
