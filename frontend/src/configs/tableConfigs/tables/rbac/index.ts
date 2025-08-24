/**
 * @fileoverview RBAC 表格配置統一導出
 * 
 * 統一導出所有 RBAC 相關的表格配置
 * 包含權限、角色、用戶及其關聯關係的表格配置
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

export { permissionTableConfig } from './permissionTable';
export { roleTableConfig } from './roleTable';
export { userTableConfig } from './userTable';
export { roleToPermissionTableConfig, userToRoleTableConfig } from './relationTables';