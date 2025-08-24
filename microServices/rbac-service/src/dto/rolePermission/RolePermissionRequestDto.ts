/**
 * @fileoverview 角色權限關係請求 DTO 定義
 * 
 * 定義角色權限關係相關的請求資料傳輸物件
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { BaseRequestDto } from '../common/BaseDto';

/**
 * 創建角色權限關係請求 DTO
 */
export interface CreateRolePermissionRequestDto extends BaseRequestDto {
    /** 角色 ID */
    roleId: number;
    
    /** 權限 ID */
    permissionId: number;
    
    /** 授權者 ID */
    grantedBy?: number;
    
    /** 授權時間 */
    grantedAt?: string;
}

/**
 * 更新角色權限關係請求 DTO
 */
export interface UpdateRolePermissionRequestDto extends BaseRequestDto {
    /** 關係狀態 */
    status?: string;
}

/**
 * 角色權限關係查詢請求 DTO
 */
export interface RolePermissionQueryRequestDto extends BaseRequestDto {
    /** 角色 ID */
    roleId?: number;
    
    /** 權限 ID */
    permissionId?: number;
    
    /** 授權者 ID */
    grantedBy?: number;
    
    /** 關係狀態 */
    status?: string;
}

/**
 * 批量角色權限關係操作請求 DTO
 */
export interface BatchRolePermissionRequestDto extends BaseRequestDto {
    /** 角色 ID */
    roleId: number;
    
    /** 權限 ID 列表 */
    permissionIds: number[];
    
    /** 操作類型 */
    operation: 'assign' | 'revoke' | 'update';
    
    /** 批量更新數據（當 operation 為 update 時） */
    updateData?: Partial<UpdateRolePermissionRequestDto>;
}

/**
 * 批量權限角色關係操作請求 DTO
 */
export interface BatchPermissionRoleRequestDto extends BaseRequestDto {
    /** 權限 ID */
    permissionId: number;
    
    /** 角色 ID 列表 */
    roleIds: number[];
    
    /** 操作類型 */
    operation: 'assign' | 'revoke' | 'update';
    
    /** 批量更新數據（當 operation 為 update 時） */
    updateData?: Partial<UpdateRolePermissionRequestDto>;
}