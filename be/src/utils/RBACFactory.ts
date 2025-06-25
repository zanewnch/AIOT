import { RBACContainer } from './RBACContainer.js';
import {
    IUserController,
    IRoleController,
    IPermissionController,
    IUserToRoleController,
    IRoleToPermissionController
} from '../types/index.js';
import RBACController from '../controller/RBACController.js';

// 引入具體實現，讓 Factory 負責創建
import { UserController } from '../controller/rbac/UserController.js';
import { RoleController } from '../controller/rbac/RoleController.js';
import { PermissionController } from '../controller/rbac/PermissionController.js';
import { UserToRoleController } from '../controller/rbac/UserToRoleController.js';
import { RoleToPermissionController } from '../controller/rbac/RoleToPermissionController.js';

/*
================================================================================================
📦 Factory vs Container 職責分工說明
================================================================================================

正確理解：Factory 和 Container 是分工合作，各有專門職責，**沒有重疊**！

🏭 RBACFactory 的職責 (HIGH-LEVEL - 創建者)：
┌─────────────────────────────────────────────────────────────────┐
│ 1. 【創建服務實例】: 決定要創建哪些具體的Controller實例             │
│ 2. 【場景適配】: 針對不同使用場景提供最佳的創建方法                  │
│ 3. 【組裝邏輯】: 協調Container和其他組件，組裝最終產品              │
│ 4. 【使用者介面】: 提供簡單、直觀的API給開發者使用                  │
└─────────────────────────────────────────────────────────────────┘

📦 RBACContainer 的職責 (LOW-LEVEL - 管理者)：
┌─────────────────────────────────────────────────────────────────┐
│ 1. 【實例管理】: 存儲、註冊、提供具體的controller實例              │
│ 2. 【依賴解析】: 解決各種介面對應到哪個具體實現                      │
│ 3. 【生命週期】: 管理物件的單例模式、查找邏輯等                      │
│ 4. 【服務註冊】: 接受外部提供的實例並管理                          │
└─────────────────────────────────────────────────────────────────┘

💡 正確類比說明：
Factory = 【建築師】     Container = 【建材倉庫】
- 建築師：決定用什麼材料，訂購材料，設計藍圖，協調建造過程
- 建材倉庫：存放建築師提供的建材，管理庫存，提供所需材料

🔄 分工合作，不是重疊：
- Factory：創建"完整解決方案" (創建服務實例 + 組裝 RBACController)
- Container：管理"個別組件" (存儲和提供 UserController、RoleController等)

🎯 為什麼需要兩層分工？
沒有Factory的話：
```typescript
// 使用者要自己當建築師和採購員
const services = {
    'IUserController': new UserController(),
    'IRoleController': new RoleController(),
    // ... 等等
};
const container = RBACContainer.createCustomInstance(services);
const rbacController = new RBACController(container);
```

有Factory的話：
```typescript
// Factory當建築師，使用者只需要說要什麼
const rbacController = RBACFactory.createDefaultRBACController();
```

💡 正確的分工應該是：
Factory 應該只負責：
- 決定要建立哪種 RBACController
- 協調不同組件
- 提供簡單的 API
Container 應該只負責：
- 管理服務註冊
- 提供服務實例
- 生命週期管理

================================================================================================
*/

/**
 * RBACFactory - RBAC系統的工廠類
 *
 * 為什麼需要Factory Pattern？
 * 1. 【封裝複雜性】: 隱藏RBACController的創建邏輯，讓使用者不需要知道內部細節
 * 2. 【提供多種創建方式】: 可以創建預設版本、自訂版本、測試版本等
 * 3. 【一致的創建介面】: 所有創建RBACController的邏輯都集中在這裡
 * 4. 【降低使用門檻】: 使用者不需要了解DIContainer就能使用RBAC系統
 *
 * 使用場景：
 * - 一般開發: 用 createDefaultRBACController() 快速獲得可用的RBAC系統
 * - 單元測試: 用 createCustomRBACController() 注入mock實現
 * - 特殊需求: 用 createCustomRBACController() 注入自訂實現
 *
 * 沒有Factory的問題：
 * - 每個地方都要寫 new RBACController(DIContainer.getInstance())
 * - 測試時要自己處理DIContainer的mock邏輯
 * - 創建邏輯散落各處，不好維護
 */
