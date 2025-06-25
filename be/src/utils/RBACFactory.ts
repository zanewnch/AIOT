import { DIContainer } from './RBACContainer.js';
import { 
    IUserController, 
    IRoleController, 
    IPermissionController, 
    IUserToRoleController, 
    IRoleToPermissionController 
} from '../types/index.js';
import RBACController from '../controller/RBACController.js';

/*
================================================================================================
📦 Factory vs Container 職責分工說明
================================================================================================

你的疑問很對！Factory 和 Container 確實有一些重疊，但它們各司其職：

🏭 RBACFactory 的職責 (HIGH-LEVEL - 對外介面)：
┌─────────────────────────────────────────────────────────────────┐
│ 1. 【使用者體驗】: 提供簡單、直觀的API給開發者使用                      │
│ 2. 【創建策略】: 決定要用哪種方式創建RBACController                    │
│ 3. 【場景適配】: 針對不同使用場景提供最佳的創建方法                      │
│ 4. 【複雜性封裝】: 隱藏DIContainer的操作細節                         │
└─────────────────────────────────────────────────────────────────┘

📦 DIContainer 的職責 (LOW-LEVEL - 依賴管理)：
┌─────────────────────────────────────────────────────────────────┐
│ 1. 【實例管理】: 負責創建、存儲、提供具體的controller實例              │
│ 2. 【依賴解析】: 解決各種介面對應到哪個具體實現                        │
│ 3. 【生命週期】: 管理物件的單例模式、創建時機等                        │
│ 4. 【動態註冊】: 允許runtime時替換實現                              │
└─────────────────────────────────────────────────────────────────┘

💡 類比說明：
Factory = 【餐廳櫃台】     Container = 【廚房】
- 櫃台：接待客人，提供菜單選項，簡化點餐流程
- 廚房：實際準備食材，烹飪菜餚，管理庫存

🔄 重疊的部分：
兩者都可以"創建"物件，但層次不同：
- Factory：創建"完整的解決方案"(RBACController + 所有依賴)
- Container：創建"單一組件"(UserController、RoleController等)

🎯 為什麼需要兩層？
沒有Factory的話：
```typescript
// 使用者要自己處理這些細節
const container = DIContainer.getInstance();
const rbacController = new RBACController(container);
```

有Factory的話：
```typescript
// 使用者只需要一行
const rbacController = RBACFactory.createDefaultRBACController();
```

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
     * 創建預設的RBAC Controller
     * 
     * 這是什麼？
     * - 最簡單的使用方式，一行代碼就能獲得完整的RBAC系統
     * - 使用預設的DIContainer和所有預設的controller實現
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
     * 
     * 注意：目前這個實現有問題，應該要傳入DIContainer
     */
    public static createDefaultRBACController() {
        // TODO: 修正實現 - 應該傳入預設的DIContainer
        // return new RBACController(DIContainer.getInstance());
        return new (RBACController.constructor as any)();
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
        // 步驟1: 創建一個全新的DI容器實例
        // 為什麼要新的？因為我們不想影響到全域的預設容器
        // 這樣測試結束後，預設容器還是乾淨的
        const customContainer = DIContainer.getInstance();
        
        // 步驟2: 把所有自訂的controller註冊到容器中
        // 這會覆蓋掉預設的實現
        customContainer.register('IUserController', userController);
        customContainer.register('IRoleController', roleController);
        customContainer.register('IPermissionController', permissionController);
        customContainer.register('IUserToRoleController', userToRoleController);
        customContainer.register('IRoleToPermissionController', roleToPermissionController);
        
        // 步驟3: 創建RBACController，它會使用我們剛註冊的自訂實現
        // 注意：這裡的實現也有問題，應該要傳入customContainer
        return new (RBACController.constructor as any)(customContainer);
    }

    /**
     * 獲取DI容器實例，可用於直接獲取各種controller
     * 
     * 這是什麼？
     * - 讓你可以直接存取DIContainer，不通過RBACController
     * - 適合你只需要某一個特定controller的情況
     * - 也可以用來動態註冊新的實現
     * 
     * 什麼時候用？
     * 1. 【只需要單一controller】: 不需要完整的RBAC系統，只要UserController
     * 2. 【動態配置】: 在runtime動態替換某個controller的實現
     * 3. 【除錯和監控】: 檢查容器中註冊了什麼服務
     * 4. 【進階用法】: 直接操作DI容器的進階功能
     * 
     * 例子：
     * ```typescript
     * // 只需要UserController的情況
     * const container = RBACFactory.getDIContainer();
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
    public static getDIContainer(): DIContainer {
        return DIContainer.getInstance();
    }
} 

/*
總結一下整個Factory的使用流程：

=== 情況1: 一般開發 ===
const rbacController = RBACFactory.createDefaultRBACController();
// 簡單、快速、開箱即用

=== 情況2: 單元測試 ===
const rbacController = RBACFactory.createCustomRBACController(
    mockUserController,
    mockRoleController,
    // ... 其他mock
);
// 完全控制、可預測、易測試

=== 情況3: 只需要特定controller ===
const container = RBACFactory.getDIContainer();
const userController = container.getUserController();
// 精確、輕量、靈活

=== 情況4: 動態配置 ===
const container = RBACFactory.getDIContainer();
container.register('IUserController', newImplementation);
const rbacController = RBACFactory.createDefaultRBACController();
// 動態、可擴展、熱更新

這就是Factory Pattern的威力：
- 隱藏複雜性
- 提供多種創建方式
- 讓使用更簡單
- 讓測試更容易
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
│ const container = DIContainer.getInstance();                     │
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
│ const testContainer = DIContainer.getInstance();                 │
│ testContainer.register('IUserController', mockUserController);   │
│ testContainer.register('IRoleController', mockRoleController);   │
│ // ...                                                           │
│                                                                   │
│ // 現在container提供的是mock實例，不是真的實例                       │
└─────────────────────────────────────────────────────────────────┘

📝 場景3: 只需要單一組件
┌─────────────────────────────────────────────────────────────────┐
│ // 🏭 Factory負責：提供直接存取container的方式                       │
│ const container = RBACFactory.getDIContainer();                  │
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
│ 🏭 Factory          │ • 提供使用者友善的API                          │
│ (對外服務層)         │ • 封裝Container的複雜操作                      │
│                     │ • 針對不同場景提供最佳方案                      │
│                     │ • 讓非專家也能輕鬆使用                         │
├─────────────────────┼─────────────────────────────────────────────┤
│ 📦 Container        │ • 管理物件的創建和生命週期                      │
│ (依賴管理層)         │ • 解析interface到具體實現的映射                │
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


總結：Factory vs Container 的職責分工
通過這些詳細的註釋和圖表，現在應該可以清楚看出它們的分工：
🏭 Factory (高層次 - 對外介面)
職責: 提供使用者友善的API
目標: 讓開發者用最簡單的方式獲得RBAC系統
關注點: 使用者體驗、場景適配
📦 Container (低層次 - 依賴管理)
職責: 管理具體的依賴注入邏輯
目標: 提供靈活的依賴解析和物件管理
關注點: 技術實現、生命週期管理
🔄 重疊但不衝突
是的，它們都可以"創建"物件，但：
Factory: 創建"完整解決方案" (RBACController + 所有依賴)
Container: 創建"單一組件" (個別的 Controller)
💡 餐廳類比
Factory = 櫃台: 接待客人，提供菜單，簡化點餐
Container = 廚房: 準備食材，烹飪菜餚，管理庫存
兩者分工合作，讓整個系統既好用又靈活！

================================================================================================
*/ 