/**
 * @fileoverview 身份驗證服務層
 * 
 * 負責處理使用者身份驗證相關功能，包含登入驗證、密碼比對和 JWT Token 產生。
 * 提供安全的使用者認證機制，整合 bcrypt 密碼加密和 JWT 憑證管理。
 * 
 * 主要功能：
 * - 使用者登入驗證
 * - 密碼安全性驗證
 * - JWT Token 產生與管理
 * - 會話管理（Redis 儲存）
 * - 單一裝置登入限制
 * 
 * 安全特性：
 * - 使用 bcrypt 進行密碼雜湊比對
 * - JWT Token 具有過期時間限制
 * - 錯誤訊息統一，避免資訊洩露
 * - 會話狀態由 Redis 管理
 * - 支援自動清理過期會話
 * 
 * 認證流程：
 * 1. 使用者提交用戶名和密碼
 * 2. 查詢使用者資料並驗證密碼
 * 3. 生成 JWT Token
 * 4. 將會話資料存儲到 Redis
 * 5. 回傳認證結果
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-18
 */

// 匯入 bcrypt 加密庫，用於密碼雜湊驗證
import bcrypt from 'bcrypt';
// 匯入 jsonwebtoken 庫，用於 JWT 憑證生成和驗證
import jwt from 'jsonwebtoken';
// 匯入使用者資料存取層，提供使用者資料的查詢功能
import { UserRepository, IUserRepository } from '../repo/UserRepo.js';
// 匯入使用者模型，定義使用者資料結構
import { UserModel } from '../models/rbac/UserModel.js';
// 匯入會話服務，用於管理使用者登入會話狀態
import { SessionService } from './SessionService.js';
// 匯入日誌記錄器
import { createLogger } from '../configs/loggerConfig.js';
// 匯入服務結果類別
import { ServiceResult } from '../utils/ServiceResult.js';

// 創建服務專用的日誌記錄器
const logger = createLogger('AuthService');

/**
 * 登入結果類別
 * 定義登入操作的回應結構，繼承服務結果類別
 */