export class RBACFactory {
    /**
     * 創建預設的服務實例
     *
     * 這是什麼？
     * - Factory 負責決定要創建哪些具體實現
     * - 統一管理所有服務的創建邏輯
     * - 讓 Container 只需要管理，不需要知道如何創建
     *
     * 為什麼是私有方法？
     * - 這是 Factory 的內部邏輯，外部不需要知道
     * - 集中管理創建邏輯，易於維護
     * - 如果要換實現，只需要修改這裡
     */
    private static createDefaultServices(): Record<string, any> {
        return {
            'IUserController': new UserController(),
            'IRoleController': new RoleController(),
            'IPermissionController': new PermissionController(),
            'IUserToRoleController': new UserToRoleController(),
            'IRoleToPermissionController': new RoleToPermissionController()
        };
    }

    /**
     * 創建預設的RBAC Controller
     *
     * 這是什麼？
     * - 最簡單的使用方式，一行代碼就能獲得完整的RBAC系統
     * - Factory 負責創建所有需要的服務實例
     * - Container 負責管理這些實例
     * - 適合大部分正常使用情況
     *
     * 什麼時候用？
     * - 正式環境的API路由中
     * - 不需要特殊客製化的場景
     * - 快速原型開發
     *
     * 例子：
     * ```typescript
     * // 在你的API路由中
     * const rbacController = RBACFactory.createDefaultRBACController();
     * app.post('/api/users', rbacController.createUser.bind(rbacController));
     * ```
     */
    public static createDefaultRBACController() {
        // 步驟1: Factory 負責創建所有服務實例
        const defaultServices = this.createDefaultServices();

        // 步驟2: 獲取容器並初始化服務
        const defaultContainer = RBACContainer.getInstance();
        defaultContainer.initializeDefaultServices(defaultServices);

        // 步驟3: Factory 負責組裝最終的 RBACController
        return new RBACController(defaultContainer);
    }

    /**
     * 創建自訂的RBAC Controller，用於測試或特殊需求
     *
     * 這是什麼？
     * - 允許你完全客製化RBAC系統的每個組件
     * - 可以注入任何你想要的controller實現
     * - 主要用於單元測試和特殊業務需求
     *
     * 什麼時候用？
     * 1. 【單元測試】: 注入mock controller來測試特定行為
     * 2. 【A/B測試】: 注入不同實現來比較效能或功能
     * 3. 【特殊需求】: 某些controller需要特殊邏輯（如不同的資料庫、快取策略）
     * 4. 【開發階段】: 某些功能還沒實現，先用假的實現
     *
     * 測試例子：
     * ```typescript
     * // 在測試中使用
     * const mockUserController = {
     *     createUser: jest.fn().mockResolvedValue({ id: 1, name: 'test' }),
     *     // ... 其他mock方法
     * };
     *
     * const rbacController = RBACFactory.createCustomRBACController(
     *     mockUserController,
     *     mockRoleController,
     *     mockPermissionController,
     *     mockUserToRoleController,
     *     mockRoleToPermissionController
     * );
     *
     * // 現在可以測試rbacController的行為，而不會真的操作資料庫
     * ```
     *
     * 特殊需求例子：
     * ```typescript
     * // 假設你需要一個會寄email的UserController
     * class EmailUserController extends UserController {
     *     async createUser(user) {
     *         const result = await super.createUser(user);
     *         await this.sendWelcomeEmail(result.email);
     *         return result;
     *     }
     * }
     *
     * const rbacController = RBACFactory.createCustomRBACController(
     *     new EmailUserController(),  // 使用特殊版本
     *     // ... 其他用預設的
     * );
     * ```
     */
    public static createCustomRBACController(
        userController: IUserController,
        roleController: IRoleController,
        permissionController: IPermissionController,
        userToRoleController: IUserToRoleController,
        roleToPermissionController: IRoleToPermissionController
    ) {
        // Factory 負責：決定要使用什麼服務配置，並委託 Container 創建實例
        // 不再直接操作 Container 的內部邏輯
        const customContainer = RBACContainer.createCustomInstance({
            'IUserController': userController,
            'IRoleController': roleController,
            'IPermissionController': permissionController,
            'IUserToRoleController': userToRoleController,
            'IRoleToPermissionController': roleToPermissionController
        });

        // Factory 負責：組裝最終的 RBACController
        return new RBACController(customContainer);
    }

