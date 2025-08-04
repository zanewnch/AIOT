/**
 * @fileoverview 使用者角色關聯服務介面
 * 
 * 定義使用者與角色關聯管理服務的標準介面，用於使用者角色的分配、撤銷、查詢等操作。
 * 此介面確保服務層的實作具有一致性和可測試性。
 * 
 * 主要功能：
 * - 使用者角色關聯的完整管理操作定義
 * - 角色查詢和驗證方法
 * - 批次操作方法簽名
 * - 支援快取機制的方法定義
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
 */

/**
 * 使用者角色資料傳輸物件
 */
export interface UserRoleDTO {
    userId: number;
    roleId: number;
    assignedAt: Date;
    user?: {
        id: number;
        username: string;
        email: string;
    };
    role?: {
        id: number;
        name: string;
        displayName?: string;
    };
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
 * 使用者角色關聯服務介面
 * 
 * 定義使用者與角色關聯管理服務的標準方法，包含角色分配、撤銷、
 * 查詢功能和批次操作。支援快取機制以提升效能。
 */
export interface IUserToRoleService {
    /**
     * 取得使用者的所有角色
     * 
     * @param userId 使用者 ID
     * @returns 角色 DTO 陣列的 Promise
     * @throws Error 當使用者不存在或操作失敗時拋出錯誤
     */
    getUserRoles(userId: number): Promise<RoleDTO[]>;

    /**
     * 為使用者分配角色
     * 
     * @param userId 使用者 ID
     * @param roleIds 角色 ID 陣列
     * @returns 分配操作完成的 Promise
     * @throws Error 當使用者或角色不存在，或分配失敗時拋出錯誤
     */
    assignRolesToUser(userId: number, roleIds: number[]): Promise<void>;

    /**
     * 從使用者撤銷角色
     * 
     * @param userId 使用者 ID
     * @param roleId 角色 ID
     * @returns 撤銷結果的 Promise（true 表示成功撤銷，false 表示角色本來就不屬於該使用者）
     * @throws Error 當使用者或角色不存在，或撤銷失敗時拋出錯誤
     */
    removeRoleFromUser(userId: number, roleId: number): Promise<boolean>;

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
     * 取得所有使用者角色關聯數據
     * 
     * 回傳包含使用者信息和角色信息的完整關聯對象列表，
     * 用於前端顯示所有使用者角色關聯關係。
     * 
     * @returns 使用者角色關聯 DTO 陣列的 Promise
     * @throws Error 當操作失敗時拋出錯誤
     */
    getAllUserRoles(): Promise<UserRoleDTO[]>;
}