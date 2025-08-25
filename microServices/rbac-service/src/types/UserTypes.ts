/**
 * @fileoverview 用戶相關類型定義
 * 
 * 定義用戶查詢、更新、創建等操作相關的類型介面
 * 包括 DTO、服務介面、快取選項等
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-20
 */

import { PaginationParams, PaginatedResult } from './PaginationTypes.js';

/**
 * 用戶資料傳輸物件
 * 
 * 用於在不同層之間傳遞用戶資料的標準化格式
 * 
 * @interface UserDTO
 * @example
 * ```typescript
 * const user: UserDTO = {
 *   id: 1,
 *   username: 'admin',
 *   email: 'admin@example.com',
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 */
export interface UserDTO {
    /** 用戶唯一識別符 */
    id: number;
    
    /** 用戶名稱（登入使用） */
    username: string;
    
    /** 用戶電子郵件地址 */
    email: string;
    
    /** 用戶創建時間 */
    createdAt: Date;
    
    /** 用戶最後更新時間 */
    updatedAt: Date;
}

/**
 * 用戶快取選項介面
 * 
 * 定義用戶查詢時的快取控制選項
 * 與角色的快取選項略有不同，使用 refresh 而非 forceRefresh
 * 
 * @interface UserCacheOptions
 * @example
 * ```typescript
 * const cacheOptions: UserCacheOptions = {
 *   refresh: true
 * };
 * ```
 */
export interface UserCacheOptions {
    /** 是否強制重新整理快取，預設為 false */
    refresh?: boolean;
}

/**
 * 用戶查詢服務介面
 * 
 * 定義用戶查詢相關操作的標準介面
 * 所有用戶查詢服務都應該實現此介面
 * 
 * @interface IUserQueriesService
 * @example
 * ```typescript
 * class UserQueriesService implements IUserQueriesService {
 *   async getUsersPaginated(params: PaginationParams): Promise<PaginatedResult<UserDTO>> {
 *     // 實現邏輯
 *   }
 * }
 * ```
 */
export interface IUserQueriesService {
    /**
     * 獲取所有用戶列表（支持分頁）
     * 
     * @param params - 分頁參數，默認 page=1, pageSize=20
     * @returns Promise<PaginatedResult<UserDTO>> 分頁用戶結果
     * @throws {Error} 當資料庫查詢失敗時
     */
    getAllUsers(params?: PaginationParams): Promise<PaginatedResult<UserDTO>>;
    
    /**
     * 根據用戶 ID 獲取用戶（分頁格式）
     * 
     * @param userId - 用戶 ID
     * @param page - 頁碼，預設為 1
     * @param pageSize - 每頁數量，預設為 1
     * @returns Promise<PaginatedResult<UserDTO>> 分頁用戶結果
     * @throws {Error} 當用戶 ID 無效或資料庫查詢失敗時
     */
    getUserById(userId: number, page?: number, pageSize?: number): Promise<PaginatedResult<UserDTO>>;
    
    /**
     * 根據用戶名稱獲取用戶（分頁格式）
     * 
     * @param username - 用戶名稱
     * @param page - 頁碼，預設為 1
     * @param pageSize - 每頁數量，預設為 1
     * @returns Promise<PaginatedResult<UserDTO>> 分頁用戶結果
     * @throws {Error} 當用戶名稱無效或資料庫查詢失敗時
     */
    getUserByUsername(username: string, page?: number, pageSize?: number): Promise<PaginatedResult<UserDTO>>;
    
    /**
     * 根據電子郵件獲取用戶（分頁格式）
     * 
     * @param email - 電子郵件
     * @param page - 頁碼，預設為 1
     * @param pageSize - 每頁數量，預設為 1
     * @returns Promise<PaginatedResult<UserDTO>> 分頁用戶結果
     * @throws {Error} 當電子郵件無效或資料庫查詢失敗時
     */
    getUserByEmail(email: string, page?: number, pageSize?: number): Promise<PaginatedResult<UserDTO>>;
    
    /**
     * 檢查用戶是否存在
     * 
     * @param username - 用戶名稱
     * @returns Promise<boolean> 用戶是否存在
     * @throws {Error} 當資料庫查詢失敗時
     */
    userExists(username: string): Promise<boolean>;
}