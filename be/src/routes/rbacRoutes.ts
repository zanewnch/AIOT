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
import { UserController } from '../controllers/rbac/UserController.js';
import { RoleController } from '../controllers/rbac/RoleController.js';
import { PermissionController } from '../controllers/rbac/PermissionController.js';
import { UserToRoleController } from '../controllers/rbac/UserToRoleController.js';
import { RoleToPermissionController } from '../controllers/rbac/RoleToPermissionController.js';
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js';
import { PermissionMiddleware } from '../middlewares/PermissionMiddleware.js';
import { ErrorHandleMiddleware } from '../middlewares/ErrorHandleMiddleware.js';

/**
 * RBAC 路由類別
 *
 * 負責配置和管理所有 RBAC 相關的路由端點
 */
class RbacRoutes {
  private router: Router;
  private userController: UserController;
  private roleController: RoleController;
  private permissionController: PermissionController;
  private userToRoleController: UserToRoleController;
  private roleToPermissionController: RoleToPermissionController;
  private authMiddleware: AuthMiddleware;
  private permissionMiddleware: PermissionMiddleware;

  constructor() {
    this.router = Router();
    this.userController = new UserController();
    this.roleController = new RoleController();
    this.permissionController = new PermissionController();
    this.userToRoleController = new UserToRoleController();
    this.roleToPermissionController = new RoleToPermissionController();
    this.authMiddleware = new AuthMiddleware();
    this.permissionMiddleware = new PermissionMiddleware();
    
    // 直接在 constructor 中設定所有路由
    
    // 使用者管理路由
    this.router.get('/api/rbac/users',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('user.read'),
      this.userController.getUsers
    );

    this.router.post('/api/rbac/users',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('user.create'),
      this.userController.createUser
    );

    this.router.get('/api/rbac/users/:userId',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('user.read'),
      this.userController.getUserById
    );

    this.router.put('/api/rbac/users/:userId',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('user.update'),
      this.userController.updateUser
    );

    this.router.delete('/api/rbac/users/:userId',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('user.delete'),
      this.userController.deleteUser
    );

    // 角色管理路由
    this.router.get('/api/rbac/roles',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('role.read'),
      this.roleController.getRoles
    );

    this.router.post('/api/rbac/roles',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('role.create'),
      this.roleController.createRole
    );

    this.router.get('/api/rbac/roles/:roleId',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('role.read'),
      this.roleController.getRoleById
    );

    this.router.put('/api/rbac/roles/:roleId',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('role.update'),
      this.roleController.updateRole
    );

    this.router.delete('/api/rbac/roles/:roleId',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('role.delete'),
      this.roleController.deleteRole
    );

    // 權限管理路由
    this.router.get('/api/rbac/permissions',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('permission.read'),
      this.permissionController.getPermissions
    );

    this.router.post('/api/rbac/permissions',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('permission.create'),
      this.permissionController.createPermission
    );

    this.router.get('/api/rbac/permissions/:permissionId',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('permission.read'),
      this.permissionController.getPermissionById
    );

    this.router.put('/api/rbac/permissions/:permissionId',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('permission.update'),
      this.permissionController.updatePermission
    );

    this.router.delete('/api/rbac/permissions/:permissionId',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requirePermission('permission.delete'),
      this.permissionController.deletePermission
    );

    // 使用者角色關聯路由
    this.router.get('/api/rbac/user-roles',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['user.read', 'role.read']),
      this.userToRoleController.getUserRoles
    );

    this.router.post('/api/rbac/user-roles',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['user.update', 'role.assign']),
      this.userToRoleController.createUserRole
    );

    this.router.get('/api/rbac/user-roles/:userRoleId',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['user.read', 'role.read']),
      this.userToRoleController.getUserRoleById
    );

    this.router.put('/api/rbac/user-roles/:userRoleId',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['user.update', 'role.assign']),
      this.userToRoleController.updateUserRole
    );

    this.router.delete('/api/rbac/user-roles/:userRoleId',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['user.update', 'role.revoke']),
      this.userToRoleController.deleteUserRole
    );

    // 角色權限關聯路由
    this.router.get('/api/rbac/role-permissions',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['role.read', 'permission.read']),
      this.roleToPermissionController.getRolePermissions
    );

    this.router.post('/api/rbac/role-permissions',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['role.update', 'permission.assign']),
      this.roleToPermissionController.createRolePermission
    );

    this.router.get('/api/rbac/role-permissions/:rolePermissionId',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['role.read', 'permission.read']),
      this.roleToPermissionController.getRolePermissionById
    );

    this.router.put('/api/rbac/role-permissions/:rolePermissionId',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['role.update', 'permission.assign']),
      this.roleToPermissionController.updateRolePermission
    );

    this.router.delete('/api/rbac/role-permissions/:rolePermissionId',
      this.authMiddleware.authenticate,
      this.permissionMiddleware.requireAllPermissions(['role.update', 'permission.revoke']),
      this.roleToPermissionController.deleteRolePermission
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