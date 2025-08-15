/**
 * @fileoverview RBAC (Role-Based Access Control) 路由配置 - 集中式權限管理版本
 *
 * 此文件定義了完整的 RBAC 系統路由端點，包括：
 * - 使用者管理 (CRUD 操作)
 * - 角色管理 (CRUD 操作)
 * - 權限管理 (CRUD 操作)
 * - 使用者角色關聯管理
 * - 角色權限關聯管理
 *
 * 認證和授權現在由 Kong Gateway + OPA 集中處理
 *
 * @module Routes/RbacRoutes
 * @version 2.0.0
 * @author AIOT Team
 */

import { Router } from 'express';
import { UserQueries } from '../controllers/queries/UserQueriesCtrl';
import { UserCommands } from '../controllers/commands/UserCommandsCtrl';
import { RoleQueries } from '../controllers/queries/RoleQueriesCtrl';
import { RoleCommands } from '../controllers/commands/RoleCommandsCtrl';
import { PermissionQueries } from '../controllers/queries/PermissionQueriesCtrl';
import { PermissionCommands } from '../controllers/commands/PermissionCommandsCtrl';
import { UserToRoleQueries } from '../controllers/queries/UserToRoleQueriesCtrl';
import { UserToRoleCommands } from '../controllers/commands/UserToRoleCommandsCtrl';
import { RoleToPermissionQueries } from '../controllers/queries/RoleToPermissionQueriesCtrl';
import { RoleToPermissionCommands } from '../controllers/commands/RoleToPermissionCommandsCtrl';
import { container } from '../container/container';
import { TYPES } from '../container/types';

/**
 * RBAC 路由類別 - 集中式權限管理版本
 *
 * 所有認證和權限檢查現在由 Kong Gateway + OPA 處理
 */
class RbacRoutes {
  private router: Router;
  private userQueries: UserQueries;
  private userCommands: UserCommands;
  private roleQueries: RoleQueries;
  private roleCommands: RoleCommands;
  private permissionQueries: PermissionQueries;
  private permissionCommands: PermissionCommands;
  private userToRoleQueries: UserToRoleQueries;
  private userToRoleCommands: UserToRoleCommands;
  private roleToPermissionQueries: RoleToPermissionQueries;
  private roleToPermissionCommands: RoleToPermissionCommands;

  // 路由端點常數 - 集中管理所有 API 路徑
  private readonly ROUTES = {
    // 使用者管理路由 (Kong strip_path 後的內部路徑)
    USERS: '/users',
    USER_BY_ID: '/users/:userId',
    
    // 角色管理路由
    ROLES: '/roles',
    ROLE_BY_ID: '/roles/:roleId',
    
    // 權限管理路由
    PERMISSIONS: '/permissions',
    PERMISSION_BY_ID: '/permissions/:permissionId',
    
    // 使用者角色關聯路由
    USER_ROLES: '/user-roles',
    USER_ROLE_BY_ID: '/user-roles/:userRoleId',
    
    // 角色權限關聯路由
    ROLE_PERMISSIONS: '/role-permissions',
    ROLE_PERMISSION_BY_ID: '/role-permissions/:rolePermissionId'
  } as const;

  constructor() {
    this.router = Router();
    this.userQueries = container.get<UserQueries>(TYPES.UserQueriesCtrl);
    this.userCommands = container.get<UserCommands>(TYPES.UserCommandsCtrl);
    this.roleQueries = container.get<RoleQueries>(TYPES.RoleQueriesCtrl);
    this.roleCommands = container.get<RoleCommands>(TYPES.RoleCommandsCtrl);
    this.permissionQueries = container.get<PermissionQueries>(TYPES.PermissionQueriesCtrl);
    this.permissionCommands = container.get<PermissionCommands>(TYPES.PermissionCommandsCtrl);
    this.userToRoleQueries = container.get<UserToRoleQueries>(TYPES.UserToRoleQueriesCtrl);
    this.userToRoleCommands = container.get<UserToRoleCommands>(TYPES.UserToRoleCommandsCtrl);
    this.roleToPermissionQueries = container.get<RoleToPermissionQueries>(TYPES.RoleToPermissionQueriesCtrl);
    this.roleToPermissionCommands = container.get<RoleToPermissionCommands>(TYPES.RoleToPermissionCommandsCtrl);
    
    this.setupUserRoutes();
    this.setupRoleRoutes();
    this.setupPermissionRoutes();
    this.setupUserRoleRoutes();
    this.setupRolePermissionRoutes();
  }

