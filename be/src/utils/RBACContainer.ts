/**
 * @fileoverview RBAC 依賴注入容器工具模組
 * 
 * 此模組實現了基於角色的存取控制（RBAC）系統的依賴注入容器。
 * 採用單例模式管理所有 RBAC 相關的控制器實例，提供統一的服務註冊和取得介面。
 * 
 * ### 核心功能
 * - 🔐 **統一管理**: 集中管理所有 RBAC 控制器實例
 * - 🏗️ **單例模式**: 確保全域只有一個容器實例
 * - 🔧 **依賴注入**: 提供標準的依賴注入容器功能
 * - 🎯 **類型安全**: 完整的 TypeScript 類型支援
 * - 📋 **服務註冊**: 自動註冊和管理所有 RBAC 服務
 * 
 * ### 設計模式
 * - **單例模式**: 確保容器的唯一性
 * - **工廠模式**: 統一創建和管理控制器實例
 * - **註冊表模式**: 使用 Map 儲存服務註冊資訊
 * 
 * @module Utils/RBACContainer
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 * 
 * @example
 * ```typescript
 * // 取得容器實例
 * const container = RBACContainer.getInstance();
 * 
 * // 取得特定控制器
 * const userController = container.getUserController();
 * const roleController = container.getRoleController();
 * 
 * // 通用服務取得
 * const controller = container.get<IUserController>('UserController');
 * ```
 */

// 導入使用者查詢和命令控制器 - CQRS 模式重構
import { UserQueries } from '../controllers/queries/UserQueriesCtrl.js';
import { UserCommands } from '../controllers/commands/UserCommandsCtrl.js';

// 導入角色查詢和命令控制器 - CQRS 模式重構
import { RoleQueries } from '../controllers/queries/RoleQueriesCtrl.js';
import { RoleCommands } from '../controllers/commands/RoleCommandsCtrl.js';

// 導入權限查詢和命令控制器 - CQRS 模式重構
import { PermissionQueries } from '../controllers/queries/PermissionQueriesCtrl.js';
import { PermissionCommands } from '../controllers/commands/PermissionCommandsCtrl.js';

// 導入使用者角色關聯查詢和命令控制器 - CQRS 模式重構
import { UserToRoleQueries } from '../controllers/queries/UserToRoleQueriesCtrl.js';
import { UserToRoleCommands } from '../controllers/commands/UserToRoleCommandsCtrl.js';

// 導入角色權限關聯查詢和命令控制器 - CQRS 模式重構
import { RoleToPermissionQueries } from '../controllers/queries/RoleToPermissionQueriesCtrl.js';
import { RoleToPermissionCommands } from '../controllers/commands/RoleToPermissionCommandsCtrl.js';

// 導入 RBAC 容器服務類型定義 - 定義容器可儲存的服務類型聯合
import { RBACContainerServicesType } from '../types/RBACContainerServicesType.js';

// 導入所有控制器介面類型定義 - 確保類型安全的依賴注入
import type {
    IUserController,
    IRoleController,
    IPermissionController,
    IUserToRoleController,
    IRoleToPermissionController
} from '../types/controllers/index.js';

// 導入 InversifyJS 容器和類型定義
import { container } from '../container/container.js';
import { TYPES } from '../types/container/dependency-injection.js';



/**
 * RBAC 依賴注入容器類別
 * 
 * 實現單例模式的依賴注入容器，專門管理 RBAC 系統中的所有控制器實例。
 * 提供統一的服務註冊、取得和管理功能，確保系統中所有 RBAC 相關的
 * 控制器都通過此容器進行管理。
 * 
 * ### 核心特性
 * - 🔒 **單例模式**: 確保全域只有一個容器實例
 * - 🗂️ **服務註冊**: 自動註冊所有 RBAC 控制器
 * - 🔍 **服務發現**: 提供多種方式取得已註冊的服務
 * - 🛡️ **類型安全**: 完整的 TypeScript 類型檢查
 * - 📊 **服務管理**: 支援服務查詢和狀態檢查
 * 
 * ### 設計考量
 * - 使用 Map 資料結構提供高效的服務查找
 * - 採用 readonly 修飾符確保服務註冊表的不可變性
 * - 提供專用的 getter 方法確保類型安全
 * - 支援通用的服務取得方法提供彈性
 * 
 * @class RBACContainer
 * @category Utils
 * @group RBAC
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * // 取得容器實例（單例模式）
 * const container = RBACContainer.getInstance();
 * 
 * // 取得特定類型的控制器
 * const userController = container.getUserController();
 * const roleController = container.getRoleController();
 * 
 * // 檢查服務是否已註冊
 * if (container.hasService('UserController')) {
 *   const controller = container.get<IUserController>('UserController');
 * }
 * 
 * // 取得所有已註冊的服務名稱
 * const serviceNames = container.getRegisteredServices();
 * console.log('已註冊服務:', serviceNames);
 * ```
 */
