import { Router, Request, Response, NextFunction } from 'express';
import { AuthService, IAuthService } from '../service/AuthService.js';

/**
 * JWT驗證控制器，處理使用者登入和登出功能
 * 
 * 提供基於JWT的使用者身份驗證，包括登入時的JWT發放和登出時的cookie清除。
 * 使用httpOnly cookie來安全地儲存JWT token，提升安全性。
 * 
 * @module Controllers
 * @example
 * ```typescript
 * const authController = new JWTAuthController();
 * app.use('/api/', authController.router);
 * ```
 */
export class JWTAuthController {
  public router: Router;
  private authService: IAuthService;

  /**
   * 初始化JWT驗證控制器實例
   * 
   * 設置驗證服務、路由器和相關路由配置
   * 
   * @param authService - 驗證服務實例，預設使用AuthService
   */
  constructor(authService: IAuthService = new AuthService()) {
    this.authService = authService;
    this.router = Router();
    this.initializeRoutes();
  }

  /**
   * 初始化路由配置
   * 
   * 設置所有驗證相關的路由端點，包括登入和登出路由。
   * 使用bind方法確保方法調用時this指向正確的實例。
   * 
   * @private
   * @returns {void}
   */
  private initializeRoutes = (): void => {
    this.router.post('/api/auth/login', this.login.bind(this));
    this.router.post('/api/auth/logout', this.logout.bind(this));
  }

  /**
   * 處理使用者登入請求
   * 
   * 驗證使用者憑證並發放JWT token。成功登入後會設置httpOnly cookie
   * 來安全地儲存JWT，同時在回應中返回token供前端使用。
   * 
   * @private
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
  private login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, password } = req.body;

      // 參數驗證
      if (!username || !password) {
        res.status(400).json({ message: 'Username and password are required' });
        return;
      }

      // 調用 service 層進行登入
      const result = await this.authService.login(username, password);

      if (!result.success) {
        res.status(401).json({ message: result.message });
        return;
      }

      // 設置 httpOnly cookie 來儲存 JWT
      res.cookie('jwt', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // 只在 HTTPS 時設為 true
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000 // 1 小時 (與 JWT 過期時間一致)
      });

      res.json({
        token: result.token,
        message: result.message
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
   * @private
   * @param {Request} _req - Express請求物件（未使用）
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
  private logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 清除 JWT cookie
      res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.json({ message: 'Logout successful' });
    } catch (err) {
      next(err);
    }
  }
}

