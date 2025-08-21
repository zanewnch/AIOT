/**
 * @fileoverview 關聯關係相關類型定義
 * 
 * 定義用戶-角色、角色-權限等多對多關聯關係的類型介面
 * 包括基本關聯資料、查詢結果等
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-20
 */

/**
 * 用戶角色基本關聯資料傳輸物件
 * 
 * 定義用戶與角色之間關聯關係的基本資料結構
 * 
 * @interface UserRoleBasicDTO
 * @example
 * ```typescript
 * const userRole: UserRoleBasicDTO = {
 *   id: 'user_1_role_2',
 *   userId: 1,
 *   roleId: 2,
 *   assignedAt: '2025-08-20T10:00:00Z'
 * };
 * ```
 */
export interface UserRoleBasicDTO {
    /** 關聯記錄唯一識別符，通常為複合ID */
    id: string;
    
    /** 用戶 ID */
    userId: number;
    
    /** 角色 ID */
    roleId: number;
    
    /** 關聯建立時間（ISO 字符串格式） */
    assignedAt: string;
}

/**
 * 用戶角色關聯快取選項介面
 * 
 * 定義用戶角色查詢時的快取控制選項
 * 與其他快取選項略有不同，使用 refreshCache 命名
 * 
 * @interface UserRoleCacheOptions
 * @example
 * ```typescript
 * const cacheOptions: UserRoleCacheOptions = {
 *   refreshCache: true
 * };
 * ```
 */
export interface UserRoleCacheOptions {
    /** 是否刷新快取（強制從資料庫重新載入） */
    refreshCache?: boolean;
}

/**
 * 用戶角色查詢服務介面
 * 
 * 定義用戶角色關聯查詢相關操作的標準介面
 * 處理用戶和角色之間的多對多關係查詢
 * 
 * @interface IUserToRoleQueriesService
 * @example
 * ```typescript
 * class UserToRoleQueriesSvc implements IUserToRoleQueriesService {
 *   async getUserRoles(userId: number): Promise<RoleDTO[]> {
 *     // 實現邏輯
 *   }
 * }
 * ```
 */
export interface IUserToRoleQueriesService {
    /**
     * 獲取用戶的所有角色
     * 
     * @param userId - 用戶 ID
     * @param options - 快取選項（可選）
     * @returns Promise<RoleDTO[]> 用戶擁有的角色列表
     * @throws {Error} 當用戶不存在或資料庫查詢失敗時
     */
    getUserRoles(userId: number, options?: UserRoleCacheOptions): Promise<import('./RoleTypes').RoleDTO[]>;
    
    /**
     * 獲取角色的所有用戶
     * 
     * @param roleId - 角色 ID
     * @param options - 快取選項（可選）
     * @returns Promise<UserDTO[]> 擁有該角色的用戶列表
     * @throws {Error} 當角色不存在或資料庫查詢失敗時
     */
    getRoleUsers(roleId: number, options?: UserRoleCacheOptions): Promise<import('./UserTypes').UserDTO[]>;
    
    /**
     * 檢查用戶是否擁有特定角色
     * 
     * @param userId - 用戶 ID
     * @param roleId - 角色 ID
     * @returns Promise<boolean> 用戶是否擁有該角色
     * @throws {Error} 當用戶或角色不存在或資料庫查詢失敗時
     */
    userHasRole(userId: number, roleId: number): Promise<boolean>;
    
    /**
     * 分頁獲取用戶角色關聯記錄
     * 
     * @param params - 分頁參數
     * @returns Promise<PaginatedResult<UserRoleBasicDTO>> 分頁的用戶角色關聯記錄
     * @throws {Error} 當資料庫查詢失敗時
     */
    getUserRolesPaginated(params: import('./PaginationTypes').PaginationParams): Promise<import('./PaginationTypes').PaginatedResult<UserRoleBasicDTO>>;
    
    /**
     * 獲取用戶在系統中的所有權限（通過角色間接獲得）
     * 
     * @param userId - 用戶 ID
     * @param options - 快取選項（可選）
     * @returns Promise<PermissionDTO[]> 用戶通過角色獲得的所有權限
     * @throws {Error} 當用戶不存在或資料庫查詢失敗時
     */
    getUserPermissions(userId: number, options?: UserRoleCacheOptions): Promise<import('./PermissionTypes').PermissionDTO[]>;
    
    /**
     * 檢查用戶是否擁有特定權限（通過角色間接檢查）
     * 
     * @param userId - 用戶 ID
     * @param permissionName - 權限名稱
     * @param options - 快取選項（可選）
     * @returns Promise<boolean> 用戶是否擁有該權限
     * @throws {Error} 當用戶不存在或資料庫查詢失敗時
     */
    userHasPermission(userId: number, permissionName: string, options?: UserRoleCacheOptions): Promise<boolean>;
}