export class RBACContainer {
    /**
     * 靜態單例實例
     * 
     * 儲存 RBACContainer 的唯一實例，確保整個應用程式中
     * 只有一個容器實例存在。
     * 
     * @private
     * @static
     * @type {RBACContainer}
     */
    private static instance: RBACContainer;

    /**
     * 服務註冊表
     * 
     * 使用 Map 資料結構儲存所有已註冊的 RBAC 服務實例。
     * 鍵為服務名稱（字串），值為對應的控制器實例。
     * 
     * 使用 readonly 修飾符確保此 Map 實例不會被重新賦值，
     * 但仍允許對 Map 內容進行修改（如添加或刪除服務）。
     * 
     * @private
     * @readonly
     * @type {Map<string, RBACContainerServicesType>}
     */
    private readonly services = new Map<string, RBACContainerServicesType>();



    /**
     * 私有建構函數
     * 
     * 實現單例模式的私有建構函數，防止外部直接創建實例。
     * 在建構過程中自動調用服務註冊方法，確保所有 RBAC 相關的
     * 控制器都被正確註冊到容器中。
     * 
     * ### 執行流程
     * 1. 初始化服務註冊表（Map）
     * 2. 調用 registerServices() 註冊所有 RBAC 服務
     * 3. 完成容器初始化
     * 
     * @private
     * @constructor
     * @since 1.0.0
     */
    private constructor() {
        // 調用服務註冊方法，初始化所有 RBAC 控制器
        this.registerServices();
    }

    /**
     * 取得容器實例（單例模式）
     * 
     * 實現單例模式的靜態方法，確保整個應用程式中只有一個
     * RBACContainer 實例。如果實例尚未創建，則創建新實例；
     * 否則返回已存在的實例。
     * 
     * ### 執行邏輯
     * 1. 檢查靜態實例是否已存在
     * 2. 如果不存在，創建新實例（觸發私有建構函數）
     * 3. 返回實例（新創建或已存在的）
     * 
     * ### 線程安全性
     * 在 JavaScript 單線程環境中，此實現是線程安全的。
     * 但在多進程環境中，每個進程會有自己的實例。
     * 
     * @static
     * @public
     * @returns {RBACContainer} 容器的單例實例
     * @since 1.0.0
     * 
     * @example
     * ```typescript
     * // 取得容器實例
     * const container = RBACContainer.getInstance();
     * 
     * // 多次調用都會返回相同的實例
     * const sameContainer = RBACContainer.getInstance();
     * console.log(container === sameContainer); // true
     * ```
     */
    public static getInstance(): RBACContainer {
        // 檢查靜態實例是否已存在，如果不存在則創建新實例
        if (!RBACContainer.instance) {
            RBACContainer.instance = new RBACContainer();
        }
        
        // 返回單例實例
        return RBACContainer.instance;
    }

