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
// export type { IRTKService } from './IRTKService.js'; // 已移除 RTK 功能"
export type { IPermissionService } from './IPermissionService.js';
export type { IPermissionQueriesService } from './IPermissionQueriesService.js';
export type { IPermissionCommandsService } from './IPermissionCommandsService.js';
export type { IRoleService, RoleDTO, CreateRoleRequest, UpdateRoleRequest } from './IRoleService.js';
export type { IRoleQueriesService, RoleDTO as QueryRoleDTO, CacheOptions as RoleCacheOptions } from '../../services/queries/RoleQueriesSvc.js';
export type { IRoleCommandsService, CreateRoleRequest as CommandCreateRoleRequest, UpdateRoleRequest as CommandUpdateRoleRequest } from '../../services/commands/RoleCommandsSvc.js';
export type { IRoleToPermissionService, RolePermissionDTO, PermissionDTO } from './IRoleToPermissionService.js';
export type { IRoleToPermissionQueriesService, PermissionDTO as QueriesPermissionDTO, RoleDTO as QueriesRoleDTO } from './IRoleToPermissionQueriesService.js';
export type { IRoleToPermissionCommandsService } from './IRoleToPermissionCommandsService.js';
// 匯出 CQRS 使用者服務的型別
export type { UserDTO, CacheOptions as UserCacheOptions } from '../../services/queries/UserQueriesSvc.js';
export type { CreateUserRequest, UpdateUserRequest } from '../../services/commands/UserCommandsSvc.js';
// 匯出 CQRS 使用者角色服務的型別
export type { IUserToRoleService, UserRoleDTO } from './IUserToRoleService.js';
export type { IUserToRoleQueriesSvc, RoleDTO as UserToRoleQueriesRoleDTO, UserDTO as UserToRoleQueriesUserDTO, UserRoleBasicDTO, CacheOptions as UserToRoleCacheOptions } from './IUserToRoleQueriesSvc.js';
export type { IUserToRoleCommandsSvc, AssignRolesRequest, RemoveRoleRequest } from './IUserToRoleCommandsSvc.js';
export type { IRbacInitService } from './IRbacInitService.js';
