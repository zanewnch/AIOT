/**
 * @fileoverview 角色相關類型定義
 * 
 * 定義角色查詢、更新、創建等操作相關的類型介面
 * 包括 DTO、服務介面、快取選項等
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-20
 */

import { PaginationParams, PaginatedResult } from './PaginationTypes.js';

/**
 * 角色資料傳輸物件
 * 
 * 用於在不同層之間傳遞角色資料的標準化格式
 * 
 * @interface RoleDTO
 * @example
 * ```typescript
 * const role: RoleDTO = {
 *   id: 1,
 *   name: 'admin',
 *   displayName: '系統管理員',
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 */
export interface RoleDTO {
    /** 角色唯一識別符 */
    id: number;
    
    /** 角色名稱（系統內部使用） */
    name: string;
    
    /** 角色顯示名稱（用戶界面顯示） */
    displayName?: string;
    
    /** 角色創建時間 */
    createdAt: Date;
    
    /** 角色最後更新時間 */
    updatedAt: Date;
}

/**
 * 快取選項介面
 * 
 * 定義角色查詢時的快取控制選項
 * 
 * @interface CacheOptions
 * @example
 * ```typescript
 * const cacheOptions: CacheOptions = {
 *   forceRefresh: true,
 *   ttl: 3600 // 1小時
 * };
 * ```
 */
export interface CacheOptions {
    /** 是否強制刷新快取，預設為 false */
    forceRefresh?: boolean;
    
    /** 快取存活時間（秒），預設使用系統設定 */
    ttl?: number;
}

/**
 * 角色查詢服務介面
 * 
 * 定義角色查詢相關操作的標準介面
 * 所有角色查詢服務都應該實現此介面
 * 
 * @interface IRoleQueriesSvc
 * @example
 * ```typescript
 * class RoleQueriesService implements IRoleQueriesService {
 *   async getRolesPaginated(params: PaginationParams): Promise<PaginatedResult<RoleDTO>> {
 *     // 實現邏輯
 *   }
 * }
 * ```
 */
export interface IRoleQueriesSvc {
    /**
     * 根據角色 ID 獲取角色（分頁格式）
     * 
     * @param roleId - 角色 ID
     * @param page - 頁碼，預設為 1
     * @param pageSize - 每頁數量，預設為 1
     * @returns Promise<PaginatedResult<RoleDTO>> 分頁角色結果
     * @throws {Error} 當角色 ID 無效或資料庫查詢失敗時
     */
    getRoleById(roleId: number, page?: number, pageSize?: number): Promise<PaginatedResult<RoleDTO>>;
    
    /**
     * 根據角色名稱獲取角色（分頁格式）
     * 
     * @param roleName - 角色名稱
     * @param page - 頁碼，預設為 1
     * @param pageSize - 每頁數量，預設為 1
     * @returns Promise<PaginatedResult<RoleDTO>> 分頁角色結果
     * @throws {Error} 當角色名稱無效或資料庫查詢失敗時
     */
    getRoleByName(roleName: string, page?: number, pageSize?: number): Promise<PaginatedResult<RoleDTO>>;
    
    /**
     * 檢查角色是否存在
     * 
     * @param roleName - 角色名稱
     * @returns Promise<boolean> 角色是否存在
     * @throws {Error} 當資料庫查詢失敗時
     */
    roleExists(roleName: string): Promise<boolean>;
    
    /**
     * 獲取所有角色列表（支持分頁）
     * 
     * @param params - 分頁參數，默認 page=1, pageSize=20
     * @returns Promise<PaginatedResult<RoleDTO>> 分頁角色結果
     * @throws {Error} 當資料庫查詢失敗時
     */
    getAllRoles(params?: PaginationParams): Promise<PaginatedResult<RoleDTO>>;
}