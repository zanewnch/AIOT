/**
 * @fileoverview 會話回應 DTO 定義
 * 
 * 定義會話相關的回應資料傳輸物件
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { BaseResponseDto } from '../common/BaseDto';
import { PaginatedListResponseDto } from '../common/PaginationDto';

/**
 * 會話回應 DTO
 */
export interface SessionResponseDto extends BaseResponseDto {
    /** 會話 ID */
    id: string;
    
    /** 用戶 ID */
    userId: string;
    
    /** 用戶資訊 */
    user?: {
        username: string;
        email: string;
        displayName?: string;
    };
    
    /** 會話令牌（部分顯示） */
    tokenPreview?: string;
    
    /** 用戶代理 */
    userAgent?: string;
    
    /** IP 地址 */
    ipAddress?: string;
    
    /** 最後活動時間 */
    lastActivityAt?: string;
    
    /** 過期時間 */
    expiresAt?: string;
    
    /** 會話狀態 */
    status: string;
    
    /** 是否已過期 */
    isExpired: boolean;
    
    /** 是否為當前會話 */
    isCurrent?: boolean;
}

/**
 * 會話詳細資訊回應 DTO
 */
export interface SessionDetailResponseDto extends SessionResponseDto {
    /** 會話持續時間 */
    duration?: string;
    
    /** 活動歷史 */
    activityHistory?: {
        action: string;
        timestamp: string;
        ipAddress?: string;
        userAgent?: string;
    }[];
    
    /** 安全資訊 */
    securityInfo?: {
        isSecure: boolean;
        loginMethod: string;
        riskLevel: 'low' | 'medium' | 'high';
        warnings: string[];
    };
}

/**
 * 會話統計回應 DTO
 */
export interface SessionStatisticsResponseDto extends BaseResponseDto {
    /** 總會話數 */
    totalSessions: number;
    
    /** 活躍會話數 */
    activeSessions: number;
    
    /** 過期會話數 */
    expiredSessions: number;
    
    /** 已終止會話數 */
    terminatedSessions: number;
    
    /** 用戶統計 */
    userStatistics: {
        totalUsers: number;
        activeUsers: number;
        concurrentUsers: number;
    };
    
    /** 地理分布 */
    geoDistribution?: {
        country: string;
        count: number;
    }[];
    
    /** 設備分布 */
    deviceDistribution?: {
        device: string;
        count: number;
    }[];
}

/**
 * 會話列表回應 DTO
 */
export interface SessionListResponseDto extends PaginatedListResponseDto<SessionResponseDto> {
    /** 統計資訊 */
    statistics?: {
        totalCount: number;
        activeCount: number;
        expiredCount: number;
        terminatedCount: number;
    };
}

/**
 * 會話驗證回應 DTO
 */
export interface SessionValidationResponseDto extends BaseResponseDto {
    /** 驗證結果 */
    isValid: boolean;
    
    /** 會話資訊 */
    session?: SessionResponseDto;
    
    /** 用戶資訊 */
    user?: {
        id: string;
        username: string;
        email: string;
        roles: string[];
        permissions: string[];
    };
    
    /** 驗證失敗原因 */
    failureReason?: string;
}

/**
 * 批量操作回應 DTO
 */
export interface BatchSessionResponseDto extends BaseResponseDto {
    /** 成功處理的會話 ID 列表 */
    successIds: string[];
    
    /** 失敗的會話 ID 列表 */
    failedIds: string[];
    
    /** 失敗原因 */
    errors?: {
        sessionId: string;
        reason: string;
    }[];
    
    /** 處理結果統計 */
    summary: {
        total: number;
        success: number;
        failed: number;
    };
}