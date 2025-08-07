/**
 * @fileoverview 角色權限關聯查詢服務介面
 * 
 * 定義角色與權限關聯查詢服務的標準介面，用於角色權限的查詢、檢查等操作。
 * 此介面確保查詢服務層的實作具有一致性和可測試性。
 * 遵循 CQRS 模式，只包含查詢操作，不包含任何寫入方法。
 * 
 * 主要功能：
 * - 角色權限關聯的查詢操作定義
 * - 權限檢查和驗證方法
 * - 支援快取機制的查詢方法定義
 * - 只讀操作，不修改系統狀態
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-08-06
 */

/**
 * 權限資料傳輸物件
 */
export interface PermissionDTO {
    id: number;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 角色資料傳輸物件
 */
export interface RoleDTO {
    id: number;
    name: string;
    displayName?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 角色權限關聯查詢服務介面
 * 
 * 定義角色與權限關聯查詢服務的標準方法，包含權限查詢、
 * 檢查功能。支援快取機制以提升效能。
 * 遵循 CQRS 原則，所有方法都是唯讀操作。
 */
export interface IRoleToPermissionQueriesService {
    /**
     * 取得角色的所有權限
     * 
     * 從快取或資料庫中取得指定角色擁有的所有權限。
     * 優先使用 Redis 快取，若快取未命中則查詢資料庫並更新快取。
     * 
     * @param roleId 角色 ID
     * @returns 權限 DTO 陣列的 Promise
     * @throws Error 當角色不存在或操作失敗時拋出錯誤
     */
    getRolePermissions(roleId: number): Promise<PermissionDTO[]>;

    /**
     * 檢查角色是否具有特定權限
     * 
     * 查詢資料庫確認指定角色是否具有指定權限。
     * 此方法用於權限驗證和存取控制。
     * 
     * @param roleId 角色 ID
     * @param permissionId 權限 ID
     * @returns 權限檢查結果的 Promise（true 表示具有權限，false 表示沒有權限）
     */
    roleHasPermission(roleId: number, permissionId: number): Promise<boolean>;

    /**
     * 取得權限的所有角色
     * 
     * 查詢擁有指定權限的所有角色。
     * 用於瞭解特定權限的分配情況。
     * 
     * @param permissionId 權限 ID
     * @returns 角色 DTO 陣列的 Promise
     * @throws Error 當權限不存在或操作失敗時拋出錯誤
     */
    getPermissionRoles(permissionId: number): Promise<RoleDTO[]>;

    /**
     * 取得所有角色權限關聯數據
     * 
     * 回傳包含基本關聯信息的完整關聯對象列表，
     * 用於前端顯示所有角色權限關聯關係。
     * 只包含基本的關聯資訊，避免 Sequelize 模型關聯錯誤。
     * 
     * @returns 簡化的角色權限關聯 DTO 陣列的 Promise
     * @throws Error 當操作失敗時拋出錯誤
     */
    getAllRolePermissions(): Promise<Array<{
        id: string,
        roleId: number,
        permissionId: number,
        assignedAt: string
    }>>;
}