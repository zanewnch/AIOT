import { Router, Request, Response } from 'express';
import { AuthService, IAuthService } from '../service/AuthService.js';

class JWTAuthController {
  public router: Router;
  private authService: IAuthService;

  constructor(authService: IAuthService = new AuthService()) {
    this.authService = authService;
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/login', this.login.bind(this));
    this.router.post('/logout', this.logout.bind(this));
  }

  private async login(req: Request, res: Response): Promise<void> {
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
      console.error('Login controller error:', err);
      res.status(500).json({
        message: 'Internal server error',
        error: (err as Error).message
      });
    }
  }

  private async logout(req: Request, res: Response): Promise<void> {
    try {
      // 清除 JWT cookie
      res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.json({ message: 'Logout successful' });
    } catch (err) {
      console.error('Logout controller error:', err);
      res.status(500).json({
        message: 'Internal server error',
        error: (err as Error).message
      });
    }
  }
}

export default new JWTAuthController();
