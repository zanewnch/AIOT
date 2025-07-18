import { Router } from 'express';
import { UserController } from '../controller/rbac/UserController.js';
import { RoleController } from '../controller/rbac/RoleController.js';
import { PermissionController } from '../controller/rbac/PermissionController.js';
import { UserToRoleController } from '../controller/rbac/UserToRoleController.js';
import { RoleToPermissionController } from '../controller/rbac/RoleToPermissionController.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { PermissionMiddleware } from '../middleware/permissionMiddleware.js';
import { ErrorHandleMiddleware } from '../middleware/errorHandleMiddleware.js';

/**
 * RBAC (Role-Based Access Control) 相關路由配置
 * 
 * 處理使用者、角色、權限及其關聯關係的完整 CRUD 操作路由設定。
 * 包含 JWT 驗證和細粒度權限控制中間件的整合。
 * 
 * @module Routes
 */

const router = Router();

// 初始化所有 RBAC 控制器
const userController = new UserController();
const roleController = new RoleController();
const permissionController = new PermissionController();
const userToRoleController = new UserToRoleController();
const roleToPermissionController = new RoleToPermissionController();

// 初始化中間件
const authMiddleware = new AuthMiddleware();
const permissionMiddleware = new PermissionMiddleware();

// =================================================================
// 使用者管理路由 (Users)
// =================================================================

/**
 * GET /api/rbac/users
 * 獲取所有使用者列表
 * 需要權限：user.read
 */
router.get('/users', 
  authMiddleware.authenticate,
  permissionMiddleware.requirePermission('user.read'),
  userController.getUsers
);

/**
 * POST /api/rbac/users
 * 創建新使用者
 * 需要權限：user.create
 */
router.post('/users',
  authMiddleware.authenticate,
  permissionMiddleware.requirePermission('user.create'),
  userController.createUser
);

/**
 * GET /api/rbac/users/:userId
 * 根據ID獲取特定使用者
 * 需要權限：user.read
 */
router.get('/users/:userId',
  authMiddleware.authenticate,
  permissionMiddleware.requirePermission('user.read'),
  userController.getUserById
);

/**
 * PUT /api/rbac/users/:userId
 * 更新指定使用者
 * 需要權限：user.update
 */
router.put('/users/:userId',
  authMiddleware.authenticate,
  permissionMiddleware.requirePermission('user.update'),
  userController.updateUser
);

/**
 * DELETE /api/rbac/users/:userId
 * 刪除指定使用者
 * 需要權限：user.delete
 */
router.delete('/users/:userId',
  authMiddleware.authenticate,
  permissionMiddleware.requirePermission('user.delete'),
  userController.deleteUser
);

// =================================================================
// 角色管理路由 (Roles)
// =================================================================

/**
 * GET /api/rbac/roles
 * 獲取所有角色列表
 * 需要權限：role.read
 */
router.get('/roles',
  authMiddleware.authenticate,
  permissionMiddleware.requirePermission('role.read'),
  roleController.getRoles
);

/**
 * POST /api/rbac/roles
 * 創建新角色
 * 需要權限：role.create
 */
router.post('/roles',
  authMiddleware.authenticate,
  permissionMiddleware.requirePermission('role.create'),
  roleController.createRole
);

/**
 * GET /api/rbac/roles/:roleId
 * 根據ID獲取特定角色
 * 需要權限：role.read
 */
router.get('/roles/:roleId',
  authMiddleware.authenticate,
  permissionMiddleware.requirePermission('role.read'),
  roleController.getRoleById
);

/**
 * PUT /api/rbac/roles/:roleId
 * 更新指定角色
 * 需要權限：role.update
 */
router.put('/roles/:roleId',
  authMiddleware.authenticate,
  permissionMiddleware.requirePermission('role.update'),
  roleController.updateRole
);

/**
 * DELETE /api/rbac/roles/:roleId
 * 刪除指定角色
 * 需要權限：role.delete
 */
router.delete('/roles/:roleId',
  authMiddleware.authenticate,
  permissionMiddleware.requirePermission('role.delete'),
  roleController.deleteRole
);

// =================================================================
// 權限管理路由 (Permissions)
// =================================================================

/**
 * GET /api/rbac/permissions
 * 獲取所有權限列表
 * 需要權限：permission.read
 */
router.get('/permissions',
  authMiddleware.authenticate,
  permissionMiddleware.requirePermission('permission.read'),
  permissionController.getPermissions
);

/**
 * POST /api/rbac/permissions
 * 創建新權限
 * 需要權限：permission.create
 */
router.post('/permissions',
  authMiddleware.authenticate,
  permissionMiddleware.requirePermission('permission.create'),
  permissionController.createPermission
);