    /**
     * 註冊所有 RBAC 服務
     * 
     * 初始化並註冊所有 RBAC 相關的控制器到服務容器中。
     * 此方法在建構函數中被調用，確保所有必要的控制器都被
     * 正確註冊並可供後續使用。
     * 
     * ### 註冊的服務
     * - **UserController**: 處理使用者相關的 CRUD 操作
     * - **RoleController**: 處理角色相關的 CRUD 操作
     * - **PermissionController**: 處理權限相關的 CRUD 操作
     * - **UserToRoleController**: 處理使用者與角色的關聯操作
     * - **RoleToPermissionController**: 處理角色與權限的關聯操作
     * 
     * ### 設計考量
     * - 使用字串鍵值作為服務標識符，提供清晰的服務命名
     * - 每個控制器都創建新實例，確保狀態獨立
     * - 註冊順序對功能無影響，但保持邏輯分組
     * 
     * @private
     * @returns {void}
     * @since 1.0.0
     */
    private registerServices(): void {
        // 註冊使用者查詢控制器 - CQRS 模式：處理使用者的查詢操作
        this.services.set('UserQueries', container.get<UserQueries>(TYPES.UserQueriesCtrl));
        
        // 註冊使用者命令控制器 - CQRS 模式：處理使用者的修改操作
        this.services.set('UserCommands', container.get<UserCommands>(TYPES.UserCommandsCtrl));
        
        // 註冊角色查詢控制器 - CQRS 模式：處理角色的查詢操作
        this.services.set('RoleQueries', container.get<RoleQueries>(TYPES.RoleQueriesCtrl));
        
        // 註冊角色命令控制器 - CQRS 模式：處理角色的修改操作
        this.services.set('RoleCommands', container.get<RoleCommands>(TYPES.RoleCommandsCtrl));
        
        // 註冊權限查詢控制器 - CQRS 模式：處理權限的查詢操作
        this.services.set('PermissionQueries', container.get<PermissionQueries>(TYPES.PermissionQueriesCtrl));
        
        // 註冊權限命令控制器 - CQRS 模式：處理權限的修改操作
        this.services.set('PermissionCommands', container.get<PermissionCommands>(TYPES.PermissionCommandsCtrl));
        
        // 註冊使用者角色關聯查詢控制器 - CQRS 模式：處理使用者角色的查詢操作
        this.services.set('UserToRoleQueries', container.get<UserToRoleQueries>(TYPES.UserToRoleQueriesCtrl));
        
        // 註冊使用者角色關聯命令控制器 - CQRS 模式：處理使用者角色的修改操作
        this.services.set('UserToRoleCommands', container.get<UserToRoleCommands>(TYPES.UserToRoleCommandsCtrl));
        
        // 註冊角色權限關聯查詢控制器 - CQRS 模式：處理角色權限的查詢操作
        this.services.set('RoleToPermissionQueries', container.get<RoleToPermissionQueries>(TYPES.RoleToPermissionQueriesCtrl));
        
        // 註冊角色權限關聯命令控制器 - CQRS 模式：處理角色權限的修改操作
        this.services.set('RoleToPermissionCommands', container.get<RoleToPermissionCommands>(TYPES.RoleToPermissionCommandsCtrl));
    }

    /**
     * 取得使用者控制器
     * 
     * 從服務容器中取得已註冊的使用者控制器實例。
     * 使用者控制器負責處理所有與使用者相關的操作，
     * 包括使用者的建立、查詢、更新和刪除等功能。
     * 
     * ### 錯誤處理
     * 如果控制器未找到，將拋出錯誤。這種情況通常表示
     * 服務註冊過程中發生問題，或容器初始化失敗。
     * 
     * @public
     * @returns {IUserController} 使用者控制器實例
     * @throws {Error} 當控制器未在容器中找到時拋出錯誤
     * @since 1.0.0
     * 
     * @example
     * ```typescript
     * const container = RBACContainer.getInstance();
     * const userController = container.getUserController();
     * 
     * // 使用控制器進行操作
     * const users = await userController.getAllUsers();
     * ```
     */
    /**
     * 取得使用者查詢控制器 - CQRS 模式
     * 
     * 從服務容器中取得已註冊的使用者查詢控制器實例。
     * 查詢控制器專門負責處理所有與使用者相關的讀取操作。
     * 
     * @public
     * @returns {UserQueries} 使用者查詢控制器實例
     * @throws {Error} 當控制器未在容器中找到時拋出錯誤
     * @since 2.0.0
     */
    public getUserQueries(): UserQueries {
        const controller = this.services.get('UserQueries');
        if (!controller) {
            throw new Error('UserQueries not found in container');
        }
        return controller as UserQueries;
    }

    /**
     * 取得使用者命令控制器 - CQRS 模式
     * 
     * 從服務容器中取得已註冊的使用者命令控制器實例。
     * 命令控制器專門負責處理所有與使用者相關的寫入操作。
     * 
     * @public
     * @returns {UserCommands} 使用者命令控制器實例
     * @throws {Error} 當控制器未在容器中找到時拋出錯誤
     * @since 2.0.0
     */
    public getUserCommands(): UserCommands {
        const controller = this.services.get('UserCommands');
        if (!controller) {
            throw new Error('UserCommands not found in container');
        }
        return controller as UserCommands;
    }

