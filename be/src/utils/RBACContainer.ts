import {
    IUserController,
    IRoleController,
    IPermissionController,
    IUserToRoleController,
    IRoleToPermissionController
} from '../types/index.js';

import { UserController } from '../controller/rbac/UserController.js';
import { RoleController } from '../controller/rbac/RoleController.js';
import { PermissionController } from '../controller/rbac/PermissionController.js';
import { UserToRoleController } from '../controller/rbac/UserToRoleController.js';
import { RoleToPermissionController } from '../controller/rbac/RoleToPermissionController.js';

/**
 * DIContainer - 依賴注入容器
 * 
 * 為什麼需要DIContainer？
 * 1. 【控制反轉 IoC】: 不是由使用者決定要用哪個實現，而是由容器統一管理
 * 2. 【生命週期管理】: 統一管理物件的創建、銷毀和單例模式
 * 3. 【鬆耦合】: RBACController不需要知道具體要用哪個實現類
 * 4. 【測試友善】: 可以輕鬆替換為mock實現進行單元測試
 * 5. 【配置集中化】: 所有依賴關係在一個地方管理，易於修改
 * 
 * 沒有DIContainer的問題：
 * - RBACController裡面會寫死 new UserController()
 * - 要測試時很難替換成mock
 * - 要換不同實現時需要修改多處代碼
 * - 物件創建邏輯散落各處
 * 
 * : 所以意思是說 讓我不在 rbaccontroller 裡面hardencode the child controller, 所以創建這個 container 讓我在這個file 統一管理具體的 instance 是嘛
 * 
 * 簡單總結:
 * 避免hardcode - RBACController不再寫死new UserController()
 * 統一管理 - 所有具體實例的創建都集中在DIContainer
 * 一處修改，處處生效 - 要換實現只需要改DIContainer
 * 這就是依賴注入的精髓："不要call me, I'll call you" - 不是你主動去new實例，而是讓容器提供給你！
 * 
 * 
 * : 所以DI 的實際執行方式 不只是declare variable 的時候 用 interface, 也可以直接create one container 透過instantiate container 來實現DI?
 * 
 * 是的，依賴注入（DI）的實現不只是在聲明變數時用 interface 定義類型，還可以透過創建一個容器（如 DIContainer）來集中管理實例化，實現更靈活的 DI。以下是核心點：
 * 1. 用 Interface 聲明變數：
 * 聲明變數時用 interface（如 IUserController）確保類型安全，解耦具體實現：
 * 但這僅解決類型依賴，實例化仍需手動或由容器處理。
 * 
 * 2. DIContainer 實現 DI：
 * 透過 DIContainer 集中管理實例創建，代替手動 new 具體類（如 new UserController()）。
 * 容器負責：
 * 註冊服務（interface 對應具體實現）。
 * 解析依賴（提供實例）。
 * 好處：不硬編碼 new UserController()，可輕鬆替換實現（如 mock）。
 * 
 * 
 * 兩者結合：
 * Interface 確保變數類型安全，定義依賴結構。
 * DIContainer 負責實例化，實現控制反轉（IoC），讓組件不直接創建依賴。
 * 實際執行：組件（如 RBACController）從容器獲取實例，容器決定具體實現。
 * 結論：
 * DI 不限於用 interface 聲明變數類型。透過創建 DIContainer 並集中實例化，可以更全面實現 DI，達成鬆耦合、易測試和統一管理的目標。這正是你之前分享的 DIContainer 代碼的精髓：用容器管理實例，取代硬編碼依賴。
 */
export class DIContainer {
    private static instance: DIContainer;

    // 用Map來存儲所有註冊的服務實例
    // key: interface名稱 (如 'IUserController')
    // value: 實際的實現物件 (如 UserController的實例)
    private services: Map<string, any> = new Map();

    // 私有constructor確保只能透過getInstance()創建實例 (Singleton模式)
    // 這樣整個應用程式只會有一個DI容器，確保依賴管理的一致性
    private constructor() {
        this.registerServices();
    }

