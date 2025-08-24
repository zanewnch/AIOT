/**
 * @fileoverview 會話請求 DTO 定義
 * 
 * 定義會話相關的請求資料傳輸物件
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { BaseRequestDto } from '../common/BaseDto';

/**
 * 創建會話請求 DTO
 */
export interface CreateSessionRequestDto extends BaseRequestDto {
    /** 用戶 ID */
    userId: number;
    
    /** 會話令牌 */
    token?: string;
    
    /** 用戶代理 */
    userAgent?: string;
    
    /** IP 地址 */
    ipAddress?: string;
    
    /** 過期時間 */
    expiresAt?: string;
}

/**
 * 更新會話請求 DTO
 */
export interface UpdateSessionRequestDto extends BaseRequestDto {
    /** 最後活動時間 */
    lastActivityAt?: string;
    
    /** 過期時間 */
    expiresAt?: string;
    
    /** 會話狀態 */
    status?: string;
}

/**
 * 會話查詢請求 DTO
 */
export interface SessionQueryRequestDto extends BaseRequestDto {
    /** 會話 ID */
    sessionId?: string;
    
    /** 用戶 ID */
    userId?: number;
    
    /** 會話令牌 */
    token?: string;
    
    /** IP 地址 */
    ipAddress?: string;
    
    /** 會話狀態 */
    status?: string;
    
    /** 是否包含過期會話 */
    includeExpired?: boolean;
}

/**
 * 會話驗證請求 DTO
 */
export interface ValidateSessionRequestDto extends BaseRequestDto {
    /** 會話令牌 */
    token: string;
    
    /** IP 地址 */
    ipAddress?: string;
    
    /** 用戶代理 */
    userAgent?: string;
}

/**
 * 批量會話操作請求 DTO
 */
export interface BatchSessionRequestDto extends BaseRequestDto {
    /** 會話 ID 列表 */
    sessionIds: string[];
    
    /** 操作類型 */
    operation: 'terminate' | 'extend' | 'update';
    
    /** 批量更新數據（當 operation 為 update 時） */
    updateData?: Partial<UpdateSessionRequestDto>;
}