    /**
     * 取得角色查詢控制器 - CQRS 模式
     * 
     * 從服務容器中取得已註冊的角色查詢控制器實例。
     * 查詢控制器專門負責處理所有與角色相關的讀取操作，
     * 遵循 CQRS 模式的查詢端職責分離原則。
     * 
     * @public
     * @returns {RoleQueries} 角色查詢控制器實例
     * @throws {Error} 當控制器未在容器中找到時拋出錯誤
     * @since 2.0.0
     * 
     * @example
     * ```typescript
     * const container = RBACContainer.getInstance();
     * const roleQueries = container.getRoleQueries();
     * 
     * // 使用控制器進行查詢操作
     * const roles = await roleQueries.getRoles(req, res);
     * ```
     */
    public getRoleQueries(): RoleQueries {
        // 從服務註冊表中取得角色查詢控制器實例
        const controller = this.services.get('RoleQueries');
        
        // 檢查控制器是否存在，Map.get() 可能返回 undefined
        if (!controller) {
            throw new Error('RoleQueries not found in container');
        }
        
        // 進行類型斷言並返回控制器實例
        return controller as RoleQueries;
    }

    /**
     * 取得角色命令控制器 - CQRS 模式
     * 
     * 從服務容器中取得已註冊的角色命令控制器實例。
     * 命令控制器專門負責處理所有與角色相關的寫入操作，
     * 遵循 CQRS 模式的命令端職責分離原則。
     * 
     * @public
     * @returns {RoleCommands} 角色命令控制器實例
     * @throws {Error} 當控制器未在容器中找到時拋出錯誤
     * @since 2.0.0
     * 
     * @example
     * ```typescript
     * const container = RBACContainer.getInstance();
     * const roleCommands = container.getRoleCommands();
     * 
     * // 使用控制器進行命令操作
     * await roleCommands.createRole(req, res);
     * ```
     */
    public getRoleCommands(): RoleCommands {
        // 從服務註冊表中取得角色命令控制器實例
        const controller = this.services.get('RoleCommands');
        
        // 檢查控制器是否存在，Map.get() 可能返回 undefined
        if (!controller) {
            throw new Error('RoleCommands not found in container');
        }
        
        // 進行類型斷言並返回控制器實例
        return controller as RoleCommands;
    }

    /**
     * 取得權限查詢控制器 - CQRS 模式
     * 
     * 從服務容器中取得已註冊的權限查詢控制器實例。
     * 查詢控制器專門負責處理所有與權限相關的讀取操作，
     * 遵循 CQRS 模式的查詢端職責分離原則。
     * 
     * @public
     * @returns {PermissionQueries} 權限查詢控制器實例
     * @throws {Error} 當控制器未在容器中找到時拋出錯誤
     * @since 2.0.0
     * 
     * @example
     * ```typescript
     * const container = RBACContainer.getInstance();
     * const permissionQueries = container.getPermissionQueries();
     * 
     * // 使用控制器進行查詢操作
     * const permissions = await permissionQueries.getPermissions(req, res);
     * ```
     */
    public getPermissionQueries(): PermissionQueries {
        // 從服務註冊表中取得權限查詢控制器實例
        const controller = this.services.get('PermissionQueries');
        
        // 檢查控制器是否存在，Map.get() 可能返回 undefined
        if (!controller) {
            throw new Error('PermissionQueries not found in container');
        }
        
        // 進行類型斷言並返回控制器實例
        return controller as PermissionQueries;
    }

    /**
     * 取得權限命令控制器 - CQRS 模式
     * 
     * 從服務容器中取得已註冊的權限命令控制器實例。
     * 命令控制器專門負責處理所有與權限相關的寫入操作，
     * 遵循 CQRS 模式的命令端職責分離原則。
     * 
     * @public
     * @returns {PermissionCommands} 權限命令控制器實例
     * @throws {Error} 當控制器未在容器中找到時拋出錯誤
     * @since 2.0.0
     * 
     * @example
     * ```typescript
     * const container = RBACContainer.getInstance();
     * const permissionCommands = container.getPermissionCommands();
     * 
     * // 使用控制器進行命令操作
     * await permissionCommands.createPermission(req, res);
     * ```
     */
    public getPermissionCommands(): PermissionCommands {
        // 從服務註冊表中取得權限命令控制器實例
        const controller = this.services.get('PermissionCommands');
        
        // 檢查控制器是否存在，Map.get() 可能返回 undefined
        if (!controller) {
            throw new Error('PermissionCommands not found in container');
        }
        
        // 進行類型斷言並返回控制器實例
        return controller as PermissionCommands;
    }

