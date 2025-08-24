/**
 * @fileoverview 權限請求 DTO 定義
 * 
 * 定義權限相關的請求資料傳輸物件
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { BaseRequestDto } from '../common/BaseDto';

/**
 * 創建權限請求 DTO
 */
export interface CreatePermissionRequestDto extends BaseRequestDto {
    /** 權限名稱 */
    name: string;
    
    /** 權限顯示名稱 */
    displayName?: string;
    
    /** 權限描述 */
    description?: string;
    
    /** 權限資源 */
    resource: string;
    
    /** 權限操作 */
    action: string;
    
    /** 權限類型 */
    type?: string;
}

/**
 * 更新權限請求 DTO
 */
export interface UpdatePermissionRequestDto extends BaseRequestDto {
    /** 權限顯示名稱 */
    displayName?: string;
    
    /** 權限描述 */
    description?: string;
    
    /** 權限資源 */
    resource?: string;
    
    /** 權限操作 */
    action?: string;
    
    /** 權限類型 */
    type?: string;
}

/**
 * 權限查詢請求 DTO
 */
export interface PermissionQueryRequestDto extends BaseRequestDto {
    /** 權限 ID */
    permissionId?: number;
    
    /** 權限名稱 */
    name?: string;
    
    /** 權限資源 */
    resource?: string;
    
    /** 權限操作 */
    action?: string;
    
    /** 權限類型 */
    type?: string;
    
    /** 搜尋關鍵字 */
    search?: string;
}

/**
 * 權限搜尋請求 DTO
 */
export interface PermissionSearchRequestDto extends BaseRequestDto {
    /** 搜尋關鍵字 */
    keyword: string;
    
    /** 搜尋欄位 */
    fields?: string[];
    
    /** 是否模糊搜尋 */
    fuzzy?: boolean;
}

/**
 * 批量權限操作請求 DTO
 */
export interface BatchPermissionRequestDto extends BaseRequestDto {
    /** 權限 ID 列表 */
    permissionIds: number[];
    
    /** 操作類型 */
    operation: 'activate' | 'deactivate' | 'delete' | 'update';
    
    /** 批量更新數據（當 operation 為 update 時） */
    updateData?: Partial<UpdatePermissionRequestDto>;
}