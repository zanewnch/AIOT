/**
 * @fileoverview 角色權限關係回應 DTO 定義
 * 
 * 定義角色權限關係相關的回應資料傳輸物件
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { BaseResponseDto } from '../common/BaseDto';
import { PaginatedListResponseDto } from '../common/PaginationDto';

/**
 * 角色權限關係回應 DTO
 */
export interface RolePermissionResponseDto extends BaseResponseDto {
    /** 關係 ID */
    id: string;
    
    /** 角色 ID */
    roleId: string;
    
    /** 權限 ID */
    permissionId: string;
    
    /** 角色資訊 */
    role?: {
        name: string;
        displayName?: string;
        type?: string;
    };
    
    /** 權限資訊 */
    permission?: {
        name: string;
        displayName?: string;
        resource: string;
        action: string;
    };
    
    /** 授權者 ID */
    grantedBy?: string;
    
    /** 授權時間 */
    grantedAt: string;
    
    /** 關係狀態 */
    status: string;
}

/**
 * 角色權限關係詳細資訊回應 DTO
 */
export interface RolePermissionDetailResponseDto extends RolePermissionResponseDto {
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
 * 角色權限關係統計回應 DTO
 */
export interface RolePermissionStatisticsResponseDto extends BaseResponseDto {
    /** 總關係數 */
    totalRelationships: number;
    
    /** 活躍關係數 */
    activeRelationships: number;
    
    /** 停用關係數 */
    inactiveRelationships: number;
    
    /** 角色統計 */
    roleStatistics: {
        totalRoles: number;
        rolesWithPermissions: number;
        rolesWithoutPermissions: number;
    };
    
    /** 權限統計 */
    permissionStatistics: {
        totalPermissions: number;
        permissionsInUse: number;
        unusedPermissions: number;
    };
}

/**
 * 角色權限關係列表回應 DTO
 */
export interface RolePermissionListResponseDto extends PaginatedListResponseDto<RolePermissionResponseDto> {
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
export interface BatchRolePermissionResponseDto extends BaseResponseDto {
    /** 成功處理的關係 */
    successRelationships: {
        roleId: string;
        permissionId: string;
        action: string;
    }[];
    
    /** 失敗的關係 */
    failedRelationships: {
        roleId: string;
        permissionId: string;
        reason: string;
    }[];
    
    /** 處理結果統計 */
    summary: {
        total: number;
        success: number;
        failed: number;
    };
}