    /**
     * 取得使用者角色控制器
     * 
     * 從服務容器中取得已註冊的使用者角色關聯控制器實例。
     * 此控制器負責處理使用者與角色之間的關聯操作，
     * 包括角色指派、移除、查詢等功能。
     * 
     * @public
     * @returns {IUserToRoleController} 使用者角色關聯控制器實例
     * @throws {Error} 當控制器未在容器中找到時拋出錯誤
     * @since 1.0.0
     * 
     * @example
     * ```typescript
     * const container = RBACContainer.getInstance();
     * const userToRoleController = container.getUserToRoleController();
     * 
     * // 使用控制器進行操作
     * await userToRoleController.assignRoleToUser(userId, roleId);
     * ```
     */
    /**
     * 取得使用者角色關聯查詢控制器 - CQRS 模式
     * 
     * 從服務容器中取得已註冊的使用者角色關聯查詢控制器實例。
     * 查詢控制器專門負責處理所有與使用者角色關聯相關的讀取操作。
     * 
     * @public
     * @returns {UserToRoleQueries} 使用者角色關聯查詢控制器實例
     * @throws {Error} 當控制器未在容器中找到時拋出錯誤
     * @since 2.0.0
     */
    public getUserToRoleQueries(): UserToRoleQueries {
        const controller = this.services.get('UserToRoleQueries');
        if (!controller) {
            throw new Error('UserToRoleQueries not found in container');
        }
        return controller as UserToRoleQueries;
    }

    /**
     * 取得使用者角色關聯命令控制器 - CQRS 模式
     * 
     * 從服務容器中取得已註冊的使用者角色關聯命令控制器實例。
     * 命令控制器專門負責處理所有與使用者角色關聯相關的寫入操作。
     * 
     * @public
     * @returns {UserToRoleCommands} 使用者角色關聯命令控制器實例
     * @throws {Error} 當控制器未在容器中找到時拋出錯誤
     * @since 2.0.0
     */
    public getUserToRoleCommands(): UserToRoleCommands {
        const controller = this.services.get('UserToRoleCommands');
        if (!controller) {
            throw new Error('UserToRoleCommands not found in container');
        }
        return controller as UserToRoleCommands;
    }

    /**
     * 取得角色權限關聯查詢控制器 - CQRS 模式
     * 
     * 從服務容器中取得已註冊的角色權限關聯查詢控制器實例。
     * 查詢控制器專門負責處理所有與角色權限關聯相關的讀取操作，
     * 遵循 CQRS 模式的查詢端職責分離原則。
     * 
     * @public
     * @returns {RoleToPermissionQueries} 角色權限關聯查詢控制器實例
     * @throws {Error} 當控制器未在容器中找到時拋出錯誤
     * @since 2.0.0
     * 
     * @example
     * ```typescript
     * const container = RBACContainer.getInstance();
     * const roleToPermissionQueries = container.getRoleToPermissionQueries();
     * 
     * // 使用控制器進行查詢操作
     * const permissions = await roleToPermissionQueries.getRolePermissions(req, res);
     * ```
     */
    public getRoleToPermissionQueries(): RoleToPermissionQueries {
        // 從服務註冊表中取得角色權限關聯查詢控制器實例
        const controller = this.services.get('RoleToPermissionQueries');
        
        // 檢查控制器是否存在，Map.get() 可能返回 undefined
        if (!controller) {
            throw new Error('RoleToPermissionQueries not found in container');
        }
        
        // 進行類型斷言並返回控制器實例
        return controller as RoleToPermissionQueries;
    }

    /**
     * 取得角色權限關聯命令控制器 - CQRS 模式
     * 
     * 從服務容器中取得已註冊的角色權限關聯命令控制器實例。
     * 命令控制器專門負責處理所有與角色權限關聯相關的寫入操作，
     * 遵循 CQRS 模式的命令端職責分離原則。
     * 
     * @public
     * @returns {RoleToPermissionCommands} 角色權限關聯命令控制器實例
     * @throws {Error} 當控制器未在容器中找到時拋出錯誤
     * @since 2.0.0
     * 
     * @example
     * ```typescript
     * const container = RBACContainer.getInstance();
     * const roleToPermissionCommands = container.getRoleToPermissionCommands();
     * 
     * // 使用控制器進行命令操作
     * await roleToPermissionCommands.assignPermissionsToRole(req, res);
     * ```
     */
    public getRoleToPermissionCommands(): RoleToPermissionCommands {
        // 從服務註冊表中取得角色權限關聯命令控制器實例
        const controller = this.services.get('RoleToPermissionCommands');
        
        // 檢查控制器是否存在，Map.get() 可能返回 undefined
        if (!controller) {
            throw new Error('RoleToPermissionCommands not found in container');
        }
        
        // 進行類型斷言並返回控制器實例
        return controller as RoleToPermissionCommands;
    }

