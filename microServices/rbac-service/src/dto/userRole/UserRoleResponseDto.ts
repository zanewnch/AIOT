/**
 * @fileoverview 用戶角色關係回應 DTO 定義
 * 
 * 定義用戶角色關係相關的回應資料傳輸物件
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { BaseResponseDto } from '../common/BaseDto';
import { PaginatedListResponseDto } from '../common/PaginationDto';

/**
 * 用戶角色關係回應 DTO
 */
export interface UserRoleResponseDto extends BaseResponseDto {
    /** 關係 ID */
    id: string;
    
    /** 用戶 ID */
    userId: string;
    
    /** 角色 ID */
    roleId: string;
    
    /** 用戶資訊 */
    user?: {
        username: string;
        email: string;
        displayName?: string;
    };
    
    /** 角色資訊 */
    role?: {
        name: string;
        displayName?: string;
        type?: string;
    };
    
    /** 授權者 ID */
    grantedBy?: string;
    
    /** 授權時間 */
    grantedAt: string;
    
    /** 過期時間 */
    expiresAt?: string;
    
    /** 關係狀態 */
    status: string;
    
    /** 是否已過期 */
    isExpired: boolean;
}

/**
 * 用戶角色關係詳細資訊回應 DTO
 */
export interface UserRoleDetailResponseDto extends UserRoleResponseDto {
    /** 授權者資訊 */
    granter?: {
        username: string;
        email: string;
        displayName?: string;
    };
    
    /** 歷史記錄 */
    history?: {
        action: string;
        performedBy: string;
        performedAt: string;
        reason?: string;
    }[];
}

/**
 * 用戶角色關係統計回應 DTO
 */
export interface UserRoleStatisticsResponseDto extends BaseResponseDto {
    /** 總關係數 */
    totalRelationships: number;
    
    /** 活躍關係數 */
    activeRelationships: number;
    
    /** 過期關係數 */
    expiredRelationships: number;
    
    /** 停用關係數 */
    inactiveRelationships: number;
    
    /** 用戶統計 */
    userStatistics: {
        totalUsers: number;
        usersWithRoles: number;
        usersWithoutRoles: number;
    };
    
    /** 角色統計 */
    roleStatistics: {
        totalRoles: number;
        rolesInUse: number;
        unusedRoles: number;
    };
}

/**
 * 用戶角色關係列表回應 DTO
 */
export interface UserRoleListResponseDto extends PaginatedListResponseDto<UserRoleResponseDto> {
    /** 統計資訊 */
    statistics?: {
        totalCount: number;
        activeCount: number;
        expiredCount: number;
        inactiveCount: number;
    };
}

/**
 * 批量操作回應 DTO
 */
export interface BatchUserRoleResponseDto extends BaseResponseDto {
    /** 成功處理的關係 */
    successRelationships: {
        userId: string;
        roleId: string;
        action: string;
    }[];
    
    /** 失敗的關係 */
    failedRelationships: {
        userId: string;
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