/**
 * @fileoverview RBAC 控制器模組匯出索引 - 統一管理所有 RBAC 相關控制器的匯出
 * 
 * 此文件作為 RBAC（Role-Based Access Control）控制器模組的統一匯出點，提供：
 * - 所有 RBAC 控制器類別的匯出
 * - 清晰的 RBAC 模組結構組織
 * - 便於其他模組引用 RBAC 控制器
 * - 支援 ES6 模組語法
 * 
 * 包含的 RBAC 控制器類別：
 * - PermissionController: 權限管理控制器
 * - RoleController: 角色管理控制器
 * - RoleToPermissionController: 角色權限關聯控制器
 * - UserController: 使用者管理控制器
 * - UserToRoleController: 使用者角色關聯控制器
 * 
 * RBAC 系統架構：
 * - 使用者（User）：系統的實際使用者
 * - 角色（Role）：權限的集合，用於組織管理
 * - 權限（Permission）：具體的操作許可
 * - 關聯關係：使用者-角色、角色-權限的多對多關係
 * 
 * 安全性特色：
 * - 完整的權限控制機制
 * - 彈性的角色分配系統
 * - 安全的使用者管理
 * - 詳細的操作審計追蹤
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

export { PermissionController } from './PermissionController.js'; // 匯出權限管理控制器
export { RoleController } from './RoleController.js'; // 匯出角色管理控制器
export { RoleToPermissionController } from './RoleToPermissionController.js'; // 匯出角色權限關聯控制器
export { UserController } from './UserController.js'; // 匯出使用者管理控制器
export { UserToRoleController } from './UserToRoleController.js'; // 匯出使用者角色關聯控制器