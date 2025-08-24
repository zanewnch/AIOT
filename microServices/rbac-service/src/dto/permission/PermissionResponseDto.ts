/**
 * @fileoverview 權限回應 DTO 定義
 * 
 * 定義權限相關的回應資料傳輸物件
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { BaseResponseDto } from '../common/BaseDto';
import { PaginatedListResponseDto } from '../common/PaginationDto';

/**
 * 權限回應 DTO
 */
export interface PermissionResponseDto extends BaseResponseDto {
    /** 權限 ID */
    id: string;
    
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
    
    /** 權限狀態 */
    status: string;
    
    /** 使用該權限的角色數量 */
    roleCount?: number;
}

/**
 * 權限詳細資訊回應 DTO
 */
export interface PermissionDetailResponseDto extends PermissionResponseDto {
    /** 使用該權限的角色列表 */
    roles?: {
        id: string;
        name: string;
        displayName?: string;
    }[];
    
    /** 權限依賴關係 */
    dependencies?: {
        requiredPermissions: string[];
        dependentPermissions: string[];
    };
}

/**
 * 權限統計回應 DTO
 */
export interface PermissionStatisticsResponseDto extends BaseResponseDto {
    /** 總權限數 */
    totalPermissions: number;
    
    /** 活躍權限數 */
    activePermissions: number;
    
    /** 停用權限數 */
    inactivePermissions: number;
    
    /** 系統權限數 */
    systemPermissions: number;
    
    /** 自定義權限數 */
    customPermissions: number;
    
    /** 權限分布統計（按資源） */
    resourceDistribution?: {
        resource: string;
        count: number;
    }[];
    
    /** 權限分布統計（按操作） */
    actionDistribution?: {
        action: string;
        count: number;
    }[];
}

/**
 * 權限列表回應 DTO
 */
export interface PermissionListResponseDto extends PaginatedListResponseDto<PermissionResponseDto> {
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
export interface BatchPermissionResponseDto extends BaseResponseDto {
    /** 成功處理的權限 ID 列表 */
    successIds: string[];
    
    /** 失敗的權限 ID 列表 */
    failedIds: string[];
    
    /** 失敗原因 */
    errors?: {
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