/**
 * @fileoverview 統一表格視圖組件索引文件
 * 
 * 此文件提供重構後的統一表格視圖組件導出，包括：
 * - 統一的 TableViewer 容器組件
 * - 配置驅動的 GenericTableViewer 組件
 * - 表格配置文件
 * 
 * 重構後的架構特點：
 * - 配置驅動：所有表格通過配置文件統一管理
 * - 統一邏輯：共用數據載入、排序、編輯等邏輯
 * - 懶加載支援：歸檔表格組件按需載入
 * - 更少代碼：移除了 15+ 個單獨的表格組件
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 * @version 2.0.0 - 統一表格架構重構版本
 */

// 導出主要的表格視圖容器組件
export { TableViewer } from './TableViewer';

// 導出通用表格視圖組件（供高階使用）
export { GenericTableContent } from './components/GenericTableContent';

// 注意：以下個別表格組件已被統一的配置驅動架構取代：
// 
// 原有組件 -> 新架構對應
// PermissionTableView -> TableViewer + permission 配置
// RoleTableView -> TableViewer + role 配置
// UserTableView -> TableViewer + user 配置
// RoleToPermissionTableView -> TableViewer + roletopermission 配置
// UserToRoleTableView -> TableViewer + usertorole 配置
// DronePositionTableView -> TableViewer + DronePosition 配置
// DroneStatusTableView -> TableViewer + DroneStatus 配置
// DroneCommandTableView -> TableViewer + DroneCommand 配置
// UserPreferenceTableView -> TableViewer + UserPreference 配置
// ArchiveTaskTableView -> TableViewer + ArchiveTask 配置（懶加載）
// DronePositionsArchiveTableView -> TableViewer + DronePositionsArchive 配置（懶加載）
// DroneStatusArchiveTableView -> TableViewer + DroneStatusArchive 配置（懶加載）
// DroneCommandsArchiveTableView -> TableViewer + DroneCommandsArchive 配置（懶加載）
//
// 所有表格現在通過統一的 TableViewer 組件和 tableConfigs.ts 配置文件管理