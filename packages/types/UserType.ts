/**
 * @fileoverview 使用者相關類型定義
 *
 * 定義使用者相關的所有類型，供各微服務共享使用。
 *
 * @author AIOT Development Team
 * @version 1.0.0
 * @since 2025-08-08
 */

/**
 * 使用者基本類型
 */
export interface UserType {
    /** 使用者 ID */
    id: number;
    /** 使用者名稱 */
    username: string;
    /** 電子郵件 */
    email: string;
    /** 是否啟用 */
    isActive: boolean;
    /** 最後登入時間 */
    lastLoginAt?: Date;
    /** 建立時間 */
    createdAt: Date;
    /** 更新時間 */
    updatedAt: Date;
}

/**
 * 使用者建立請求類型
 */
export interface CreateUserRequest {
    /** 使用者名稱 */
    username: string;
    /** 電子郵件 */
    email: string;
    /** 密碼 */
    password: string;
    /** 是否啟用 */
    isActive?: boolean;
}

/**
 * 使用者更新請求類型
 */
export interface UpdateUserRequest {
    /** 電子郵件 */
    email?: string;
    /** 是否啟用 */
    isActive?: boolean;
}

/**
 * 使用者會話資訊類型
 */
export interface UserSessionType {
    /** 使用者 ID */
    id: number;
    /** 使用者名稱 */
    username: string;
    /** 電子郵件 */
    email: string;
    /** 是否啟用 */
    isActive: boolean;
    /** 最後登入時間 */
    lastLoginAt?: Date;
}

/**
 * JWT 使用者資訊類型（Express req.user）
 */
export interface JwtUserType {
    /** 使用者 ID */
    id: number;
    /** 使用者名稱 */
    username: string;
}