    /**
     * 通用服務取得方法
     * 
     * 提供一個通用的服務取得方法，支援泛型參數以確保類型安全。
     * 此方法特別適用於需要動態取得服務或當沒有專用的
     * getter 方法時使用。
     * 
     * ### 使用場景
     * - 動態服務取得：當服務名稱是動態決定的
     * - 擴展性：當需要支援未來的新服務類型
     * - 簡化代碼：當不想使用專用的 getter 方法
     * 
     * @template T - 返回的服務類型
     * @param serviceName - 服務名稱（字串識別符）
     * @public
     * @returns {T} 轉換為指定類型的服務實例
     * @throws {Error} 當指定的服務未在容器中找到時拋出錯誤
     * @since 1.0.0
     * 
     * @example
     * ```typescript
     * const container = RBACContainer.getInstance();
     * 
     * // 使用泛型參數確保類型安全
     * const userController = container.get<IUserController>('UserController');
     * 
     * // 動態服務取得
     * const serviceName = 'UserController';
     * const controller = container.get<IUserController>(serviceName);
     * ```
     */
    public get<T>(serviceName: string): T {
        // 從服務註冊表中取得指定的服務實例
        const service = this.services.get(serviceName);
        
        // 檢查服務是否存在，如果不存在則拋出異常
        if (!service) {
            throw new Error(`Service '${serviceName}' not found in container`);
        }
        
        // 進行類型斷言並返回服務實例
        return service as T;
    }

    /**
     * 取得所有已註冊的服務名稱
     * 
     * 返回容器中所有已註冊服務的名稱列表。
     * 這個方法常用於除錯、日誌記錄或系統監控。
     * 
     * ### 使用場景
     * - **除錯目的**: 檢查哪些服務已被正確註冊
     * - **系統監控**: 監控容器中的服務狀態
     * - **文件生成**: 為系統文件生成服務列表
     * 
     * @public
     * @returns {string[]} 所有已註冊服務的名稱陣列
     * @since 1.0.0
     * 
     * @example
     * ```typescript
     * const container = RBACContainer.getInstance();
     * const services = container.getRegisteredServices();
     * 
     * console.log('已註冊的服務:', services);
     * // 輸出: ["UserController", "RoleController", "PermissionController", ...]
     * 
     * // 使用於除錯
     * services.forEach(serviceName => {
     *   console.log(`服務 ${serviceName} 已註冊`);
     * });
     * ```
     */
    public getRegisteredServices(): string[] {
        // 從服務註冊表中取得所有鍵名，並轉換為陣列返回
        return Array.from(this.services.keys());
    }

    /**
     * 檢查服務是否已註冊
     * 
     * 檢查指定的服務名稱是否已在容器中註冊。
     * 這個方法常用於安全性檢查，在嘗試取得服務之前
     * 驗證其存在性。
     * 
     * ### 使用場景
     * - **安全性檢查**: 在取得服務前驗證其存在性
     * - **條件分支**: 根據服務是否存在進行不同的處理邏輯
     * - **系統狀態檢查**: 驗證系統的初始化狀態
     * 
     * @param serviceName - 要檢查的服務名稱
     * @public
     * @returns {boolean} 如果服務已註冊則返回 true，否則返回 false
     * @since 1.0.0
     * 
     * @example
     * ```typescript
     * const container = RBACContainer.getInstance();
     * 
     * // 安全性檢查
     * if (container.hasService('UserController')) {
     *   const userController = container.get<IUserController>('UserController');
     *   // 安全地使用控制器
     * } else {
     *   console.error('UserController 服務未註冊');
     * }
     * 
     * // 批量檢查
     * const requiredServices = ['UserController', 'RoleController'];
     * const allServicesReady = requiredServices.every(service => 
     *   container.hasService(service)
     * );
     * ```
     */
    public hasService(serviceName: string): boolean {
        // 使用 Map 的 has 方法檢查指定的服務名稱是否存在
        return this.services.has(serviceName);
    }
}
