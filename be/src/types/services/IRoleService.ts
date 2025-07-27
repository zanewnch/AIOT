/**
 * @fileoverview 角色服務介面
 * 
 * 定義角色管理服務的標準介面，用於角色 CRUD 操作和快取管理。
 * 此介面確保服務層的實作具有一致性和可測試性。
 * 
 * 主要功能：
 * - 角色的完整 CRUD 操作定義
 * - 角色查詢和驗證方法
 * - 支援快取機制的方法簽名
 * - 資料傳輸物件的標準化
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
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
 * 建立角色請求物件
 */
export interface CreateRoleRequest {
    name: string;
    displayName?: string;
}

/**
 * 更新角色請求物件
 */
export interface UpdateRoleRequest {
    name?: string;
    displayName?: string;
}

/**
 * 角色服務介面
 * 
 * 定義角色管理服務的標準方法，包含完整的 CRUD 操作、
 * 查詢功能和存在性檢查。支援快取機制以提升效能。
 */
export interface IRoleService {
    /**
     * 取得所有角色列表
     * 
     * @returns 角色 DTO 陣列的 Promise
     * @throws Error 當操作失敗時拋出錯誤
     */
    getAllRoles(): Promise<RoleDTO[]>;

    /**
     * 根據 ID 取得角色
     * 
     * @param roleId 角色 ID
     * @returns 角色 DTO 的 Promise，若未找到則回傳 null
     * @throws Error 當操作失敗時拋出錯誤
     */
    getRoleById(roleId: number): Promise<RoleDTO | null>;

    /**
     * 建立新角色
     * 
     * @param roleData 角色建立請求資料
     * @returns 新建立的角色 DTO 的 Promise
     * @throws Error 當角色名稱已存在或建立失敗時拋出錯誤
     */
    createRole(roleData: CreateRoleRequest): Promise<RoleDTO>;

    /**
     * 更新角色
     * 
     * @param roleId 角色 ID
     * @param updateData 更新資料
     * @returns 更新後的角色 DTO 的 Promise，若角色不存在則回傳 null
     * @throws Error 當操作失敗時拋出錯誤
     */
    updateRole(roleId: number, updateData: UpdateRoleRequest): Promise<RoleDTO | null>;

    /**
     * 刪除角色
     * 
     * @param roleId 角色 ID
     * @returns 刪除結果的 Promise（true 表示成功，false 表示角色不存在）
     * @throws Error 當操作失敗時拋出錯誤
     */
    deleteRole(roleId: number): Promise<boolean>;

    /**
     * 根據名稱查找角色
     * 
     * @param roleName 角色名稱
     * @returns 角色 DTO 的 Promise，若未找到則回傳 null
     * @throws Error 當操作失敗時拋出錯誤
     */
    getRoleByName(roleName: string): Promise<RoleDTO | null>;

    /**
     * 檢查角色是否存在
     * 
     * @param roleName 角色名稱
     * @returns 存在性檢查結果的 Promise（true 表示存在，false 表示不存在）
     */
    roleExists(roleName: string): Promise<boolean>;
}