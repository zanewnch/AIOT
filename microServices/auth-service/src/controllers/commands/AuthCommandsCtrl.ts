/**
 * @fileoverview AuthCommandsCtrl 控制器 - 檔案層級意圖說明
 *
 * 目的：此控制器負責處理所有寫入/命令型的認證 API 端點，遵循 CQRS 的命令端模式。
 * - 負責處理使用者登入、登出等會改變系統狀態的操作
 * - 從 HTTP 請求中解析和驗證輸入參數
 * - 委派具體的業務邏輯給 AuthCommandsSvc 服務層
 * - 處理認證相關的 cookie 設定和清理
 * - 整合 JWT 黑名單機制以確保安全性
 * - 提供統一的 ResResult 格式回應
 *
 * 安全考量：
 * - 使用 HttpOnly cookie 儲存敏感的認證 token
 * - 實作 JWT 黑名單機制防止 token 重播攻擊
 * - 詳細記錄所有認證事件以供審計
 *
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'reflect-metadata'; // 支援 TypeScript 裝飾器反射
import {inject, injectable} from 'inversify'; // Inversify DI 裝飾器
import {NextFunction, Request, Response} from 'express'; // Express 型別
import {AuthCommandsSvc} from '../../services/commands/AuthCommandsSvc.js'; // 命令服務介面/實作
import {createLogger, logAuthEvent, logRequest} from '../../configs/loggerConfig.js'; // 日誌與事件記錄函式
import {ResResult} from '../../utils/ResResult'; // 統一 API 回應封裝
import {TYPES} from '../../container/types.js'; // DI container key
import {JwtBlacklistMiddleware} from '../../middleware/JwtBlacklistMiddleware.js'; // JWT 黑名單中間件

const logger = createLogger('AuthCommandsCtrl'); // 建立 module 專屬 logger

/**
 * 認證命令控制器類別 - 處理所有認證相關的命令型操作
 *
 * 此類別是 CQRS 模式中的命令端控制器，專門負責處理會改變系統狀態的認證操作。
 * 主要功能包括使用者登入、登出，以及相關的安全機制管理。
 *
 * **核心職責：**
 * - HTTP 請求解析和參數驗證
 * - 委派業務邏輯給服務層執行
 * - 管理認證 cookie 的生命週期
 * - 整合 JWT 黑名單機制
 * - 記錄安全審計日誌
 *
 * **安全特性：**
 * - HttpOnly cookie 防止 XSS 攻擊
 * - JWT 黑名單機制防止 token 重播
 * - 詳細的認證事件記錄
 * - IP 地址和 User Agent 追蹤
 *
 * @class AuthCommandsCtrl
 * @example
 * ```typescript
 * // 透過 Inversify 容器注入使用
 * const authController = container.get<AuthCommandsCtrl>(TYPES.AuthCommandsCtrl);
 * ```
 *
 * @since 1.0.0
 * @public
 */
@injectable() // 標記可注入
export class AuthCommandsCtrl { // 控制器類別
    /**
     * AuthCommandsCtrl 控制器建構函數
     *
     * 透過 Inversify 依賴注入機制注入所需的服務實例。
     *
     * @param authCommandsSvc - 認證命令服務實例，負責執行具體的認證業務邏輯
     */
    constructor(
        @inject(TYPES.AuthCommandsSvc) private readonly authCommandsSvc: AuthCommandsSvc // 注入命令服務實例，用於執行認證相關的業務邏輯
    ) {
    }

