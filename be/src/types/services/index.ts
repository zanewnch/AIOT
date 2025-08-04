/**
 * @fileoverview 服務層介面匯出模組
 * 
 * 統一匯出所有服務層相關的介面定義，方便其他模組使用。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

export type { IAuthService, LoginResult } from './IAuthService.js';
export type { IRTKService } from './IRTKService.js';
export type { IPermissionService } from './IPermissionService.js';
export type { IRoleService, RoleDTO, CreateRoleRequest, UpdateRoleRequest } from './IRoleService.js';
export type { IRoleToPermissionService, RolePermissionDTO, PermissionDTO } from './IRoleToPermissionService.js';
export type { IUserService, UserDTO, CreateUserRequest, UpdateUserRequest } from './IUserService.js';
export type { IUserToRoleService, UserRoleDTO } from './IUserToRoleService.js';
export type { IRbacInitService } from './IRbacInitService.js';
export type { IProgressService } from './IProgressService.js';