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
 * @interface IRoleToPermissionQueriesSvc
 * @example
 * ```typescript
 * class RoleToPermissionQueriesService implements IRoleToPermissionQueriesService {
 *   async getRolePermissions(roleId: number): Promise<PermissionDTO[]> {
 *     // 實現邏輯
 *   }
 * }
 * ```
 */
export interface IRoleToPermissionQueriesSvc {
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

// ======================== 權限命令操作類型 ========================

/**
 * 創建權限請求介面
 * 
 * 定義創建新權限所需的資料結構
 * 
 * @interface CreatePermissionRequest
 * @example
 * ```typescript
 * const createRequest: CreatePermissionRequest = {
 *   name: 'user:read',
 *   description: '查看用戶信息'
 * };
 * ```
 */
export interface CreatePermissionRequest {
    /** 權限名稱，必須唯一，建議使用命名空間格式（如 user:read） */
    name: string;
    
    /** 權限描述，用於用戶界面顯示（可選） */
    description?: string;
}

/**
 * 更新權限請求介面
 * 
 * 定義更新權限資料所需的資料結構，所有欄位都是可選的
 * 
 * @interface UpdatePermissionRequest
 * @example
 * ```typescript
 * const updateRequest: UpdatePermissionRequest = {
 *   description: '更新後的權限描述'
 * };
 * ```
 */
export interface UpdatePermissionRequest {
    /** 新的權限名稱（可選） */
    name?: string;
    
    /** 新的權限描述（可選） */
    description?: string;
}

/**
 * 權限命令服務介面
 * 
 * 定義權限相關寫操作的標準介面
 * 
 * @interface IPermissionCommandsSvc
 * @example
 * ```typescript
 * class PermissionCommandsService implements IPermissionCommandsService {
 *   async createPermission(permissionData: CreatePermissionRequest): Promise<PermissionDTO> {
 *     // 實現邏輯
 *   }
 * }
 * ```
 */
export interface IPermissionCommandsSvc {
    /**
     * 創建新權限
     * 
     * @param permissionData - 權限創建請求資料
     * @returns Promise<PermissionDTO> 創建成功的權限資料
     * @throws {Error} 當權限名稱已存在或創建失敗時
     */
    createPermission(permissionData: CreatePermissionRequest): Promise<PermissionDTO>;
    
    /**
     * 更新權限資料
     * 
     * @param permissionId - 權限 ID
     * @param updateData - 權限更新請求資料
     * @returns Promise<PermissionDTO | null> 更新後的權限資料或 null（如果不存在）
     * @throws {Error} 當權限不存在或更新失敗時
     */
    updatePermission(permissionId: number, updateData: UpdatePermissionRequest): Promise<PermissionDTO | null>;
    
    /**
     * 刪除權限
     * 
     * @param permissionId - 權限 ID
     * @returns Promise<boolean> 是否刪除成功
     * @throws {Error} 當權限不存在或刪除失敗時
     */
    deletePermission(permissionId: number): Promise<boolean>;
}

// ======================== 用戶權限相關類型 ========================

/**
 * 用戶權限資料傳輸物件
 * 
 * 用於表示用戶擁有的權限和角色信息的完整資料結構
 * 
 * @interface UserPermissions
 * @example
 * ```typescript
 * const userPermissions: UserPermissions = {
 *   userId: 1,
 *   username: 'admin',
 *   permissions: ['user:read', 'user:write', 'role:manage'],
 *   roles: ['admin', 'moderator'],
 *   lastUpdated: 1692518400000
 * };
 * ```
 */
export interface UserPermissions {
    /** 用戶 ID */
    userId: number;
    
    /** 用戶名稱 */
    username: string;
    
    /** 用戶擁有的權限名稱列表 */
    permissions: string[];
    
    /** 用戶擁有的角色名稱列表 */
    roles: string[];
    
    /** 最後更新時間戳 */
    lastUpdated: number;
}

/**
 * 快取選項介面
 * 
 * 定義快取相關操作的配置選項
 * 
 * @interface CacheOptions
 * @example
 * ```typescript
 * const options: CacheOptions = {
 *   ttl: 3600,        // 1小時
 *   forceRefresh: true // 強制刷新
 * };
 * ```
 */
export interface CacheOptions {
    /** 快取存活時間（秒），可選 */
    ttl?: number;
    
    /** 是否強制刷新快取，忽略現有快取，可選 */
    forceRefresh?: boolean;
}

/**
 * 權限查詢服務介面
 * 
 * 定義權限相關查詢操作的標準介面
 * 
 * @interface IPermissionQueriesSvc
 * @example
 * ```typescript
 * class PermissionQueriesService implements IPermissionQueriesService {
 *   async getUserPermissions(userId: number, options?: CacheOptions): Promise<UserPermissions | null> {
 *     // 實現邏輯
 *   }
 * }
 * ```
 */
export interface IPermissionQueriesSvc {
    /**
     * 獲取用戶的所有權限和角色信息
     * 
     * @param userId - 用戶 ID
     * @param options - 快取選項，可選
     * @returns Promise<UserPermissions | null> 用戶權限信息或 null（如果不存在）
     * @throws {Error} 當用戶不存在或查詢失敗時
     */
    getUserPermissions(userId: number, options?: CacheOptions): Promise<UserPermissions | null>;
    
    /**
     * 檢查用戶是否擁有特定權限
     * 
     * @param userId - 用戶 ID
     * @param permission - 權限名稱
     * @param options - 快取選項，可選
     * @returns Promise<boolean> 用戶是否擁有該權限
     * @throws {Error} 當用戶不存在或查詢失敗時
     */
    hasPermission(userId: number, permission: string, options?: CacheOptions): Promise<boolean>;
}