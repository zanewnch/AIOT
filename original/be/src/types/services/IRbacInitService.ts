/**
 * @fileoverview RBAC 初始化服務介面
 * 
 * 定義角色型存取控制（RBAC）系統初始化服務的標準介面。
 * 此介面確保服務層的實作具有一致性和可測試性。
 * 
 * 主要功能：
 * - RBAC 示範資料建立的標準方法定義
 * - 系統管理員帳號創建方法
 * - 支援進度追蹤的初始化方法
 * - 角色、權限、使用者及其關聯關係的完整初始化
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
 */

// import { ProgressCallback } from '../ProgressTypes.js'; // 已移除 Progress 功能
type ProgressCallback = (progress: number, message: string) => void;

/**
 * RBAC 初始化服務介面
 * 
 * 定義 RBAC 系統初始化服務的標準方法，包含示範資料建立、
 * 管理員帳號創建和進度追蹤功能。
 */
export interface IRbacInitService {
    /**
     * 建立 RBAC 示範資料
     * 執行完整的 RBAC 初始化流程，包含角色、權限、使用者及其關聯關係
     * 
     * @returns Promise<Record<string, number>> 包含各類型資料建立數量的統計結果
     * 
     * @example
     * ```typescript
     * const rbacService = new RbacInitService();
     * const result = await rbacService.seedRbacDemo();
     * 
     * console.log(`建立了 ${result.users} 個使用者`);
     * console.log(`建立了 ${result.roles} 個角色`);
     * console.log(`建立了 ${result.permissions} 個權限`);
     * console.log(`建立了 ${result.userRoles} 個使用者角色關聯`);
     * console.log(`建立了 ${result.rolePermissions} 個角色權限關聯`);
     * ```
     * 
     * @remarks
     * 此方法會按順序執行以下步驟：
     * 1. 建立角色：admin, editor, viewer
     * 2. 建立權限：user:delete, post:edit, data:view
     * 3. 建立使用者：大量測試使用者 + alice, bob
     * 4. 配置角色權限關聯
     * 5. 指派使用者角色
     * 
     * 若資料已存在，則不會重複建立
     */
    seedRbacDemo(): Promise<Record<string, number>>;

    /**
     * 創建系統管理員帳號
     * 創建一個具有完整權限的管理員用戶
     * 
     * @param username 管理員用戶名（預設：admin）
     * @param password 管理員密碼（預設：admin）
     * @param email 管理員郵箱（預設：admin@admin.com）
     * @returns Promise<{success: boolean, message: string}> 創建結果
     * 
     * @example
     * ```typescript
     * const rbacService = new RbacInitService();
     * const result = await rbacService.createAdminUser('admin', 'admin');
     * console.log(result.message);
     * ```
     */
    createAdminUser(
        username?: string,
        password?: string,
        email?: string
    ): Promise<{success: boolean, message: string}>;

    /**
     * 建立 RBAC 示範資料（支援進度回調）
     * 與 seedRbacDemo 相同功能，但支援進度追蹤回調
     * 
     * @param progressCallback 進度回調函數，用於追蹤初始化進度
     * @returns Promise<Record<string, number>> 包含各類型資料建立數量的統計結果
     * 
     * @example
     * ```typescript
     * const rbacService = new RbacInitService();
     * const result = await rbacService.seedRbacDemoWithProgress((progress) => {
     *   console.log(`進度: ${progress.percentage}% - ${progress.message}`);
     * });
     * ```
     */
    seedRbacDemoWithProgress(progressCallback?: ProgressCallback): Promise<Record<string, number>>;
}