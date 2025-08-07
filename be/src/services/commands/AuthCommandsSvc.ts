/**
 * @fileoverview 身份驗證命令服務實現
 *
 * 此文件實作了身份驗證命令業務邏輯層，
 * 專注於處理所有寫入和操作相關的認證業務操作。
 * 遵循 CQRS 模式，只處理命令操作，包含登入、登出等寫入邏輯。
 *
 * 功能特點：
 * - 使用者登入驗證和會話建立
 * - 使用者登出和會話清理
 * - 密碼安全性驗證
 * - JWT Token 產生與管理
 * - Redis 會話管理
 *
 * 安全特性：
 * - 使用 bcrypt 進行密碼雜湊比對
 * - JWT Token 具有過期時間限制
 * - 錯誤訊息統一，避免資訊洩露
 * - 會話狀態由 Redis 管理
 * - 支援單一裝置登入限制
 *
 * @module AuthCommandsSvc
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserCommandsRepository } from '../../repo/commands/rbac/UserCommandsRepo.js';
import { UserModel } from '../../models/rbac/UserModel.js';
import { SessionCommandsSvc } from './SessionCommandsSvc.js';
import { createLogger } from '../../configs/loggerConfig.js';
import { AuthQueriesSvc } from '../queries/AuthQueriesSvc.js';
import { LoginResult } from '../../types/services/IAuthService.js';

const logger = createLogger('AuthCommandsSvc');

/**
 * 登入請求物件
 */
export interface LoginRequest {
    username: string;
    password: string;
    userAgent?: string;
    ipAddress?: string;
}

/**
 * 登出請求物件
 */
export interface LogoutRequest {
    token: string;
    userId?: number;
}

/**
 * 會話設定選項
 */
export interface SessionOptions {
    ttl?: number;
    userAgent?: string;
    ipAddress?: string;
}

/**
 * 身份驗證命令服務類別
 * 
 * 提供身份驗證的所有命令功能，
 * 包含登入、登出、會話管理和密碼驗證。
 */
@injectable()
export class AuthCommandsSvc {
    private userCommandsRepository: UserCommandsRepository;
    private authQueriesSvc: AuthQueriesSvc;
    private sessionCommandsSvc: SessionCommandsSvc;

    constructor(
        userCommandsRepository: UserCommandsRepository = new UserCommandsRepository(),
        authQueriesSvc: AuthQueriesSvc = new AuthQueriesSvc(),
        sessionCommandsSvc: SessionCommandsSvc = new SessionCommandsSvc()
    ) {
        this.userCommandsRepository = userCommandsRepository;
        this.authQueriesSvc = authQueriesSvc;
        this.sessionCommandsSvc = sessionCommandsSvc;
    }

    /**
     * 生成 JWT Token
     * @param user 使用者模型
     * @private
     */
    private generateJWT(user: UserModel): string {
        const payload = {
            sub: user.id,
            username: user.username
        };
        
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'zanewnch',
            { expiresIn: '30d' }
        );

