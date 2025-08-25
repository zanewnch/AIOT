/**
 * @fileoverview RBAC 服務統一類型導出
 * 
 * 統一導出所有類型定義，提供單一引用入口
 * 按功能模塊組織導出，便於使用和維護
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-20
 */

// ======================== 基礎實體類型 ========================

// 角色相關類型
export type { RoleDTO, CacheOptions, IRoleQueriesSvc } from './RoleTypes';

// 用戶相關類型
export type { UserDTO, UserCacheOptions, IUserQueriesSvc } from './UserTypes';

// 權限相關類型
export type { 
  PermissionDTO, 
  RolePermissionAssignmentDTO, 
  IRoleToPermissionQueriesSvc,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  IPermissionCommandsSvc,
  UserPermissions,
  IPermissionQueriesSvc
} from './PermissionTypes';

// 會話相關類型
export type { SessionData, ISessionQueriesSvc } from './SessionTypes';

// ======================== 關聯關係類型 ========================

// 用戶角色關聯類型
export type { 
  UserRoleBasicDTO, 
  UserRoleCacheOptions, 
  IUserToRoleQueriesSvc 
} from './RelationshipTypes';

// ======================== 命令操作類型 ========================

// 創建/更新請求類型
export type { 
  CreateUserRequest, 
  UpdateUserRequest,
  CreateRoleRequest, 
  UpdateRoleRequest,
  AssignRolesRequest, 
  RemoveRoleRequest 
} from './CommandTypes';

// 服務介面類型
export type { 
  IRoleCommandsSvc, 
  IRoleToPermissionCommandsSvc 
} from './CommandTypes';

// ======================== 工具類型 ========================

// 分頁相關類型
export type { PaginationParams, PaginatedResult } from './PaginationTypes';
export { PaginationUtils } from './PaginationTypes';