    /**
     * 獲取RBAC容器實例，可用於直接獲取各種controller
     *
     * 這是什麼？
     * - 讓你可以直接存取RBACContainer，不通過RBACController
     * - 適合你只需要某一個特定controller的情況
     * - 也可以用來動態註冊新的實現
     *
     * 什麼時候用？
     * 1. 【只需要單一controller】: 不需要完整的RBAC系統，只要UserController
     * 2. 【動態配置】: 在runtime動態替換某個controller的實現
     * 3. 【除錯和監控】: 檢查容器中註冊了什麼服務
     * 4. 【進階用法】: 直接操作RBAC容器的進階功能
     *
     * 例子：
     * ```typescript
     * // 只需要UserController的情況
     * const container = RBACFactory.getRBACContainer();
     * const userController = container.getUserController();
     *
     * // 動態替換實現
     * container.register('IUserController', new FastUserController());
     *
     * // 之後所有通過container獲取的UserController都會是FastUserController
     * ```
     *
     * 注意：
     * - 這是比較進階的用法，一般開發者用前兩個方法就夠了
     * - 直接操作container要小心，可能會影響到其他地方的行為
     */
    public static getRBACContainer(): RBACContainer {
        const container = RBACContainer.getInstance();

        // 確保容器已經初始化了預設服務
        // 如果容器是空的，就初始化預設服務
        try {
            container.getUserController();
        } catch (error) {
            // 容器還沒有服務，初始化預設服務
            const defaultServices = this.createDefaultServices();
            container.initializeDefaultServices(defaultServices);
        }

        return container;
    }
}

/*
總結一下整個Factory的使用流程：

=== 情況1: 一般開發 ===
const rbacController = RBACFactory.createDefaultRBACController();
// Factory 創建所有服務實例 → Container 管理實例 → 組裝 RBACController

=== 情況2: 單元測試 ===
const rbacController = RBACFactory.createCustomRBACController(
    mockUserController,
    mockRoleController,
    // ... 其他mock
);
// Factory 接受 mock 實例 → Container 管理 mock 實例 → 組裝 RBACController

=== 情況3: 只需要特定controller ===
const container = RBACFactory.getRBACContainer();
const userController = container.getUserController();
// Factory 先初始化過 Container → Container 提供服務實例

=== 情況4: 動態配置 ===
const container = RBACFactory.getRBACContainer();
container.register('IUserController', newImplementation);
const rbacController = RBACFactory.createDefaultRBACController();
// 動態替換後 Factory 創建時會使用新的實現

正確的職責分工：
🏭 Factory：決定創建什麼、如何組裝
📦 Container：存儲管理、提供查找
*/

