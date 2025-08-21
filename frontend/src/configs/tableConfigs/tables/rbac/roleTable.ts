/**
 * @fileoverview 角色表格配置
 * 
 * RBAC 系統中角色管理表格的配置定義
 * 包含角色的查看、編輯、狀態管理等功能配置
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { TableConfig, ColumnConfig } from '../../types';
import { formatters } from '../../formatters';
import { handleServerSidePagination } from '../../utils/paginationHelper';
import { RoleQuery } from '../../../../hooks/useRoleQuery';
import { PaginationParams } from '../../../../types/pagination';

/**
 * 角色表格列定義
 * 
 * **設計意圖：**
 * 角色表格需要顯示角色的基本信息、顯示名稱、描述、狀態和時間戳
 * 支援按 ID、名稱、顯示名稱、狀態進行排序
 */
const roleColumns: ColumnConfig[] = [
  { key: 'id', title: 'ID', sortable: true, width: '80px' },
  { key: 'name', title: '角色名稱', sortable: true },
  { key: 'displayName', title: '顯示名稱', sortable: true },
  { key: 'description', title: '描述', sortable: false },
  { key: 'isActive', title: '狀態', sortable: true, formatter: formatters.status },
  { key: 'createdAt', title: '建立時間', sortable: true, formatter: formatters.datetime },
  { key: 'updatedAt', title: '更新時間', sortable: true, formatter: formatters.datetime }
];

/**
 * 角色表格配置
 * 
 * **功能特性：**
 * - 支援服務端分頁，預設每頁 10 筆資料
 * - 按 ID 倒序排列，最新建立的角色在前
 * - 支援編輯功能，可修改角色信息和狀態
 * - 統一使用分頁模式，確保數據格式一致性
 */
export const roleTableConfig: TableConfig = {
  type: 'role',
  title: 'Role Table',
  hasEdit: true,
  enablePagination: true,
  defaultPageSize: 10,
  defaultSortBy: 'id',
  defaultSortOrder: 'DESC',
  columns: roleColumns,
  
  useData: (params: PaginationParams = { page: 1, pageSize: 20, sortBy: 'id', sortOrder: 'DESC' }) => {
    const roleQuery = new RoleQuery();
    const queryResult = roleQuery.useRoleData(params);
    
    // 角色查詢統一使用服務端分頁模式
    return handleServerSidePagination({ queryResult });
  },
  
  useUpdateMutation: () => {
    const roleQuery = new RoleQuery();
    return roleQuery.useUpdateRoleData();
  }
};