    /**
     * 處理使用者登入請求 - HTTP POST /api/auth/login
     *
     * 此方法負責處理使用者的登入驗證流程，包括參數驗證、身份認證、
     * JWT token 產生和 HttpOnly cookie 設定。
     *
     * **處理流程：**
     * 1. 驗證必要的請求參數（username, password）
     * 2. 收集請求元數據（IP 地址、User Agent）
     * 3. 委派 AuthCommandsSvc 進行身份驗證
     * 4. 設定 HttpOnly cookie 儲存 JWT token
     * 5. 處理 "記住我" 功能的額外 cookie 設定
     * 6. 記錄認證事件用於安全審計
     *
     * **安全特性：**
     * - HttpOnly cookie 防止 XSS 攻擊
     * - 根據生產環境設定 Secure cookie flag
     * - SameSite=strict 防止 CSRF 攻擊
     * - 詳細的登入事件記錄和監控
     *
     * **請求體格式：**
     * ```typescript
     * {
     *   username: string;    // 使用者名稱（必填）
     *   password: string;    // 密碼（必填）
     *   rememberMe?: boolean; // 記住登入狀態（選填，預設 false）
     * }
     * ```
     *
     * **成功回應格式：**
     * ```typescript
     * {
     *   status: 200,
     *   message: "Login successful",
     *   data: {
     *     rememberMe: boolean,
     *     user: {
     *       id: string,
     *       username: string,
     *       roles: string[],
     *       permissions: string[], // 僅回傳前 10 項權限
     *       departmentId?: string,
     *       level?: number
     *     }
     *   }
     * }
     * ```
     *
     * @param req - Express 請求物件，應包含 username 和 password 在 body 中
     * @param res - Express 回應物件，用於設定 cookie 和回傳結果
     * @param next - Express 下一個中介函式，用於錯誤處理
     * @returns Promise<void> 非同步操作完成的 Promise
     *
     * @throws {Error} 當認證服務出現異常時拋出錯誤
     *
     * @example
     * ```typescript
     * // POST /api/auth/login
     * // Content-Type: application/json
     * {
     *   "username": "admin",
     *   "password": "admin123",
     *   "rememberMe": true
     * }
     * ```
     */
    public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // 登入控制器方法
        try {
            logRequest(req, `Login attempt for user: ${req.body.username}`, 'info'); // 記錄請求

            // 解析 body 中的登入欄位（以型別註記讓 TypeDoc 顯示參數結構）
            const {username, password, rememberMe}: { username: string, password: string, rememberMe?: boolean } = req.body;

            if (!username || !password) { // 檢查必要欄位
                logger.warn(`Login request missing required credentials from IP: ${req.ip}`); // 記錄警告
                const response = ResResult.badRequest('Username and password are required'); // 回傳 400
                res.status(response.status).json(response.toJSON()); // 傳回 JSON
                return; // 停止處理
            }

            // 取得請求的 user agent 與 ip（可能由反向 proxy 提供）
            const userAgent = req.get('user-agent'); // 取得 user-agent
            const ipAddress = req.ip || req.socket.remoteAddress; // 取得 IP

            logger.info(`Starting login authentication for user: ${username}, IP: ${ipAddress}`); // info 日誌

            // 呼叫命令服務進行登入流程（包含驗證與 token 產生）
            const result = await this.authCommandsSvc.login({ username, password, userAgent, ipAddress, rememberMe });

            if (!result.success) { // 登入失敗處理
                logger.warn(`Authentication failed for user: ${username}, reason: ${result.message}, IP: ${ipAddress}`); // 記錄失敗
                logAuthEvent('login', username, false, {reason: result.message, ip: ipAddress}); // 寫入認證事件
                const response = ResResult.unauthorized(result.message); // 組成 401
                res.status(response.status).json(response.toJSON()); // 回傳
                return; // 停止
            }

            // 設定 cookie：根據 rememberMe 決定過期時間
            const cookieMaxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000;

            // 設定 HttpOnly 的 auth_token cookie，供後續請求驗證
            res.cookie('auth_token', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: cookieMaxAge, path: '/' });

            // 若使用者選擇記住我，則額外設定一個非 HttpOnly 的 flag cookie 供前端顯示
            if (rememberMe) {
                res.cookie('remember_me', 'true', { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: cookieMaxAge });
            }

            logger.info(`Login authentication successful for user: ${username}, userID: ${result.user?.id}, rememberMe: ${rememberMe || false}`); // 成功日誌
            logAuthEvent('login', username, true, { userId: result.user?.id, rememberMe: rememberMe || false, ip: ipAddress, userAgent }); // 認證事件

