/**
 * @fileoverview 角色權限關聯服務介面
 * 
 * 定義角色與權限關聯管理服務的標準介面，用於角色權限的分配、撤銷、查詢等操作。
 * 此介面確保服務層的實作具有一致性和可測試性。
 * 
 * 主要功能：
 * - 角色權限關聯的完整管理操作定義
 * - 權限查詢和驗證方法
 * - 批次操作方法簽名
 * - 支援快取機制的方法定義
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
 */

/**
 * 角色權限資料傳輸物件
 */
export interface RolePermissionDTO {
    roleId: number;
    permissionId: number;
    assignedAt: string;
    role?: {
        id: number;
        name: string;
        displayName?: string;
    };
    permission?: {
        id: number;
        name: string;
        description?: string;
    };
}

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
 * 角色權限關聯服務介面
 * 
 * 定義角色與權限關聯管理服務的標準方法，包含權限分配、撤銷、
 * 查詢功能和批次操作。支援快取機制以提升效能。
 */
export interface IRoleToPermissionService {
    /**
     * 取得角色的所有權限
     * 
     * @param roleId 角色 ID
     * @returns 權限 DTO 陣列的 Promise
     * @throws Error 當角色不存在或操作失敗時拋出錯誤
     */
    getRolePermissions(roleId: number): Promise<PermissionDTO[]>;

    /**
     * 為角色分配權限
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
     * @param roleId 角色 ID
     * @param permissionId 權限 ID
     * @returns 撤銷結果的 Promise（true 表示成功撤銷，false 表示權限本來就不屬於該角色）
     * @throws Error 當角色或權限不存在，或撤銷失敗時拋出錯誤
     */
    removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean>;

    /**
     * 檢查角色是否具有特定權限
     * 
     * @param roleId 角色 ID
     * @param permissionId 權限 ID
     * @returns 權限檢查結果的 Promise（true 表示具有權限，false 表示沒有權限）
     */
    roleHasPermission(roleId: number, permissionId: number): Promise<boolean>;

    /**
     * 取得權限的所有角色
     * 
     * @param permissionId 權限 ID
     * @returns 角色 DTO 陣列的 Promise
     * @throws Error 當權限不存在或操作失敗時拋出錯誤
     */
    getPermissionRoles(permissionId: number): Promise<RoleDTO[]>;

    /**
     * 批次撤銷角色的所有權限
     * 
     * @param roleId 角色 ID
     * @returns 實際撤銷的權限數量的 Promise
     * @throws Error 當角色不存在或撤銷失敗時拋出錯誤
     */
    removeAllPermissionsFromRole(roleId: number): Promise<number>;

    /**
     * 批次撤銷權限的所有角色
     * 
     * @param permissionId 權限 ID
     * @returns 實際撤銷的角色數量的 Promise
     * @throws Error 當權限不存在或撤銷失敗時拋出錯誤
     */
    removeAllRolesFromPermission(permissionId: number): Promise<number>;

    /**
     * 取得所有角色權限關聯數據
     * 
     * 回傳包含角色信息和權限信息的完整關聯對象列表，
     * 用於前端顯示所有角色權限關聯關係。
     * 
     * @returns 角色權限關聯 DTO 陣列的 Promise
     * @throws Error 當操作失敗時拋出錯誤
     */
    getAllRolePermissions(): Promise<RolePermissionDTO[]>;
}