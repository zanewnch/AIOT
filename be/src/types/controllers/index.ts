/**
 * 控制器介面統一導出
 * 
 * 提供所有控制器介面的統一導出入口，方便其他模組統一引用。
 * 包含所有 RBAC 系統相關的控制器介面定義。
 * 
 * @module Types
 */

export type { IUserController } from './IUserController';
export type { IRoleController } from './IRoleController';
export type { IPermissionController } from './IPermissionController';
export type { IUserToRoleController } from './IUserToRoleController';
export type { IRoleToPermissionController } from './IRoleToPermissionController';
export type { IRBACController } from './IRBACController';