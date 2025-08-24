/**
 * @fileoverview DTO (Data Transfer Object) 統一導出
 * 
 * 統一管理所有的資料傳輸物件，包含請求、回應和驗證邏輯。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

// ===== 基礎 DTO =====
export * from './common/BaseDto';
export * from './common/PaginationDto';

// ===== 用戶相關 DTO =====
export * from './user/UserRequestDto';
export * from './user/UserResponseDto';

// ===== 角色相關 DTO =====
export * from './role/RoleRequestDto';
export * from './role/RoleResponseDto';

// ===== 權限相關 DTO =====
export * from './permission/PermissionRequestDto';
export * from './permission/PermissionResponseDto';

// ===== 用戶角色關係相關 DTO =====
export * from './userRole/UserRoleRequestDto';
export * from './userRole/UserRoleResponseDto';

// ===== 角色權限關係相關 DTO =====
export * from './rolePermission/RolePermissionRequestDto';
export * from './rolePermission/RolePermissionResponseDto';

// ===== 會話相關 DTO =====
export * from './session/SessionRequestDto';
export * from './session/SessionResponseDto';

// Note: All types are re-exported automatically from their respective modules above