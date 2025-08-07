/**
 * @fileoverview RBAC (Role-Based Access Control) 路由配置
 *
 * 此文件定義了完整的 RBAC 系統路由端點，包括：
 * - 使用者管理 (CRUD 操作)
 * - 角色管理 (CRUD 操作)
 * - 權限管理 (CRUD 操作)
 * - 使用者角色關聯管理
 * - 角色權限關聯管理
 *
 * 所有端點都需要 JWT 認證，並實施細粒度的權限控制。
 * 支援多重權限驗證，確保操作的安全性。
 *
 * @module Routes/RbacRoutes
 * @version 1.0.0
 * @author AIOT Team
 */

import { Router } from 'express';
import { UserQueries } from '../controllers/queries/UserQueriesCtrl.js';
import { UserCommands } from '../controllers/commands/UserCommandsCtrl.js';
import { RoleQueries } from '../controllers/queries/RoleQueriesCtrl.js';
import { RoleCommands } from '../controllers/commands/RoleCommandsCtrl.js';
import { PermissionQueries } from '../controllers/queries/PermissionQueriesCtrl.js';
import { PermissionCommands } from '../controllers/commands/PermissionCommandsCtrl.js';
import { UserToRoleQueries } from '../controllers/queries/UserToRoleQueriesCtrl.js';
import { UserToRoleCommands } from '../controllers/commands/UserToRoleCommandsCtrl.js';
import { RoleToPermissionQueries } from '../controllers/queries/RoleToPermissionQueriesCtrl.js';
import { RoleToPermissionCommands } from '../controllers/commands/RoleToPermissionCommandsCtrl.js';
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js';
import { PermissionMiddleware } from '../middlewares/PermissionMiddleware.js';
import { ErrorHandleMiddleware } from '../middlewares/ErrorHandleMiddleware.js';
import { container } from '../container/container.js';
import { TYPES } from '../types/container/dependency-injection.js';

