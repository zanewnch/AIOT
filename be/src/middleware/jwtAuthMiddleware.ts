import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repo/UserRepo.js';

// Note: Request.user is already defined by passport types

export interface JwtPayload {
    sub: number;
    iat?: number;
    exp?: number;
}

class JwtAuthMiddleware {
    private userRepository: UserRepository;

    constructor(userRepository: UserRepository = new UserRepository()) {
        this.userRepository = userRepository;
    }

    // 必須有 JWT token 的 middleware
    public authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const token = this.extractToken(req);

            if (!token) {
                res.status(401).json({ message: 'Access token required' });
                return;
            }

            const decoded = this.verifyToken(token);
            if (!decoded) {
                res.status(401).json({ message: 'Invalid or expired token' });
                return;
            }

            // 從資料庫獲取用戶資訊
            const user = await this.userRepository.findById(decoded.sub);
            if (!user) {
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

    // 可選的 JWT token middleware（不強制要求登入）
    public optional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const token = this.extractToken(req);

            if (!token) {
                // 沒有 token 也繼續，但不設置 user
                next();
                return;
            }

            const decoded = this.verifyToken(token);
            if (!decoded) {
                // token 無效也繼續，但不設置 user
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
            }

            next();
        } catch (error) {
            console.error('JWT optional authentication error:', error);
            // 錯誤時也繼續，但不設置 user
            next();
        }
    };

    // 從 request 中提取 token（優先從 cookie，其次從 Authorization header）
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

    // 驗證 JWT token
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

// 只導出 class
export { JwtAuthMiddleware };