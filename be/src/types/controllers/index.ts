/**
 * @fileoverview 控制器介面統一導出模組
 * 
 * 提供所有控制器介面的統一導出入口，方便其他模組統一引用。
 * 包含所有 RBAC（Role-Based Access Control）系統相關的控制器介面定義。
 * 
 * 此模組遵循 TypeScript 的 re-export 模式，將所有控制器介面類型統一導出，
 * 便於在其他模組中進行統一引用和類型檢查。
 * 
 * @module Types/Controllers
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024
 */

// 導出使用者控制器介面類型，用於定義使用者相關的 CRUD 操作方法
export type { IUserController } from './IUserController';

// 導出角色控制器介面類型，用於定義角色相關的 CRUD 操作方法
export type { IRoleController } from './IRoleController';

// 導出權限控制器介面類型，用於定義權限相關的 CRUD 操作方法
export type { IPermissionController } from './IPermissionController';

// 導出使用者角色關聯控制器介面類型，用於管理使用者與角色之間的多對多關係
export type { IUserToRoleController } from './IUserToRoleController';

// 導出角色權限關聯控制器介面類型，用於管理角色與權限之間的多對多關係
export type { IRoleToPermissionController } from './IRoleToPermissionController';

// 導出 RBAC 主控制器介面類型，用於整合所有角色權限相關的子控制器業務邏輯
export type { IRBACController } from './IRBACController';

// 導出進度追蹤控制器介面類型，用於處理進度查詢和即時進度串流的 HTTP 端點
export type { IProgressController } from './IProgressController';