/**
 * RBACContainer - RBAC 依賴注入容器
 * ===================================
 * 負責創建和註冊所有 RBAC 相關的控制器實例。
 * 採用簡單的依賴注入容器模式，不處理路由邏輯。
 */

import { UserController } from '../controller/rbac/UserController.js';
import { RoleController } from '../controller/rbac/RoleController.js';
import { PermissionController } from '../controller/rbac/PermissionController.js';
import { UserToRoleController } from '../controller/rbac/UserToRoleController.js';
import { RoleToPermissionController } from '../controller/rbac/RoleToPermissionController.js';
import { RBACContainerServicesType } from '../types/RBACContainerServicesType.js';
import type {
    IUserController,
    IRoleController,
    IPermissionController,
    IUserToRoleController,
    IRoleToPermissionController
} from '../types/controllers/index.js';



export class RBACContainer {
    private static instance: RBACContainer;

    // 註冊表：儲存所有已創建的實例
    private readonly services = new Map<string, RBACContainerServicesType>();



    private constructor() {
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
     * 註冊所有服務
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
