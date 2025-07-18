/**
 * @fileoverview 表格視圖組件索引文件
 * 
 * 此文件提供表格視圖組件的統一導出，包括：
 * - RTK 表格視圖組件
 * - 權限表格視圖組件
 * - 角色表格視圖組件
 * - 用戶表格視圖組件
 * - 角色權限關聯表格視圖組件
 * - 用戶角色關聯表格視圖組件
 * 
 * 此文件作為模組的入口點，簡化了其他組件的導入操作。
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

// 導出 RTK 表格視圖組件 - 使用 Redux Toolkit 的通用表格視圖
export { RTKTableView } from './RTKTableView';

// 導出權限表格視圖組件 - 提供權限管理的表格視圖
export { PermissionTableView } from './PermissionTableView';

// 導出角色表格視圖組件 - 提供角色管理的表格視圖
export { RoleTableView } from './RoleTableView';

// 導出用戶表格視圖組件 - 提供用戶管理的表格視圖
export { UserTableView } from './UserTableView';

// 導出角色權限關聯表格視圖組件 - 提供角色與權限關聯關係的表格視圖
export { RoleToPermissionTableView } from './RoleToPermissionTableView';

// 導出用戶角色關聯表格視圖組件 - 提供用戶與角色關聯關係的表格視圖
export { UserToRoleTableView } from './UserToRoleTableView';