/**
 * @fileoverview 身份驗證服務介面定義
 * 
 * 定義身份驗證相關的服務方法介面，包含登入、登出和會話驗證功能。
 * 提供標準化的認證服務契約，確保實作類別遵循統一的介面規範。
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-27
 */

import { UserModel } from '../../models/rbac/UserModel.js';

/**
 * 登入結果介面
 * 定義登入操作的回傳結果結構
 */
export interface LoginResult {
    /** 登入是否成功 */
    success: boolean;
    /** JWT Token（登入成功時提供） */
    token?: string;
    /** 使用者資料（登入成功時提供） */
    user?: UserModel;
    /** 錯誤或成功訊息 */
    message: string;
}

/**
 * 身份驗證服務介面
 * 定義身份驗證相關的服務方法
 */
export interface IAuthService {
    /**
     * 使用者登入驗證
     * @param username 使用者名稱
     * @param password 使用者密碼
     * @param userAgent 使用者代理字串（可選）
     * @param ipAddress IP 位址（可選）
     * @returns Promise<LoginResult> 登入結果
     */
    login(username: string, password: string, userAgent?: string, ipAddress?: string): Promise<LoginResult>;

    /**
     * 使用者登出
     * @param token JWT Token
     * @param userId 使用者 ID（可選）
     * @returns Promise<boolean> 登出是否成功
     */
    logout(token: string, userId?: number): Promise<boolean>;

    /**
     * 驗證會話
     * @param token JWT Token
     * @returns Promise<UserModel | null> 使用者資料或 null
     */
    validateSession(token: string): Promise<UserModel | null>;
}