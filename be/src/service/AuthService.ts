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
import { SessionService } from './SessionService.js';

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
     * 執行完整的登入流程，包含使用者查詢、密碼驗證、JWT Token 產生和 Redis 會話管理
     * 
     * @param username 使用者名稱
     * @param password 使用者明文密碼
     * @param userAgent 使用者代理字串（可選）
     * @param ipAddress IP 位址（可選）
     * @returns Promise<LoginResult> 包含登入結果、Token 和使用者資訊
     * 
     * @example
     * ```typescript
     * const authService = new AuthService();
     * const result = await authService.login('alice', 'password123', req.get('user-agent'), req.ip);
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
    async login(username: string, password: string, userAgent?: string, ipAddress?: string): Promise<LoginResult> {
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
            const payload = { 
                sub: user.id,
                username: user.username 
            };
            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET || 'zanewnch',
                { expiresIn: '1h' }
            );

            // 將會話資料存儲到 Redis
            try {
                await SessionService.setUserSession(user.id, user.username, token, {
                    ttl: 3600, // 1 小時
                    userAgent,
                    ipAddress
                });
            } catch (sessionError) {
                console.error('Failed to store session in Redis:', sessionError);
                // 即使 Redis 失敗，仍然返回成功的登入結果
                // 這確保當 Redis 不可用時系統仍能運作
            }

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

    /**
     * 使用者登出
     * 清除 Redis 中的會話資料
     * 
     * @param token JWT Token
     * @param userId 使用者 ID（可選，用於清理使用者會話集合）
     * @returns Promise<boolean> 登出是否成功
     */
    async logout(token: string, userId?: number): Promise<boolean> {
        try {
            await SessionService.deleteUserSession(token, userId);
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            return false;
        }
    }

    /**
     * 驗證會話
     * 檢查 Redis 中的會話狀態並返回使用者資料
     * 
     * @param token JWT Token
     * @returns Promise<UserModel | null> 使用者資料或 null
     */
    async validateSession(token: string): Promise<UserModel | null> {
        try {
            // 首先檢查 Redis 會話
            const sessionData = await SessionService.getUserSession(token);
            if (!sessionData) {
                return null;
            }

            // 從資料庫取得最新的使用者資料
            const user = await this.userRepository.findById(sessionData.userId);
            return user;
        } catch (error) {
            console.error('Session validation error:', error);
            return null;
        }
    }
}