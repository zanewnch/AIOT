/**
 * @fileoverview 認證控制器
 * 負責處理使用者身份驗證相關的 HTTP 端點
 * 提供基於 JWT 的登入、登出功能，使用 httpOnly cookie 提升安全性
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 * 
 * @description 安全性特色：
 * - 使用 httpOnly cookie 儲存 JWT token
 * - 支援「記住我」功能
 * - 包含會話管理和 Redis 快取
 * - 實作 CSRF 防護和安全配置
 */

import { Router, Request, Response, NextFunction } from 'express'; // 匯入 Express 的核心型別定義
import { AuthService, IAuthService } from '../service/AuthService.js'; // 匯入認證服務和介面定義

/**
 * 認證控制器
 * 
 * @class AuthController
 * @description 處理使用者身份驗證相關的 API 請求
 * 提供基於 JWT 的使用者身份驗證，包括登入時的 JWT 發放和登出時的 cookie 清除
 * 使用 httpOnly cookie 來安全地儲存 JWT token，提升安全性
 * 
 * @example
 * ```typescript
 * // 使用方式（在路由中）
 * const authController = new AuthController();
 * router.post('/auth/login', authController.login);
 * router.post('/auth/logout', authController.logout);
 * ```
 */
export class AuthController {
  
  /**
   * 認證服務實例
   * 
   * @private
   * @type {IAuthService}
   * @description 負責處理使用者認證相關的業務邏輯
   */
  private authService: IAuthService;

  /**
   * 初始化認證控制器實例
   * 
   * @constructor
   * @param {IAuthService} authService - 驗證服務實例，預設使用 AuthService
   * @description 設置驗證服務、路由器和相關路由配置
   * 支援依賴注入以方便單元測試和模擬
   */
  constructor(authService: IAuthService = new AuthService()) {
    // 設定認證服務實例
    this.authService = authService;
    // 控制器現在只負責業務邏輯，路由設定已移至 authRoutes.ts
  }


  /**
   * 處理使用者登入請求
   * 
   * @method login
   * @param {Request} req - Express 請求物件，包含 username、password 和 rememberMe
   * @param {Response} res - Express 回應物件
   * @param {NextFunction} next - Express next 函數，用於錯誤處理
   * @returns {Promise<void>} 無回傳值的 Promise
   * 
   * @throws {400} 當使用者名稱或密碼缺失時
   * @throws {401} 當認證失敗時
   * @throws {500} 當內部伺服器錯誤發生時
   * 
   * @description 驗證使用者憑證並發放 JWT token
   * 成功登入後會設置 httpOnly cookie 來安全地儲存 JWT
   * 支援「記住我」功能，可延長 cookie 過期時間
   * 包含會話管理和 Redis 快取機制
   * 
   * @security
   * - 使用 httpOnly cookie 防止 XSS 攻擊
   * - 設置 SameSite 和 Secure 屬性防止 CSRF 攻擊
   * - 記錄使用者代理和 IP 位址供安全審計
   * 
   * @example
   * ```bash
   * POST /api/auth/login
   * Content-Type: application/json
   * 
   * {
   *   "username": "admin",
   *   "password": "password123",
   *   "rememberMe": true
   * }
   * ```
   * 
   * @example 成功回應
   * ```json
   * {
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "message": "Login successful",
   *   "rememberMe": true,
   *   "user": {
   *     "id": 1,
   *     "username": "admin"
   *   }
   * }
   * ```
   */
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 從請求主體中解構取得登入資料
      const { username, password, rememberMe } = req.body;

      // 參數驗證 - 確保必要欄位存在
      if (!username || !password) {
        // 回傳 400 錯誤，表示請求參數不完整
        res.status(400).json({ message: 'Username and password are required' });
        return;
      }

      // 取得使用者代理字串用於安全審計
      const userAgent = req.get('user-agent');
      // 取得客戶端 IP 位址，優先使用代理伺服器傳遞的真實 IP
      const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

      // 調用 service 層進行登入驗證（包含 Redis 會話管理）
      const result = await this.authService.login(username, password, userAgent, ipAddress);

      // 檢查登入結果
      if (!result.success) {
        // 回傳 401 錯誤，表示認證失敗
        res.status(401).json({ message: result.message });
        return;
      }

      // 根據「記住我」選項設定不同的過期時間
      const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000; // 30天 or 1小時

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

      // 回傳登入成功的回應
      res.json({
        token: result.token, // JWT token（也存在 httpOnly cookie 中）
        message: result.message, // 登入成功訊息
        rememberMe: rememberMe || false, // 記住我狀態
        user: {
          id: result.user?.id, // 使用者 ID
          username: result.user?.username // 使用者名稱
        }
      });
    } catch (err) {
      // 將例外處理委派給 Express 錯誤處理中間件
      next(err);
    }
  }

  /**
   * 處理使用者登出請求
   * 
   * @method logout
   * @param {Request} req - Express 請求物件
   * @param {Response} res - Express 回應物件
   * @param {NextFunction} next - Express next 函數，用於錯誤處理
   * @returns {Promise<void>} 無回傳值的 Promise
   * 
   * @throws {500} 當內部伺服器錯誤發生時
   * 
   * @description 清除儲存在 cookie 中的 JWT token，完成使用者登出流程
   * 此操作會移除 httpOnly cookie，確保 token 無法再被使用
   * 同時清除 Redis 中的會話資料，確保完全登出
   * 
   * @security
   * - 清除所有相關的 cookie 避免殘留
   * - 從 Redis 移除會話資料防止重複使用
   * - 支援從 cookie 或 Authorization header 取得 token
   * 
   * @example
   * ```bash
   * POST /api/auth/logout
   * ```
   * 
   * @example 成功回應
   * ```json
   * {
   *   "message": "Logout successful"
   * }
   * ```
   */
  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 取得 JWT token，優先從 cookie 取得，其次從 Authorization header 取得
      const token = req.cookies?.jwt || req.headers.authorization?.replace('Bearer ', '');
      
      // 如果存在 token，則從 Redis 清除會話
      if (token) {
        // 從 Redis 清除會話資料，確保 token 無法再被使用
        await this.authService.logout(token);
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

      // 回傳登出成功的回應
      res.json({ message: 'Logout successful' });
    } catch (err) {
      // 將例外處理委派給 Express 錯誤處理中間件
      next(err);
    }
  }
}