/*
================================================================================================
🎯 具體分工範例 - Factory vs Container
================================================================================================

假設你要在API中使用RBAC系統，來看看兩者的分工：

📝 場景1: 一般開發者的使用體驗
┌─────────────────────────────────────────────────────────────────┐
│ // 🏭 Factory負責：提供簡單的API                                    │
│ import { RBACFactory } from './utils/RBACFactory.js';              │
│                                                                   │
│ // 一行代碼搞定，不需要知道內部細節                                    │
│ const rbacController = RBACFactory.createDefaultRBACController();  │
│                                                                   │
│ // 使用                                                            │
│ app.post('/api/users', rbacController.createUser);                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ // 📦 Container在背後負責：管理所有依賴                              │
│ // (開發者看不到這些，Factory內部處理)                               │
│                                                                   │
│ const container = RBACContainer.getInstance();                   │
│ // container內部已經註冊了：                                        │
│ // - IUserController -> UserController實例                       │
│ // - IRoleController -> RoleController實例                       │
│ // - ... 等等                                                    │
│                                                                   │
│ // 當RBACController需要UserController時                          │
│ // container提供正確的實例                                          │
└─────────────────────────────────────────────────────────────────┘

📝 場景2: 單元測試的分工
┌─────────────────────────────────────────────────────────────────┐
│ // 🏭 Factory負責：提供測試友善的創建方式                            │
│ const mockUserController = {                                     │
│     createUser: jest.fn().mockResolvedValue({id: 1})            │
│ };                                                               │
│                                                                   │
│ // Factory讓測試變簡單                                             │
│ const rbacController = RBACFactory.createCustomRBACController(   │
│     mockUserController,                                          │
│     // ... 其他mock                                              │
│ );                                                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ // 📦 Container在背後負責：替換具體實現                             │
│ // (Factory內部會做這些事)                                         │
│                                                                   │
│ const testContainer = RBACContainer.getInstance();               │
│ testContainer.register('IUserController', mockUserController);   │
│ testContainer.register('IRoleController', mockRoleController);   │
│ // ...                                                           │
│                                                                   │
│ // 現在container提供的是mock實例，不是真的實例                       │
└─────────────────────────────────────────────────────────────────┘

📝 場景3: 只需要單一組件
┌─────────────────────────────────────────────────────────────────┐
│ // 🏭 Factory負責：提供直接存取container的方式                       │
│ const container = RBACFactory.getRBACContainer();                │
│                                                                   │
│ // 有時你只需要一個UserController，不需要整個RBAC系統                │
│ const userController = container.getUserController();            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ // 📦 Container負責：提供具體的controller實例                       │
│ // container.getUserController() 內部會：                        │
│ // 1. 查找 'IUserController' 對應的實例                           │
│ // 2. 如果還沒創建就創建一個                                        │
│ // 3. 回傳UserController實例                                     │
└─────────────────────────────────────────────────────────────────┘

🔍 總結分工：
┌─────────────────────┬─────────────────────────────────────────────┐
│        職責         │                   具體工作                     │
├─────────────────────┼─────────────────────────────────────────────┤
│ 🏭 Factory          │ • 決定如何組裝完整的RBAC系統                   │
│ (創建者)            │ • 提供不同場景的創建策略                        │
│                     │ • 協調Container和其他組件                      │
│                     │ • 提供使用者友善的API                          │
├─────────────────────┼─────────────────────────────────────────────┤
│ 📦 Container        │ • 存儲和管理各種Controller實例                 │
│ (管理者)            │ • 解析interface到具體實現的映射                │
│                     │ • 提供依賴注入的核心機制                        │
│                     │ • 支援動態替換實現                             │
└─────────────────────┴─────────────────────────────────────────────┘

🤔 為什麼不直接用Container？
如果沒有Factory，每個開發者都要：
1. 了解DIContainer的API
2. 知道怎麼創建RBACController
3. 處理測試時的mock注入
4. 管理不同環境的配置

有了Factory，開發者只需要：
1. 知道三個簡單的method
2. 根據場景選擇合適的方法
3. 一行代碼搞定

這就是為什麼需要兩層的原因：分離關注點，讓每一層專注做好自己的事！


總結：Factory vs Container 的正確職責分工
通過這些詳細的註釋和圖表，現在可以清楚看出它們的分工合作：

🏭 Factory (高層次 - 創建者)
職責: 決定如何組裝和創建完整系統
目標: 讓開發者用最簡單的方式獲得RBAC系統
關注點: 創建策略、場景適配、組裝邏輯

📦 Container (低層次 - 管理者)
職責: 管理和提供各種依賴組件
目標: 提供靈活的依賴解析和物件管理
關注點: 實例管理、技術實現、生命週期管理

🤝 分工合作，各司其職：
Factory: 組裝"完整解決方案" (決定如何建造房子)
Container: 管理"個別組件" (提供建材和工具)

💡 建築類比
Factory = 建築師: 設計藍圖，協調建造過程
Container = 建材倉庫: 存放建材，提供所需材料
兩者分工合作，讓整個系統既好用又靈活！

================================================================================================
*/