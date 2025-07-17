import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repo/UserRepo.js';
import { SessionService } from '../service/SessionService.js';
import '../types/express.js';

/**
 * JWT 負載介面，包含使用者識別和令牌元資料
 * 
 * @interface JwtPayload
 */
export interface JwtPayload {
    /** 從 JWT 令牌中提取的使用者 ID */
    sub: number;
    /** 令牌簽發時間戳（可選） */
    iat?: number;
    /** 令牌過期時間戳（可選） */
    exp?: number;
}

/**
 * Express 應用程式的 JWT 驗證中間件
 * 
 * 使用 JSON Web Tokens 提供驗證和授權功能。
 * 支援必需驗證和可選驗證兩種模式。
 * 
 * @class JwtAuthMiddleware
 * @example
 * ```typescript
 * const jwtAuth = new JwtAuthMiddleware();
 * 
 * // 必需驗證
 * app.use('/api/protected', jwtAuth.authenticate);
 * 
 * // 可選驗證
 * app.use('/api/public', jwtAuth.optional);
 * ```
 */
class JwtAuthMiddleware {
    /** 用於資料庫操作的使用者儲存庫實例 */
    private userRepository: UserRepository;

    /**
     * 建立 JwtAuthMiddleware 實例
     * 
     * @param userRepository - 用於資料庫操作的使用者儲存庫實例
     */
    constructor(userRepository: UserRepository = new UserRepository()) {
        this.userRepository = userRepository;
    }

    /**
     * 必需的 JWT 驗證中間件
     * 
     * 驗證 JWT 令牌並確保使用者存在於資料庫中。
     * 對於沒有有效令牌的請求，回傳 401 狀態碼拒絕存取。
     * 
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     * @param next - Express next 函數
     * @returns Promise<void>
     * 
     * @throws {401} 需要存取令牌 - 當沒有提供令牌時
     * @throws {401} 無效或過期的令牌 - 當令牌驗證失敗時
     * @throws {401} 找不到使用者 - 當使用者不存在於資料庫中時
     * @throws {401} 驗證失敗 - 當發生意外錯誤時
     * 
     * @example
     * ```typescript
     * app.get('/api/profile', jwtAuth.authenticate, (req, res) => {
     *   res.json({ user: req.user });
     * });
     * ```
     */
    public authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const token = this.extractToken(req);

            if (!token) {
                res.status(401).json({ message: 'Access token required' });
                return;
            }

            // 首先檢查 Redis 會話
            const sessionData = await SessionService.getUserSession(token);
            if (!sessionData) {
                res.status(401).json({ message: 'Session expired or invalid' });
                return;
            }

            // 驗證 JWT 簽章
            const decoded = this.verifyToken(token);
            if (!decoded) {
                // JWT 無效，同時清除 Redis 會話
                await SessionService.deleteUserSession(token, sessionData.userId);
                res.status(401).json({ message: 'Invalid or expired token' });
                return;
            }

            // 從資料庫獲取用戶資訊（確保使用者仍然存在且有效）
            const user = await this.userRepository.findById(decoded.sub);
            if (!user) {
                // 使用者不存在，清除會話
                await SessionService.deleteUserSession(token, sessionData.userId);
                res.status(401).json({ message: 'User not found' });
                return;
            }

            // 將用戶資訊添加到 request 物件
            req.user = {
                id: user.id,
                username: user.username
            };

            next();
        } catch (error) {
            console.error('JWT authentication error:', error);
            res.status(401).json({ message: 'Authentication failed' });
        }
    };

    /**
     * 可選的 JWT 驗證中間件
     * 
     * 嘗試驗證 JWT 令牌，但即使令牌遺失或無效也會繼續執行。
     * 僅在找到有效令牌和使用者時設定 req.user。
     * 
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     * @param next - Express next 函數
     * @returns Promise<void>
     * 
     * @example
     * ```typescript
     * app.get('/api/posts', jwtAuth.optional, (req, res) => {
     *   const userId = req.user?.id; // 如果未驗證則為 undefined
     *   // 根據驗證狀態顯示公開貼文或個人化貼文
     * });
     * ```
     */
    public optional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const token = this.extractToken(req);

            if (!token) {
                // 沒有 token 也繼續，但不設置 user
                next();
                return;
            }

            // 檢查 Redis 會話
            const sessionData = await SessionService.getUserSession(token);
            if (!sessionData) {
                // 會話無效也繼續，但不設置 user
                next();
                return;
            }

            const decoded = this.verifyToken(token);
            if (!decoded) {
                // token 無效，清除會話並繼續
                await SessionService.deleteUserSession(token, sessionData.userId);
                next();
                return;
            }

            // 從資料庫獲取用戶資訊
            const user = await this.userRepository.findById(decoded.sub);
            if (user) {
                req.user = {
                    id: user.id,
                    username: user.username
                };
            } else {
                // 使用者不存在，清除會話
                await SessionService.deleteUserSession(token, sessionData.userId);
            }

            next();
        } catch (error) {
            console.error('JWT optional authentication error:', error);
            // 錯誤時也繼續，但不設置 user
            next();
        }
    };

    /**
     * 從請求中提取 JWT 令牌
     * 
     * 優先檢查 Cookie 中的 JWT 令牌，然後回退到 Authorization 標頭。
     * 支援 Authorization 標頭中的 Bearer 令牌格式。
     * 
     * @param req - Express 請求物件
     * @returns JWT 令牌字串，如果找不到則回傳 null
     * 
     * @private
     * @example
     * 優先順序：
     * 1. Cookie: `req.cookies.jwt`
     * 2. Authorization 標頭: `Bearer <token>`
     */
    private extractToken(req: Request): string | null {
        // 1. 從 cookie 中取得 JWT
        if (req.cookies && req.cookies.jwt) {
            return req.cookies.jwt;
        }

        // 2. 從 Authorization header 中取得 JWT
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        return null;
    }

    /**
     * 驗證 JWT 令牌簽章和過期時間
     * 
     * 使用 JWT_SECRET 環境變數或預設密鑰進行驗證。
     * 處理令牌過期和簽章驗證。
     * 
     * @param token - 要驗證的 JWT 令牌字串
     * @returns 解碼的 JWT 負載，如果驗證失敗則回傳 null
     * 
     * @private
     * @example
     * ```typescript
     * const payload = this.verifyToken('eyJhbGciOiJIUzI1NiIs...');
     * if (payload) {
     *   console.log('使用者 ID:', payload.sub);
     * }
     * ```
     */
    private verifyToken(token: string): JwtPayload | null {
        try {
            const secret = process.env.JWT_SECRET || 'your_jwt_secret_here';
            const decoded = jwt.verify(token, secret) as unknown as JwtPayload;
            return decoded;
        } catch (error) {
            console.error('Token verification failed:', error);
            return null;
        }
    }
}

/**
 * 匯出 JwtAuthMiddleware 類別
 * 
 * @public
 */
export { JwtAuthMiddleware };