  /**
   * 設定使用者管理路由 - 權限檢查由 Kong Gateway 處理
   */
  private setupUserRoutes = (): void => {
    this.router.get(this.ROUTES.USERS, (req, res) => this.userQueries.getUsers(req, res));
    this.router.post(this.ROUTES.USERS, (req, res) => this.userCommands.createUser(req, res));
    this.router.get(this.ROUTES.USER_BY_ID, (req, res) => this.userQueries.getUserById(req, res));
    this.router.put(this.ROUTES.USER_BY_ID, (req, res) => this.userCommands.updateUser(req, res));
    this.router.delete(this.ROUTES.USER_BY_ID, (req, res) => this.userCommands.deleteUser(req, res));
  }

  /**
   * 設定角色管理路由 - 權限檢查由 Kong Gateway 處理
   */
  private setupRoleRoutes = (): void => {
    this.router.get(this.ROUTES.ROLES, (req, res) => this.roleQueries.getRoles(req, res));
    this.router.post(this.ROUTES.ROLES, (req, res) => this.roleCommands.createRole(req, res));
    this.router.get(this.ROUTES.ROLE_BY_ID, (req, res) => this.roleQueries.getRoleById(req, res));
    this.router.put(this.ROUTES.ROLE_BY_ID, (req, res) => this.roleCommands.updateRole(req, res));
    this.router.delete(this.ROUTES.ROLE_BY_ID, (req, res) => this.roleCommands.deleteRole(req, res));
  }

  /**
   * 設定權限管理路由 - 權限檢查由 Kong Gateway 處理
   */
  private setupPermissionRoutes = (): void => {
    this.router.get(this.ROUTES.PERMISSIONS, (req, res) => this.permissionQueries.getPermissions(req, res));
    this.router.post(this.ROUTES.PERMISSIONS, (req, res) => this.permissionCommands.createPermission(req, res));
    this.router.get(this.ROUTES.PERMISSION_BY_ID, (req, res) => this.permissionQueries.getPermissionById(req, res));
    this.router.put(this.ROUTES.PERMISSION_BY_ID, (req, res) => this.permissionCommands.updatePermission(req, res));
    this.router.delete(this.ROUTES.PERMISSION_BY_ID, (req, res) => this.permissionCommands.deletePermission(req, res));
  }

  /**
   * 設定使用者角色關聯路由 - 權限檢查由 Kong Gateway 處理
   */
  private setupUserRoleRoutes = (): void => {
    this.router.get(this.ROUTES.USER_ROLES, (req, res) => this.userToRoleQueries.getUserRoles(req, res));
    this.router.post(this.ROUTES.USER_ROLES, (req, res) => this.userToRoleCommands.createUserRole(req, res));
    this.router.get(this.ROUTES.USER_ROLE_BY_ID, (req, res) => this.userToRoleQueries.getUserRoleById(req, res));
    this.router.put(this.ROUTES.USER_ROLE_BY_ID, (req, res) => this.userToRoleCommands.updateUserRole(req, res));
    this.router.delete(this.ROUTES.USER_ROLE_BY_ID, (req, res) => this.userToRoleCommands.deleteUserRole(req, res));
  }

  /**
   * 設定角色權限關聯路由 - 權限檢查由 Kong Gateway 處理
   */
  private setupRolePermissionRoutes = (): void => {
    this.router.get(this.ROUTES.ROLE_PERMISSIONS, (req, res) => this.roleToPermissionQueries.getRolePermissions(req, res));
    this.router.post(this.ROUTES.ROLE_PERMISSIONS, (req, res) => this.roleToPermissionCommands.createRolePermission(req, res));
    this.router.get(this.ROUTES.ROLE_PERMISSION_BY_ID, (req, res) => this.roleToPermissionQueries.getRolePermissionById(req, res));
    this.router.put(this.ROUTES.ROLE_PERMISSION_BY_ID, (req, res) => this.roleToPermissionCommands.updateRolePermission(req, res));
    this.router.delete(this.ROUTES.ROLE_PERMISSION_BY_ID, (req, res) => this.roleToPermissionCommands.deleteRolePermission(req, res));
  }

  /**
   * 取得路由器實例
   *
   * @returns {Router} Express 路由器實例
   */
  public getRouter(): Router {
    return this.router;
  }
}

/**
 * 匯出 RBAC 路由實例
 */
export const rbacRoutes = new RbacRoutes().getRouter();