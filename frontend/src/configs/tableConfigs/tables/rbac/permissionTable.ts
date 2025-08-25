/**
 * @fileoverview 權限表格配置
 * 
 * RBAC 系統中權限管理表格的配置定義
 * 包含權限的查看、編輯、狀態管理等功能配置
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { TableConfig, ColumnConfig } from '../../types';
import { formatters } from '../../formatters';
import { handleServerSidePagination } from '../../utils/paginationHelper';
import { PermissionQuery } from '../../../../hooks/usePermissionQuery';
import { PaginationParams } from '../../../../types/pagination';

/**
 * 權限表格列定義
 * 
 * **設計意圖：**
 * 權限表格需要顯示權限的基本信息、分類、狀態和時間戳
 * 支援按 ID、名稱、分類、狀態進行排序
 */
const permissionColumns: ColumnConfig[] = [
  { key: 'id', title: 'ID', sortable: true, width: '80px' },
  { key: 'name', title: '權限名稱', sortable: true },
  { key: 'description', title: '描述', sortable: false },
  { key: 'category', title: '分類', sortable: true },
  { key: 'isActive', title: '狀態', sortable: true, formatter: formatters.status },
  { key: 'createdAt', title: '建立時間', sortable: true, formatter: formatters.datetime },
  { key: 'updatedAt', title: '更新時間', sortable: true, formatter: formatters.datetime }
];

/**
 * 權限表格配置
 * 
 * **功能特性：**
 * - 支援服務端分頁，預設每頁 10 筆資料
 * - 按 ID 倒序排列，最新建立的權限在前
 * - 支援編輯功能，可修改權限狀態和描述
 * - 自動判斷分頁模式（服務端 vs 客戶端）
 */
export const permissionTableConfig: TableConfig = {
  type: 'permission',
  title: 'Permission Table',
  hasEdit: true,
  enablePagination: true,
  defaultPageSize: 10,
  defaultSortBy: 'id',
  defaultSortOrder: 'DESC',
  columns: permissionColumns,
  
  useData: (params?: PaginationParams) => {
    const permissionQuery = new PermissionQuery();
    const queryResult = permissionQuery.getAllPermissions(params);
    
    // 根據參數自動判斷分頁模式
    if (params) {
      // 服務端分頁模式
      return handleServerSidePagination({ queryResult });
    } else {
      // 非分頁模式 - 直接返回數據陣列
      return {
        data: queryResult.data as any[],
        isLoading: queryResult.isLoading,
        error: queryResult.error,
        refetch: queryResult.refetch
      };
    }
  },
  
  useUpdateMutation: () => {
    const permissionQuery = new PermissionQuery();
    return permissionQuery.useUpdatePermissionData();
  }
};