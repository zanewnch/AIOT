/**
 * @fileoverview 權限查詢服務介面定義
 * 
 * 定義權限查詢服務的標準介面，遵循 CQRS 模式和依賴倒置原則。
 * 此介面包含所有讀取和權限檢查相關的操作，不包含任何寫入邏輯。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { UserPermissions, CacheOptions, PermissionDTO } from './IPermissionService.js';

/**
 * 權限查詢服務介面
 * 
 * 定義權限查詢和檢查的標準操作介面，遵循 CQRS 模式
 * 
 * @interface IPermissionQueriesService
 */
export interface IPermissionQueriesService {
    // ==================== 權限檢查方法 ====================
    
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

    // ==================== 權限管理查詢方法 ====================

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
}