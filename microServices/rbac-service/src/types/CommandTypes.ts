/**
 * @fileoverview 命令操作相關類型定義
 * 
 * 定義用戶、角色、權限的創建、更新、刪除等命令操作相關的類型介面
 * 遵循 CQRS 模式，專注於寫操作相關的資料結構
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-20
 */

// ======================== 用戶命令相關類型 ========================

/**
 * 創建用戶請求介面
 * 
 * 定義創建新用戶所需的資料結構
 * 
 * @interface CreateUserRequest
 * @example
 * ```typescript
 * const createRequest: CreateUserRequest = {
 *   username: 'newuser',
 *   email: 'newuser@example.com',
 *   password: 'securePassword123'
 * };
 * ```
 */
export interface CreateUserRequest {
    /** 用戶名稱，必須唯一 */
    username: string;
    
    /** 電子郵件地址，必須唯一且符合郵件格式 */
    email: string;
    
    /** 明文密碼，系統會自動加密存儲 */
    password: string;
}

/**
 * 更新用戶請求介面
 * 
 * 定義更新用戶資料所需的資料結構，所有欄位都是可選的
 * 
 * @interface UpdateUserRequest
 * @example
 * ```typescript
 * const updateRequest: UpdateUserRequest = {
 *   email: 'newemail@example.com',
 *   password: 'newPassword456'
 * };
 * ```
 */
export interface UpdateUserRequest {
    /** 新的用戶名稱（可選） */
    username?: string;
    
    /** 新的電子郵件地址（可選） */
    email?: string;
    
    /** 新的明文密碼，系統會自動加密存儲（可選） */
    password?: string;
}

// ======================== 角色命令相關類型 ========================

/**
 * 創建角色請求介面
 * 
 * 定義創建新角色所需的資料結構
 * 
 * @interface CreateRoleRequest
 * @example
 * ```typescript
 * const createRequest: CreateRoleRequest = {
 *   name: 'moderator',
 *   displayName: '版主'
 * };
 * ```
 */
export interface CreateRoleRequest {
    /** 角色名稱，必須唯一 */
    name: string;
    
    /** 角色顯示名稱，用於用戶界面展示（可選） */
    displayName?: string;
}

/**
 * 更新角色請求介面
 * 
 * 定義更新角色資料所需的資料結構，所有欄位都是可選的
 * 
 * @interface UpdateRoleRequest
 * @example
 * ```typescript
 * const updateRequest: UpdateRoleRequest = {
 *   displayName: '超級版主'
 * };
 * ```
 */
export interface UpdateRoleRequest {
    /** 新的角色名稱（可選） */
    name?: string;
    
    /** 新的角色顯示名稱（可選） */
    displayName?: string;
}

// ======================== 關聯關係命令相關類型 ========================

/**
 * 分配角色請求介面
 * 
 * 定義為用戶分配多個角色的請求資料結構
 * 
 * @interface AssignRolesRequest
 * @example
 * ```typescript
 * const assignRequest: AssignRolesRequest = {
 *   userId: 1,
 *   roleIds: [1, 2, 3]
 * };
 * ```
 */
export interface AssignRolesRequest {
    /** 目標用戶 ID */
    userId: number;
    
    /** 要分配的角色 ID 列表 */
    roleIds: number[];
}

/**
 * 移除角色請求介面
 * 
 * 定義從用戶移除單個角色的請求資料結構
 * 
 * @interface RemoveRoleRequest
 * @example
 * ```typescript
 * const removeRequest: RemoveRoleRequest = {
 *   userId: 1,
 *   roleId: 2
 * };
 * ```
 */
export interface RemoveRoleRequest {
    /** 目標用戶 ID */
    userId: number;
    
    /** 要移除的角色 ID */
    roleId: number;
}

// ======================== 服務介面定義 ========================

/**
 * 角色命令服務介面
 * 
 * 定義角色相關寫操作的標準介面
 * 
 * @interface IRoleCommandsService
 * @example
 * ```typescript
 * class RoleCommandsSvc implements IRoleCommandsService {
 *   async createRole(roleData: CreateRoleRequest): Promise<RoleDTO> {
 *     // 實現邏輯
 *   }
 * }
 * ```
 */
export interface IRoleCommandsService {
    /**
     * 創建新角色
     * 
     * @param roleData - 角色創建請求資料
     * @returns Promise<RoleDTO> 創建成功的角色資料
     * @throws {Error} 當角色名稱已存在或創建失敗時
     */
    createRole(roleData: CreateRoleRequest): Promise<import('./RoleTypes').RoleDTO>;
    
    /**
     * 更新角色資料
     * 
     * @param roleId - 角色 ID
     * @param updateData - 角色更新請求資料
     * @returns Promise<RoleDTO | null> 更新後的角色資料或 null（如果不存在）
     * @throws {Error} 當角色不存在或更新失敗時
     */
    updateRole(roleId: number, updateData: UpdateRoleRequest): Promise<import('./RoleTypes').RoleDTO | null>;
    
    /**
     * 刪除角色
     * 
     * @param roleId - 角色 ID
     * @returns Promise<boolean> 是否刪除成功
     * @throws {Error} 當角色不存在或刪除失敗時
     */
    deleteRole(roleId: number): Promise<boolean>;
}

/**
 * 角色權限關聯命令服務介面
 * 
 * 定義角色權限關聯相關寫操作的標準介面
 * 
 * @interface IRoleToPermissionCommandsService
 * @example
 * ```typescript
 * class RoleToPermissionCommandsSvc implements IRoleToPermissionCommandsService {
 *   async assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<void> {
 *     // 實現邏輯
 *   }
 * }
 * ```
 */
export interface IRoleToPermissionCommandsService {
    /**
     * 為角色分配多個權限
     * 
     * @param roleId - 角色 ID
     * @param permissionIds - 權限 ID 列表
     * @returns Promise<void>
     * @throws {Error} 當角色或權限不存在或分配失敗時
     */
    assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<void>;
    
    /**
     * 從角色移除特定權限
     * 
     * @param roleId - 角色 ID
     * @param permissionId - 權限 ID
     * @returns Promise<boolean> 是否移除成功
     * @throws {Error} 當角色或權限不存在或移除失敗時
     */
    removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean>;
    
    /**
     * 移除角色的所有權限
     * 
     * @param roleId - 角色 ID
     * @returns Promise<number> 移除的權限數量
     * @throws {Error} 當角色不存在或移除失敗時
     */
    removeAllPermissionsFromRole(roleId: number): Promise<number>;
    
    /**
     * 從所有角色中移除特定權限
     * 
     * @param permissionId - 權限 ID
     * @returns Promise<number> 移除的關聯記錄數量
     * @throws {Error} 當權限不存在或移除失敗時
     */
    removeAllRolesFromPermission(permissionId: number): Promise<number>;
}