/**
 * GET /api/rbac/permissions/:permissionId
 * 根據ID獲取特定權限
 * 需要權限：permission.read
 */
router.get('/permissions/:permissionId',
  authMiddleware.authenticate,
  permissionMiddleware.requirePermission('permission.read'),
  permissionController.getPermissionById
);

/**
 * PUT /api/rbac/permissions/:permissionId
 * 更新指定權限
 * 需要權限：permission.update
 */
router.put('/permissions/:permissionId',
  authMiddleware.authenticate,
  permissionMiddleware.requirePermission('permission.update'),
  permissionController.updatePermission
);

/**
 * DELETE /api/rbac/permissions/:permissionId
 * 刪除指定權限
 * 需要權限：permission.delete
 */
router.delete('/permissions/:permissionId',
  authMiddleware.authenticate,
  permissionMiddleware.requirePermission('permission.delete'),
  permissionController.deletePermission
);

// =================================================================
// 使用者角色關聯路由 (User-Role Relationships)
// =================================================================

/**
 * GET /api/rbac/user-roles
 * 獲取所有使用者角色關聯
 * 需要權限：user.read + role.read
 */
router.get('/user-roles',
  authMiddleware.authenticate,
  permissionMiddleware.requireAllPermissions(['user.read', 'role.read']),
  userToRoleController.getUserRoles
);

/**
 * POST /api/rbac/user-roles
 * 建立使用者角色關聯
 * 需要權限：user.update + role.assign
 */
router.post('/user-roles',
  authMiddleware.authenticate,
  permissionMiddleware.requireAllPermissions(['user.update', 'role.assign']),
  userToRoleController.createUserRole
);

/**
 * GET /api/rbac/user-roles/:userRoleId
 * 根據ID獲取特定使用者角色關聯
 * 需要權限：user.read + role.read
 */
router.get('/user-roles/:userRoleId',
  authMiddleware.authenticate,
  permissionMiddleware.requireAllPermissions(['user.read', 'role.read']),
  userToRoleController.getUserRoleById
);

/**
 * PUT /api/rbac/user-roles/:userRoleId
 * 更新使用者角色關聯
 * 需要權限：user.update + role.assign
 */
router.put('/user-roles/:userRoleId',
  authMiddleware.authenticate,
  permissionMiddleware.requireAllPermissions(['user.update', 'role.assign']),
  userToRoleController.updateUserRole
);

/**
 * DELETE /api/rbac/user-roles/:userRoleId
 * 刪除使用者角色關聯
 * 需要權限：user.update + role.revoke
 */
router.delete('/user-roles/:userRoleId',
  authMiddleware.authenticate,
  permissionMiddleware.requireAllPermissions(['user.update', 'role.revoke']),
  userToRoleController.deleteUserRole
);

// =================================================================
// 角色權限關聯路由 (Role-Permission Relationships)
// =================================================================

/**
 * GET /api/rbac/role-permissions
 * 獲取所有角色權限關聯
 * 需要權限：role.read + permission.read
 */
router.get('/role-permissions',
  authMiddleware.authenticate,
  permissionMiddleware.requireAllPermissions(['role.read', 'permission.read']),
  roleToPermissionController.getRolePermissions
);

/**
 * POST /api/rbac/role-permissions
 * 建立角色權限關聯
 * 需要權限：role.update + permission.assign
 */
router.post('/role-permissions',
  authMiddleware.authenticate,
  permissionMiddleware.requireAllPermissions(['role.update', 'permission.assign']),
  roleToPermissionController.createRolePermission
);

/**
 * GET /api/rbac/role-permissions/:rolePermissionId
 * 根據ID獲取特定角色權限關聯
 * 需要權限：role.read + permission.read
 */
router.get('/role-permissions/:rolePermissionId',
  authMiddleware.authenticate,
  permissionMiddleware.requireAllPermissions(['role.read', 'permission.read']),
  roleToPermissionController.getRolePermissionById
);

/**
 * PUT /api/rbac/role-permissions/:rolePermissionId
 * 更新角色權限關聯
 * 需要權限：role.update + permission.assign
 */
router.put('/role-permissions/:rolePermissionId',
  authMiddleware.authenticate,
  permissionMiddleware.requireAllPermissions(['role.update', 'permission.assign']),
  roleToPermissionController.updateRolePermission
);

/**
 * DELETE /api/rbac/role-permissions/:rolePermissionId
 * 刪除角色權限關聯
 * 需要權限：role.update + permission.revoke
 */
router.delete('/role-permissions/:rolePermissionId',
  authMiddleware.authenticate,
  permissionMiddleware.requireAllPermissions(['role.update', 'permission.revoke']),
  roleToPermissionController.deleteRolePermission
);

export { router as rbacRoutes };