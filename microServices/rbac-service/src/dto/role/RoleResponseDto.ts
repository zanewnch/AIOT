/**
 * @fileoverview 角色回應 DTO 定義
 * 
 * 定義角色相關的回應資料傳輸物件
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { BaseResponseDto } from '../common/BaseDto';
import { PaginatedListResponseDto } from '../common/PaginationDto';

/**
 * 角色回應 DTO
 */
export interface RoleResponseDto extends BaseResponseDto {
    /** 角色 ID */
    id: string;
    
    /** 角色名稱 */
    name: string;
    
    /** 角色顯示名稱 */
    displayName?: string;
    
    /** 角色描述 */
    description?: string;
    
    /** 角色類型 */
    type?: string;
    
    /** 角色狀態 */
    status: string;
    
    /** 角色權限數量 */
    permissionCount?: number;
    
    /** 使用該角色的用戶數量 */
    userCount?: number;
}

/**
 * 角色詳細資訊回應 DTO
 */
export interface RoleDetailResponseDto extends RoleResponseDto {
    /** 角色權限列表 */
    permissions?: string[];
    
    /** 使用該角色的用戶列表 */
    users?: {
        id: string;
        username: string;
        email: string;
    }[];
    
    /** 角色層級關係 */
    hierarchy?: {
        parentRoles: string[];
        childRoles: string[];
    };
}

/**
 * 角色統計回應 DTO
 */
export interface RoleStatisticsResponseDto extends BaseResponseDto {
    /** 總角色數 */
    totalRoles: number;
    
    /** 活躍角色數 */
    activeRoles: number;
    
    /** 停用角色數 */
    inactiveRoles: number;
    
    /** 系統角色數 */
    systemRoles: number;
    
    /** 自定義角色數 */
    customRoles: number;
    
    /** 角色分布統計 */
    distribution?: {
        type: string;
        count: number;
    }[];
}

/**
 * 角色列表回應 DTO
 */
export interface RoleListResponseDto extends PaginatedListResponseDto<RoleResponseDto> {
    /** 統計資訊 */
    statistics?: {
        totalCount: number;
        activeCount: number;
        inactiveCount: number;
    };
}

/**
 * 批量操作回應 DTO
 */
export interface BatchRoleResponseDto extends BaseResponseDto {
    /** 成功處理的角色 ID 列表 */
    successIds: string[];
    
    /** 失敗的角色 ID 列表 */
    failedIds: string[];
    
    /** 失敗原因 */
    errors?: {
        roleId: string;
        reason: string;
    }[];
    
    /** 處理結果統計 */
    summary: {
        total: number;
        success: number;
        failed: number;
    };
}