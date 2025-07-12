/**
 * AuthService - 身份驗證服務層
 * ==============================
 * 負責處理使用者身份驗證相關功能，包含登入驗證、密碼比對和 JWT Token 產生。
 * 提供安全的使用者認證機制，整合 bcrypt 密碼加密和 JWT 憑證管理。
 * 
 * 主要功能：
 * - 使用者登入驗證
 * - 密碼安全性驗證
 * - JWT Token 產生與管理
 * 
 * 安全特性：
 * - 使用 bcrypt 進行密碼雜湊比對
 * - JWT Token 具有過期時間限制
 * - 錯誤訊息統一，避免資訊洩露
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository, IUserRepository } from '../repo/UserRepo.js';
import { UserModel } from '../models/rbac/UserModel.js';

/**
 * 登入結果介面
 * 定義登入操作的回應結構
 */
export interface LoginResult {
    /** 登入是否成功 */
    success: boolean;
    /** JWT Token（登入成功時提供） */
    token?: string;
    /** 操作結果訊息 */
    message: string;
    /** 使用者資訊（登入成功時提供） */
    user?: UserModel;
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
     * @returns Promise<LoginResult> 登入結果
     */
    login(username: string, password: string): Promise<LoginResult>;
}

/**
 * 身份驗證服務實作類別
 * 實作 IAuthService 介面，提供完整的身份驗證功能
 */
export class AuthService implements IAuthService {
    /** 使用者資料存取層 */
    private userRepository: IUserRepository;

    /**
     * 建構函式
     * @param userRepository 使用者資料存取層實例（可選，預設使用 UserRepository）
     */
    constructor(userRepository: IUserRepository = new UserRepository()) {
        this.userRepository = userRepository;
    }

    /**
     * 使用者登入驗證
     * 執行完整的登入流程，包含使用者查詢、密碼驗證和 JWT Token 產生
     * 
     * @param username 使用者名稱
     * @param password 使用者明文密碼
     * @returns Promise<LoginResult> 包含登入結果、Token 和使用者資訊
     * 
     * @example
     * ```typescript
     * const authService = new AuthService();
     * const result = await authService.login('alice', 'password123');
     * 
     * if (result.success) {
     *   console.log(`登入成功，Token: ${result.token}`);
     *   console.log(`歡迎 ${result.user?.username}`);
     * } else {
     *   console.log(`登入失敗：${result.message}`);
     * }
     * ```
     * 
     * @throws 內部錯誤會被捕獲並回傳失敗結果，不會拋出例外
     */
    async login(username: string, password: string): Promise<LoginResult> {
        try {
            // 查找用戶
            const user = await this.userRepository.findByUsername(username);
            if (!user) {
                return {
                    success: false,
                    message: 'Invalid credentials'
                };
            }

            // 驗證密碼
            const match = await bcrypt.compare(password, user.passwordHash);
            if (!match) {
                return {
                    success: false,
                    message: 'Invalid credentials'
                };
            }

            // 生成 JWT
            const payload = { sub: user.id };
            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET || 'your_jwt_secret_here',
                { expiresIn: '1h' }
            );

            return {
                success: true,
                token,
                message: 'Login successful',
                user
            };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Login failed'
            };
        }
    }
}