export class LoginResult extends ServiceResult<{
    token?: string;
    user?: UserModel;
}> {
    /** JWT Token（登入成功時提供） */
    public token?: string;
    /** 使用者資訊（登入成功時提供） */
    public user?: UserModel;

    /**
     * 建構函式
     * 
     * @param success 登入是否成功
     * @param message 操作結果訊息
     * @param token JWT Token（可選）
     * @param user 使用者資訊（可選）
     */
    constructor(success: boolean, message: string, token?: string, user?: UserModel) {
        super(success, message, { token, user });
        this.token = token;
        this.user = user;
    }

    /**
     * 創建登入成功結果
     * 
     * @param message 成功訊息
     * @param token JWT Token
     * @param user 使用者資訊
     * @returns LoginResult 實例
     */
    static loginSuccess(message: string, token: string, user: UserModel): LoginResult {
        return new LoginResult(true, message, token, user);
    }

    /**
     * 創建登入失敗結果
     * 
     * @param message 失敗訊息
     * @returns LoginResult 實例
     */
    static loginFailure(message: string): LoginResult {
        return new LoginResult(false, message);
    }
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
    constructor(userRepository: IUserRepository = new UserRepository()) { // 建構函式，接受可選的使用者資料存取層實例
        this.userRepository = userRepository; // 設定使用者資料存取層，用於查詢使用者資料
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
    async login(username: string, password: string, userAgent?: string, ipAddress?: string): Promise<LoginResult> { // 異步方法：執行完整的使用者登入驗證流程
        try { // 嘗試執行登入驗證流程
            logger.info(`Login attempt for username: ${username} from IP: ${ipAddress}`); // 記錄登入嘗試的資訊日誌
            
            // 查找用戶
            const user = await this.userRepository.findByUsername(username); // 透過使用者名稱從資料庫查詢使用者資料
            if (!user) { // 如果找不到使用者
                logger.warn(`Login failed: User not found for username: ${username}`); // 記錄警告訊息
                return LoginResult.loginFailure('Invalid credentials'); // 回傳登入失敗結果，避免洩露使用者是否存在的資訊
            }

            logger.debug(`User found: ${user.username} (ID: ${user.id})`); // 記錄找到使用者的除錯訊息

            // 驗證密碼
            const match = await bcrypt.compare(password, user.passwordHash); // 使用 bcrypt 比對明文密碼與資料庫中的雜湊密碼
            if (!match) { // 如果密碼不匹配
                logger.warn(`Login failed: Invalid password for user: ${username}`); // 記錄密碼驗證失敗的警告
                return LoginResult.loginFailure('Invalid credentials'); // 回傳與使用者不存在相同的錯誤訊息，避免資訊洩露
            }

            logger.debug(`Password verification successful for user: ${username}`); // 記錄密碼驗證成功的除錯訊息

            // 生成 JWT
            const payload = { // 建立 JWT 載荷物件
                sub: user.id, // 主體（Subject）設為使用者 ID
                username: user.username // 包含使用者名稱
            };
            const token = jwt.sign( // 生成 JWT Token
                payload, // JWT 載荷資料
                process.env.JWT_SECRET || 'zanewnch', // 使用環境變數中的密鑰或預設值
                { expiresIn: '1h' } // 設定 Token 過期時間為 1 小時
            );
            
            logger.debug(`JWT token generated for user: ${username}`); // 記錄 JWT Token 生成成功的除錯訊息

            // 清除該使用者的所有現有會話（實現單一裝置限制）
            // 這個做法是為了讓使用者只能在一個裝置上登入，避免多重登入(同時多個裝置登入同一個帳號的情況)
            try { // 嘗試清除現有會話
                await SessionService.clearAllUserSessions(user.id); // 調用會話服務清除該使用者的所有會話
            } catch (clearError) { // 捕獲清除會話時的錯誤
                logger.error('Failed to clear existing sessions during login:', clearError); // 記錄錯誤但不中斷登入流程
            }

            // 將會話資料存儲到 Redis
            try { // 嘗試儲存新的會話資料
                await SessionService.setUserSession(user.id, user.username, token, { // 調用會話服務儲存會話
                    ttl: 3600, // 1 小時，設定會話過期時間（秒）
                    userAgent, // 儲存使用者代理字串
                    ipAddress // 儲存客戶端 IP 位址
                });
            } catch (sessionError) { // 捕獲會話儲存錯誤
                logger.error('Failed to store session in Redis, continuing with login:', sessionError); // 記錄錯誤訊息
                // 即使 Redis 失敗，仍然返回成功的登入結果
                // 這確保當 Redis 不可用時系統仍能運作
            }

            logger.info(`Login successful for user: ${username} (ID: ${user.id})`); // 記錄登入成功的資訊日誌
            
            return LoginResult.loginSuccess('Login successful', token, user); // 回傳登入成功結果
        } catch (error) { // 捕獲整個登入流程中的任何未預期錯誤
            logger.error('Login error occurred:', error); // 記錄錯誤日誌
            return LoginResult.loginFailure('Login failed'); // 回傳通用的登入失敗結果
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
    async logout(token: string, userId?: number): Promise<boolean> { // 異步方法：執行使用者登出流程
        try { // 嘗試執行登出操作
            logger.info(`Logout initiated for user ID: ${userId}`); // 記錄登出操作開始的資訊日誌
            await SessionService.deleteUserSession(token, userId); // 調用會話服務刪除 Redis 中的會話資料
            logger.info(`Logout successful for user ID: ${userId}`); // 記錄登出成功的資訊日誌
            return true; // 回傳 true 表示登出成功
        } catch (error) { // 捕獲登出過程中的錯誤
            logger.error('Logout error occurred:', error); // 記錄登出錯誤的日誌
            return false; // 回傳 false 表示登出失敗
        }
    }

    /**
     * 驗證會話
     * 檢查 Redis 中的會話狀態並返回使用者資料
     * 
     * @param token JWT Token
     * @returns Promise<UserModel | null> 使用者資料或 null
     */
    async validateSession(token: string): Promise<UserModel | null> { // 異步方法：驗證會話並取得使用者資料
        try { // 嘗試執行會話驗證流程
            logger.debug('Session validation started'); // 記錄會話驗證開始的除錯訊息
            
            // 首先檢查 Redis 會話
            const sessionData = await SessionService.getUserSession(token); // 從 Redis 中取得 Token 對應的會話資料
            if (!sessionData) { // 如果會話資料不存在
                logger.warn('Session validation failed: Session not found in Redis'); // 記錄會話不存在的警告
                return null; // 回傳 null 表示驗證失敗
            }

            logger.debug(`Session found for user ID: ${sessionData.userId}`); // 記錄找到會話資料的除錯訊息

            // 從資料庫取得最新的使用者資料
            const user = await this.userRepository.findById(sessionData.userId); // 根據會話中的使用者 ID 從資料庫查詢使用者資料
            if (!user) { // 如果資料庫中找不到使用者
                logger.warn(`Session validation failed: User not found in database for ID: ${sessionData.userId}`); // 記錄使用者不存在的警告
                return null; // 回傳 null 表示驗證失敗
            }
            
            logger.debug(`Session validation successful for user: ${user.username}`); // 記錄會話驗證成功的除錯訊息
            return user; // 回傳使用者資料物件
        } catch (error) { // 捕獲會話驗證過程中的錯誤
            logger.error('Session validation error occurred:', error); // 記錄會話驗證錯誤的日誌
            return null; // 回傳 null 表示驗證失敗
        }
    }
}