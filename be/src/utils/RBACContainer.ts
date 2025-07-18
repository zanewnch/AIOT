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

// 導入使用者控制器類別 - 處理使用者相關的 CRUD 操作
import { UserController } from '../controller/rbac/UserController.js';

// 導入角色控制器類別 - 處理角色相關的 CRUD 操作
import { RoleController } from '../controller/rbac/RoleController.js';

// 導入權限控制器類別 - 處理權限相關的 CRUD 操作
import { PermissionController } from '../controller/rbac/PermissionController.js';

// 導入使用者角色關聯控制器類別 - 處理使用者與角色的關聯操作
import { UserToRoleController } from '../controller/rbac/UserToRoleController.js';

// 導入角色權限關聯控制器類別 - 處理角色與權限的關聯操作
import { RoleToPermissionController } from '../controller/rbac/RoleToPermissionController.js';

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
     * 單例模式：取得容器實例
     */
    public static getInstance(): RBACContainer {
        if (!RBACContainer.instance) {
            RBACContainer.instance = new RBACContainer();
        }
        return RBACContainer.instance;
    }

    /**
     * 註冊所有 RBAC 服務
     * 
     * 初始化並註冊所有 RBAC 相關的控制器到服務容器中。包括使用者、角色、
     * 權限管理等控制器，為依賴注入和服務管理提供基礎。
     * 
     * @private
     * @returns {void}
     */
    private registerServices(): void {
        // 註冊各個控制器
        this.services.set('UserController', new UserController());
        this.services.set('RoleController', new RoleController());
        this.services.set('PermissionController', new PermissionController());
        this.services.set('UserToRoleController', new UserToRoleController());
        this.services.set('RoleToPermissionController', new RoleToPermissionController());
    }

    /**
     * 雖然你使用了 TypeScript 的類型定義，但是 Map.get() 方法的返回類型始終是 T | undefined，因為 Map 無法保證一定能找到對應的 key。
      */
    /**
     * 取得使用者控制器
     */
    public getUserController(): IUserController {
        const controller = this.services.get('UserController');
        if (!controller) {
            throw new Error('UserController not found in container');
        }
        return controller as IUserController;
    }

    /**
     * 取得角色控制器
     */
    public getRoleController(): IRoleController {
        const controller = this.services.get('RoleController');
        if (!controller) {
            throw new Error('RoleController not found in container');
        }
        return controller as IRoleController;
    }

    /**
     * 取得權限控制器
     */
    public getPermissionController(): IPermissionController {
        const controller = this.services.get('PermissionController');
        if (!controller) {
            throw new Error('PermissionController not found in container');
        }
        return controller as IPermissionController;
    }

    /**
     * 取得使用者角色控制器
     */
    public getUserToRoleController(): IUserToRoleController {
        const controller = this.services.get('UserToRoleController');
        if (!controller) {
            throw new Error('UserToRoleController not found in container');
        }
        return controller as IUserToRoleController;
    }

    /**
     * 取得角色權限控制器
     */
    public getRoleToPermissionController(): IRoleToPermissionController {
        const controller = this.services.get('RoleToPermissionController');
        if (!controller) {
            throw new Error('RoleToPermissionController not found in container');
        }
        return controller as IRoleToPermissionController;
    }

    /**
     * 通用服務取得方法
     */
    public get<T>(serviceName: string): T {
        const service = this.services.get(serviceName);
        if (!service) {
            throw new Error(`Service '${serviceName}' not found in container`);
        }
        return service as T;
    }

    /**
     * 取得所有已註冊的服務名稱
     */
    public getRegisteredServices(): string[] {
        return Array.from(this.services.keys());
    }

    /**
     * 檢查服務是否已註冊
     */
    public hasService(serviceName: string): boolean {
        return this.services.has(serviceName);
    }
}
