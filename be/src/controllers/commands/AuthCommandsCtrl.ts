/**
 * @fileoverview 認證命令控制器
 * 
 * 此文件實作了認證命令控制器，
 * 專注於處理所有寫入和操作相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理命令操作，包含登入、登出等寫入邏輯。
 * 
 * @module AuthCommands
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { AuthCommandsSvc } from '../../services/commands/AuthCommandsSvc.js';
import { createLogger, logRequest, logAuthEvent } from '../../configs/loggerConfig.js';
import { ControllerResult } from '../../utils/ControllerResult.js';

const logger = createLogger('AuthCommands');

/**
 * 認證命令控制器類別
 * 
 * 專門處理認證相關的命令請求，包含登入、登出等功能。
 * 所有方法都會修改系統狀態，遵循 CQRS 模式的命令端原則。
 * 
 * @class AuthCommands
 * @since 1.0.0
 */
export class AuthCommands {
    private authCommandsSvc: AuthCommandsSvc;

    constructor() {
        this.authCommandsSvc = new AuthCommandsSvc();
    }

    /**
     * 處理使用者登入請求
     * @route POST /api/auth/login
     */
    public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // 記錄登入請求
            logRequest(req, `Login attempt for user: ${req.body.username}`, 'info');

            // 從請求主體中解構取得登入資料
            const { username, password, rememberMe }: { username: string, password: string, rememberMe?: boolean } = req.body;

            // 參數驗證 - 確保必要欄位存在
            if (!username || !password) {
                logger.warn(`Login request missing required credentials from IP: ${req.ip}`);
                // 回傳 400 錯誤，表示請求參數不完整
                const response = ControllerResult.badRequest('Username and password are required');
                res.status(response.status).json(response.toJSON());
                return;
            }

            // 取得使用者代理字串用於安全審計
            const userAgent = req.get('user-agent');
            // 取得客戶端 IP 位址，優先使用代理伺服器傳遞的真實 IP
            const ipAddress = req.ip || req.socket.remoteAddress;

            logger.info(`Starting login authentication for user: ${username}, IP: ${ipAddress}`);

            // 調用 CQRS 命令服務進行登入驗證（包含 Redis 會話管理）
            const result = await this.authCommandsSvc.login({
                username,
                password,
                userAgent,
                ipAddress
            });

            // 檢查登入結果
            if (!result.success) {
                logger.warn(`Authentication failed for user: ${username}, reason: ${result.message}, IP: ${ipAddress}`);
                logAuthEvent('login', username, false, { reason: result.message, ip: ipAddress });
                // 回傳 401 錯誤，表示認證失敗
                const response = ControllerResult.unauthorized(result.message);
                res.status(response.status).json(response.toJSON());
                return;
            }

            // 根據「記住我」選項設定不同的過期時間
            const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000; // 30天 or 30天（預設改為1個月）

            // 設置 httpOnly cookie 來儲存 JWT，提升安全性
            res.cookie('jwt', result.token, {
                httpOnly: true, // 防止 JavaScript 存取，避免 XSS 攻擊
                secure: process.env.NODE_ENV === 'production', // 只在 HTTPS 時設為 true
                sameSite: 'strict', // 防止 CSRF 攻擊
                maxAge: cookieMaxAge // 設定 cookie 過期時間
            });

            // 設置記住我狀態的 cookie（供前端顯示使用）
            if (rememberMe) {
                res.cookie('remember_me', 'true', {
                    httpOnly: false, // 允許前端讀取來顯示狀態
                    secure: process.env.NODE_ENV === 'production', // 生產環境使用 HTTPS
                    sameSite: 'strict', // 防止 CSRF 攻擊
                    maxAge: cookieMaxAge // 與 JWT cookie 相同的過期時間
                });
            }

            logger.info(`Login authentication successful for user: ${username}, userID: ${result.user?.id}, rememberMe: ${rememberMe || false}`);
            logAuthEvent('login', username, true, {
                userId: result.user?.id,
                rememberMe: rememberMe || false,
                ip: ipAddress,
                userAgent
            });

            // 回傳登入成功的回應
            const response = ControllerResult.success(result.message, {
                token: result.token, // JWT token（也存在 httpOnly cookie 中）
                rememberMe: rememberMe || false, // 記住我狀態
                user: {
                    id: result.user?.id, // 使用者 ID
                    username: result.user?.username // 使用者名稱
                }
            });
            res.status(response.status).json(response.toJSON());
        } catch (err) {
            logger.error('Login error:', err);
            // 將例外處理委派給 Express 錯誤處理中間件
            next(err);
        }
    }

    /**
     * 處理使用者登出請求
     * @route POST /api/auth/logout
     */
    public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            logRequest(req, 'Logout request', 'info');

            // 取得 JWT token，優先從 cookie 取得，其次從 Authorization header 取得
            const token = req.cookies?.jwt || req.headers.authorization?.replace('Bearer ', '');

            const username = req.user?.username || 'unknown';
            logger.info(`Processing logout request for user: ${username}, IP: ${req.ip}`);

            // 如果存在 token，則從 Redis 清除會話
            if (token) {
                logger.debug('Clearing user session from Redis cache');
                // 從 Redis 清除會話資料，確保 token 無法再被使用
                await this.authCommandsSvc.logout({
                    token,
                    userId: req.user?.id
                });
            } else {
                logger.warn(`Logout attempted without valid token for user: ${username}`);
            }

            // 清除 JWT cookie，使用與設定時相同的選項
            res.clearCookie('jwt', {
                httpOnly: true, // 與設定時一致
                secure: process.env.NODE_ENV === 'production', // 生產環境使用 HTTPS
                sameSite: 'strict' // 防止 CSRF 攻擊
            });

            // 清除記住我 cookie
            res.clearCookie('remember_me', {
                httpOnly: false, // 與設定時一致
                secure: process.env.NODE_ENV === 'production', // 生產環境使用 HTTPS
                sameSite: 'strict' // 防止 CSRF 攻擊
            });

            // 清除其他相關 cookie，確保完全登出
            res.clearCookie('user_preferences'); // 清除使用者偏好設定
            res.clearCookie('feature_flags'); // 清除功能開關狀態

            logger.info(`Logout completed successfully for user: ${username}, IP: ${req.ip}`);
            logAuthEvent('logout', username, true, { ip: req.ip });

            // 回傳登出成功的回應
            const response = ControllerResult.success('Logout successful');
            res.status(response.status).json(response.toJSON());
        } catch (err) {
            logger.error('Logout error:', err);
            // 將例外處理委派給 Express 錯誤處理中間件
            next(err);
        }
    }
}