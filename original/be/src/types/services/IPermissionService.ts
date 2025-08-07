/**
 * @fileoverview 權限服務介面定義
 * 
 * 定義權限服務的標準介面，遵循依賴倒置原則。
 * 控制器依賴此介面而非具體實現，提高代碼的可測試性和可維護性。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * 使用者權限資料結構
 */
export interface UserPermissions {
    userId: number;
    username: string;
    permissions: string[];
    roles: string[];
    lastUpdated: number;
}

/**
 * 快取選項
 */
export interface CacheOptions {
    ttl?: number; // 快取存活時間（秒），預設 3600 秒（1 小時）
    forceRefresh?: boolean; // 是否強制重新整理快取
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
 * 建立權限請求物件
 */
export interface CreatePermissionRequest {
    name: string;
    description?: string;
}

/**
 * 更新權限請求物件
 */
export interface UpdatePermissionRequest {
    name?: string;
    description?: string;
}

/**
 * 權限服務介面
 * 
 * 定義權限管理和檢查的標準操作介面
 * 
 * @interface IPermissionService
 */
export interface IPermissionService {
    /**
     * 取得使用者權限資料（支援快取機制）
     * 
     * @param userId 使用者 ID
     * @param options 快取選項
     * @returns 使用者權限資料或 null
     */
    getUserPermissions(userId: number, options?: CacheOptions): Promise<UserPermissions | null>;

    /**
     * 檢查使用者是否具有特定權限
     * 
     * @param userId 使用者 ID
     * @param permission 權限名稱
     * @param options 快取選項
     * @returns 是否具有權限
     */
    userHasPermission(userId: number, permission: string, options?: CacheOptions): Promise<boolean>;

    /**
     * 檢查使用者是否具有任一指定權限（OR 邏輯）
     * 
     * @param userId 使用者 ID
     * @param permissions 權限名稱陣列
     * @param options 快取選項
     * @returns 是否具有任一權限
     */
    userHasAnyPermission(userId: number, permissions: string[], options?: CacheOptions): Promise<boolean>;

    /**
     * 檢查使用者是否具有所有指定權限（AND 邏輯）
     * 
     * @param userId 使用者 ID
     * @param permissions 權限名稱陣列
     * @param options 快取選項
     * @returns 是否具有所有權限
     */
    userHasAllPermissions(userId: number, permissions: string[], options?: CacheOptions): Promise<boolean>;

    /**
     * 檢查使用者是否具有指定角色
     * 
     * @param userId 使用者 ID
     * @param roleName 角色名稱
     * @param options 快取選項
     * @returns 是否具有角色
     */
    userHasRole(userId: number, roleName: string, options?: CacheOptions): Promise<boolean>;

    /**
     * 取得使用者權限列表
     * 
     * @param userId 使用者 ID
     * @param options 快取選項
     * @returns 權限名稱陣列
     */
    getUserPermissionsList(userId: number, options?: CacheOptions): Promise<string[]>;

    /**
     * 取得使用者角色列表
     * 
     * @param userId 使用者 ID
     * @param options 快取選項
     * @returns 角色名稱陣列
     */
    getUserRolesList(userId: number, options?: CacheOptions): Promise<string[]>;

    /**
     * 清除使用者權限快取
     * 
     * @param userId 使用者 ID
     */
    clearUserPermissionsCache(userId: number): Promise<void>;

    /**
     * 重新整理使用者權限快取
     * 
     * @param userId 使用者 ID
     * @param options 快取選項
     * @returns 重新整理後的使用者權限資料
     */
    refreshUserPermissionsCache(userId: number, options?: CacheOptions): Promise<UserPermissions | null>;

    /**
     * 批量取得多個使用者的權限資料
     * 
     * @param userIds 使用者 ID 陣列
     * @param options 快取選項
     * @returns 使用者權限資料陣列（某些項目可能為 null）
     */
    getBatchUserPermissions(userIds: number[], options?: CacheOptions): Promise<(UserPermissions | null)[]>;

    /**
     * 檢查權限是否存在
     * 
     * @param permissionName 權限名稱
     * @returns 權限是否存在
     */
    permissionExists(permissionName: string): Promise<boolean>;

    /**
     * 取得所有權限資料
     * 
     * @returns 權限資料陣列
     */
    getAllPermissions(): Promise<PermissionDTO[]>;

    /**
     * 根據 ID 取得權限資料
     * 
     * @param permissionId 權限 ID
     * @returns 權限資料或 null
     */
    getPermissionById(permissionId: number): Promise<PermissionDTO | null>;

    /**
     * 建立新權限
     * 
     * @param request 建立權限請求資料
     * @returns 建立的權限資料
     */
    createPermission(request: CreatePermissionRequest): Promise<PermissionDTO>;

    /**
     * 更新權限資料
     * 
     * @param permissionId 權限 ID
     * @param request 更新權限請求資料
     * @returns 更新後的權限資料或 null
     */
    updatePermission(permissionId: number, request: UpdatePermissionRequest): Promise<PermissionDTO | null>;

    /**
     * 刪除權限
     * 
     * @param permissionId 權限 ID
     * @returns 是否刪除成功
     */
    deletePermission(permissionId: number): Promise<boolean>;
}