    /**
     * 獲取DI容器的唯一實例 (Singleton模式)
     * 為什麼要用Singleton？
     * - 確保整個應用程式的依賴配置是一致的
     * - 避免重複創建容器造成記憶體浪費
     * - 讓依賴注入的行為可預測
     * 
     * 
     * singleton 雖然看起來多此一舉， 完全可以用單純的global variable 來做到一樣的效果
     * 但它的重點在於讓developer 可以知道明確的設計意圖(intension)
     * 
     * 然後 getInstance 就是 singleton 具體實現的 conventional name
     */
    public static getInstance(): DIContainer {
        if (!DIContainer.instance) {
            DIContainer.instance = new DIContainer();
        }
        return DIContainer.instance;
    }

    /**
     * 註冊預設的服務實現
     * 這裡是"預設配置" - 正式環境會用這些實現
     * 
     * 為什麼要分開註冊？
     * - 可以在不同環境(開發/測試/正式)使用不同實現
     * - 可以動態替換實現而不需要重啟應用程式
     * - 讓配置更靈活
     */
    private registerServices(): void {
        // 註冊所有服務的預設實現
        // 格式: interface名稱 -> 具體實現的實例
        this.services.set('IUserController', new UserController());
        this.services.set('IRoleController', new RoleController());
        this.services.set('IPermissionController', new PermissionController());
        this.services.set('IUserToRoleController', new UserToRoleController());
        this.services.set('IRoleToPermissionController', new RoleToPermissionController());
    }

    /**
     * 通用的服務獲取方法
     * 
     * 為什麼需要這個方法？
     * - 統一的依賴解析邏輯
     * - 錯誤處理 (如果服務不存在會拋出明確的錯誤)
     * - 類型安全 (使用泛型確保回傳正確的類型)
     */
    public get<T>(serviceName: string): T {
        const service = this.services.get(serviceName);
        if (!service) {
            throw new Error(`Service ${serviceName} not found`);
        }
        return service;
    }

    /**
     * 動態註冊或替換服務實現
     * 
     * 什麼時候會用到？
     * - 單元測試時註冊mock實現
     * - 根據環境變數載入不同實現
     * - 熱替換功能 (不重啟就更新實現)
     * 
     * 例子: container.register('IUserController', mockUserController);
     */
    public register<T>(serviceName: string, implementation: T): void {
        this.services.set(serviceName, implementation);
    }

    // ====== 便利方法 - 避免每次都要記住interface名稱 ======
    // 這些方法讓使用更簡單: container.getUserController() 
    // 而不是: container.get<IUserController>('IUserController')

    /**
     * 獲取用戶控制器
     * 實際回傳的可能是UserController或測試時的MockUserController
     */
    public getUserController(): IUserController {
        return this.get<IUserController>('IUserController');
    }

    /**
     * 獲取角色控制器
     */
    public getRoleController(): IRoleController {
        return this.get<IRoleController>('IRoleController');
    }

    /**
     * 獲取權限控制器
     */
    public getPermissionController(): IPermissionController {
        return this.get<IPermissionController>('IPermissionController');
    }

    /**
     * 獲取用戶-角色關聯控制器
     */
    public getUserToRoleController(): IUserToRoleController {
        return this.get<IUserToRoleController>('IUserToRoleController');
    }

    /**
     * 獲取角色-權限關聯控制器
     */
    public getRoleToPermissionController(): IRoleToPermissionController {
        return this.get<IRoleToPermissionController>('IRoleToPermissionController');
    }
}

/*
對比一下有無DIContainer的差別：

=== 沒有DIContainer (直接在constructor裡宣告) ===
class RBACController {
    private userController: IUserController;
    
    constructor() {
        // 問題: 這裡必須寫死具體實現
        this.userController = new UserController();  // 寫死了！
        // 測試時怎麼替換成MockUserController？
        // 要換成其他實現怎麼辦？
    }
}

=== 有DIContainer ===
class RBACController {
    private userController: IUserController;
    
    constructor(diContainer: DIContainer) {
        // 好處: 不需要知道具體實現，由容器決定
        this.userController = diContainer.getUserController();
        // 測試時: diContainer.register('IUserController', mockUserController);
        // 換實現: 只需要修改DIContainer的註冊邏輯
    }
}

這就是為什麼需要DIContainer的原因！
*/
