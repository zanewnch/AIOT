/**
 * @fileoverview 使用者角色關聯命令服務介面
 * 
 * 定義使用者與角色關聯命令服務的標準介面，專注於所有寫入和操作相關功能。
 * 此介面確保命令服務層的實作具有一致性和可測試性。
 * 遵循 CQRS 模式，只包含命令操作，包含創建、更新、刪除等寫入邏輯。
 * 
 * 主要功能：
 * - 使用者角色分配和撤銷方法定義
 * - 批次操作方法簽名
 * - 快取管理方法定義
 * - 事務性操作支援方法
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-08-06
 */

/**
 * 角色分配請求物件
 */
export interface AssignRolesRequest {
    userId: number;
    roleIds: number[];
}

/**
 * 角色撤銷請求物件
 */
export interface RemoveRoleRequest {
    userId: number;
    roleId: number;
}

/**
 * 使用者角色關聯命令服務介面
 * 
 * 定義使用者與角色關聯命令服務的標準方法，只包含寫入操作。
 * 支援事務性操作和自動快取管理。
 */
export interface IUserToRoleCommandsSvc {
    /**
     * 為使用者分配角色
     * 
     * @param request 角色分配請求物件，包含使用者 ID 和角色 ID 陣列
     * @returns 分配操作完成的 Promise
     * @throws Error 當使用者或角色不存在，或分配失敗時拋出錯誤
     */
    assignRolesToUser(request: AssignRolesRequest): Promise<void>;

    /**
     * 從使用者撤銷角色
     * 
     * @param request 角色撤銷請求物件，包含使用者 ID 和角色 ID
     * @returns 撤銷結果的 Promise（true 表示成功撤銷，false 表示角色本來就不屬於該使用者）
     * @throws Error 當使用者或角色不存在，或撤銷失敗時拋出錯誤
     */
    removeRoleFromUser(request: RemoveRoleRequest): Promise<boolean>;

    /**
     * 批次撤銷使用者的所有角色
     * 
     * @param userId 使用者 ID
     * @returns 實際撤銷的角色數量的 Promise
     * @throws Error 當使用者不存在或撤銷失敗時拋出錯誤
     */
    removeAllRolesFromUser(userId: number): Promise<number>;

    /**
     * 批次撤銷角色的所有使用者
     * 
     * @param roleId 角色 ID
     * @returns 實際撤銷的使用者數量的 Promise
     * @throws Error 當角色不存在或撤銷失敗時拋出錯誤
     */
    removeAllUsersFromRole(roleId: number): Promise<number>;

    /**
     * 為使用者分配單一角色（便利方法）
     * 
     * @param userId 使用者 ID
     * @param roleId 角色 ID
     * @returns 分配操作完成的 Promise
     * @throws Error 當使用者或角色不存在，或分配失敗時拋出錯誤
     */
    assignRoleToUser(userId: number, roleId: number): Promise<void>;

    /**
     * 批次更新使用者角色（先清除所有角色，再分配新角色）
     * 
     * @param userId 使用者 ID
     * @param roleIds 新的角色 ID 陣列
     * @returns 更新操作完成的 Promise
     * @throws Error 當使用者不存在或更新失敗時拋出錯誤
     */
    updateUserRoles(userId: number, roleIds: number[]): Promise<void>;
}