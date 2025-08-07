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
 * - 使用者控制器（IUserController - 舊版）
 * - 使用者查詢控制器（UserQueries - CQRS）
 * - 使用者命令控制器（UserCommands - CQRS）
 * - 角色控制器（IRoleController - 舊版）
 * - 角色查詢控制器（RoleQueries - CQRS）
 * - 角色命令控制器（RoleCommands - CQRS）
 * - 權限控制器（IPermissionController - 舊版）
 * - 權限查詢控制器（PermissionQueries - CQRS）
 * - 權限命令控制器（PermissionCommands - CQRS）
 * - 使用者角色關聯控制器（IUserToRoleController - 舊版）
 * - 使用者角色關聯查詢控制器（UserToRoleQueries - CQRS）
 * - 使用者角色關聯命令控制器（UserToRoleCommands - CQRS）
 * - 角色權限關聯控制器（IRoleToPermissionController - 舊版）
 * - 角色權限關聯查詢控制器（RoleToPermissionQueries - CQRS）
 * - 角色權限關聯命令控制器（RoleToPermissionCommands - CQRS）
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

// 導入 CQRS 模式的權限控制器類型
import { PermissionQueries } from '../controllers/queries/PermissionQueriesCtrl.js';
import { PermissionCommands } from '../controllers/commands/PermissionCommandsCtrl.js';

// 導入 CQRS 模式的角色控制器類型
import { RoleQueries } from '../controllers/queries/RoleQueriesCtrl.js';
import { RoleCommands } from '../controllers/commands/RoleCommandsCtrl.js';

// 導入 CQRS 模式的角色權限關聯控制器類型
import { RoleToPermissionQueries } from '../controllers/queries/RoleToPermissionQueriesCtrl.js';
import { RoleToPermissionCommands } from '../controllers/commands/RoleToPermissionCommandsCtrl.js';

// 導入 CQRS 模式的使用者控制器類型
import { UserQueries } from '../controllers/queries/UserQueriesCtrl.js';
import { UserCommands } from '../controllers/commands/UserCommandsCtrl.js';

// 導入 CQRS 模式的使用者角色關聯控制器類型
import { UserToRoleQueries } from '../controllers/queries/UserToRoleQueriesCtrl.js';
import { UserToRoleCommands } from '../controllers/commands/UserToRoleCommandsCtrl.js';

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
    | IUserController              // 使用者控制器服務類型（向後兼容）
    | UserQueries                  // 使用者查詢控制器服務類型（CQRS）
    | UserCommands                 // 使用者命令控制器服務類型（CQRS）
    | IRoleController              // 角色控制器服務類型（向後兼容）
    | RoleQueries                  // 角色查詢控制器服務類型（CQRS）
    | RoleCommands                 // 角色命令控制器服務類型（CQRS）
    | IPermissionController        // 權限控制器服務類型（向後兼容）
    | PermissionQueries            // 權限查詢控制器服務類型（CQRS）
    | PermissionCommands           // 權限命令控制器服務類型（CQRS）
    | IUserToRoleController        // 使用者角色關聯控制器服務類型（向後兼容）
    | UserToRoleQueries            // 使用者角色關聯查詢控制器服務類型（CQRS）
    | UserToRoleCommands           // 使用者角色關聯命令控制器服務類型（CQRS）
    | IRoleToPermissionController  // 角色權限關聯控制器服務類型（向後兼容）
    | RoleToPermissionQueries      // 角色權限關聯查詢控制器服務類型（CQRS）
    | RoleToPermissionCommands;    // 角色權限關聯命令控制器服務類型（CQRS）