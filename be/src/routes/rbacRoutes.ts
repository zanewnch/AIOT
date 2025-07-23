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

import { Router } from 'express'; // 引入 Express 路由器模組
import { UserController } from '../controllers/rbac/UserController.js'; // 引入使用者控制器
import { RoleController } from '../controllers/rbac/RoleController.js'; // 引入角色控制器
import { PermissionController } from '../controllers/rbac/PermissionController.js'; // 引入權限控制器
import { UserToRoleController } from '../controllers/rbac/UserToRoleController.js'; // 引入使用者角色關聯控制器
import { RoleToPermissionController } from '../controllers/rbac/RoleToPermissionController.js'; // 引入角色權限關聯控制器
import { AuthMiddleware } from '../middlewares/AuthMiddleware.js'; // 引入認證中間件
import { PermissionMiddleware } from '../middlewares/permissionMiddleware.js'; // 引入權限驗證中間件
import { ErrorHandleMiddleware } from '../middlewares/errorHandleMiddleware.js'; // 引入錯誤處理中間件

/**
 * 創建 Express 路由器實例
 * 用於定義 RBAC 相關的路由端點
 */
const router = Router();

/**
 * 初始化所有 RBAC 控制器實例
 * 分別處理使用者、角色、權限及其關聯的業務邏輯
 */
const userController = new UserController(); // 使用者控制器實例
const roleController = new RoleController(); // 角色控制器實例
const permissionController = new PermissionController(); // 權限控制器實例
const userToRoleController = new UserToRoleController(); // 使用者角色關聯控制器實例
const roleToPermissionController = new RoleToPermissionController(); // 角色權限關聯控制器實例

/**
 * 初始化中間件實例
 * 提供認證和權限驗證功能
 */
const authMiddleware = new AuthMiddleware(); // 認證中間件實例
const permissionMiddleware = new PermissionMiddleware(); // 權限驗證中間件實例

// =================================================================
// 使用者管理路由 (Users)
// =================================================================

/**
 * 獲取所有使用者列表
 * 
 * 此端點返回系統中所有使用者的列表，包括基本資訊和角色關聯。
 * 支援分頁和搜尋功能，需要 user.read 權限。
 * 
 * @route GET /api/rbac/users
 * @group RBAC - 使用者管理
 * @security JWT - 需要有效的 JWT 認證令牌
 * @permission user.read - 需要使用者讀取權限
 * @returns {Object} 200 - 使用者列表
 * @returns {Object} 401 - 未授權
 * @returns {Object} 403 - 權限不足
 * @returns {Object} 500 - 伺服器錯誤
 */
router.get('/users', 
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  permissionMiddleware.requirePermission('user.read'), // 驗證使用者讀取權限
  userController.getUsers // 執行獲取使用者列表
);

/**
 * 創建新使用者
 * 
 * 此端點用於創建新的使用者帳號，包括基本資訊設定和初始權限配置。
 * 需要 user.create 權限。
 * 
 * @route POST /api/rbac/users
 * @group RBAC - 使用者管理
 * @security JWT - 需要有效的 JWT 認證令牌
 * @permission user.create - 需要使用者創建權限
 * @param {Object} body - 使用者資訊
 * @returns {Object} 201 - 使用者創建成功
 * @returns {Object} 400 - 請求參數錯誤
 * @returns {Object} 401 - 未授權
 * @returns {Object} 403 - 權限不足
 * @returns {Object} 409 - 使用者已存在
 * @returns {Object} 500 - 伺服器錯誤
 */
router.post('/users',
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  permissionMiddleware.requirePermission('user.create'), // 驗證使用者創建權限
  userController.createUser // 執行創建使用者
);

/**
 * 根據ID獲取特定使用者
 * 
 * 此端點根據使用者ID獲取特定使用者的詳細資訊，包括關聯的角色和權限。
 * 需要 user.read 權限。
 * 
 * @route GET /api/rbac/users/:userId
 * @param {string} userId - 使用者唯一識別碼
 * @group RBAC - 使用者管理
 * @security JWT - 需要有效的 JWT 認證令牌
 * @permission user.read - 需要使用者讀取權限
 * @returns {Object} 200 - 使用者詳細資訊
 * @returns {Object} 401 - 未授權
 * @returns {Object} 403 - 權限不足
 * @returns {Object} 404 - 使用者不存在
 * @returns {Object} 500 - 伺服器錯誤
 */
router.get('/users/:userId',
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  permissionMiddleware.requirePermission('user.read'), // 驗證使用者讀取權限
  userController.getUserById // 執行根據ID獲取使用者
);

/**
 * 更新指定使用者
 * 
 * 此端點用於更新使用者的資訊，包括基本資料和設定。
 * 需要 user.update 權限。
 * 
 * @route PUT /api/rbac/users/:userId
 * @param {string} userId - 使用者唯一識別碼
 * @group RBAC - 使用者管理
 * @security JWT - 需要有效的 JWT 認證令牌
 * @permission user.update - 需要使用者更新權限
 * @param {Object} body - 更新的使用者資訊
 * @returns {Object} 200 - 使用者更新成功
 * @returns {Object} 400 - 請求參數錯誤
 * @returns {Object} 401 - 未授權
 * @returns {Object} 403 - 權限不足
 * @returns {Object} 404 - 使用者不存在
 * @returns {Object} 500 - 伺服器錯誤
 */
router.put('/users/:userId',
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  permissionMiddleware.requirePermission('user.update'), // 驗證使用者更新權限
  userController.updateUser // 執行更新使用者
);

