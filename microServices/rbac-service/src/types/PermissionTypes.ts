/**
 * @fileoverview 權限相關類型定義
 * 
 * 定義權限查詢、更新、創建等操作相關的類型介面
 * 包括 DTO、服務介面、關聯關係等
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-20
 */

/**
 * 權限資料傳輸物件
 * 
 * 用於在不同層之間傳遞權限資料的標準化格式
 * 
 * @interface PermissionDTO
 * @example
 * ```typescript
 * const permission: PermissionDTO = {
 *   id: 1,
 *   name: 'user:read',
 *   description: '查看用戶信息',
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 */
export interface PermissionDTO {
    /** 權限唯一識別符 */
    id: number;
    
    /** 權限名稱（系統內部使用，通常使用命名空間格式如 user:read） */
    name: string;
    
    /** 權限描述（用戶界面顯示） */
    description?: string;
    
    /** 權限創建時間 */
    createdAt: Date;
    
    /** 權限最後更新時間 */
    updatedAt: Date;
}

/**
 * 角色-權限關聯資料傳輸物件
 * 
 * 用於表示角色與權限之間的關聯關係
 * 
 * @interface RolePermissionAssignmentDTO
 * @example
 * ```typescript
 * const assignment: RolePermissionAssignmentDTO = {
 *   id: 'role_1_permission_5',
 *   roleId: 1,
 *   permissionId: 5,
 *   assignedAt: '2025-08-20T10:00:00Z'
 * };
 * ```
 */
export interface RolePermissionAssignmentDTO {
    /** 關聯記錄唯一識別符，通常為複合ID */
    id: string;
    
    /** 角色 ID */
    roleId: number;
    
    /** 權限 ID */
    permissionId: number;
    
    /** 關聯建立時間（ISO 字符串格式） */
    assignedAt: string;
}

/**
 * 角色-權限查詢服務介面
 * 
 * 定義角色權限關聯查詢相關操作的標準介面
 * 處理角色和權限之間的多對多關係查詢
 * 
 * @interface IRoleToPermissionQueriesService
 * @example
 * ```typescript
 * class RoleToPermissionQueriesSvc implements IRoleToPermissionQueriesService {
 *   async getRolePermissions(roleId: number): Promise<PermissionDTO[]> {
 *     // 實現邏輯
 *   }
 * }
 * ```
 */
export interface IRoleToPermissionQueriesService {
    /**
     * 獲取角色的所有權限
     * 
     * @param roleId - 角色 ID
     * @returns Promise<PermissionDTO[]> 角色擁有的權限列表
     * @throws {Error} 當角色不存在或資料庫查詢失敗時
     */
    getRolePermissions(roleId: number): Promise<PermissionDTO[]>;
    
    /**
     * 檢查角色是否擁有特定權限
     * 
     * @param roleId - 角色 ID
     * @param permissionId - 權限 ID
     * @returns Promise<boolean> 角色是否擁有該權限
     * @throws {Error} 當角色或權限不存在或資料庫查詢失敗時
     */
    roleHasPermission(roleId: number, permissionId: number): Promise<boolean>;
    
    /**
     * 獲取擁有特定權限的所有角色
     * 
     * @param permissionId - 權限 ID
     * @returns Promise<RoleDTO[]> 擁有該權限的角色列表
     * @throws {Error} 當權限不存在或資料庫查詢失敗時
     */
    getPermissionRoles(permissionId: number): Promise<import('./RoleTypes').RoleDTO[]>;
    
    /**
     * 獲取所有角色-權限關聯記錄（支持分頁）
     * 
     * @param params - 分頁參數，默認 page=1, pageSize=20
     * @returns Promise<PaginatedResult<RolePermissionAssignmentDTO>> 分頁的角色權限關聯記錄
     * @throws {Error} 當資料庫查詢失敗時
     */
    getAllRolePermissions(params?: import('./PaginationTypes').PaginationParams): Promise<import('./PaginationTypes').PaginatedResult<RolePermissionAssignmentDTO>>;
}