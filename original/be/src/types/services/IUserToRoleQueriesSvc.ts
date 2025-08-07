/**
 * @fileoverview 使用者角色關聯查詢服務介面
 * 
 * 定義使用者與角色關聯查詢服務的標準介面，專注於所有讀取操作。
 * 此介面確保查詢服務層的實作具有一致性和可測試性。
 * 遵循 CQRS 模式，只包含查詢操作，不包含任何寫入邏輯。
 * 
 * 主要功能：
 * - 使用者角色關聯查詢方法定義
 * - 角色和使用者存在性驗證方法
 * - 支援快取機制的方法定義
 * - 資料轉換和驗證方法簽名
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-08-06
 */

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
 * 使用者資料傳輸物件
 */
export interface UserDTO {
    id: number;
    username: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 使用者角色關聯基本資料傳輸物件
 */
export interface UserRoleBasicDTO {
    id: string;
    userId: number;
    roleId: number;
    assignedAt: string;
}

/**
 * 快取選項介面
 */
export interface CacheOptions {
    /**
     * 是否刷新快取（強制從資料庫重新載入）
     */
    refreshCache?: boolean;
}

/**
 * 使用者角色關聯查詢服務介面
 * 
 * 定義使用者與角色關聯查詢服務的標準方法，只包含讀取操作。
 * 支援快取機制以提升查詢效能。
 */
export interface IUserToRoleQueriesSvc {
    /**
     * 檢查使用者是否存在
     * 
     * @param userId 使用者 ID
     * @returns 使用者是否存在的 Promise
     */
    userExists(userId: number): Promise<boolean>;

    /**
     * 檢查角色是否存在
     * 
     * @param roleId 角色 ID
     * @returns 角色是否存在的 Promise
     */
    roleExists(roleId: number): Promise<boolean>;

    /**
     * 取得使用者的所有角色
     * 
     * @param userId 使用者 ID
     * @param options 快取選項（可選）
     * @returns 角色 DTO 陣列的 Promise
     * @throws Error 當使用者不存在或操作失敗時拋出錯誤
     */
    getUserRoles(userId: number, options?: CacheOptions): Promise<RoleDTO[]>;

    /**
     * 檢查使用者是否具有特定角色
     * 
     * @param userId 使用者 ID
     * @param roleId 角色 ID
     * @returns 角色檢查結果的 Promise（true 表示具有角色，false 表示沒有角色）
     */
    userHasRole(userId: number, roleId: number): Promise<boolean>;

    /**
     * 取得角色的所有使用者
     * 
     * @param roleId 角色 ID
     * @returns 使用者 DTO 陣列的 Promise
     * @throws Error 當角色不存在或操作失敗時拋出錯誤
     */
    getRoleUsers(roleId: number): Promise<UserDTO[]>;

    /**
     * 取得所有使用者角色關聯數據
     * 
     * 回傳包含基本關聯信息的完整關聯對象列表，
     * 用於前端顯示所有使用者角色關聯關係。
     * 
     * @returns 使用者角色關聯基本 DTO 陣列的 Promise
     * @throws Error 當操作失敗時拋出錯誤
     */
    getAllUserRoles(): Promise<UserRoleBasicDTO[]>;

    /**
     * 根據使用者和角色 ID 查詢使用者角色關聯
     * 
     * @param userId 使用者 ID
     * @param roleId 角色 ID
     * @returns 使用者角色關聯是否存在的 Promise
     */
    findUserRoleAssociation(userId: number, roleId: number): Promise<boolean>;
}