/**
 * 刪除指定使用者
 * 
 * 此端點用於刪除使用者帳號，包括相關的角色關聯。
 * 需要 user.delete 權限。危險操作，需要特別謹慎。
 * 
 * @route DELETE /api/rbac/users/:userId
 * @param {string} userId - 使用者唯一識別碼
 * @group RBAC - 使用者管理
 * @security JWT - 需要有效的 JWT 認證令牌
 * @permission user.delete - 需要使用者刪除權限
 * @returns {Object} 200 - 使用者刪除成功
 * @returns {Object} 401 - 未授權
 * @returns {Object} 403 - 權限不足
 * @returns {Object} 404 - 使用者不存在
 * @returns {Object} 500 - 伺服器錯誤
 */
router.delete('/users/:userId',
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  permissionMiddleware.requirePermission('user.delete'), // 驗證使用者刪除權限
  userController.deleteUser // 執行刪除使用者
);

// =================================================================
// 角色管理路由 (Roles)
// =================================================================

/**
 * 獲取所有角色列表
 * 
 * 此端點返回系統中所有角色的列表，包括角色名稱、描述和相關權限。
 * 支援分頁和搜尋功能，需要 role.read 權限。
 * 
 * @route GET /api/rbac/roles
 * @group RBAC - 角色管理
 * @security JWT - 需要有效的 JWT 認證令牌
 * @permission role.read - 需要角色讀取權限
 * @returns {Object} 200 - 角色列表
 * @returns {Object} 401 - 未授權
 * @returns {Object} 403 - 權限不足
 * @returns {Object} 500 - 伺服器錯誤
 */
router.get('/roles',
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  permissionMiddleware.requirePermission('role.read'), // 驗證角色讀取權限
  roleController.getRoles // 執行獲取角色列表
);

/**
 * 創建新角色
 * 
 * 此端點用於創建新的角色，包括角色名稱、描述和初始權限配置。
 * 需要 role.create 權限。
 * 
 * @route POST /api/rbac/roles
 * @group RBAC - 角色管理
 * @security JWT - 需要有效的 JWT 認證令牌
 * @permission role.create - 需要角色創建權限
 * @param {Object} body - 角色資訊
 * @returns {Object} 201 - 角色創建成功
 * @returns {Object} 400 - 請求參數錯誤
 * @returns {Object} 401 - 未授權
 * @returns {Object} 403 - 權限不足
 * @returns {Object} 409 - 角色已存在
 * @returns {Object} 500 - 伺服器錯誤
 */
router.post('/roles',
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  permissionMiddleware.requirePermission('role.create'), // 驗證角色創建權限
  roleController.createRole // 執行創建角色
);

/**
 * 根據ID獲取特定角色
 * 
 * 此端點根據角色ID獲取特定角色的詳細資訊，包括關聯的權限和使用者。
 * 需要 role.read 權限。
 * 
 * @route GET /api/rbac/roles/:roleId
 * @param {string} roleId - 角色唯一識別碼
 * @group RBAC - 角色管理
 * @security JWT - 需要有效的 JWT 認證令牌
 * @permission role.read - 需要角色讀取權限
 * @returns {Object} 200 - 角色詳細資訊
 * @returns {Object} 401 - 未授權
 * @returns {Object} 403 - 權限不足
 * @returns {Object} 404 - 角色不存在
 * @returns {Object} 500 - 伺服器錯誤
 */
router.get('/roles/:roleId',
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  permissionMiddleware.requirePermission('role.read'), // 驗證角色讀取權限
  roleController.getRoleById // 執行根據ID獲取角色
);

/**
 * 更新指定角色
 * 
 * 此端點用於更新角色的資訊，包括角色名稱、描述和設定。
 * 需要 role.update 權限。
 * 
 * @route PUT /api/rbac/roles/:roleId
 * @param {string} roleId - 角色唯一識別碼
 * @group RBAC - 角色管理
 * @security JWT - 需要有效的 JWT 認證令牌
 * @permission role.update - 需要角色更新權限
 * @param {Object} body - 更新的角色資訊
 * @returns {Object} 200 - 角色更新成功
 * @returns {Object} 400 - 請求參數錯誤
 * @returns {Object} 401 - 未授權
 * @returns {Object} 403 - 權限不足
 * @returns {Object} 404 - 角色不存在
 * @returns {Object} 500 - 伺服器錯誤
 */
router.put('/roles/:roleId',
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  permissionMiddleware.requirePermission('role.update'), // 驗證角色更新權限
  roleController.updateRole // 執行更新角色
);

/**
 * 刪除指定角色
 * 
 * 此端點用於刪除角色，包括相關的使用者關聯和權限關聯。
 * 需要 role.delete 權限。危險操作，需要特別謹慎。
 * 
 * @route DELETE /api/rbac/roles/:roleId
 * @param {string} roleId - 角色唯一識別碼
 * @group RBAC - 角色管理
 * @security JWT - 需要有效的 JWT 認證令牌
 * @permission role.delete - 需要角色刪除權限
 * @returns {Object} 200 - 角色刪除成功
 * @returns {Object} 401 - 未授權
 * @returns {Object} 403 - 權限不足
 * @returns {Object} 404 - 角色不存在
 * @returns {Object} 500 - 伺服器錯誤
 */
router.delete('/roles/:roleId',
  authMiddleware.authenticate, // 驗證 JWT 認證令牌
  permissionMiddleware.requirePermission('role.delete'), // 驗證角色刪除權限
  roleController.deleteRole // 執行刪除角色
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

/**
 * 匯出 RBAC 路由模組
 * 
 * 將配置好的路由器匯出，供主應用程式使用。
 * 此路由器包含完整的 RBAC 系統端點，包括使用者、角色、
 * 權限管理以及它們之間的關聯關係。
 */
export { router as rbacRoutes };