/**
 * @fileoverview 用戶表格配置
 * 
 * RBAC 系統中用戶管理表格的配置定義
 * 包含用戶的查看、編輯、狀態管理、快速操作等功能配置
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { TableConfig, ColumnConfig } from '../../types';
import { formatters } from '../../formatters';
import { handleClientSidePagination } from '../../utils/paginationHelper';
import { UserQuery } from '../../../../hooks/useUserQuery';
import { PaginationParams } from '../../../../types/pagination';

/**
 * 用戶表格列定義
 * 
 * **設計意圖：**
 * 用戶表格需要顯示用戶的基本信息、狀態、最後登入時間等關鍵信息
 * 支援按 ID、用戶名、郵件、狀態、最後登入時間進行排序
 */
const userColumns: ColumnConfig[] = [
  { key: 'id', title: 'ID', sortable: true, width: '80px' },
  { key: 'username', title: '用戶名', sortable: true },
  { key: 'email', title: '電子郵件', sortable: true },
  { key: 'isActive', title: '狀態', sortable: true, formatter: formatters.status },
  { key: 'lastLoginAt', title: '最後登入', sortable: true, formatter: formatters.datetime },
  { key: 'createdAt', title: '建立時間', sortable: true, formatter: formatters.datetime },
  { key: 'updatedAt', title: '更新時間', sortable: true, formatter: formatters.datetime }
];

/**
 * 用戶表格配置
 * 
 * **功能特性：**
 * - 支援客戶端分頁，預設每頁 10 筆資料
 * - 按 ID 倒序排列，最新註冊的用戶在前
 * - 支援編輯功能，可修改用戶信息和狀態
 * - 支援快速操作，如快速啟用/停用用戶
 * - 使用客戶端分頁（因為用戶查詢 API 不支援分頁參數）
 */
export const userTableConfig: TableConfig = {
  type: 'user',
  title: 'User Table',
  hasEdit: true,
  hasQuickActions: true,
  enablePagination: true,
  defaultPageSize: 10,
  defaultSortBy: 'id',
  defaultSortOrder: 'DESC',
  columns: userColumns,
  
  useData: (params?: PaginationParams) => {
    const userQuery = new UserQuery();
    // 移除參數，該 hook 不接受分頁參數
    const queryResult = userQuery.useRbacUsers();
    
    // 使用客戶端分頁處理
    return handleClientSidePagination({ queryResult, params });
  },
  
  useUpdateMutation: () => {
    const userQuery = new UserQuery();
    return userQuery.useUpdateUser();
  }
};