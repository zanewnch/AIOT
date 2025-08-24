/**
 * @fileoverview RBAC 關聯表格配置
 * 
 * 用戶-角色和角色-權限關聯表格的配置定義
 * 包含關聯關係的查看、編輯、狀態管理等功能配置
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { TableConfig, ColumnConfig } from '../../types';
import { formatters } from '../../formatters';
import { handleClientSidePagination } from '../../utils/paginationHelper';
import { RoleQuery } from '../../../../hooks/useRoleQuery';
import { UserQuery } from '../../../../hooks/useUserQuery';
import { PaginationParams } from '../../../../types/pagination';

/**
 * 角色權限關聯表格列定義
 * 
 * **設計意圖：**
 * 顯示角色與權限之間的關聯關係，包含關聯狀態和建立時間
 */
const roleToPermissionColumns: ColumnConfig[] = [
  { key: 'id', title: 'ID', sortable: true, width: '80px' },
  { key: 'roleId', title: '角色ID', sortable: true },
  { key: 'permissionId', title: '權限ID', sortable: true },
  { key: 'isActive', title: '狀態', sortable: true, formatter: formatters.status },
  { key: 'createdAt', title: '建立時間', sortable: true, formatter: formatters.datetime }
];

/**
 * 用戶角色關聯表格列定義
 * 
 * **設計意圖：**
 * 顯示用戶與角色之間的關聯關係，包含關聯狀態和建立時間
 */
const userToRoleColumns: ColumnConfig[] = [
  { key: 'id', title: 'ID', sortable: true, width: '80px' },
  { key: 'userId', title: '用戶ID', sortable: true },
  { key: 'roleId', title: '角色ID', sortable: true },
  { key: 'isActive', title: '狀態', sortable: true, formatter: formatters.status },
  { key: 'createdAt', title: '建立時間', sortable: true, formatter: formatters.datetime }
];

/**
 * 角色權限關聯表格配置
 * 
 * **功能特性：**
 * - 支援客戶端分頁，預設每頁 10 筆資料
 * - 按建立時間倒序排列，最新關聯在前
 * - 支援編輯功能，可修改關聯狀態
 * - 使用客戶端分頁（API 不支援分頁參數）
 */
export const roleToPermissionTableConfig: TableConfig = {
  type: 'roletopermission',
  title: 'Role to Permission Table',
  hasEdit: true,
  enablePagination: true,
  defaultPageSize: 10,
  defaultSortBy: 'createdAt',
  defaultSortOrder: 'DESC',
  columns: roleToPermissionColumns,
  
  useData: (params?: PaginationParams) => {
    const roleQuery = new RoleQuery();
    // 移除參數，該 hook 不接受分頁參數
    const queryResult = roleQuery.useAllRolePermissions();
    
    // 使用客戶端分頁處理
    return handleClientSidePagination({ queryResult, params });
  },
  
  useUpdateMutation: () => {
    const roleQuery = new RoleQuery();
    return roleQuery.useUpdateRoleData();
  }
};

/**
 * 用戶角色關聯表格配置
 * 
 * **功能特性：**
 * - 支援客戶端分頁，預設每頁 10 筆資料
 * - 按建立時間倒序排列，最新關聯在前
 * - 支援編輯功能，可修改關聯狀態
 * - 使用客戶端分頁（API 不支援分頁參數）
 */
export const userToRoleTableConfig: TableConfig = {
  type: 'usertorole',
  title: 'User to Role Table',
  hasEdit: true,
  enablePagination: true,
  defaultPageSize: 10,
  defaultSortBy: 'createdAt',
  defaultSortOrder: 'DESC',
  columns: userToRoleColumns,
  
  useData: (params?: PaginationParams) => {
    const userQuery = new UserQuery();
    const queryResult = userQuery.useUserRoles();
    
    // 使用客戶端分頁處理
    return handleClientSidePagination({ queryResult, params });
  },
  
  useUpdateMutation: () => {
    const userQuery = new UserQuery();
    return userQuery.useUpdateUser();
  }
};