/**
 * RBAC 路由類別
 *
 * 負責配置和管理所有 RBAC 相關的路由端點
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
  private authMiddleware: AuthMiddleware;
  private permissionMiddleware: PermissionMiddleware;

  // 路由端點常數 - 集中管理所有 API 路徑
  private readonly ROUTES = {
    // 使用者管理路由
    USERS: '/api/rbac/users',
    USER_BY_ID: '/api/rbac/users/:userId',
    
    // 角色管理路由
    ROLES: '/api/rbac/roles',
    ROLE_BY_ID: '/api/rbac/roles/:roleId',
    
    // 權限管理路由
    PERMISSIONS: '/api/rbac/permissions',
    PERMISSION_BY_ID: '/api/rbac/permissions/:permissionId',
    
    // 使用者角色關聯路由
    USER_ROLES: '/api/rbac/user-roles',
    USER_ROLE_BY_ID: '/api/rbac/user-roles/:userRoleId',
    
    // 角色權限關聯路由
    ROLE_PERMISSIONS: '/api/rbac/role-permissions',
    ROLE_PERMISSION_BY_ID: '/api/rbac/role-permissions/:rolePermissionId'
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
    this.authMiddleware = new AuthMiddleware();
    this.permissionMiddleware = new PermissionMiddleware();
    
    this.setupUserRoutes();
    this.setupRoleRoutes();
    this.setupPermissionRoutes();
    this.setupUserRoleRoutes();
    this.setupRolePermissionRoutes();
  }

  /**
   * 設定使用者管理路由
   */
  private setupUserRoutes = (): void => {
    // GET /api/rbac/users - 獲取所有使用者
    this.router.get(this.ROUTES.USERS,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('user.read'),
      (req, res) => this.userQueries.getUsers(req, res)
    );

    // POST /api/rbac/users - 建立新使用者
    this.router.post(this.ROUTES.USERS,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('user.create'),
      (req, res) => this.userCommands.createUser(req, res)
    );

    // GET /api/rbac/users/:userId - 根據 ID 獲取使用者
    this.router.get(this.ROUTES.USER_BY_ID,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('user.read'),
      (req, res) => this.userQueries.getUserById(req, res)
    );

    // PUT /api/rbac/users/:userId - 更新使用者
    this.router.put(this.ROUTES.USER_BY_ID,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('user.update'),
      (req, res) => this.userCommands.updateUser(req, res)
    );

    // DELETE /api/rbac/users/:userId - 刪除使用者
    this.router.delete(this.ROUTES.USER_BY_ID,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('user.delete'),
      (req, res) => this.userCommands.deleteUser(req, res)
    );
  }

  /**
   * 設定角色管理路由
   */
  private setupRoleRoutes = (): void => {

    // GET /api/rbac/roles - 獲取所有角色
    this.router.get(this.ROUTES.ROLES,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('role.read'),
      (req, res) => this.roleQueries.getRoles(req, res)
    );

    // POST /api/rbac/roles - 建立新角色
    this.router.post(this.ROUTES.ROLES,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('role.create'),
      (req, res) => this.roleCommands.createRole(req, res)
    );

    // GET /api/rbac/roles/:roleId - 根據 ID 獲取角色
    this.router.get(this.ROUTES.ROLE_BY_ID,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('role.read'),
      (req, res) => this.roleQueries.getRoleById(req, res)
    );

    // PUT /api/rbac/roles/:roleId - 更新角色
    this.router.put(this.ROUTES.ROLE_BY_ID,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('role.update'),
      (req, res) => this.roleCommands.updateRole(req, res)
    );

    // DELETE /api/rbac/roles/:roleId - 刪除角色
    this.router.delete(this.ROUTES.ROLE_BY_ID,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('role.delete'),
      (req, res) => this.roleCommands.deleteRole(req, res)
    );
  }

  /**
   * 設定權限管理路由
   */
  private setupPermissionRoutes = (): void => {

    // GET /api/rbac/permissions - 獲取所有權限
    this.router.get(this.ROUTES.PERMISSIONS,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('permission.read'),
      (req, res) => this.permissionQueries.getPermissions(req, res)
    );

    // POST /api/rbac/permissions - 建立新權限
    this.router.post(this.ROUTES.PERMISSIONS,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('permission.create'),
      (req, res) => this.permissionCommands.createPermission(req, res)
    );

    // GET /api/rbac/permissions/:permissionId - 根據 ID 獲取權限
    this.router.get(this.ROUTES.PERMISSION_BY_ID,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('permission.read'),
      (req, res) => this.permissionQueries.getPermissionById(req, res)
    );

    // PUT /api/rbac/permissions/:permissionId - 更新權限
    this.router.put(this.ROUTES.PERMISSION_BY_ID,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('permission.update'),
      (req, res) => this.permissionCommands.updatePermission(req, res)
    );

    // DELETE /api/rbac/permissions/:permissionId - 刪除權限
    this.router.delete(this.ROUTES.PERMISSION_BY_ID,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('permission.delete'),
      (req, res) => this.permissionCommands.deletePermission(req, res)
    );
  }

  /**
   * 設定使用者角色關聯路由
   */
  private setupUserRoleRoutes = (): void => {

    // GET /api/rbac/user-roles - 獲取所有使用者角色關聯
    this.router.get(this.ROUTES.USER_ROLES,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['user.read', 'role.read']),
      (req, res) => this.userToRoleQueries.getUserRoles(req, res)
    );

    // POST /api/rbac/user-roles - 建立新使用者角色關聯
    this.router.post(this.ROUTES.USER_ROLES,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['user.update', 'role.assign']),
      (req, res) => this.userToRoleCommands.createUserRole(req, res)
    );

    // GET /api/rbac/user-roles/:userRoleId - 根據 ID 獲取使用者角色關聯
    this.router.get(this.ROUTES.USER_ROLE_BY_ID,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['user.read', 'role.read']),
      (req, res) => this.userToRoleQueries.getUserRoleById(req, res)
    );

    // PUT /api/rbac/user-roles/:userRoleId - 更新使用者角色關聯
    this.router.put(this.ROUTES.USER_ROLE_BY_ID,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['user.update', 'role.assign']),
      (req, res) => this.userToRoleCommands.updateUserRole(req, res)
    );

    // DELETE /api/rbac/user-roles/:userRoleId - 刪除使用者角色關聯
    this.router.delete(this.ROUTES.USER_ROLE_BY_ID,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['user.update', 'role.revoke']),
      (req, res) => this.userToRoleCommands.deleteUserRole(req, res)
    );
  }

  /**
   * 設定角色權限關聯路由
   */
  private setupRolePermissionRoutes = (): void => {

    // GET /api/rbac/role-permissions - 獲取所有角色權限關聯
    this.router.get(this.ROUTES.ROLE_PERMISSIONS,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['role.read', 'permission.read']),
      (req, res) => this.roleToPermissionQueries.getRolePermissions(req, res)
    );

    // POST /api/rbac/role-permissions - 建立新角色權限關聯
    this.router.post(this.ROUTES.ROLE_PERMISSIONS,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['role.update', 'permission.assign']),
      (req, res) => this.roleToPermissionCommands.createRolePermission(req, res)
    );

    // GET /api/rbac/role-permissions/:rolePermissionId - 根據 ID 獲取角色權限關聯
    this.router.get(this.ROUTES.ROLE_PERMISSION_BY_ID,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['role.read', 'permission.read']),
      (req, res) => this.roleToPermissionQueries.getRolePermissionById(req, res)
    );

    // PUT /api/rbac/role-permissions/:rolePermissionId - 更新角色權限關聯
    this.router.put(this.ROUTES.ROLE_PERMISSION_BY_ID,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['role.update', 'permission.assign']),
      (req, res) => this.roleToPermissionCommands.updateRolePermission(req, res)
    );

    // DELETE /api/rbac/role-permissions/:rolePermissionId - 刪除角色權限關聯
    this.router.delete(this.ROUTES.ROLE_PERMISSION_BY_ID,
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['role.update', 'permission.revoke']),
      (req, res) => this.roleToPermissionCommands.deleteRolePermission(req, res)
    );
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