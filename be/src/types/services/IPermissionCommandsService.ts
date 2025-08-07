/**
 * @fileoverview 權限命令服務介面定義
 * 
 * 定義權限命令服務的標準介面，遵循 CQRS 模式和依賴倒置原則。
 * 此介面包含所有寫入和狀態修改相關的操作，不包含查詢邏輯。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import type { UserPermissions, CacheOptions, PermissionDTO, CreatePermissionRequest, UpdatePermissionRequest } from './IPermissionService.js';

/**
 * 權限命令服務介面
 * 
 * 定義權限管理和狀態修改的標準操作介面，遵循 CQRS 模式
 * 
 * @interface IPermissionCommandsService
 */
export interface IPermissionCommandsService {
    // ==================== 快取管理方法 ====================
    
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

    // ==================== 權限管理方法 ====================

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