            // 回傳成功響應（限制權限清單長度以避免過大 payload）
            const response = ResResult.success(result.message, { rememberMe: rememberMe || false, user: { id: result.user?.id, username: result.user?.username, roles: result.user?.roles, permissions: result.user?.permissions?.slice(0, 10), departmentId: result.user?.departmentId, level: result.user?.level } });
            res.status(response.status).json(response.toJSON());
        } catch (err) { // 錯誤處理
            logger.error('Login error:', err); // 記錄錯誤
            next(err); // 傳遞給 Express 錯誤中間件
        }
    }

    /**
     * 處理使用者登出請求 - HTTP POST /api/auth/logout
     *
     * 此方法負責安全地登出使用者，包括 JWT token 失效、清理 cookie
     * 和記錄安全審計日誌。即使沒有有效的 token 也會執行清理動作。
     *
     * **處理流程：**
     * 1. 從 cookie 或 Authorization header 提取 JWT token
     * 2. 委派 AuthCommandsSvc 執行登出業務邏輯
     * 3. 將 JWT token 加入黑名單防止重用
     * 4. 清理所有相關的 HttpOnly 和一般 cookie
     * 5. 記錄登出事件用於安全審計
     *
     * **安全特性：**
     * - JWT 黑名單機制防止 token 重播攻擊
     * - 完整清理所有認證相關 cookie
     * - 詳細的登出事件記錄
     * - 即使無 token 也執行清理（防止殘留狀態）
     *
     * **成功回應格式：**
     * ```typescript
     * {
     *   status: 200,
     *   message: "Logout successful",
     *   data: null
     * }
     * ```
     *
     * @param req - Express 請求物件，可能包含認證 token 在 cookie 或 header 中
     * @param res - Express 回應物件，用於清理 cookie 和回傳結果
     * @param next - Express 下一個中介函式，用於錯誤處理
     * @returns Promise<void> 非同步操作完成的 Promise
     *
     * @throws {Error} 當登出服務出現異常時拋出錯誤
     *
     * @example
     * ```typescript
     * // POST /api/auth/logout
     * // Cookie: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     * // 或
     * // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     * ```
     */
    public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => { // 登出控制器方法
        try {
            logRequest(req, 'Logout request', 'info'); // 記錄請求

            // 嘗試從 cookie 或 header 取得 token
            const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');

            const username: any = (req as any).user?.username || 'unknown'; // cast to any to avoid strict User type issues
            logger.info(`Processing logout request for user: ${username}, IP: ${req.ip}`);

            if (token) {
                // 有 token 的情況：清理 session 並將 token 加入黑名單
                logger.debug('Processing logout - clearing session and blacklisting token');

                // 呼叫 logout 時僅傳遞 token（示範 LogoutRequest 為簡化版本）
                await this.authCommandsSvc.logout({ token });

                const blacklisted = await JwtBlacklistMiddleware.addCurrentTokenToBlacklist(req, 'logout');

                if (blacklisted) { logger.info(`JWT token successfully added to blacklist for user: ${username}`); } else { logger.warn(`Failed to add JWT token to blacklist for user: ${username}`); }
            } else {
                logger.warn(`Logout attempted without valid token for user: ${username}`);
            }


            // 清理相關 cookie（JWT 與其他應用相關 cookie）
            res.clearCookie('auth_token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' });
            res.clearCookie('remember_me', { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });

            // 清除應用其他可能的 cookie（示範）
            res.clearCookie('user_preferences');
            res.clearCookie('feature_flags');

            logger.info(`Logout completed successfully for user: ${username}, IP: ${req.ip}`); // 完成日誌
            logAuthEvent('logout', username, true, {ip: req.ip}); // 認證事件

            const response = ResResult.success('Logout successful'); // 回傳成功
            res.status(response.status).json(response.toJSON()); // 傳回
        } catch (err) { // 錯誤處理
            logger.error('Logout error:', err); // 記錄錯誤
            next(err); // 傳遞
        }
    }
}