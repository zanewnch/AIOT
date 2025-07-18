/**
 * @fileoverview RBAC 容器服務類型定義模組
 * 
 * 定義 RBAC（Role-Based Access Control）依賴注入容器中可包含的服務類型，
 * 用於類型安全的服務管理和依賴注入。
 * 
 * 此模組採用聯合類型（Union Type）設計，將所有 RBAC 相關的控制器介面
 * 組合成一個統一的服務類型，便於依賴注入容器的類型檢查和服務管理。
 * 
 * 支援的服務類型：
 * - 使用者控制器（IUserController）
 * - 角色控制器（IRoleController）
 * - 權限控制器（IPermissionController）
 * - 使用者角色關聯控制器（IUserToRoleController）
 * - 角色權限關聯控制器（IRoleToPermissionController）
 * 
 * @module Types/RBACContainerServices
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024
 */

// 從控制器介面統一導出模組匯入所有需要的控制器介面類型
import { 
    IUserController, 
    IRoleController, 
    IPermissionController, 
    IUserToRoleController, 
    IRoleToPermissionController 
} from './controllers/index.js';

/**
 * RBAC 容器服務類型聯合定義
 * 
 * 此聯合類型定義了依賴注入容器中可以包含的所有 RBAC 相關服務類型。
 * 使用聯合類型確保類型安全，同時提供靈活的服務管理能力。
 * 
 * 該類型主要用於：
 * - 依賴注入容器的服務註冊
 * - 服務解析時的類型檢查
 * - 確保只有合法的 RBAC 服務被注入
 * 
 * @example
 * ```typescript
 * // 在容器中註冊服務
 * const container = new DIContainer();
 * const userController: RBACContainerServicesType = new UserController();
 * container.register('userController', userController);
 * 
 * // 解析服務時進行類型檢查
 * const service = container.resolve<RBACContainerServicesType>('userController');
 * ```
 * 
 * @since 1.0.0
 */
export type RBACContainerServicesType = 
    | IUserController              // 使用者控制器服務類型
    | IRoleController              // 角色控制器服務類型
    | IPermissionController        // 權限控制器服務類型
    | IUserToRoleController        // 使用者角色關聯控制器服務類型
    | IRoleToPermissionController; // 角色權限關聯控制器服務類型