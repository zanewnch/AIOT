/**
 * @fileoverview JWT 身分驗證中間件模組
 * 
 * 此模組提供基於 JSON Web Token (JWT) 的身分驗證功能。
 * 支援必需驗證和可選驗證兩種模式，並整合 Redis 會話管理。
 * 
 * 身分驗證流程：
 * 1. 令牌提取：從 Cookie 或 Authorization 標頭提取 JWT 令牌
 * 2. 會話驗證：檢查 Redis 中的會話是否有效
 * 3. 簽章驗證：驗證 JWT 令牌的簽章和過期時間
 * 4. 使用者驗證：確認使用者在資料庫中存在且有效
 * 5. 設定上下文：將使用者資訊添加到 req.user 物件
 * 
 * 安全機制：
 * - 雙重驗證：JWT 簽章 + Redis 會話
 * - 自動清理：無效令牌會自動清除 Redis 會話
 * - 錯誤處理：所有驗證失敗都會記錄並回傳適當錯誤
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

import { Request, Response, NextFunction } from 'express'; // 引入 Express 類型定義
import jwt from 'jsonwebtoken'; // 引入 JWT 令牌處理庫
// Note: For microservice architecture, authentication will be handled by the API Gateway
// This is a simplified version for drone service that validates JWT tokens without database dependencies
// Express 類型擴展已透過 tsconfig.json 自動載入

/**
 * JWT 負載介面，包含使用者識別和令牌元資料
 * 
 * 定義 JWT 令牌解碼後的標準欄位結構。
 * 遵循 JWT 標準規範，使用 'sub' 欄位存儲使用者 ID。
 * 
 * @interface JwtPayload
 * @example
 * ```typescript
 * const payload: JwtPayload = {
 *   sub: 12345,
 *   iat: 1609459200,
 *   exp: 1609545600
 * };
 * ```
 */
export interface JwtPayload {
    /** 從 JWT 令牌中提取的使用者 ID（Subject，JWT 標準欄位） */
    sub: number;
    /** 令牌簽發時間戳（Issued At，JWT 標準欄位，可選） */
    iat?: number;
    /** 令牌過期時間戳（Expiration Time，JWT 標準欄位，可選） */
    exp?: number;
}

/**
 * Express 應用程式的 JWT 驗證中間件
 * 
 * 使用 JSON Web Tokens 提供驗證和授權功能。
 * 支援必需驗證和可選驗證兩種模式，並整合 Redis 會話管理。
 * 
 * 主要特性：
 * - 雙重驗證機制：JWT 簽章驗證 + Redis 會話驗證
 * - 多種令牌來源：支援 Cookie 和 Authorization 標頭
 * - 自動清理：無效令牌會自動清除相關會話
 * - 彈性驗證：提供必需和可選兩種驗證模式
 * 
 * @class AuthMiddleware
 * @example
 * ```typescript
 * const authMiddleware = new AuthMiddleware();
 * 
 * // 必需驗證 - 沒有有效令牌會被拒絕
 * app.use('/api/protected', authMiddleware.authenticate);
 * 
 * // 可選驗證 - 有令牌則驗證，沒有則繼續
 * app.use('/api/public', authMiddleware.optional);
 * 
 * // 使用自訂 UserRepository
 * const customUserRepo = new UserRepository();
 * const authMiddleware = new AuthMiddleware(customUserRepo);
 * ```
 */
class AuthMiddleware {
    /**
     * 建立 AuthMiddleware 實例
     * 
     * 簡化版本的 AuthMiddleware，適用於微服務架構。
     * 只進行 JWT 令牌驗證，不依賴資料庫和會話服務。
     */
    constructor() {
        // 微服務架構中，驗證由 API Gateway 處理
        // 此處僅進行 JWT 令牌格式驗證
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
     * app.get('/api/profile', authMiddleware.authenticate, (req, res) => {
     *   res.json({ user: req.user });
     * });
     * ```
     */
    public authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // 第一步：從請求中提取 JWT 令牌
            const token = this.extractToken(req);

            if (!token) {
                // 沒有提供令牌，回傳 401 未授權
                res.status(401).json({ message: 'Access token required' });
                return; // 中止執行，不調用 next()
            }

            // 第二步：驗證 JWT 簽章和過期時間
            const decoded = this.verifyToken(token);
            if (!decoded) {
                res.status(401).json({ message: 'Invalid or expired token' });
                return; // 中止執行，不調用 next()
            }

            // 第三步：將用戶資訊添加到 request 物件供後續中間件使用
            req.user = {
                id: decoded.sub, // 使用者 ID
                username: `user_${decoded.sub}` // 簡化的使用者名稱
            };

            next(); // 驗證通過，繼續執行下一個中間件
        } catch (error) {
            // 捕獲任何未預期的錯誤
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
     * app.get('/api/posts', authMiddleware.optional, (req, res) => {
     *   const userId = req.user?.id; // 如果未驗證則為 undefined
     *   // 根據驗證狀態顯示公開貼文或個人化貼文
     * });
     * ```
     */
    public optional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // 第一步：從請求中提取 JWT 令牌
            const token = this.extractToken(req);

            if (!token) {
                // 沒有 token 也繼續，但不設置 user
                next(); // 繼續處理請求，但 req.user 為 undefined
                return;
            }

            // 第二步：驗證 JWT 簽章和過期時間
            const decoded = this.verifyToken(token);
            if (!decoded) {
                next(); // 繼續處理請求，但 req.user 為 undefined
                return;
            }

            // 第三步：設置用戶資訊到 request 物件
            req.user = {
                id: decoded.sub, // 使用者 ID
                username: `user_${decoded.sub}` // 簡化的使用者名稱
            };

            next(); // 無論驗證結果如何都繼續執行
        } catch (error) {
            // 捕獲任何未預期的錯誤
            console.error('JWT optional authentication error:', error);
            // 錯誤時也繼續，但不設置 user
            next(); // 繼續處理請求，但 req.user 為 undefined
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
        // 優先級 1：從 cookie 中取得 JWT（通常用於網頁應用程式）
        if (req.cookies && req.cookies.jwt) {
            return req.cookies.jwt; // 回傳 Cookie 中的 JWT 令牌
        }

        // 優先級 2：從 Authorization header 中取得 JWT（通常用於 API 請求）
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7); // 移除 "Bearer " 前綴，回傳純令牌
        }

        return null; // 沒有找到有效的令牌來源
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
            // 從環境變數取得 JWT 密鑰，或使用預設值（僅開發環境）
            const secret = process.env.JWT_SECRET || 'your_jwt_secret_here';
            // 使用密鑰驗證 JWT 令牌的簽章和過期時間
            const decoded = jwt.verify(token, secret) as unknown as JwtPayload;
            return decoded; // 回傳解碼後的令牌負載
        } catch (error) {
            // 捕獲任何驗證錯誤（過期、簽章無效等）
            console.error('Token verification failed:', error);
            return null; // 驗證失敗，回傳 null
        }
    }
}

/**
 * 匯出 AuthMiddleware 類別
 * 
 * @public
 */
export { AuthMiddleware };