        return token;
    }

    /**
     * 使用者登入驗證
     * 
     * 執行完整的登入流程，包含使用者查詢、密碼驗證、JWT Token 產生和 Redis 會話管理
     *
     * @param request 登入請求物件
     * @returns Promise<LoginResult> 包含登入結果、Token 和使用者資訊
     *
     * @example
     * ```typescript
     * const authCommandsSvc = new AuthCommandsSvc();
     * const result = await authCommandsSvc.login({
     *   username: 'alice',
     *   password: 'password123',
     *   userAgent: req.get('user-agent'),
     *   ipAddress: req.ip
     * });
     *
     * if (result.success) {
     *   console.log(`登入成功，Token: ${result.token}`);
     *   console.log(`歡迎 ${result.user?.username}`);
     * } else {
     *   console.log(`登入失敗：${result.message}`);
     * }
     * ```
     */
    public async login(request: LoginRequest): Promise<LoginResult> {
        try {
            const { username, password, userAgent, ipAddress } = request;
            logger.info(`Login attempt for username: ${username} from IP: ${ipAddress}`);

            // 驗證輸入
            if (!username || typeof username !== 'string' || username.trim().length === 0) {
                logger.warn('Login failed: Invalid username format');
                return { success: false, message: 'Invalid credentials' };
            }

            if (!password || typeof password !== 'string' || password.length === 0) {
                logger.warn('Login failed: Invalid password format');
                return { success: false, message: 'Invalid credentials' };
            }

            // 查找用戶（使用查詢服務）
            const user = await this.authQueriesSvc.getUserByUsername(username.trim());
            if (!user) {
                logger.warn(`Login failed: User not found for username: ${username}`);
                return { success: false, message: 'Invalid credentials' };
            }

            logger.debug(`User found: ${user.username} (ID: ${user.id})`);

            // 檢查用戶是否處於活躍狀態
            if (!user.isActive) {
                logger.warn(`Login failed: User account is inactive for username: ${username}`);
                return { success: false, message: 'Account is inactive' };
            }

            // 驗證密碼
            const match = await bcrypt.compare(password, user.passwordHash);
            if (!match) {
                logger.warn(`Login failed: Invalid password for user: ${username}`);
                return { success: false, message: 'Invalid credentials' };
            }

            logger.debug(`Password verification successful for user: ${username}`);

            // 生成 JWT
            const token = this.generateJWT(user);
            logger.debug(`JWT token generated for user: ${username}`);

            // 清除該使用者的所有現有會話（實現單一裝置限制）
            try {
                await this.sessionCommandsSvc.clearAllUserSessions(user.id);
            } catch (clearError) {
                logger.error('Failed to clear existing sessions during login:', clearError);
            }

            // 將會話資料存儲到 Redis
            try {
                await this.sessionCommandsSvc.setUserSession({
                    userId: user.id,
                    username: user.username,
                    token,
                    options: {
                        ttl: 30 * 24 * 60 * 60, // 30 天
                        userAgent,
                        ipAddress
                    }
                });
            } catch (sessionError) {
                logger.error('Failed to store session in Redis, continuing with login:', sessionError);
                // 即使 Redis 失敗，仍然返回成功的登入結果
            }

            // 更新使用者最後登入時間
            try {
                await this.userCommandsRepository.updateLastLogin(user.id);
            } catch (updateError) {
                logger.error('Failed to update last login time:', updateError);
                // 不影響登入流程
            }

            logger.info(`Login successful for user: ${username} (ID: ${user.id})`);
            return { success: true, message: 'Login successful', token, user };

        } catch (error) {
            logger.error('Login error occurred:', error);
            return { success: false, message: 'Login failed' };
        }
    }

    /**
     * 使用者登出
     * 
     * 清除 Redis 中的會話資料
     *
     * @param request 登出請求物件
     * @returns Promise<boolean> 登出是否成功
     *
     * @example
     * ```typescript
     * const authCommandsSvc = new AuthCommandsSvc();
     * const success = await authCommandsSvc.logout({
     *   token: jwtToken,
     *   userId: 1
     * });
     *
     * if (success) {
     *   console.log('登出成功');
     * } else {
     *   console.log('登出失敗');
     * }
     * ```
     */
    public async logout(request: LogoutRequest): Promise<boolean> {
        try {
            const { token, userId } = request;
            logger.info(`Logout initiated for user ID: ${userId}`);

            // 驗證輸入
            if (!token || typeof token !== 'string' || token.trim().length === 0) {
                logger.warn('Logout failed: Invalid token format');
                return false;
            }

            // 刪除會話
            await this.sessionCommandsSvc.deleteUserSession({
                token,
                userId
            });
            logger.info(`Logout successful for user ID: ${userId}`);
            return true;

        } catch (error) {
            logger.error('Logout error occurred:', error);
            return false;
        }
    }

    /**
     * 清除使用者的所有會話
     * 
     * 強制登出使用者在所有裝置上的會話
     *
     * @param userId 使用者 ID
     * @returns Promise<boolean> 清除是否成功
     */
    public async clearAllUserSessions(userId: number): Promise<boolean> {
        try {
            logger.info(`Clearing all sessions for user ID: ${userId}`);

            // 驗證輸入
            if (!userId || userId <= 0) {
                logger.warn('Clear sessions failed: Invalid user ID');
                return false;
            }

            // 使用查詢服務驗證使用者是否存在
            const userExists = await this.authQueriesSvc.userExistsById(userId);
            if (!userExists) {
                logger.warn(`Clear sessions failed: User not found for ID: ${userId}`);
                return false;
            }

            // 清除所有會話
            await this.sessionCommandsSvc.clearAllUserSessions(userId);
            logger.info(`All sessions cleared for user ID: ${userId}`);
            return true;

        } catch (error) {
            logger.error(`Error clearing all sessions for user ${userId}:`, error);
            return false;
        }
    }

    /**
     * 強制登出特定會話
     * 
     * 根據 Token 強制登出特定會話
     *
     * @param token JWT Token
     * @returns Promise<boolean> 強制登出是否成功
     */
    public async forceLogout(token: string): Promise<boolean> {
        try {
            logger.info('Force logout initiated');

            // 驗證輸入
            if (!token || typeof token !== 'string' || token.trim().length === 0) {
                logger.warn('Force logout failed: Invalid token format');
                return false;
            }

            // 檢查會話是否存在
            const sessionExists = await this.authQueriesSvc.sessionExists(token);
            if (!sessionExists) {
                logger.warn('Force logout: Session not found');
                return false;
            }

            // 刪除會話
            await this.sessionCommandsSvc.deleteUserSession({ token });
            logger.info('Force logout successful');
            return true;

        } catch (error) {
            logger.error('Force logout error occurred:', error);
            return false;
        }
    }

    /**
     * 重新整理會話
     * 
     * 延長現有會話的有效期限
     *
     * @param token JWT Token
     * @param options 會話選項
     * @returns Promise<boolean> 重新整理是否成功
     */
    public async refreshSession(token: string, options: SessionOptions = {}): Promise<boolean> {
        try {
            logger.debug('Session refresh initiated');

            // 驗證輸入
            if (!token || typeof token !== 'string' || token.trim().length === 0) {
                logger.warn('Session refresh failed: Invalid token format');
                return false;
            }

            // 取得會話資料
            const sessionData = await this.authQueriesSvc.getSessionData(token);
            if (!sessionData) {
                logger.warn('Session refresh failed: Session not found');
                return false;
            }

            // 使用查詢服務驗證使用者是否存在且活躍
            const user = await this.authQueriesSvc.getUserById(sessionData.userId);
            if (!user || !user.isActive) {
                logger.warn(`Session refresh failed: User not found or inactive for ID: ${sessionData.userId}`);
                return false;
            }

            // 重新設定會話（延長有效期限）
            await this.sessionCommandsSvc.setUserSession({
                userId: user.id,
                username: user.username,
                token,
                options: {
                    ttl: options.ttl || 30 * 24 * 60 * 60, // 預設 30 天
                    userAgent: options.userAgent,
                    ipAddress: options.ipAddress
                }
            });

            logger.debug(`Session refreshed for user: ${user.username}`);
            return true;

        } catch (error) {
            logger.error('Session refresh error occurred:', error);
            return false;
        }
    }
}