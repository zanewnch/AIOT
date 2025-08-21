/**
 * @fileoverview 用戶偏好設定表格配置
 * 
 * 用戶個人化設定表格的配置定義
 * 包含主題、語言、時間格式等個人化偏好設定的管理
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { TableConfig, ColumnConfig } from '../../types';
import { formatters } from '../../formatters';
import { handleClientSidePagination } from '../../utils/paginationHelper';
import { UserPreferenceQuery } from '../../../../hooks/useUserPreferenceQuery';
import { PaginationParams } from '../../../../types/pagination';

/**
 * 用戶偏好設定表格列定義
 * 
 * **設計意圖：**
 * 偏好設定表格需要顯示用戶的個人化配置，包含：
 * - 外觀設定：主題、語言、時間格式
 * - 行為設定：自動儲存、自動登出
 * - 系統信息：建立和更新時間
 * 使用專門的格式化函數進行中文化顯示
 */
const userPreferenceColumns: ColumnConfig[] = [
  { key: 'id', title: 'ID', sortable: true, width: '80px' },
  { key: 'userId', title: '用戶ID', sortable: true },
  { key: 'theme', title: '主題', sortable: true, formatter: formatters.theme },
  { key: 'language', title: '語言', sortable: true, formatter: formatters.language },
  { key: 'timeFormat', title: '時間格式', sortable: true, formatter: formatters.timeFormat },
  { key: 'autoSave', title: '自動儲存', sortable: true, formatter: formatters.boolean },
  { key: 'autoLogout', title: '自動登出', sortable: true, formatter: formatters.boolean },
  { key: 'createdAt', title: '建立時間', sortable: true, formatter: formatters.datetime },
  { key: 'updatedAt', title: '更新時間', sortable: true, formatter: formatters.datetime }
];

/**
 * 用戶偏好設定表格配置
 * 
 * **功能特性：**
 * - 支援客戶端分頁，預設每頁 10 筆資料
 * - 按更新時間倒序排列，最近修改的設定在前
 * - 支援編輯功能，可修改用戶偏好設定
 * - 特殊處理：用戶偏好通常是單一對象，轉換為數組格式以配合表格顯示
 */
export const userPreferenceTableConfig: TableConfig = {
  type: 'UserPreference',
  title: 'User Preference Table',
  hasEdit: true,
  enablePagination: true,
  defaultPageSize: 10,
  defaultSortBy: 'updatedAt',
  defaultSortOrder: 'DESC',
  columns: userPreferenceColumns,
  
  useData: (params?: PaginationParams) => {
    const userPreferenceQuery = new UserPreferenceQuery();
    const queryResult = userPreferenceQuery.useUserPreferences();
    
    // 特殊處理：UserPreferences 是單一對象，轉換為數組格式
    const preferences = queryResult.data;
    const dataArray = preferences ? [preferences] : [];
    
    // 創建特殊的查詢結果格式
    const adaptedQueryResult = {
      data: dataArray,
      isLoading: queryResult.isLoading,
      error: queryResult.error,
      refetch: queryResult.refetch
    };
    
    // 使用客戶端分頁處理，但對於單一對象，分頁信息會特殊處理
    if (params) {
      const result = handleClientSidePagination({ queryResult: adaptedQueryResult, params });
      // 對於用戶偏好，强制設定分頁信息
      if (result.paginationData) {
        result.paginationData.hasNextPage = false;
        result.paginationData.hasPrevPage = false;
      }
      return result;
    } else {
      return adaptedQueryResult;
    }
  },
  
  useUpdateMutation: () => {
    const userPreferenceQuery = new UserPreferenceQuery();
    return userPreferenceQuery.useUpdateUserPreferences();
  }
};