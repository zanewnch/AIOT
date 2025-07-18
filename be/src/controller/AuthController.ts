import { Router, Request, Response, NextFunction } from 'express';
import { AuthService, IAuthService } from '../service/AuthService.js';

/**
 * 認證控制器，處理使用者登入和登出功能
 * 
 * 提供基於JWT的使用者身份驗證，包括登入時的JWT發放和登出時的cookie清除。
 * 使用httpOnly cookie來安全地儲存JWT token，提升安全性。
 * 
 * @module Controllers
 * @example
 * ```typescript
 * const authController = new AuthController();
 * app.use('/api/', authController.router);
 * ```
 */
export class AuthController {
  
  private authService: IAuthService;

  /**
   * 初始化認證控制器實例
   * 
   * 設置驗證服務、路由器和相關路由配置
   * 
   * @param authService - 驗證服務實例，預設使用AuthService
   */
  constructor(authService: IAuthService = new AuthService()) {
    this.authService = authService;
    
  }


  /**
   * 處理使用者登入請求
   * 
   * 驗證使用者憑證並發放JWT token。成功登入後會設置httpOnly cookie
   * 來安全地儲存JWT，同時在回應中返回token供前端使用。
   * 
   * @public
   * @param {Request} req - Express請求物件，包含username和password
   * @param {Response} res - Express回應物件
   * @returns {Promise<void>}
   * @throws {Error} 當內部伺服器錯誤發生時拋出錯誤
   * 
   * @example
   * ```bash
   * POST /api/auth/login
   * Content-Type: application/json
   * 
   * {
   *   "username": "admin",
   *   "password": "password123"
   * }
   * ```
   * 
   * 成功回應:
   * ```json
   * {
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "message": "Login successful"
   * }
   * ```
   */
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, password, rememberMe } = req.body;

      // 參數驗證
      if (!username || !password) {
        res.status(400).json({ message: 'Username and password are required' });
        return;
      }

      // 取得使用者代理和 IP 位址
      const userAgent = req.get('user-agent');
      const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

      // 調用 service 層進行登入（包含 Redis 會話管理）
      const result = await this.authService.login(username, password, userAgent, ipAddress);

      if (!result.success) {
        res.status(401).json({ message: result.message });
        return;
      }

      // 根據 rememberMe 設定不同的過期時間
      const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000; // 30天 or 1小時

      // 設置 httpOnly cookie 來儲存 JWT
      res.cookie('jwt', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // 只在 HTTPS 時設為 true
        sameSite: 'strict',
        maxAge: cookieMaxAge
      });

      // 設置記住我狀態的 cookie
      if (rememberMe) {
        res.cookie('remember_me', 'true', {
          httpOnly: false, // 允許前端讀取來顯示狀態
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: cookieMaxAge
        });
      }

      res.json({
        token: result.token,
        message: result.message,
        rememberMe: rememberMe || false,
        user: {
          id: result.user?.id,
          username: result.user?.username
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 處理使用者登出請求
   * 
   * 清除儲存在cookie中的JWT token，完成使用者登出流程。
   * 此操作會移除httpOnly cookie，確保token無法再被使用。
   * 
   * @public
   * @param {Request} req - Express請求物件
   * @param {Response} res - Express回應物件
   * @returns {Promise<void>}
   * @throws {Error} 當內部伺服器錯誤發生時拋出錯誤
   * 
   * @example
   * ```bash
   * POST /api/auth/logout
   * ```
   * 
   * 成功回應:
   * ```json
   * {
   *   "message": "Logout successful"
   * }
   * ```
   */
  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 取得 JWT token
      const token = req.cookies?.jwt || req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        // 從 Redis 清除會話
        await this.authService.logout(token);
      }

      // 清除 JWT cookie
      res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      // 清除記住我 cookie
      res.clearCookie('remember_me', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      // 清除其他相關 cookie
      res.clearCookie('user_preferences');
      res.clearCookie('feature_flags');

      res.json({ message: 'Logout successful' });
    } catch (err) {
      next(err);
    }
  }
}

