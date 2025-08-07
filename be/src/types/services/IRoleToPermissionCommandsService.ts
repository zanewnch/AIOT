/**
 * @fileoverview 角色權限關聯命令服務介面
 * 
 * 定義角色與權限關聯命令服務的標準介面，用於角色權限的分配、撤銷等操作。
 * 此介面確保命令服務層的實作具有一致性和可測試性。
 * 遵循 CQRS 模式，只包含寫入操作，所有方法都會修改系統狀態。
 * 
 * 主要功能：
 * - 角色權限關聯的寫入操作定義
 * - 權限分配和撤銷方法
 * - 批次操作方法簽名
 * - 支援快取管理的寫入方法定義
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-08-06
 */

/**
 * 角色權限關聯命令服務介面
 * 
 * 定義角色與權限關聯命令服務的標準方法，包含權限分配、撤銷、
 * 批次操作功能。支援自動快取管理以保持資料一致性。
 * 遵循 CQRS 原則，所有方法都會修改系統狀態。
 */
export interface IRoleToPermissionCommandsService {
    /**
     * 為角色分配權限
     * 
     * 將指定的權限分配給指定的角色。
     * 執行前會驗證角色和權限的存在性，避免重複分配。
     * 操作完成後會自動清除相關快取。
     * 
     * @param roleId 角色 ID
     * @param permissionIds 權限 ID 陣列
     * @returns 分配操作完成的 Promise
     * @throws Error 當角色或權限不存在，或分配失敗時拋出錯誤
     */
    assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<void>;

    /**
     * 從角色撤銷權限
     * 
     * 從指定角色中撤銷指定權限。
     * 執行前會驗證角色和權限的存在性。
     * 操作完成後會自動清除相關快取。
     * 
     * @param roleId 角色 ID
     * @param permissionId 權限 ID
     * @returns 撤銷結果的 Promise（true 表示成功撤銷，false 表示權限本來就不屬於該角色）
     * @throws Error 當角色或權限不存在，或撤銷失敗時拋出錯誤
     */
    removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean>;

    /**
     * 批次撤銷角色的所有權限
     * 
     * 撤銷指定角色的所有權限關聯。
     * 用於角色清理或重新配置權限。
     * 操作完成後會自動清除所有相關快取。
     * 
     * @param roleId 角色 ID
     * @returns 實際撤銷的權限數量的 Promise
     * @throws Error 當角色不存在或撤銷失敗時拋出錯誤
     */
    removeAllPermissionsFromRole(roleId: number): Promise<number>;

    /**
     * 批次撤銷權限的所有角色
     * 
     * 撤銷指定權限與所有角色的關聯。
     * 用於權限清理或權限重新分配。
     * 操作完成後會自動清除所有相關快取。
     * 
     * @param permissionId 權限 ID
     * @returns 實際撤銷的角色數量的 Promise
     * @throws Error 當權限不存在或撤銷失敗時拋出錯誤
     */
    removeAllRolesFromPermission(permissionId: number): Promise<number>;
}