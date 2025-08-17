/**
 * @fileoverview 身份驗證中介軟體類型定義
 * 
 * 此文件定義了身份驗證相關的類型，包含 JWT Payload 和使用者資訊。
 * 用於確保身份驗證和授權功能的類型安全。
 * 
 * @module AuthMiddleware
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

/**
 * JWT Payload 介面
 * 
 * 定義 JWT Token 中包含的使用者資訊格式。
 * 
 * @interface JwtPayload
 * @since 1.0.0
 */
export interface JwtPayload {
    /**
     * 使用者 ID
     */
    userId: number;
    
    /**
     * 使用者名稱
     */
    username: string;
    
    /**
     * 電子郵件地址
     */
    email?: string;
    
    /**
     * 使用者角色陣列
     */
    roles: string[];
    
    /**
     * 權限陣列
     */
    permissions: string[];
    
    /**
     * Token 簽發時間
     */
    iat: number;
    
    /**
     * Token 過期時間
     */
    exp: number;
    
    /**
     * Token 簽發者
     */
    iss?: string;
    
    /**
     * Token 主題
     */
    sub?: string;
}

/**
 * 認證使用者介面
 * 
 * 定義已認證使用者的資訊格式，用於請求物件中。
 * 
 * @interface AuthenticatedUser
 * @since 1.0.0
 */
export interface AuthenticatedUser {
    /**
     * 使用者 ID
     */
    id: number;
    
    /**
     * 使用者名稱
     */
    username: string;
    
    /**
     * 電子郵件地址
     */
    email?: string;
    
    /**
     * 使用者角色
     */
    roles: string[];
    
    /**
     * 使用者權限
     */
    permissions: string[];
}

/**
 * 認證請求介面
 * 
 * 擴展 Express Request 介面，加入已認證的使用者資訊。
 * 
 * @interface AuthenticatedRequest
 * @extends Request
 * @since 1.0.0
 */
export interface AuthenticatedRequest extends Request {
    /**
     * 已認證的使用者資訊
     */
    user?: AuthenticatedUser;
    
    /**
     * JWT Payload 資訊
     */
    jwtPayload?: JwtPayload;
}