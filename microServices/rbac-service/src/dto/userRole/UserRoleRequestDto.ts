/**
 * @fileoverview 用戶角色關係請求 DTO 定義
 * 
 * 定義用戶角色關係相關的請求資料傳輸物件
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { BaseRequestDto } from '../common/BaseDto';

/**
 * 創建用戶角色關係請求 DTO
 */
export interface CreateUserRoleRequestDto extends BaseRequestDto {
    /** 用戶 ID */
    userId: number;
    
    /** 角色 ID */
    roleId: number;
    
    /** 授權者 ID */
    grantedBy?: number;
    
    /** 授權時間 */
    grantedAt?: string;
    
    /** 過期時間 */
    expiresAt?: string;
}

/**
 * 更新用戶角色關係請求 DTO
 */
export interface UpdateUserRoleRequestDto extends BaseRequestDto {
    /** 過期時間 */
    expiresAt?: string;
    
    /** 關係狀態 */
    status?: string;
}

/**
 * 用戶角色關係查詢請求 DTO
 */
export interface UserRoleQueryRequestDto extends BaseRequestDto {
    /** 用戶 ID */
    userId?: number;
    
    /** 角色 ID */
    roleId?: number;
    
    /** 授權者 ID */
    grantedBy?: number;
    
    /** 關係狀態 */
    status?: string;
    
    /** 是否包含過期關係 */
    includeExpired?: boolean;
}

/**
 * 批量用戶角色關係操作請求 DTO
 */
export interface BatchUserRoleRequestDto extends BaseRequestDto {
    /** 用戶 ID */
    userId: number;
    
    /** 角色 ID 列表 */
    roleIds: number[];
    
    /** 操作類型 */
    operation: 'assign' | 'revoke' | 'update';
    
    /** 批量更新數據（當 operation 為 update 時） */
    updateData?: Partial<UpdateUserRoleRequestDto>;
}

/**
 * 批量角色用戶關係操作請求 DTO
 */
export interface BatchRoleUserRequestDto extends BaseRequestDto {
    /** 角色 ID */
    roleId: number;
    
    /** 用戶 ID 列表 */
    userIds: number[];
    
    /** 操作類型 */
    operation: 'assign' | 'revoke' | 'update';
    
    /** 批量更新數據（當 operation 為 update 時） */
    updateData?: Partial<UpdateUserRoleRequestDto>;
}